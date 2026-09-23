import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check, CreditCard, FileText, PencilLine, Sparkles } from "lucide-react";
import { FUTURE_COORDINATE_PRICE } from "@/lib/payment";
import styles from "./LandingSection.module.css";

const price = `${FUTURE_COORDINATE_PRICE.toLocaleString("ko-KR")}원`;
const purchaseHref = "/future-coordinate#purchase";
const steps = [
  { icon: CreditCard, title: "미래좌표 구매", copy: `${price} 한 번 결제.\n정기결제는 없습니다.` },
  { icon: PencilLine, title: "11개 질문에 답변", copy: "미래 시점을 고르고,\n미래의 내가 되어 적어보세요." },
  { icon: Sparkles, title: "AI가 답변 분석", copy: "중요한 세 장면을 연결해\n삶의 방향과 행동을 찾습니다." },
  { icon: FileText, title: "리포트 확인·저장", copy: "완성된 리포트를 웹에서 읽고\nPDF로 저장하세요." }
];
const scenes = [
  { image: "light-shadow", label: "01 · LIFE", title: "삶의 모습", copy: "어떤 공간과 리듬 속에서\n살고 싶은지 살펴봅니다." },
  { image: "water-light", label: "02 · TURNING POINT", title: "변화의 증거", copy: "변화를 실감한 장면에서\n중요한 습관과 기준을 찾습니다." },
  { image: "ripples", label: "03 · EXPANSION", title: "다음 확장", copy: "성취 이후에도 향하고 싶은\n다음 꿈과 역할을 발견합니다." }
];
const questions = [
  { title: "기본 인터뷰와 무엇이 다른가요?", answer: "기본 인터뷰와 답변을 정리한 매거진은 무료입니다. 미래좌표는 답변을 AI로 분석해 방향·로드맵·첫 행동을 제안하는 유료 리포트입니다." },
  { title: "인터뷰 전에도 구매할 수 있나요?", answer: "네. 먼저 구매한 뒤 인터뷰를 진행할 수 있습니다. 이미 작성한 답변이 있다면 결제 후 해당 답변으로 분석합니다." },
  { title: "결과는 언제, 어디에서 확인하나요?", answer: "결제와 인터뷰가 완료되면 AI 분석 후 웹에서 확인합니다. 분석 상황에 따라 수 분 이상 걸릴 수 있으며, 결과는 PDF로 저장할 수 있습니다." },
  { title: "가입이나 정기결제가 필요한가요?", answer: `회원가입 없이 ${price} 한 번 결제로 이용합니다. 결과는 현재 브라우저에 저장되므로 PDF로 보관해 주세요.` }
];

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className={styles.eyebrow}>{children}</p>;
}

function PurchaseLink({ compact = false }: { compact?: boolean }) {
  return (
    <a href={purchaseHref} className={`${styles.purchaseButton} ${compact ? styles.compactButton : ""}`}>
      {price} · {compact ? "구매하기" : "미래좌표 구매하기"}
      <ArrowRight size={17} aria-hidden="true" />
    </a>
  );
}

function ReportPreview() {
  return (
    <figure className={styles.reportPreview} aria-label="미래좌표 리포트 구성 예시">
      <div className={`${styles.sheet} ${styles.backSheet}`} aria-hidden="true">
        <span>03 · COORDINATES</span><p className={styles.sheetNumber}>30</p>
        <h3>나만의 기준을<br />한 장에 모으기</h3>
        <p>지금 마음이 가는 것들을 관찰해<br />다음 선택의 기준을 발견합니다.</p>
      </div>
      <div className={`${styles.sheet} ${styles.middleSheet}`} aria-hidden="true">
        <span>02 · DIRECTION</span><h3>나의 기준으로<br />선택하는 삶</h3>
        <p>세 장면을 관통하는<br />하나의 방향을 발견했습니다.</p>
      </div>
      <div className={`${styles.sheet} ${styles.frontSheet}`}>
        <span>FUTURE COORDINATE</span><h3>미래와 현재 사이의<br />다음 한 걸음</h3>
        <Image src="/images/future-coordinate-hero.png" alt="" width={1122} height={1402} sizes="260px" />
        <p className={styles.sheetBrand}>THE MORNING PAGE INTERVIEW</p>
      </div>
      <figcaption>리포트 구성 미리보기 · 예시</figcaption>
    </figure>
  );
}

