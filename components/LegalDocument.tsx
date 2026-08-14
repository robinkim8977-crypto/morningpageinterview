import type { ReactNode } from "react";
import { Header } from "@/components/Header";

export type LegalSection = {
  title: string;
  content: ReactNode;
};

export function LegalDocument({
  eyebrow,
  title,
  effectiveDate,
  description,
  sections
}: {
  eyebrow: string;
  title: string;
  effectiveDate: string;
  description: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <main className="page-shell min-h-screen bg-[#F8F7F4]">
      <Header />
      <article className="mx-auto max-w-4xl px-[clamp(20px,6vw,72px)] pb-24 pt-10 md:pt-16">
        <header className="border-b border-black/25 pb-12">
          <p className="text-xs font-bold tracking-[0.16em] text-black/42">{eyebrow}</p>
          <h1 className="ko-keep mt-4 text-[clamp(38px,5vw,64px)] font-medium tracking-[-0.065em]">{title}</h1>
          <div className="ko-keep mt-7 text-sm leading-7 text-black/60 md:text-base">{description}</div>
          <p className="ko-keep mt-7 text-sm font-semibold text-black/58">시행일 {effectiveDate}</p>
        </header>
        <div className="legal-document">
          {sections.map((section, index) => (
            <section key={section.title} className="border-b border-black/15 py-10 md:py-12">
              <p className="text-xs font-bold tracking-[0.14em] text-black/38">{String(index + 1).padStart(2, "0")}</p>
              <h2 className="ko-keep mt-3 text-2xl font-semibold tracking-[-0.04em] md:text-3xl">{section.title}</h2>
              <div className="ko-keep mt-6 space-y-4 text-[15px] leading-7 text-black/68 md:text-base md:leading-8">{section.content}</div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5 marker:text-black/40">{children}</ul>;
}
