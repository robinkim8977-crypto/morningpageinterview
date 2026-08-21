import type { InterviewSession } from "@/lib/types";

export const FUTURE_COORDINATE_PRODUCT_CODE = "future-coordinate-report-v1";
export const FUTURE_COORDINATE_PRODUCT_NAME = "미래좌표 리포트";
export const FUTURE_COORDINATE_PRICE = 2900;
export const FUTURE_COORDINATE_PAYMENT_KEY = "morning-page-future-coordinate-payment";

export type FutureCoordinatePaymentReceipt = {
  paymentId: string;
  productCode: typeof FUTURE_COORDINATE_PRODUCT_CODE;
  verifiedAt: string;
};

export function hasInterviewAnswers(session: InterviewSession) {
  return session.answers.some((answer) => answer.answer.trim().length > 0);
}

export function readPaymentReceipt(): FutureCoordinatePaymentReceipt | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(FUTURE_COORDINATE_PAYMENT_KEY);
    if (!raw) return null;
    const receipt = JSON.parse(raw) as Partial<FutureCoordinatePaymentReceipt>;
    if (
      typeof receipt.paymentId !== "string" ||
      !receipt.paymentId ||
      receipt.productCode !== FUTURE_COORDINATE_PRODUCT_CODE ||
      typeof receipt.verifiedAt !== "string"
    ) {
      return null;
    }
    return receipt as FutureCoordinatePaymentReceipt;
  } catch {
    return null;
  }
}

export function savePaymentReceipt(paymentId: string) {
  const receipt: FutureCoordinatePaymentReceipt = {
    paymentId,
    productCode: FUTURE_COORDINATE_PRODUCT_CODE,
    verifiedAt: new Date().toISOString()
  };
  window.localStorage.setItem(FUTURE_COORDINATE_PAYMENT_KEY, JSON.stringify(receipt));
  return receipt;
}

export function clearPaymentReceipt() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(FUTURE_COORDINATE_PAYMENT_KEY);
}
