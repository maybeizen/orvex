import { SettingsBlock } from "@/components/account/settings-block";
import { RequireSession } from "@/components/auth/require-session";
import { Enter } from "@/components/motion/enter";
import { IdentityForm } from "@/components/profile/identity-form";
import { ProfileHero } from "@/components/profile/profile-hero";
import { EmailSettings } from "@/components/settings/email-settings";
import { PasskeySettings } from "@/components/settings/passkey-settings";
import { PasswordSettings } from "@/components/settings/password-settings";
import { TotpSettings } from "@/components/settings/totp-settings";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Separator } from "@/components/ui/separator";
import { isPasskeysEnabled } from "@/lib/passkeys";

export function SettingsPage() {
  return (
    <RequireSession
      title="Settings"
      description="Sign in to manage your account."
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <Enter>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-medium tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Profile, security, and appearance for this account.
            </p>
          </div>
        </Enter>
        <Enter delay={0.04}>
          <div id="profile" className="scroll-mt-6">
            <ProfileHero />
          </div>
        </Enter>
        <Enter delay={0.06}>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <IdentityForm />
            <Separator />
            <EmailSettings framed={false} />
            <Separator />
            <PasswordSettings framed={false} />
            <Separator />
            <TotpSettings framed={false} />
            {isPasskeysEnabled() ? (
              <>
                <Separator />
                <PasskeySettings framed={false} />
              </>
            ) : null}
          </div>
        </Enter>
        <Enter delay={0.08}>
          <div id="appearance" className="scroll-mt-6">
            <SettingsBlock
              title="Appearance"
              description="Theme for this browser. It does not change other seats."
            >
              <ThemeSwitcher />
            </SettingsBlock>
          </div>
        </Enter>
      </div>
    </RequireSession>
  );
}
