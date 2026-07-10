import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error: "AI_REPORT_DISABLED",
      message: "이번 출시 버전에서는 결과 페이지가 저장된 인터뷰 답변만으로 구성됩니다."
    },
    { status: 410 }
  );
}
