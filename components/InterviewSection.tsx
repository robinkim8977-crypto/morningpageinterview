"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { questionsForVersion, UNKNOWN_ANSWER, hasMeaningfulAnswer } from "@/data/questions";
import { decodeChoice, encodeChoice } from "@/lib/interview-choices";
import { readInterviewSession, saveInterviewSession } from "@/lib/storage";
import { readPaymentReceipt } from "@/lib/payment";
import { trackInterviewComplete } from "@/lib/analytics";
import type { InterviewSession } from "@/lib/types";
import { FutureSelfCard } from "./FutureSelfCard";
import s from "./FutureSelf.module.css";
export function InterviewSection() {
    const router = useRouter();
    const [session, setSession] = useState<InterviewSession | null>(null);
    const [index, setIndex] = useState(0);
    const [answer, setAnswer] = useState("");
    const [error, setError] = useState("");
    const [reveal, setReveal] = useState(false);
    const [review, setReview] = useState(false);
    const latest = useRef<{
        session: InterviewSession;
        id: number;
        answer: string;
    } | null>(null);
    const persist = useCallback(() => { const value = latest.current; if (!value)
        return false; const next = { ...value.session, answers: [...value.session.answers.filter(a => a.questionId !== value.id), { questionId: value.id, answer: value.answer }].sort((a, b) => a.questionId - b.questionId), completedAt: undefined }; if (!saveInterviewSession(next)) {
        setError("답변을 저장하지 못했습니다. 이 탭을 닫지 말고 내용을 복사해 보관해주세요.");
        return false;
    } latest.current = { ...value, session: next }; setSession(next); setError(""); return true; }, []);
    useEffect(() => { const saved = readInterviewSession(); if (!saved.futureYear) {
        router.replace("/start");
        return;
    } if (saved.completedAt && readPaymentReceipt()) { router.replace("/future-coordinate/result"); return; } const list = questionsForVersion(saved.questionnaireVersion); const nextIndex = saved.completedAt ? 0 : list.findIndex(q => !saved.answers.some(a => a.questionId === q.id && a.answer.trim())); const i = nextIndex < 0 ? list.length - 1 : nextIndex; const text = saved.answers.find(a => a.questionId === list[i].id)?.answer || ""; setSession(saved); setIndex(i); setAnswer(text); latest.current = { session: saved, id: list[i].id, answer: text }; }, [router]);
    useEffect(() => { const save = () => persist(); const hidden = () => { if (document.visibilityState === "hidden")
        save(); }; const id = window.setInterval(save, 3000); window.addEventListener("pagehide", save); document.addEventListener("visibilitychange", hidden); return () => { window.clearInterval(id); window.removeEventListener("pagehide", save); document.removeEventListener("visibilitychange", hidden); }; }, [persist]);
    if (!session)
        return <main className={s.page}>
        <section className={s.shell}>
        <p role="status">미래의 기록을 불러오고 있어요.</p>
        </section>
        </main>;
    const list = questionsForVersion(session.questionnaireVersion);
    const q = list[index];
    const [lead, ...body] = q.question.split("\n\n");
    const decoded = decodeChoice(answer, q);
    const isNew = session.questionnaireVersion === 3;
    function change(value: string) { setAnswer(value); if (latest.current) {
        latest.current.answer = value;
        persist();
    } }
    function move(i: number) { if (!persist())
        return; const saved = latest.current!.session; const text = saved.answers.find(a => a.questionId === list[i].id)?.answer || ""; latest.current = { session: saved, id: list[i].id, answer: text }; setIndex(i); setAnswer(text); setReveal(false); setReview(false); setError(""); window.scrollTo(0, 0); }
    function next() { if (q.kind === "choice" && decoded.selected.length + (decoded.custom.trim() ? 1 : 0) > (q.max || 1)) {
        setError(`직접 입력도 포함해 최대 ${q.max}개까지 선택해주세요.`);
        return;
    } if (!persist())
        return; if (isNew && q.id === 4) {
        setReveal(true);
        window.scrollTo(0, 0);
        return;
    } if (index < list.length - 1)
        move(index + 1);
    else {
        setReview(true);
        window.scrollTo(0, 0);
    } }
    function complete() { const saved = latest.current!.session; if (!saved.answers.some(a => hasMeaningfulAnswer(a.answer))) {
        setError("미래 기억에 남길 선택이나 답변을 하나 이상 적어주세요.");
        return;
    } const nextSession = { ...saved, completedAt: new Date().toISOString() }; if (!saveInterviewSession(nextSession)) {
        setError("마지막 기록을 저장하지 못했습니다. 이 탭을 유지한 채 다시 시도해주세요.");
        return;
    } latest.current = null; trackInterviewComplete(); router.push("/generating"); }
    const cardSession = { ...session, answers: [...session.answers.filter(a => a.questionId !== q.id), { questionId: q.id, answer }] };
    return <main className={s.page}>
    <header className={s.header}>
    <Link href="/" className={s.brand}>THE MORNING PAGE<small>INTERVIEW / 미래의 나 만들기</small>
    </Link>
    <span className={s.fine}>{isNew ? `${session.futureYear}년 후의 ${session.name}` : "이전 인터뷰 이어 쓰기"}</span>
    </header>
    <section className={s.shell}>{reveal ? <>
        <div className={s.center}>
        <p className={s.eyebrow}>HELLO, FUTURE ME</p>
        <h1 className={s.title}>조금씩 모습이 보이네요.</h1>
        <p className={s.description}>방금 고른 모습은 앞으로 쓸 이야기의 출발점이에요.<br />이제 이 사람의 하루를 살아볼까요?</p>
        </div>
        <div className={s.reveal}>
        <FutureSelfCard session={cardSession}/>
        </div>
        <div className={s.actions}>
        <button className={s.textButton} onClick={() => setReveal(false)}>← 선택 다듬기</button>
        <button className={s.button} onClick={() => move(index + 1)}>이 사람의 아침으로 가기 ↗</button>
        </div>
        </> : review ? <>
        <p className={s.eyebrow}>YOUR FIRST FUTURE</p>
        <h1 className={s.title}>이 미래를 기록으로 남길까요?</h1>
        <p className={s.description}>선택과 답변 {session.answers.filter(a => hasMeaningfulAnswer(a.answer)).length}개를 남겼어요. 아직 떠오르지 않은 부분은 비워두어도 괜찮아요.</p>{isNew && <div className={s.reveal}>
            <FutureSelfCard session={session}/>
            </div>}<div className={s.actions}>
        <button className={s.textButton} onClick={() => setReview(false)}>← 마지막 답변으로</button>
        <button className={s.button} onClick={complete}>내 미래 기억 펼치기 ↗</button>
        </div>
        </> : <>
        <div className={s.chapter}>
        <span>{q.phase} / {q.theme}</span>
        <span>{index + 1} / {list.length}</span>
        </div>
        <div className={s.progress} aria-label={`${list.length}개 중 ${index + 1}번째 질문`}>{list.map((item, i) => <span key={item.id} className={i <= index ? s.on : ""}/>)}</div>
        <div className={s.layout}>
        <div>
        <h1 className={s.title}>{lead}</h1>
        <p className={s.description} style={{ whiteSpace: "pre-line" }}>{body.join("\n\n")}</p>{q.kind === "choice" ? <>
            <p className={s.fine}>{q.max === 1 ? "하나 선택" : `최대 ${q.max}개 선택`} · 직접 입력할 수도 있어요.</p>
            <div className={s.choices}>{q.options?.map(option => <button key={option} className={s.choice} aria-pressed={decoded.selected.includes(option)} onClick={() => { const selected = decoded.selected.includes(option) ? decoded.selected.filter(x => x !== option) : q.max === 1 ? [option] : [...decoded.selected, option]; const custom = q.max === 1 ? "" : decoded.custom; if (selected.length + (custom.trim() ? 1 : 0) > (q.max || 1)) {
                    setError(`최대 ${q.max}개까지 고를 수 있어요. 기존 선택을 눌러 바꿔주세요.`);
                    return;
                } change(encodeChoice(selected, custom)); }}>{option}<span aria-hidden="true">{decoded.selected.includes(option) ? "✓" : "＋"}</span>
                </button>)}</div>
            <label className={s.field} htmlFor="custom">나만의 표현으로 추가하기</label>
            <input id="custom" className={s.input} maxLength={100} value={decoded.custom} placeholder="선택지에 없다면 직접 적어주세요." onChange={e => change(encodeChoice(q.max === 1 ? [] : decoded.selected, e.target.value))}/>
            <button className={s.textButton} aria-pressed={decoded.unknown} onClick={() => change(decoded.unknown ? "" : UNKNOWN_ANSWER)}>{decoded.unknown ? "✓ " : ""}아직 모르겠어요</button>
            </> : <>
            <label className={s.field} htmlFor="answer">{q.kind === "short" ? "작은 행동 하나 적어보기" : "미래의 내가 되어 들려주기"}</label>{q.kind === "short" ? <input id="answer" className={s.input} value={answer} maxLength={8000} placeholder={q.placeholder} onChange={e => change(e.target.value)}/> : <textarea id="answer" className={s.textarea} value={answer} maxLength={8000} placeholder={q.placeholder || "한두 문장부터 적어보세요."} onChange={e => change(e.target.value)}/>}<div className={s.count}>
            <span>{answer.length}자 · 한 문장이어도 좋아요</span>
            <span>최대 8,000자</span>
            </div>{q.hints && <details className={s.hint} key={q.id}>
                <summary>막막하면 힌트 보기</summary>{q.hints.map(h => <p key={h}>{h}</p>)}</details>}<p className={s.fine}>말로 입력하려면 휴대폰 키보드의 마이크 버튼을 이용해주세요.</p>
            </>}<div className={s.actions}>
        <button className={s.textButton} disabled={index === 0} onClick={() => move(index - 1)}>← 이전으로</button>
        <button className={s.button} onClick={next}>{index === list.length - 1 ? "기록 확인하기" : "다음으로"} ↗</button>
        </div>
        <p className={s.saved}>이 기기·브라우저에 자동 저장 · {q.kind === "choice" ? "선택은 돌아와 바꿀 수 있어요." : "아직 떠오르지 않으면 비워두고 넘어가도 괜찮아요."}</p>
        </div>{isNew && <FutureSelfCard session={cardSession}/>}</div>
        </>}{error && <p className={s.error} role="alert">{error}</p>}</section>
    </main>;
}
