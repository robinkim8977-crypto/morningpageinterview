import type { Metadata } from "next";
import { FutureCoordinateProductSection } from "@/components/FutureCoordinateProductSection";

export const metadata: Metadata = {
  title: "미래좌표 리포트",
  description: "미래의 나 소개, 하루 스케줄, 핵심 습관 5개, 30·60·365일 미션과 24시간 행동 약속을 제안하는 개인화 AI 리포트입니다."
};

export default function FutureCoordinatePage() {
  return <FutureCoordinateProductSection />;
}
