import { expect, test } from "vitest";
import type { ContextRequest } from "../../trpc/context.js";
import { withCache } from "../../trpc/test-context.js";
import { referralRouter } from "./router.js";
import {
  createLedgerMemory,
  memberRow,
  organizationRow,
  orgTestUser,
  referralRow,
} from "./test-support.js";

const req: ContextRequest = { headers: {} };

test("referral.mine is available on the referral router", async () => {
  const org = organizationRow({ referral_code: "SHAREME1" });
  const memory = createLedgerMemory({
    organizations: [org],
    members: [memberRow()],
    referrals: [
      referralRow({
        referrer_organization_id: org.id,
        referred_organization_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
      }),
    ],
  });

  const caller = referralRouter.createCaller(
    withCache({
      user: orgTestUser,
      req,
      supabase: memory.supabase,
    }),
  );
  const mine = await caller.mine({ organizationId: org.id });
  expect(mine).toEqual({
    code: "SHAREME1",
    sharePath: "/r/SHAREME1",
    items: [
      expect.objectContaining({
        referrerOrganizationId: org.id,
      }),
    ],
  });
});
