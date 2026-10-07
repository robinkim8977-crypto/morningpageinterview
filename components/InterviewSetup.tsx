"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { readInterviewSession, startNewInterviewSession } from "@/lib/storage";
import { trackInterviewStart, trackLandingAction } from "@/lib/analytics";
import s from "./FutureSelf.module.css";
export function InterviewSetup({ firstAnswer = "" }: {
    firstAnswer?: string;
}) {
    const router = useRouter();
    const [year, setYear] = useState("5");
    const [name, setName] = useState("");
    const [saved, setSaved] = useState(false);
    const [isNew, setNew] = useState(false);
    const [error, setError] = useState("");
    const [ready, setReady] = useState(false);
    useEffect(() => { const session = readInterviewSession(); setSaved(session.answers.some(a => a.answer.trim()) || Boolean(session.completedAt)); setName(session.name); if (session.futureYear > 0)
        setYear(String(session.futureYear)); setReady(true); }, []);
    function begin(e: FormEvent) { e.preventDefault(); const futureYear = Number(year); if (!Number.isInteger(futureYear) || futureYear < 1 || futureYear > 100) {
        setError("1년부터 100년 사이의 미래 시점을 입력해주세요.");
        return;
    } if (!startNewInterviewSession({ futureYear, name: name.trim() || "나", answers: firstAnswer.trim() ? [{ questionId: 1, answer: firstAnswer.trim() }] : [] })) {
        setError("답변을 저장할 수 없습니다. 일반 브라우저에서 다시 시도해주세요.");
        return;
    } trackInterviewStart(); router.push("/interview"); }
    if (!ready)
        return <p role="status">저장된 인터뷰를 확인하고 있어요.</p>;
    if (saved && !isNew)
        return <div>
        <h2 className={s.title}>작성하던 미래가 있어요.</h2>
        <p className={s.description}>기존 질문과 답변을 유지하고 이어서 작성할 수 있어요.</p>
        <div className={s.row}>
        <button className={s.button} onClick={() => { trackLandingAction("interview_resume", "setup"); router.push("/interview"); }}>이어서 작성하기 ↗</button>
        <Link className={s.textButton} href="/report">기존 미래 기억 보기</Link>
        </div>
        <button className={s.textButton} onClick={() => setNew(true)}>새로운 미래의 나 설정하기</button>
        </div>;
    return <form onSubmit={begin}>
    <p className={s.description}>너무 먼 미래가 아니어도 좋아요. 상상해보고 싶은 시간을 골라주세요.</p>{isNew && <p className={s.error}>아래 시작 버튼을 누르면 기존 답변과 리포트가 초기화됩니다. 필요한 결과는 먼저 저장해주세요.</p>}<fieldset>
    <legend className={s.field}>몇 년 후로 떠나볼까요?</legend>
    <div className={s.years}>{[1, 3, 5, 10].map(y => <button type="button" className={s.year} aria-pressed={Number(year) === y} key={y} onClick={() => setYear(String(y))}>{y}년 후</button>)}</div>
    <label className={s.field} htmlFor="future-year">직접 정하기 · 1~100년 후</label>
    <input className={s.input} id="future-year" type="number" min="1" max="100" value={year} onChange={e => setYear(e.target.value)} required/>
    </fieldset>
    <label className={s.field} htmlFor="interview-name">미래의 나를 뭐라고 부를까요?</label>
    <input className={s.input} id="interview-name" maxLength={80} value={name} onChange={e => setName(e.target.value)} placeholder="이름이나 별명을 적어주세요." autoComplete="nickname"/>
    <p className={s.fine}>비워두면 ‘나’라는 이름으로 시작해요.</p>{error && <p className={s.error} role="alert">{error}</p>}<div className={s.actions}>
    <Link className={s.textButton} href="/">← 시작 안내로</Link>
    <button className={s.button} type="submit">{isNew ? "기존 기록을 초기화하고 시작" : "내 캐릭터 설정하기"} ↗</button>
    </div>{isNew && <button type="button" className={s.textButton} onClick={() => setNew(false)}>기존 인터뷰로 돌아가기</button>}<p className={s.fine}>5개 챕터 · 11개 질문 · 작성 시간은 답변에 따라 달라져요.<br />답변은 이 기기·브라우저에 저장됩니다. AI 분석은 미래좌표 구매 시 진행합니다.</p>
    </form>;
}
