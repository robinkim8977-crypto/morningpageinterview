"use client";

import { useEffect, useRef, useState, type ReactNode, type KeyboardEvent } from "react";
import { BookOpen, Check, ChevronDown, Clock3, LockKeyhole, X } from "lucide-react";
import { InterviewSetup } from "./InterviewSetup";
import { FUTURE_COORDINATE_PRICE } from "@/lib/payment";
import { trackLandingAction } from "@/lib/analytics";
import styles from "./LandingSection.module.css";

const c = (names: string) => names.split(" ").filter(Boolean).map((name) => styles[name]).join(" ");
const price = `${FUTURE_COORDINATE_PRICE.toLocaleString("ko-KR")}원`;
const sample = {
  answer: "큰 창가 옆의 작은 살롱에서 일하고 있어요. 하루에 감당할 수 있는 만큼만 예약을 받고, 한 사람에게 충분히 집중해요. 고객이 믿고 다시 찾아오는 디자이너가 됐어요.",
  scene: "창가의 살롱에서 한 사람씩 집중하는 하루",
  sceneText: "차분한 살롱에서 좋아하는 음악을 작게 틀어 둡니다. 감당할 수 있는 만큼만 예약을 받아 한 사람의 스타일을 충분히 살핍니다.",
  direction: "한 사람을 세심히 읽는 기준을 기록하고, 신뢰의 방식으로 오래 확장해 가기",
  action: "최근 한 사람과 나눈 대화를 떠올려, 그 사람이 편해 보인 점·불편해 보인 점·다음에 신경 쓸 점을 세 줄로 적어보세요."
};
const plans = [
  { days: 30, title: "내가 지키고 싶은 신뢰의 기준 찾기", copy: "14일 동안 하루 한 번, 만남에서 상대가 편해 보인 점·불편해 보인 점·다음에 신경 쓸 점을 세 줄로 적습니다." },
  { days: 90, title: "발견한 기준을 실제 선택에 적용하기", copy: "6주 동안 매주 한 번, 가까운 대화에서 상대가 원하는 점이나 불편한 점을 먼저 묻고 반응을 한 줄로 적습니다." },
  { days: 365, title: "효과가 확인된 방식을 생활의 리듬으로", copy: "매달 한 번, 효과가 있었던 기준 하나를 다음 달의 대화·일 처리·시간 사용 중 한 장면에 적용합니다." }
];
const faqs = [
  ["어떤 방식으로 답하면 되나요?", "원하는 미래에 이미 도착한 내가 되어 답합니다. 그곳의 하루, 사람, 선택을 떠올려보세요. 긴 글일 필요는 없습니다. 한두 문장부터 시작하고, 장면이 떠오르면 더 구체적으로 적어도 좋습니다."],
  ["시간은 얼마나 걸리나요?", "인터뷰는 11개 질문으로 구성되며, 작성 시간은 답변 길이와 생각하는 시간에 따라 달라집니다. 짧게 시작하거나 충분히 시간을 들여 작성할 수 있어요. 같은 기기와 브라우저에서 이어서 작성할 수 있습니다."],
  [`무료 인터뷰와 ${price} 리포트는 어떻게 다른가요?`, "인터뷰와 답변을 정리한 ‘미래 기억 매거진’은 무료이며 AI 분석을 포함하지 않습니다. ‘미래좌표’는 답변 속 세 장면과 하나의 방향을 AI로 분석하고, 30·90·365일 로드맵과 72시간 첫 행동을 제안하는 선택 구매 상품입니다."],
  ["로그인이나 이메일 입력이 필요한가요?", "회원가입과 이메일 입력 없이 이름 또는 별명으로 시작합니다. 답변과 결과는 현재 기기·브라우저에 저장됩니다. 이메일 재발송이나 다른 기기에서의 자동 복원은 제공하지 않으니 결과를 PDF 또는 이미지로 보관해 주세요."],
  ["AI는 무엇을 분석하나요?", "미래좌표를 구매하면 인터뷰에 쓴 표현과 장면을 AI가 분석해 원하는 삶의 방향과 실행 단서를 정리합니다. AI 분석 시 답변이 서버와 AI 서비스로 전송됩니다. 결과는 자기성찰을 위한 참고 콘텐츠이며 실제 미래를 예측하거나 보장하지 않습니다."],
  ["결제와 결과 확인은 어떻게 하나요?", `${price} 한 번 결제이며 정기결제가 아닙니다. 인터뷰 전에도 구매할 수 있고, 결제 확인과 인터뷰 완료 후 AI 리포트가 생성됩니다. 생성에는 수 분 이상 걸릴 수 있습니다. 생성·열람에 문제가 생기면 결제·취소·환불 정책의 문의 경로로 알려주세요.`]
];

