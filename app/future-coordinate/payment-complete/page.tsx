import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentCompleteSection } from "@/components/PaymentCompleteSection";

export const metadata: Metadata = {
  title: "결제 확인",
  robots: { index: false, follow: false }
};

export default function PaymentCompletePage() {
  return <Suspense fallback={null}><PaymentCompleteSection /></Suspense>;
}
