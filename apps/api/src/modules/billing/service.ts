import type { CacheClient } from "@orvex/cache";
import type {
  AuthUser,
  BillingInvoice,
  BillingOrder,
  BillingOrderKind,
  Database,
  OrganizationPlanId,
} from "@orvex/types";
import {
  isPlanId,
  planAllowsKind,
  type BillingCycle,
} from "@orvex/types/plans";
import { TRPCError } from "@trpc/server";
import type Stripe from "stripe";
import { invalidateOrgCaches } from "../../lib/cached.js";
import type { DataClient } from "../../trpc/context.js";
import {
  billingStatusFromSubscription,
  isBillingCycle,
  orderKindForPlanChange,
  readMetadata,
  stripeObjectId,
  toBillingInvoice,
  toBillingOrder,
  type BillingOrderRow,
} from "./dto.js";
import {
  billingPath,
  checkoutIntegrationIdentifier,
  findPriceId,
  frontendOrigin,
  isPaidPlanId,
  requireStripe,
  type StripeClient,
} from "./stripe.js";

type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];

function throwDbError(error: { message: string }): never {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: error.message,
  });
}

async function fetchOrganization(
  supabase: DataClient,
  organizationId: string,
): Promise<OrganizationRow> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .maybeSingle();

  if (error !== null) {
    throwDbError(error);
  }
  if (data === null) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Organization not found",
    });
  }

  return data;
}

async function findOrganizationByRefs(
  supabase: DataClient,
  refs: {
    organizationId?: string | undefined;
    customerId?: string | null | undefined;
    subscriptionId?: string | null | undefined;
  },
): Promise<OrganizationRow | null> {
  if (refs.organizationId !== undefined && refs.organizationId.length > 0) {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", refs.organizationId)
      .maybeSingle();
    if (error !== null) {
      throwDbError(error);
    }
    if (data !== null) {
      return data;
    }
  }

  if (refs.customerId !== undefined && refs.customerId !== null) {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("stripe_customer_id", refs.customerId)
      .maybeSingle();
    if (error !== null) {
      throwDbError(error);
    }
    if (data !== null) {
      return data;
    }
  }

  if (refs.subscriptionId !== undefined && refs.subscriptionId !== null) {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("stripe_subscription_id", refs.subscriptionId)
      .maybeSingle();
    if (error !== null) {
      throwDbError(error);
    }
    if (data !== null) {
      return data;
    }
  }

  return null;
}

async function updateOrganization(
  supabase: DataClient,
  organizationId: string,
  patch: Database["public"]["Tables"]["organizations"]["Update"],
  cache?: CacheClient,
): Promise<void> {
  const { error } = await supabase
    .from("organizations")
    .update(patch)
    .eq("id", organizationId);

  if (error !== null) {
    throwDbError(error);
  }

  if (cache !== undefined) {
    await invalidateOrgCaches(cache, organizationId);
  }
}

async function insertOrder(
  supabase: DataClient,
  input: {
    organizationId: string;
    stripeCheckoutSessionId: string | null;
    kind: BillingOrderKind;
    amountCents: number;
    status: BillingOrderRow["status"];
  },
): Promise<void> {
  const { error } = await supabase.from("billing_orders").insert({
    organization_id: input.organizationId,
    stripe_checkout_session_id: input.stripeCheckoutSessionId,
    kind: input.kind,
    amount_cents: input.amountCents,
    status: input.status,
  });

  if (error === null) {
    return;
  }
  if (error.code === "23505") {
    return;
  }
  throwDbError(error);
}

async function ensureCustomer(
  supabase: DataClient,
  stripe: StripeClient,
  organization: OrganizationRow,
  user: AuthUser,
  cache?: CacheClient,
): Promise<string> {
  if (
    organization.stripe_customer_id !== null &&
    organization.stripe_customer_id.length > 0
  ) {
    return organization.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: organization.name,
    metadata: {
      organization_id: organization.id,
    },
  });

  await updateOrganization(
    supabase,
    organization.id,
    { stripe_customer_id: customer.id },
    cache,
  );
  return customer.id;
}

