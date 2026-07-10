"use client";

import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { ProgressBar } from "@/components/ProgressBar";
import { questions } from "@/data/questions";
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
  const answerRef = useRef("");
  const questionIdRef = useRef<number>(questions[0].id);
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

    saveInterviewSession({
      ...session,
      completedAt: new Date().toISOString()
    });
    router.push("/report");
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_470px]">
      <section className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 flex-col px-[clamp(28px,4vw,64px)] pb-28 pt-16">
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
          <label className="mb-4 block text-2xl font-extrabold tracking-[-0.04em]" htmlFor="answer">
            [답변하기]
          </label>
          <Textarea
            id="answer"
            value={answer}
            onChange={handleAnswerChange}
            placeholder="미래의 기억을 떠올리며 상세하게 적어주세요."
            className="ko-keep"
          />
          <p className="mt-2 text-2xl font-medium text-black/35">{answer.length}자 / 권장 300자 이상</p>
        </div>
        <footer className="fixed bottom-0 left-0 right-0 grid gap-4 border-t hairline bg-background px-[clamp(20px,3vw,30px)] py-5 md:grid-cols-[1fr_auto_1fr] md:items-end lg:right-[360px] xl:right-[470px]">
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
