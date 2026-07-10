import type { Metadata } from "next";
import { InterviewSection } from "@/components/InterviewSection";

export const metadata: Metadata = {
  title: "미래 인터뷰"
};

export default function InterviewPage() {
  return <InterviewSection />;
}
