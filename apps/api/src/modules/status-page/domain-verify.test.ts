import { TRPCError } from "@trpc/server";
import { expect, test } from "vitest";
import { setDomain, verifyDomain } from "./status-page-service.js";
import {
  createStatusPageMemory,
  organizationRow,
  PAGE_ID,
  statusPageRow,
} from "./test-support.js";

function commandMemory() {
  return createStatusPageMemory({
    organizations: [organizationRow({ plan_id: "command", kind: "team" })],
    pages: [statusPageRow()],
  });
}

function asError(value: unknown): TRPCError {
  expect(value).toBeInstanceOf(TRPCError);
  return value as TRPCError;
}

test("setDomain rejects ip literals, localhost, and .internal names", async () => {
  const memory = commandMemory();
  const organization = memory.organizations[0];
  if (organization === undefined) {
    throw new Error("missing organization");
  }

  for (const customDomain of [
    "127.0.0.1",
    "localhost",
    "status.localhost",
    "status.ada.internal",
    "[::1]",
  ]) {
    const error = asError(
      await setDomain(memory.supabase, organization, {
        pageId: PAGE_ID,
        customDomain,
      }).catch((caught: unknown) => caught),
    );
    expect(error.code).toBe("BAD_REQUEST");
  }
  expect(memory.pages[0]?.custom_domain).toBeNull();
});

test("verifyDomain fails closed without a TXT record and succeeds when the resolver returns the token", async () => {
  const memory = commandMemory();
  const organization = memory.organizations[0];
  if (organization === undefined) {
    throw new Error("missing organization");
  }
  const issued = await setDomain(memory.supabase, organization, {
    pageId: PAGE_ID,
    customDomain: "status.ada.dev",
  });

  const missing = asError(
    await verifyDomain(
      memory.supabase,
      organization,
      { pageId: PAGE_ID, token: issued.domain.value },
      { resolveTxt: () => Promise.resolve([]) },
    ).catch((caught: unknown) => caught),
  );
  expect(missing.code).toBe("BAD_REQUEST");
  expect(memory.pages[0]?.domain_verified_at).toBeNull();

  const verified = await verifyDomain(
    memory.supabase,
    organization,
    { pageId: PAGE_ID, token: issued.domain.value },
    {
      resolveTxt: (hostname) => {
        expect(hostname).toBe("_orvex.status.ada.dev");
        return Promise.resolve(["noise", issued.domain.value]);
      },
    },
  );
  expect(verified.domainVerifiedAt).toEqual(expect.any(String));
});

test("verifyDomain fails closed on timeout and lookup errors", async () => {
  const memory = commandMemory();
  const organization = memory.organizations[0];
  if (organization === undefined) {
    throw new Error("missing organization");
  }
  const issued = await setDomain(memory.supabase, organization, {
    pageId: PAGE_ID,
    customDomain: "status.ada.dev",
  });

  const timedOut = asError(
    await verifyDomain(
      memory.supabase,
      organization,
      { pageId: PAGE_ID, token: issued.domain.value },
      {
        deadlineMs: 20,
        resolveTxt: () =>
          new Promise<readonly string[]>((resolve) => {
            setTimeout(() => {
              resolve(["too-late"]);
            }, 150);
          }),
      },
    ).catch((caught: unknown) => caught),
  );
  expect(timedOut.code).toBe("BAD_REQUEST");
  expect(timedOut.message).toBe("Domain verification failed");

  const nxdomain = Object.assign(new Error("queryA ENOTFOUND"), {
    code: "ENOTFOUND",
  });
  const missingName = asError(
    await verifyDomain(
      memory.supabase,
      organization,
      { pageId: PAGE_ID, token: issued.domain.value },
      {
        resolveTxt: () => Promise.reject(nxdomain),
      },
    ).catch((caught: unknown) => caught),
  );
  expect(missingName.code).toBe("BAD_REQUEST");
  expect(missingName.message).not.toContain("ENOTFOUND");
  expect(memory.pages[0]?.domain_verified_at).toBeNull();
});
