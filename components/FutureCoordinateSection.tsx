"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, Check, RefreshCw } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FUTURE_COORDINATE_ANALYSIS_KEY,
  FUTURE_COORDINATE_ANALYSIS_VERSION,
  FUTURE_COORDINATE_COMMITMENT_KEY,
  isFutureCoordinateAnalysis
} from "@/lib/future-coordinate";
import { clearPaymentReceipt, readPaymentReceipt } from "@/lib/payment";
import { readInterviewSession } from "@/lib/storage";
import type { FutureCoordinateAnalysis, FuturePlan, FutureScene, InterviewSession } from "@/lib/types";

const sceneImages = [
  "/images/future-coordinate-scene-light-shadow.png",
  "/images/future-coordinate-scene-water-light.png",
  "/images/future-coordinate-scene-ripples.png"
];

const sceneLabels = ["THE LIFE YOU BUILT", "THE TURNING POINT", "THE NEXT CHAPTER"];

const roadmapMeta = {
  30: { stage: "NOTICE", korean: "발견하고 알아차리는 단계" },
  90: { stage: "EXPERIMENT", korean: "새로운 방식을 시험하는 단계" },
  365: { stage: "BUILD", korean: "삶에 축적하는 단계" }
} as const;

type Commitment = {
  fingerprint: string;
  action: string;
  date: string;
  duration: string;
  promisedAt?: string;
};

class ReportRequestError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = "ReportRequestError";
    this.retryable = retryable;
  }
}

