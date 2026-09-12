import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { Organization } from "@orvex/types";
import { SettingsBlock } from "@/components/account/settings-block";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { ORGANIZATIONS_PATH } from "@/lib/org-paths";
import { createVanillaTrpcClient } from "@/lib/trpc";
import { useOrgStore } from "@/stores/org-store";

type Step = 1 | 2 | 3;

export function DeleteOrganization({
  organization,
}: {
  organization: Organization;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step | null>(null);
  const [pending, setPending] = useState(false);

  function close() {
    if (pending) {
      return;
    }
    setStep(null);
  }

  async function confirmDelete() {
    setPending(true);
    try {
      await createVanillaTrpcClient().organization.delete.mutate({
        organizationId: organization.id,
        organizationSlug: organization.slug,
      });
      const listed = await createVanillaTrpcClient().organization.list.query();
      useOrgStore.getState().hydrate(listed.items, listed.activeOrganizationId);
      toast.success(`${organization.name} was deleted`);
      setStep(null);
      void navigate(ORGANIZATIONS_PATH, { replace: true });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to delete organization";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  if (organization.role !== "owner") {
    return null;
  }

  return (
    <>
      <SettingsBlock
        title="Delete organization"
        description="Permanently remove this desk and every monitor, history row, and record attached to it."
      >
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => {
            setStep(1);
          }}
        >
          Delete organization
        </Button>
      </SettingsBlock>
      <Dialog
        open={step === 1}
        onOpenChange={(open) => {
          if (!open) {
            close();
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(event) => {
            event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Delete {organization.name}?</DialogTitle>
            <DialogDescription>
              This is the first of three confirmations. Deleting this
              organization immediately removes all monitors, their history, and
              data related to the organization. The action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setStep(2);
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={step === 2}
        onOpenChange={(open) => {
          if (!open) {
            close();
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(event) => {
            event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Monitors and history are wiped</DialogTitle>
            <DialogDescription>
              Every uptime check, incident timeline, status page binding, seat,
              invite, and billing record on {organization.slug} is removed at
              once. There is no recycle bin and no restore.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setStep(3);
              }}
            >
              I understand, continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={step === 3}
        onOpenChange={(open) => {
          if (!open) {
            close();
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(event) => {
            event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Final confirmation</DialogTitle>
            <DialogDescription>
              Last warning. Confirming now deletes {organization.name} and every
              monitor, history series, and organization record. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={close}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                void confirmDelete();
              }}
            >
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {pending ? "Deleting" : "Delete organization now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
