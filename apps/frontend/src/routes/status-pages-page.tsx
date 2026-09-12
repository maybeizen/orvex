import { getPlan } from "@orvex/types/plans";
import { RequireSession } from "@/components/auth/require-session";
import { StatusPageList } from "@/components/status-pages/status-page-board";
import { STATUS_PAGES } from "@/lib/console";
import { selectActiveOrganization, useOrgStore } from "@/stores/org-store";

export function StatusPagesPage() {
  const organization = useOrgStore(selectActiveOrganization);
  const planLabel =
    organization === null
      ? null
      : getPlan(organization.planId).limits.statusPage;

  return (
    <RequireSession
      title="Status pages"
      description="Sign in to manage status pages."
    >
      <StatusPageList pages={STATUS_PAGES} planLabel={planLabel} />
    </RequireSession>
  );
}
