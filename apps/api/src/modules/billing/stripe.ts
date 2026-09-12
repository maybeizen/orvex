import { randomBytes } from "node:crypto";
import { isPaidPlan, type BillingCycle } from "@orvex/types/plans";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import type { OrganizationPlanId } from "@orvex/types";

export type PaidPlanId = Exclude<OrganizationPlanId, "free">;

export type StripeClient = {
  customers: {
    create: (
      params: Stripe.CustomerCreateParams,
    ) => Promise<Pick<Stripe.Customer, "id">>;
  };
  prices: {
    search: (
      params: Stripe.PriceSearchParams,
    ) => Promise<{ data: Array<Pick<Stripe.Price, "id" | "metadata">> }>;
  };
  checkout: {
    sessions: {
      create: (
        params: Stripe.Checkout.SessionCreateParams,
      ) => Promise<Pick<Stripe.Checkout.Session, "id" | "url">>;
    };
  };
  billingPortal: {
    sessions: {
      create: (
        params: Stripe.BillingPortal.SessionCreateParams,
      ) => Promise<Pick<Stripe.BillingPortal.Session, "url">>;
    };
  };
  invoices: {
    list: (
      params: Stripe.InvoiceListParams,
    ) => Promise<{ data: Stripe.Invoice[] }>;
  };
  webhooks: {
    constructEvent: (
      payload: string | Buffer,
      header: string,
      secret: string,
    ) => Stripe.Event;
  };
};

const NOT_CONFIGURED = "Billing is not configured";

export function createStripe(secretKey: string): Stripe {
  return new Stripe(secretKey);
}

export function getStripe(
  secretKey = process.env.STRIPE_SECRET_KEY,
): Stripe | null {
  if (secretKey === undefined || secretKey.length === 0) {
    return null;
  }

  return createStripe(secretKey);
}

export function requireStripe(
  stripe: StripeClient | Stripe | null | undefined = getStripe(),
): StripeClient {
  if (stripe === null) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: NOT_CONFIGURED,
    });
  }

  return stripe;
}

export function billingNotConfigured(): TRPCError {
  return new TRPCError({
    code: "PRECONDITION_FAILED",
    message: NOT_CONFIGURED,
  });
}

export function isPaidPlanId(value: OrganizationPlanId): value is PaidPlanId {
  return isPaidPlan(value);
}

export function priceSearchQuery(
  planId: PaidPlanId,
  cycle: BillingCycle,
): string {
  return `active:'true' AND metadata['orvex_plan']:'${planId}' AND metadata['orvex_cycle']:'${cycle}'`;
}

export async function findPriceId(
  stripe: StripeClient,
  planId: PaidPlanId,
  cycle: BillingCycle,
): Promise<string> {
  const result = await stripe.prices.search({
    query: priceSearchQuery(planId, cycle),
    limit: 1,
  });
  const price = result.data[0];
  if (price === undefined) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No Stripe price for that plan and cycle",
    });
  }

  return price.id;
}

export function checkoutIntegrationIdentifier(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const bytes = randomBytes(8);
  const suffix = Array.from(
    bytes,
    (byte) => alphabet[byte % alphabet.length],
  ).join("");
  return `orvexchk_${suffix}`;
}

export function frontendOrigin(origin = process.env.FRONTEND_ORIGIN): string {
  if (origin === undefined || origin.length === 0) {
    throw billingNotConfigured();
  }

  return origin.replace(/\/$/u, "");
}

export function billingPath(
  origin: string,
  slug: string,
  checkout?: "success" | "cancel",
): string {
  const url = new URL(`/${slug}/billing`, `${origin}/`);
  if (checkout !== undefined) {
    url.searchParams.set("checkout", checkout);
  }
  return url.toString();
}
