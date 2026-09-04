import { NextResponse } from "next/server";
import { authorizeRecoveryAdmin } from "@/lib/admin-auth";
import {
  configuredPaymentUsageLedger,
  PaymentLedgerError,
  type PaymentUsageRecord
} from "@/lib/payment-ledger";
import { verifyFutureCoordinatePayment } from "@/lib/portone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STALE_PROCESSING_MINIMUM_MS = 30 * 60 * 1000;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" }
  });
}

function validPaymentId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 100;
}

function sanitizedReason(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, 240);
}

function adminRecord(record: PaymentUsageRecord | null) {
  if (!record) return null;
  return {
    status: record.status,
    productCode: record.productCode,
    attemptId: record.attemptId,
    startedAt: record.startedAt,
    completedAt: record.completedAt,
    failedAt: record.failedAt,
    errorCode: record.errorCode,
    previousErrorCode: record.previousErrorCode,
    retryCount: record.retryCount ?? 0,
    diagnostics: record.diagnostics,
    recoveryEvents: record.recoveryEvents ?? []
  };
}

function authorizationError(request: Request) {
  const authorization = authorizeRecoveryAdmin(request);
  return authorization.ok
    ? null
    : json({ error: authorization.code, message: authorization.message }, authorization.status);
}

function ledgerError(error: unknown) {
  if (error instanceof PaymentLedgerError) {
    return json({ error: error.code, message: error.message }, error.status);
  }
  console.error("Admin recovery operation failed", error);
  return json(
    { error: "ADMIN_RECOVERY_FAILED", message: "운영 복구 작업을 완료하지 못했습니다." },
    503
  );
}

async function paymentVerification(paymentId: string) {
  try {
    const payment = await verifyFutureCoordinatePayment(paymentId);
    return { verified: true as const, status: payment.status, amount: payment.amount };
  } catch (error) {
    return {
      verified: false as const,
      error: error instanceof Error ? error.message : "PAYMENT_VERIFICATION_FAILED"
    };
  }
}

export async function POST(request: Request) {
  const denied = authorizationError(request);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "INVALID_JSON", message: "요청 내용을 확인할 수 없습니다." }, 400);
  }

  const input = body && typeof body === "object"
    ? body as { paymentId?: unknown; action?: unknown; reason?: unknown }
    : {};
  if (!validPaymentId(input.paymentId)) {
    return json({ error: "PAYMENT_ID_REQUIRED", message: "결제번호를 입력해 주세요." }, 400);
  }

  const paymentId = input.paymentId.trim();
  if (input.action === "inspect") {
    try {
      const ledger = configuredPaymentUsageLedger();
      const [record, payment] = await Promise.all([
        ledger.inspect(paymentId),
        paymentVerification(paymentId)
      ]);
      return json({ record: adminRecord(record), payment });
    } catch (error) {
      return ledgerError(error);
    }
  }

  const reason = sanitizedReason(input.reason);
  if (reason.length < 5) {
    return json({ error: "RECOVERY_REASON_REQUIRED", message: "복구 사유를 5자 이상 입력해 주세요." }, 400);
  }

  const payment = await paymentVerification(paymentId);
  if (!payment.verified) {
    return json(
      { error: "PAYMENT_NOT_VERIFIED", message: "결제 승인 상태를 먼저 확인해야 합니다.", payment },
      409
    );
  }

  try {
    const ledger = configuredPaymentUsageLedger();
    const record = input.action === "mark_stale_failed"
      ? await ledger.markStaleProcessingFailed(paymentId, reason, STALE_PROCESSING_MINIMUM_MS)
      : input.action === "authorize_retry"
        ? await ledger.authorizeRetry(paymentId, reason)
        : null;

    if (!record) {
      return json({ error: "RECOVERY_ACTION_INVALID", message: "지원하지 않는 복구 작업입니다." }, 400);
    }

    console.info("Admin recovery action completed", {
      action: input.action,
      attemptId: record.attemptId,
      status: record.status
    });
    return json({ ok: true, record: adminRecord(record), payment });
  } catch (error) {
    return ledgerError(error);
  }
}
