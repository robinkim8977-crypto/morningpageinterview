export type InterviewAnswer = {
  questionId: number;
  answer: string;
};

export type InterviewSession = {
  schemaVersion?: number;
  questionnaireVersion?: number;
  futureYear: number;
  name: string;
  answers: InterviewAnswer[];
  completedAt?: string;
};

export type FuturePlan = {
  days: 30 | 90 | 365;
  stage: "NOTICE" | "EXPERIMENT" | "BUILD";
  goal: string;
  description: string;
  actions: [string] | [string, string];
  result: string;
};

export type FutureScene = {
  id: string;
  role: "life" | "turning-point" | "expansion";
  title: string;
  sourceQuestionIds: number[];
  scene: [string, string] | [string, string, string];
  meaning: string;
  values: [string, string, string] | [string, string, string, string] | [string, string, string, string, string];
  currentClue: string;
  insight: string;
};

export type FutureDirection = {
  title: string;
  summary: string;
  steps: [string, string, string] | [string, string, string, string];
};

export type FutureFirstAction = {
  action: string;
  duration: string;
  reason: string;
  sourceQuestionIds: number[];
};

export type FutureCoordinateAnalysis = {
  scenes: [FutureScene, FutureScene, FutureScene];
  direction: FutureDirection;
  roadmap: [FuturePlan, FuturePlan, FuturePlan];
  firstAction: FutureFirstAction;
  mode: "ai" | "preview";
  generatedAt?: string;
  model?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
};
