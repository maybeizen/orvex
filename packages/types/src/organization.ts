export type OrganizationKind = "single" | "team";

export type OrganizationPlanId = "free" | "probe" | "sentinel" | "command";

export type OrganizationBillingStatus =
  "active" | "pending_checkout" | "past_due" | "canceled";

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

export type OrganizationMember = {
  userId: string;
  role: OrganizationRole;
  username: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
};

export type OrganizationInvite = {
  id: string;
  email: string;
  role: Exclude<OrganizationRole, "owner">;
  expiresAt: string;
  createdAt: string;
};

export type OrganizationMemberList = {
  members: OrganizationMember[];
  invites: OrganizationInvite[];
  seatLimit: number;
  seatsUsed: number;
  canManage: boolean;
};
