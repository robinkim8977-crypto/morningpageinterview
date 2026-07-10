import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingSection() {
  return (
    <main className="page-shell bg-background">
      <section className="px-[clamp(20px,3vw,30px)] pb-6">
        <div className="grid items-start gap-4 border-b hairline pb-6 md:grid-cols-[220px_1fr]">
          <p className="wordmark pt-3">THE MORNING PAGE INTERVIEW</p>
          <div className="text-right">
            <h1 className="text-[clamp(54px,9.8vw,132px)] font-semibold leading-[0.86] tracking-[-0.06em]">
              Meet the future
              <br />
              you already know
            </h1>
            <p className="mt-4 whitespace-pre-line text-sm font-medium md:text-base">
              당신이 바라던 미래는 이미 이루어졌습니다.
              <br />
              미래의 기억 속에서 현재를 발견하세요.
            </p>
          </div>
        </div>
        <div className="relative mt-8 overflow-hidden">
          <Image
            src="/images/home-portal.png"
            alt="빛이 이어지는 미래 통로"
            width={1792}
            height={1024}
            priority
            className="h-[360px] w-full object-cover md:h-[620px]"
          />
          <Button asChild size="sm" className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <Link href="/start">
              인터뷰룸 입장하기 <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
      </section>

      <section className="section-pad bg-[#C6B7A3] text-center">
        <h2 className="mb-10 text-4xl font-extrabold tracking-[-0.04em]">FLOW</h2>
        <div className="mx-auto grid max-w-3xl grid-cols-3 text-sm font-semibold">
          {["미래 시점 선택", "11개 질문 인터뷰", "미래 기록물 생성"].map((item, index) => (
            <div key={item} className="grid justify-items-center gap-3 border-black/25 px-4 [&:not(:last-child)]:border-r">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-black">{index + 1}</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 border-b hairline px-[clamp(20px,3vw,30px)] py-14 md:grid-cols-2 md:py-16">
        <div className="flex min-h-[520px] flex-col justify-between">
          <h2 className="max-w-md text-[clamp(34px,4.6vw,58px)] font-semibold leading-[0.94] tracking-[-0.06em]">
            Which future are you remembering from?
          </h2>
          <p className="ko-keep max-w-md text-base font-medium leading-8">
            우리는 과거가 미래를 결정한다고 생각하지만, 오히려 과거에 의미를 붙이는 건 현재 우리입니다. 마찬가지로 현재를 바라보는 방식은 미래에 의해 결정됩니다.
            <br />
            <br />
            모닝페이지 인터뷰는 당신이 원하는 <strong>미래 시점</strong>으로 이동하여 <strong>인터뷰</strong>를 진행하는 <strong>자기인식 경험 서비스</strong>입니다. 당신은 목표를 세우지 않습니다. 이미 현실화된 삶을 회상하며 질문에 답할 뿐입니다.
          </p>
        </div>
        <Image src="/images/home-chair.png" alt="조용한 의자와 햇빛" width={1792} height={1024} className="h-[520px] w-full object-cover" />
      </section>

      <section className="bg-[#C9C4BA] px-5 py-20 text-center">
        <h2 className="mb-8 text-[clamp(28px,4vw,44px)] font-semibold tracking-[-0.04em]">미래를 상상하는 대신, 미래를 기억해보세요.</h2>
        <Button asChild size="sm">
          <Link href="/start">
            인터뷰룸 입장하기 <ArrowRight size={14} />
          </Link>
        </Button>
      </section>

      <section className="px-[clamp(20px,3vw,30px)] py-8">
        <Image src="/images/home-pool.png" alt="고요한 미래 공간" width={1792} height={1024} className="h-[560px] w-full object-cover" />
        <div className="grid gap-8 border-b hairline py-10 md:grid-cols-[0.9fr_1.1fr]">
          <h2 className="text-[clamp(34px,5vw,58px)] font-semibold leading-[0.88] tracking-[-0.06em]">
            A future report written
            <br />
            from your own answers
          </h2>
          <p className="ko-keep text-base font-medium leading-8">
            인터뷰룸에 입장해 11가지 질문에 답해보세요. 질문은 당신이 이미 살아낸 미래를 더 선명하게 기억하도록 돕습니다. 그 깊은 통찰의 시간은 여지없이 당신의 삶에 현실화됩니다.
          </p>
        </div>
      </section>

      <section className="grid items-center gap-10 px-[clamp(20px,3vw,30px)] py-10 md:grid-cols-2">
        <Image src="/images/home-report.png" alt="미래 리포트 예시" width={1792} height={1408} className="w-full object-cover" />
        <div className="text-center md:text-right">
          <Button asChild size="sm" className="mb-7">
            <Link href="/start">
              인터뷰룸 입장하기 <ArrowRight size={14} />
            </Link>
          </Button>
          <h2 className="ko-keep text-[clamp(30px,4.2vw,48px)] font-semibold leading-tight tracking-[-0.04em]">
            인터뷰가 끝나면 당신의 미래는
            <br />
            하나의 기록이 됩니다
          </h2>
          <p className="ko-keep ml-auto mt-8 max-w-lg text-base font-medium leading-8">
            인터뷰가 끝나면 당신이 남긴 미래의 기억을 하나의 문서로 정리합니다. 이 기록은 포스터와 음성메시지로 확장하여 미래의 청사진을 반복하여 상기시키는 좋은 도구가 됩니다.
          </p>
        </div>
      </section>

      <section className="relative my-10">
        <Image src="/images/home-why.png" alt="미래를 바라보는 라운지" width={1792} height={1024} className="h-[430px] w-full object-cover" />
        <div className="absolute inset-0 grid place-items-center bg-black/5 text-center text-white">
          <h2 className="text-[clamp(34px,5vw,56px)] font-semibold tracking-[-0.05em]">Why</h2>
          <p className="mt-2 text-xl font-semibold">우리는 과거의 기억에 의해 살아갑니다.</p>
        </div>
      </section>

      <section className="px-[clamp(20px,3vw,30px)] pb-16 pt-10 text-center">
        <p className="ko-keep mx-auto max-w-xl text-base font-medium leading-8">
          모닝페이지 인터뷰는 아직 오지 않은 미래의 기억을 통해 현재를 다시 바라보게 합니다.
        </p>
      </section>

      <section className="grid min-h-[620px] items-end gap-10 px-[clamp(20px,3vw,30px)] pb-12 md:grid-cols-2">
        <div className="pb-10">
          <h2 className="ko-keep mb-6 text-[clamp(34px,4.8vw,56px)] font-semibold leading-tight tracking-[-0.05em]">
            당신은 어떤 미래에서
            <br />
            오늘을 기억하고 있나요?
          </h2>
          <Button asChild size="sm">
            <Link href="/start">
              미래 인터뷰 시작하기 <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
        <Image src="/images/home-final.png" alt="미래 인터뷰룸의 의자" width={1792} height={1024} className="h-[620px] w-full object-cover" />
      </section>
    </main>
  );
}
