import { useEffect, useState } from "react";
import type { Passkey } from "@orvex/auth";
import { SettingsBlock } from "@/components/account/settings-block";
import { toast } from "sonner";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { guardAuthConfigured } from "@/lib/auth-actions";
import { formatAuthTimestamp } from "@/lib/format-date";
import { getBrowserAuth, isAuthConfigured } from "@/lib/supabase";

export function PasskeySettings({ framed = true }: { framed?: boolean }) {
  const configured = isAuthConfigured();
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(configured);
  const [pending, setPending] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<Passkey | null>(null);

  useEffect(() => {
    if (!configured) {
      return;
    }
    let cancelled = false;
    void getBrowserAuth()
      .listPasskeys()
      .then((next) => {
        if (!cancelled) {
          setPasskeys(next);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Unable to load passkeys";
          toast.error(message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [configured]);

  async function addPasskey() {
    if (!guardAuthConfigured()) {
      return;
    }
    setPending(true);
    try {
      const created = await getBrowserAuth().registerPasskey();
      setPasskeys((current) => [created, ...current]);
      toast.success("Passkey added");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to add passkey";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  function startRename(passkey: Passkey) {
    setRenamingId(passkey.id);
    setRenameValue(passkey.friendlyName ?? "");
  }

  async function saveRename(passkeyId: string) {
    const name = renameValue.trim();
    if (name.length === 0) {
      toast.error("Enter a name");
      return;
    }
    if (!guardAuthConfigured()) {
      return;
    }
    setPending(true);
    try {
      const updated = await getBrowserAuth().updatePasskey(passkeyId, name);
      setPasskeys((current) =>
        current.map((passkey) =>
          passkey.id === passkeyId ? updated : passkey,
        ),
      );
      setRenamingId(null);
      toast.success("Passkey renamed");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to rename passkey";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  async function revokePasskey() {
    if (revokeTarget === null || !guardAuthConfigured()) {
      return;
    }
    setPending(true);
    try {
      await getBrowserAuth().deletePasskey(revokeTarget.id);
      setPasskeys((current) =>
        current.filter((passkey) => passkey.id !== revokeTarget.id),
      );
      setRevokeTarget(null);
      toast.success("Passkey revoked");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to revoke passkey";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <SettingsBlock
      framed={framed}
      title="Passkeys"
      description="Hardware keys and device credentials for passwordless sign-in."
      action={
        <Button
          type="button"
          disabled={pending || loading}
          onClick={() => {
            void addPasskey();
          }}
        >
          {pending ? <Spinner data-icon="inline-start" /> : null}
          Add passkey
        </Button>
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading passkeys…</p>
      ) : passkeys.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No passkeys yet. Add one to sign in without a password.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
            {passkeys.map((passkey) => {
              const renaming = renamingId === passkey.id;
              const label = passkey.friendlyName ?? "Unnamed passkey";
              return (
                <li
                  key={passkey.id}
                  className="flex flex-col gap-3 rounded-lg border border-border px-3 py-3"
                >
                  {renaming ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <Field className="flex-1">
                        <FieldLabel htmlFor={`passkey-name-${passkey.id}`}>
                          Name
                        </FieldLabel>
                        <Input
                          id={`passkey-name-${passkey.id}`}
                          value={renameValue}
                          autoComplete="off"
                          onChange={(event) => {
                            setRenameValue(event.target.value);
                          }}
                        />
                      </Field>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={pending}
                          onClick={() => {
                            void saveRename(passkey.id);
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => {
                            setRenamingId(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 flex-col gap-1">
                        <p className="truncate font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">
                          Added {formatAuthTimestamp(passkey.createdAt)} · Last
                          used {formatAuthTimestamp(passkey.lastUsedAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => {
                            startRename(passkey);
                          }}
                        >
                          Rename
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={pending}
                          onClick={() => {
                            setRevokeTarget(passkey);
                          }}
                        >
                          Revoke
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      <AlertDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRevokeTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this passkey?</AlertDialogTitle>
            <AlertDialogDescription>
              {revokeTarget === null
                ? "You will not be able to sign in with it anymore."
                : `${revokeTarget.friendlyName ?? "This passkey"} will no longer sign you in.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                void revokePasskey();
              }}
            >
              {pending ? <Spinner data-icon="inline-start" /> : null}
              Revoke passkey
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsBlock>
  );
}
