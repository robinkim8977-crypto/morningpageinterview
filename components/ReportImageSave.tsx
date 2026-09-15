"use client";

import { useEffect, useRef, useState } from "react";
import { createImageArchive } from "@/lib/image-archive";
import { Button } from "@/components/ui/button";
import { createReportImages, type ReportImageSection } from "@/lib/report-images";

export function ReportImageSave({ title, sections }: { title: string; sections: ReportImageSection[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pages, setPages] = useState<{ file: File; url: string }[]>([]);
  const [archiveUrl, setArchiveUrl] = useState("");
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => () => pages.forEach((page) => URL.revokeObjectURL(page.url)), [pages]);

  useEffect(() => () => { if (archiveUrl) URL.revokeObjectURL(archiveUrl); }, [archiveUrl]);

  async function prepare() {
    setBusy(true);
    setMessage("");
    dialogRef.current?.showModal();
    try {
      const files = await createReportImages(title, sections);
      const archive = await createImageArchive(files);
      setArchiveUrl(URL.createObjectURL(archive));
      setPages(files.map((file) => ({ file, url: URL.createObjectURL(file) })));
    } catch {
      setMessage("이미지를 만들지 못했습니다. 창을 닫고 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadAll() {
    if (sharing || busy || !pages.length) return;
    const files = pages.map((page) => page.file);
    setMessage("");
    setSharing(true);
    try {
      if (navigator.canShare?.({ files })) {
        await navigator.share({ files });
      } else {
        const link = document.createElement("a");
        link.href = archiveUrl;
        link.download = "morningpage-images.zip";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setMessage("전체 이미지를 ZIP 파일로 다운로드합니다. 압축을 풀면 각 이미지를 확인할 수 있습니다.");
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        setMessage("전체 공유를 열지 못했습니다. 아래 ‘전체 ZIP 다운로드’를 이용하거나 각 장을 따로 저장해 주세요.");
      }
    } finally {
      setSharing(false);
    }
  }

  async function share(file: File) {
    try {
      if (!navigator.canShare?.({ files: [file] })) {
        setMessage("아래 이미지를 길게 눌러 저장해 주세요. 저장 메뉴가 없다면 화면을 캡처해 주세요.");
        return;
      }
      await navigator.share({ files: [file] });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage("공유를 열지 못했습니다. 아래 이미지를 길게 눌러 저장해 주세요.");
    }
  }

  return <>
    <Button type="button" size="sm" disabled={busy} onClick={prepare}>이미지로 저장하기</Button>
    <dialog ref={dialogRef} className="fixed inset-0 m-auto max-h-[90dvh] w-[min(94vw,700px)] overflow-y-auto rounded-2xl bg-[#f8f7f4] p-5 text-black backdrop:bg-black/60" aria-label="리포트 이미지 저장" onClose={() => { if (!busy) { setPages([]); setArchiveUrl(""); } }}>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-[#f8f7f4] py-3">
        <h2 className="text-xl font-semibold">이미지로 저장하기</h2>
        <Button type="button" size="sm" variant="outline" onClick={() => dialogRef.current?.close()}>닫기</Button>
      </div>
      <p className="mb-4 text-sm leading-6">리포트 전문을 읽기 편한 텍스트 이미지로 나누었습니다. 각 이미지를 길게 눌러 사진에 저장하거나, 공유 메뉴를 이용해 주세요.</p>
      {!busy && pages.length > 0 ? <div className="mb-6 grid gap-3">
        <Button type="button" disabled={sharing} onClick={downloadAll} className="w-full">{sharing ? "공유 중…" : `전체 다운로드 (${pages.length}장)`}</Button>
        <p className="text-xs leading-5 text-black/60">아이폰에서는 공유 메뉴의 ‘이미지 저장’을 선택해 한 번에 저장하세요. 전체 공유를 지원하지 않는 브라우저에서는 ZIP 파일로 받습니다.</p>
        <a href={archiveUrl} download="morningpage-images.zip" className="text-sm underline">전체 ZIP 다운로드</a>
      </div> : null}
      {busy ? <p role="status">이미지를 만들고 있습니다…</p> : null}
      {message ? <p role="status" className="my-4 text-sm">{message}</p> : null}
      {!busy && pages.map((page, index) => <section key={page.url} className="mb-8">
        <p className="mb-2 text-sm">{index + 1} / {pages.length}장</p>
        <img src={page.url} alt={`${title} ${index + 1}페이지`} className="w-full border border-black/15" />
        <div className="mt-3 flex flex-wrap gap-3">
          <Button type="button" size="sm" onClick={() => share(page.file)}>이 이미지 공유·저장</Button>
          <a href={page.url} download={page.file.name} className="px-3 py-2 text-sm underline">파일 다운로드</a>
        </div>
      </section>)}
    </dialog>
  </>;
}
