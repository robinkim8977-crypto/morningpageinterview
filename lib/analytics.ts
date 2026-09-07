import {
  FUTURE_COORDINATE_PRICE,
  FUTURE_COORDINATE_PRODUCT_CODE,
  FUTURE_COORDINATE_PRODUCT_NAME
} from "@/lib/payment";
import type { PurchasePaymentMethodId } from "@/lib/payment-methods";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type AnalyticsPaymentMethod = PurchasePaymentMethodId | "unknown";
export type AnalyticsReportType = "free" | "future_coordinate";
export type AnalyticsGenerationSource = "local" | "ai" | "cache" | "preview";
export type AnalyticsErrorStage = "provider_response" | "request" | "redirect" | "verification";

type AnalyticsParameters = Record<string, unknown>;

type PendingAnalyticsCheckout = {
  analyticsTransactionId: string;
  paymentMethod: AnalyticsPaymentMethod;
};

const ANALYTICS_ONCE_PREFIX = "morning-page-analytics-once";
const PENDING_CHECKOUT_KEY = "morning-page-analytics-checkout";

const FUTURE_COORDINATE_ITEM = {
  item_id: FUTURE_COORDINATE_PRODUCT_CODE,
  item_name: FUTURE_COORDINATE_PRODUCT_NAME,
  price: FUTURE_COORDINATE_PRICE,
  quantity: 1
};

function sendAnalyticsEvent(eventName: string, parameters?: AnalyticsParameters) {
  if (typeof window === "undefined" || !window.gtag) return false;
  window.gtag("event", eventName, parameters);
  return true;
}

function onceMarker(eventName: string, dedupeKey: string) {
  return `${ANALYTICS_ONCE_PREFIX}:${eventName}:${dedupeKey}`;
}

function sendAnalyticsEventOnce(eventName: string, dedupeKey: string, parameters?: AnalyticsParameters) {
  if (typeof window === "undefined") return false;

  const marker = onceMarker(eventName, dedupeKey);
  try {
    if (window.sessionStorage.getItem(marker)) return true;
  } catch {
    // Analytics should never interrupt the service when storage is restricted.
  }

  if (!sendAnalyticsEvent(eventName, parameters)) return false;

  try {
    window.sessionStorage.setItem(marker, "1");
  } catch {
    // The event was sent even if a local duplicate marker cannot be stored.
  }
  return true;
}

function ecommerceParameters() {
  return {
    currency: "KRW",
    value: FUTURE_COORDINATE_PRICE,
    items: [FUTURE_COORDINATE_ITEM]
  };
}

function createAnalyticsTransactionId() {
  return `ga-fc-${crypto.randomUUID()}`;
}

function savePendingCheckout(checkout: PendingAnalyticsCheckout) {
  try {
    window.sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(checkout));
  } catch {
    // Payment must continue even when analytics storage is unavailable.
  }
}

function readPendingCheckout(): PendingAnalyticsCheckout | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(window.sessionStorage.getItem(PENDING_CHECKOUT_KEY) || "null") as Partial<PendingAnalyticsCheckout> | null;
    if (
      !value
      || typeof value.analyticsTransactionId !== "string"
      || !value.analyticsTransactionId.startsWith("ga-fc-")
      || !["card", "kakaopay", "naverpay", "unknown"].includes(value.paymentMethod || "")
    ) {
      return null;
    }
    return value as PendingAnalyticsCheckout;
  } catch {
    return null;
  }
}

function clearPendingCheckout() {
  try {
    window.sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
  } catch {
    // Ignore storage restrictions.
  }
}

export function sendAnalyticsPageView(measurementId: string, pathname: string) {
  if (typeof window === "undefined" || !window.gtag) return false;

  const safePath = pathname.startsWith("/") ? pathname : "/";
  window.gtag("event", "page_view", {
    send_to: measurementId,
    page_path: safePath,
    page_location: `${window.location.origin}${safePath}`,
    page_title: document.title
  });
  return true;
}

export function trackInterviewStart() {
  sendAnalyticsEvent("interview_start");
}

export function trackInterviewComplete() {
  sendAnalyticsEvent("interview_complete", { question_count: 11 });
}

export function trackFutureCoordinateView() {
  sendAnalyticsEventOnce("view_item", FUTURE_COORDINATE_PRODUCT_CODE, ecommerceParameters());
}

export function startAnalyticsCheckout(paymentMethod: PurchasePaymentMethodId) {
  const checkout: PendingAnalyticsCheckout = {
    analyticsTransactionId: createAnalyticsTransactionId(),
    paymentMethod
  };
  savePendingCheckout(checkout);
  sendAnalyticsEvent("begin_checkout", {
    ...ecommerceParameters(),
    payment_method: paymentMethod
  });
}

export function trackPurchaseSuccess() {
  const checkout = readPendingCheckout();
  if (!checkout) return;
  const tracked = sendAnalyticsEventOnce("purchase", checkout.analyticsTransactionId, {
    transaction_id: checkout.analyticsTransactionId,
    ...ecommerceParameters(),
    payment_method: checkout.paymentMethod
  });
  if (tracked) clearPendingCheckout();
}

export function trackPaymentError(
  stage: AnalyticsErrorStage,
  paymentMethod?: AnalyticsPaymentMethod
) {
  const method = paymentMethod || readPendingCheckout()?.paymentMethod || "unknown";
  sendAnalyticsEvent("payment_error", {
    payment_method: method,
    error_stage: stage
  });
}

export function trackReportGenerated(
  reportType: AnalyticsReportType,
  generationSource: AnalyticsGenerationSource,
  dedupeKey: string
) {
  sendAnalyticsEventOnce("report_generated", `${reportType}:${dedupeKey}`, {
    report_type: reportType,
    generation_source: generationSource
  });
}

export function trackReportError(retryable: boolean) {
  sendAnalyticsEvent("report_error", { retryable });
}

export function trackPdfDownload(reportType: AnalyticsReportType) {
  sendAnalyticsEvent("pdf_download", { report_type: reportType });
}

export function trackFirstActionCommitted() {
  sendAnalyticsEvent("first_action_committed");
}
