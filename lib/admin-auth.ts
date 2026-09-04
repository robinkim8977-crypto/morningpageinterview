import { timingSafeEqual } from "node:crypto";

export type AdminAuthorization =
  | { ok: true }
  | { ok: false; status: 401 | 503; code: string; message: string };

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function authorizeRecoveryAdmin(request: Request): AdminAuthorization {
  const configuredSecret = process.env.ADMIN_RECOVERY_SECRET?.trim();
  if (!configuredSecret || configuredSecret.length < 32) {
    return {
      ok: false,
      status: 503,
      code: "ADMIN_RECOVERY_NOT_CONFIGURED",
      message: "운영 복구 비밀키가 아직 설정되지 않았습니다."
    };
  }

  const authorization = request.headers.get("authorization") || "";
  const providedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!providedSecret || !safeEqual(providedSecret, configuredSecret)) {
    return {
      ok: false,
      status: 401,
      code: "ADMIN_RECOVERY_UNAUTHORIZED",
      message: "운영 복구 비밀키를 확인해 주세요."
    };
  }

  return { ok: true };
}
