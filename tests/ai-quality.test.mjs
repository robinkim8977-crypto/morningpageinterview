import assert from "node:assert/strict";
import test from "node:test";
import { evaluateAiQuality } from "../lib/ai-quality.ts";
import { createPreviewAnalysis } from "../lib/future-coordinate.ts";

function completeSession() {
  const answers = [
    "좋아하는 일을 오래 이어가며 관계와 건강도 지키는 사람입니다.",
    "햇빛이 드는 조용한 작업실에서 책과 식물을 곁에 둡니다.",
    "아침에는 글을 쓰고 오후에는 사람들과 대화하며 저녁에는 가족과 쉽니다.",
    "제가 만든 작은 글을 읽은 사람이 다시 시작할 용기를 얻었다고 말한 순간입니다.",
    "매일 좋아하는 작업의 이유를 한 문장으로 기록하는 습관입니다.",
    "다른 사람의 기준을 따라가느라 제 취향을 잃었던 시기가 힘들었습니다.",
    "친구에게 도움을 요청하고 짧게라도 다시 기록한 행동이 힘이 됐습니다.",
    "모든 기회를 잡아야 한다는 생각을 내려놓았습니다.",
    "가족과 친구, 건강과 자유와 창작을 지키고 싶습니다.",
    "경험을 작은 모임에서 나누어 다른 사람의 시작을 돕고 싶습니다.",
    "서두르지 않아도 반복해온 것은 너의 길이 된다고 말하고 싶습니다."
  ];
  return {
    schemaVersion: 2,
    questionnaireVersion: 2,
    name: "품질 테스트 사용자",
    futureYear: 5,
    answers: answers.map((answer, index) => ({ questionId: index + 1, answer }))
  };
}

function validReport() {
  return structuredClone(createPreviewAnalysis(completeSession()));
}

test("기준을 충족하는 리포트는 85점 이상으로 통과한다", () => {
  const result = evaluateAiQuality(completeSession(), validReport());
  assert.equal(result.passed, true);
  assert.ok(result.score >= 85);
  assert.deepEqual(result.criticalFailures, []);
});

test("필수 결과 형식이 깨지면 즉시 실패한다", () => {
  const result = evaluateAiQuality(completeSession(), { scenes: [] });
  assert.equal(result.passed, false);
  assert.equal(result.score, 0);
  assert.deepEqual(result.criticalFailures, ["schema"]);
});

test("답변에 없는 퇴사와 직원 채용을 만들면 치명 오류로 실패한다", () => {
  const report = validReport();
  report.roadmap[0].actions = ["이번 달 안에 퇴사하고 직원 채용 계획 세우기"];
  const result = evaluateAiQuality(completeSession(), report);
  assert.equal(result.passed, false);
  assert.ok(result.criticalFailures.includes("unsupported-assumptions"));
  assert.match(result.checks.find((item) => item.id === "unsupported-assumptions").detail, /퇴사/);
});

test("72시간 행동이 두 시간이거나 우선 질문 근거가 없으면 실패한다", () => {
  const report = validReport();
  report.firstAction.duration = "2시간";
  report.firstAction.sourceQuestionIds = [1];
  report.firstAction.action = "오늘 계획을 정리하기";
  const result = evaluateAiQuality(completeSession(), report);
  assert.equal(result.passed, false);
  assert.ok(result.criticalFailures.includes("first-action"));
});

test("사례별 핵심 단서가 결과에 반영됐는지 점수화한다", () => {
  const result = evaluateAiQuality(completeSession(), validReport(), {
    anchorGroups: [["한 문장"], ["가족"], ["결과에 없는 고유 단서"]]
  });
  const evidence = result.checks.find((item) => item.id === "case-evidence");
  assert.equal(evidence.score, 7);
  assert.equal(evidence.passed, false);
});

test("답변하지 않은 질문 번호를 근거로 표시하면 실패한다", () => {
  const sparseSession = completeSession();
  sparseSession.answers = sparseSession.answers.filter((answer) => answer.questionId !== 2);
  const result = evaluateAiQuality(sparseSession, validReport());
  assert.equal(result.passed, false);
  assert.ok(result.criticalFailures.includes("source-question-grounding"));
});

test("미래 역할극의 행동을 이미 현재의 사실이라고 단정하면 실패한다", () => {
  const report = validReport();
  report.scenes[0].currentClue = "미래에 적은 기록 습관이 이미 현재의 생활에도 있습니다.";
  const result = evaluateAiQuality(completeSession(), report);
  const safetyStyle = result.checks.find((item) => item.id === "safety-style");
  assert.equal(result.passed, false);
  assert.equal(safetyStyle.passed, false);
  assert.match(safetyStyle.detail, /시점 단정/);
  assert.ok(result.criticalFailures.includes("safety-style"));
});

test("미래 직업의 회의나 팀원을 현재 첫 행동의 전제로 사용하면 실패한다", () => {
  const report = validReport();
  report.firstAction.action = "최근 끝난 회의에서 팀원과 내린 결정의 이유를 한 문장으로 적기";
  report.firstAction.duration = "5분";
  report.firstAction.sourceQuestionIds = [5];
  const result = evaluateAiQuality(completeSession(), report);
  const firstAction = result.checks.find((item) => item.id === "first-action");
  assert.equal(result.passed, false);
  assert.equal(firstAction.passed, false);
  assert.match(firstAction.detail, /회의, 팀원/);
  assert.ok(result.criticalFailures.includes("first-action"));
});

test("첫 행동이 답변을 중립적으로 바꾸고 근거 설명에 원래 습관을 밝히면 통과한다", () => {
  const report = validReport();
  report.firstAction.action = "최근 내린 작은 선택 하나의 이유와 남은 질문을 세 줄로 적기";
  report.firstAction.duration = "5분";
  report.firstAction.reason = "미래에 결정의 이유를 세 줄로 남겼다고 답한 습관을 현재 환경과 관계없이 옮겼습니다.";
  report.firstAction.sourceQuestionIds = [5];
  const result = evaluateAiQuality(completeSession(), report);
  const firstAction = result.checks.find((item) => item.id === "first-action");
  assert.equal(firstAction.passed, true);
  assert.match(firstAction.detail, /답변 어휘 연결 충족/);
});
