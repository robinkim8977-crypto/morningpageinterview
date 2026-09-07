import test from "node:test";
import assert from "node:assert/strict";
import {
  sendAnalyticsPageView,
  startAnalyticsCheckout,
  trackFutureCoordinateView,
  trackPaymentError,
  trackPurchaseSuccess,
  trackReportGenerated
} from "../lib/analytics.ts";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

function withAnalyticsWindow(run) {
  const calls = [];
  const previousWindow = global.window;
  const previousDocument = global.document;
  global.window = {
    location: { origin: "https://app.test" },
    sessionStorage: memoryStorage(),
    gtag: (...args) => calls.push(args)
  };
  global.document = { title: "테스트 페이지" };

  try {
    run(calls);
  } finally {
    global.window = previousWindow;
    global.document = previousDocument;
  }
}

test("페이지뷰는 검색어와 결제번호 없이 경로만 전송한다", () => {
  withAnalyticsWindow((calls) => {
    sendAnalyticsPageView("G-TEST", "/future-coordinate/payment-complete");

    assert.deepEqual(calls[0], ["event", "page_view", {
      send_to: "G-TEST",
      page_path: "/future-coordinate/payment-complete",
      page_location: "https://app.test/future-coordinate/payment-complete",
      page_title: "테스트 페이지"
    }]);
    assert.equal(JSON.stringify(calls).includes("paymentId"), false);
  });
});

test("상품 조회는 한 세션에서 중복 전송하지 않는다", () => {
  withAnalyticsWindow((calls) => {
    trackFutureCoordinateView();
    trackFutureCoordinateView();

    assert.equal(calls.filter((call) => call[1] === "view_item").length, 1);
  });
});

test("결제 시작과 성공은 GA 전용 거래번호와 정해진 상품 정보만 보낸다", () => {
  withAnalyticsWindow((calls) => {
    startAnalyticsCheckout("kakaopay");
    trackPurchaseSuccess();

    const beginCheckout = calls.find((call) => call[1] === "begin_checkout");
    const purchase = calls.find((call) => call[1] === "purchase");
    assert.equal(beginCheckout[2].payment_method, "kakaopay");
    assert.equal(beginCheckout[2].value, 2900);
    assert.equal(purchase[2].transaction_id.startsWith("ga-fc-"), true);
    assert.equal(purchase[2].payment_method, "kakaopay");
    assert.equal(purchase[2].items[0].item_id, "future-coordinate-report-v1");
    assert.equal(JSON.stringify(purchase).includes("fc-payment"), false);
  });
});

test("결제 준비 기록이 없으면 중복 구매 이벤트를 만들지 않는다", () => {
  withAnalyticsWindow((calls) => {
    trackPurchaseSuccess();
    assert.equal(calls.length, 0);
  });
});

test("오류 이벤트에는 원문 메시지나 결제번호를 넣지 않는다", () => {
  withAnalyticsWindow((calls) => {
    trackPaymentError("verification", "naverpay");

    assert.deepEqual(calls[0], ["event", "payment_error", {
      payment_method: "naverpay",
      error_stage: "verification"
    }]);
  });
});

test("같은 리포트 생성은 한 세션에서 한 번만 기록한다", () => {
  withAnalyticsWindow((calls) => {
    trackReportGenerated("future_coordinate", "ai", "generated-at-1");
    trackReportGenerated("future_coordinate", "cache", "generated-at-1");

    assert.equal(calls.filter((call) => call[1] === "report_generated").length, 1);
  });
});
