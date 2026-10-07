"use client";
import Link from "next/link";
import { InterviewSetup } from "./InterviewSetup";
import s from "./FutureSelf.module.css";
export function StartForm() {
    return <main className={s.page}>
    <header className={s.header}>
    <Link href="/" className={s.brand}>THE MORNING PAGE<small>INTERVIEW / 모닝페이지 인터뷰</small>
    </Link>
    <Link href="/">홈으로</Link>
    </header>
    <section className={s.shell} style={{ maxWidth: 760 }}>
    <p className={s.eyebrow}>BEFORE WE BEGIN</p>
    <h1 className={s.title}>어느 시간의 나를<br />만나러 갈까요?</h1>
    <InterviewSetup />
    </section>
    </main>;
}
