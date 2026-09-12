export type ReferralStatus = "pending" | "credited" | "reversed";

export type Referral = {
  id: string;
  referrerOrganizationId: string;
  referredOrganizationId: string;
  status: ReferralStatus;
  stripeCreditId: string | null;
  createdAt: string;
};

export type ReferralProgram = {
  code: string;
  sharePath: string;
  items: readonly Referral[];
};
