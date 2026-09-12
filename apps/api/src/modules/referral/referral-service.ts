import type { Referral, ReferralProgram, ReferralStatus } from "@orvex/types";
import { TRPCError } from "@trpc/server";
import { writeAuditEvent } from "../audit/audit-service.js";
import type { OrganizationClient } from "../organization/organization-dto.js";

export type ReferralClient = Pick<OrganizationClient, "from">;

type ReferralRow = {
  id: string;
  referrer_organization_id: string;
  referred_organization_id: string;
  status: string;
  stripe_credit_id: string | null;
  created_at: string;
};

const STATUSES = new Set<ReferralStatus>(["pending", "credited", "reversed"]);

function throwDb(message: string): never {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message,
  });
}

function toReferralDto(row: ReferralRow): Referral {
  return {
    id: row.id,
    referrerOrganizationId: row.referrer_organization_id,
    referredOrganizationId: row.referred_organization_id,
    status: STATUSES.has(row.status as ReferralStatus)
      ? (row.status as ReferralStatus)
      : "pending",
    stripeCreditId: row.stripe_credit_id,
    createdAt: row.created_at,
  };
}

export async function resolveReferrerOrganizationId(
  supabase: ReferralClient,
  referralCode: string,
): Promise<string> {
  const code = referralCode.trim();
  if (code.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "That referral code is not valid",
    });
  }

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("referral_code", code)
    .maybeSingle();
  if (error !== null) {
    throwDb(error.message);
  }
  if (data === null) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "That referral code is not valid",
    });
  }
  return data.id;
}

export async function creditReferral(
  supabase: ReferralClient,
  referredOrganizationId: string,
  referrerOrganizationId: string,
  actorUserId: string | null,
): Promise<Referral> {
  if (referredOrganizationId === referrerOrganizationId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "That referral code is not valid",
    });
  }

  const { data: existing, error: existingError } = await supabase
    .from("referrals")
    .select("*")
    .eq("referred_organization_id", referredOrganizationId)
    .maybeSingle();
  if (existingError !== null) {
    throwDb(existingError.message);
  }
  if (existing !== null) {
    return toReferralDto(existing);
  }

  const { error: updateError } = await supabase
    .from("organizations")
    .update({ referred_by_organization_id: referrerOrganizationId })
    .eq("id", referredOrganizationId);
  if (updateError !== null) {
    throwDb(updateError.message);
  }

  const { data, error } = await supabase
    .from("referrals")
    .insert({
      referrer_organization_id: referrerOrganizationId,
      referred_organization_id: referredOrganizationId,
      status: "pending",
    })
    .select("*")
    .single();
  if (error !== null) {
    if (error.code === "23505") {
      const { data: again, error: againError } = await supabase
        .from("referrals")
        .select("*")
        .eq("referred_organization_id", referredOrganizationId)
        .maybeSingle();
      if (againError !== null) {
        throwDb(againError.message);
      }
      if (again !== null) {
        return toReferralDto(again);
      }
    }
    throwDb(error.message);
  }

  await writeAuditEvent(supabase, {
    organizationId: referrerOrganizationId,
    actorUserId,
    action: "referral.apply",
    resourceType: "referral",
    resourceId: data.id,
    payload: { referredOrganizationId },
  });

  return toReferralDto(data);
}

export async function applyReferralCode(
  supabase: ReferralClient,
  referredOrganizationId: string,
  referralCode: string,
  actorUserId: string | null,
): Promise<Referral> {
  const referrerOrganizationId = await resolveReferrerOrganizationId(
    supabase,
    referralCode,
  );
  return creditReferral(
    supabase,
    referredOrganizationId,
    referrerOrganizationId,
    actorUserId,
  );
}

export async function getReferralProgram(
  supabase: ReferralClient,
  organizationId: string,
): Promise<ReferralProgram> {
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .maybeSingle();
  if (orgError !== null) {
    throwDb(orgError.message);
  }
  if (org === null) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Organization not found",
    });
  }

  const { data, error } = await supabase
    .from("referrals")
    .select("*")
    .eq("referrer_organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error !== null) {
    throwDb(error.message);
  }

  return {
    code: org.referral_code,
    sharePath: `/r/${org.referral_code}`,
    items: ((data as ReferralRow[] | null) ?? []).map(toReferralDto),
  };
}
