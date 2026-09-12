import { Link } from "react-router";
import { BrandMark } from "@/components/marketing/brand-mark";
import { Separator } from "@/components/ui/separator";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
      { label: "Network", href: "/#network" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Get started", href: "/register" },
      { label: "Docs", href: "#" },
      { label: "Support", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "DPA", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
] as const;

function FooterLink({ href, label }: { href: string; label: string }) {
  const className =
    "text-sm text-muted-foreground transition-colors duration-200 ease-out hover:text-foreground";

  if (href.startsWith("/")) {
    return (
      <Link to={href} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <a href={href} className={className}>
      {label}
    </a>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-5 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="flex flex-col gap-3 md:col-span-1">
            <BrandMark />
            <p className="text-sm text-muted-foreground text-pretty">
              Control-room monitoring for HTTP, SSL, heartbeats, and the Go
              agent.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <p className="font-mono text-[11px] tracking-[0.14em] text-foreground uppercase">
                {column.title}
              </p>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink href={link.href} label={link.label} />
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
          <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
            Signal room
          </p>
        </div>
      </div>
    </footer>
  );
}
