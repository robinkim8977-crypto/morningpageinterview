import type { FutureCoordinateAnalysis, FuturePlan, FutureScene, InterviewSession } from "@/lib/types";

export const FUTURE_COORDINATE_ANALYSIS_KEY = "morning-page-future-coordinate-analysis";
export const FUTURE_COORDINATE_COMMITMENT_KEY = "morning-page-future-coordinate-commitment";
export const FUTURE_COORDINATE_ANALYSIS_VERSION = 4;

function answerFor(session: InterviewSession, questionId: number) {
  return session.answers.find((answer) => answer.questionId === questionId)?.answer.trim() ?? "";
}

function previewSentence(value: string, fallback: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const sentence = normalized.split(/(?<=[.!?])\s+/)[0] || fallback;
  const shortened = sentence.length <= 150 ? sentence : `${sentence.slice(0, 149).replace(/[,\s]+$/g, "")}…`;
  return /[.!?…]$/.test(shortened) ? shortened : `${shortened}.`;
}

function previewPlan(
  days: FuturePlan["days"],
  stage: FuturePlan["stage"],
  goal: string,
  description: string,
  actions: [string, string],
  result: string
): FuturePlan {
  return { days, stage, goal, description, actions, result };
}

export function createPreviewAnalysis(session: InterviewSession): FutureCoordinateAnalysis {
  const scenes: [FutureScene, FutureScene, FutureScene] = [
    {
      id: "scene-1",
      role: "life",
      title: "집중과 관계가 함께 있는 하루",
      sourceQuestionIds: [1, 2, 3, 9],
      scene: [
        previewSentence(answerFor(session, 3) || answerFor(session, 2), "좋아하는 일에 몰입하면서도 삶 전체를 일에 내어주지 않는 하루를 살아갑니다."),
        "일하는 공간과 시간, 곁에 있는 사람을 스스로 선택하며 오래 지속할 수 있는 리듬을 만듭니다."
      ],
      meaning: "이 미래에서 성공은 더 많이 해내는 것이 아니라, 집중과 회복과 관계가 서로를 해치지 않는 방식으로 살아가는 것입니다.",
      values: ["자기 기준", "몰입", "관계", "건강"],
      currentClue: "이미 좋아하는 일을 오래 이어가기 위해 시간과 에너지를 어떻게 쓰고 싶은지 구체적으로 말하고 있습니다.",
      insight: "당신이 원하는 성장은 삶을 밀어내는 성취가 아니라, 삶을 지키기 때문에 오래가는 성취입니다."
    },
    {
      id: "scene-2",
      role: "turning-point",
      title: "좋아해서 만든 일이 선택받은 순간",
      sourceQuestionIds: [4, 5, 6, 7, 8],
      scene: [
        previewSentence(answerFor(session, 4), "스스로 좋아해서 시작한 작은 결과물이 누군가가 자신을 선택하는 이유가 됩니다."),
        "타인의 이름이나 정답을 좇던 시선이 자신의 관찰과 취향을 믿는 확신으로 바뀝니다."
      ],
      meaning: "전환점의 핵심은 큰 성과가 아니라, 개인적인 관심과 반복해온 습관이 바깥세상에서 의미를 얻었다는 증거입니다.",
      values: ["취향", "관찰", "지속", "자기 확신"],
      currentClue: "좋아하는 이유를 한 문장으로 남기거나 작은 것을 오래 바라보는 습관은 이미 자신만의 기준을 만드는 시작점입니다.",
      insight: "당신이 원하는 성공은 유명한 곳에 선택받는 것이 아니라, 당신의 고유한 시선 때문에 선택받는 것입니다."
    },
    {
      id: "scene-3",
      role: "expansion",
      title: "나의 경험이 다른 사람의 시작으로",
      sourceQuestionIds: [9, 10, 11],
      scene: [
        previewSentence(answerFor(session, 10), "지금까지 발견한 방식과 경험을 새로운 프로젝트로 엮어 다른 사람에게 건넵니다."),
        "혼자만의 성취에서 멈추지 않고, 누군가가 자신의 방향을 발견하도록 돕는 다음 장으로 확장합니다."
      ],
      meaning: "다음 꿈은 지금의 성취를 더 크게 복제하는 일이 아니라, 자신이 어렵게 발견한 기준을 타인의 가능성과 연결하는 일입니다.",
      values: ["확장", "기여", "호기심", "자유"],
      currentClue: "미래에 해보고 싶은 프로젝트를 구체적인 사람과 경험의 모습으로 설명하는 것 자체가 이미 다음 방향의 재료가 되고 있습니다.",
      insight: "당신의 다음 성장은 더 앞서가는 일이 아니라, 먼저 발견한 길을 다른 사람도 걸어볼 수 있게 만드는 일입니다."
    }
  ];

  return {
    scenes,
    direction: {
      title: "나의 기준으로 선택하고, 그 기준을 세상과 나누는 삶",
      summary: "세 장면은 취향과 관심을 발견하고, 작은 결과물로 증명하고, 마침내 다른 사람의 시작을 돕는 하나의 흐름으로 이어집니다.",
      steps: ["좋아하는 이유 발견", "나만의 결과물", "자기 방식의 커리어", "다른 사람에게 확장"]
    },
    roadmap: [
      previewPlan(30, "NOTICE", "나만의 기준을 한 장에 모으기", "이미 마음이 가는 것들을 관찰해 다음 선택의 기준을 발견합니다.", ["좋아하는 작업 20개에 왜 좋은지 한 문장씩 적기", "반복해서 등장한 기준 5개를 골라 한 장에 모으기"], "다음 선택에서 사용할 나의 기준 한 장"),
      previewPlan(90, "EXPERIMENT", "발견한 기준으로 일하는 방식 시험하기", "30일 동안 발견한 기준 하나를 실제 작업과 시간 사용에 적용해봅니다.", ["다음 작은 작업 하나에 발견한 기준 1개 적용하기", "3주 동안 작업 뒤 에너지가 생긴 점과 막힌 점을 짧게 남기기"], "나에게 맞는 작업 방식에 대한 실제 감각"),
      previewPlan(365, "BUILD", "효과가 있었던 방식을 삶에 쌓기", "미래의 공간이나 사업을 서두르지 않고, 실험에서 효과가 있었던 방식을 반복해 나의 구조로 만듭니다.", ["계절마다 에너지가 생긴 작업과 지친 작업을 돌아보기", "잘 맞았던 기준을 다음 작업에도 적용하며 나만의 원칙 5개로 다듬기"], "앞으로의 선택을 지탱할 기준과 경험의 축적")
    ],
    firstAction: {
      action: "최근 저장한 작업 10개를 열어 각각 왜 좋은지 한 문장씩 적기",
      duration: "20분",
      reason: "미래의 당신이 가장 중요한 습관으로 꼽은 행동을 오늘로 가져왔습니다.",
      sourceQuestionIds: [5]
    },
    mode: "preview",
    generatedAt: new Date().toISOString()
  };
}

