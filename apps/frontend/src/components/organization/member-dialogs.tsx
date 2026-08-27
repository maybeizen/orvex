import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function ConfirmMemberDialog({
  open,
  title,
  description,
  confirmLabel,
  pending,
  destructive = false,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pending: boolean;
  destructive?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {pending ? "Working" : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function PromoteOwnerDialog({
  open,
  memberName,
  pending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  memberName: string;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: { totpCode?: string; password?: string }) => void;
}) {
  const [totpCode, setTotpCode] = useState("");
  const [password, setPassword] = useState("");

  function submit() {
    const code = totpCode.trim();
    if (code.length > 0) {
      onConfirm({ totpCode: code });
      return;
    }
    if (password.length > 0) {
      onConfirm({ password });
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setTotpCode("");
          setPassword("");
        }
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Promote {memberName} to owner</AlertDialogTitle>
          <AlertDialogDescription>
            Owners keep full access. Confirm with your authenticator code if
            two-factor is enabled, otherwise enter your password.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FieldGroup className="gap-3">
          <Field>
            <FieldLabel htmlFor="promote-totp">Authenticator code</FieldLabel>
            <Input
              id="promote-totp"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={totpCode}
              onChange={(event) => {
                setTotpCode(event.target.value);
              }}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="promote-password">Password</FieldLabel>
            <Input
              id="promote-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
            />
            <FieldDescription>
              Used when this account does not have a verified authenticator.
            </FieldDescription>
          </Field>
        </FieldGroup>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            disabled={
              pending || (totpCode.trim().length === 0 && password.length === 0)
            }
            onClick={submit}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {pending ? "Promoting" : "Promote"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
