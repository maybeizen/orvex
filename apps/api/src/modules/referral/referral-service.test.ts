import { expect, test } from "vitest";
import { createOrganization } from "../organization/organization-service.js";
import { creditReferral, getReferralProgram } from "./referral-service.js";
import {
  createLedgerMemory,
  memberRow,
  organizationRow,
  orgTestUser,
  referralRow,
} from "./test-support.js";

const createInput = {
  name: "Referred Desk",
  slug: "referred-desk",
  kind: "single" as const,
  planId: "free" as const,
  billingCycle: "monthly" as const,
  tosAccepted: true as const,
  marketingOptIn: false,
};

test("referral.mine returns the org code, share path, and ledger rows", async () => {
  const org = organizationRow({ referral_code: "TEAMCODE" });
  const referred = organizationRow({
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    slug: "other-desk",
    referral_code: "OTHERCODE",
  });
  const memory = createLedgerMemory({
    organizations: [org, referred],
    members: [memberRow()],
    referrals: [
      referralRow({
        referrer_organization_id: org.id,
        referred_organization_id: referred.id,
        status: "pending",
      }),
    ],
  });

  const program = await getReferralProgram(memory.supabase, org.id);
  expect(program.code).toBe("TEAMCODE");
  expect(program.sharePath).toBe("/r/TEAMCODE");
  expect(program.items).toEqual([
    expect.objectContaining({
      referrerOrganizationId: org.id,
      referredOrganizationId: referred.id,
      status: "pending",
    }),
  ]);
});

test("createOrganization applies a referral code once per referred org", async () => {
  const referrer = organizationRow({
    referral_code: "TEAMCODE",
    slug: "referrer-desk",
  });
  const memory = createLedgerMemory({
    organizations: [referrer],
    members: [memberRow({ organization_id: referrer.id })],
  });

  const created = await createOrganization(memory.supabase, orgTestUser, {
    ...createInput,
    referralCode: "TEAMCODE",
  });

  expect(
    memory.organizations.find((row) => row.id === created.id)
      ?.referred_by_organization_id,
  ).toBe(referrer.id);
  expect(memory.referrals).toHaveLength(1);
  expect(memory.referrals[0]).toEqual(
    expect.objectContaining({
      referrer_organization_id: referrer.id,
      referred_organization_id: created.id,
      status: "pending",
    }),
  );

  const again = await creditReferral(
    memory.supabase,
    created.id,
    referrer.id,
    orgTestUser.id,
  );
  expect(again.id).toBe(memory.referrals[0]?.id);
  expect(memory.referrals).toHaveLength(1);
});

test("creditReferral credits two different orgs under the same referrer", async () => {
  const referrer = organizationRow({ referral_code: "TEAMCODE" });
  const first = organizationRow({
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    slug: "first-desk",
    referral_code: "FIRSTCODE",
  });
  const second = organizationRow({
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
    slug: "second-desk",
    referral_code: "SECONDCODE",
  });
  const memory = createLedgerMemory({
    organizations: [referrer, first, second],
    members: [memberRow()],
  });

  await creditReferral(memory.supabase, first.id, referrer.id, orgTestUser.id);
  await creditReferral(memory.supabase, second.id, referrer.id, orgTestUser.id);
  expect(memory.referrals).toHaveLength(2);
});
