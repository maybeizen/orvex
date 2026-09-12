import { SettingsBlock } from "@/components/account/settings-block";
import { SettingsFrame } from "@/components/account/settings-frame";
import { RequireSession } from "@/components/auth/require-session";
import { Enter } from "@/components/motion/enter";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

export function SettingsPage() {
  return (
    <RequireSession
      title="Settings"
      description="Sign in to change appearance."
    >
      <SettingsFrame>
        <div className="flex flex-col gap-6">
          <Enter>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-medium tracking-tight">Appearance</h1>
              <p className="text-sm text-muted-foreground">
                Theme for this browser. It does not change other seats.
              </p>
            </div>
          </Enter>
          <Enter delay={0.04}>
            <SettingsBlock
              title="Theme"
              description="Dark, light, or follow the system setting."
            >
              <ThemeSwitcher />
            </SettingsBlock>
          </Enter>
        </div>
      </SettingsFrame>
    </RequireSession>
  );
}
