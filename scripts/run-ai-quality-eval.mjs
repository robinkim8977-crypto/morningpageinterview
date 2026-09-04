import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { aiQualityCases } from "../evals/ai-quality-cases.ts";
import { evaluateAiQuality } from "../lib/ai-quality.ts";

const args = process.argv.slice(2);
const live = args.includes("--live");
const runAll = args.includes("--all");
const caseId = args.find((arg) => arg.startsWith("--case="))?.slice("--case=".length);

if (!live) {
  console.log("AI 품질 평가 데이터셋 준비 완료 (API 호출 없음)\n");
  for (const item of aiQualityCases) {
    console.log(`- ${item.id}: ${item.label}`);
    console.log(`  ${item.purpose}`);
  }
  console.log("\n실제 평가: pnpm eval:ai:live -- --case=creative-rhythm");
  console.log("전체 평가: pnpm eval:ai:live -- --all");
  process.exit(0);
}

if (!process.env.OPENAI_API_KEY?.trim()) {
  console.error("OPENAI_API_KEY가 없습니다. .env.local에 서버용 키를 설정한 뒤 다시 실행하세요.");
  process.exit(1);
}

if (!runAll && !caseId) {
  console.error("비용이 발생하는 범위를 명확히 하도록 --case=<id> 또는 --all 중 하나를 지정해야 합니다.");
  process.exit(1);
}

const selectedCases = runAll ? aiQualityCases : aiQualityCases.filter((item) => item.id === caseId);
if (selectedCases.length === 0) {
  console.error(`평가 사례를 찾지 못했습니다: ${caseId}`);
  process.exit(1);
}

process.env.NODE_ENV = "development";
process.env.PAYMENT_LEDGER_ENFORCED = "false";
process.env.FUTURE_COORDINATE_AI_ENABLED = "true";

const { POST: createReport } = await import("../app/api/report/route.ts");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputDirectory = resolve(".local-archive", "ai-evals", timestamp);
await mkdir(outputDirectory, { recursive: true });

const results = [];
for (const item of selectedCases) {
  console.log(`\n[${item.id}] ${item.label} 평가 중...`);
  const response = await createReport(new Request("http://localhost/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session: item.session })
  }));
  const payload = await response.json();

  if (!response.ok) {
    console.error(`생성 실패 (${response.status}):`, payload.error ?? payload.message ?? "알 수 없는 오류");
    results.push({ id: item.id, label: item.label, status: response.status, error: payload });
    continue;
  }

  const quality = evaluateAiQuality(item.session, payload, item.expectations);
  const result = {
    id: item.id,
    label: item.label,
    status: response.status,
    model: payload.model,
    usage: payload.usage,
    quality,
    report: payload
  };
  results.push(result);
  await writeFile(resolve(outputDirectory, `${item.id}.json`), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(`${quality.passed ? "통과" : "실패"}: ${quality.score}/100`);
  for (const failed of quality.checks.filter((check) => !check.passed)) {
    console.log(`  - ${failed.label}: ${failed.score}/${failed.maxScore} (${failed.detail})`);
  }
}

const completed = results.filter((result) => "quality" in result);
const summary = {
  generatedAt: new Date().toISOString(),
  model: process.env.OPENAI_MODEL?.trim() || "gpt-5.6-terra",
  cases: results.length,
  passed: completed.filter((result) => result.quality.passed).length,
  averageScore: completed.length
    ? Math.round(completed.reduce((sum, result) => sum + result.quality.score, 0) / completed.length)
    : 0,
  results: results.map(({ report, ...result }) => result)
};
await writeFile(resolve(outputDirectory, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(`\n평가 결과 저장: ${outputDirectory}`);
console.log(`통과 ${summary.passed}/${summary.cases}, 평균 ${summary.averageScore}/100`);
if (summary.passed !== summary.cases) process.exitCode = 1;
