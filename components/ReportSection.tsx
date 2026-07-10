"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { questions } from "@/data/questions";
import { readInterviewSession, resetInterviewState } from "@/lib/storage";
import type { InterviewSession } from "@/lib/types";

type MagazineSection = {
  number: string;
  title: string;
  question?: string;
  body: string;
};

type MemoryMagazine = {
  name: string;
  futureYear: string;
  sections: MagazineSection[];
  hardTimeSections: MagazineSection[];
  messageToPresent: string;
};

function currentFutureYear(offset: number) {
  return String(new Date().getFullYear() + offset);
}

function answerFor(session: InterviewSession, questionId: number) {
  return session.answers.find((answer) => answer.questionId === questionId)?.answer ?? "";
}

function questionLead(questionId: number) {
  return questions.find((question) => question.id === questionId)?.question.split("\n\n")[0] ?? "";
}

function normalizeAnswer(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitLongParagraph(paragraph: string) {
  if (paragraph.length < 420) {
    return [paragraph];
  }

  const sentences = paragraph
    .match(/[^.!?。！？]+[.!?。！？]?/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean);

  if (!sentences || sentences.length < 4) {
    return [paragraph];
  }

  const chunks: string[] = [];
  let current = "";

  sentences.forEach((sentence) => {
    const next = current ? `${current} ${sentence}` : sentence;

    if (next.length > 260 && current) {
      chunks.push(current);
      current = sentence;
      return;
    }

    current = next;
  });

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function paragraphs(value: string) {
  return normalizeAnswer(value)
    .split(/\n\s*\n/)
    .flatMap((paragraph) => splitLongParagraph(paragraph.trim()))
    .filter(Boolean);
}

function hasAnswer(value: string) {
  return normalizeAnswer(value).length > 0;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeFileName(name: string) {
  const safeName = name.trim().replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "_");
  return `${safeName || "morningpage"}_미래기억.pdf`;
}

function buildMagazine(session: InterviewSession): MemoryMagazine {
  const sectionData: MagazineSection[] = [
    {
      number: "01",
      title: "미래의 나",
      question: questionLead(1),
      body: answerFor(session, 1)
    },
    {
      number: "02",
      title: "내가 도착한 공간",
      question: questionLead(2),
      body: answerFor(session, 2)
    },
    {
      number: "03",
      title: "미래의 평범한 하루",
      question: questionLead(3),
      body: answerFor(session, 3)
    },
    {
      number: "04",
      title: "마침내 현실이 된 순간",
      body: answerFor(session, 4)
    },
    {
      number: "05",
      title: "나를 여기까지 데려온 작은 습관",
      body: answerFor(session, 5)
    },
    {
      number: "07",
      title: "끝까지 지키고 싶은 것",
      body: answerFor(session, 9)
    },
    {
      number: "08",
      title: "다음에 꾸고 있는 꿈",
      body: answerFor(session, 10)
    }
  ].filter((section) => hasAnswer(section.body));

  const hardTimeSections: MagazineSection[] = [
    {
      number: "06-1",
      title: "가장 힘들었던 시간",
      body: answerFor(session, 6)
    },
    {
      number: "06-2",
      title: "다시 일어나게 만든 힘",
      body: answerFor(session, 7)
    },
    {
      number: "06-3",
      title: "내려놓은 생각",
      body: answerFor(session, 8)
    }
  ].filter((section) => hasAnswer(section.body));

  return {
    name: session.name.trim() || "당신",
    futureYear: currentFutureYear(session.futureYear),
    sections: sectionData,
    hardTimeSections,
    messageToPresent: answerFor(session, 11)
  };
}

function renderParagraphs(value: string, className = "space-y-5") {
  return (
    <div className={`ko-keep ${className}`}>
      {paragraphs(value).map((paragraph, index) => (
        <p key={`${paragraph.slice(0, 18)}-${index}`}>{paragraph}</p>
      ))}
    </div>
  );
}

function paragraphsHtml(value: string) {
  return paragraphs(value)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function sectionHtml(section: MagazineSection) {
  return `
    <section>
      <p class="number">${escapeHtml(section.number)}</p>
      <h2>${escapeHtml(section.title)}</h2>
      ${section.question ? `<p class="question">${escapeHtml(section.question)}</p>` : ""}
      <div class="body">${paragraphsHtml(section.body)}</div>
    </section>
  `;
}

function downloadMemoryPdf(magazine: MemoryMagazine) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");

  if (!printWindow) {
    window.print();
    return;
  }

  const sections = magazine.sections.map(sectionHtml).join("");
  const hardTime =
    magazine.hardTimeSections.length > 0
      ? `
        <section>
          <p class="number">06</p>
          <h2>지나온 시간</h2>
          ${magazine.hardTimeSections
            .map(
              (section) => `
                <article>
                  <h3>${escapeHtml(section.title)}</h3>
                  <div class="body">${paragraphsHtml(section.body)}</div>
                </article>
              `
            )
            .join("")}
        </section>
      `
      : "";
  const message = hasAnswer(magazine.messageToPresent)
    ? `
      <section>
        <p class="number">09</p>
        <h2>미래의 내가 보내는 한 문장</h2>
        <blockquote>${paragraphsHtml(magazine.messageToPresent)}</blockquote>
      </section>
    `
    : "";

  printWindow.document.write(`
    <!doctype html>
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(safeFileName(magazine.name).replace(/\\.pdf$/i, ""))}</title>
        <style>
          @page { margin: 20mm; }
          body {
            margin: 0;
            color: #111;
            background: #f5f4f2;
            font-family: -apple-system, BlinkMacSystemFont, "Pretendard", "Noto Sans KR", sans-serif;
            line-height: 1.78;
          }
          main { max-width: 760px; margin: 0 auto; padding: 24px 0 48px; }
          .brand { font-size: 12px; font-weight: 800; margin-bottom: 80px; }
          .cover { min-height: 82vh; display: grid; align-content: center; text-align: center; page-break-after: always; }
          h1 { white-space: pre-line; font-size: 42px; line-height: 1.18; letter-spacing: -0.05em; margin: 0 0 24px; font-weight: 500; }
          .subtitle { font-size: 17px; color: rgba(0,0,0,.62); }
          section { border-top: 1px solid rgba(0,0,0,.25); padding-top: 32px; margin-top: 52px; break-inside: avoid; }
          .number { font-size: 13px; font-weight: 800; margin: 0 0 12px; color: rgba(0,0,0,.58); }
          h2 { margin: 0 0 18px; font-size: 30px; line-height: 1.16; letter-spacing: -0.05em; font-weight: 500; }
          h3 { margin: 32px 0 12px; font-size: 19px; }
          .question { margin: 0 0 22px; font-size: 15px; font-weight: 700; color: rgba(0,0,0,.56); }
          p { margin: 0 0 13px; }
          .body { font-size: 16px; }
          blockquote {
            margin: 30px 0 0;
            padding: 36px 0;
            border-top: 1px solid #111;
            border-bottom: 1px solid #111;
            font-size: 28px;
            line-height: 1.5;
            letter-spacing: -0.04em;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <main>
          <div class="brand">THE MORNING PAGE INTERVIEW</div>
          <section class="cover">
            <h1>${escapeHtml(magazine.name)}님의 미래가<br />하나의 기록이 되었습니다</h1>
            <p class="subtitle">${escapeHtml(magazine.futureYear)}년의 내가 남긴 미래의 기억</p>
          </section>
          ${sections}
          ${hardTime}
          ${message}
        </main>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 300);
}

function MagazineCover({ magazine }: { magazine: MemoryMagazine }) {
  return (
    <section className="mx-auto grid min-h-[72vh] max-w-3xl place-items-center px-6 py-24 text-center md:py-32">
      <div>
        <p className="mb-9 text-sm font-bold tracking-[-0.03em] text-black/55">FUTURE MEMORY</p>
        <h1 className="ko-keep text-[clamp(42px,6vw,76px)] font-medium leading-tight tracking-[-0.065em]">
          {magazine.name}님의 미래가
          <br />
          하나의 기록이 되었습니다
        </h1>
        <p className="ko-keep mx-auto mt-8 max-w-xl text-lg font-medium leading-8 text-black/65">
          {magazine.futureYear}년의 내가 남긴 미래의 기억
          <br />
          11개의 답변 속에 담긴 미래의 장면과 마음을 한 편의 기록으로 엮었습니다.
        </p>
      </div>
    </section>
  );
}

function MagazineSectionView({ section }: { section: MagazineSection }) {
  return (
    <section className="mx-auto grid max-w-[1080px] gap-10 border-t border-black/20 px-[clamp(20px,6vw,96px)] py-14 md:grid-cols-[230px_1fr] md:py-20">
      <aside>
        <p className="mb-4 text-sm font-bold text-black/50">{section.number}</p>
        <h2 className="ko-keep text-[clamp(32px,4vw,56px)] font-medium leading-tight tracking-[-0.055em]">
          {section.title}
        </h2>
      </aside>
      <article className="max-w-3xl">
        {section.question ? <p className="ko-keep mb-8 text-lg font-bold leading-8 text-black/55">{section.question}</p> : null}
        <div className="ko-keep text-[18px] leading-9 tracking-[-0.01em] text-black md:text-[19px] md:leading-10">
          {renderParagraphs(section.body)}
        </div>
      </article>
    </section>
  );
}

function HardTimeSection({ sections }: { sections: MagazineSection[] }) {
  if (sections.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-[1080px] border-t border-black/20 px-[clamp(20px,6vw,96px)] py-14 md:py-20">
      <div className="mb-12 grid gap-6 md:grid-cols-[230px_1fr]">
        <div>
          <p className="mb-4 text-sm font-bold text-black/50">06</p>
          <h2 className="ko-keep text-[clamp(32px,4vw,56px)] font-medium leading-tight tracking-[-0.055em]">
            지나온 시간
          </h2>
        </div>
        <p className="ko-keep max-w-2xl self-end text-lg font-medium leading-8 text-black/55">
          미래의 기억 안에는 도착한 장면뿐 아니라, 그곳까지 걸어온 시간도 함께 남아 있습니다.
        </p>
      </div>

      <div className="grid gap-12">
        {sections.map((section) => (
          <article key={section.number} className="grid gap-5 md:grid-cols-[230px_1fr]">
            <h3 className="ko-keep text-2xl font-semibold leading-8 tracking-[-0.04em]">{section.title}</h3>
            <div className="ko-keep max-w-3xl text-[18px] leading-9 tracking-[-0.01em] md:text-[19px] md:leading-10">
              {renderParagraphs(section.body)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MessageSection({ message }: { message: string }) {
  if (!hasAnswer(message)) {
    return null;
  }

  return (
    <section className="mx-auto max-w-[1080px] border-t border-black/20 px-[clamp(20px,6vw,96px)] py-16 md:py-24">
      <p className="mb-5 text-sm font-bold text-black/50">09</p>
      <h2 className="ko-keep mb-12 max-w-2xl text-[clamp(32px,4vw,56px)] font-medium leading-tight tracking-[-0.055em]">
        미래의 내가 보내는 한 문장
      </h2>
      <blockquote className="ko-keep mx-auto max-w-4xl border-y border-black px-2 py-12 text-center text-[clamp(30px,5vw,64px)] font-medium leading-tight tracking-[-0.065em]">
        {renderParagraphs(message, "space-y-6")}
      </blockquote>
    </section>
  );
}

function ComingSoonAiSummary() {
  return (
    <section className="mx-auto max-w-[1080px] border-t border-black/20 px-[clamp(20px,6vw,96px)] py-12">
      <div className="grid gap-4 rounded-lg bg-[#ECEFF0] p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="mb-2 text-sm font-bold text-black/50">준비 중</p>
          <h2 className="ko-keep text-2xl font-medium tracking-[-0.04em]">AI 에디터의 한 페이지 요약</h2>
        </div>
        <p className="ko-keep text-sm font-medium text-black/55">현재 결과 매거진 표시는 AI 호출 없이 작동합니다.</p>
      </div>
    </section>
  );
}

function EmptyReportState() {
  return (
    <main className="page-shell min-h-screen bg-background">
      <Header />
      <section className="grid min-h-[70vh] place-items-center px-6 text-center">
        <div className="mx-auto max-w-xl">
          <h1 className="ko-keep mb-5 text-[clamp(34px,4vw,56px)] font-medium tracking-[-0.05em]">
            아직 기록된 인터뷰가 없습니다.
          </h1>
          <Button asChild>
            <Link href="/start">인터뷰 시작하기</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

export function ReportSection() {
  const [session] = useState(() => readInterviewSession());
  const magazine = useMemo(() => buildMagazine(session), [session]);
  const hasAnyContent =
    magazine.sections.length > 0 || magazine.hardTimeSections.length > 0 || hasAnswer(magazine.messageToPresent);

  if (!hasAnyContent) {
    return <EmptyReportState />;
  }

  return (
    <main className="page-shell min-h-screen bg-background">
      <Header />
      <MagazineCover magazine={magazine} />

      {magazine.sections.slice(0, 5).map((section) => (
        <MagazineSectionView key={section.number} section={section} />
      ))}

      <HardTimeSection sections={magazine.hardTimeSections} />

      {magazine.sections.slice(5).map((section) => (
        <MagazineSectionView key={section.number} section={section} />
      ))}

      <MessageSection message={magazine.messageToPresent} />
      <ComingSoonAiSummary />

      <div className="sticky bottom-0 z-20 border-t border-black/15 bg-background/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-3">
          <Button type="button" size="sm" className="min-w-36" onClick={() => downloadMemoryPdf(magazine)}>
            PDF 다운로드
          </Button>
          <Button asChild size="sm" className="min-w-36">
            <Link href="/start" onClick={() => resetInterviewState()}>
              인터뷰 다시하기
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
