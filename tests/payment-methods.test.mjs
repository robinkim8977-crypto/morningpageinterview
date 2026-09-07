import test from "node:test";
import assert from "node:assert/strict";
import {
  configuredPurchasePaymentMethods,
  paymentFailureMessage,
  paymentRequestMethod
} from "../lib/payment-methods.ts";

test("기존 채널 키를 카드 결제용으로 계속 사용할 수 있다", () => {
  const methods = configuredPurchasePaymentMethods({ legacyCardChannelKey: " legacy-card " });

  assert.deepEqual(methods.map((method) => method.id), ["card"]);
  assert.deepEqual(paymentRequestMethod(methods[0]), {
    channelKey: "legacy-card",
    payMethod: "CARD"
  });
});

test("새 카드 채널 키가 기존 채널 키보다 우선한다", () => {
  const methods = configuredPurchasePaymentMethods({
    cardChannelKey: "new-card",
    legacyCardChannelKey: "legacy-card"
  });

  assert.equal(methods[0].channelKey, "new-card");
});

test("설정된 카드·카카오페이·네이버페이만 올바른 요청값으로 노출한다", () => {
  const methods = configuredPurchasePaymentMethods({
    cardChannelKey: "card-channel",
    kakaopayChannelKey: "kakao-channel",
    naverpayChannelKey: "naver-channel"
  });

  assert.deepEqual(methods.map((method) => method.id), ["card", "kakaopay", "naverpay"]);
  assert.deepEqual(paymentRequestMethod(methods[1]), {
    channelKey: "kakao-channel",
    payMethod: "EASY_PAY",
    easyPay: { easyPayProvider: "KAKAOPAY" }
  });
  assert.deepEqual(paymentRequestMethod(methods[2]), {
    channelKey: "naver-channel",
    payMethod: "EASY_PAY",
    easyPay: { easyPayProvider: "NAVERPAY" }
  });
});

test("빈 채널은 노출하지 않는다", () => {
  const methods = configuredPurchasePaymentMethods({
    cardChannelKey: "   ",
    kakaopayChannelKey: "kakao-channel",
    naverpayChannelKey: ""
  });

  assert.deepEqual(methods.map((method) => method.id), ["kakaopay"]);
});

test("PG 취소·실패 메시지는 원문을 유지하고, 없을 때만 기본 문구를 쓴다", () => {
  const providerMessage = "사용자가 네이버페이 결제를 취소했습니다. [NPAY-CANCEL]";

  assert.equal(paymentFailureMessage(providerMessage), providerMessage);
  assert.equal(paymentFailureMessage(""), "결제가 완료되지 않았습니다.");
  assert.equal(paymentFailureMessage(undefined), "결제가 완료되지 않았습니다.");
});
