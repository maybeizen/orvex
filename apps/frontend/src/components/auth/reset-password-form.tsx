import { useEffect, useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { guardAuthConfigured } from "@/lib/auth-actions";
import { getBrowserAuth, isAuthConfigured } from "@/lib/supabase";

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isAuthConfigured()) {
      return;
    }
    void getBrowserAuth()
      .getBrowserSession()
      .then((session) => {
        if (session === null) {
          toast.error("Open the reset link from your email");
          void navigate("/forgot-password", { replace: true });
        }
      })
      .catch(() => {
        void navigate("/forgot-password", { replace: true });
      });
  }, [navigate]);

  async function submit() {
    if (!guardAuthConfigured()) {
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Use at least 8 characters");
      return;
    }

    setPending(true);
    try {
      await getBrowserAuth().updatePassword(password);
      toast.success("Password updated");
      void navigate("/organizations");
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
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
          <PasswordInput
            id="confirm"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(event) => {
              setConfirm(event.target.value);
            }}
          />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        {pending ? "Saving" : "Update password"}
      </Button>
    </form>
  );
}
