import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer border-t border-black/20 bg-[#E7E2DA] px-[clamp(20px,3vw,30px)] py-10">
      <div className="mx-auto grid max-w-[1380px] gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <Link href="/" className="wordmark">
            THE MORNING PAGE INTERVIEW
          </Link>
          <div className="ko-keep mt-5 flex max-w-3xl flex-wrap gap-x-5 gap-y-2 text-xs leading-5 text-black/58">
            <span>상호 로웬스테이션</span>
            <span>대표자 김소윤</span>
            <span>사업자등록번호 254-08-03629</span>
            <span>통신판매업 신고번호 2026-강원춘천-0587</span>
            <span>사업장 주소 강원도 춘천시 서부대성로 327</span>
            <a href="tel:07080274816">고객문의 070-8027-4816</a>
            <a href="mailto:morningpageinterview@gmail.com">morningpageinterview@gmail.com</a>
          </div>
        </div>
        <nav aria-label="정책 및 서비스 안내" className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold">
          <Link href="/future-coordinate">미래좌표</Link>
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/refund-policy">결제·취소·환불 정책</Link>
        </nav>
      </div>
    </footer>
  );
}
