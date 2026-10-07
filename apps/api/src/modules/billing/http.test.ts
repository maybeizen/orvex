import { once } from "node:events";
import type { AddressInfo } from "node:net";
import express from "express";
import type Stripe from "stripe";
import { afterEach, expect, test, vi } from "vitest";
import { errorHandler } from "../../middleware/error.js";
import type { DataClient } from "../../trpc/context.js";
import { createStripeWebhookRouter } from "./http.js";
import { applyStripeEvent } from "./service.js";
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
  supabase: DataClient = memory.supabase,
): Promise<string> {
  const app = express();
  app.use(
    createStripeWebhookRouter({
      supabase,
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
        payment_status: "paid",
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

test("checkout.session.completed is retryable when the organization is missing", async () => {
  const memory = createBillingMemory({ organizations: [], members: [] });
  const event = {
    id: "evt_missing_org",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_missing",
        object: "checkout.session",
        amount_total: 1200,
        customer: "cus_missing",
        subscription: "sub_missing",
        client_reference_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        metadata: {
          organization_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
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
  const body = (await response.json()) as {
    error?: string;
    received?: boolean;
  };
  expect(response.status).toBe(500);
  expect(body.received).toBeUndefined();
  expect(JSON.stringify(body)).not.toContain("secret_table");
  expect(memory.orders).toHaveLength(0);
});

test("subscription webhook retries do not insert duplicate billing orders", async () => {
  const org = organizationRow({
    plan_id: "probe",
    billing_status: "active",
    stripe_customer_id: "cus_live",
    stripe_subscription_id: "sub_live",
  });
  const memory = createBillingMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const event = {
    id: "evt_sub_updated",
    type: "customer.subscription.updated",
    data: {
      object: {
        id: "sub_live",
        object: "subscription",
        customer: "cus_live",
        status: "active",
        metadata: {
          organization_id: org.id,
          orvex_plan: "probe",
          orvex_cycle: "monthly",
        },
        items: {
          data: [
            {
              price: {
                unit_amount: 1200,
                metadata: {},
              },
            },
          ],
        },
      },
    },
  } as unknown as Stripe.Event;

  await applyStripeEvent(memory.supabase, event);
  await applyStripeEvent(memory.supabase, event);

  expect(memory.orders).toHaveLength(1);
  expect(memory.orders[0]?.stripe_event_id).toBe("evt_sub_updated");
});

test("unpaid checkout does not activate the organization", async () => {
  const org = organizationRow({
    plan_id: "free",
    billing_status: "pending_checkout",
  });
  const memory = createBillingMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const unpaid = {
    id: "evt_checkout_unpaid",
    created: 1_700_000_100,
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_unpaid",
        object: "checkout.session",
        payment_status: "unpaid",
        amount_total: 1200,
        customer: "cus_unpaid",
        subscription: {
          id: "sub_unpaid",
          status: "incomplete",
        },
        client_reference_id: org.id,
        metadata: {
          organization_id: org.id,
          orvex_plan: "probe",
          orvex_cycle: "monthly",
        },
      },
    },
  } as unknown as Stripe.Event;
  const paidButIncomplete = {
    id: "evt_checkout_incomplete",
    created: 1_700_000_110,
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_incomplete",
        object: "checkout.session",
        payment_status: "paid",
        amount_total: 1200,
        customer: "cus_unpaid",
        subscription: {
          id: "sub_unpaid",
          status: "incomplete",
        },
        client_reference_id: org.id,
        metadata: {
          organization_id: org.id,
          orvex_plan: "probe",
          orvex_cycle: "monthly",
        },
      },
    },
  } as unknown as Stripe.Event;

  await applyStripeEvent(memory.supabase, unpaid);
  await applyStripeEvent(memory.supabase, paidButIncomplete);

  expect(memory.organizations[0]).toEqual(
    expect.objectContaining({
      plan_id: "free",
      billing_cycle: null,
      billing_status: "pending_checkout",
      stripe_customer_id: "cus_unpaid",
      stripe_subscription_id: "sub_unpaid",
    }),
  );
  expect(memory.orders).toHaveLength(0);
});

test("a paid checkout still activates the organization", async () => {
  const org = organizationRow({
    plan_id: "free",
    billing_status: "pending_checkout",
  });
  const memory = createBillingMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const event = {
    id: "evt_checkout_paid",
    created: 1_700_000_120,
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_paid",
        object: "checkout.session",
        payment_status: "paid",
        amount_total: 1200,
        customer: "cus_paid",
        subscription: {
          id: "sub_paid",
          status: "active",
        },
        client_reference_id: org.id,
        metadata: {
          organization_id: org.id,
          orvex_plan: "probe",
          orvex_cycle: "monthly",
        },
      },
    },
  } as unknown as Stripe.Event;

  await applyStripeEvent(memory.supabase, event);
  await applyStripeEvent(memory.supabase, event);

  expect(memory.orders).toHaveLength(1);
  expect(memory.organizations[0]).toEqual(
    expect.objectContaining({
      stripe_customer_id: "cus_paid",
      stripe_subscription_id: "sub_paid",
      plan_id: "probe",
      billing_cycle: "monthly",
      billing_status: "active",
    }),
  );
});

