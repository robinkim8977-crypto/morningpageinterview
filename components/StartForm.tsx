"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { readInterviewSession, startNewInterviewSession } from "@/lib/storage";

const yearOptions = [1, 3, 5, 10];

export function StartForm() {
  const router = useRouter();
  const [futureYear, setFutureYear] = useState<number | "custom">(() => readInterviewSession().futureYear || 0);
  const [customYear, setCustomYear] = useState("");
  const [name, setName] = useState(() => readInterviewSession().name || "");
  const [errors, setErrors] = useState<{ year?: string; name?: string }>({});

  const selectedYear = futureYear === "custom" ? Number(customYear) : futureYear;

  function enterInterview() {
    const nextErrors = {
      year: selectedYear > 0 ? undefined : "미래 시점을 선택해 주세요.",
      name: name.trim() ? undefined : "이름을 입력해 주세요."
    };

    setErrors(nextErrors);
    if (nextErrors.year || nextErrors.name) {
      return;
    }

    startNewInterviewSession({
      futureYear: selectedYear,
      name: name.trim(),
      answers: []
    });
    router.push("/interview");
  }

  return (
    <main className="page-shell min-h-screen bg-background">
      <Header className="absolute left-0 right-0 top-0 z-10" />
      <div className="px-[clamp(20px,3vw,30px)] pt-7">
        <div className="h-[520px] overflow-hidden">
          <img src="/images/start-texture.png" alt="" className="h-full w-full object-cover" />
        </div>
      </div>

      <section className="grid gap-8 border-b hairline px-[clamp(20px,3vw,30px)] py-10 md:grid-cols-[0.82fr_1fr]">
        <h1 className="ko-keep text-center text-[clamp(42px,5.5vw,72px)] font-semibold leading-tight tracking-[-0.05em]">
          당신은 곧 미래 인터뷰룸으로
          <br />
          입장하게 됩니다
        </h1>
        <div className="ko-keep max-w-3xl text-[clamp(20px,2vw,28px)] leading-10 tracking-[-0.03em]">
          <p>
            그곳에 도착하면 편안한 마음으로 자리에 앉아주세요.
            <br />
            답변은 길고 상세할수록 좋습니다.
            <br />
            며칠이 걸려도 좋으니 충분한 시간을 갖고 답해주세요.
          </p>
          <p className="mt-5 text-muted">예상 소요시간 : 1~2시간&nbsp;&nbsp; 추천 환경 : 조용한 공간</p>
        </div>
      </section>

      <section className="px-[clamp(20px,3vw,30px)] py-16 md:py-20">
        <h2 className="mb-24 text-[clamp(42px,5vw,64px)] font-semibold tracking-[-0.05em]">미래 시점 선택</h2>
        <div className="mx-auto grid max-w-6xl justify-items-center gap-20">
          <div className="w-full text-center">
            <p className="mb-10 text-[clamp(22px,2.5vw,32px)] font-medium">몇년 후로 이동하시겠습니까?</p>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-5">
              {yearOptions.map((year) => (
                <div key={year}>
                  <button
                    type="button"
                    onClick={() => setFutureYear(year)}
                    className={cn(
                      "h-14 w-full rounded-pill border-2 border-black text-xl font-bold transition",
                      futureYear === year ? "bg-black text-white" : "bg-transparent"
                    )}
                  >
                    +{year}년
                  </button>
                  {year === 3 ? <p className="mt-2 text-base text-muted">*추천</p> : null}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFutureYear("custom")}
                className={cn(
                  "h-14 rounded-pill border-2 border-black text-xl font-bold transition",
                  futureYear === "custom" ? "bg-black text-white" : "bg-transparent"
                )}
              >
                직접입력
              </button>
            </div>
            {futureYear === "custom" ? (
              <Input
                value={customYear}
                onChange={(event) => setCustomYear(event.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="이동할 연수를 입력하세요"
                className="mx-auto mt-8 max-w-xl"
              />
            ) : null}
            {errors.year ? <p className="mt-4 text-sm font-semibold text-red-700">{errors.year}</p> : null}
          </div>

          <div className="w-full max-w-3xl text-center">
            <label className="mb-8 block text-[clamp(22px,2.5vw,32px)] font-medium" htmlFor="name">
              리포트에 어떤 이름으로 기록할까요?
            </label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
            {errors.name ? <p className="mt-4 text-sm font-semibold text-red-700">{errors.name}</p> : null}
          </div>

          <Button type="button" onClick={enterInterview} size="lg">
            인터뷰룸 입장하기 <ArrowRight size={20} />
          </Button>
        </div>
      </section>
    </main>
  );
}
