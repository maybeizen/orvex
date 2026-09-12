import { TRPCError } from "@trpc/server";
import { expect, test } from "vitest";
import type { ContextRequest } from "../../trpc/context.js";
import { withCache } from "../../trpc/test-context.js";
import { createBillingRouter } from "./router.js";
import { priceSearchQuery } from "./stripe.js";
import {
  createBillingMemory,
  createMockStripe,
  memberRow,
  organizationRow,
  orgTestUser,
} from "./test-support.js";

const req: ContextRequest = { headers: {} };
const origin = "http://localhost:5173";

function caller(
  supabase: ReturnType<typeof createBillingMemory>["supabase"],
  stripe: ReturnType<typeof createMockStripe> | null,
) {
  return createBillingRouter({
    stripe,
    frontendOrigin: origin,
  }).createCaller(
    withCache({
      user: orgTestUser,
      req,
      supabase,
    }),
  );
}

test("createCheckoutSession returns a hosted checkout URL", async () => {
  const org = organizationRow({ plan_id: "probe" });
  const memory = createBillingMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const stripe = createMockStripe({
    priceId: "price_looked_up",
    customerId: "cus_test",
    checkoutUrl: "https://checkout.stripe.test/cs_live",
  });

  const result = await caller(memory.supabase, stripe).createCheckoutSession({
    organizationId: org.id,
    planId: "probe",
    cycle: "monthly",
  });

  expect(result).toEqual({ url: "https://checkout.stripe.test/cs_live" });
  expect(stripe.prices.search).toHaveBeenCalledWith({
    query: priceSearchQuery("probe", "monthly"),
    limit: 1,
  });
  expect(stripe.checkoutCreate).toHaveBeenCalledTimes(1);
  const params = stripe.checkoutCreate.mock.calls[0]?.[0] as {
    mode: string;
    customer: string;
    line_items: Array<{ price: string; quantity: number }>;
    success_url: string;
    cancel_url: string;
    integration_identifier: string;
    payment_method_types?: string[];
    subscription_data: { billing_mode: { type: string } };
    metadata: { orvex_plan: string; orvex_cycle: string };
  };
  expect(params.mode).toBe("subscription");
  expect(params.customer).toBe("cus_test");
  expect(params.line_items).toEqual([
    { price: "price_looked_up", quantity: 1 },
  ]);
  expect(params.success_url).toBe(
    "http://localhost:5173/organization/ada-labs/billing?checkout=success",
  );
  expect(params.cancel_url).toBe(
    "http://localhost:5173/organization/ada-labs/billing?checkout=cancel",
  );
  expect(params.subscription_data.billing_mode).toEqual({ type: "flexible" });
  expect(params.metadata).toEqual(
    expect.objectContaining({
      organization_id: org.id,
      orvex_plan: "probe",
      orvex_cycle: "monthly",
    }),
  );
  expect(params.integration_identifier).toMatch(/^orvexchk_[a-z]{8}$/u);
  expect(params.payment_method_types).toBeUndefined();
  expect(memory.organizations[0]?.stripe_customer_id).toBe("cus_test");
});

test("createCheckoutSession throws when Stripe is not configured", async () => {
  const org = organizationRow({ plan_id: "probe" });
  const memory = createBillingMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const error = await caller(memory.supabase, null)
    .createCheckoutSession({
      organizationId: org.id,
      planId: "probe",
      cycle: "monthly",
    })
    .catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("PRECONDITION_FAILED");
  expect((error as TRPCError).message).toBe("Billing is not configured");
});

test("createCheckoutSession rejects the free plan", async () => {
  const org = organizationRow();
  const memory = createBillingMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const stripe = createMockStripe();
  const error = await caller(memory.supabase, stripe)
    .createCheckoutSession({
      organizationId: org.id,
      planId: "free",
      cycle: "monthly",
    })
    .catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("BAD_REQUEST");
  expect(stripe.checkoutCreate).not.toHaveBeenCalled();
});

test("listOrders returns persisted billing_orders", async () => {
  const org = organizationRow();
  const memory = createBillingMemory({
    organizations: [org],
    members: [memberRow()],
    orders: [
      {
        id: "11111111-2222-4333-8444-555555555555",
        organization_id: org.id,
        stripe_checkout_session_id: "cs_abc",
        kind: "checkout",
        amount_cents: 3240,
        status: "complete",
        created_at: "2026-02-01T00:00:00.000Z",
      },
    ],
  });

  const items = await caller(memory.supabase, createMockStripe()).listOrders({
    organizationId: org.id,
  });

  expect(items).toEqual([
    {
      id: "11111111-2222-4333-8444-555555555555",
      organizationId: org.id,
      stripeCheckoutSessionId: "cs_abc",
      kind: "checkout",
      amountCents: 3240,
      status: "complete",
      createdAt: "2026-02-01T00:00:00.000Z",
    },
  ]);
});
