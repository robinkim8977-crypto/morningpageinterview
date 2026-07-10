import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "The Morning Page Interview",
    template: "%s | The Morning Page Interview"
  },
  description: "미래의 자신과 인터뷰하고, 이미 실현된 미래를 기억하는 방식으로 미래 자아 리포트를 생성합니다.",
  keywords: ["Morning Page", "Future Interview", "미래 인터뷰", "목표 설정", "자기 회고"],
  openGraph: {
    title: "The Morning Page Interview",
    description: "Meet the future you already know.",
    type: "website",
    locale: "ko_KR"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