function localDate(offset = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function validActionDate(value: unknown) {
  return typeof value === "string" && value >= localDate(0) && value <= localDate(3) ? value : localDate(1);
}

function sessionFingerprint(session: InterviewSession) {
  return JSON.stringify({
    version: FUTURE_COORDINATE_ANALYSIS_VERSION,
    name: session.name,
    futureYear: session.futureYear,
    answers: session.answers
  });
}

function createLocalPreviewSession(): InterviewSession {
  return {
    name: "소윤",
    futureYear: 3,
    answers: [
      { questionId: 1, answer: "좋아하는 일을 오래 이어가며 나만의 방식으로 사람들에게 영감을 건네는 사람이 되었습니다." },
      { questionId: 3, answer: "오전에는 조용히 글을 쓰고, 오후에는 사람들과 아이디어를 나누며, 저녁에는 가족과 천천히 시간을 보냅니다." },
      { questionId: 4, answer: "내가 만든 서비스에 도움을 받았다는 첫 편지를 읽던 날, 바라던 삶이 정말 현실이 되었다고 느꼈습니다." },
      { questionId: 5, answer: "매일 아침 가장 중요한 일에 한 시간 먼저 집중하는 작은 습관이 지금의 삶을 만들었습니다." },
      { questionId: 9, answer: "가족과 건강, 자유롭게 창작할 수 있는 시간을 끝까지 지키고 싶습니다." },
      { questionId: 10, answer: "나의 경험과 아이디어를 새로운 서비스로 엮어 더 많은 사람의 변화를 돕고 싶습니다." }
    ]
  };
}

function readCachedAnalysis(fingerprint: string) {
  try {
    const raw = window.localStorage.getItem(FUTURE_COORDINATE_ANALYSIS_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as { fingerprint?: string; analysis?: unknown };
    return cached.fingerprint === fingerprint && isFutureCoordinateAnalysis(cached.analysis) ? cached.analysis : null;
  } catch {
    return null;
  }
}

function suggestedCommitment(fingerprint: string, analysis: FutureCoordinateAnalysis): Commitment {
  return {
    fingerprint,
    action: analysis.firstAction.action,
    date: localDate(1),
    duration: analysis.firstAction.duration
  };
}

function readCommitment(fingerprint: string, analysis: FutureCoordinateAnalysis): Commitment {
  const fallback = suggestedCommitment(fingerprint, analysis);
  try {
    const raw = window.localStorage.getItem(FUTURE_COORDINATE_COMMITMENT_KEY);
    if (!raw) return fallback;
    const saved = JSON.parse(raw) as Partial<Commitment>;
    if (saved.fingerprint !== fingerprint) return fallback;
    return {
      fingerprint,
      action: typeof saved.action === "string" && saved.action.trim() ? saved.action : fallback.action,
      date: validActionDate(saved.date),
      duration: typeof saved.duration === "string" && saved.duration.trim() ? saved.duration : fallback.duration,
      promisedAt: typeof saved.promisedAt === "string" ? saved.promisedAt : undefined
    };
  } catch {
    return fallback;
  }
}

function AnalysisLoading() {
  return (
    <main className="page-shell min-h-screen bg-background">
      <Header />
      <section className="grid min-h-[70vh] place-items-center px-6 text-center">
        <div className="grid justify-items-center">
          <div className="hourglass mb-8" aria-hidden="true" />
          <h1 className="ko-keep text-3xl font-medium tracking-[-0.05em]">미래의 좌표를 찾고 있습니다.</h1>
          <p className="mt-4 text-sm leading-6 text-black/55">세 장면 사이의 흐름과 지금 가능한 다음 한 걸음을 살펴보고 있어요.</p>
        </div>
      </section>
    </main>
  );
}

function EmptyState() {
  return (
    <main className="page-shell min-h-screen bg-background">
      <Header />
      <section className="grid min-h-[70vh] place-items-center px-6 text-center">
        <div className="max-w-xl">
          <h1 className="ko-keep text-[clamp(34px,5vw,58px)] font-medium leading-tight tracking-[-0.06em]">미래좌표를 만들 인터뷰가 아직 없습니다.</h1>
          <p className="ko-keep mx-auto mt-6 max-w-md leading-7 text-black/60">인터뷰를 완료하면 세 가지 장면, 하나의 방향과 지금 가능한 다음 한 걸음을 확인할 수 있어요.</p>
          <Button asChild size="sm" className="mt-8"><Link href="/start">인터뷰 시작하기</Link></Button>
        </div>
      </section>
    </main>
  );
}

function ErrorState({ message, onRetry, retryable }: { message: string; onRetry: () => void; retryable: boolean }) {
  return (
    <main className="page-shell min-h-screen bg-background">
      <Header />
      <section className="grid min-h-[70vh] place-items-center px-6 text-center">
        <div className="max-w-xl">
          <h1 className="ko-keep text-4xl font-medium tracking-[-0.05em]">분석을 잠시 멈췄습니다.</h1>
          <p className="mt-5 leading-7 text-black/60">{message}</p>
          {retryable ? (
            <Button type="button" size="sm" className="mt-8" onClick={onRetry}><RefreshCw size={14} /> 다시 시도하기</Button>
          ) : (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="sm"><a href="mailto:morningpageinterview@gmail.com">고객센터 문의</a></Button>
              <Button asChild size="sm" variant="outline"><Link href="/report">인터뷰 결과로 돌아가기</Link></Button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function AutoGrowingAction({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(96, textarea.scrollHeight)}px`;
  }, [value]);

  return (
    <Textarea
      ref={ref}
      rows={3}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="future-coordinate-action-textarea min-h-24 resize-none overflow-y-hidden rounded-xl border-black/45 bg-transparent px-4 py-3 leading-6"
    />
  );
}

function ScenePage({ scene, index }: { scene: FutureScene; index: number }) {
  return (
    <section className="future-coordinate-sheet future-coordinate-scene-sheet min-h-[880px] border-t border-black/15 px-[clamp(20px,6vw,86px)] py-16 md:py-24">
      {index === 0 ? (
        <header className="future-coordinate-chapter-intro mb-12 max-w-3xl">
          <p className="text-xs font-bold tracking-[0.16em] text-black/45">01 · DISCOVER</p>
          <h2 className="ko-keep mt-3 text-[clamp(30px,4vw,48px)] font-medium tracking-[-0.055em]">미래에서 세 장면을 발견합니다</h2>
          <p className="ko-keep mt-4 max-w-2xl text-sm leading-7 text-black/58 md:text-base">인터뷰에서 가장 빛나는 세 장면을 골랐습니다.<br />당신이 그리고 있는 삶의 모습, 변화의 순간, 그리고 그 너머의 다음 꿈입니다.</p>
        </header>
      ) : null}
      <div className="future-coordinate-scene-layout grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
      <div className={index % 2 ? "future-coordinate-scene-image md:order-2" : "future-coordinate-scene-image"}>
        <Image
          src={sceneImages[index]}
          alt=""
          width={498}
          height={814}
          quality={95}
          sizes="(min-width: 768px) 42vw, calc(100vw - 40px)"
          className="h-[520px] w-full object-cover md:h-[700px]"
        />
      </div>
      <article className={index % 2 ? "future-coordinate-scene-copy md:order-1" : "future-coordinate-scene-copy"}>
        <p className="text-xs font-bold tracking-[0.14em] text-black/45">SCENE 0{index + 1} · {sceneLabels[index]}</p>
        <h2 className="ko-keep mt-4 text-[clamp(34px,4.5vw,58px)] font-medium leading-[1.08] tracking-[-0.06em]">{scene.title}</h2>
        <div className="ko-keep mt-8 space-y-3 text-[15px] leading-7 text-black/68 md:text-base">
          {scene.scene.map((sentence, sentenceIndex) => <p key={`${scene.id}-scene-${sentenceIndex}`}>{sentence}</p>)}
        </div>
        <blockquote className="ko-keep mt-10 border-y border-black/25 py-7 text-[clamp(22px,2.2vw,30px)] font-medium leading-snug tracking-[-0.04em]">“{scene.insight}”</blockquote>
        <div className="mt-10 grid gap-7 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold tracking-[0.12em] text-black/42">이 장면이 말하는 것</p>
            <p className="ko-keep mt-3 text-sm leading-6 text-black/65">{scene.meaning}</p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.12em] text-black/42">현재의 단서</p>
            <p className="ko-keep mt-3 text-sm leading-6 text-black/65">{scene.currentClue}</p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          {scene.values.map((value) => <span key={value} className="rounded-full border border-black/25 px-3 py-1.5 text-xs font-semibold">{value}</span>)}
        </div>
      </article>
      </div>
    </section>
  );
}

function RoadmapPage({ plan }: { plan: FuturePlan }) {
  const meta = roadmapMeta[plan.days];
  return (
    <section className="future-coordinate-sheet grid min-h-[760px] place-items-center border-t border-black/15 px-[clamp(20px,8vw,120px)] py-20">
      <article className="w-full max-w-5xl">
        {plan.days === 30 ? (
          <header className="mb-14 max-w-4xl">
            <p className="text-xs font-bold tracking-[0.16em] text-black/45">03 · COORDINATES</p>
            <h2 className="ko-keep mt-3 text-[clamp(30px,4vw,48px)] font-medium tracking-[-0.055em]">미래로 향하는 세 개의 좌표를 세웁니다</h2>
            <p className="ko-keep mt-4 max-w-3xl text-sm leading-7 text-black/58 md:text-base">30일, 90일, 365일의 좌표를 세웁니다. 미래를 한 번에 완성하려 하지 않고, 지금의 삶에서 시도할 수 있는 변화부터 차례로 연결합니다.</p>
            <p className="ko-keep mt-3 max-w-3xl text-sm leading-6 text-black/45">이 좌표는 미래를 모두 달성하기 위한 마감표가 아니라, 지금의 삶에서 시작해 조금씩 가까워지기 위한 기준입니다.</p>
            <p className="mt-5 text-xs font-bold tracking-[0.13em] text-black/36">NOTICE → EXPERIMENT → BUILD</p>
          </header>
        ) : null}
        <p className="text-sm font-bold tracking-[0.16em] text-black/42">{plan.days} DAYS · {meta.stage}</p>
        <p className="ko-keep mt-2 text-sm font-medium text-black/48">{meta.korean}</p>
        <p className="mt-6 text-[clamp(70px,13vw,170px)] font-medium leading-none tracking-[-0.085em]">{plan.days}</p>
        <h2 className="ko-keep mt-8 text-[clamp(36px,5vw,66px)] font-medium leading-[1.05] tracking-[-0.065em]">{plan.goal}</h2>
        <p className="ko-keep mt-7 max-w-3xl text-base leading-7 text-black/58 md:text-lg">{plan.description}</p>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {plan.actions.map((action, index) => (
            <div key={action} className="border-t border-black/30 pt-5">
              <p className="text-xs font-bold tracking-[0.12em] text-black/38">ACTION 0{index + 1}</p>
              <p className="ko-keep mt-3 text-lg font-medium leading-7">{action}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-[26px] bg-black px-7 py-6 text-white md:px-9">
          <p className="text-xs font-bold tracking-[0.13em] text-white/55">RESULT</p>
          <p className="ko-keep mt-2 text-xl font-medium leading-8 md:text-2xl">{plan.result}</p>
        </div>
      </article>
    </section>
  );
}

export function FutureCoordinateSection() {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [analysis, setAnalysis] = useState<FutureCoordinateAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestIndex, setRequestIndex] = useState(0);
  const [isPreview, setIsPreview] = useState(false);
  const [paymentId, setPaymentId] = useState("");
  const [paymentChecked, setPaymentChecked] = useState(false);
  const [retryable, setRetryable] = useState(true);
  const [commitment, setCommitment] = useState<Commitment>({ fingerprint: "", action: "", date: "", duration: "" });
  const [saved, setSaved] = useState(false);
  const fingerprint = useMemo(() => (session ? sessionFingerprint(session) : ""), [session]);
  const hasAnswers = session?.answers.some((answer) => answer.answer.trim()) ?? false;

  useEffect(() => {
    const storedSession = readInterviewSession();
    const localPreview = process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).get("preview") === "1";
    setIsPreview(localPreview);
    setSession(localPreview ? createLocalPreviewSession() : storedSession);
    setPaymentId(readPaymentReceipt()?.paymentId || "");
    setPaymentChecked(true);
  }, []);

  useEffect(() => {
    if (!session || !paymentChecked) return;
    if (!hasAnswers) { setLoading(false); return; }

    const cached = readCachedAnalysis(fingerprint);
    if (cached) {
      setAnalysis(cached);
      setCommitment(readCommitment(fingerprint, cached));
      setLoading(false);
      return;
    }

    if (process.env.NODE_ENV !== "development" && !paymentId) {
      setError("결제 확인 후 미래좌표 리포트를 만들 수 있습니다.");
      setRetryable(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");
    setRetryable(true);

    fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session, preview: isPreview, paymentId }),
      signal: controller.signal
    })
      .then(async (response) => {
        const data = (await response.json()) as FutureCoordinateAnalysis | { error?: string; message?: string };
        if (!response.ok || !isFutureCoordinateAnalysis(data)) {
          const message = "message" in data && data.message ? data.message : "잠시 후 다시 시도해 주세요.";
          const canRetry = "error" in data && data.error === "PAYMENT_LEDGER_UNAVAILABLE";
          throw new ReportRequestError(message, canRetry);
        }
        window.localStorage.setItem(FUTURE_COORDINATE_ANALYSIS_KEY, JSON.stringify({ fingerprint, analysis: data }));
        const nextCommitment = suggestedCommitment(fingerprint, data);
        window.localStorage.removeItem(FUTURE_COORDINATE_COMMITMENT_KEY);
        clearPaymentReceipt();
        setCommitment(nextCommitment);
        setAnalysis(data);
        setPaymentId("");
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "잠시 후 다시 시도해 주세요.");
        setRetryable(reason instanceof ReportRequestError ? reason.retryable : true);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [fingerprint, hasAnswers, isPreview, paymentChecked, paymentId, requestIndex, session]);

  function savePromise() {
    if (!commitment.action.trim() || !commitment.duration.trim()) return;
    const next = {
      ...commitment,
      fingerprint,
      action: commitment.action.trim(),
      date: validActionDate(commitment.date),
      duration: commitment.duration.trim(),
      promisedAt: new Date().toISOString()
    };
    window.localStorage.setItem(FUTURE_COORDINATE_COMMITMENT_KEY, JSON.stringify(next));
    setCommitment(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2400);
  }

  if (!session) return <AnalysisLoading />;
  if (!hasAnswers) return <EmptyState />;
  if (loading) return <AnalysisLoading />;
  if (error || !analysis) return <ErrorState message={error || "결과를 불러오지 못했습니다."} retryable={retryable} onRetry={() => setRequestIndex((value) => value + 1)} />;

  return (
    <main className="page-shell min-h-screen bg-[#F8F7F4] future-coordinate-page">
      <Header />

      <section className="future-coordinate-sheet grid min-h-[760px] gap-10 px-[clamp(20px,6vw,86px)] pb-20 pt-5 md:grid-cols-[0.78fr_1.42fr] md:items-center md:pb-28">
        <Image src="/images/future-coordinate-hero.png" alt="부드러운 빛이 비치는 천의 질감" width={1122} height={1402} priority quality={95} sizes="(min-width: 768px) 34vw, calc(100vw - 40px)" className="h-[380px] w-full object-cover md:h-[610px]" />
        <div className="md:pl-2">
          <p className="mb-5 text-xs font-bold tracking-[0.13em] text-black/45">FUTURE COORDINATE</p>
          <h1 className="ko-keep text-[clamp(42px,5.5vw,76px)] font-medium leading-[1.03] tracking-[-0.07em]">미래와 현재 사이의<br />다음 한 걸음</h1>
          <p className="ko-keep mt-8 max-w-2xl text-[15px] font-medium leading-7 text-black/65 md:text-base">
            세 장면이 가리키는 하나의 방향을 발견하고,<br />그 미래를 서두르지 않으면서 오늘 할 수 있는 일을 찾았습니다.
          </p>
          <div className="mt-10 border-y border-black/20 py-5">
            <p className="text-xs font-bold tracking-[0.12em] text-black/62 sm:text-sm">DISCOVER → DIRECTION → COORDINATES → DEPARTURE</p>
            <p className="ko-keep mt-2 text-xs leading-5 text-black/45">세 장면 발견 → 하나의 방향 → 미래로 향하는 좌표 → 72시간 첫 행동</p>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button asChild size="sm"><Link href="/report"><ArrowLeft size={14} /> 인터뷰 결과로 돌아가기</Link></Button>
            <span className="rounded-full border border-black/20 px-3 py-1.5 text-xs font-semibold text-black/48">{analysis.mode === "ai" ? "AI 분석 완료" : "예시 데이터 · API 미연결"}</span>
          </div>
        </div>
      </section>

      {analysis.scenes.map((scene, index) => <ScenePage key={scene.id} scene={scene} index={index} />)}

      <section className="future-coordinate-sheet grid min-h-[800px] place-items-center border-t border-black/15 px-[clamp(20px,8vw,120px)] py-20">
        <div className="w-full max-w-5xl text-center">
          <p className="text-xs font-bold tracking-[0.16em] text-black/42">02 · DIRECTION</p>
          <h2 className="ko-keep mt-4 text-[clamp(32px,4.5vw,54px)] font-medium leading-[1.08] tracking-[-0.06em]">세 장면을 관통하는 하나의 방향을 발견했습니다</h2>
          <p className="ko-keep mx-auto mt-5 max-w-2xl text-sm leading-7 text-black/52 md:text-base">서로 달라 보이는 미래의 장면들이 실제로 어떤 하나의 삶의 방향을 가리키고 있는지 살펴봅니다.</p>
          <p className="mt-12 text-xs font-bold tracking-[0.16em] text-black/38">YOUR DIRECTION</p>
          <p className="ko-keep mx-auto mt-6 max-w-4xl text-[clamp(28px,4vw,52px)] font-medium leading-[1.12] tracking-[-0.055em]">{analysis.direction.title}</p>
          <p className="ko-keep mx-auto mt-6 max-w-2xl text-base leading-7 text-black/58">{analysis.direction.summary}</p>
          <div className="mx-auto mt-14 grid max-w-xl justify-items-center gap-4">
            {analysis.direction.steps.map((step, index) => (
              <div key={step} className="contents">
                <div className="w-full rounded-full border border-black/30 px-6 py-4 text-lg font-semibold">{step}</div>
                {index < analysis.direction.steps.length - 1 ? <ArrowDown size={20} className="text-black/35" /> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {analysis.roadmap.map((plan) => <RoadmapPage key={plan.days} plan={plan} />)}

      <section className="future-coordinate-sheet grid min-h-[800px] gap-10 border-t border-black/15 px-[clamp(20px,6vw,86px)] py-16 md:grid-cols-[0.82fr_1.18fr] md:items-center md:py-28">
        <Image src="/images/future-coordinate-commitment.png" alt="빛과 그림자 사이의 작은 그릇" width={1122} height={1402} quality={95} sizes="(min-width: 768px) 40vw, calc(100vw - 40px)" className="h-[430px] w-full object-cover md:h-[610px]" />
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-black/45">04 · DEPARTURE</p>
          <h2 className="ko-keep mt-3 text-[clamp(30px,4vw,48px)] font-medium tracking-[-0.055em]">이제 첫걸음을 내딛습니다</h2>
          <p className="ko-keep mt-4 max-w-xl text-sm leading-7 text-black/52">72시간 안에 실행할 첫 행동을 약속합니다. 미래를 완성하는 일이 아니라, 미래와 현재를 처음 연결하는 작은 행동입니다.</p>
          <p className="mt-10 text-xs font-bold tracking-[0.13em] text-black/45">72 HOURS · FIRST ACTION</p>
          <h3 className="mt-3 text-[clamp(34px,4.4vw,58px)] font-medium tracking-[-0.065em]">72시간 안의 첫 행동</h3>
          <p className="ko-keep mt-5 max-w-xl text-sm font-medium leading-7 text-black/60 md:text-base">
            미래는 거대한 결심보다 작고 분명한 행동에서 시작됩니다.<br />{analysis.firstAction.reason}
          </p>

          <div className="mt-12 grid max-w-2xl gap-5">
            <label className="grid gap-2 text-sm font-semibold">
              첫 행동
              <AutoGrowingAction value={commitment.action} onChange={(action) => setCommitment((value) => ({ ...value, action, promisedAt: undefined }))} placeholder={analysis.firstAction.action} />
            </label>
            <div className="grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="grid gap-2 text-sm font-semibold">
                실행 날짜
                <Input type="date" min={localDate(0)} max={localDate(3)} value={validActionDate(commitment.date)} onChange={(event) => setCommitment((value) => ({ ...value, date: validActionDate(event.target.value), promisedAt: undefined }))} className="h-12 rounded-xl border-black/45 bg-transparent px-4" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                예상 소요시간
                <Input value={commitment.duration} onChange={(event) => setCommitment((value) => ({ ...value, duration: event.target.value, promisedAt: undefined }))} placeholder={analysis.firstAction.duration} className="h-12 rounded-xl border-black/45 bg-transparent px-4" />
              </label>
              <Button type="button" size="sm" className="h-12 min-w-36" disabled={!commitment.action.trim() || !commitment.duration.trim()} onClick={savePromise}>
                {saved ? <><Check size={14} /> 약속했어요</> : "첫 행동 약속하기"}
              </Button>
            </div>
            {commitment.promisedAt && !saved ? <p className="text-xs font-medium text-black/45">이 기기에 첫 행동이 저장되었습니다.</p> : null}
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-center gap-4 border-t border-black/15 px-5 py-16 future-coordinate-actions">
        <Button asChild size="sm" className="min-w-48"><Link href="/report"><ArrowLeft size={14} /> 인터뷰 결과로 돌아가기</Link></Button>
        <Button type="button" size="sm" className="min-w-48" onClick={() => window.print()}>PDF로 저장하기</Button>
      </section>
    </main>
  );
}
