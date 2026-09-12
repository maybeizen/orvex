import type { ReactNode } from "react";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export function MarketingDocument({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <MarketingShell>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-14 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
          <h1 className="font-display text-[2.25rem] leading-[1.12] tracking-tight">
            {title}
          </h1>
          {lede ? (
            <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
              {lede}
            </p>
          ) : null}
        </div>
        {children}
      </main>
    </MarketingShell>
  );
}
