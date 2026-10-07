import { effectivePlanId, planSeatLimit } from "@orvex/types/plans";

export function seatLimitForOrganization(
  kind: string,
  planId: string,
  billingStatus: string,
): number {
  if (kind === "single") {
    return 1;
  }
  return planSeatLimit(effectivePlanId(planId, billingStatus));
}

export function occupancyAfterMemberInsert(input: {
  activeMembersIncludingNew: number;
  pendingInvites: number;
  newMemberMatchesPendingInvite: boolean;
}): number {
  const credit = input.newMemberMatchesPendingInvite ? 1 : 0;
  return input.activeMembersIncludingNew + input.pendingInvites - credit;
}

export function seatLimitExceeded(occupied: number, limit: number): boolean {
  return occupied > limit;
}
