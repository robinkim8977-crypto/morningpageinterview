import { createHmac, randomUUID } from "node:crypto";
import { Redis } from "@upstash/redis";
import type { InterviewSession } from "@/lib/types";

export type PaymentUsageStatus = "processing" | "completed" | "failed" | "retry_allowed";

export type PaymentRecoveryEvent = {
  action: "marked_stale_failed" | "retry_authorized" | "retry_started";
  at: string;
  reason: string;
};

export type PaymentUsageDiagnostics = {
  openaiClientRequestId?: string;
  openaiRequestId?: string;
  openaiHttpStatus?: number;
};

export type PaymentUsageRecord = {
  version: 1;
  productCode: string;
  interviewFingerprint: string;
  status: PaymentUsageStatus;
  attemptId: string;
  startedAt: string;
  completedAt?: string;
  failedAt?: string;
  errorCode?: string;
  previousErrorCode?: string;
  retryCount?: number;
  recoveryEvents?: PaymentRecoveryEvent[];
  diagnostics?: PaymentUsageDiagnostics;
};

type SetOptions = { nx?: boolean; xx?: boolean };

export type PaymentLedgerStore = {
  get<TData>(key: string): Promise<TData | null>;
  set<TData>(key: string, value: TData, options?: SetOptions): Promise<"OK" | null>;
  compareAndSet<TData>(
    key: string,
    expected: { status: PaymentUsageStatus; attemptId: string },
    value: TData
  ): Promise<boolean>;
};

type LedgerDependencies = {
  store: PaymentLedgerStore;
  secret: string;
  namespace: string;
  now?: () => Date;
  createAttemptId?: () => string;
};

type ReserveInput = {
  paymentId: string;
  productCode: string;
  session: InterviewSession;
};

export type PaymentUsageReservation = {
  key: string;
  record: PaymentUsageRecord;
};

export class PaymentLedgerError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 503) {
    super(message);
    this.name = "PaymentLedgerError";
    this.code = code;
    this.status = status;
  }
}

function normalizeNamespace(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9:_-]/g, "-").slice(0, 48) || "development";
}

function canonicalInterview(session: InterviewSession) {
  return JSON.stringify({
    schemaVersion: session.schemaVersion ?? null,
    questionnaireVersion: session.questionnaireVersion ?? null,
    name: session.name.trim(),
    futureYear: session.futureYear,
    answers: [...session.answers]
      .map((answer) => ({
        questionId: answer.questionId,
        answer: answer.answer.replace(/\r\n/g, "\n").trim()
      }))
      .sort((left, right) => left.questionId - right.questionId)
  });
}

function isPaymentUsageRecord(value: unknown): value is PaymentUsageRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<PaymentUsageRecord>;
  return record.version === 1
    && typeof record.productCode === "string"
    && typeof record.interviewFingerprint === "string"
    && (record.status === "processing" || record.status === "completed" || record.status === "failed" || record.status === "retry_allowed")
    && typeof record.attemptId === "string"
    && typeof record.startedAt === "string";
}

function conflictFor(record: PaymentUsageRecord, fingerprint: string): PaymentLedgerError {
  if (record.interviewFingerprint !== fingerprint) {
    return new PaymentLedgerError(
      "PAYMENT_ALREADY_USED",
      "이 결제는 다른 인터뷰의 미래좌표 생성에 이미 사용되었습니다.",
      409
    );
  }

  if (record.status === "processing") {
    return new PaymentLedgerError(
      "REPORT_GENERATION_IN_PROGRESS",
      "이 결제의 미래좌표를 이미 생성하고 있습니다. 잠시 후 현재 브라우저에서 결과를 확인해 주세요.",
      409
    );
  }

  if (record.status === "completed") {
    return new PaymentLedgerError(
      "REPORT_ALREADY_GENERATED",
      "이 결제로 미래좌표가 이미 생성되었습니다. 결과는 생성에 사용한 브라우저에서 확인해 주세요.",
      409
    );
  }

  if (record.status === "retry_allowed") {
    return new PaymentLedgerError(
      "PAYMENT_RETRY_STATE_CHANGED",
      "재시도 권한을 다른 요청이 먼저 사용했습니다. 현재 상태를 다시 확인해 주세요.",
      409
    );
  }

  return new PaymentLedgerError(
    "PAYMENT_REVIEW_REQUIRED",
    "분석 요청 기록을 확인해야 합니다. 자동으로 다시 호출하지 않고 있으니 고객센터로 문의해 주세요.",
    409
  );
}