export async function createCheckoutSession(
  supabase: DataClient,
  user: AuthUser,
  input: {
    organizationId: string;
    planId: OrganizationPlanId;
    cycle: BillingCycle;
  },
  options: {
    stripe?: StripeClient | null | undefined;
    frontendOrigin?: string | undefined;
    cache?: CacheClient | undefined;
  } = {},
): Promise<{ url: string }> {
  const stripe = requireStripe(options.stripe);
  if (!isPaidPlanId(input.planId)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Checkout is only available for paid plans",
    });
  }

  const organization = await fetchOrganization(supabase, input.organizationId);
  const kind = organization.kind === "team" ? "team" : "single";
  if (!planAllowsKind(input.planId, kind)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "That plan is not available for this organization type",
    });
  }

  const origin = frontendOrigin(options.frontendOrigin);
  const customerId = await ensureCustomer(
    supabase,
    stripe,
    organization,
    user,
    options.cache,
  );
  const priceId = await findPriceId(stripe, input.planId, input.cycle);
  const metadata = {
    organization_id: organization.id,
    orvex_plan: input.planId,
    orvex_cycle: input.cycle,
  };
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: organization.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: billingPath(origin, organization.slug, "success"),
    cancel_url: billingPath(origin, organization.slug, "cancel"),
    integration_identifier: checkoutIntegrationIdentifier(),
    metadata,
    subscription_data: {
      billing_mode: { type: "flexible" },
      metadata,
    },
  });

  if (session.url === null || session.url.length === 0) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Stripe did not return a checkout URL",
    });
  }

  return { url: session.url };
}

export async function createPortalSession(
  supabase: DataClient,
  organizationId: string,
  options: {
    stripe?: StripeClient | null | undefined;
    frontendOrigin?: string | undefined;
  } = {},
): Promise<{ url: string }> {
  const stripe = requireStripe(options.stripe);
  const organization = await fetchOrganization(supabase, organizationId);
  if (
    organization.stripe_customer_id === null ||
    organization.stripe_customer_id.length === 0
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No billing customer for this organization",
    });
  }

  const origin = frontendOrigin(options.frontendOrigin);
  const session = await stripe.billingPortal.sessions.create({
    customer: organization.stripe_customer_id,
    return_url: billingPath(origin, organization.slug),
  });
  return { url: session.url };
}

export async function listInvoices(
  supabase: DataClient,
  organizationId: string,
  options: { stripe?: StripeClient | null | undefined } = {},
): Promise<BillingInvoice[]> {
  const stripe = requireStripe(options.stripe);
  const organization = await fetchOrganization(supabase, organizationId);
  if (
    organization.stripe_customer_id === null ||
    organization.stripe_customer_id.length === 0
  ) {
    return [];
  }

  const invoices = await stripe.invoices.list({
    customer: organization.stripe_customer_id,
    limit: 24,
  });
  return invoices.data.map(toBillingInvoice);
}

export async function listOrders(
  supabase: DataClient,
  organizationId: string,
): Promise<BillingOrder[]> {
  const { data, error } = await supabase
    .from("billing_orders")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error !== null) {
    throwDbError(error);
  }

  return data.map(toBillingOrder);
}

function planFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
  fallback?: Stripe.Metadata | null,
): OrganizationPlanId | undefined {
  const value =
    readMetadata(metadata, "orvex_plan") ??
    readMetadata(fallback, "orvex_plan");
  if (value !== undefined && isPlanId(value)) {
    return value;
  }
  return undefined;
}

function cycleFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
  fallback?: Stripe.Metadata | null,
): BillingCycle | undefined {
  const value =
    readMetadata(metadata, "orvex_cycle") ??
    readMetadata(fallback, "orvex_cycle");
  if (value !== undefined && isBillingCycle(value)) {
    return value;
  }
  return undefined;
}