test("a deleted subscription stays canceled when an older update is applied afterward", async () => {
  const org = organizationRow({
    plan_id: "probe",
    billing_status: "active",
    billing_cycle: "monthly",
    stripe_customer_id: "cus_live",
    stripe_subscription_id: "sub_live",
  });
  const memory = createBillingMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const subscription = {
    id: "sub_live",
    object: "subscription",
    customer: "cus_live",
    metadata: {
      organization_id: org.id,
      orvex_plan: "probe",
      orvex_cycle: "monthly",
    },
    items: {
      data: [
        {
          price: {
            unit_amount: 1200,
            metadata: {},
          },
        },
      ],
    },
  };
  const deleted = {
    id: "evt_sub_deleted",
    created: 1_700_000_200,
    type: "customer.subscription.deleted",
    data: {
      object: {
        ...subscription,
        status: "canceled",
      },
    },
  } as unknown as Stripe.Event;
  const olderUpdate = {
    id: "evt_sub_older",
    created: 1_700_000_100,
    type: "customer.subscription.updated",
    data: {
      object: {
        ...subscription,
        status: "active",
      },
    },
  } as unknown as Stripe.Event;

  await applyStripeEvent(memory.supabase, deleted);
  await applyStripeEvent(memory.supabase, olderUpdate);

  expect(memory.organizations[0]).toEqual(
    expect.objectContaining({
      plan_id: "free",
      billing_cycle: null,
      billing_status: "canceled",
      stripe_subscription_id: "sub_live",
    }),
  );
  expect(memory.orders.map((order) => order.stripe_event_id)).toEqual([
    "evt_sub_deleted",
  ]);
});

function liveSubscriptionEvent(
  orgId: string,
  input: {
    id: string;
    created: number;
    type: "customer.subscription.updated" | "customer.subscription.deleted";
    status: string;
  },
): Stripe.Event {
  return {
    id: input.id,
    created: input.created,
    type: input.type,
    data: {
      object: {
        id: "sub_live",
        object: "subscription",
        customer: "cus_live",
        status: input.status,
        metadata: {
          organization_id: orgId,
          orvex_plan: "probe",
          orvex_cycle: "monthly",
        },
        items: {
          data: [
            {
              price: {
                unit_amount: 1200,
                metadata: {},
              },
            },
          ],
        },
      },
    },
  } as unknown as Stripe.Event;
}

