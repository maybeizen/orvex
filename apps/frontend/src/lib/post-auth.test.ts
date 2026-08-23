/** @vitest-environment jsdom */
import { beforeEach, expect, test, vi } from "vitest";
import { useOrgStore } from "@/stores/org-store";

const listQuery = vi.fn();
const meQuery = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    organization: {
      list: { query: listQuery },
    },
    auth: {
      me: { query: meQuery },
    },
  }),
}));

import {
  hydrateOrganizations,
  hydrateSessionUser,
  pathAfterAuth,
} from "./post-auth.js";

const acme = {
  id: "org-1",
  name: "Acme",
  slug: "acme",
  iconUrl: null,
  kind: "single" as const,
  planId: "free" as const,
  billingStatus: "active" as const,
  role: "owner" as const,
};

const jwtUser = {
  id: "user-1",
  email: "ada@orvex.dev",
  emailConfirmedAt: null,
  newEmail: null,
  firstName: "Ada",
  lastName: "Lovelace",
  username: null,
  displayName: "Ada Lovelace",
  avatarUrl: null,
};

beforeEach(() => {
  listQuery.mockReset();
  meQuery.mockReset();
  useOrgStore.getState().reset();
});

test("hydrateOrganizations writes memberships into the org store", async () => {
  listQuery.mockResolvedValue({
    items: [acme],
    activeOrganizationId: acme.id,
  });

  await hydrateOrganizations();

  expect(useOrgStore.getState().items).toEqual([acme]);
  expect(useOrgStore.getState().activeOrganizationId).toBe(acme.id);
  expect(useOrgStore.getState().status).toBe("ready");
});

test("pathAfterAuth sends empty memberships to onboarding", async () => {
  listQuery.mockResolvedValue({ items: [], activeOrganizationId: null });
  expect(await pathAfterAuth()).toBe("/onboarding");
  expect(await pathAfterAuth("/dashboard")).toBe("/onboarding");
});

test("pathAfterAuth keeps the intended path when memberships exist", async () => {
  listQuery.mockResolvedValue({
    items: [acme],
    activeOrganizationId: acme.id,
  });
  expect(await pathAfterAuth("/dashboard")).toBe("/dashboard");
  expect(await pathAfterAuth("/profile")).toBe("/profile");
});

test("pathAfterAuth never hijacks password recovery", async () => {
  listQuery.mockResolvedValue({ items: [], activeOrganizationId: null });
  expect(await pathAfterAuth("/reset-password")).toBe("/reset-password");
});

test("pathAfterAuth falls back to the intended path when list fails", async () => {
  listQuery.mockRejectedValue(new Error("offline"));
  expect(await pathAfterAuth("/dashboard")).toBe("/dashboard");
});

test("hydrateSessionUser merges username and avatar from auth.me", async () => {
  listQuery.mockResolvedValue({
    items: [acme],
    activeOrganizationId: acme.id,
  });
  meQuery.mockResolvedValue({
    ...jwtUser,
    username: "ada",
    avatarUrl: "https://cdn.test/ada.webp",
  });

  const next = await hydrateSessionUser(jwtUser);

  expect(next.username).toBe("ada");
  expect(next.avatarUrl).toBe("https://cdn.test/ada.webp");
  expect(useOrgStore.getState().activeOrganizationId).toBe(acme.id);
});

test("hydrateSessionUser keeps the jwt user when auth.me fails", async () => {
  listQuery.mockResolvedValue({
    items: [acme],
    activeOrganizationId: acme.id,
  });
  meQuery.mockRejectedValue(new Error("offline"));

  await expect(hydrateSessionUser(jwtUser)).resolves.toEqual(jwtUser);
});
