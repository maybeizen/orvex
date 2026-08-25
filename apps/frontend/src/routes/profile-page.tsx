import { RequireSession } from "@/components/auth/require-session";
import { Enter } from "@/components/motion/enter";
import { IdentityForm } from "@/components/profile/identity-form";
import { ProfileHero } from "@/components/profile/profile-hero";
import { EmailSettings } from "@/components/settings/email-settings";
import { PasskeySettings } from "@/components/settings/passkey-settings";
import { PasswordSettings } from "@/components/settings/password-settings";
import { TotpSettings } from "@/components/settings/totp-settings";
import { Separator } from "@/components/ui/separator";
import { isPasskeysEnabled } from "@/lib/passkeys";

export function ProfilePage() {
  return (
    <RequireSession
      title="Profile"
      description="Sign in to manage your account."
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <Enter>
          <ProfileHero />
        </Enter>
        <Enter delay={0.05}>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
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
      </div>
    </RequireSession>
  );
}
