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
      className={cn("mx-auto w-full max-w-6xl px-6 py-24 md:py-28", className)}
    >
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 text-center">
      {eyebrow ? (
        <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-heading text-3xl tracking-tight text-balance md:text-4xl">
        {title}
      </h2>
      {copy ? (
        <p className="text-muted-foreground text-pretty">{copy}</p>
      ) : null}
    </div>
  );
}