export function createPaymentUsageLedger({
  store,
  secret,
  namespace,
  now = () => new Date(),
  createAttemptId = randomUUID
}: LedgerDependencies) {
  const safeNamespace = normalizeNamespace(namespace);
  const digest = (purpose: string, value: string) => createHmac("sha256", secret)
    .update(`${purpose}\0${value}`, "utf8")
    .digest("hex");
  const keyFor = (paymentId: string) => `${safeNamespace}:future-coordinate:usage:v1:${digest("payment", paymentId)}`;
  const appendRecoveryEvent = (record: PaymentUsageRecord, event: PaymentRecoveryEvent) => [
    ...(record.recoveryEvents ?? []),
    event
  ].slice(-10);

  async function read(paymentId: string) {
    try {
      const record = await store.get<PaymentUsageRecord>(keyFor(paymentId));
      if (record === null) return null;
      if (!isPaymentUsageRecord(record)) {
        throw new PaymentLedgerError(
          "PAYMENT_LEDGER_INVALID_RECORD",
          "결제 사용 기록의 형식을 확인해야 합니다."
        );
      }
      return record;
    } catch (error) {
      if (error instanceof PaymentLedgerError) throw error;
      console.error("Payment usage lookup failed", error);
      throw new PaymentLedgerError(
        "PAYMENT_LEDGER_UNAVAILABLE",
        "결제 사용 기록을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
      );
    }
  }

  async function reserve(input: ReserveInput): Promise<PaymentUsageReservation> {
    const key = keyFor(input.paymentId);
    const fingerprint = digest("interview", canonicalInterview(input.session));
    const record: PaymentUsageRecord = {
      version: 1,
      productCode: input.productCode,
      interviewFingerprint: fingerprint,
      status: "processing",
      attemptId: createAttemptId(),
      startedAt: now().toISOString()
    };

    let created: "OK" | null;
    try {
      created = await store.set(key, record, { nx: true });
    } catch (error) {
      console.error("Payment usage reservation failed", error);
      throw new PaymentLedgerError(
        "PAYMENT_LEDGER_UNAVAILABLE",
        "결제 사용 기록을 확인하지 못했습니다. 비용 보호를 위해 AI 분석을 시작하지 않았습니다. 잠시 후 다시 시도해 주세요."
      );
    }

    if (created === "OK") return { key, record };

    let existing: PaymentUsageRecord | null;
    try {
      existing = await store.get<PaymentUsageRecord>(key);
    } catch (error) {
      console.error("Payment usage lookup failed", error);
      throw new PaymentLedgerError(
        "PAYMENT_LEDGER_UNAVAILABLE",
        "결제 사용 기록을 확인하지 못했습니다. 비용 보호를 위해 AI 분석을 시작하지 않았습니다. 잠시 후 다시 시도해 주세요."
      );
    }

    if (!isPaymentUsageRecord(existing)) {
      throw new PaymentLedgerError(
        "PAYMENT_LEDGER_UNAVAILABLE",
        "결제 사용 기록이 올바르지 않아 AI 분석을 시작하지 않았습니다. 고객센터로 문의해 주세요."
      );
    }

    if (existing.status === "retry_allowed" && existing.interviewFingerprint === fingerprint) {
      const retryRecord: PaymentUsageRecord = {
        ...existing,
        status: "processing",
        attemptId: createAttemptId(),
        startedAt: now().toISOString(),
        previousErrorCode: existing.errorCode || existing.previousErrorCode,
        retryCount: (existing.retryCount ?? 0) + 1,
        recoveryEvents: appendRecoveryEvent(existing, {
          action: "retry_started",
          at: now().toISOString(),
          reason: "authorized retry consumed"
        }),
        diagnostics: undefined,
        completedAt: undefined,
        failedAt: undefined,
        errorCode: undefined
      };
      const claimed = await store.compareAndSet(
        key,
        { status: existing.status, attemptId: existing.attemptId },
        retryRecord
      );
      if (claimed) return { key, record: retryRecord };

      const latest = await read(input.paymentId);
      if (!latest) {
        throw new PaymentLedgerError(
          "PAYMENT_LEDGER_UNAVAILABLE",
          "재시도 권한 사용 중 결제 기록을 확인하지 못했습니다."
        );
      }
      throw conflictFor(latest, fingerprint);
    }

    throw conflictFor(existing, fingerprint);
  }

  async function update(
    reservation: PaymentUsageReservation,
    status: "completed" | "failed",
    errorCode?: string,
    diagnostics?: PaymentUsageDiagnostics
  ) {
    const current = await store.get<PaymentUsageRecord>(reservation.key);
    if (!isPaymentUsageRecord(current)
      || current.status !== "processing"
      || current.attemptId !== reservation.record.attemptId) {
      return false;
    }

    const timestamp = now().toISOString();
    const next: PaymentUsageRecord = status === "completed"
      ? { ...current, status, completedAt: timestamp, diagnostics }
      : { ...current, status, failedAt: timestamp, errorCode: errorCode || "UNKNOWN_FAILURE", diagnostics };

    return store.compareAndSet(
      reservation.key,
      { status: current.status, attemptId: current.attemptId },
      next
    );
  }

  async function markStaleProcessingFailed(paymentId: string, reason: string, minimumAgeMs: number) {
    const current = await read(paymentId);
    if (!current) {
      throw new PaymentLedgerError("PAYMENT_USAGE_NOT_FOUND", "이 결제번호의 생성 기록이 없습니다.", 404);
    }
    if (current.status !== "processing") {
      throw new PaymentLedgerError("PAYMENT_USAGE_NOT_PROCESSING", "현재 처리 중인 기록만 실패 상태로 변경할 수 있습니다.", 409);
    }

    const startedAt = Date.parse(current.startedAt);
    const ageMs = Number.isFinite(startedAt) ? now().getTime() - startedAt : -1;
    if (ageMs < minimumAgeMs) {
      throw new PaymentLedgerError(
        "PAYMENT_USAGE_NOT_STALE",
        `생성 시작 후 ${Math.ceil(minimumAgeMs / 60000)}분이 지난 기록만 중단 처리할 수 있습니다.`,
        409
      );
    }

    const timestamp = now().toISOString();
    const next: PaymentUsageRecord = {
      ...current,
      status: "failed",
      failedAt: timestamp,
      errorCode: "OPERATOR_MARKED_STALE",
      recoveryEvents: appendRecoveryEvent(current, {
        action: "marked_stale_failed",
        at: timestamp,
        reason
      })
    };
    const updated = await store.compareAndSet(
      keyFor(paymentId),
      { status: current.status, attemptId: current.attemptId },
      next
    );
    if (!updated) {
      throw new PaymentLedgerError("PAYMENT_USAGE_STATE_CHANGED", "처리 상태가 변경되었습니다. 다시 조회해 주세요.", 409);
    }
    return next;
  }

  async function authorizeRetry(paymentId: string, reason: string) {
    const current = await read(paymentId);
    if (!current) {
      throw new PaymentLedgerError("PAYMENT_USAGE_NOT_FOUND", "이 결제번호의 생성 기록이 없습니다.", 404);
    }
    if (current.status !== "failed") {
      throw new PaymentLedgerError("PAYMENT_RETRY_NOT_ALLOWED", "실패 상태의 기록에만 재시도를 허용할 수 있습니다.", 409);
    }

    const timestamp = now().toISOString();
    const next: PaymentUsageRecord = {
      ...current,
      status: "retry_allowed",
      recoveryEvents: appendRecoveryEvent(current, {
        action: "retry_authorized",
        at: timestamp,
        reason
      })
    };
    const updated = await store.compareAndSet(
      keyFor(paymentId),
      { status: current.status, attemptId: current.attemptId },
      next
    );
    if (!updated) {
      throw new PaymentLedgerError("PAYMENT_USAGE_STATE_CHANGED", "처리 상태가 변경되었습니다. 다시 조회해 주세요.", 409);
    }
    return next;
  }

  return {
    reserve,
    inspect: read,
    markStaleProcessingFailed,
    authorizeRetry,
    complete: (reservation: PaymentUsageReservation, diagnostics?: PaymentUsageDiagnostics) => update(reservation, "completed", undefined, diagnostics),
    fail: (reservation: PaymentUsageReservation, errorCode: string, diagnostics?: PaymentUsageDiagnostics) => update(reservation, "failed", errorCode, diagnostics)
  };
}

