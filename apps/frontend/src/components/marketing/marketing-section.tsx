import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function MarketingSection({
  id,
  children,
  className,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 md:py-24",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  copy,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "flex max-w-2xl flex-col gap-3",
        align === "center" && "mx-auto text-center",
      )}
    >
      {eyebrow ? (
        <p className="font-mono text-[0.68rem] tracking-[0.22em] text-primary uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-[2rem] leading-[1.15] text-balance md:text-[2.5rem]">
        {title}
      </h2>
      {copy ? (
        <p className="text-[0.95rem] leading-relaxed text-muted-foreground text-pretty">
          {copy}
        </p>
      ) : null}
    </div>
  );
}
