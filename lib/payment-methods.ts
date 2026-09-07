export type PurchasePaymentMethodId = "card" | "kakaopay" | "naverpay";

export type PurchasePaymentMethod = {
  id: PurchasePaymentMethodId;
  label: string;
  description: string;
  channelKey: string;
  payMethod: "CARD" | "EASY_PAY";
  easyPayProvider?: "KAKAOPAY" | "NAVERPAY";
};

export type PaymentChannelConfiguration = {
  cardChannelKey?: string;
  legacyCardChannelKey?: string;
  kakaopayChannelKey?: string;
  naverpayChannelKey?: string;
};

function cleanChannelKey(value?: string) {
  return value?.trim() || "";
}

export function configuredPurchasePaymentMethods(
  configuration: PaymentChannelConfiguration
): PurchasePaymentMethod[] {
  const cardChannelKey = cleanChannelKey(configuration.cardChannelKey)
    || cleanChannelKey(configuration.legacyCardChannelKey);
  const kakaopayChannelKey = cleanChannelKey(configuration.kakaopayChannelKey);
  const naverpayChannelKey = cleanChannelKey(configuration.naverpayChannelKey);
  const methods: PurchasePaymentMethod[] = [];

  if (cardChannelKey) {
    methods.push({
      id: "card",
      label: "신용·체크카드",
      description: "카드사 결제창에서 결제",
      channelKey: cardChannelKey,
      payMethod: "CARD"
    });
  }
  if (kakaopayChannelKey) {
    methods.push({
      id: "kakaopay",
      label: "카카오페이",
      description: "카카오페이로 간편결제",
      channelKey: kakaopayChannelKey,
      payMethod: "EASY_PAY",
      easyPayProvider: "KAKAOPAY"
    });
  }
  if (naverpayChannelKey) {
    methods.push({
      id: "naverpay",
      label: "네이버페이",
      description: "네이버페이로 간편결제",
      channelKey: naverpayChannelKey,
      payMethod: "EASY_PAY",
      easyPayProvider: "NAVERPAY"
    });
  }

  return methods;
}

export function paymentRequestMethod(method: PurchasePaymentMethod) {
  return {
    channelKey: method.channelKey,
    payMethod: method.payMethod,
    ...(method.easyPayProvider
      ? { easyPay: { easyPayProvider: method.easyPayProvider } }
      : {})
  };
}

export function paymentFailureMessage(message?: string) {
  return message || "결제가 완료되지 않았습니다.";
}
