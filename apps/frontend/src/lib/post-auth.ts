import type { AuthUser, Organization } from "@orvex/types";
import { createVanillaTrpcClient } from "@/lib/trpc";
import { useOrgStore } from "@/stores/org-store";
import { ORGANIZATIONS_HOME } from "@/lib/org-paths";

async function claimPendingInvites(): Promise<void> {
  await createVanillaTrpcClient()
    .organization.invites.claimPending.mutate()
    .catch(() => undefined);
}

export async function hydrateOrganizations(): Promise<{
  items: Organization[];
  activeOrganizationId: string | null;
}> {
  const result = await createVanillaTrpcClient().organization.list.query();
  useOrgStore.getState().hydrate(result.items, result.activeOrganizationId);
  return result;
}

export async function hydrateSessionUser(user: AuthUser): Promise<AuthUser> {
  useOrgStore.getState().markLoading();
  const [nextUser] = await Promise.all([
    createVanillaTrpcClient()
      .auth.me.query()
      .catch(() => user),
    claimPendingInvites().then(() =>
      hydrateOrganizations().catch(() => {
        useOrgStore.getState().hydrate([], null);
      }),
    ),
  ]);
  return nextUser;
}

export async function pathAfterAuth(
  intended = ORGANIZATIONS_HOME,
): Promise<string> {
  try {
    await claimPendingInvites();
    const list = await hydrateOrganizations();
    if (intended === "/reset-password") {
      return intended;
    }
    if (intended.startsWith("/invite/")) {
      return intended;
    }
    if (list.items.length === 0) {
      return "/onboarding";
    }
    return intended;
  } catch {
    return intended;
  }
}
