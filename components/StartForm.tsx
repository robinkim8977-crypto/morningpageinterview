"use client";

import Link from "next/link";
import { InterviewSetup } from "./InterviewSetup";
import styles from "./LandingSection.module.css";

export function StartForm() {
  return <main className={styles.landing}>
    <header className={styles["site-header"]}><Link href="/" className={styles.wordmark}>THE MORNING<br />PAGE INTERVIEW<span>모닝페이지 인터뷰</span></Link><Link href="/">홈으로</Link></header>
    <section className={`${styles.shell} ${styles["setup-page"]}`}><p className={styles.eyebrow}>MEET YOUR FUTURE SELF</p><h1>미래의 나를<br />만나러 가볼까요?</h1><InterviewSetup /></section>
  </main>;
}