export async function applyCheckoutCompleted(
  supabase: DataClient,
  session: Stripe.Checkout.Session,
  cache?: CacheClient,
): Promise<void> {
  const organizationId =
    readMetadata(session.metadata, "organization_id") ??
    session.client_reference_id ??
    undefined;
  const customerId = stripeObjectId(session.customer);
  const subscriptionId = stripeObjectId(session.subscription);
  const organization = await findOrganizationByRefs(supabase, {
    organizationId,
    customerId,
    subscriptionId,
  });
  if (organization === null) {
    return;
  }

  const planId = planFromMetadata(session.metadata) ?? organization.plan_id;
  const cycle =
    cycleFromMetadata(session.metadata) ?? organization.billing_cycle;

  await updateOrganization(
    supabase,
    organization.id,
    {
      stripe_customer_id: customerId ?? organization.stripe_customer_id,
      stripe_subscription_id:
        subscriptionId ?? organization.stripe_subscription_id,
      plan_id: isPlanId(planId) ? planId : organization.plan_id,
      billing_cycle: cycle,
      billing_status: "active",
    },
    cache,
  );

  await insertOrder(supabase, {
    organizationId: organization.id,
    stripeCheckoutSessionId: session.id,
    kind: "checkout",
    amountCents: session.amount_total ?? 0,
    status: "complete",
  });
}

export async function applySubscriptionEvent(
  supabase: DataClient,
  subscription: Stripe.Subscription,
  kind: "updated" | "deleted",
  cache?: CacheClient,
): Promise<void> {
  const customerId = stripeObjectId(subscription.customer);
  const organizationId = readMetadata(subscription.metadata, "organization_id");
  const organization = await findOrganizationByRefs(supabase, {
    organizationId,
    customerId,
    subscriptionId: subscription.id,
  });
  if (organization === null) {
    return;
  }

  const price = subscription.items.data[0]?.price;
  const priceMetadata =
    price !== undefined && typeof price !== "string" ? price.metadata : null;

  if (kind === "deleted") {
    await updateOrganization(
      supabase,
      organization.id,
      {
        plan_id: "free",
        billing_cycle: null,
        billing_status: "canceled",
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId ?? organization.stripe_customer_id,
      },
      cache,
    );
    await insertOrder(supabase, {
      organizationId: organization.id,
      stripeCheckoutSessionId: null,
      kind: "downgrade",
      amountCents: 0,
      status: "complete",
    });
    return;
  }

  const planId =
    planFromMetadata(subscription.metadata, priceMetadata) ??
    organization.plan_id;
  const cycle =
    cycleFromMetadata(subscription.metadata, priceMetadata) ??
    organization.billing_cycle;
  const nextPlan = isPlanId(planId) ? planId : organization.plan_id;
  const amountCents =
    price !== undefined &&
    typeof price !== "string" &&
    price.unit_amount !== null
      ? price.unit_amount
      : 0;

  await updateOrganization(
    supabase,
    organization.id,
    {
      plan_id: nextPlan,
      billing_cycle: cycle,
      billing_status: billingStatusFromSubscription(subscription.status),
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId ?? organization.stripe_customer_id,
    },
    cache,
  );

  await insertOrder(supabase, {
    organizationId: organization.id,
    stripeCheckoutSessionId: null,
    kind: orderKindForPlanChange(organization.plan_id, nextPlan),
    amountCents,
    status: "complete",
  });
}

export async function applyStripeEvent(
  supabase: DataClient,
  event: Stripe.Event,
  cache?: CacheClient,
): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await applyCheckoutCompleted(supabase, event.data.object, cache);
      return;
    case "customer.subscription.updated":
      await applySubscriptionEvent(
        supabase,
        event.data.object,
        "updated",
        cache,
      );
      return;
    case "customer.subscription.deleted":
      await applySubscriptionEvent(
        supabase,
        event.data.object,
        "deleted",
        cache,
      );
      return;
    default:
  }
}
