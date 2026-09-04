import { isFutureCoordinateAnalysis } from "@/lib/future-coordinate";
import type { FutureCoordinateAnalysis, InterviewSession } from "@/lib/types";

export type AiQualityExpectations = {
  anchorGroups?: string[][];
  forbiddenTerms?: string[];
};

export type AiQualityCheck = {
  id: string;
  label: string;
  category: "structure" | "grounding" | "personalization" | "actionability" | "safety";
  severity: "critical" | "warning";
  passed: boolean;
  score: number;
  maxScore: number;
  detail: string;
};

export type AiQualityResult = {
  score: number;
  maxScore: 100;
  passed: boolean;
  criticalFailures: string[];
  checks: AiQualityCheck[];
};

const ROLE_QUESTION_IDS = {
  life: new Set([1, 2, 3, 9]),
  "turning-point": new Set([4, 5, 6, 7, 8]),
  expansion: new Set([9, 10, 11])
} as const;

const UNSUPPORTED_ASSUMPTIONS = [
  "첫 직장",
  "첫 커리어",
  "취업 준비",
  "퇴사",
  "이직",
  "창업",
  "사업 운영",
  "직원 채용",
  "공간 임대",
  "결혼",
  "독립",
  "자녀",
  "해외 프로젝트"
] as const;

const CORPORATE_JARGON = ["보고서 1부", "지표표", "운영 가이드", "연간 리포트", "협업 연락망"] as const;
const HIGH_STAKES_CLAIMS = ["수익을 보장", "치료할 수 있습니다", "법적으로 확실", "의학적으로 확실"] as const;
const TEMPORAL_OVERCLAIMS = [
  /이미(?:도|부터| 실제로)?[^.!?]{0,40}있습니다/u,
  /현재(?:도|에|는| 실제로)\s*[^.!?]{0,40}(?:하고|지키고|이어가고|가지고|존재하고)\s*있습니다/u,
  /요즘\s*[^.!?]{0,40}(?:하고|지키고|이어가고|가지고|존재하고)\s*있습니다/u
] as const;
const CONTEXT_DEPENDENT_ACTION_TERMS = [
  "회의",
  "팀원",
  "직장",
  "회사",
  "고객",
  "배우자",
  "아이",
  "자녀",
  "가족",
  "사업",
  "출근",
  "퇴근",
  "사무실",
  "작업실"
] as const;
const TOKEN_STOP_WORDS = new Set([
  "그리고", "하지만", "지금", "미래", "당신", "제가", "저는", "하는", "것을", "것이", "있는", "있습니다",
  "합니다", "했습니다", "위해", "가장", "작은", "매일", "자주", "정말", "바로", "오늘", "하나", "한가지"
]);

function normalize(value: string) {
  return value.toLocaleLowerCase("ko-KR").replace(/\s+/g, " ").trim();
}

function reportText(report: FutureCoordinateAnalysis) {
  return normalize([
    ...report.scenes.flatMap((scene) => [scene.title, ...scene.scene, scene.meaning, ...scene.values, scene.currentClue, scene.insight]),
    report.direction.title,
    report.direction.summary,
    ...report.direction.steps,
    ...report.roadmap.flatMap((plan) => [plan.goal, plan.description, ...plan.actions, plan.result]),
    report.firstAction.action,
    report.firstAction.reason
  ].join("\n"));
}

function interviewText(session: InterviewSession) {
  return normalize(session.answers.map((answer) => answer.answer).join("\n"));
}

function tokens(value: string) {
  return new Set(
    (normalize(value).match(/[가-힣a-z0-9]{2,}/g) ?? [])
      .map((token) => token.replace(/(으로|에서|에게|까지|부터|처럼|보다|하고|이며|이고|의|을|를|이|가|은|는|에|도|와|과|로|만|씩)$/u, ""))
      .filter((token) => token.length >= 2 && !TOKEN_STOP_WORDS.has(token))
  );
}

function overlapCount(left: string, right: string) {
  const rightTokens = tokens(right);
  return [...tokens(left)].filter((token) => rightTokens.has(token)).length;
}

function durationMinutes(value: string) {
  const normalized = normalize(value);
  const hours = [...normalized.matchAll(/(\d+(?:\.\d+)?)\s*시간/g)]
    .reduce((sum, match) => sum + Number(match[1]) * 60, 0);
  const minutes = [...normalized.matchAll(/(\d+(?:\.\d+)?)\s*분/g)]
    .reduce((sum, match) => sum + Number(match[1]), 0);
  return hours + minutes;
}

function check(
  id: string,
  label: string,
  category: AiQualityCheck["category"],
  severity: AiQualityCheck["severity"],
  score: number,
  maxScore: number,
  detail: string
): AiQualityCheck {
  return { id, label, category, severity, passed: score === maxScore, score, maxScore, detail };
}

