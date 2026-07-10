import Link from "next/link";

export function Header({ className = "" }: { className?: string }) {
  return (
    <header className={`flex items-center justify-between px-[clamp(20px,3vw,30px)] py-7 ${className}`}>
      <Link href="/" className="wordmark">
        THE MORNING PAGE INTERVIEW
      </Link>
    </header>
  );
}
