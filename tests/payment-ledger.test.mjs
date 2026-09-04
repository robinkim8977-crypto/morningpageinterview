import assert from "node:assert/strict";
import test from "node:test";
import {
  createPaymentUsageLedger,
  PaymentLedgerError
} from "../lib/payment-ledger.ts";

class MemoryStore {
  values = new Map();

  async get(key) {
    return this.values.has(key) ? structuredClone(this.values.get(key)) : null;
  }

  async set(key, value, options = {}) {
    if (options.nx && this.values.has(key)) return null;
    if (options.xx && !this.values.has(key)) return null;
    this.values.set(key, structuredClone(value));
    return "OK";
  }

  async compareAndSet(key, expected, value) {
    const current = this.values.get(key);
    if (!current || current.status !== expected.status || current.attemptId !== expected.attemptId) return false;
    this.values.set(key, structuredClone(value));
    return true;
  }
}

function session(answer = "매일 좋아하는 작업의 이유를 한 문장으로 기록합니다.") {
  return {
    schemaVersion: 2,
    questionnaireVersion: "2026-08-15",
    name: "테스트 사용자",
    futureYear: 3,
    answers: [{ questionId: 5, answer }]
  };
}

function ledger(store = new MemoryStore()) {
  let attempt = 0;
  let time = 0;
  return {
    store,
    usage: createPaymentUsageLedger({
      store,
      secret: "a".repeat(64),
      namespace: "test",
      now: () => new Date(Date.UTC(2026, 7, 21, 0, 0, time++)),
      createAttemptId: () => `attempt-${++attempt}`
    })
  };
}

async function expectLedgerError(promise, code) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof PaymentLedgerError);
    assert.equal(error.code, code);
    return true;
  });
}

test("동시 요청은 같은 결제번호를 한 번만 선점한다", async () => {
  const { usage } = ledger();
  const input = { paymentId: "payment-1", productCode: "future-coordinate-report-v1", session: session() };
  const results = await Promise.allSettled([usage.reserve(input), usage.reserve(input)]);

  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  const rejected = results.find((result) => result.status === "rejected");
  assert.ok(rejected);
  assert.ok(rejected.reason instanceof PaymentLedgerError);
  assert.equal(rejected.reason.code, "REPORT_GENERATION_IN_PROGRESS");
});

test("완료된 결제번호는 같은 답변으로 다시 생성할 수 없다", async () => {
  const { usage } = ledger();
  const input = { paymentId: "payment-2", productCode: "future-coordinate-report-v1", session: session() };
  const reservation = await usage.reserve(input);

  assert.equal(await usage.complete(reservation), true);
  await expectLedgerError(usage.reserve(input), "REPORT_ALREADY_GENERATED");
});

test("완료된 결제번호를 다른 답변에 사용할 수 없다", async () => {
  const { usage } = ledger();
  const original = { paymentId: "payment-3", productCode: "future-coordinate-report-v1", session: session() };
  const reservation = await usage.reserve(original);
  await usage.complete(reservation);

  await expectLedgerError(
    usage.reserve({ ...original, session: session("완전히 다른 인터뷰 답변입니다.") }),
    "PAYMENT_ALREADY_USED"
  );
});

test("실패한 요청은 자동 재호출하지 않고 확인 상태로 남긴다", async () => {
  const { usage } = ledger();
  const input = { paymentId: "payment-4", productCode: "future-coordinate-report-v1", session: session() };
  const reservation = await usage.reserve(input);

  assert.equal(await usage.fail(reservation, "OPENAI_HTTP_500"), true);
  await expectLedgerError(usage.reserve(input), "PAYMENT_REVIEW_REQUIRED");
});

test("장부에는 결제번호와 인터뷰 원문을 저장하지 않는다", async () => {
  const { usage, store } = ledger();
  const paymentId = "sensitive-payment-number";
  const interview = session("외부에 저장하지 않을 인터뷰 원문");
  await usage.reserve({ paymentId, productCode: "future-coordinate-report-v1", session: interview });

  const serialized = JSON.stringify([...store.values.entries()]);
  assert.equal(serialized.includes(paymentId), false);
  assert.equal(serialized.includes(interview.name), false);
  assert.equal(serialized.includes(interview.answers[0].answer), false);
});