function TabButtons({ id, label, items, value, onChange, className }: { id: string; label: string; items: string[]; value: number; onChange: (value: number) => void; className: string }) {
  function key(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % items.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;
    event.preventDefault(); onChange(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  }
  return <div role="tablist" aria-label={label} className={c(className)}>{items.map((item, i) => <button key={item} id={`${id}-tab-${i}`} role="tab" aria-selected={i === value} aria-controls={`${id}-panel-${i}`} tabIndex={i === value ? 0 : -1} data-state={i === value ? "active" : "inactive"} onClick={() => onChange(i)} onKeyDown={(event) => key(event, i)}>{item}</button>)}</div>;
}
function CheckList({ children }: { children: string[] }) {
  return <ul className={c("check-list")}>{children.map((text) => <li key={text}><Check aria-hidden="true" />{text}</li>)}</ul>;
}
function Eyebrow({ children }: { children: ReactNode }) { return <p className={c("eyebrow")}>{children}</p>; }
function ReportContent({ index }: { index: number }) {
  if (index === 0) return <><span className={c("little-label")}>01 / DISCOVER</span><h3>{sample.scene}</h3><p>{sample.sceneText}</p><div className={c("evidence-note")}><span>답변에서 발견한 단서</span><p>“한 사람에게 충분히 집중”, “감당할 수 있는 만큼”<br />성공의 기준은 규모보다 집중과 신뢰에 가깝습니다.</p></div><div className={c("tags")}><span>집중</span><span>신뢰</span><span>지속성</span></div></>;
  if (index === 1) return <><span className={c("little-label")}>02 / DIRECTION</span><h3>{sample.direction}</h3><p>크기보다 깊이를 선택하는 삶. 나만의 세심함을 기록하고, 반복 가능한 신뢰의 방식으로 만들어갑니다.</p><div className={c("evidence-note")}><span>나의 선택으로 이어가기</span><p>충분히 집중할 수 있는 시간과 관계를 기준으로, 일상의 작은 선택부터 돌아봅니다.</p></div></>;
  if (index === 2) return <><span className={c("little-label")}>03 / COORDINATES</span><h3>지금부터 쌓아갈 작은 변화</h3><div className={c("mini-plans")}>{plans.map((plan) => <div key={plan.days}><strong>{plan.days}<span>일</span></strong><p>{plan.title}</p></div>)}</div><p className={c("paper-caption")}>답변에서 찾은 기준을 발견하고, 시험하고, 쌓아갑니다.</p></>;
  return <><span className={c("little-label")}>04 / FIRST ACTION</span><h3>72시간 안에 시작할 첫 행동</h3><p>{sample.action}</p><div className={c("action-time")}><Clock3 size={16} aria-hidden="true" />이 예시의 실행 시간: 약 10분</div><div className={c("evidence-note")}><span>내가 직접 남기는 약속</span><p>제안을 참고해 언제, 무엇을 할지 나의 72시간 행동 약속을 직접 적습니다.</p></div></>;
}

export function LandingSection() {
  const [perspective, setPerspective] = useState(1);
  const [reportTab, setReportTab] = useState(0);
  const [firstAnswer, setFirstAnswer] = useState("");
  const [trialError, setTrialError] = useState(false);
  const [modal, setModal] = useState<"interview" | "report" | null>(null);
  const [seed, setSeed] = useState("");
  const [sticky, setSticky] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const originFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const hero = document.getElementById("hero-primary");
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setSticky(!entry.isIntersecting), { threshold: 0 });
    observer.observe(hero); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!modal || !dialog.current) return;
    originFocus.current = document.activeElement as HTMLElement;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current.showModal();
    return () => { document.body.style.overflow = before; originFocus.current?.focus(); };
  }, [modal]);
  function close() { dialog.current?.close(); setModal(null); }
  function openInterview(placement: string, answer = "") { setSeed(answer); setModal("interview"); trackLandingAction("landing_cta_click", placement); }
  function openReport() { setModal("report"); trackLandingAction("report_sample_open", "report"); }
  function startButton(label: string, placement: string, extra = "") { return <button className={c(`button ${extra}`)} onClick={() => openInterview(placement)}>{label}</button>; }

  return <div className={styles.landing}>
    <a className={c("skip-link")} href="#landing-main">본문으로 바로가기</a>
    <header className={c("site-header")}><a href="#top" className={c("wordmark")} aria-label="모닝페이지 인터뷰 홈">THE MORNING<br />PAGE INTERVIEW<span>모닝페이지 인터뷰</span></a><nav aria-label="주요 메뉴"><a href="#how">인터뷰 소개</a><a href="#report">리포트 예시</a><a href="#pricing">가격 안내</a>{startButton("무료 인터뷰 시작", "header", "header-cta")}</nav></header>
    <main id="landing-main">
      <section id="top" className={c("hero shell")} aria-labelledby="landing-title"><div className={c("hero-copy")}>
        <Eyebrow>MEET THE FUTURE YOU ALREADY KNOW</Eyebrow><h1 id="landing-title">미래의 나를<br />인터뷰해보세요.</h1>
        <p className={c("hero-description")}>원하는 미래의 내가 되어 <strong>11개의 질문</strong>에 답합니다.<br className={c("desktop-break")} /> 답변은 나만의 미래 기억 매거진으로,<br className={c("desktop-break")} /> 선택한 AI 분석은 오늘 시작할 행동으로 이어집니다.</p>
        <div className={c("hero-facts")}><span><Clock3 aria-hidden="true" />내 속도대로</span><span><BookOpen aria-hidden="true" />11개의 질문</span><span><LockKeyhole aria-hidden="true" />회원가입 없이</span></div>
        <div className={c("hero-actions")}><button id="hero-primary" className={c("button")} onClick={() => openInterview("hero")}>무료로 인터뷰 시작하기</button><a className={c("text-link")} href="#report">결과 리포트 먼저 보기</a></div>
        <p className={c("micro")}>인터뷰·기본 매거진 무료 · AI 미래좌표 <strong>{price}</strong> · 구매는 선택</p>
      </div><div className={c("hero-image")}><img src="/images/redesign/future-room.webp" alt="부드러운 햇빛과 나뭇잎의 그림자가 드리운 벽" width="498" height="814" fetchPriority="high" /><div className={c("archive-top")}><span>FUTURE ARCHIVE</span><span>VOL. 01</span></div><div className={c("archive-copy")}><span className={c("archive-year")}>2031</span><p>그곳의 나는<br />어떤 하루를<br />살고 있을까요?</p><span className={c("archive-sign")}>A letter to my future self.</span></div><div className={c("archive-bottom")}><span>YOUR STORY STARTS HERE</span><span>01 / 11</span></div></div></section>
      <section className={c("flow shell")} aria-label="서비스 이용 순서">{[["미래 시점을 선택하고", "1년, 3년, 5년, 10년 후의 나"], ["미래의 내가 되어 답하면", "11개의 질문으로 장면을 발견"], ["오늘의 방향이 보입니다", "매거진 확인 후 AI 분석은 선택"]].map(([title, body], i) => <div className={c("flow-step")} key={title}><span className={c("step-number")}>0{i + 1}</span><div><h2>{title}</h2><p>{body}</p></div></div>)}</section>
      <section id="how" className={c("perspective-section")}><div className={c("shell perspective-grid")}><div className={c("question-image")}><img src="/images/redesign/question-card.webp" alt="한 손에 든 종이 질문 카드" width="1254" height="1254" loading="lazy" /><div className={c("question-image-copy")}><span>{perspective ? "FROM THE FUTURE" : "FROM THE PRESENT"}</span><p>{perspective ? <>나는 어떻게<br />여기까지 왔지?</> : <>어떻게<br />저기까지 가지?</>}</p></div></div><div className={c("perspective-copy")}><Eyebrow>01 / A DIFFERENT POINT OF VIEW</Eyebrow><h2>질문의 시점을 바꾸면,<br />내가 원하는 삶이<br />조금 더 선명해집니다.</h2><div className={c("perspective-tabs")}><TabButtons id="perspective" label="질문의 시점" items={["현재의 질문", "미래의 질문"]} value={perspective} onChange={setPerspective} className="line-tabs" />{[0, 1].map((i) => <div key={i} role="tabpanel" id={`perspective-panel-${i}`} aria-labelledby={`perspective-tab-${i}`} hidden={perspective !== i} tabIndex={0}><p>{i ? <>“나는 어떻게 여기까지 왔지?”<br />원하는 미래에 도착했다고 상상해보세요. 그곳의 하루와 지나온 선택을 이야기합니다.</> : <>“어떻게 저기까지 가지?”<br />아직 가보지 않은 길을 생각하면, 가능성과 방법부터 따지게 됩니다.</>}</p></div>)}</div><p className={c("perspective-footnote")}>미래의 기억 속에서 현재를 발견하다.</p></div></div></section>
      <section id="try" className={c("trial-section shell")}><div className={c("section-heading")}><div><Eyebrow>02 / YOUR FIRST QUESTION</Eyebrow><h2>한 문장으로,<br />미래의 나를 만나보세요.</h2></div><p>잘 쓸 필요는 없어요.<br />그곳의 내가 들려주는 말처럼 답해보세요.</p></div><div className={c("trial-card")}><div className={c("trial-question")}><span className={c("little-label")}>5년 후의 나에게 / QUESTION 01</span><h3>지금의 당신은<br />어떤 사람입니까?</h3><p>직업, 일상, 태도.<br />가장 먼저 떠오르는 모습부터 시작하세요.</p></div><form className={c("trial-form")} onSubmit={(event) => { event.preventDefault(); if (!firstAnswer.trim()) { setTrialError(true); return; } setTrialError(false); openInterview("inline_question", firstAnswer); }}><label htmlFor="first-answer">미래의 내가 되어 답해보세요</label><textarea id="first-answer" maxLength={3000} rows={4} placeholder="저는…" value={firstAnswer} onChange={(event) => setFirstAnswer(event.target.value)} aria-describedby="trial-hint" />{trialError && <p role="alert" className={c("input-error")}>한 문장만 적어주세요. 예시를 참고해도 좋습니다.</p>}<div className={c("trial-bottom")}><button type="button" className={c("text-link")} onClick={() => { if (!firstAnswer.trim() || window.confirm("작성한 첫 답변을 예시 답변으로 바꿀까요?")) setFirstAnswer(sample.answer); }}>답변 예시 사용하기</button><button className={c("button")} type="submit">다음 질문 만나기</button></div><p className={c("micro")} id="trial-hint">입력한 첫 답변을 실제 인터뷰로 이어갑니다. AI 분석은 유료 리포트 선택 시 진행합니다.</p></form></div></section>
      <section id="report" className={c("report-section")}><div className={c("shell")}><div className={c("section-heading")}><div><Eyebrow>03 / FROM YOUR WORDS TO YOUR WAY</Eyebrow><h2>당신의 답변이,<br />당신만의 좌표가 됩니다.</h2></div><p>막연한 다짐을 넘어,<br />오늘 무엇을 할지 정할 수 있도록.</p></div><div className={c("report-layout")}><aside className={c("source-note")}><span className={c("little-label")}>THE ORIGINAL WORDS / 답변 예시</span><p className={c("source-quote")}>“{sample.answer}”</p><div className={c("source-person")}><span className={c("initial")}>R</span><div><strong>로빈의 미래 인터뷰</strong><span>헤어디자이너 · 예시</span></div></div><p className={c("sample-disclosure")}>서비스 구성을 설명하기 위한 예시입니다.<br />실제 분석은 입력한 답변에 따라 달라집니다.</p></aside><div className={c("report-paper")}><div className={c("paper-masthead")}><span>THE FUTURE COORDINATE</span><span>ROBIN / SAMPLE</span></div><TabButtons id="report" label="리포트 구성" items={["세 장면", "하나의 방향", "실행 계획", "첫 행동"]} value={reportTab} onChange={setReportTab} className="report-tabs" />{[0, 1, 2, 3].map((i) => <div key={i} role="tabpanel" tabIndex={0} id={`report-panel-${i}`} aria-labelledby={`report-tab-${i}`} hidden={reportTab !== i}><ReportContent index={i} /></div>)}<div className={c("paper-footer")}><span>YOUR WORDS. YOUR DIRECTION.</span><button className={c("text-link")} onClick={openReport}>리포트 예시 더 보기</button></div></div></div></div></section>
      <section id="pricing" className={c("shell")}><div className={c("section-heading")}><div><Eyebrow>04 / A SMALL STEP, A CLEARER DIRECTION</Eyebrow><h2>먼저 인터뷰하고,<br />리포트는 그다음에 선택하세요.</h2></div></div><div className={c("pricing-grid")}><article className={c("price-free")}><div className={c("price-kicker")}><span>THE INTERVIEW</span><span>START HERE</span></div><h3>미래 인터뷰</h3><p className={c("price")}>무료</p><p className={c("price-description")}>원하는 미래를 직접 이야기하고,<br />내 답변을 매거진으로 정리합니다.</p><CheckList>{["원하는 미래 시점 선택", "11개의 인터뷰 질문", "답변을 정리한 미래 기억 매거진", "PDF·이미지 저장"]}</CheckList>{startButton("무료 인터뷰 시작하기", "pricing_free", "button-outline")}</article><article className={c("price-paid")}><div className={c("price-kicker")}><span>THE FUTURE COORDINATE</span><span>선택 구매</span></div><h3>미래좌표 리포트</h3><p className={c("price")}>{FUTURE_COORDINATE_PRICE.toLocaleString("ko-KR")}<span>원</span></p><p className={c("price-description")}>미래의 장면을 오늘의 선택과<br />실행할 수 있는 행동으로 연결합니다.</p><CheckList>{["답변에 담긴 미래의 세 장면 AI 분석", "세 장면을 관통하는 하나의 방향", "30·90·365일 로드맵", "72시간 첫 행동 제안과 나의 약속"]}</CheckList><a href="/future-coordinate#purchase" className={c("button button-light")} onClick={() => trackLandingAction("landing_cta_click", "pricing_paid")}>{price} 리포트 구매하기</a><p className={c("micro")}>인터뷰 전·후 구매 가능 · 1회 결제 · 정기결제 없음<br />결제 확인과 인터뷰 완료 후 리포트 생성</p></article></div></section>
      <section id="faq" className={c("faq-section shell")}><div><Eyebrow>05 / BEFORE YOU BEGIN</Eyebrow><h2>시작하기 전,<br />궁금한 것들.</h2><a className={c("contact-link")} href="mailto:morningpageinterview@gmail.com">문의하기</a></div><div className={c("faq-list")}>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={18} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></section>
      <section className={c("final-section")}><div className={c("shell final-grid")}><Eyebrow>A CLEARER TOMORROW BEGINS TODAY</Eyebrow><div><h2>더 많은 계획보다,<br />더 선명한 미래부터.</h2><p>미래의 내가 기억하는 오늘은 어떤 모습일까요?</p></div>{startButton("무료로 인터뷰 시작하기", "bottom")}</div></section>
    </main>
    <div className={c(`mobile-sticky ${sticky && !modal ? "is-visible" : ""}`)} aria-hidden={!sticky || !!modal}><div><strong>미래의 나를 만나는 시간</strong><span>인터뷰 무료 · AI 리포트 {price}</span></div><button tabIndex={sticky && !modal ? 0 : -1} className={c("button")} onClick={() => openInterview("sticky")}>무료로 시작</button></div>
    {modal && <dialog ref={dialog} className={c(`morning-dialog ${modal === "report" ? "report-dialog" : ""}`)} aria-labelledby="landing-dialog-title" onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close(); } }}><button autoFocus className={c("dialog-close")} aria-label="닫기" onClick={close}><X size={22} /></button><p className={c("dialog-brand")}>THE MORNING PAGE INTERVIEW</p><h2 id="landing-dialog-title" className={c("dialog-title")}>{modal === "interview" ? "미래의 나를 만나러 가볼까요?" : "미래좌표 리포트 예시"}</h2>{modal === "interview" ? <InterviewSetup firstAnswer={seed} /> : <><p className={c("dialog-description")}>예시 답변을 바탕으로 축약한 구성입니다. 실제 결과는 직접 작성한 답변에 따라 달라집니다.</p><div className={c("full-report-scene")}><ReportContent index={0} /></div><div className={c("full-report-direction")}><ReportContent index={1} /></div><div className={c("full-report-plans")}>{plans.map((plan) => <article key={plan.days}><div className={c("plan-number")}>{plan.days}<span>DAYS</span></div><div><h3>{plan.title}</h3><p>{plan.copy}</p></div></article>)}</div><div className={c("full-report-action")}><ReportContent index={3} /></div><a className={c("button full-width")} href="/future-coordinate#purchase" onClick={() => trackLandingAction("landing_cta_click", "sample_paid")}>{price} 미래좌표 구매하기</a></>}</dialog>}
  </div>;
}
