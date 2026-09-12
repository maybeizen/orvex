import { useState } from "react";
import { Link, useLocation } from "react-router";
import { AccountMenu } from "@/components/auth/account-menu";
import { AuthNavCluster } from "@/components/auth/auth-nav-cluster";
import { BrandMark } from "@/components/marketing/brand-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { MARKETING_NAV_LINKS, marketingNavHref } from "@/lib/marketing/nav";
import { useSessionStore } from "@/stores/session-store";
import { Menu, X } from "lucide-react";

function NavItem({
  href,
  className,
  onClick,
  children,
}: {
  href: string;
  className: string;
  onClick?: () => void;
  children: string;
}) {
  if (href.startsWith("#")) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <Link to={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

export function MarketingNavbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const user = useSessionStore((state) => state.user);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <BrandMark />
        <nav
          aria-label="Primary"
          className="hidden flex-1 items-center justify-center gap-7 md:flex"
        >
          {MARKETING_NAV_LINKS.map((link) => (
            <NavItem
              key={link.label}
              href={marketingNavHref(pathname, link)}
              className="font-mono text-[0.7rem] tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-foreground"
            >
              {link.label}
            </NavItem>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          {user === null ? <ThemeToggle /> : null}
          <AuthNavCluster />
        </div>
        <div className="ml-auto flex items-center gap-1 md:hidden">
          {user === null ? <ThemeToggle /> : null}
          {user === null ? null : <AccountMenu user={user} />}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => {
              setOpen((current) => !current);
            }}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "border-t border-border bg-background md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav
          aria-label="Mobile"
          className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6"
        >
          {MARKETING_NAV_LINKS.map((link) => (
            <NavItem
              key={`${link.label}-mobile`}
              href={marketingNavHref(pathname, link)}
              className="font-mono py-2.5 text-sm tracking-[0.12em] text-foreground uppercase"
              onClick={() => {
                setOpen(false);
              }}
            >
              {link.label}
            </NavItem>
          ))}
        </nav>
        {user === null ? (
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 pb-4 sm:px-6">
            <Button variant="outline" asChild>
              <Link
                to="/login"
                onClick={() => {
                  setOpen(false);
                }}
              >
                Sign in
              </Link>
            </Button>
            <Button asChild>
              <Link
                to="/register"
                onClick={() => {
                  setOpen(false);
                }}
              >
                Get started
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
