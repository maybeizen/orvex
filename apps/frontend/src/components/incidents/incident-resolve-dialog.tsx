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

export function IncidentResolveDialog({
  organizationId,
  incident,
  open,
  onOpenChange,
  onResolved,
}: {
  organizationId: string;
  incident: Incident;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved: (incident: Incident) => void;
}) {
  const [pending, setPending] = useState(false);

  async function confirm() {
    setPending(true);
    try {
      const next = await createIncidentClient().incident.resolve.mutate({
        organizationId,
        incidentId: incident.id,
      });
      toast.success("Incident resolved");
      onResolved(next);
      onOpenChange(false);
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "Unable to resolve",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resolve incident</AlertDialogTitle>
          <AlertDialogDescription>
            Close {incidentSubject(incident)}. This does not change the monitor
            itself.
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
            {pending ? "Resolving" : "Resolve"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
