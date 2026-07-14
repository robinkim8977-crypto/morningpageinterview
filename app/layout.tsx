import type { Metadata } from "next";
import { Suspense } from "react";
import { GoogleAnalyticsPageView } from "@/components/GoogleAnalytics";
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
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="ko">
      {gaMeasurementId ? (
        <head>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', { send_page_view: false });
              `
            }}
          />
        </head>
      ) : null}
      <body>
        {children}
        <Suspense fallback={null}>
          <GoogleAnalyticsPageView measurementId={gaMeasurementId} />
        </Suspense>
      </body>
    </html>
  );
}
