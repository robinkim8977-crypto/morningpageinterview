"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, Search } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RecoveryStatus = "processing" | "completed" | "failed" | "retry_allowed";

type RecoveryEvent = {
  action: "marked_stale_failed" | "retry_authorized" | "retry_started";
  at: string;
  reason: string;
};

type RecoveryRecord = {
  status: RecoveryStatus;
  productCode: string;
  attemptId: string;
  startedAt: string;
  completedAt?: string;
  failedAt?: string;
  errorCode?: string;
  previousErrorCode?: string;
  retryCount: number;
  diagnostics?: {
    openaiClientRequestId?: string;
    openaiRequestId?: string;
    openaiHttpStatus?: number;
  };
  recoveryEvents: RecoveryEvent[];
};

type RecoveryResponse = {
  ok?: boolean;
  record?: RecoveryRecord | null;
  payment?: { verified: boolean; status?: string; amount?: number; error?: string };
  error?: string;
  message?: string;
};

const statusCopy: Record<RecoveryStatus, { label: string; description: string; tone: string }> = {
  processing: {
    label: "생성 처리 중",
    description: "정상 생성 중이거나 서버 중단 후 처리 상태가 남아 있을 수 있습니다.",
    tone: "border-amber-300 bg-amber-50 text-amber-900"
  },
  completed: {
    label: "생성 완료",
    description: "AI 결과 생성과 결제 사용 처리가 완료됐습니다. 재시도를 허용할 수 없습니다.",
    tone: "border-emerald-300 bg-emerald-50 text-emerald-900"
  },
  failed: {
    label: "생성 실패 · 검토 필요",
    description: "오류 원인을 확인한 뒤 한 번의 재시도를 허용할 수 있습니다.",
    tone: "border-red-300 bg-red-50 text-red-900"
  },
  retry_allowed: {
    label: "1회 재시도 허용됨",
    description: "고객이 결과 화면에서 다시 시도하면 이 권한을 한 번만 사용합니다.",
    tone: "border-blue-300 bg-blue-50 text-blue-900"
  }
};

function localDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ko-KR");
}

function eventLabel(action: RecoveryEvent["action"]) {
  if (action === "marked_stale_failed") return "오래된 처리 건을 실패로 전환";
  if (action === "retry_authorized") return "운영자 재시도 허용";
  return "고객이 재시도 권한 사용";
}

