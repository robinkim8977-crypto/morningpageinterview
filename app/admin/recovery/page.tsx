import type { Metadata } from "next";
import { AdminRecoverySection } from "@/components/AdminRecoverySection";

export const metadata: Metadata = {
  title: "운영 장애 복구",
  robots: { index: false, follow: false }
};

export default function AdminRecoveryPage() {
  return <AdminRecoverySection />;
}