export function LandingSection() {
  return (
    <main className={`page-shell ${styles.landing}`}>
      <a href="#landing-content" className={styles.skipLink}>본문 바로가기</a>
      <header className={styles.header}>
        <Link href="/" className={styles.wordmark}>THE MORNING PAGE INTERVIEW</Link>
        <nav aria-label="랜딩페이지 안내">
          <a href="#report-contents" className={styles.navLink}>리포트 구성</a>
          <a href="#report-example" className={styles.navLink}>분석 예시</a>
          <PurchaseLink compact />
        </nav>
      </header>

      <section id="landing-content" className={styles.hero} aria-labelledby="landing-title">
        <div className={styles.heroCopy}>
          <Eyebrow>FUTURE COORDINATE · PERSONAL AI REPORT</Eyebrow>
          <h1 id="landing-title">미래의 나를<br />인터뷰해보세요.</h1>
          <p className={styles.heroDescription}>
            11개 질문에 답하면, AI가 답변 속 세 장면을 분석해 삶의 방향과 지금 시작할 행동을 제안합니다.<br />
            개인화 AI 리포트, <strong>미래좌표.</strong>
          </p>
          <ul className={styles.facts} aria-label="서비스 요약">
            <li>회원가입 없이 시작</li><li>약 10-15분</li><li>11개 질문</li>
            <li>AI분석 리포트 <strong>{price}</strong></li>
          </ul>
          <div className={styles.heroActions}>
            <PurchaseLink /><a href="#report-example" className={styles.textLink}>결과 예시 보기</a>
          </div>
          <p className={styles.finePrint}>회원가입 없이 이용 · 결제와 인터뷰 완료 후 리포트 생성</p>
        </div>
        <div className={styles.heroImage}>
          <Image src="/images/home-portal.png" alt="빛으로 이어지는 미래 인터뷰 통로" fill priority sizes="(min-width: 1440px) 660px, (min-width: 768px) 46vw, calc(100vw - 40px)" />
          <p>MEET THE FUTURE<br />YOU ALREADY KNOW.</p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.flow}`} aria-labelledby="flow-title">
        <Eyebrow>HOW IT WORKS</Eyebrow><h2 id="flow-title">네 단계로 만나는 나의 미래좌표.</h2>
        <ol className={styles.steps}>
          {steps.map(({ icon: Icon, title, copy }, index) => (
            <li key={title}><Icon size={27} strokeWidth={1.2} aria-hidden="true" /><h3><span>0{index + 1}</span>{title}</h3><p>{copy}</p></li>
          ))}
        </ol>
        <p className={styles.finePrint}>이미 인터뷰를 마쳤다면, 결제 후 작성한 답변으로 분석이 시작됩니다.</p>
      </section>

      <section id="report-contents" className={styles.section} aria-labelledby="contents-title">
        <div className={styles.sectionHeading}>
          <div><Eyebrow>WHAT YOU RECEIVE</Eyebrow><h2 id="contents-title">{price}에 받는<br />나만의 미래좌표 리포트.</h2></div>
          <p>미래의 세 장면을 연결해<br />하나의 방향과 구체적인 행동으로 정리합니다.</p>
        </div>
        <div className={styles.deliverables}>
          {scenes.map((scene) => (
            <article className={styles.card} key={scene.label}>
              <div className={styles.cardVisual}>
                <Image src={`/images/future-coordinate-scene-${scene.image}.png`} alt="" fill sizes="(min-width: 1440px) 440px, (min-width: 768px) 31vw, (min-width: 480px) 46vw, calc(100vw - 40px)" />
              </div>
              <p className={styles.cardLabel}>{scene.label}</p><h3>{scene.title}</h3><p>{scene.copy}</p>
            </article>
          ))}
          <article className={styles.card}>
            <div className={`${styles.cardVisual} ${styles.directionVisual}`} aria-hidden="true"><span>삶의 모습</span><ArrowDown size={14} /><span>변화의 증거</span><ArrowDown size={14} /><span>다음 확장</span></div>
            <p className={styles.cardLabel}>04 · DIRECTION</p><h3>하나의 삶의 방향</h3><p>서로 다른 세 장면이 가리키는<br />공통된 방향을 정리합니다.</p>
          </article>
          <article className={styles.card}>
            <div className={`${styles.cardVisual} ${styles.roadmapVisual}`} aria-hidden="true">
              {[["30", "발견"], ["90", "실험"], ["365", "축적"]].map(([days, label]) => <div key={days}><strong>{days}</strong><span>{label}</span></div>)}
            </div>
            <p className={styles.cardLabel}>05 · COORDINATES</p><h3>30·90·365일 로드맵</h3><p>지금의 단계에 맞춰<br />기준을 찾고, 시도하고, 쌓아갑니다.</p>
          </article>
          <article className={styles.card}>
            <div className={`${styles.cardVisual} ${styles.actionVisual}`}>
              <Image src="/images/future-coordinate-commitment.png" alt="" fill sizes="(min-width: 768px) 31vw, (min-width: 480px) 46vw, calc(100vw - 40px)" />
              <div aria-hidden="true"><strong>72</strong><span>HOURS · FIRST ACTION</span></div>
            </div>
            <p className={styles.cardLabel}>06 · DEPARTURE</p><h3>72시간 안의 첫 행동</h3><p>답변 속 습관에서 찾은 작은 행동을<br />내 일정에 맞춰 직접 약속합니다.</p>
          </article>
        </div>
        <div className={styles.deliverableNote}><span>웹에서 결과 확인 · PDF 저장 지원</span><span>이미지는 기존 리포트의 장면 이미지입니다.</span></div>
      </section>

      <section className={styles.why} aria-labelledby="why-title">
        <div className={styles.whyImage}><Image src="/images/home-chair.png" alt="햇빛이 들어오는 조용한 인터뷰 공간" fill sizes="(min-width: 768px) 42vw, 100vw" /></div>
        <div className={styles.whyCopy}>
          <Eyebrow>WHY A FUTURE INTERVIEW?</Eyebrow><h2 id="why-title">왜 미래의 나로<br />답하나요?</h2>
          <p>원하는 삶을 이미 살고 있다고 가정하고, 그때의 하루와 습관, 관계를 구체적으로 적어봅니다. 무엇을 이루고 싶은지뿐 아니라, 어떤 방식으로 살고 싶은지도 돌아볼 수 있습니다.</p>
          <p>미래좌표는 그 답변에서 방향과 첫 행동을 찾습니다.</p>
        </div>
      </section>

      <section id="report-example" className={styles.section} aria-labelledby="example-title">
        <div className={styles.sectionHeading}>
          <div><Eyebrow>FROM YOUR ANSWERS TO ACTION</Eyebrow><h2 id="example-title">내 답변이 어떻게<br />행동으로 이어질까요?</h2></div>
          <p>예시 답변을 바탕으로 한 분석 흐름입니다.</p>
        </div>
        <div className={styles.sampleFlow}>
          <article className={styles.sampleCard}><Eyebrow>01 · 미래의 장면</Eyebrow><h3>집중과 관계가<br />함께 있는 하루</h3><p>좋아하는 일에 몰입하면서도 삶 전체를 일에 내어주지 않는 하루를 살아갑니다.</p></article>
          <ArrowRight className={styles.sampleArrow} size={19} aria-hidden="true" />
          <article className={styles.sampleCard}><Eyebrow>02 · 발견한 방향</Eyebrow><h3>나의 기준으로 선택하고,<br />그 기준을 세상과 나누기</h3><p>좋아하는 이유를 발견하고, 나만의 결과물과 경험으로 조금씩 확장해갑니다.</p></article>
          <ArrowRight className={styles.sampleArrow} size={19} aria-hidden="true" />
          <article className={`${styles.sampleCard} ${styles.sampleAction}`}><Eyebrow>03 · 72시간 첫 행동</Eyebrow><h3>최근 저장한 작업<br />10개를 다시 보기</h3><p>각각 왜 좋은지 한 문장씩 적어보기.<br /><strong>이 예시의 실행 시간: 20분</strong></p></article>
        </div>
        <p className={styles.finePrint}>예시 리포트 일부를 축약했습니다. 실제 분석과 행동 제안은 입력한 답변에 따라 달라집니다.</p>
      </section>

      <section className={styles.purchase} aria-labelledby="purchase-title">
        <div>
          <Eyebrow>ONE-TIME PURCHASE</Eyebrow><h2 id="purchase-title">미래좌표 리포트</h2>
          <p className={styles.purchaseDescription}>내가 바라는 삶에서, 지금 할 수 있는 일까지.</p>
          <p className={styles.price}>{FUTURE_COORDINATE_PRICE.toLocaleString("ko-KR")}<span>원</span></p>
          <p className={styles.finePrint}>1회 결제 · 정기결제 없음</p>
          <ul className={styles.checklist}>
            {["세 장면을 연결한 개인화 AI 분석", "하나의 방향과 30·90·365일 로드맵", "72시간 첫 행동 제안 · PDF 저장"].map((item) => <li key={item}><Check size={15} aria-hidden="true" />{item}</li>)}
          </ul>
          <PurchaseLink /><p className={styles.finePrint}>인터뷰 전에도 구매할 수 있습니다.<br />결제 확인과 인터뷰 완료 후 리포트가 생성됩니다.</p>
        </div>
        <ReportPreview />
      </section>

      <section className={`${styles.section} ${styles.faq}`} aria-labelledby="faq-title">
        <Eyebrow>FAQ</Eyebrow><h2 id="faq-title">구매 전, 궁금한 것들.</h2>
        <dl>{questions.map(({ title, answer }) => <div key={title}><dt>{title}</dt><dd>{answer}</dd></div>)}</dl>
      </section>

      <section className={styles.closing} aria-labelledby="closing-title">
        <Image src="/images/home-portal.png" alt="" fill sizes="(min-width: 1440px) 1440px, 100vw" />
        <div>
          <h2 id="closing-title">내가 바라는 미래,<br />지금 할 수 있는 행동으로.</h2>
          <p>11개 질문의 답변에서 나만의 방향과 첫걸음을 찾아보세요.</p>
          <PurchaseLink /><p className={styles.finePrint}>1회 결제 · 정기결제 없음</p>
        </div>
      </section>
    </main>
  );
}