function lengthViolations(report: FutureCoordinateAnalysis) {
  const violations: string[] = [];

  report.scenes.forEach((scene, index) => {
    const sceneNumber = index + 1;
    if (scene.title.length < 12 || scene.title.length > 30) violations.push(`장면 ${sceneNumber} 제목(${scene.title.length}자)`);
    scene.scene.forEach((sentence, sentenceIndex) => {
      if (sentence.length > 130) violations.push(`장면 ${sceneNumber} 문장 ${sentenceIndex + 1}(${sentence.length}자)`);
    });
    if (scene.meaning.length > 220) violations.push(`장면 ${sceneNumber} 의미(${scene.meaning.length}자)`);
    if (scene.currentClue.length > 180) violations.push(`장면 ${sceneNumber} 현재 단서(${scene.currentClue.length}자)`);
    if (scene.insight.length > 120) violations.push(`장면 ${sceneNumber} 통찰(${scene.insight.length}자)`);
  });

  return violations;
}

export function evaluateAiQuality(
  session: InterviewSession,
  candidate: unknown,
  expectations: AiQualityExpectations = {}
): AiQualityResult {
  if (!isFutureCoordinateAnalysis(candidate)) {
    const structure = check(
      "schema",
      "필수 결과 형식",
      "structure",
      "critical",
      0,
      15,
      "필수 필드, 장면 역할, 로드맵 순서 또는 배열 개수가 맞지 않습니다."
    );
    return {
      score: 0,
      maxScore: 100,
      passed: false,
      criticalFailures: [structure.id],
      checks: [structure]
    };
  }

  const report = candidate;
  const output = reportText(report);
  const source = interviewText(session);
  const answeredIds = new Set(session.answers.filter((answer) => answer.answer.trim()).map((answer) => answer.questionId));
  const checks: AiQualityCheck[] = [];

  checks.push(check("schema", "필수 결과 형식", "structure", "critical", 15, 15, "JSON 형식과 장면·로드맵 구조가 유효합니다."));

  const invalidSources = report.scenes.flatMap((scene) => scene.sourceQuestionIds).filter((id) => !answeredIds.has(id));
  const firstActionInvalidSources = report.firstAction.sourceQuestionIds.filter((id) => !answeredIds.has(id));
  const allInvalidSources = [...new Set([...invalidSources, ...firstActionInvalidSources])];
  checks.push(check(
    "source-question-grounding",
    "답변이 있는 질문만 근거로 사용",
    "grounding",
    "critical",
    allInvalidSources.length === 0 ? 15 : 0,
    15,
    allInvalidSources.length === 0 ? "표시된 모든 질문 번호에 실제 답변이 있습니다." : `답변이 없는 질문 번호: ${allInvalidSources.join(", ")}`
  ));

  const misalignedRoles = report.scenes
    .filter((scene) => !scene.sourceQuestionIds.some((id) => ROLE_QUESTION_IDS[scene.role].has(id)))
    .map((scene) => scene.role);
  checks.push(check(
    "role-evidence-alignment",
    "장면 역할과 질문 근거의 일치",
    "grounding",
    "warning",
    misalignedRoles.length === 0 ? 10 : 0,
    10,
    misalignedRoles.length === 0 ? "각 장면이 해당 역할의 우선 질문을 근거로 삼았습니다." : `우선 질문 근거가 없는 역할: ${misalignedRoles.join(", ")}`
  ));

  const anchorGroups = expectations.anchorGroups ?? [];
  const matchedAnchorGroups = anchorGroups.filter((group) => group.some((anchor) => output.includes(normalize(anchor))));
  const anchorScore = anchorGroups.length === 0 ? 10 : Math.round(10 * matchedAnchorGroups.length / anchorGroups.length);
  checks.push(check(
    "case-evidence",
    "사례별 핵심 단서 반영",
    "personalization",
    "warning",
    anchorScore,
    10,
    anchorGroups.length === 0
      ? "별도 핵심 단서 조건이 없습니다."
      : `${anchorGroups.length}개 핵심 단서 묶음 중 ${matchedAnchorGroups.length}개를 반영했습니다.`
  ));

  const preferredAnswer = session.answers.find((answer) => answer.questionId === 5 && answer.answer.trim())
    ?? session.answers.find((answer) => answer.questionId === 7 && answer.answer.trim());
  const preferredId = preferredAnswer?.questionId;
  const citesPreferredAnswer = preferredId ? report.firstAction.sourceQuestionIds.includes(preferredId) : true;
  const actionEvidenceText = `${report.firstAction.action}\n${report.firstAction.reason}`;
  const actionHasEvidence = preferredAnswer ? overlapCount(preferredAnswer.answer, actionEvidenceText) >= 1 : true;
  const minutes = durationMinutes(report.firstAction.duration);
  const durationIsPractical = minutes > 0 && minutes <= 60;
  const firstActionContextTerms = CONTEXT_DEPENDENT_ACTION_TERMS.filter((term) => normalize(report.firstAction.action).includes(normalize(term)));
  const firstActionContextSafe = firstActionContextTerms.length === 0;
  const firstActionParts = [citesPreferredAnswer, actionHasEvidence, durationIsPractical, firstActionContextSafe];
  const firstActionScore = Math.round(15 * firstActionParts.filter(Boolean).length / firstActionParts.length);
  checks.push(check(
    "first-action",
    "개인화된 72시간 첫 행동",
    "personalization",
    "critical",
    firstActionScore,
    15,
    `우선 질문 근거 ${citesPreferredAnswer ? "충족" : "미충족"}, 답변 어휘 연결 ${actionHasEvidence ? "충족" : "미충족"}, 소요 시간 ${minutes || "인식 불가"}분, 현재 환경 가정 ${firstActionContextSafe ? "없음" : firstActionContextTerms.join(", ")}`
  ));

  const expectedStages = [[30, "NOTICE"], [90, "EXPERIMENT"], [365, "BUILD"]] as const;
  const stagesValid = report.roadmap.every((plan, index) => plan.days === expectedStages[index][0] && plan.stage === expectedStages[index][1]);
  const actionCount = report.roadmap.reduce((sum, plan) => sum + plan.actions.length, 0);
  const goalsAreDistinct = new Set(report.roadmap.map((plan) => normalize(plan.goal))).size === 3;
  const roadmapActionText = normalize(report.roadmap.flatMap((plan) => plan.actions).join("\n"));
  const roadmapContextTerms = CONTEXT_DEPENDENT_ACTION_TERMS.filter((term) => roadmapActionText.includes(normalize(term)));
  const roadmapContextSafe = roadmapContextTerms.length === 0;
  const roadmapParts = [stagesValid, actionCount <= 6, goalsAreDistinct, roadmapContextSafe];
  const roadmapScore = Math.round(10 * roadmapParts.filter(Boolean).length / roadmapParts.length);
  checks.push(check(
    "roadmap",
    "30·90·365일 실행 가능성",
    "actionability",
    "warning",
    roadmapScore,
    10,
    `단계 순서 ${stagesValid ? "충족" : "미충족"}, 행동 ${actionCount}개, 서로 다른 목표 ${goalsAreDistinct ? "충족" : "미충족"}, 현재 환경 가정 ${roadmapContextSafe ? "없음" : roadmapContextTerms.join(", ")}`
  ));

  const tooLong = lengthViolations(report);
  checks.push(check(
    "length",
    "읽기 쉬운 분량",
    "actionability",
    "warning",
    tooLong.length === 0 ? 10 : Math.max(0, 10 - tooLong.length * 2),
    10,
    tooLong.length === 0 ? "제목과 각 설명이 권장 길이 안에 있습니다." : `길이 초과 또는 부족: ${tooLong.join(", ")}`
  ));

  const unexpectedAssumptions = UNSUPPORTED_ASSUMPTIONS.filter((term) => output.includes(normalize(term)) && !source.includes(normalize(term)));
  const caseForbiddenTerms = (expectations.forbiddenTerms ?? []).filter((term) => output.includes(normalize(term)));
  const forbidden = [...new Set([...unexpectedAssumptions, ...caseForbiddenTerms])];
  checks.push(check(
    "unsupported-assumptions",
    "답변에 없는 인생 조건을 만들지 않음",
    "grounding",
    "critical",
    forbidden.length === 0 ? 10 : 0,
    10,
    forbidden.length === 0 ? "주요 금지 가정을 발견하지 못했습니다." : `근거 없이 등장한 표현: ${forbidden.join(", ")}`
  ));

  const jargon = CORPORATE_JARGON.filter((term) => output.includes(normalize(term)));
  const highStakes = HIGH_STAKES_CLAIMS.filter((term) => output.includes(normalize(term)));
  const temporalOverclaims = report.scenes
    .flatMap((scene) => TEMPORAL_OVERCLAIMS.flatMap((pattern) => scene.currentClue.match(pattern)?.[0] ?? []));
  const safetyProblems = [...jargon, ...highStakes, ...temporalOverclaims.map((phrase) => `시점 단정: ${phrase}`)];
  checks.push(check(
    "safety-style",
    "시점·생활 언어·고위험 단정 회피",
    "safety",
    highStakes.length > 0 || temporalOverclaims.length > 0 ? "critical" : "warning",
    safetyProblems.length === 0 ? 5 : 0,
    5,
    safetyProblems.length === 0 ? "현재·미래 시점 혼동, 기업식 표현, 의료·법률·재정 단정을 발견하지 못했습니다." : `주의 표현: ${safetyProblems.join(", ")}`
  ));

  const score = checks.reduce((sum, item) => sum + item.score, 0);
  const criticalFailures = checks.filter((item) => item.severity === "critical" && !item.passed).map((item) => item.id);
  return {
    score,
    maxScore: 100,
    passed: score >= 85 && criticalFailures.length === 0,
    criticalFailures,
    checks
  };
}
