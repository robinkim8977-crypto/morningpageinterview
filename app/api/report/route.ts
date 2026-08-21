import { NextResponse } from "next/server";
import { questions } from "@/data/questions";
import { createPreviewAnalysis, isFutureCoordinateAnalysis } from "@/lib/future-coordinate";
import {
  configuredPaymentUsageLedger,
  PaymentLedgerError,
  type PaymentUsageReservation
} from "@/lib/payment-ledger";
import { FUTURE_COORDINATE_PRODUCT_CODE } from "@/lib/payment";
import { verifyFutureCoordinatePayment } from "@/lib/portone";
import type { InterviewSession } from "@/lib/types";

export const runtime = "nodejs";

const stringList = (minItems: number, maxItems: number) => ({
  type: "array",
  minItems,
  maxItems,
  items: { type: "string" }
}) as const;

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    scenes: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          role: { type: "string", enum: ["life", "turning-point", "expansion"] },
          title: { type: "string" },
          sourceQuestionIds: {
            type: "array",
            minItems: 1,
            maxItems: 5,
            items: { type: "integer", minimum: 1, maximum: 11 }
          },
          scene: stringList(2, 3),
          meaning: { type: "string" },
          values: stringList(3, 5),
          currentClue: { type: "string" },
          insight: { type: "string" }
        },
        required: ["id", "role", "title", "sourceQuestionIds", "scene", "meaning", "values", "currentClue", "insight"]
      }
    },
    direction: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        summary: { type: "string" },
        steps: stringList(3, 4)
      },
      required: ["title", "summary", "steps"]
    },
    roadmap: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          days: { type: "integer", enum: [30, 90, 365] },
          stage: { type: "string", enum: ["NOTICE", "EXPERIMENT", "BUILD"] },
          goal: { type: "string" },
          description: { type: "string" },
          actions: stringList(1, 2),
          result: { type: "string" }
        },
        required: ["days", "stage", "goal", "description", "actions", "result"]
      }
    },
    firstAction: {
      type: "object",
      additionalProperties: false,
      properties: {
        action: { type: "string" },
        duration: { type: "string" },
        reason: { type: "string" },
        sourceQuestionIds: {
          type: "array",
          minItems: 1,
          maxItems: 3,
          items: { type: "integer", minimum: 1, maximum: 11 }
        }
      },
      required: ["action", "duration", "reason", "sourceQuestionIds"]
    }
  },
  required: ["scenes", "direction", "roadmap", "firstAction"]
} as const;

function parseSession(value: unknown): InterviewSession | null {
  if (!value || typeof value !== "object") return null;
  const session = value as Partial<InterviewSession>;
  if (typeof session.name !== "string" || typeof session.futureYear !== "number" || !Array.isArray(session.answers)) return null;

  const answers = session.answers
    .filter((answer) => answer && typeof answer.questionId === "number" && typeof answer.answer === "string")
    .map((answer) => ({ questionId: answer.questionId, answer: answer.answer.slice(0, 8000) }));

  if (answers.length === 0) return null;
  return { name: session.name.slice(0, 80), futureYear: session.futureYear, answers };
}

