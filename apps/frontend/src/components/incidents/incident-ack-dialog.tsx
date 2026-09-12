import { useState } from "react";
import { toast } from "sonner";
import type { Incident } from "@orvex/types";
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
import { Spinner } from "@/components/ui/spinner";
import { createIncidentClient } from "./incident-client";
import { incidentSubject } from "./incident-format";

export function IncidentAckDialog({
  organizationId,
  incident,
  open,
  onOpenChange,
  onAcked,
}: {
  organizationId: string;
  incident: Incident;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAcked: (incident: Incident) => void;
}) {
  const [pending, setPending] = useState(false);

  async function confirm() {
    setPending(true);
    try {
      const next = await createIncidentClient().incident.ack.mutate({
        organizationId,
        incidentId: incident.id,
      });
      toast.success("Incident acknowledged");
      onAcked(next);
      onOpenChange(false);
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "Unable to acknowledge",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Acknowledge incident</AlertDialogTitle>
          <AlertDialogDescription>
            Mark {incidentSubject(incident)} as seen. The incident stays open
            until it is resolved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            disabled={pending}
            onClick={() => {
              void confirm();
            }}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {pending ? "Acknowledging" : "Acknowledge"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
