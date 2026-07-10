import type { Metadata } from "next";
import { GeneratingSection } from "@/components/GeneratingSection";

export const metadata: Metadata = {
  title: "미래 기억 정리 중"
};

export default function GeneratingPage() {
  return <GeneratingSection />;
}
