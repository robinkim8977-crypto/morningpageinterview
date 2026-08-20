import {
  FUTURE_COORDINATE_PRICE,
  FUTURE_COORDINATE_PRODUCT_CODE,
  FUTURE_COORDINATE_PRODUCT_NAME
} from "@/lib/payment";

type PortOnePayment = {
  id?: string;
  storeId?: string;
  status?: string;
  orderName?: string;
  amount?: { total?: number };
  customData?: unknown;
};

export type VerifiedFutureCoordinatePayment = {
  paymentId: string;
  status: "PAID";
  amount: number;
};

function parseCustomData(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : null;
    } catch {
      return null;
    }
  }
  return null;
}

export async function verifyFutureCoordinatePayment(paymentId: string): Promise<VerifiedFutureCoordinatePayment> {
  const apiSecret = process.env.PORTONE_API_SECRET?.trim();
  if (!apiSecret) {
    throw new Error("PAYMENT_NOT_CONFIGURED");
  }

  const response = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `PortOne ${apiSecret}` },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("PAYMENT_LOOKUP_FAILED");
  }

  const payment = await response.json() as PortOnePayment;
  const customData = parseCustomData(payment.customData);
  const expectedStoreId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID?.trim();

  if (payment.status !== "PAID") throw new Error("PAYMENT_NOT_PAID");
  if (payment.amount?.total !== FUTURE_COORDINATE_PRICE) throw new Error("PAYMENT_AMOUNT_MISMATCH");
  if (payment.orderName !== FUTURE_COORDINATE_PRODUCT_NAME) throw new Error("PAYMENT_PRODUCT_MISMATCH");
  if (customData?.productCode !== FUTURE_COORDINATE_PRODUCT_CODE) throw new Error("PAYMENT_PRODUCT_MISMATCH");
  if (expectedStoreId && payment.storeId !== expectedStoreId) throw new Error("PAYMENT_STORE_MISMATCH");

  return {
    paymentId,
    status: "PAID",
    amount: FUTURE_COORDINATE_PRICE
  };
}
