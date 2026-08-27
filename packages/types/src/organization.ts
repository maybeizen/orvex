export type OrganizationKind = "single" | "team";

export type OrganizationPlanId = "free" | "probe" | "sentinel" | "command";

export type OrganizationBillingStatus =
  "active" | "pending_checkout" | "past_due" | "canceled";

export type OrganizationRole = "owner" | "admin" | "member";

export type OrganizationAccessMode = "preset" | "custom";

export type OrganizationMemberStatus = "active" | "locked";

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

export type OrganizationMember = {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: OrganizationRole;
  permissionMask: string;
  accessMode: OrganizationAccessMode;
  status: OrganizationMemberStatus;
  lockedAt: string | null;
  createdAt: string;
  emailConfirmedAt: string | null;
};

export type OrganizationInvite = {
  id: string;
  email: string;
  permissionMask: string;
  accessMode: OrganizationAccessMode;
  presetRole: OrganizationRole | null;
  expiresAt: string;
  createdAt: string;
};