test("an update at the deletion watermark does not restore the plan", async () => {
  const org = organizationRow({
    plan_id: "probe",
    billing_status: "active",
    billing_cycle: "monthly",
    stripe_customer_id: "cus_live",
    stripe_subscription_id: "sub_live",
  });
  const memory = createBillingMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const created = 1_700_000_200;

  await applyStripeEvent(
    memory.supabase,
    liveSubscriptionEvent(org.id, {
      id: "evt_sub_deleted_same",
      created,
      type: "customer.subscription.deleted",
      status: "canceled",
    }),
  );
  await applyStripeEvent(
    memory.supabase,
    liveSubscriptionEvent(org.id, {
      id: "evt_sub_updated_same",
      created,
      type: "customer.subscription.updated",
      status: "active",
    }),
  );

  expect(memory.organizations[0]).toEqual(
    expect.objectContaining({
      plan_id: "free",
      billing_cycle: null,
      billing_status: "canceled",
      stripe_billing_event_at: new Date(created * 1000).toISOString(),
    }),
  );
  expect(memory.orders.map((order) => order.stripe_event_id)).toEqual([
    "evt_sub_deleted_same",
  ]);
});

test("a deletion at the same timestamp still cancels after an update", async () => {
  const org = organizationRow({
    plan_id: "probe",
    billing_status: "active",
    billing_cycle: "monthly",
    stripe_customer_id: "cus_live",
    stripe_subscription_id: "sub_live",
  });
  const memory = createBillingMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const created = 1_700_000_200;

  await applyStripeEvent(
    memory.supabase,
    liveSubscriptionEvent(org.id, {
      id: "evt_sub_updated_same",
      created,
      type: "customer.subscription.updated",
      status: "active",
    }),
  );
  await applyStripeEvent(
    memory.supabase,
    liveSubscriptionEvent(org.id, {
      id: "evt_sub_deleted_same",
      created,
      type: "customer.subscription.deleted",
      status: "canceled",
    }),
  );

  expect(memory.organizations[0]).toEqual(
    expect.objectContaining({
      plan_id: "free",
      billing_cycle: null,
      billing_status: "canceled",
      stripe_billing_event_at: new Date(created * 1000).toISOString(),
    }),
  );
  expect(memory.orders.map((order) => order.stripe_event_id)).toEqual([
    "evt_sub_updated_same",
    "evt_sub_deleted_same",
  ]);
});

test("subscription updates follow the Stripe subscription status", async () => {
  const org = organizationRow({
    plan_id: "probe",
    billing_status: "active",
    billing_cycle: "monthly",
    stripe_customer_id: "cus_live",
    stripe_subscription_id: "sub_live",
  });
  const memory = createBillingMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const event = {
    id: "evt_sub_past_due",
    created: 1_700_000_300,
    type: "customer.subscription.updated",
    data: {
      object: {
        id: "sub_live",
        object: "subscription",
        customer: "cus_live",
        status: "past_due",
        metadata: {
          organization_id: org.id,
          orvex_plan: "probe",
          orvex_cycle: "monthly",
        },
        items: {
          data: [
            {
              price: {
                unit_amount: 1200,
                metadata: {},
              },
            },
          ],
        },
      },
    },
  } as unknown as Stripe.Event;

  await applyStripeEvent(memory.supabase, event);

  expect(memory.organizations[0]?.billing_status).toBe("past_due");
  expect(memory.organizations[0]?.plan_id).toBe("probe");
});

type WriteResult = {
  data: { id: string } | null;
  error: { message: string } | null;
};

type OrganizationWrite = {
  update: (body: Record<string, unknown>) => unknown;
  maybeSingle: () => Promise<WriteResult>;
};

function readOrganizationWrite(query: object): OrganizationWrite | null {
  const record = query as { update?: unknown; maybeSingle?: unknown };
  if (
    typeof record.update !== "function" ||
    typeof record.maybeSingle !== "function"
  ) {
    return null;
  }
  return query as unknown as OrganizationWrite;
}

function armOrganizationWrite(
  writer: OrganizationWrite,
  intercept: (
    body: Record<string, unknown>,
    commit: () => Promise<WriteResult>,
  ) => Promise<WriteResult>,
): void {
  const commit = writer.maybeSingle.bind(writer);
  const originalUpdate = writer.update.bind(writer);
  let pending: Record<string, unknown> | null = null;
  writer.update = (body) => {
    pending = body;
    return originalUpdate(body);
  };
  writer.maybeSingle = () => {
    const body = pending;
    pending = null;
    if (body === null) {
      return commit();
    }
    return intercept(body, commit);
  };
}

