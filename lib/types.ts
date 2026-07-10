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
