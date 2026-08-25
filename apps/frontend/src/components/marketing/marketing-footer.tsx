import { Code2, Rss, Users } from "lucide-react";
import { Link } from "react-router";
import { BrandMark } from "@/components/marketing/brand-mark";
import { Separator } from "@/components/ui/separator";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: ["Features", "Pricing", "Status", "Changelog", "Integrations"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Contact"],
  },
  {
    title: "Resources",
    links: ["Docs", "API", "Status page", "Support", "System status"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "DPA", "Security"],
  },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-20">
        <div className="grid gap-12 md:grid-cols-5">
          <div className="flex flex-col gap-3 md:col-span-1">
            <BrandMark />
            <p className="text-sm text-muted-foreground text-pretty">
              Control-room monitoring for HTTP, SSL, heartbeats, and the Go
              agent.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <p className="font-mono text-xs tracking-wide text-foreground uppercase">
                {column.title}
              </p>
              <ul className="flex flex-col gap-2">
                {column.links.map((label) => (
                  <li key={label}>
                    {label === "Terms" ? (
                      <Link
                        to="/terms"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {label}
                      </Link>
                    ) : (
                      <a
                        href="#"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Separator />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-xs text-muted-foreground">
            © 2026 Orvex
          </p>
          <div className="flex items-center gap-3">
            <a
              href="#"
              aria-label="GitHub"
              className="text-muted-foreground hover:text-foreground"
            >
              <Code2 className="size-4" />
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              className="text-muted-foreground hover:text-foreground"
            >
              <Users className="size-4" />
            </a>
            <a
              href="#"
              aria-label="Feed"
              className="text-muted-foreground hover:text-foreground"
            >
              <Rss className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