function isStringArray(value: unknown, min: number, max: number) {
  return Array.isArray(value) && value.length >= min && value.length <= max && value.every((item) => typeof item === "string" && item.trim().length > 0);
}

function isQuestionIdArray(value: unknown, min: number, max: number) {
  return Array.isArray(value) && value.length >= min && value.length <= max && value.every((id) => Number.isInteger(id) && Number(id) >= 1 && Number(id) <= 11);
}

function isPlan(value: unknown): value is FuturePlan {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<FuturePlan>;
  return (
    (item.days === 30 || item.days === 90 || item.days === 365) &&
    (item.stage === "NOTICE" || item.stage === "EXPERIMENT" || item.stage === "BUILD") &&
    typeof item.goal === "string" &&
    typeof item.description === "string" &&
    isStringArray(item.actions, 1, 2) &&
    typeof item.result === "string"
  );
}

export function isFutureCoordinateAnalysis(value: unknown): value is FutureCoordinateAnalysis {
  if (!value || typeof value !== "object") return false;
  const analysis = value as Partial<FutureCoordinateAnalysis>;
  if (!Array.isArray(analysis.scenes) || analysis.scenes.length !== 3) return false;

  const validRoles = ["life", "turning-point", "expansion"];
  const scenesValid = analysis.scenes.every((scene, index) => {
    if (!scene || typeof scene !== "object") return false;
    const candidate = scene as Partial<FutureScene>;
    return (
      typeof candidate.id === "string" &&
      candidate.role === validRoles[index] &&
      typeof candidate.title === "string" &&
      isQuestionIdArray(candidate.sourceQuestionIds, 1, 5) &&
      isStringArray(candidate.scene, 2, 3) &&
      typeof candidate.meaning === "string" &&
      isStringArray(candidate.values, 3, 5) &&
      typeof candidate.currentClue === "string" &&
      typeof candidate.insight === "string"
    );
  });
  if (!scenesValid || !analysis.direction || typeof analysis.direction !== "object") return false;
  if (typeof analysis.direction.title !== "string" || typeof analysis.direction.summary !== "string" || !isStringArray(analysis.direction.steps, 3, 4)) return false;
  if (!Array.isArray(analysis.roadmap) || analysis.roadmap.length !== 3 || !analysis.roadmap.every(isPlan)) return false;
  if (analysis.roadmap[0].days !== 30 || analysis.roadmap[1].days !== 90 || analysis.roadmap[2].days !== 365) return false;
  if (!analysis.firstAction || typeof analysis.firstAction !== "object") return false;
  return (
    typeof analysis.firstAction.action === "string" &&
    typeof analysis.firstAction.duration === "string" &&
    typeof analysis.firstAction.reason === "string" &&
    isQuestionIdArray(analysis.firstAction.sourceQuestionIds, 1, 3)
  );
}
