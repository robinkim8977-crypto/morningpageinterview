import assert from "node:assert/strict";
import test from "node:test";
import { authorizeRecoveryAdmin } from "../lib/admin-auth.ts";

test("운영 복구 API는 설정된 Bearer 비밀키만 허용한다", () => {
  const original = process.env.ADMIN_RECOVERY_SECRET;
  const secret = "s".repeat(64);

  try {
    delete process.env.ADMIN_RECOVERY_SECRET;
    assert.deepEqual(
      authorizeRecoveryAdmin(new Request("https://example.com/api/admin/recovery")),
      {
        ok: false,
        status: 503,
        code: "ADMIN_RECOVERY_NOT_CONFIGURED",
        message: "운영 복구 비밀키가 아직 설정되지 않았습니다."
      }
    );

    process.env.ADMIN_RECOVERY_SECRET = secret;
    const denied = authorizeRecoveryAdmin(new Request("https://example.com/api/admin/recovery", {
      headers: { Authorization: "Bearer wrong-secret" }
    }));
    assert.equal(denied.ok, false);
    assert.equal(denied.status, 401);

    assert.deepEqual(
      authorizeRecoveryAdmin(new Request("https://example.com/api/admin/recovery", {
        headers: { Authorization: `Bearer ${secret}` }
      })),
      { ok: true }
    );
  } finally {
    if (original === undefined) delete process.env.ADMIN_RECOVERY_SECRET;
    else process.env.ADMIN_RECOVERY_SECRET = original;
  }
});
