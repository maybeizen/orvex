import { useId, useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
import { SettingsBlock } from "@/components/account/settings-block";
import { CodeOtp } from "@/components/auth/code-otp";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { guardAuthConfigured, refreshBrowserSession } from "@/lib/auth-actions";
import { getBrowserAuth } from "@/lib/supabase";

export function PasswordSettings({ framed = true }: { framed?: boolean }) {
  const formId = useId();
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!guardAuthConfigured()) {
      return;
    }
    if (nextPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (nextPassword.length < 8) {
      toast.error("Use at least 8 characters");
      return;
    }
    if (nextPassword === currentPassword) {
      toast.error("Choose a different password");
      return;
    }

    setPending(true);
    try {
      const auth = getBrowserAuth();
      if (mfaFactorId === null) {
        const result = await auth.reauthWithPassword(currentPassword);
        if (result.mfaRequired) {
          if (result.factorId === null) {
            toast.error(
              "Two-factor authentication is required, but no TOTP factor is enrolled",
            );
            return;
          }
          setMfaFactorId(result.factorId);
          toast.message("Enter your authenticator code to continue");
          return;
        }
      } else {
        if (mfaCode.length !== 6) {
          toast.error("Enter the 6-digit code");
          return;
        }
        await auth.verifyTotp(mfaFactorId, mfaCode);
      }
      await auth.updatePassword(nextPassword);
      await refreshBrowserSession();
      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");
      setMfaFactorId(null);
      setMfaCode("");
      toast.success("Password updated");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update password";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  return (
    <SettingsBlock
      framed={framed}
      title="Password"
      description="Confirm the current password, then choose a new one."
      footer={
        <Button type="submit" form={formId} disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {pending ? "Saving" : "Update password"}
        </Button>
      }
    >
      <form id={formId} className="flex flex-col gap-5" onSubmit={onSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="current-password">Current password</FieldLabel>
            <PasswordInput
              id="current-password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value);
              }}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="new-password">New password</FieldLabel>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              required
              minLength={8}
              value={nextPassword}
              onChange={(event) => {
                setNextPassword(event.target.value);
              }}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
              }}
            />
          </Field>
          {mfaFactorId === null ? null : (
            <Field>
              <FieldLabel htmlFor="password-otp">Authenticator code</FieldLabel>
              <CodeOtp
                id="password-otp"
                value={mfaCode}
                onChange={setMfaCode}
                disabled={pending}
              />
            </Field>
          )}
        </FieldGroup>
      </form>
    </SettingsBlock>
  );
}