function getOutputText(response: unknown) {
  if (!response || typeof response !== "object") return "";
  const data = response as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  if (typeof data.output_text === "string") return data.output_text;
  return (data.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("");
}

type PaymentUsageContext = {
  ledger: ReturnType<typeof configuredPaymentUsageLedger>;
  reservation: PaymentUsageReservation;
};

async function settlePaymentUsage(
  context: PaymentUsageContext | null,
  outcome: "completed" | "failed",
  errorCode?: string
) {
  if (!context) return;

  try {
    const updated = outcome === "completed"
      ? await context.ledger.complete(context.reservation)
      : await context.ledger.fail(context.reservation, errorCode || "UNKNOWN_FAILURE");
    if (!updated) {
      console.error("Payment usage record was not updated", {
        outcome,
        attemptId: context.reservation.record.attemptId
      });
    }
  } catch (error) {
    // A processing record still blocks another paid AI call. Return a valid
    // report when one exists, and leave uncertain failures for manual review.
    console.error("Payment usage settlement failed", error);
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const requestBody = body as { session?: unknown; preview?: unknown; paymentId?: unknown };
  const session = parseSession(requestBody.session);
  if (!session) {
    return NextResponse.json({ error: "INTERVIEW_REQUIRED", message: "분석할 인터뷰 답변이 없습니다." }, { status: 400 });
  }

  if (process.env.NODE_ENV === "development" && requestBody.preview === true) {
    return NextResponse.json(createPreviewAnalysis(session));
  }

  const aiReportEnabled = process.env.NODE_ENV === "development" || process.env.FUTURE_COORDINATE_AI_ENABLED === "true";
  if (!aiReportEnabled) {
    return NextResponse.json(
      { error: "AI_REPORT_NOT_AVAILABLE", message: "미래좌표 결제와 분석 기능을 준비하고 있습니다." },
      { status: 403 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI_NOT_CONFIGURED", message: "AI 분석 연결이 아직 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-5.6-terra";
  const paymentProtectionRequired = process.env.NODE_ENV !== "development"
    || process.env.PAYMENT_LEDGER_ENFORCED === "true";
  let paymentUsage: PaymentUsageContext | null = null;

  if (paymentProtectionRequired) {
    if (typeof requestBody.paymentId !== "string" || !requestBody.paymentId) {
      return NextResponse.json(
        { error: "PAYMENT_REQUIRED", message: "결제 확인 후 미래좌표 리포트를 만들 수 있습니다." },
        { status: 402 }
      );
    }
    try {
      await verifyFutureCoordinatePayment(requestBody.paymentId);
    } catch {
      return NextResponse.json(
        { error: "PAYMENT_NOT_VERIFIED", message: "결제 승인 상태를 확인하지 못했습니다. 고객센터로 문의해 주세요." },
        { status: 402 }
      );
    }

    try {
      const ledger = configuredPaymentUsageLedger();
      const reservation = await ledger.reserve({
        paymentId: requestBody.paymentId,
        productCode: FUTURE_COORDINATE_PRODUCT_CODE,
        session
      });
      paymentUsage = { ledger, reservation };
    } catch (error) {
      if (error instanceof PaymentLedgerError) {
        return NextResponse.json(
          { error: error.code, message: error.message },
          { status: error.status }
        );
      }
      console.error("Payment usage protection failed", error);
      return NextResponse.json(
        {
          error: "PAYMENT_LEDGER_UNAVAILABLE",
          message: "결제 사용 기록을 확인하지 못했습니다. 비용 보호를 위해 AI 분석을 시작하지 않았습니다."
        },
        { status: 503 }
      );
    }
  }

  const interview = session.answers
    .map((answer) => {
      const question = questions.find((item) => item.id === answer.questionId);
      const questionLead = question?.question.split("\n\n")[0] ?? `질문 ${answer.questionId}`;
      const context = question ? `${question.phase} · ${question.theme}` : "인터뷰";
      return `[질문 ${answer.questionId} | ${context}]\n${questionLead}\n\n[답변]\n${answer.answer}`;
    })
    .join("\n\n---\n\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 5200,
        reasoning: { effort: "medium" },
        instructions:
          `당신은 미래 인터뷰를 현재의 다음 한 걸음으로 번역하는 한국어 에디터입니다. 미래를 빠르게 달성하라고 압박하지 말고, 현재와 미래 사이의 거리를 존중해 해석하세요.

핵심 목표:
- 인터뷰 전체에서 서로 다른 역할의 미래 장면을 정확히 3개 고릅니다.
- 장면은 '삶의 모습 → 변화의 증거 → 다음 확장' 순서여야 합니다.
- 세 장면을 관통하는 하나의 방향을 3~4단계로 해석합니다.
- 그 하나의 방향을 위한 통합 30·90·365일 로드맵과 72시간 첫 행동을 만듭니다.

장면 역할:
1. role=life: 미래의 공간, 일하는 방식, 생활 리듬, 관계와 환경. 질문 1~3과 9를 우선 근거로 삼습니다.
2. role=turning-point: 변화나 성취를 처음 실감한 전환점, 타인의 반응, 자기 확신, 중요한 선택. 질문 4~8을 우선 근거로 삼습니다.
3. role=expansion: 현재 성취 이후 다시 향하는 꿈, 새로운 역할, 다른 사람에게 확장되는 영향. 질문 9~11을 우선 근거로 삼습니다.

각 장면 규칙:
- id는 scene-1, scene-2, scene-3 순서로 씁니다.
- sourceQuestionIds에는 직접 근거인 질문 번호만 넣습니다.
- title은 답변 속 고유한 공간·행동·관계가 드러나는 12~30자의 제목입니다.
- scene은 장면 자체만 2~3문장으로 생생하게 재구성합니다. 각 문장은 100자 안팎으로 제한하고 답변을 길게 옮기지 않습니다.
- meaning은 이 장면이 보여주는 성공 기준, 삶의 기준, 관계, 자기인식을 1~2문장, 총 220자 이내로 분석합니다.
- values는 3~5개의 짧은 단어입니다.
- currentClue는 미래의 특성이 이미 현재에 어떤 습관·관심·태도로 존재하는지 180자 이내로 설명합니다.
- insight는 여러 답변의 패턴을 종합해 사용자가 직접 말하지 않은 가장 중요한 의미를 120자 이내의 한 문장으로 씁니다. 과장하거나 사실을 발명하지 않습니다.

하나의 방향 규칙:
- direction.title은 세 장면을 하나의 문장으로 묶는 방향입니다.
- direction.summary는 세 장면이 왜 하나의 흐름인지 분석합니다.
- direction.steps는 명사형의 짧은 3~4단계이며 앞 단계가 다음 단계로 자연스럽게 이어집니다.

통합 로드맵 규칙:
- roadmap은 정확히 30일·90일·365일 하나씩이며 순서는 30, 90, 365입니다.
- 각 기간의 actions는 최대 2개이고 완료 여부를 알 수 있어야 합니다. 전체 행동은 6개 이하입니다.
- 세 기간은 독립 프로젝트가 아닙니다. 30일에 알아차린 기준을 90일에 실제 삶에서 시험하고, 효과가 있었던 방식을 365일 동안 반복해 삶의 구조로 만드는 하나의 인과 흐름이어야 합니다.
- 작성 전 답변에서 나이, 현재 직업, 경력 단계, 가족관계, 현재 생활, 이미 이룬 일과 아직 미래인 일을 구분합니다. 생성한 계획을 이 현재 상태와 다시 비교해 충돌하면 고칩니다.
- 답변에 없는 첫 직장, 취업 준비, 결혼, 독립, 첫 사업, 자녀, 가족 구성, 경력 단계를 임의로 가정하지 않습니다. 이미 경력이 있는 사람에게 '첫 커리어의 기반' 같은 표현을 쓰지 않습니다.
- 사용자의 현재 단계가 미래보다 우선입니다. 현재 추진 중이라고 명시하지 않았다면 공간 임대, 직원 채용, 사업 운영, 퇴사, 해외 프로젝트 완수 등으로 건너뛰지 않습니다.
- 30일(stage=NOTICE): 지금 가진 시간과 도구로 현재 삶을 관찰하고 기록하며 중요한 기준을 알아차리는 단계입니다. 큰 비용, 사업, 직업 전환을 제안하지 않습니다.
- 90일(stage=EXPERIMENT): 30일에 발견한 기준을 생활 리듬, 관계의 경계, 일·창작 방식, 시간 사용법이나 작은 선택에 일정 기간 적용하는 실험입니다. 모든 사용자에게 포트폴리오, 글, 기획서, 공개 프로젝트를 만들게 하지 않습니다. 인터뷰가 창작·프로젝트 중심일 때만 결과물이 자연스럽게 포함될 수 있습니다.
- 365일(stage=BUILD): 효과가 있었던 방식을 반복해 삶과 일에 축적합니다. 미래의 회사·공간·사업·자산·직업을 달성하는 목표가 아닙니다. 사용자가 이미 구체적으로 추진 중이라고 말하지 않았다면 그 미래를 가능하게 할 경험과 기준을 쌓습니다.
- result는 산출물 또는 도달 상태 하나만 씁니다.
- '보고서 1부', '지표표', '운영 가이드', '연간 리포트', '협업 연락망' 같은 기업 컨설팅 표현을 피합니다. 측정 가능성은 유지하되 생활 언어로 씁니다.

72시간 첫 행동 규칙:
- firstAction은 질문 5의 '작은 습관'을 최우선으로 사용합니다. 없으면 질문 7의 실제 극복 행동, 반복 행동, 지금 가능한 최소 행동 순서로 고릅니다.
- 일반적인 자기계발 행동을 만들지 말고 인터뷰에서 사용자가 직접 말한 행동을 구체화합니다.
- 60분 안에, 가능하면 5~30분 안에 끝나야 하며 조사 프로젝트, 사업계획, 포트폴리오 전체 수정은 금지합니다.
- duration은 실제 행동량에 맞춰 계산합니다. 한 문장 기록은 3~5분, 간단한 목록은 약 10분, 자료 몇 개 수집은 10~20분, 간단한 조사는 20~30분을 기준으로 하며 기계적으로 15분이나 30분을 붙이지 않습니다.
- reason은 '미래의 당신이 반복해온 행동 중, 지금 바로 시작할 수 있는 하나를 골랐습니다.'처럼 개인화 근거를 설명합니다.

문체는 따뜻하고 구체적이며 단정한 존댓말입니다. 답변에 없는 인물·장소·성과·숫자·감정을 사실처럼 만들지 마세요. 의료·법률·재정 판단을 단정하지 마세요.`,
        input: `이름: ${session.name || "사용자"}\n미래 시점: 현재로부터 ${session.futureYear}년 후\n\n아래 질문과 답변만을 근거로 미래좌표를 작성하세요.\n\n${interview}`,
        text: {
          verbosity: "medium",
          format: {
            type: "json_schema",
            name: "future_coordinate_analysis_v4",
            strict: true,
            schema: responseSchema
          }
        }
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("OpenAI report request failed", response.status, detail.slice(0, 500));
      await settlePaymentUsage(paymentUsage, "failed", `OPENAI_HTTP_${response.status}`);
      return NextResponse.json(
        {
          error: "AI_REQUEST_FAILED",
          message: "AI 분석을 완료하지 못했습니다. 자동 재호출을 멈췄으니 고객센터로 문의해 주세요."
        },
        { status: 502 }
      );
    }

    const payload = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
      usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
    };
    const parsed = JSON.parse(getOutputText(payload)) as unknown;
    if (!isFutureCoordinateAnalysis(parsed)) {
      throw new Error("Invalid future-coordinate response shape");
    }

    const report = {
      ...parsed,
      mode: "ai",
      generatedAt: new Date().toISOString(),
      model,
      usage: {
        inputTokens: payload.usage?.input_tokens ?? 0,
        outputTokens: payload.usage?.output_tokens ?? 0,
        totalTokens: payload.usage?.total_tokens ?? 0
      }
    };

    await settlePaymentUsage(paymentUsage, "completed");
    return NextResponse.json(report);
  } catch (error) {
    console.error("Future-coordinate analysis failed", error);
    await settlePaymentUsage(paymentUsage, "failed", "AI_RESPONSE_FAILED");
    return NextResponse.json(
      {
        error: "AI_RESPONSE_FAILED",
        message: "AI 분석 결과를 읽지 못했습니다. 자동 재호출을 멈췄으니 고객센터로 문의해 주세요."
      },
      { status: 502 }
    );
  }
}