function withOrganizationWrites(
  supabase: DataClient,
  intercept: (
    body: Record<string, unknown>,
    commit: () => Promise<WriteResult>,
  ) => Promise<WriteResult>,
): DataClient {
  const source = supabase as unknown as {
    from: (table: string) => object;
  };
  return {
    storage: supabase.storage,
    from(table: string) {
      const query = source.from(table);
      if (table === "organizations") {
        const writer = readOrganizationWrite(query);
        if (writer !== null) {
          armOrganizationWrite(writer, intercept);
        }
      }
      return query;
    },
  } as unknown as DataClient;
}

function createDeferred(): {
  promise: Promise<void>;
  resolve: () => void;
} {
  const box: { resolve?: () => void } = {};
  const promise = new Promise<void>((resolve) => {
    box.resolve = resolve;
  });
  return {
    promise,
    resolve: () => {
      box.resolve?.();
    },
  };
}

function holdMatchingWrite(
  supabase: DataClient,
  matches: (body: Record<string, unknown>) => boolean,
): { client: DataClient; ready: Promise<void>; release: () => void } {
  const ready = createDeferred();
  const gate = createDeferred();
  let held = false;
  const client = withOrganizationWrites(supabase, (body, commit) => {
    if (held || !matches(body)) {
      return commit();
    }
    held = true;
    ready.resolve();
    return gate.promise.then(() => commit());
  });
  return { client, ready: ready.promise, release: gate.resolve };
}

function isCancellationPatch(body: Record<string, unknown>): boolean {
  return body.plan_id === "free" && body.billing_status === "canceled";
}

function dropCancellationWrites(supabase: DataClient): {
  client: DataClient;
  attempts: () => number;
} {
  let attempts = 0;
  const client = withOrganizationWrites(supabase, (body, commit) => {
    if (!isCancellationPatch(body)) {
      return commit();
    }
    attempts += 1;
    return Promise.resolve({ data: null, error: null });
  });
  return {
    client,
    attempts: () => attempts,
  };
}

