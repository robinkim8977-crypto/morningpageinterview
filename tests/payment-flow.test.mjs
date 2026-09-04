import assert from "node:assert/strict";
import test from "node:test";

const originalFetch = globalThis.fetch;

const state = {
  redis: new Map(),
  redisAvailable: true,
  paymentMode: "paid",
  openaiModes: [],
  portoneCalls: 0,
  openaiCalls: 0,
  redisCalls: 0
};

const analysis = {
  scenes: [
    {
      id: "scene-1",
      role: "life",
      title: "집중과 관계가 공존하는 하루",
      sourceQuestionIds: [1],
      scene: ["좋아하는 일에 집중합니다.", "소중한 관계와 회복할 시간을 지킵니다."],
      meaning: "지속 가능한 리듬을 중요하게 생각합니다.",
      values: ["집중", "관계", "건강"],
      currentClue: "이미 시간과 에너지의 쓰임을 관찰하고 있습니다.",
      insight: "삶을 지키는 방식이 오래가는 성취의 기반입니다."
    },
    {
      id: "scene-2",
      role: "turning-point",
      title: "나의 방식이 선택받은 순간",
      sourceQuestionIds: [5],
      scene: ["작은 습관이 결과로 이어집니다.", "자신의 기준을 믿게 됩니다."],
      meaning: "반복한 행동이 확신의 근거가 됩니다.",
      values: ["습관", "기준", "확신"],
      currentClue: "매일 한 문장을 기록하고 있습니다.",
      insight: "작은 반복이 미래의 전환점을 만듭니다."
    },
    {
      id: "scene-3",
      role: "expansion",
      title: "경험을 다른 사람과 나누는 장면",
      sourceQuestionIds: [10],
      scene: ["경험을 새로운 방식으로 정리합니다.", "다른 사람의 시작을 돕습니다."],
      meaning: "개인의 경험이 타인의 가능성으로 확장됩니다.",
      values: ["확장", "기여", "연결"],
      currentClue: "이미 경험을 나누고 싶은 마음이 있습니다.",
      insight: "다음 성장은 먼저 발견한 길을 나누는 일입니다."
    }
  ],
  direction: {
    title: "나의 기준을 발견하고 세상과 나누는 삶",
    summary: "관찰과 반복이 자기 확신을 거쳐 기여로 이어집니다.",
    steps: ["기준 발견", "작은 반복", "경험 확장"]
  },
  roadmap: [
    { days: 30, stage: "NOTICE", goal: "기준 발견", description: "현재의 선택을 관찰합니다.", actions: ["매일 한 문장 기록하기"], result: "나의 기준 세 가지" },
    { days: 90, stage: "EXPERIMENT", goal: "방식 실험", description: "발견한 기준을 생활에서 시험합니다.", actions: ["기준 하나를 3주간 적용하기"], result: "나에게 맞는 방식" },
    { days: 365, stage: "BUILD", goal: "삶에 축적", description: "효과가 있었던 방식을 반복합니다.", actions: ["계절마다 선택을 돌아보기"], result: "지속 가능한 생활 원칙" }
  ],
  firstAction: {
    action: "오늘 좋아했던 일 한 가지의 이유를 적기",
    duration: "5분",
    reason: "인터뷰에서 말한 기록 습관을 바로 시작할 수 있습니다.",
    sourceQuestionIds: [5]
  }
};

function resetState() {
  state.redis.clear();
  state.redisAvailable = true;
  state.paymentMode = "paid";
  state.openaiModes = ["success"];
  state.portoneCalls = 0;
  state.openaiCalls = 0;
  state.redisCalls = 0;
}

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  });
}

async function requestBody(input, init) {
  if (typeof init?.body === "string") return JSON.parse(init.body);
  if (input instanceof Request) return JSON.parse(await input.clone().text());
  return null;
}

function executeRedisCommand(command) {
  const operation = String(command?.[0] || "").toLowerCase();

  if (operation === "get") {
    return { result: state.redis.get(command[1]) ?? null };
  }

  if (operation === "set") {
    const key = command[1];
    const value = command[2];
    const flags = command.slice(3).map((item) => String(item).toLowerCase());
    if (flags.includes("nx") && state.redis.has(key)) return { result: null };
    if (flags.includes("xx") && !state.redis.has(key)) return { result: null };
    state.redis.set(key, value);
    return { result: "OK" };
  }

  if (operation === "eval") {
    const key = command[3];
    const expectedStatus = command[4];
    const expectedAttemptId = command[5];
    const nextValue = command[6];
    const raw = state.redis.get(key);
    if (!raw) return { result: 0 };
    const current = JSON.parse(raw);
    if (current.status !== expectedStatus || current.attemptId !== expectedAttemptId) {
      return { result: 0 };
    }
    state.redis.set(key, nextValue);
    return { result: 1 };
  }

  return { error: `unsupported redis command: ${operation}` };
}

