import { useEffect, useRef, useState } from "react";
import type { TotpEnrollment, TotpFactor } from "@orvex/auth";
import { ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { SettingsBlock } from "@/components/account/settings-block";
import { CodeOtp } from "@/components/auth/code-otp";
import { TotpSecret } from "@/components/settings/totp-secret";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { guardAuthConfigured, refreshBrowserSession } from "@/lib/auth-actions";
import { getBrowserAuth, isAuthConfigured } from "@/lib/supabase";

function verifiedFactors(factors: TotpFactor[]): TotpFactor[] {
  return factors.filter((factor) => factor.status === "verified");
}

export function TotpSettings({ framed = true }: { framed?: boolean }) {
  const configured = isAuthConfigured();
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [loading, setLoading] = useState(configured);
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollCode, setEnrollCode] = useState("");
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [pending, setPending] = useState(false);
  const enrollmentRef = useRef<TotpEnrollment | null>(null);
  const skipDiscardRef = useRef(false);
  enrollmentRef.current = enrollment;

  const enabled = verifiedFactors(factors).length > 0;

  async function loadFactors() {
    try {
      setFactors(await getBrowserAuth().listFactors());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load 2FA status";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!configured) {
      return;
    }
    let cancelled = false;
    void getBrowserAuth()
      .listFactors()
      .then((next) => {
        if (!cancelled) {
          setFactors(next);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to load 2FA status";
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

  async function startEnroll() {
    if (!guardAuthConfigured()) {
      return;
    }
    if (enrollment !== null) {
      setEnrollOpen(true);
      return;
    }
    setPending(true);
    try {
      const created = await getBrowserAuth().enrollTotp({
        issuer: "Orvex",
        friendlyName: "Authenticator",
      });
      setEnrollment(created);
      setEnrollCode("");
      setEnrollOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to start 2FA setup";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  async function abandonEnrollment() {
    if (skipDiscardRef.current) {
      skipDiscardRef.current = false;
      return;
    }
    const current = enrollmentRef.current;
    if (current === null) {
      return;
    }
    enrollmentRef.current = null;
    setEnrollment(null);
    setEnrollCode("");
    try {
      await getBrowserAuth().discardTotpEnrollment(current.id);
    } catch {
      return;
    }
  }

  async function confirmEnroll() {
    if (enrollment === null) {
      return;
    }
    if (enrollCode.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setPending(true);
    try {
      await getBrowserAuth().challengeAndVerify(enrollment.id, enrollCode);
      await refreshBrowserSession();
      await loadFactors();
      skipDiscardRef.current = true;
      enrollmentRef.current = null;
      setEnrollment(null);
      setEnrollCode("");
      setEnrollOpen(false);
      toast.success("Authenticator app enabled");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to verify code";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  async function disableTotp() {
    const factor = verifiedFactors(factors)[0];
    if (factor === undefined) {
      return;
    }
    if (disableCode.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setPending(true);
    try {
      await getBrowserAuth().unenroll(factor.id, disableCode);
      await refreshBrowserSession();
      await loadFactors();
      setDisableCode("");
      setDisableOpen(false);
      toast.success("Authenticator app disabled");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to disable 2FA";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <SettingsBlock
      framed={framed}
      title="Authenticator app"
      description="Time-based codes for sign-in and password changes."
      action={
        <Badge variant={enabled ? "secondary" : "outline"}>
          {enabled ? "On" : "Off"}
        </Badge>
      }
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {loading
            ? "Checking status…"
            : enabled
              ? "A TOTP factor is protecting this account."
              : "Add an authenticator app to require a code after your password."}
        </p>
        {enabled ? (
          <Button
            type="button"
            variant="destructive"
            disabled={pending || loading}
            onClick={() => {
              setDisableOpen(true);
            }}
          >
            Disable
          </Button>
        ) : (
          <Button
            type="button"
            disabled={pending || loading}
            onClick={() => {
              void startEnroll();
            }}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {enrollment === null ? "Enable" : "Continue setup"}
          </Button>
        )}
      </div>
      <Dialog
        open={enrollOpen}
        onOpenChange={(open) => {
          setEnrollOpen(open);
          if (!open) {
            void abandonEnrollment();
          }
        }}
      >
        <DialogContent className="min-w-0 sm:max-w-md">
          <DialogHeader className="items-center pr-8 text-center">
            <DialogTitle>Set up authenticator</DialogTitle>
            <DialogDescription className="text-center text-balance">
              Scan with your app, then enter the current 6-digit code.
            </DialogDescription>
          </DialogHeader>
          {enrollment === null ? null : (
            <div className="flex min-w-0 flex-col items-center gap-5">
              <div className="rounded-xl bg-white p-2.5 ring-1 ring-black/10">
                <img
                  src={enrollment.qrCode}
                  alt="Authenticator QR code"
                  className="size-40"
                />
              </div>
              <TotpSecret secret={enrollment.secret} />
              <Field className="items-center">
                <FieldLabel htmlFor="totp-enroll-otp">
                  Authenticator code
                </FieldLabel>
                <CodeOtp
                  id="totp-enroll-otp"
                  value={enrollCode}
                  onChange={setEnrollCode}
                  disabled={pending}
                  centered
                />
              </Field>
              <Button
                type="button"
                className="w-full"
                disabled={pending || enrollCode.length !== 6}
                onClick={() => {
                  void confirmEnroll();
                }}
              >
                {pending ? <Spinner data-icon="inline-start" /> : null}
                {pending ? "Verifying" : "Verify and enable"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={disableOpen}
        onOpenChange={(open) => {
          setDisableOpen(open);
          if (!open) {
            setDisableCode("");
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader className="place-items-center text-center sm:place-items-center sm:text-center">
            <AlertDialogMedia className="mx-auto">
              <ShieldOff />
            </AlertDialogMedia>
            <AlertDialogTitle>Disable authenticator app?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Enter a current code to confirm. Password-only sign-in will work
              again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Field className="items-center">
            <FieldLabel htmlFor="totp-disable-otp">
              Authenticator code
            </FieldLabel>
            <CodeOtp
              id="totp-disable-otp"
              value={disableCode}
              onChange={setDisableCode}
              disabled={pending}
              centered
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={pending || disableCode.length !== 6}
              onClick={() => {
                void disableTotp();
              }}
            >
              {pending ? <Spinner data-icon="inline-start" /> : null}
              Disable
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsBlock>
  );
}
