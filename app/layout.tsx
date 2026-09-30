import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { GoogleAnalyticsPageView } from "@/components/GoogleAnalytics";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-SKBRJYW73J";

export const metadata: Metadata = {
  title: {
    default: "모닝페이지 인터뷰 | 미래의 나에게, 오늘의 길을 묻다",
    template: "%s | The Morning Page Interview"
  },
  description: "미래의 내가 되어 11개의 질문에 답해보세요. 인터뷰와 미래 기억 매거진은 무료, AI 분석 리포트 미래좌표는 2,900원 선택 구매입니다.",
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
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="beforeInteractive"
        />
        <Script id="google-analytics" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
          `}
        </Script>
      </head>
      <body>
        {children}
        <SiteFooter />
        <Suspense fallback={null}>
          <GoogleAnalyticsPageView measurementId={GA_MEASUREMENT_ID} />
        </Suspense>
      </body>
    </html>
  );
}
