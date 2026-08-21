"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { readPaymentReceipt } from "@/lib/payment";

const MIN_GENERATING_DELAY_MS = 1200;

export function GeneratingSection() {
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    const nextDestination = readPaymentReceipt() ? "/future-coordinate/result" : "/report";
    setDestination(nextDestination);
    const timeoutId = window.setTimeout(() => {
      window.location.replace(nextDestination);
    }, MIN_GENERATING_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <main className="page-shell min-h-screen bg-background">
      <Header />
      <section className="grid min-h-[calc(100vh-92px)] place-items-center px-6 text-center">
        <div className="grid justify-items-center">
          <div className="hourglass mb-10" aria-hidden="true" />
          <p className="mb-16 text-[clamp(24px,2.2vw,34px)] font-medium tracking-[-0.04em]">Future Memory</p>
          <p className="ko-keep text-[clamp(22px,2.2vw,32px)] font-medium leading-normal tracking-[-0.04em]">
            당신이 남긴 미래의 기억을 정리하고 있습니다.
            <br />
            잠시만 기다려주세요.
          </p>
          {destination ? (
            <Button asChild className="mt-12">
              <Link href={destination}>{destination === "/future-coordinate/result" ? "미래좌표 바로 보기" : "리포트 바로 보기"}</Link>
            </Button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
