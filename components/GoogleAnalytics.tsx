"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { sendAnalyticsPageView } from "@/lib/analytics";

type GoogleAnalyticsProps = {
  measurementId?: string;
};

export function GoogleAnalyticsPageView({ measurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const lastTrackedPath = useRef("");

  useEffect(() => {
    if (!measurementId || lastTrackedPath.current === pathname) return;
    if (sendAnalyticsPageView(measurementId, pathname)) {
      lastTrackedPath.current = pathname;
    }
  }, [measurementId, pathname]);

  return null;
}