test("장부 연결 오류 시 비용 보호 오류로 중단한다", async () => {
  const unavailableStore = {
    get: async () => null,
    set: async () => { throw new Error("offline"); },
    compareAndSet: async () => { throw new Error("offline"); }
  };
  const { usage } = ledger(unavailableStore);

  await expectLedgerError(
    usage.reserve({ paymentId: "payment-5", productCode: "future-coordinate-report-v1", session: session() }),
    "PAYMENT_LEDGER_UNAVAILABLE"
  );
});

test("실패 건에 허용한 재시도는 같은 인터뷰에서 한 번만 소비된다", async () => {
  const { usage } = ledger();
  const input = { paymentId: "payment-retry", productCode: "future-coordinate-report-v1", session: session() };
  const first = await usage.reserve(input);
  await usage.fail(first, "OPENAI_HTTP_500", {
    openaiClientRequestId: "client-request-1",
    openaiRequestId: "request-1",
    openaiHttpStatus: 500
  });

  const authorized = await usage.authorizeRetry("payment-retry", "OpenAI 500 오류 확인 후 재시도");
  assert.equal(authorized.status, "retry_allowed");

  const results = await Promise.allSettled([usage.reserve(input), usage.reserve(input)]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  const reservation = results.find((result) => result.status === "fulfilled").value;
  assert.equal(reservation.record.retryCount, 1);
  assert.equal(reservation.record.previousErrorCode, "OPENAI_HTTP_500");
  assert.equal(reservation.record.recoveryEvents.at(-1).action, "retry_started");
});

test("재시도 권한은 다른 인터뷰에 사용할 수 없다", async () => {
  const { usage } = ledger();
  const input = { paymentId: "payment-retry-other", productCode: "future-coordinate-report-v1", session: session() };
  const first = await usage.reserve(input);
  await usage.fail(first, "AI_RESPONSE_FAILED");
  await usage.authorizeRetry("payment-retry-other", "응답 형식 오류 확인 후 재시도");

  await expectLedgerError(
    usage.reserve({ ...input, session: session("다른 인터뷰 답변") }),
    "PAYMENT_ALREADY_USED"
  );
});

test("30분이 지나지 않은 처리 기록은 운영자가 중단할 수 없다", async () => {
  const { usage } = ledger();
  const input = { paymentId: "payment-fresh", productCode: "future-coordinate-report-v1", session: session() };
  await usage.reserve(input);

  await expectLedgerError(
    usage.markStaleProcessingFailed("payment-fresh", "처리 상태 장기 지속 확인", 30 * 60 * 1000),
    "PAYMENT_USAGE_NOT_STALE"
  );
});

test("오래된 처리 기록은 실패 전환 후 재시도를 허용할 수 있다", async () => {
  const { usage } = ledger();
  const input = { paymentId: "payment-stale", productCode: "future-coordinate-report-v1", session: session() };
  await usage.reserve(input);

  const failed = await usage.markStaleProcessingFailed("payment-stale", "서버 중단으로 처리 상태가 남음", 0);
  assert.equal(failed.status, "failed");
  assert.equal(failed.errorCode, "OPERATOR_MARKED_STALE");

  const authorized = await usage.authorizeRetry("payment-stale", "중복 생성 없음 확인 후 재시도");
  assert.equal(authorized.status, "retry_allowed");
  assert.deepEqual(
    authorized.recoveryEvents.map((event) => event.action),
    ["marked_stale_failed", "retry_authorized"]
  );
});

test("완료된 생성 기록에는 재시도를 허용할 수 없다", async () => {
  const { usage } = ledger();
  const input = { paymentId: "payment-completed", productCode: "future-coordinate-report-v1", session: session() };
  const reservation = await usage.reserve(input);
  await usage.complete(reservation);

  await expectLedgerError(
    usage.authorizeRetry("payment-completed", "고객 요청으로 다시 생성"),
    "PAYMENT_RETRY_NOT_ALLOWED"
  );
});
