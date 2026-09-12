import { useEffect, useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { CodeOtp } from "@/components/auth/code-otp";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { guardAuthConfigured } from "@/lib/auth-actions";
import { clearMfaFactorId, getMfaFactorId } from "@/lib/auth-redirect";
import { pathAfterAuth } from "@/lib/post-auth";
import { getBrowserAuth } from "@/lib/supabase";
import { useSessionStore } from "@/stores/session-store";

export function TwoFactorForm() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [factorId] = useState(() => getMfaFactorId());

  useEffect(() => {
    if (factorId === null) {
      void navigate("/login", { replace: true });
    }
  }, [factorId, navigate]);

  async function submit() {
    if (!guardAuthConfigured()) {
      return;
    }
    if (factorId === null) {
      toast.error("Start from the sign-in page");
      void navigate("/login");
      return;
    }
    if (code.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }

    setPending(true);
    try {
      const result = await getBrowserAuth().verifyTotp(factorId, code);
      if (result.user === null) {
        toast.error("Verification did not return a user");
        return;
      }
      clearMfaFactorId();
      useSessionStore.getState().setSession(result.user);
      toast.success("Signed in");
      void navigate(await pathAfterAuth());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid code";
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
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="otp">Authenticator code</FieldLabel>
          <CodeOtp
            id="otp"
            value={code}
            onChange={setCode}
            disabled={pending}
            centered
          />
          <FieldDescription>
            Open your authenticator app and enter the current code.
          </FieldDescription>
        </Field>
      </FieldGroup>
      <Button
        type="submit"
        className="w-full"
        disabled={pending || code.length !== 6}
      >
        {pending ? <Spinner data-icon="inline-start" /> : null}
        {pending ? "Verifying" : "Verify"}
      </Button>
    </form>
  );
}
