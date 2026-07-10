import { cn } from "@/lib/utils";

type ProgressBarProps = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${current}/${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-5 w-5 rounded-full border border-black md:h-6 md:w-6",
            index < current ? "bg-black" : "bg-transparent"
          )}
        />
      ))}
    </div>
  );
}
