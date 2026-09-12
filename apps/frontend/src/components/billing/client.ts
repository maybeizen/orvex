import type {
  BillingInvoice,
  BillingOrder,
  OrganizationPlanId,
  ReferralProgram,
} from "@orvex/types";
import type { BillingCycle } from "@orvex/types/plans";
import { createVanillaTrpcClient } from "@/lib/trpc";

type OrgRef = {
  organizationId: string;
};

type CheckoutInput = OrgRef & {
  planId: OrganizationPlanId;
  cycle: BillingCycle;
};

type BillingUrl = {
  url: string;
};

type BillingClient = {
  billing: {
    listInvoices: { query: (input: OrgRef) => Promise<BillingInvoice[]> };
    listOrders: { query: (input: OrgRef) => Promise<BillingOrder[]> };
    createCheckoutSession: {
      mutate: (input: CheckoutInput) => Promise<BillingUrl>;
    };
    createPortalSession: { mutate: (input: OrgRef) => Promise<BillingUrl> };
  };
  referral: {
    mine: { query: (input: OrgRef) => Promise<ReferralProgram> };
  };
};

function billingClient(): BillingClient {
  return createVanillaTrpcClient() as unknown as BillingClient;
}

export function queryInvoices(
  organizationId: string,
): Promise<BillingInvoice[]> {
  return billingClient().billing.listInvoices.query({ organizationId });
}

export function queryOrders(organizationId: string): Promise<BillingOrder[]> {
  return billingClient().billing.listOrders.query({ organizationId });
}

export function queryReferralProgram(
  organizationId: string,
): Promise<ReferralProgram> {
  return billingClient().referral.mine.query({ organizationId });
}

export function mutateCheckoutSession(
  input: CheckoutInput,
): Promise<BillingUrl> {
  return billingClient().billing.createCheckoutSession.mutate(input);
}

export function mutatePortalSession(
  organizationId: string,
): Promise<BillingUrl> {
  return billingClient().billing.createPortalSession.mutate({
    organizationId,
  });
}
