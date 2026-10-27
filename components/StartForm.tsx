"use client";
import Link from "next/link";
import { InterviewSetup } from "./InterviewSetup";
import s from "./FutureSelf.module.css";
export function StartForm() {
    return <main className={`${s.page} ${s.journeyPage}`}>
    <header className={s.header}>
    <Link href="/" className={s.brand}>THE MORNING PAGE<small>INTERVIEW / 모닝페이지 인터뷰</small>
    </Link>
    <Link href="/">홈으로</Link>
    </header>
    <section className={`${s.shell} ${s.setupShell}`}>
    <aside className={s.setupLandscape} aria-label="미래로 향하는 초대">
      <p className={s.eyebrow}>A LETTER TO YOUR FUTURE SELF</p>
      <p className={s.setupQuote}>The next chapter<br /><em>starts with you.</em></p>
      <span>정답을 찾는 대신,<br />가능한 나를 그려보는 시간.</span>
      <p className={s.landscapeCaption}>YOUR JOURNEY / 01 — 11</p>
    </aside>
    <div className={s.setupPanel}>
    <p className={s.eyebrow}>BEFORE WE BEGIN</p>
    <h1 className={s.title}>어느 시간의 나를<br />만나러 갈까요?</h1>
    <InterviewSetup />
    </div>
    </section>
    </main>;
}