async function mockFetch(input, init) {
  const url = new URL(typeof input === "string" || input instanceof URL ? input.toString() : input.url);

  if (url.hostname === "mock.portone.test") {
    state.portoneCalls += 1;
    if (state.paymentMode === "lookup_error") return jsonResponse({ message: "offline" }, 503);
    const paymentId = decodeURIComponent(url.pathname.split("/").at(-1));
    return jsonResponse({
      id: paymentId,
      storeId: "store-test",
      status: state.paymentMode === "not_paid" ? "FAILED" : "PAID",
      orderName: "미래좌표 리포트",
      amount: { total: state.paymentMode === "amount_mismatch" ? 100 : 2900 },
      customData: { productCode: "future-coordinate-report-v1" }
    });
  }

  if (url.hostname === "mock.openai.test") {
    state.openaiCalls += 1;
    const mode = state.openaiModes.shift() || "success";
    if (mode === "failure") {
      return jsonResponse(
        { error: { code: "server_error", message: "temporary failure" } },
        500,
        { "x-request-id": `openai-request-${state.openaiCalls}` }
      );
    }
    if (mode === "invalid") {
      return jsonResponse(
        { output_text: "{}", usage: { input_tokens: 10, output_tokens: 2, total_tokens: 12 } },
        200,
        { "x-request-id": `openai-request-${state.openaiCalls}` }
      );
    }
    return jsonResponse(
      {
        output_text: JSON.stringify(analysis),
        usage: { input_tokens: 120, output_tokens: 240, total_tokens: 360 }
      },
      200,
      { "x-request-id": `openai-request-${state.openaiCalls}` }
    );
  }

  if (url.hostname === "mock.redis.test") {
    state.redisCalls += 1;
    if (!state.redisAvailable) return jsonResponse({ error: "redis offline" }, 503);
    const body = await requestBody(input, init);
    const pipelined = Array.isArray(body?.[0]);
    const result = pipelined
      ? body.map(executeRedisCommand)
      : executeRedisCommand(body);
    return jsonResponse(result);
  }

  throw new Error(`Unexpected external request: ${url}`);
}

function session() {
  return {
    schemaVersion: 2,
    questionnaireVersion: 20260815,
    name: "통합 테스트 사용자",
    futureYear: 3,
    answers: [
      { questionId: 1, answer: "집중과 관계를 함께 지키는 하루를 살고 있습니다." },
      { questionId: 5, answer: "매일 좋아한 이유를 한 문장씩 기록했습니다." },
      { questionId: 10, answer: "경험을 나누어 다른 사람의 시작을 돕습니다." }
    ]
  };
}

function reportRequest(paymentId) {
  return new Request("https://app.test/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session: session(), paymentId })
  });
}

function paymentRequest(paymentId) {
  return new Request("https://app.test/api/payments/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId })
  });
}

function adminRequest(paymentId, action, reason = "OpenAI 500 오류 확인 후 재시도") {
  return new Request("https://app.test/api/admin/recovery", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.ADMIN_RECOVERY_SECRET}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ paymentId, action, reason })
  });
}

function storedRecord() {
  assert.equal(state.redis.size, 1);
  return JSON.parse([...state.redis.values()][0]);
}

