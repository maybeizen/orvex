import { Link } from "react-router";
import { cn } from "@/lib/cn";

export function OrvexMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex size-5 shrink-0 items-center justify-center rounded-[5px] bg-primary text-primary-foreground",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none">
        <path
          d="M2.5 8.5h2.1l1.3-3.2 1.9 6.4 1.4-3.2H13.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </svg>
    </span>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="flex min-w-0 items-center gap-2 text-foreground transition-opacity duration-200 ease-out hover:opacity-80"
    >
      <OrvexMark />
      <span
        className={cn(
          "truncate text-sm font-medium tracking-tight",
          compact && "sr-only",
        )}
      >
        Orvex Monitor
      </span>
    </Link>
  );
}
