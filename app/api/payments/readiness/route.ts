import { NextResponse } from "next/server";
import { configuredPaymentUsageLedger } from "@/lib/payment-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    if (!process.env.PORTONE_API_SECRET?.trim()
      || !process.env.OPENAI_API_KEY?.trim()
      || process.env.FUTURE_COORDINATE_AI_ENABLED?.trim() !== "true") {
      throw new Error("REPORT_SERVICE_NOT_CONFIGURED");
    }
    await configuredPaymentUsageLedger().checkAvailability();
    return NextResponse.json({ ready: true }, { headers });
  } catch {
    // Do not expose credentials or provider diagnostics through this public API.
    return NextResponse.json({
      ready: false,
      message: "리포트 제공 서비스를 점검하고 있어 결제를 잠시 중단했습니다. 잠시 후 다시 이용해 주세요. 이미 결제하셨다면 추가 결제하지 마세요."
    }, { status: 503, headers });
  }
}
