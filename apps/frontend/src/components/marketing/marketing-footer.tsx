import { Link, useLocation } from "react-router";
import { BrandMark } from "@/components/marketing/brand-mark";

const PRODUCT_LINKS = [
  { label: "Features", to: "/#features", hash: "#features" },
  { label: "Pricing", to: "/pricing", hash: "#pricing" },
  { label: "Network", to: "/#network", hash: "#network" },
  { label: "Changelog", to: "/changelog" },
] as const;

const COMPANY_LINKS = [{ label: "About", to: "/about" }] as const;

const ACCOUNT_LINKS = [
  { label: "Sign in", to: "/login" },
  { label: "Get started", to: "/register" },
] as const;

const LEGAL_LINKS = [
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
] as const;

function FooterLink({
  label,
  to,
  hash,
  pathname,
}: {
  label: string;
  to: string;
  hash?: string;
  pathname: string;
}) {
  const href = hash !== undefined && pathname === "/" ? hash : to;
  const className =
    "text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground";

  if (href.startsWith("/") && !href.startsWith("/#")) {
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
  const { pathname } = useLocation();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 flex flex-col gap-3 sm:col-span-3 lg:col-span-1">
            <BrandMark />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground text-pretty">
              Control-room monitoring for HTTP, TLS, heartbeats, and the Go
              agent.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[0.68rem] tracking-[0.16em] text-foreground uppercase">
              Product
            </p>
            <ul className="flex flex-col gap-2">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink pathname={pathname} {...link} />
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[0.68rem] tracking-[0.16em] text-foreground uppercase">
              Company
            </p>
            <ul className="flex flex-col gap-2">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink pathname={pathname} {...link} />
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[0.68rem] tracking-[0.16em] text-foreground uppercase">
              Account
            </p>
            <ul className="flex flex-col gap-2">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink pathname={pathname} {...link} />
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[0.68rem] tracking-[0.16em] text-foreground uppercase">
              Legal
            </p>
            <ul className="flex flex-col gap-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink pathname={pathname} {...link} />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <p className="font-mono text-[0.7rem] text-muted-foreground">
            © 2026 Orvex
          </p>
          <p className="font-mono text-[0.7rem] tracking-wide text-muted-foreground uppercase">
            IAD · FRA · LHR · SIN · SJC · SYD
          </p>
        </div>
      </div>
    </footer>
  );
}
