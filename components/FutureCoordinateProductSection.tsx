import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Header } from "@/components/Header";
import { FutureCoordinatePurchase } from "@/components/FutureCoordinatePurchase";
import { Button } from "@/components/ui/button";

const deliverables = [
  "인터뷰에서 발견한 세 가지 미래 장면",
  "세 장면을 관통하는 하나의 방향",
  "현재 단계에 맞춘 30·90·365일 로드맵",
  "인터뷰 속 습관에서 찾은 72시간 첫 행동",
  "브라우저에서 확인하고 PDF로 저장할 수 있는 리포트"
];

const roadmap = [
  { days: "30", stage: "DISCOVER", title: "발견", copy: "지금의 삶에서 이미 시작할 수 있는 기록과 탐색으로 나만의 기준을 발견합니다." },
  { days: "90", stage: "EXPERIMENT", title: "실험", copy: "생각을 작은 결과물로 만들고, 세상과 한 번 접촉해보는 실험을 제안합니다." },
  { days: "365", stage: "BUILD", title: "축적", copy: "미래를 서둘러 완성하지 않고, 그 미래가 가능해지는 경험과 방식을 축적합니다." }
];

export function FutureCoordinateProductSection() {
  const showLocalPreview = process.env.NODE_ENV === "development";

  return (
    <main className="page-shell min-h-screen bg-[#F8F7F4]">
      <Header />

      <section className="grid min-h-[760px] gap-10 border-b border-black/15 px-[clamp(20px,6vw,86px)] pb-20 pt-5 md:grid-cols-[0.78fr_1.42fr] md:items-center md:pb-28">
        <Image
          src="/images/future-coordinate-hero.png"
          alt="부드러운 빛이 비치는 천의 질감"
          width={1122}
          height={1402}
          priority
          quality={95}
          sizes="(min-width: 768px) 34vw, calc(100vw - 40px)"
          className="order-2 h-[340px] w-full object-cover md:order-1 md:h-[620px]"
        />
        <div className="order-1 md:order-2 md:pl-2">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <p className="text-xs font-bold tracking-[0.16em] text-black/48">PREMIUM AI REPORT</p>
            <span className="rounded-full bg-black px-3 py-1.5 text-[11px] font-bold tracking-[0.12em] text-white">1회 결제 · 2,900원</span>
          </div>
          <h1 className="ko-keep text-[clamp(46px,6vw,82px)] font-medium leading-[0.98] tracking-[-0.075em]">
            미래와 현재 사이의
            <br />
            다음 한 걸음
          </h1>
          <p className="ko-keep mt-8 max-w-2xl text-base font-medium leading-8 text-black/64">
            미래좌표는 인터뷰를 다시 요약하는 리포트가 아닙니다. 답변 속에서 가장 중요한 세 장면을 발견하고,
            그 장면들이 가리키는 하나의 방향과 지금 가능한 다음 행동을 AI가 함께 찾습니다.
          </p>
          <div className="mt-10 flex flex-wrap items-end gap-x-7 gap-y-4 border-y border-black/20 py-6">
            <div>
              <p className="text-xs font-bold tracking-[0.12em] text-black/42">1회 결제</p>
              <p className="mt-1 text-4xl font-semibold tracking-[-0.05em]">2,900원</p>
            </div>
            <p className="ko-keep max-w-md text-xs leading-5 text-black/48">정기결제 없이 한 번만 결제합니다. 결제 완료 후 입력한 인터뷰 답변을 바탕으로 개인화 리포트 생성이 시작됩니다.</p>
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="sm" className="min-w-52"><a href="#purchase">구매 안내 확인하기 <ArrowRight size={14} /></a></Button>
            {showLocalPreview ? (
              <Button asChild size="sm" variant="outline" className="min-w-52">
                <Link href="/future-coordinate/result?preview=1">로컬 결과 미리보기 <ArrowRight size={14} /></Link>
              </Button>
            ) : null}
          </div>
          <p className="ko-keep mt-4 text-xs leading-5 text-black/44">결제는 한 번만 진행되며, 결제와 인터뷰가 모두 완료되면 개인화 리포트 생성이 시작됩니다.</p>
        </div>
      </section>

      <section className="grid gap-10 border-b border-black/15 px-[clamp(20px,6vw,86px)] py-20 md:grid-cols-[0.8fr_1.2fr] md:py-28">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-black/42">WHAT YOU RECEIVE</p>
          <h2 className="ko-keep mt-4 text-[clamp(34px,4.5vw,58px)] font-medium leading-[1.05] tracking-[-0.06em]">인터뷰가 하나의 방향이 되는 과정</h2>
        </div>
        <div className="grid content-start gap-5">
          {deliverables.map((item) => (
            <div key={item} className="flex items-start gap-4 border-t border-black/20 pt-5">
              <Check size={17} className="mt-1 shrink-0" />
              <p className="ko-keep text-lg font-medium leading-7">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-black/15 px-[clamp(20px,3vw,30px)] py-20 md:py-28">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-bold tracking-[0.16em] text-black/42">THREE FUTURE SCENES</p>
          <h2 className="ko-keep mt-4 text-[clamp(34px,4.5vw,58px)] font-medium tracking-[-0.06em]">미래에서 가장 중요한 세 장면</h2>
          <p className="ko-keep mx-auto mt-5 max-w-2xl text-sm leading-7 text-black/54 md:text-base">삶의 모습에서 시작해 변화의 증거를 지나, 다음 확장으로 이어지는 장면을 발견합니다.</p>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              ["/images/future-coordinate-scene-light-shadow.png", "01", "삶의 모습", "어떤 공간과 리듬 속에서 살아가고 일하고 있는지"],
              ["/images/future-coordinate-scene-water-light.png", "02", "변화의 증거", "성취와 변화를 처음 실감하고 자기 확신을 얻은 순간"],
              ["/images/future-coordinate-scene-ripples.png", "03", "다음 확장", "현재의 성취 이후 다시 향하고 싶은 다음 꿈과 역할"]
            ].map(([src, number, title, copy]) => (
              <article key={number} className="text-left">
                <Image src={src} alt="" width={498} height={814} quality={95} className="h-[440px] w-full object-cover" />
                <p className="mt-5 text-xs font-bold tracking-[0.14em] text-black/42">SCENE {number}</p>
                <h3 className="ko-keep mt-2 text-2xl font-medium tracking-[-0.045em]">{title}</h3>
                <p className="ko-keep mt-3 text-sm leading-6 text-black/56">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-black/15 px-[clamp(20px,6vw,86px)] py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold tracking-[0.16em] text-black/42">30 · 90 · 365</p>
          <h2 className="ko-keep mt-4 max-w-3xl text-[clamp(34px,4.5vw,58px)] font-medium leading-[1.05] tracking-[-0.06em]">미래를 재촉하지 않는 세 개의 좌표</h2>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {roadmap.map((item) => (
              <article key={item.days} className="flex min-h-[360px] flex-col justify-between rounded-[28px] border border-black/20 p-7">
                <div>
                  <p className="text-xs font-bold tracking-[0.13em] text-black/42">{item.days} DAYS · {item.stage}</p>
                  <p className="mt-7 text-7xl font-medium leading-none tracking-[-0.08em]">{item.days}</p>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold">{item.title}</h3>
                  <p className="ko-keep mt-3 text-sm leading-6 text-black/58">{item.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-10 border-b border-black/15 px-[clamp(20px,6vw,86px)] py-20 md:grid-cols-[0.82fr_1.18fr] md:items-center md:py-28">
        <Image src="/images/future-coordinate-commitment.png" alt="빛과 그림자 사이의 작은 그릇" width={1122} height={1402} quality={95} className="h-[480px] w-full object-cover md:h-[620px]" />
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-black/42">72 HOURS · FIRST ACTION</p>
          <h2 className="ko-keep mt-4 text-[clamp(36px,4.8vw,62px)] font-medium leading-[1.04] tracking-[-0.065em]">오늘로 가져올 수 있는 가장 작은 행동</h2>
          <p className="ko-keep mt-7 max-w-xl text-base leading-8 text-black/60">미래의 당신이 중요하다고 말한 습관과 반복적인 행동 중, 지금 15분에서 60분 안에 시작할 수 있는 하나를 제안합니다. 마지막 약속은 이용자가 직접 고쳐 적고 현재 브라우저에 저장할 수 있습니다.</p>
        </div>
      </section>

      <section id="purchase" className="scroll-mt-8 px-[clamp(20px,6vw,86px)] py-20 text-center md:py-28">
        <p className="text-xs font-bold tracking-[0.16em] text-black/42">ONE-TIME PURCHASE</p>
        <h2 className="ko-keep mx-auto mt-4 max-w-3xl text-[clamp(34px,4.5vw,58px)] font-medium leading-[1.08] tracking-[-0.06em]">미래와 현재 사이의 다음 한 걸음을 만나보세요</h2>
        <p className="ko-keep mx-auto mt-6 max-w-xl text-sm leading-7 text-black/56 md:text-base">2,900원 1회 결제로 이용합니다. 인터뷰를 아직 완료하지 않았다면 결제 후 인터뷰를 이어갈 수 있습니다.</p>
        <div className="mt-9"><FutureCoordinatePurchase /></div>
        <div className="mt-8"><Button asChild size="sm" variant="outline" className="min-w-52"><Link href="/start">무료 인터뷰 시작하기 <ArrowRight size={14} /></Link></Button></div>
        <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-black/48">
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/refund-policy">결제·취소·환불 정책</Link>
        </div>
      </section>
    </main>
  );
}
