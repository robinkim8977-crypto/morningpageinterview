import type { Metadata } from "next";
import { FutureCoordinateSection } from "@/components/FutureCoordinateSection";

export const metadata: Metadata = {
  title: "나의 미래좌표",
  description: "인터뷰 답변에서 발견한 세 가지 미래 장면과 다음 한 걸음을 확인하세요.",
  robots: { index: false, follow: false }
};

export default function FutureCoordinateResultPage() {
  return <FutureCoordinateSection />;
}