test("결제부터 AI 생성과 운영 복구까지 외부 비용 없이 검증한다", async (t) => {
  process.env.NODE_ENV = "test";
  process.env.FUTURE_COORDINATE_AI_ENABLED = "true";
  process.env.PAYMENT_LEDGER_ENFORCED = "true";
  process.env.OPENAI_API_KEY = "test-openai-key";
  process.env.OPENAI_MODEL = "test-model";
  process.env.OPENAI_API_BASE_URL = "https://mock.openai.test/v1";
  process.env.PORTONE_API_SECRET = "test-portone-secret";
  process.env.PORTONE_API_BASE_URL = "https://mock.portone.test";
  process.env.NEXT_PUBLIC_PORTONE_STORE_ID = "store-test";
  process.env.KV_REST_API_URL = "https://mock.redis.test";
  process.env.KV_REST_API_TOKEN = "test-redis-token";
  process.env.PAYMENT_USAGE_HMAC_SECRET = "h".repeat(64);
  process.env.PAYMENT_LEDGER_NAMESPACE = "integration-test";
  process.env.ADMIN_RECOVERY_SECRET = "s".repeat(64);
  globalThis.fetch = mockFetch;

  const { POST: completePayment } = await import("../app/api/payments/complete/route.ts");
  const { POST: createReport } = await import("../app/api/report/route.ts");
  const { POST: recoverReport } = await import("../app/api/admin/recovery/route.ts");

  await t.test("정상 결제는 검증되고 리포트는 한 번만 생성된다", async () => {
    resetState();
    const paymentId = "fc-integration-success";

    const paymentResponse = await completePayment(paymentRequest(paymentId));
    assert.equal(paymentResponse.status, 200);
    assert.equal((await paymentResponse.json()).verified, true);

    const first = await createReport(reportRequest(paymentId));
    assert.equal(first.status, 200);
    const report = await first.json();
    assert.equal(report.mode, "ai");
    assert.equal(report.usage.totalTokens, 360);

    const duplicate = await createReport(reportRequest(paymentId));
    assert.equal(duplicate.status, 409);
    assert.equal((await duplicate.json()).error, "REPORT_ALREADY_GENERATED");
    assert.equal(state.openaiCalls, 1);

    const record = storedRecord();
    assert.equal(record.status, "completed");
    assert.equal(record.diagnostics.openaiRequestId, "openai-request-1");
    assert.match(record.diagnostics.openaiClientRequestId, /^fc-/);
  });

  await t.test("동시 생성 요청은 OpenAI를 한 번만 호출한다", async () => {
    resetState();
    const responses = await Promise.all([
      createReport(reportRequest("fc-integration-concurrent")),
      createReport(reportRequest("fc-integration-concurrent"))
    ]);
    assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
    assert.equal(state.openaiCalls, 1);
  });

  await t.test("AI 실패는 자동 재호출하지 않고 운영자 승인 후 한 번만 재시도한다", async () => {
    resetState();
    state.openaiModes = ["failure", "success"];
    const paymentId = "fc-integration-recovery";

    const failed = await createReport(reportRequest(paymentId));
    assert.equal(failed.status, 502);
    assert.equal(storedRecord().status, "failed");

    const blocked = await createReport(reportRequest(paymentId));
    assert.equal(blocked.status, 409);
    assert.equal((await blocked.json()).error, "PAYMENT_REVIEW_REQUIRED");
    assert.equal(state.openaiCalls, 1);

    const authorized = await recoverReport(adminRequest(paymentId, "authorize_retry"));
    assert.equal(authorized.status, 200);
    assert.equal((await authorized.json()).record.status, "retry_allowed");

    const retried = await createReport(reportRequest(paymentId));
    assert.equal(retried.status, 200);
    assert.equal((await retried.json()).mode, "ai");
    assert.equal(state.openaiCalls, 2);
    assert.equal(storedRecord().status, "completed");

    const used = await createReport(reportRequest(paymentId));
    assert.equal(used.status, 409);
    assert.equal(state.openaiCalls, 2);
  });

  await t.test("결제 정보가 다르면 Redis와 OpenAI를 호출하지 않는다", async () => {
    resetState();
    state.paymentMode = "amount_mismatch";
    const response = await createReport(reportRequest("fc-integration-bad-payment"));
    assert.equal(response.status, 402);
    assert.equal((await response.json()).error, "PAYMENT_NOT_VERIFIED");
    assert.equal(state.redisCalls, 0);
    assert.equal(state.openaiCalls, 0);
  });

  await t.test("승인되지 않은 결제는 결제 완료 처리되지 않는다", async () => {
    resetState();
    state.paymentMode = "not_paid";
    const response = await completePayment(paymentRequest("fc-integration-cancelled"));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, "PAYMENT_NOT_PAID");
    assert.equal(state.redisCalls, 0);
    assert.equal(state.openaiCalls, 0);
  });

  await t.test("OpenAI 응답 형식 오류도 실패로 잠그고 자동 재호출하지 않는다", async () => {
    resetState();
    state.openaiModes = ["invalid", "success"];
    const paymentId = "fc-integration-invalid-ai";

    const invalid = await createReport(reportRequest(paymentId));
    assert.equal(invalid.status, 502);
    assert.equal((await invalid.json()).error, "AI_RESPONSE_FAILED");
    assert.equal(storedRecord().errorCode, "AI_RESPONSE_FAILED");

    const blocked = await createReport(reportRequest(paymentId));
    assert.equal(blocked.status, 409);
    assert.equal((await blocked.json()).error, "PAYMENT_REVIEW_REQUIRED");
    assert.equal(state.openaiCalls, 1);
  });

  await t.test("Redis 장애 시 비용 보호를 위해 OpenAI를 호출하지 않는다", async () => {
    resetState();
    state.redisAvailable = false;
    const response = await createReport(reportRequest("fc-integration-redis-offline"));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, "PAYMENT_LEDGER_UNAVAILABLE");
    assert.equal(state.openaiCalls, 0);
  });

  globalThis.fetch = originalFetch;
});
