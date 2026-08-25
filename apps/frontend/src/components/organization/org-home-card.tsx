import type { Organization } from "@orvex/types";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  OrgAvatar,
  orgKindLabel,
  orgPlanLabel,
} from "@/components/organization/org-avatar";
import { Badge } from "@/components/ui/badge";
import { activateOrganization } from "@/lib/activate-organization";
import { cn } from "@/lib/cn";
import { orgWorkspacePath } from "@/lib/org-paths";

export function OrgHomeCard({ organization }: { organization: Organization }) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  async function open() {
    setPending(true);
    try {
      await activateOrganization(organization);
      void navigate(orgWorkspacePath(organization.slug));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to open organization";
      toast.error(message);
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        void open();
      }}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl bg-card p-4 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
      )}
    >
      <OrgAvatar
        name={organization.name}
        iconUrl={organization.iconUrl}
        size="lg"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-heading text-sm font-medium">
          {organization.name}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="font-mono uppercase">
            {orgPlanLabel(organization.planId)}
          </Badge>
          <Badge variant="secondary">{orgKindLabel(organization.kind)}</Badge>
        </span>
      </span>
    </button>
  );
}
