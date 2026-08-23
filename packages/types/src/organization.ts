export type OrganizationKind = "single" | "team";

export type OrganizationPlanId = "free" | "probe" | "sentinel" | "command";

export type OrganizationBillingStatus =
  | "active"
  | "pending_checkout"
  | "past_due"
  | "canceled";

export type OrganizationRole = "owner" | "admin" | "member";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  kind: OrganizationKind;
  planId: OrganizationPlanId;
  billingStatus: OrganizationBillingStatus;
  role: OrganizationRole;
};
