import type { Metadata } from "next";
import { ReportSection } from "@/components/ReportSection";

export const metadata: Metadata = {
  title: "미래 기억 매거진"
};

export default function ReportPage() {
  return <ReportSection />;
}
