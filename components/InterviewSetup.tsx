"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { readInterviewSession, startNewInterviewSession } from "@/lib/storage";
import { trackInterviewStart, trackLandingAction } from "@/lib/analytics";
import styles from "./LandingSection.module.css";

const c = (value: string) => value.split(" ").map((key) => styles[key]).join(" ");

export function InterviewSetup({ firstAnswer = "" }: { firstAnswer?: string }) {
  const router = useRouter();
  const [year, setYear] = useState("5");
  const [customYear, setCustomYear] = useState("");
  const [name, setName] = useState("");
  const [hasSaved, setHasSaved] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = readInterviewSession();
    setHasSaved(session.answers.some((item) => item.answer.trim()));
    setName(session.name);
    if (session.futureYear > 0 && !firstAnswer) {
      if ([1, 3, 5, 10].includes(session.futureYear)) setYear(String(session.futureYear));
      else { setYear("custom"); setCustomYear(String(session.futureYear)); }
    }
    setReady(true);
  }, [firstAnswer]);

  function begin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const futureYear = year === "custom" ? Number(customYear) : Number(year);
    if (!Number.isInteger(futureYear) || futureYear < 1 || futureYear > 100) {
      setError("1년부터 100년 사이의 미래 시점을 입력해 주세요."); return;
    }
    if (!name.trim()) { setError("리포트에 넣을 이름이나 별명을 입력해 주세요."); return; }
    const saved = startNewInterviewSession({ futureYear, name: name.trim(), answers: firstAnswer.trim() ? [{ questionId: 1, answer: firstAnswer.trim() }] : [] });
    if (!saved) { setError("답변을 저장할 수 없습니다. 현재 내용을 복사해 보관하고 일반 브라우저에서 다시 시도해 주세요."); return; }
    trackInterviewStart();
    if (firstAnswer.trim()) trackLandingAction("first_answer_saved", "inline_question");
    router.push("/interview");
  }

  if (!ready) return <p role="status">저장된 인터뷰를 확인하고 있습니다.</p>;
  if (hasSaved && !isNew) return <div className={c("resume-box")}>
    <h3>작성하던 인터뷰가 있어요.</h3>
    <p>기존 답변을 유지하고 이어서 작성할 수 있습니다.</p>
    {firstAnswer.trim() && <p className={c("micro")}>방금 적은 첫 답변은 새 인터뷰를 선택할 때 사용합니다. 기존 답변을 덮어쓰지 않습니다.</p>}
    <button className={c("button full-width")} onClick={() => { trackLandingAction("interview_resume", "setup"); router.push("/interview"); }}>이어서 쓰기</button>
    <button className={c("centered-link")} onClick={() => setIsNew(true)}>새 인터뷰 시작 설정</button>
  </div>;

  return <form className={c("setup-form")} onSubmit={begin}>
    <p className={c("dialog-description")}>한두 문장부터 시작해도 괜찮아요. 구체적으로 적을수록 돌아볼 내용이 풍부해집니다.</p>
    {isNew && <p className={c("new-session-note")}>아래 시작 버튼을 누르면 기존 답변과 리포트가 초기화됩니다. 필요한 결과는 먼저 저장해 주세요.</p>}
    <fieldset><legend>몇 년 후의 나를 만나볼까요?</legend><div className={c("year-options")}>
      {[1, 3, 5, 10].map((value) => <label key={value} className={c(`year-option ${year === String(value) ? "selected" : ""}`.trim())}>
        <input type="radio" name="future-year" value={value} checked={year === String(value)} onChange={() => setYear(String(value))} />
        <span><strong>{value}년 후</strong><small>미래의 나</small></span>
      </label>)}
    </div><label><input style={{width:16, minHeight:16, marginRight:8}} type="radio" name="future-year" value="custom" checked={year === "custom"} onChange={() => setYear("custom")} />직접 선택하기</label>
    {year === "custom" && <label>몇 년 후인가요?<input aria-label="직접 입력할 연수" inputMode="numeric" type="number" min="1" max="100" value={customYear} onChange={(e) => setCustomYear(e.target.value)} /></label>}</fieldset>
    <label htmlFor="interview-name">리포트에 넣을 이름 또는 별명<input id="interview-name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} autoComplete="nickname" /></label>
    {firstAnswer.trim() && <p className={c("micro")}>이 페이지에 적은 첫 답변을 저장하고 다음 질문으로 이어갑니다.</p>}
    {error && <p role="alert" className={c("input-error")}>{error}</p>}
    <button className={c("button full-width")} type="submit">{isNew ? "기존 기록을 초기화하고 새로 시작" : firstAnswer.trim() ? "답변 저장하고 인터뷰 계속하기" : "인터뷰 시작하기"}</button>
    {isNew && <button className={c("centered-link")} type="button" onClick={() => setIsNew(false)}>기존 인터뷰로 돌아가기</button>}
    <p className={c("micro")}>11개 질문 · 작성 시간은 답변 길이에 따라 달라집니다.<br />답변은 이 기기·브라우저에 저장됩니다. AI 분석은 유료 리포트 선택 시 진행합니다.</p>
  </form>;
}
