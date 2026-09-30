"use client";

import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { ProgressBar } from "@/components/ProgressBar";
import { questions } from "@/data/questions";
import { trackInterviewComplete } from "@/lib/analytics";
import { readInterviewSession, saveInterviewSession } from "@/lib/storage";

const total = questions.length;
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
  const [saveMessage, setSaveMessage] = useState("");
  const answerRef = useRef("");
  const questionIdRef = useRef<number>(questions[0].id);
  const restored = useRef(false);
  const currentQuestion = questions[currentIndex];
  const questionText = splitQuestion(currentQuestion.question);

  const persistAnswer = useCallback((nextAnswer = answerRef.current, questionId = questionIdRef.current) => {
    const session = readInterviewSession();
    const otherAnswers = session.answers.filter((item) => item.questionId !== questionId);

    const saved = saveInterviewSession({
      ...session,
      answers: [...otherAnswers, { questionId, answer: nextAnswer }].sort((a, b) => a.questionId - b.questionId)
    });
    if (saved) {
      setLastSavedAt("방금 전");
      setSaveMessage("");
    } else {
      setSaveMessage("답변을 브라우저에 저장하지 못했습니다. 이 탭을 닫지 말고 일반 브라우저 창에서 다시 시도해 주세요.");
    }
  }, []);

  useEffect(() => {
    if (!restored.current) {
      restored.current = true;
      const saved = readInterviewSession();
      const nextIndex = questions.findIndex((question) => !saved.answers.some((item) => item.questionId === question.id && item.answer.trim()));
      if (nextIndex > 0) {
        questionIdRef.current = questions[nextIndex].id;
        answerRef.current = saved.answers.find((item) => item.questionId === questions[nextIndex].id)?.answer || "";
        setCurrentIndex(nextIndex);
        setAnswer(answerRef.current);
        return;
      }
    }
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

  function move(nextIndex: number) {
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
    persistAnswer(answerRef.current, currentQuestion.id);
    const session = readInterviewSession();

    const saved = saveInterviewSession({
      ...session,
      completedAt: new Date().toISOString()
    });
    if (!saved) {
      setSaveMessage("마지막 답변을 저장하지 못했습니다. 이 탭을 유지한 채 다시 시도해 주세요.");
      return;
    }
    trackInterviewComplete();
    router.push("/generating");
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

          </div>
          <Textarea
            id="answer"
            value={answer}
            onChange={handleAnswerChange}
            placeholder="미래의 내가 되어 한두 문장부터 적어보세요."
            className="ko-keep"
          />
          <p className="mt-3 text-sm text-black/55">말로 입력하려면 휴대폰 키보드의 마이크 버튼을 이용해 주세요.</p>
          {saveMessage ? <p className="mt-3 text-sm font-semibold text-red-700" role="alert">{saveMessage}</p> : null}
          <p className="mt-3 text-base font-medium text-black/55">{answer.length}자 · 짧게 시작해도 괜찮아요. 구체적인 장면을 더하면 리포트가 풍부해집니다.</p>
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
