import type { Organization } from "@orvex/types";
import { createVanillaTrpcClient } from "@/lib/trpc";
import { useOrgStore } from "@/stores/org-store";

export async function activateOrganization(
  organization: Organization,
): Promise<void> {
  const result = await createVanillaTrpcClient().organization.setActive.mutate({
    organizationId: organization.id,
  });
  useOrgStore.getState().hydrate(result.items, result.activeOrganizationId);
}
