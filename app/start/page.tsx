import type { Metadata } from "next";
import { StartForm } from "@/components/StartForm";

export const metadata: Metadata = {
  title: "미래 시점 설정"
};

export default function StartPage() {
  return <StartForm />;
}
