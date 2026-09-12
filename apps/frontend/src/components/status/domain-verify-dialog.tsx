import { useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
import type { Organization, StatusPage } from "@orvex/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { statusPageApi } from "./status-api";
import {
  copyText,
  faultMessage,
  type DomainInstructions,
} from "./status-helpers";

export function DomainVerifyDialog({
  open,
  organization,
  page,
  instructions,
  onOpenChange,
  onVerified,
}: {
  open: boolean;
  organization: Organization;
  page: StatusPage;
  instructions: DomainInstructions | null;
  onOpenChange: (open: boolean) => void;
  onVerified: (next: StatusPage) => void;
}) {
  const [edited, setEdited] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const token = edited ?? instructions?.value ?? "";

  function close() {
    if (pending) {
      return;
    }
    setEdited(null);
    onOpenChange(false);
  }

  async function verify() {
    setPending(true);
    try {
      const next = await statusPageApi().verifyDomain.mutate({
        organizationId: organization.id,
        pageId: page.id,
        token: token.trim(),
      });
      toast.success("Domain verified");
      setEdited(null);
      onVerified(next);
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(faultMessage(error, "Unable to verify domain"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          close();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify custom domain</DialogTitle>
          <DialogDescription>
            Add this TXT record, then confirm with the issued token.
          </DialogDescription>
        </DialogHeader>
        {instructions === null ? (
          <p className="text-sm text-muted-foreground">
            Bind a domain first. Instructions appear after the record is issued.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5 font-mono text-xs">
              <p>
                <span className="text-muted-foreground">Record</span>{" "}
                {instructions.record}
              </p>
              <p>
                <span className="text-muted-foreground">Host</span>{" "}
                {instructions.host}
              </p>
              <p className="break-all">
                <span className="text-muted-foreground">Value</span>{" "}
                {instructions.value}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  void copyText(instructions.host).then((ok) => {
                    toast[ok ? "success" : "error"](
                      ok ? "Host copied" : "Unable to copy",
                    );
                  });
                }}
              >
                Copy host
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  void copyText(instructions.value).then((ok) => {
                    toast[ok ? "success" : "error"](
                      ok ? "Value copied" : "Unable to copy",
                    );
                  });
                }}
              >
                Copy value
              </Button>
            </div>
          </div>
        )}
        <form
          className="flex flex-col gap-3"
          onSubmit={(event: SyntheticEvent<HTMLFormElement>) => {
            event.preventDefault();
            void verify();
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="domain-verify-token">Token</FieldLabel>
              <Input
                id="domain-verify-token"
                required
                value={token}
                onChange={(event) => {
                  setEdited(event.target.value);
                }}
              />
              <FieldDescription>
                Paste the TXT value issued for{" "}
                {page.customDomain ?? "this page"}.
              </FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Close
            </Button>
            <Button
              type="submit"
              disabled={pending || token.trim().length === 0}
            >
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {pending ? "Verifying" : "Verify domain"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