export function AdminRecoverySection() {
  const [secret, setSecret] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [reason, setReason] = useState("");
  const [data, setData] = useState<RecoveryResponse | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function request(action: "inspect" | "mark_stale_failed" | "authorize_retry") {
    if (!secret.trim() || !paymentId.trim()) {
      setMessage("운영 비밀키와 결제번호를 입력해 주세요.");
      return;
    }
    if (action !== "inspect" && reason.trim().length < 5) {
      setMessage("복구 사유를 5자 이상 입력해 주세요. 개인정보는 적지 마세요.");
      return;
    }
    if (action !== "inspect" && !window.confirm("이 운영 복구 작업을 실행할까요?")) return;

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/recovery", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ paymentId: paymentId.trim(), action, reason: reason.trim() })
      });
      const next = await response.json() as RecoveryResponse;
      if (!response.ok) throw new Error(next.message || "운영 복구 요청을 처리하지 못했습니다.");
      setData(next);
      if (action === "mark_stale_failed") setMessage("처리 중 기록을 실패 상태로 변경했습니다. 원인을 확인한 뒤 재시도를 허용하세요.");
      if (action === "authorize_retry") setMessage("1회 재시도를 허용했습니다. 고객에게 결과 화면에서 ‘다시 시도하기’를 눌러달라고 안내하세요.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "운영 복구 요청을 처리하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void request("inspect");
  }

  const record = data?.record;
  const copy = record ? statusCopy[record.status] : null;

  return (
    <main className="page-shell min-h-screen bg-[#F8F7F4]">
      <Header />
      <section className="mx-auto max-w-4xl px-6 py-14 md:py-20">
        <p className="text-xs font-bold tracking-[0.16em] text-black/45">PRIVATE OPERATIONS</p>
        <h1 className="ko-keep mt-3 text-4xl font-medium tracking-[-0.055em] md:text-5xl">결제·리포트 장애 복구</h1>
        <p className="ko-keep mt-5 max-w-2xl text-sm leading-7 text-black/58">
          결제번호로 승인과 생성 상태를 확인하고, 실패한 리포트에만 한 번의 재시도를 허용합니다. 비밀키는 브라우저에 저장하지 않습니다.
        </p>

        <form onSubmit={submit} className="mt-10 grid gap-5 rounded-[28px] border border-black/15 bg-white p-6 md:p-8">
          <label className="grid gap-2">
            <span className="text-xs font-bold tracking-[0.1em] text-black/48">운영 복구 비밀키</span>
            <Input
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              autoComplete="off"
              className="rounded-xl text-left"
              placeholder="Vercel에 설정한 ADMIN_RECOVERY_SECRET"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-bold tracking-[0.1em] text-black/48">PortOne 결제번호</span>
            <Input
              value={paymentId}
              onChange={(event) => setPaymentId(event.target.value)}
              autoComplete="off"
              className="rounded-xl text-left"
              placeholder="fc-..."
            />
          </label>
          <Button type="submit" disabled={loading} className="justify-self-start">
            {loading ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />}
            상태 조회
          </Button>
        </form>

        {message ? (
          <div className="ko-keep mt-6 flex gap-3 rounded-2xl border border-black/15 bg-white px-5 py-4 text-sm leading-6">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <p>{message}</p>
          </div>
        ) : null}

        {data ? (
          <section className="mt-8 grid gap-6">
            <article className="rounded-[28px] border border-black/15 bg-white p-6 md:p-8">
              <h2 className="ko-keep text-xl font-semibold">결제 승인 상태</h2>
              <div className="mt-5 flex items-center gap-3">
                {data.payment?.verified ? <CheckCircle2 className="text-emerald-700" /> : <AlertTriangle className="text-red-700" />}
                <p className="font-semibold">
                  {data.payment?.verified
                    ? `정상 승인 · ${data.payment.amount?.toLocaleString("ko-KR")}원`
                    : `확인 실패 · ${data.payment?.error || "알 수 없는 오류"}`}
                </p>
              </div>
            </article>

            <article className="rounded-[28px] border border-black/15 bg-white p-6 md:p-8">
              <h2 className="ko-keep text-xl font-semibold">리포트 생성 기록</h2>
              {!record || !copy ? (
                <p className="ko-keep mt-5 text-sm leading-6 text-black/58">아직 생성 장부가 없습니다. 결제가 정상이라면 고객이 결과 화면에 다시 접속하도록 안내하세요.</p>
              ) : (
                <>
                  <div className={`mt-5 rounded-2xl border px-5 py-4 ${copy.tone}`}>
                    <p className="font-bold">{copy.label}</p>
                    <p className="ko-keep mt-1 text-sm leading-6 opacity-80">{copy.description}</p>
                  </div>
                  <dl className="mt-6 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                    <div><dt className="text-black/45">생성 시작</dt><dd className="mt-1 font-medium">{localDateTime(record.startedAt)}</dd></div>
                    <div><dt className="text-black/45">완료</dt><dd className="mt-1 font-medium">{localDateTime(record.completedAt)}</dd></div>
                    <div><dt className="text-black/45">실패</dt><dd className="mt-1 font-medium">{localDateTime(record.failedAt)}</dd></div>
                    <div><dt className="text-black/45">오류 코드</dt><dd className="mt-1 break-all font-mono text-xs">{record.errorCode || record.previousErrorCode || "—"}</dd></div>
                    <div><dt className="text-black/45">재시도 횟수</dt><dd className="mt-1 font-medium">{record.retryCount}</dd></div>
                    <div><dt className="text-black/45">OpenAI 요청 ID</dt><dd className="mt-1 break-all font-mono text-xs">{record.diagnostics?.openaiRequestId || record.diagnostics?.openaiClientRequestId || "—"}</dd></div>
                  </dl>

                  {record.recoveryEvents.length ? (
                    <div className="mt-8 border-t border-black/12 pt-6">
                      <h3 className="text-sm font-bold">복구 이력</h3>
                      <ul className="mt-3 grid gap-3 text-sm">
                        {record.recoveryEvents.map((event, index) => (
                          <li key={`${event.at}-${index}`} className="rounded-xl bg-black/[0.035] px-4 py-3">
                            <p className="font-semibold">{eventLabel(event.action)} · {localDateTime(event.at)}</p>
                            <p className="ko-keep mt-1 text-black/55">{event.reason}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              )}
            </article>

            {record?.status === "processing" || record?.status === "failed" ? (
              <article className="rounded-[28px] border border-red-200 bg-red-50/50 p-6 md:p-8">
                <h2 className="ko-keep text-xl font-semibold">복구 작업</h2>
                <p className="ko-keep mt-3 text-sm leading-6 text-black/58">고객 이름·답변 등 개인정보를 적지 말고 장애 원인만 기록하세요.</p>
                <label className="mt-5 grid gap-2">
                  <span className="text-xs font-bold tracking-[0.1em] text-black/48">복구 사유</span>
                  <Input
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="rounded-xl text-left"
                    placeholder="예: OpenAI 500 오류 확인 후 재시도 승인"
                  />
                </label>
                <div className="mt-5 flex flex-wrap gap-3">
                  {record.status === "processing" ? (
                    <Button type="button" variant="outline" disabled={loading} onClick={() => void request("mark_stale_failed")}>
                      오래된 처리 건을 실패로 전환
                    </Button>
                  ) : (
                    <Button type="button" disabled={loading} onClick={() => void request("authorize_retry")}>
                      이 결제에 1회 재시도 허용
                    </Button>
                  )}
                </div>
                {record.status === "processing" ? <p className="ko-keep mt-3 text-xs leading-5 text-black/45">생성 시작 후 30분이 지난 기록에만 사용할 수 있습니다.</p> : null}
              </article>
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}
