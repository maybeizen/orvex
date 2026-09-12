import { once } from "node:events";
import type { AddressInfo } from "node:net";
import express from "express";
import type Stripe from "stripe";
import { afterEach, expect, test, vi } from "vitest";
import { errorHandler } from "../../middleware/error.js";
import { createStripeWebhookRouter } from "./http.js";
import {
  createBillingMemory,
  createMockStripe,
  memberRow,
  organizationRow,
} from "./test-support.js";

const servers: { close: () => void }[] = [];

afterEach(() => {
  while (servers.length > 0) {
    servers.pop()?.close();
  }
});

async function listen(
  memory: ReturnType<typeof createBillingMemory>,
  stripe: ReturnType<typeof createMockStripe>,
): Promise<string> {
  const app = express();
  app.use(
    createStripeWebhookRouter({
      supabase: memory.supabase,
      stripe,
      webhookSecret: "whsec_test",
    }),
  );
  app.use(errorHandler);
  const server = app.listen(0);
  servers.push(server);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${String(address.port)}`;
}

test("webhook verifies a raw body when express.json is mounted after the route", async () => {
  const org = organizationRow();
  const memory = createBillingMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const event = {
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_raw",
        object: "checkout.session",
        amount_total: 1200,
        customer: "cus_live",
        subscription: "sub_live",
        client_reference_id: org.id,
        metadata: {
          organization_id: org.id,
          orvex_plan: "probe",
          orvex_cycle: "monthly",
        },
      },
    },
  } as unknown as Stripe.Event;
  const constructEvent = vi.fn(() => event);
  const stripe = createMockStripe({ constructEvent });
  const app = express();
  app.use(
    createStripeWebhookRouter({
      supabase: memory.supabase,
      stripe,
      webhookSecret: "whsec_test",
    }),
  );
  app.use(express.json());
  app.use(errorHandler);
  const server = app.listen(0);
  servers.push(server);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  const response = await fetch(
    `http://127.0.0.1:${String(address.port)}/webhooks/stripe`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Stripe-Signature": "t=1,v1=ok",
      },
      body: JSON.stringify({ type: "checkout.session.completed" }),
    },
  );

  expect(response.status).toBe(200);
  const firstCall = constructEvent.mock.calls as unknown as unknown[][];
  expect(Buffer.isBuffer(firstCall[0]?.[0])).toBe(true);
});

test("webhook rejects a parsed JSON body instead of a raw Buffer", async () => {
  const memory = createBillingMemory({
    organizations: [organizationRow()],
    members: [memberRow()],
  });
  const constructEvent = vi.fn();
  const stripe = createMockStripe({ constructEvent });
  const app = express();
  app.use(express.json());
  app.use(
    createStripeWebhookRouter({
      supabase: memory.supabase,
      stripe,
      webhookSecret: "whsec_test",
    }),
  );
  app.use(errorHandler);
  const server = app.listen(0);
  servers.push(server);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  const response = await fetch(
    `http://127.0.0.1:${String(address.port)}/webhooks/stripe`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Stripe-Signature": "t=1,v1=ok",
      },
      body: JSON.stringify({ type: "checkout.session.completed" }),
    },
  );

  expect(response.status).toBe(400);
  expect(constructEvent).not.toHaveBeenCalled();
});

test("webhook rejects a bad Stripe signature", async () => {
  const memory = createBillingMemory({
    organizations: [organizationRow()],
    members: [memberRow()],
  });
  const stripe = createMockStripe({
    constructEvent: vi.fn(() => {
      const error = new Error(
        "No signatures found matching the expected signature for payload",
      );
      error.name = "StripeSignatureVerificationError";
      throw error;
    }),
  });
  const base = await listen(memory, stripe);

  const response = await fetch(`${base}/webhooks/stripe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": "t=1,v1=fake",
    },
    body: JSON.stringify({ type: "checkout.session.completed" }),
  });

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Invalid Stripe signature",
  });
  expect(memory.orders).toHaveLength(0);
});

test("checkout.session.completed inserts a billing order and activates the org", async () => {
  const org = organizationRow({
    plan_id: "probe",
    billing_status: "pending_checkout",
  });
  const memory = createBillingMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const event = {
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_completed",
        object: "checkout.session",
        amount_total: 1200,
        customer: "cus_live",
        subscription: "sub_live",
        client_reference_id: org.id,
        metadata: {
          organization_id: org.id,
          orvex_plan: "probe",
          orvex_cycle: "monthly",
        },
      },
    },
  } as unknown as Stripe.Event;
  const stripe = createMockStripe({
    constructEvent: vi.fn(() => event),
  });
  const base = await listen(memory, stripe);

  const response = await fetch(`${base}/webhooks/stripe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": "t=1,v1=ok",
    },
    body: JSON.stringify({ type: "checkout.session.completed" }),
  });

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ received: true });
  expect(memory.orders).toEqual([
    expect.objectContaining({
      organization_id: org.id,
      stripe_checkout_session_id: "cs_test_completed",
      kind: "checkout",
      amount_cents: 1200,
      status: "complete",
    }),
  ]);
  expect(memory.organizations[0]).toEqual(
    expect.objectContaining({
      stripe_customer_id: "cus_live",
      stripe_subscription_id: "sub_live",
      plan_id: "probe",
      billing_cycle: "monthly",
      billing_status: "active",
    }),
  );
});
