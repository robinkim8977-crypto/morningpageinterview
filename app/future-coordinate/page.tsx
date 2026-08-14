import type { Metadata } from "next";
import { FutureCoordinateProductSection } from "@/components/FutureCoordinateProductSection";

export const metadata: Metadata = {
  title: "미래좌표 리포트",
  description: "인터뷰 속 세 가지 미래 장면, 하나의 방향과 30·90·365일 로드맵을 제안하는 개인화 AI 리포트입니다."
};

export default function FutureCoordinatePage() {
  return <FutureCoordinateProductSection />;
}