function postStripeWebhook(base: string): Promise<Response> {
  return fetch(`${base}/webhooks/stripe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": "t=1,v1=ok",
    },
    body: JSON.stringify({ type: "customer.subscription.updated" }),
  });
}

function liveProbeMemory(): ReturnType<typeof createBillingMemory> {
  return createBillingMemory({
    organizations: [
      organizationRow({
        plan_id: "probe",
        billing_status: "active",
        billing_cycle: "monthly",
        stripe_customer_id: "cus_live",
        stripe_subscription_id: "sub_live",
      }),
    ],
    members: [memberRow()],
  });
}

test("overlapping same-second update and deletion still cancels", async () => {
  const memory = liveProbeMemory();
  const orgId = memory.organizations[0]?.id ?? "";
  const created = 1_700_000_200;
  const deleted = liveSubscriptionEvent(orgId, {
    id: "evt_sub_deleted_overlap",
    created,
    type: "customer.subscription.deleted",
    status: "canceled",
  });
  const updated = liveSubscriptionEvent(orgId, {
    id: "evt_sub_updated_overlap",
    created,
    type: "customer.subscription.updated",
    status: "active",
  });
  const gate = holdMatchingWrite(memory.supabase, isCancellationPatch);
  const stripe = createMockStripe({
    constructEvent: vi.fn(() => deleted),
  });
  const base = await listen(memory, stripe, gate.client);
  const responsePromise = postStripeWebhook(base);
  await gate.ready;
  await applyStripeEvent(gate.client, updated);
  gate.release();
  const response = await responsePromise;

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ received: true });
  expect(memory.organizations[0]).toEqual(
    expect.objectContaining({
      plan_id: "free",
      billing_cycle: null,
      billing_status: "canceled",
      stripe_billing_event_at: new Date(created * 1000).toISOString(),
    }),
  );
  expect(memory.orders.map((order) => order.stripe_event_id)).toEqual([
    "evt_sub_updated_overlap",
    "evt_sub_deleted_overlap",
  ]);
});

test("an older update that loses the watermark compare does not restore the plan", async () => {
  const memory = liveProbeMemory();
  const orgId = memory.organizations[0]?.id ?? "";
  const deletedAt = 1_700_000_200;
  const older = liveSubscriptionEvent(orgId, {
    id: "evt_sub_updated_older_race",
    created: 1_700_000_100,
    type: "customer.subscription.updated",
    status: "active",
  });
  const deleted = liveSubscriptionEvent(orgId, {
    id: "evt_sub_deleted_newer_race",
    created: deletedAt,
    type: "customer.subscription.deleted",
    status: "canceled",
  });
  const gate = holdMatchingWrite(
    memory.supabase,
    (body) => body.billing_status === "active",
  );
  const stripe = createMockStripe({
    constructEvent: vi.fn(() => older),
  });
  const base = await listen(memory, stripe, gate.client);
  const responsePromise = postStripeWebhook(base);
  await gate.ready;
  await applyStripeEvent(gate.client, deleted);
  gate.release();
  const response = await responsePromise;

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ received: true });
  expect(memory.organizations[0]).toEqual(
    expect.objectContaining({
      plan_id: "free",
      billing_cycle: null,
      billing_status: "canceled",
      stripe_billing_event_at: new Date(deletedAt * 1000).toISOString(),
    }),
  );
  expect(memory.orders.map((order) => order.stripe_event_id)).toEqual([
    "evt_sub_deleted_newer_race",
  ]);
});

test("an older deletion that loses the watermark compare is ignored", async () => {
  const memory = liveProbeMemory();
  const orgId = memory.organizations[0]?.id ?? "";
  const updatedAt = 1_700_000_200;
  const deleted = liveSubscriptionEvent(orgId, {
    id: "evt_sub_deleted_older_race",
    created: 1_700_000_100,
    type: "customer.subscription.deleted",
    status: "canceled",
  });
  const updated = liveSubscriptionEvent(orgId, {
    id: "evt_sub_updated_newer_race",
    created: updatedAt,
    type: "customer.subscription.updated",
    status: "active",
  });
  const gate = holdMatchingWrite(memory.supabase, isCancellationPatch);
  const stripe = createMockStripe({
    constructEvent: vi.fn(() => deleted),
  });
  const base = await listen(memory, stripe, gate.client);
  const responsePromise = postStripeWebhook(base);
  await gate.ready;
  await applyStripeEvent(gate.client, updated);
  gate.release();
  const response = await responsePromise;

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ received: true });
  expect(memory.organizations[0]).toEqual(
    expect.objectContaining({
      plan_id: "probe",
      billing_cycle: "monthly",
      billing_status: "active",
      stripe_billing_event_at: new Date(updatedAt * 1000).toISOString(),
    }),
  );
  expect(memory.orders.map((order) => order.stripe_event_id)).toEqual([
    "evt_sub_updated_newer_race",
  ]);
});

test("webhook returns 5xx when a cancellation keeps losing the watermark", async () => {
  const memory = liveProbeMemory();
  const orgId = memory.organizations[0]?.id ?? "";
  const deleted = liveSubscriptionEvent(orgId, {
    id: "evt_sub_deleted_contended",
    created: 1_700_000_200,
    type: "customer.subscription.deleted",
    status: "canceled",
  });
  const dropped = dropCancellationWrites(memory.supabase);
  const stripe = createMockStripe({
    constructEvent: vi.fn(() => deleted),
  });
  const base = await listen(memory, stripe, dropped.client);
  const response = await postStripeWebhook(base);
  const body = (await response.json()) as { received?: boolean };

  expect(response.status).toBe(500);
  expect(body.received).toBeUndefined();
  expect(memory.organizations[0]).toEqual(
    expect.objectContaining({
      plan_id: "probe",
      billing_status: "active",
    }),
  );
  expect(memory.orders).toHaveLength(0);
  expect(dropped.attempts()).toBe(3);
});
