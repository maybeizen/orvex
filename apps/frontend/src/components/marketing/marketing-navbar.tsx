import { Link } from "react-router";
import { AccountMenu } from "@/components/auth/account-menu";
import { AuthNavCluster } from "@/components/auth/auth-nav-cluster";
import { BrandMark } from "@/components/marketing/brand-mark";
import { ThemeMenuButton } from "@/components/theme/theme-menu-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSessionStore } from "@/stores/session-store";
import { Menu } from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#network", label: "Network" },
  { href: "#pricing", label: "Pricing" },
  { href: "#", label: "Docs" },
  { href: "#", label: "Status" },
] as const;

export function MarketingNavbar() {
  const [open, setOpen] = useState(false);
  const user = useSessionStore((state) => state.user);

  return (
    <header className="sticky top-0 border-b border-border/80 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-6">
        <BrandMark />
        <nav
          aria-label="Primary"
          className="hidden flex-1 items-center justify-center gap-6 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={`${link.href}-${link.label}`}
              href={link.href}
              className="font-mono text-xs tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-3 md:flex">
          {user === null ? <ThemeMenuButton /> : null}
          <AuthNavCluster />
        </div>
        <div className="ml-auto flex items-center gap-2 md:hidden">
          {user === null ? <ThemeMenuButton /> : null}
          {user === null ? null : <AccountMenu user={user} />}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Orvex Monitor</SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-3 px-4">
                {NAV_LINKS.map((link) => (
                  <a
                    key={`${link.href}-${link.label}-mobile`}
                    href={link.href}
                    className="font-mono text-sm tracking-wide text-foreground uppercase"
                    onClick={() => {
                      setOpen(false);
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              {user === null ? (
                <div className="mt-auto flex flex-col gap-2 p-4">
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
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
