"use client";
import Link from "next/link";
import { FutureSelfCard } from "./FutureSelfCard";
import { trackLandingAction } from "@/lib/analytics";
import { FUTURE_COORDINATE_PRICE } from "@/lib/payment";
import s from "./FutureSelf.module.css";
const price = `${FUTURE_COORDINATE_PRICE.toLocaleString("ko-KR")}원`;
const faqs = [
    ["지금의 나와 달라도 괜찮나요?", "괜찮아요. 이 인터뷰는 원하는 미래의 내가 되어 답하는 상상입니다. 지금의 성격, 직업, 환경과 달라도 좋아요. 성격과 관심부터 고르고, 뒤로 갈수록 미래의 하루와 변화를 한두 문장씩 적습니다."],
    ["얼마나 길게 써야 하나요?", "5개 챕터, 11개 질문입니다. 초반에는 선택으로 시작하고, 후반에는 단어나 한 문장부터 써도 괜찮아요. 정해진 분량은 없으며, 작성 시간은 생각하는 시간과 답변 길이에 따라 달라집니다."],
    ["무료와 유료는 어떻게 다른가요?", `미래의 나 만들기와 선택·답변을 정리한 미래 기억 매거진은 무료입니다. AI 해석은 포함하지 않습니다. ${price} 선택 구매인 미래좌표는 답변 속 세 장면과 하나의 방향, 30·90·365일 로드맵과 72시간 첫 행동을 제안합니다.`],
    ["작성한 내용은 어디에 저장되나요?", "회원가입 없이 이용하며, 답변과 결과는 현재 기기·브라우저에 저장됩니다. 같은 브라우저에서 이어 쓸 수 있지만 다른 기기의 자동 복원이나 이메일 재발송은 제공하지 않습니다. 결과는 PDF 또는 이미지로 보관해주세요."],
    ["AI 분석은 어떻게 진행되나요?", "결제 확인과 인터뷰 완료 후 답변이 서버와 AI 서비스로 전송되어 해석을 만듭니다. 생성에는 수 분 이상 걸릴 수 있습니다. 미래의 성격·성과를 예측하거나 실제 미래의 실현을 보장하지 않는 자기성찰용 참고 콘텐츠입니다."],
    ["결제한 뒤 문제가 생기면 어떻게 하나요?", "2,900원 1회 결제이며 정기결제가 아닙니다. 인터뷰 전·후 구매할 수 있습니다. 생성·열람 문제가 발생하면 하단 결제·취소·환불 정책의 문의 경로로 알려주세요."]
];
export function LandingSection() {
    const track = (placement: string) => trackLandingAction("landing_cta_click", placement);
    return <div className={s.page}>
    <a className={s.skip} href="#main">본문으로 바로가기</a>
    <header className={s.header}>
    <Link href="/" className={s.brand}>THE MORNING PAGE<small>INTERVIEW / 모닝페이지 인터뷰</small>
    </Link>
    <nav className={s.nav} aria-label="주요 메뉴">
    <a href="#how">이용 방법</a>
    <a href="#coordinate">미래좌표</a>
    <Link href="/start" onClick={() => track("header")}>무료로 시작 ↗</Link>
    </nav>
    </header>
    <main id="main" className={s.shell}>
    <section className={s.hero}>
    <div>
    <p className={s.eyebrow}>CREATE YOUR FUTURE SELF</p>
    <h1 className={s.title}>몇 년 후의 나를<br />만들어볼까요?</h1>
    <p className={s.copy}>우리는 언제라도 새로운 내가 될 수 있어요.<br />어떤 사람이 되고 싶은지 그려보면, 그 모습에 가까운 행동을 선택하는 기준이 생깁니다. 작은 선택을 쌓으며 원하는 삶의 방향을 찾아보세요.</p>
    <p className={s.description}>성격, 좋아하는 일, 머물고 싶은 곳부터 골라보세요.<br />그리고 그 사람이 살아가는 하루를 함께 상상해볼 거예요.</p>
    <p className={s.fine}>게임처럼 가볍게 고르고 · 한 장면을 쓰고 · 내 방향을 발견하기</p>
    <div className={s.row}>
    <Link className={s.button} href="/start" onClick={() => track("hero")}>미래의 나 만들기 ↗</Link>
    <Link className={s.textButton} href="/future-coordinate#purchase" onClick={() => track("hero_paid")}>미래 분석 &amp; 좌표 설정 {price}</Link>
    </div>
    <p className={s.fine}>인터뷰·미래 기억 무료 · AI 해석 선택 구매<br />5개 챕터 · 11개 질문 · 회원가입 없이 내 속도대로</p>
    </div>
    <FutureSelfCard sample/>
    </section>
    <section className={s.section} id="how">
    <p className={s.eyebrow}>HOW YOUR NEXT CHAPTER UNFOLDS</p>
    <h2 className={s.title}>가볍게 시작해,<br />조금씩 선명해지는 미래.</h2>
    <div className={s.grid}>{[["01 / 고르기", "미래의 나 설정하기", "성격과 관심, 가치와 공간을 골라요. 아직 모르겠다면 넘어가도 괜찮아요."], ["02 / 상상하기", "그 사람의 하루 살아보기", "작은 아침 행동에서 시작해, 좋아하는 순간과 변화의 장면을 들려주세요."], ["03 / 발견하기", "오늘의 나에게 가져오기", "내가 쓴 미래를 기록으로 만나고, 원한다면 AI 해석으로 현재의 한 걸음을 찾아보세요."]].map(([n, title, copy]) => <article className={s.tile} key={n}>
        <p className={s.eyebrow}>{n}</p>
        <h3>{title}</h3>
        <p>{copy}</p>
        </article>)}</div>
    </section>
    <section className={s.premium} id="coordinate">
    <p className={s.eyebrow}>FUTURE COORDINATION</p>
    <h2 className={s.title}>미래 좌표 설정하기</h2>
    <p className={s.description}>정체성은 내가 나에 대해 만들어가는 이야기입니다.<br />11개의 질문으로 그린 미래의 나를 AI가 분석해, 세 장면을 잇는 하나의 방향으로 정리합니다.</p>
    <p className={s.description}>미래의 장면에서 내가 원하는 삶의 기준을 찾고, 그 방향으로 가고 있는지 스스로 살펴볼 수 있는 좌표를 제안합니다. 앞으로 시험해볼 행동을 통해 원하는 미래에 가까워지는 선택을 돕습니다.</p>
    <div className={s.grid}>{[["세 장면 · 하나의 방향", "답변에 담긴 공간·관계·변화를 바탕으로, 반복되는 가치와 선택의 기준을 해석합니다."], ["30·90·365일 좌표", "중요한 기준을 알아차리고, 생활에서 시험하고, 잘 맞는 방식을 쌓는 로드맵을 제안합니다."], ["72시간 첫 행동", "미래의 습관에서 지금 가능한 작은 행동 하나를 찾아, 오늘의 선택으로 연결합니다."]].map(([t, d]) => <div key={t}>
        <h3>{t}</h3>
        <p className={s.fine}>{d}</p>
        </div>)}</div>
    <Link href="/future-coordinate#purchase" className={s.button} onClick={() => track("pricing_paid")}>미래 분석 &amp; 좌표 설정 {price} ↗</Link>
    <p className={s.fine}>선택 구매 · 1회 결제 · 정기결제 없음<br />결제 확인과 인터뷰 완료 후 AI 분석 · 답변에 따라 결과가 달라집니다.</p>
    </section>
    <section className={s.section}>
    <p className={s.eyebrow}>BEFORE YOU BEGIN</p>
    <h2 className={s.title}>시작하기 전, 궁금한 것들.</h2>{faqs.map(([q, a]) => <details className={s.faq} key={q}>
        <summary>{q}</summary>
        <p>{a}</p>
        </details>)}</section>
    <section className={`${s.section} ${s.center}`}>
    <h2 className={s.title}>되고 싶은 나를,<br />작은 선택부터.</h2>
    <Link className={s.button} href="/start" onClick={() => track("bottom")}>무료로 미래의 나 만들기 ↗</Link>
    </section>
    </main>
    </div>;
}
