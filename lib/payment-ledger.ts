import { createHmac, randomUUID } from "node:crypto";
import { Redis } from "@upstash/redis";
import type { InterviewSession } from "@/lib/types";

export type PaymentUsageStatus = "processing" | "completed" | "failed";

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
};

type SetOptions = { nx?: boolean; xx?: boolean };

export type PaymentLedgerStore = {
  get<TData>(key: string): Promise<TData | null>;
  set<TData>(key: string, value: TData, options?: SetOptions): Promise<"OK" | null>;
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
    && (record.status === "processing" || record.status === "completed" || record.status === "failed")
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

    throw conflictFor(existing, fingerprint);
  }

  async function update(
    reservation: PaymentUsageReservation,
    status: "completed" | "failed",
    errorCode?: string
  ) {
    const current = await store.get<PaymentUsageRecord>(reservation.key);
    if (!isPaymentUsageRecord(current)
      || current.status !== "processing"
      || current.attemptId !== reservation.record.attemptId) {
      return false;
    }

    const timestamp = now().toISOString();
    const next: PaymentUsageRecord = status === "completed"
      ? { ...current, status, completedAt: timestamp }
      : { ...current, status, failedAt: timestamp, errorCode: errorCode || "UNKNOWN_FAILURE" };

    return (await store.set(reservation.key, next, { xx: true })) === "OK";
  }

  return {
    reserve,
    complete: (reservation: PaymentUsageReservation) => update(reservation, "completed"),
    fail: (reservation: PaymentUsageReservation, errorCode: string) => update(reservation, "failed", errorCode)
  };
}

let redisStore: PaymentLedgerStore | null = null;

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

  redisStore = new Redis({ url, token }) as unknown as PaymentLedgerStore;
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
