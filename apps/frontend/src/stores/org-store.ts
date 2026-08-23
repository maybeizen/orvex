import type { Organization } from "@orvex/types";
import { create } from "zustand";

export type OrgStatus = "idle" | "loading" | "ready";

type OrgState = {
  status: OrgStatus;
  items: Organization[];
  activeOrganizationId: string | null;
  markLoading: () => void;
  hydrate: (
    items: Organization[],
    activeOrganizationId: string | null,
  ) => void;
  upsert: (organization: Organization) => void;
  reset: () => void;
};

export const useOrgStore = create<OrgState>()((set) => ({
  status: "idle",
  items: [],
  activeOrganizationId: null,
  markLoading: () => {
    set({ status: "loading" });
  },
  hydrate: (items, activeOrganizationId) => {
    set({ status: "ready", items, activeOrganizationId });
  },
  upsert: (organization) => {
    set((state) => {
      const exists = state.items.some((item) => item.id === organization.id);
      return {
        status: "ready",
        items: exists
          ? state.items.map((item) =>
              item.id === organization.id ? organization : item,
            )
          : [...state.items, organization],
        activeOrganizationId: organization.id,
      };
    });
  },
  reset: () => {
    set({ status: "idle", items: [], activeOrganizationId: null });
  },
}));

export function selectActiveOrganization(state: OrgState): Organization | null {
  const { items, activeOrganizationId } = state;
  if (activeOrganizationId !== null) {
    const matched = items.find((item) => item.id === activeOrganizationId);
    if (matched !== undefined) {
      return matched;
    }
  }
  return items[0] ?? null;
}
