"use client";

import * as PortOne from "@portone/browser-sdk/v2";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  clearPaymentReceipt,
  FUTURE_COORDINATE_PRICE,
  FUTURE_COORDINATE_PRODUCT_CODE,
  FUTURE_COORDINATE_PRODUCT_NAME,
  hasInterviewAnswers,
  readPaymentReceipt,
  savePaymentReceipt
} from "@/lib/payment";
import { readInterviewSession } from "@/lib/storage";

type PaymentMode = "disabled" | "test" | "live";
type ExistingPaymentStatus = "checking" | "none" | "verified" | "error";

class PaymentVerificationError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function configuredPaymentMode(): PaymentMode {
  const value = process.env.NEXT_PUBLIC_PAYMENT_MODE?.trim().toLowerCase();
  return value === "test" || value === "live" ? value : "disabled";
}

async function verifyPayment(paymentId: string) {
  const response = await fetch("/api/payments/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId })
  });
  const data = await response.json() as { verified?: boolean; message?: string };
  if (!response.ok || data.verified !== true) {
    throw new PaymentVerificationError(data.message || "결제 승인 상태를 확인하지 못했습니다.", response.status);
  }
  savePaymentReceipt(paymentId);
}

export function FutureCoordinatePurchase() {
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [withdrawalAccepted, setWithdrawalAccepted] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [message, setMessage] = useState("");
  const [hasInterview, setHasInterview] = useState(false);
  const [existingPaymentStatus, setExistingPaymentStatus] = useState<ExistingPaymentStatus>("checking");
  const mode = configuredPaymentMode();
  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID?.trim();
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY?.trim();
  const configured = mode !== "disabled" && Boolean(storeId && channelKey);

  useEffect(() => {
    setHasInterview(hasInterviewAnswers(readInterviewSession()));
    const receipt = readPaymentReceipt();
    if (!receipt) {
      setExistingPaymentStatus("none");
      return;
    }

    verifyPayment(receipt.paymentId)
      .then(() => setExistingPaymentStatus("verified"))
      .catch((reason: unknown) => {
        if (reason instanceof PaymentVerificationError && reason.status === 400) {
          clearPaymentReceipt();
          setExistingPaymentStatus("none");
          return;
        }
        setMessage(reason instanceof Error ? reason.message : "기존 결제를 확인하지 못했습니다.");
        setExistingPaymentStatus("error");
      });
  }, []);

  if (existingPaymentStatus === "checking") {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-[24px] border border-black/20 p-6 text-center text-sm font-semibold text-black/55">
        기존 결제 내역을 확인하고 있습니다.
      </div>
    );
  }

  if (existingPaymentStatus === "error") {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-[24px] border border-black/20 p-6 text-center md:p-8">
        <h3 className="ko-keep text-xl font-semibold tracking-[-0.03em]">기존 결제를 잠시 확인하지 못했습니다.</h3>
        <p className="ko-keep mt-3 text-sm leading-6 text-black/58">중복 결제를 막기 위해 새로운 결제 요청을 멈췄습니다. 잠시 후 새로고침하거나 고객센터로 문의해 주세요.</p>
        {message ? <p className="ko-keep mt-3 text-xs font-semibold text-red-700" role="alert">{message}</p> : null}
      </div>
    );
  }

  if (existingPaymentStatus === "verified") {
    return (
      <div className="mx-auto w-full max-w-2xl text-left">
        <div className="rounded-[24px] border border-black/20 bg-black/[0.03] p-6 text-center md:p-8">
          <p className="text-xs font-bold tracking-[0.14em] text-black/42">PAYMENT CONFIRMED</p>
          <h3 className="ko-keep mt-3 text-2xl font-semibold tracking-[-0.04em]">이미 결제가 확인되었습니다.</h3>
          <p className="ko-keep mt-4 text-sm leading-6 text-black/58">
            {hasInterview
              ? "추가 결제 없이 작성한 인터뷰의 미래좌표를 확인할 수 있습니다."
              : "추가 결제 없이 인터뷰를 완료하면 미래좌표 분석이 시작됩니다."}
          </p>
          <Button asChild size="sm" className="mt-6 min-w-52">
            <Link href={hasInterview ? "/future-coordinate/result" : "/start"}>
              {hasInterview ? "미래좌표 결과 보기" : "인터뷰 시작하기"} <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
        {mode === "test" ? <p className="mt-3 text-center text-xs font-semibold text-amber-700">테스트 결제 확인됨</p> : null}
      </div>
    );
  }

  async function requestPayment() {
    if (!configured || !storeId || !channelKey) {
      setMessage("결제 연동 정보를 확인하고 있습니다. 잠시 후 다시 이용해 주세요.");
      return;
    }
    if (!termsAccepted || !withdrawalAccepted) {
      setMessage("이용약관과 디지털콘텐츠 제공 개시 내용을 확인해 주세요.");
      return;
    }

    setIsPaying(true);
    setMessage("");
    const session = readInterviewSession();
    // KCP V2 limits order/payment identifiers to 40 characters.
    const paymentId = `fc-${crypto.randomUUID()}`;

    try {
      const response = await PortOne.requestPayment({
        storeId,
        channelKey,
        paymentId,
        orderName: FUTURE_COORDINATE_PRODUCT_NAME,
        orderDetail: "인터뷰 답변을 분석한 개인화 AI 미래좌표 리포트",
        totalAmount: FUTURE_COORDINATE_PRICE,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
        customer: session.name.trim() ? { fullName: session.name.trim() } : undefined,
        productType: "DIGITAL",
        products: [{
          id: FUTURE_COORDINATE_PRODUCT_CODE,
          name: FUTURE_COORDINATE_PRODUCT_NAME,
          amount: FUTURE_COORDINATE_PRICE,
          quantity: 1,
          link: `${window.location.origin}/future-coordinate`,
          description: "세 가지 미래 장면과 30·90·365일 로드맵"
        }],
        customData: { productCode: FUTURE_COORDINATE_PRODUCT_CODE },
        redirectUrl: `${window.location.origin}/future-coordinate/payment-complete`
      });

      if (!response) return;
      if (response.code) {
        setMessage(response.message || "결제가 완료되지 않았습니다.");
        return;
      }

      await verifyPayment(response.paymentId);
      router.push(hasInterviewAnswers(readInterviewSession()) ? "/future-coordinate/result" : "/start");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "결제를 확인하는 중 오류가 발생했습니다.");
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl text-left">
      <div className="rounded-[24px] border border-black/20 p-5 md:p-6">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
          <input className="mt-1 h-4 w-4 accent-black" type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} />
          <span><strong>[필수]</strong> <Link className="underline underline-offset-4" href="/terms">이용약관</Link> 및 <Link className="underline underline-offset-4" href="/privacy">개인정보처리방침</Link>에 동의합니다.</span>
        </label>
        <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm leading-6">
          <input className="mt-1 h-4 w-4 accent-black" type="checkbox" checked={withdrawalAccepted} onChange={(event) => setWithdrawalAccepted(event.target.checked)} />
          <span><strong>[필수]</strong> 결제 완료 후 개인화 디지털콘텐츠 제작·제공이 시작되며, 제공 개시 후 단순 변심 청약철회가 제한될 수 있음을 확인합니다. <Link className="underline underline-offset-4" href="/refund-policy">환불정책 보기</Link></span>
        </label>
      </div>

      <Button type="button" size="sm" className="mt-5 h-12 w-full" disabled={!configured || isPaying} onClick={requestPayment}>
        {isPaying ? "결제 확인 중…" : configured ? `${FUTURE_COORDINATE_PRICE.toLocaleString("ko-KR")}원 결제하기` : "결제 연동 점검 중"}
        {!isPaying && configured ? <ArrowRight size={14} /> : null}
      </Button>
      {mode === "test" ? <p className="mt-3 text-center text-xs font-semibold text-amber-700">테스트 채널 · 실제 금액은 출금되지 않습니다.</p> : null}
      {message ? <p className="ko-keep mt-3 text-center text-sm font-semibold text-red-700" role="alert">{message}</p> : null}
      <p className="ko-keep mt-4 text-center text-xs leading-5 text-black/48">
        {hasInterview ? "결제 확인 후 작성한 인터뷰를 분석합니다." : "인터뷰 전에도 구매할 수 있으며, 결제 후 인터뷰를 완료하면 리포트가 생성됩니다."}
      </p>
      <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-black/42"><Check size={13} />1회 결제 · 정기결제 없음</p>
    </div>
  );
}
