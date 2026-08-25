import type { AuthUser } from "@orvex/types";
import { createVanillaTrpcClient } from "@/lib/trpc";
import { useOrgStore } from "@/stores/org-store";
import { ORGANIZATIONS_HOME } from "@/lib/org-paths";

export async function hydrateOrganizations(): Promise<{
  items: { id: string }[];
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
    hydrateOrganizations().catch(() => {
      useOrgStore.getState().hydrate([], null);
    }),
  ]);
  return nextUser;
}

export async function pathAfterAuth(
  intended = ORGANIZATIONS_HOME,
): Promise<string> {
  try {
    const list = await hydrateOrganizations();
    if (intended === "/reset-password") {
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
