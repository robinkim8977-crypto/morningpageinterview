"use client";

import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { ProgressBar } from "@/components/ProgressBar";
import { questions } from "@/data/questions";
import { readInterviewSession, saveInterviewSession } from "@/lib/storage";

const total = questions.length;
const speechUnavailableMessage = "음성 기록을 사용할 수 없습니다. 마이크 권한을 확인한 후 Safari/Google에서 열어주세요.";

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: {
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function splitQuestion(question: string) {
  const [lead, ...rest] = question.split("\n\n");
  return {
    lead,
    body: rest.join("\n\n")
  };
}

export function InterviewSection() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("방금 전");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechMessage, setSpeechMessage] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const answerRef = useRef("");
  const questionIdRef = useRef<number>(questions[0].id);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const stopRequestedRef = useRef(false);
  const currentQuestion = questions[currentIndex];
  const questionText = splitQuestion(currentQuestion.question);

  const persistAnswer = useCallback((nextAnswer = answerRef.current, questionId = questionIdRef.current) => {
    const session = readInterviewSession();
    const otherAnswers = session.answers.filter((item) => item.questionId !== questionId);

    saveInterviewSession({
      ...session,
      answers: [...otherAnswers, { questionId, answer: nextAnswer }].sort((a, b) => a.questionId - b.questionId)
    });
    setLastSavedAt("방금 전");
  }, []);

  useEffect(() => {
    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    const isAppleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    recognition.continuous = !isAppleMobile;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setIsListening(true);
      setSpeechMessage("");
    };
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalText += transcript;
        else interimText += transcript;
      }

      if (finalText.trim()) {
        const separator = answerRef.current && !answerRef.current.endsWith(" ") ? " " : "";
        const nextAnswer = `${answerRef.current}${separator}${finalText.trim()}`;
        answerRef.current = nextAnswer;
        setAnswer(nextAnswer);
        persistAnswer(nextAnswer, questionIdRef.current);
      }
      setInterimTranscript(interimText);
    };
    recognition.onerror = (event) => {
      const messages: Record<string, string> = {
        "not-allowed": speechUnavailableMessage,
        "service-not-allowed": speechUnavailableMessage,
        "audio-capture": speechUnavailableMessage,
        network: "음성 인식 연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.",
        "no-speech": "음성이 들리지 않았어요. 버튼을 다시 누르고 가까이에서 말해 주세요.",
        "language-not-supported": speechUnavailableMessage,
        aborted: ""
      };
      if (!(event.error === "aborted" && stopRequestedRef.current)) {
        setSpeechMessage(messages[event.error] ?? speechUnavailableMessage);
      }
      setIsListening(false);
      setInterimTranscript("");
    };
    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      stopRequestedRef.current = false;
    };
    recognitionRef.current = recognition;

    return () => {
      stopRequestedRef.current = true;
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [persistAnswer]);

  useEffect(() => {
    questionIdRef.current = currentQuestion.id;

    const session = readInterviewSession();
    const nextAnswer = session.answers.find((item) => item.questionId === currentQuestion.id)?.answer || "";
    answerRef.current = nextAnswer;
    setAnswer(nextAnswer);
  }, [currentQuestion.id]);

  useEffect(() => {
    const saveLatestAnswer = () => persistAnswer();
    const saveWhenHidden = () => {
      if (document.visibilityState === "hidden") {
        saveLatestAnswer();
      }
    };

    const id = window.setInterval(saveLatestAnswer, 3000);
    window.addEventListener("pagehide", saveLatestAnswer);
    document.addEventListener("visibilitychange", saveWhenHidden);

    return () => {
      saveLatestAnswer();
      window.clearInterval(id);
      window.removeEventListener("pagehide", saveLatestAnswer);
      document.removeEventListener("visibilitychange", saveWhenHidden);
    };
  }, [persistAnswer]);

  function handleAnswerChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const nextAnswer = event.target.value;
    answerRef.current = nextAnswer;
    setAnswer(nextAnswer);
    persistAnswer(nextAnswer, currentQuestion.id);
  }

  function toggleListening() {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      stopRequestedRef.current = true;
      recognition.stop();
      return;
    }

    stopRequestedRef.current = false;
    setSpeechMessage("");
    setInterimTranscript("");
    try {
      recognition.start();
    } catch {
      setSpeechMessage("음성 기록을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setIsListening(false);
    }
  }

  function move(nextIndex: number) {
    stopRequestedRef.current = true;
    recognitionRef.current?.stop();
    persistAnswer(answerRef.current, currentQuestion.id);
    const nextQuestion = questions[nextIndex];
    const nextSession = readInterviewSession();
    const nextAnswer = nextSession.answers.find((item) => item.questionId === nextQuestion.id)?.answer || "";
    questionIdRef.current = nextQuestion.id;
    answerRef.current = nextAnswer;
    setCurrentIndex(nextIndex);
    setAnswer(nextAnswer);
  }

  function completeInterview() {
    stopRequestedRef.current = true;
    recognitionRef.current?.stop();
    persistAnswer(answerRef.current, currentQuestion.id);
    const session = readInterviewSession();

    saveInterviewSession({
      ...session,
      completedAt: new Date().toISOString()
    });
    router.push("/report");
  }

  return (
    <main className="grid min-h-[100dvh] bg-background lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_470px]">
      <section className="flex min-h-[100dvh] flex-col">
        <Header />
        <div className="flex flex-1 flex-col px-[clamp(28px,4vw,64px)] pb-64 pt-16 md:pb-32">
          <p className="mb-9 text-6xl font-medium leading-none tracking-[-0.06em] md:text-7xl">Q.{currentQuestion.id}</p>
          <div className="ko-keep max-w-5xl">
            <p className="text-4xl font-medium leading-[1.08] tracking-[-0.05em] md:text-5xl">
              {questionText.lead}
            </p>
            {questionText.body ? (
              <p className="mt-8 whitespace-pre-line text-xl font-medium leading-[1.45] tracking-[-0.035em] md:text-2xl">
                {questionText.body}
              </p>
            ) : null}
          </div>
          <div className="my-14 border-t hairline" />
          <div className="mb-4 flex flex-nowrap items-center gap-2 sm:gap-3">
            <label className="block shrink-0 text-xl font-extrabold tracking-[-0.04em] sm:text-2xl" htmlFor="answer">
              [답변하기]
            </label>
            <Button
              type="button"
              variant={isListening ? "default" : "ghost"}
              onClick={toggleListening}
              disabled={!speechSupported}
              aria-pressed={isListening}
              className={isListening
                ? "h-11 shrink-0 bg-red-500 px-3 text-white hover:bg-red-600 sm:px-5"
                : "h-11 shrink-0 border border-black/20 px-3 sm:px-5"}
            >
              {isListening ? <Square size={15} fill="currentColor" /> : <Mic size={17} />}
              {isListening ? "기록 중지" : "음성 기록"}
            </Button>
          </div>
          <Textarea
            id="answer"
            value={answer}
            onChange={handleAnswerChange}
            placeholder="미래의 기억을 떠올리며 상세하게 적어주세요."
            className="ko-keep"
          />
          {isListening ? (
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-red-600" role="status">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
              듣고 있어요{interimTranscript ? ` · ${interimTranscript}` : "…"}
            </p>
          ) : null}
          {!speechSupported ? (
            <p className="mt-3 text-sm font-semibold text-red-600" role="alert">{speechUnavailableMessage}</p>
          ) : null}
          {speechMessage ? <p className="mt-3 text-sm font-semibold text-red-600" role="alert">{speechMessage}</p> : null}
          <p className="mt-3 text-2xl font-medium text-black/35">{answer.length}자 / 권장 300자 이상</p>
        </div>
        <footer className="fixed bottom-0 left-0 right-0 grid gap-4 border-t hairline bg-background px-[clamp(20px,3vw,30px)] pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 md:grid-cols-[1fr_auto_1fr] md:items-end lg:right-[360px] xl:right-[470px]">
          <div>
            <p className="mb-1 text-3xl font-medium tracking-[-0.04em]">
              {currentQuestion.id}/{total}
            </p>
            <ProgressBar current={currentQuestion.id} total={total} />
          </div>
          <p className="self-center text-center text-sm font-medium text-black/75">마지막 저장 : {lastSavedAt}</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" disabled={currentIndex === 0} onClick={() => move(currentIndex - 1)}>
              <ArrowLeft size={18} /> 이전질문
            </Button>
            {currentIndex === total - 1 ? (
              <Button onClick={completeInterview}>
                미래 기억 보기 <ArrowRight size={18} />
              </Button>
            ) : (
              <Button onClick={() => move(currentIndex + 1)}>
                다음 질문 <ArrowRight size={18} />
              </Button>
            )}
          </div>
        </footer>
      </section>
      <aside className="relative hidden min-h-screen border-l hairline lg:block">
        <img src="/images/interview-side.png" alt="" className="h-full w-full object-cover" />
        <div className="absolute right-10 top-11 flex items-center gap-2 text-sm">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          REC
        </div>
      </aside>
    </main>
  );
}
