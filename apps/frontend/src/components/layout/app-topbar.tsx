import { useState } from "react";
import { Menu } from "lucide-react";
import { SidebarNav } from "@/components/layout/sidebar";
import { AppBreadcrumb } from "@/components/organization/app-breadcrumb";
import { AuthNavCluster } from "@/components/auth/auth-nav-cluster";
import { BrandMark } from "@/components/marketing/brand-mark";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function AppTopbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-3 md:px-4">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        aria-label="Open navigation"
        onClick={() => {
          setOpen(true);
        }}
      >
        <Menu />
      </Button>
      <AppBreadcrumb />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0" showCloseButton>
          <SheetHeader className="h-14 justify-center border-b border-border">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <BrandMark />
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col">
            <SidebarNav
              onNavigate={() => {
                setOpen(false);
              }}
            />
            <div className="mt-auto border-t border-border p-3">
              <AuthNavCluster guest="signin" />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
