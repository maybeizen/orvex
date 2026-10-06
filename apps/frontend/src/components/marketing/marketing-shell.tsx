import type { ReactNode } from "react";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";
import { SkipLink } from "@/components/skip-link";
import "@/styles/marketing.css";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="marketing-root min-h-svh overflow-x-hidden bg-background text-foreground">
      <SkipLink />
      <MarketingNavbar />
      {children}
      <MarketingFooter />
    </div>
  );
}
