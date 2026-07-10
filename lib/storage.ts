"use client";

import type { InterviewAnswer, InterviewSession } from "@/lib/types";
import { QUESTIONNAIRE_VERSION, questions } from "@/data/questions";

export const INTERVIEW_STORAGE_KEY = "morning-page-interview-session";
export const INTERVIEW_STORAGE_VERSION = 2;

const REPORT_STORAGE_KEYS = [
  "answers",
  "generatedReport",
  "reportData",
  "finalReportJson",
  "analysisNote",
  "reportDraft",
  "currentQuestionIndex",
  "reportFingerprint",
  "pdfReportData",
  "morning-page-generated-report",
  "morning-page-report-error",
  "morning-page-report-in-progress",
  "morning-page-report-data",
  "morning-page-final-report-json",
  "morning-page-analysis-note",
  "morning-page-report-draft",
  "morning-page-report-fingerprint",
  "morning-page-pdf-report-data"
] as const;

export const emptySession: InterviewSession = {
  schemaVersion: INTERVIEW_STORAGE_VERSION,
  questionnaireVersion: QUESTIONNAIRE_VERSION,
  futureYear: 0,
  name: "",
  answers: []
};

function removeStoredSession() {
  window.localStorage.removeItem(INTERVIEW_STORAGE_KEY);
}

function normalizeAnswers(value: unknown): InterviewAnswer[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const questionIds = new Set<number>(questions.map((question) => question.id));
  const byQuestion = new Map<number, string>();

  value.forEach((item) => {
    if (!item || typeof item !== "object") {
      return;
    }

    const answer = item as Partial<InterviewAnswer>;

    if (typeof answer.questionId !== "number" || typeof answer.answer !== "string") {
      return;
    }

    if (!questionIds.has(answer.questionId)) {
      return;
    }

    byQuestion.set(answer.questionId, answer.answer);
  });

  return Array.from(byQuestion.entries())
    .map(([questionId, answer]) => ({ questionId, answer }))
    .sort((a, b) => a.questionId - b.questionId);
}

export function readInterviewSession(): InterviewSession {
  if (typeof window === "undefined") {
    return emptySession;
  }

  const raw = window.localStorage.getItem(INTERVIEW_STORAGE_KEY);
  if (!raw) {
    return emptySession;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<InterviewSession>;

    if (
      parsed.schemaVersion !== INTERVIEW_STORAGE_VERSION ||
      parsed.questionnaireVersion !== QUESTIONNAIRE_VERSION
    ) {
      removeStoredSession();
      return emptySession;
    }

    return {
      ...emptySession,
      futureYear: typeof parsed.futureYear === "number" ? parsed.futureYear : 0,
      name: typeof parsed.name === "string" ? parsed.name : "",
      answers: normalizeAnswers(parsed.answers),
      completedAt: typeof parsed.completedAt === "string" ? parsed.completedAt : undefined
    };
  } catch {
    removeStoredSession();
    return emptySession;
  }
}

export function saveInterviewSession(session: InterviewSession) {
  window.localStorage.setItem(
    INTERVIEW_STORAGE_KEY,
    JSON.stringify({
      schemaVersion: INTERVIEW_STORAGE_VERSION,
      questionnaireVersion: QUESTIONNAIRE_VERSION,
      futureYear: session.futureYear,
      name: session.name,
      answers: normalizeAnswers(session.answers),
      completedAt: session.completedAt
    })
  );
}

export function clearReportStorage() {
  if (typeof window === "undefined") {
    return;
  }

  REPORT_STORAGE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  });
}

export function resetInterviewState() {
  if (typeof window === "undefined") {
    return;
  }

  clearReportStorage();
  window.localStorage.setItem(INTERVIEW_STORAGE_KEY, JSON.stringify(emptySession));
}

export function startNewInterviewSession(session: InterviewSession) {
  clearReportStorage();
  saveInterviewSession({
    schemaVersion: INTERVIEW_STORAGE_VERSION,
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    futureYear: session.futureYear,
    name: session.name,
    answers: [],
    completedAt: undefined
  });
}
