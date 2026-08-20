import { NextResponse } from "next/server";
import { verifyFutureCoordinatePayment } from "@/lib/portone";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON", message: "결제 정보를 확인할 수 없습니다." }, { status: 400 });
  }

  const paymentId = body && typeof body === "object" && "paymentId" in body
    ? (body as { paymentId?: unknown }).paymentId
    : undefined;

  if (typeof paymentId !== "string" || !paymentId || paymentId.length > 100) {
    return NextResponse.json({ error: "PAYMENT_ID_REQUIRED", message: "결제번호가 없습니다." }, { status: 400 });
  }

  try {
    const payment = await verifyFutureCoordinatePayment(paymentId);
    return NextResponse.json({ verified: true, payment });
  } catch (error) {
    const code = error instanceof Error ? error.message : "PAYMENT_VERIFICATION_FAILED";
    const notConfigured = code === "PAYMENT_NOT_CONFIGURED";
    return NextResponse.json(
      {
        error: code,
        message: notConfigured
          ? "결제 검증 설정이 아직 완료되지 않았습니다."
          : "결제 승인 상태를 확인하지 못했습니다. 결제 내역을 확인한 뒤 고객센터로 문의해 주세요."
      },
      { status: notConfigured ? 503 : 400 }
    );
  }
}
