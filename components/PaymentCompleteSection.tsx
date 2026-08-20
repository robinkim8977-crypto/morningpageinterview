"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { hasInterviewAnswers, savePaymentReceipt } from "@/lib/payment";
import { readInterviewSession } from "@/lib/storage";

export function PaymentCompleteSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const paymentId = searchParams.get("paymentId");
    const code = searchParams.get("code");
    const message = searchParams.get("message");

    if (code || !paymentId) {
      setError(message || "결제가 완료되지 않았습니다.");
      return;
    }

    fetch("/api/payments/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId })
    })
      .then(async (response) => {
        const data = await response.json() as { verified?: boolean; message?: string };
        if (!response.ok || data.verified !== true) throw new Error(data.message || "결제 승인 상태를 확인하지 못했습니다.");
        savePaymentReceipt(paymentId);
        router.replace(hasInterviewAnswers(readInterviewSession()) ? "/future-coordinate/result" : "/start");
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "결제 확인 중 오류가 발생했습니다."));
  }, [router, searchParams]);

  return (
    <main className="page-shell min-h-screen bg-[#F8F7F4]">
      <Header />
      <section className="grid min-h-[70vh] place-items-center px-6 text-center">
        <div className="max-w-xl">
          {error ? (
            <>
              <h1 className="ko-keep text-4xl font-medium tracking-[-0.05em]">결제 상태를 확인해주세요.</h1>
              <p className="ko-keep mt-5 leading-7 text-black/60">{error}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="sm"><Link href="/future-coordinate">결제 페이지로 돌아가기</Link></Button>
                <Button asChild size="sm" variant="outline"><a href="mailto:morningpageinterview@gmail.com">고객센터 문의</a></Button>
              </div>
            </>
          ) : (
            <>
              <div className="hourglass mx-auto mb-8" aria-hidden="true" />
              <h1 className="ko-keep text-3xl font-medium tracking-[-0.05em]">결제 승인 상태를 확인하고 있습니다.</h1>
              <p className="mt-4 text-sm leading-6 text-black/55">이 화면을 닫지 말고 잠시만 기다려주세요.</p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
