import type { ReactNode } from "react";
import { BrandMark } from "@/components/marketing/brand-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/cn";

export function PublicChrome({
  children,
  align = "center",
  width = "auth",
}: {
  children: ReactNode;
  align?: "center" | "start";
  width?: "auth" | "wide" | "document";
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between px-5 py-4 sm:px-6">
        <BrandMark />
        <ThemeToggle />
      </header>
      <main
        className={cn(
          "flex flex-1 px-5 sm:px-6",
          align === "center"
            ? "items-center justify-center py-12 sm:py-16"
            : "items-start justify-center py-8 sm:py-12",
        )}
      >
        <div
          className={cn(
            "flex w-full flex-col",
            width === "auth" && "max-w-[22rem]",
            width === "wide" && "max-w-3xl",
            width === "document" && "max-w-2xl",
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