let redisStore: PaymentLedgerStore | null = null;

const COMPARE_AND_SET_SCRIPT = `
local raw = redis.call("GET", KEYS[1])
if not raw then return 0 end
local ok, current = pcall(cjson.decode, raw)
if not ok then return 0 end
if current.status ~= ARGV[1] or current.attemptId ~= ARGV[2] then return 0 end
redis.call("SET", KEYS[1], ARGV[3])
return 1
`;

function configuredRedisStore() {
  if (redisStore) return redisStore;

  const url = process.env.KV_REST_API_URL?.trim() || process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim() || process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    throw new PaymentLedgerError(
      "PAYMENT_LEDGER_NOT_CONFIGURED",
      "결제 사용 기록 저장소가 아직 연결되지 않았습니다."
    );
  }

  const redis = new Redis({ url, token });
  redisStore = {
    get: <TData>(key: string) => redis.get<TData>(key),
    set: async <TData>(key: string, value: TData, options?: SetOptions) => {
      const result = options?.nx
        ? await redis.set(key, value, { nx: true })
        : options?.xx
          ? await redis.set(key, value, { xx: true })
          : await redis.set(key, value);
      return result as "OK" | null;
    },
    compareAndSet: async <TData>(
      key: string,
      expected: { status: PaymentUsageStatus; attemptId: string },
      value: TData
    ) => {
      const result = await redis.eval<string[], number>(
        COMPARE_AND_SET_SCRIPT,
        [key],
        [expected.status, expected.attemptId, JSON.stringify(value)]
      );
      return result === 1;
    }
  };
  return redisStore;
}

export function configuredPaymentUsageLedger() {
  const secret = process.env.PAYMENT_USAGE_HMAC_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new PaymentLedgerError(
      "PAYMENT_LEDGER_NOT_CONFIGURED",
      "결제 사용 기록 보안키가 아직 설정되지 않았습니다."
    );
  }

  const namespace = process.env.PAYMENT_LEDGER_NAMESPACE?.trim()
    || process.env.VERCEL_ENV?.trim()
    || process.env.NODE_ENV
    || "development";

  return createPaymentUsageLedger({
    store: configuredRedisStore(),
    secret,
    namespace
  });
}
