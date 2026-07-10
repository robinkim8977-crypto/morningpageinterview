"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";

const MIN_GENERATING_DELAY_MS = 1200;

export function GeneratingSection() {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    const timeoutId = window.setTimeout(() => {
      window.location.replace("/report");
    }, MIN_GENERATING_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <main className="page-shell min-h-screen bg-background">
      <script
        dangerouslySetInnerHTML={{
          __html: "window.setTimeout(function(){ window.location.replace('/report'); }, 1200);"
        }}
      />
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
          <Button asChild className="mt-12">
            <Link href="/report">리포트 바로 보기</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
