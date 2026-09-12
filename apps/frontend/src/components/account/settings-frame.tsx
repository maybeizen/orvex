import type { ReactNode } from "react";
import { SettingsNav } from "@/components/account/settings-nav";

export function SettingsFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:flex-row lg:gap-10">
      <SettingsNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
