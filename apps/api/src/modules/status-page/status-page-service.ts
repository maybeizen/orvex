import { randomBytes } from "node:crypto";
import type {
  MonitorStatus,
  StatusPage,
  StatusPageComponent,
  StatusPageVisibility,
  StatusSubscriber,
} from "@orvex/types";
import { isPlanId, getPlan } from "@orvex/types/plans";
import { TRPCError } from "@trpc/server";
import type { CacheClient } from "@orvex/cache";
import { CACHE_TTL, cacheKeys, hashCacheToken } from "../../lib/cache-keys.js";
import { invalidateOrgCaches } from "../../lib/cached.js";
import {
  createStatusPageMailer,
  sendSubscribeConfirmation,
  type StatusPageMailer,
} from "./mail.js";
import {
  domainInstructionsFromTheme,
  isMonitorStatus,
  isStatusPageVisibility,
  parseStoredTheme,
  serializeTheme,
  toComponentDto,
  toStatusPageDto,
  toSubscriberDto,
  type DomainInstructions,
  type IncidentRow,
  type OrganizationRow,
  type StatusPageClient,
  type StatusPagePublicPayload,
  type StatusPageRow,
  type StatusPageWriteResult,
} from "./status-page-dto.js";

export type StatusPageServiceOptions = {
  mailer?: StatusPageMailer | null;
  now?: () => Date;
};

type PageEntitlements = {
  statusPages: number;
  customDomain: boolean;
  whiteLabel: boolean;
};

function throwDb(error: { message: string }): never {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: error.message,
  });
}

function notFound(message = "Status page not found"): never {
  throw new TRPCError({ code: "NOT_FOUND", message });
}

function forbidden(message: string): never {
  throw new TRPCError({ code: "FORBIDDEN", message });
}

function badRequest(message: string): never {
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

function conflict(message: string): never {
  throw new TRPCError({ code: "CONFLICT", message });
}

function isUniqueViolation(error: { code?: string; message: string }): boolean {
  return (
    error.code === "23505" ||
    error.message.includes("duplicate key") ||
    error.message.includes("unique constraint")
  );
}

export function entitlementsForOrganization(
  organization: OrganizationRow,
): PageEntitlements {
  const planId = isPlanId(organization.plan_id) ? organization.plan_id : "free";
  return getPlan(planId).entitlements;
}

function issueToken(): string {
  return randomBytes(32).toString("base64url");
}

function issueDomainToken(): string {
  return randomBytes(16).toString("hex");
}

function pickSecret(
  incoming: string | null | undefined,
  current: string | undefined,
): string | undefined {
  if (incoming === null) {
    return undefined;
  }
  if (incoming !== undefined) {
    return incoming;
  }
  return current;
}

function mergeTheme(
  existing: StatusPageRow["theme"],
  patch: {
    accent?: string | null | undefined;
    logoUrl?: string | null | undefined;
  },
  secrets: {
    domainVerifyToken?: string | null | undefined;
    unlistedTokenHash?: string | null | undefined;
  },
): StatusPageRow["theme"] {
  const current = parseStoredTheme(existing);
  return serializeTheme({
    accent: patch.accent !== undefined ? patch.accent : current.accent,
    logoUrl: patch.logoUrl !== undefined ? patch.logoUrl : current.logoUrl,
    domainVerifyToken: pickSecret(
      secrets.domainVerifyToken,
      current.domainVerifyToken,
    ),
    unlistedTokenHash: pickSecret(
      secrets.unlistedTokenHash,
      current.unlistedTokenHash,
    ),
  });
}

export async function invalidateStatusPageCaches(
  cache: CacheClient,
  organizationId: string,
  pageId: string,
  userIds: readonly string[] = [],
): Promise<void> {
  await invalidateOrgCaches(cache, organizationId, userIds);
  await cache.del(cacheKeys.statusPagePublic(pageId));
}

async function requirePage(
  supabase: StatusPageClient,
  organizationId: string,
  pageId: string,
): Promise<StatusPageRow> {
  const { data, error } = await supabase
    .from("status_pages")
    .select("*")
    .eq("id", pageId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error !== null) {
    throwDb(error);
  }
  if (data === null) {
    notFound();
  }
  return data;
}

async function countPages(
  supabase: StatusPageClient,
  organizationId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("status_pages")
    .select("id")
    .eq("organization_id", organizationId);

  if (error !== null) {
    throwDb(error);
  }
  return data.length;
}

async function requireMonitorInOrg(
  supabase: StatusPageClient,
  organizationId: string,
  monitorId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("monitors")
    .select("id, organization_id")
    .eq("id", monitorId)
    .maybeSingle();

  if (error !== null) {
    throwDb(error);
  }
  if (data === null || data.organization_id !== organizationId) {
    notFound("Monitor not found");
  }
}

async function listComponentsForPage(
  supabase: StatusPageClient,
  pageId: string,
): Promise<StatusPageComponent[]> {
  const { data, error } = await supabase
    .from("status_page_components")
    .select("*")
    .eq("status_page_id", pageId)
    .order("sort", { ascending: true });

  if (error !== null) {
    throwDb(error);
  }
  return data.map(toComponentDto);
}

export async function listStatusPages(
  supabase: StatusPageClient,
  organizationId: string,
): Promise<StatusPage[]> {
  const { data, error } = await supabase
    .from("status_pages")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error !== null) {
    throwDb(error);
  }
  return data.map(toStatusPageDto);
}

export async function getStatusPage(
  supabase: StatusPageClient,
  organizationId: string,
  pageId: string,
): Promise<{
  page: StatusPage;
  components: StatusPageComponent[];
  domain: DomainInstructions | null;
}> {
  const row = await requirePage(supabase, organizationId, pageId);
  const components = await listComponentsForPage(supabase, pageId);
  return {
    page: toStatusPageDto(row),
    components,
    domain:
      row.custom_domain !== null && row.domain_verified_at === null
        ? domainInstructionsFromTheme(row.theme)
        : null,
  };
}

export async function createStatusPage(
  supabase: StatusPageClient,
  organization: OrganizationRow,
  input: {
    name: string;
    slug: string;
    visibility: StatusPageVisibility;
    theme?:
      | {
          accent?: string | null | undefined;
          logoUrl?: string | null | undefined;
        }
      | undefined;
    hideBranding?: boolean | undefined;
  },
): Promise<StatusPageWriteResult> {
  const entitlements = entitlementsForOrganization(organization);
  const current = await countPages(supabase, organization.id);
  if (entitlements.statusPages !== -1 && current >= entitlements.statusPages) {
    forbidden("Status page limit reached for this plan");
  }

  const hideBranding = input.hideBranding === true;
  if (hideBranding && !entitlements.whiteLabel) {
    forbidden("White-label requires the Command plan");
  }

  const slug = input.slug.toLowerCase();
  let unlistedToken: string | null = null;
  let unlistedTokenHash: string | undefined;
  if (input.visibility === "unlisted") {
    unlistedToken = issueToken();
    unlistedTokenHash = hashCacheToken(unlistedToken);
  }

  const createdTheme: {
    accent: string | null;
    logoUrl: string | null;
    unlistedTokenHash?: string;
  } = {
    accent: input.theme?.accent ?? null,
    logoUrl: input.theme?.logoUrl ?? null,
  };
  if (unlistedTokenHash !== undefined) {
    createdTheme.unlistedTokenHash = unlistedTokenHash;
  }
  const theme = serializeTheme(createdTheme);

  const { data, error } = await supabase
    .from("status_pages")
    .insert({
      organization_id: organization.id,
      name: input.name,
      slug,
      visibility: input.visibility,
      theme,
      hide_branding: hideBranding,
    })
    .select("*")
    .single();

  if (error !== null) {
    if (isUniqueViolation(error)) {
      conflict("That status page slug is already taken");
    }
    throwDb(error);
  }

  return {
    page: toStatusPageDto(data),
    unlistedToken,
    domain: null,
  };
}

export async function updateStatusPage(
  supabase: StatusPageClient,
  organization: OrganizationRow,
  input: {
    pageId: string;
    name?: string | undefined;
    slug?: string | undefined;
    visibility?: StatusPageVisibility | undefined;
    theme?:
      | {
          accent?: string | null | undefined;
          logoUrl?: string | null | undefined;
        }
      | undefined;
    hideBranding?: boolean | undefined;
  },
): Promise<StatusPageWriteResult> {
  const entitlements = entitlementsForOrganization(organization);
  const existing = await requirePage(supabase, organization.id, input.pageId);

  if (input.hideBranding === true && !entitlements.whiteLabel) {
    forbidden("White-label requires the Command plan");
  }

  const nextVisibility = input.visibility ?? existing.visibility;
  if (!isStatusPageVisibility(nextVisibility)) {
    badRequest("Invalid visibility");
  }

  const stored = parseStoredTheme(existing.theme);
  let unlistedToken: string | null = null;
  let unlistedTokenHash = stored.unlistedTokenHash;

  if (nextVisibility === "unlisted" && stored.unlistedTokenHash === undefined) {
    unlistedToken = issueToken();
    unlistedTokenHash = hashCacheToken(unlistedToken);
  }
  const theme = mergeTheme(
    existing.theme,
    {
      accent: input.theme?.accent,
      logoUrl: input.theme?.logoUrl,
    },
    {
      unlistedTokenHash:
        nextVisibility === "unlisted" ? unlistedTokenHash : null,
    },
  );

  const patch: {
    theme: StatusPageRow["theme"];
    name?: string;
    slug?: string;
    visibility?: string;
    hide_branding?: boolean;
  } = { theme };
  if (input.name !== undefined) {
    patch.name = input.name;
  }
  if (input.slug !== undefined) {
    patch.slug = input.slug.toLowerCase();
  }
  if (input.visibility !== undefined) {
    patch.visibility = input.visibility;
  }
  if (input.hideBranding !== undefined) {
    patch.hide_branding = input.hideBranding;
  }

  const { data, error } = await supabase
    .from("status_pages")
    .update(patch)
    .eq("id", existing.id)
    .eq("organization_id", organization.id)
    .select("*")
    .single();

  if (error !== null) {
    if (isUniqueViolation(error)) {
      conflict("That status page slug is already taken");
    }
    throwDb(error);
  }

  return {
    page: toStatusPageDto(data),
    unlistedToken,
    domain:
      data.custom_domain !== null && data.domain_verified_at === null
        ? domainInstructionsFromTheme(data.theme)
        : null,
  };
}

export async function deleteStatusPage(
  supabase: StatusPageClient,
  organizationId: string,
  pageId: string,
): Promise<{ ok: true }> {
  await requirePage(supabase, organizationId, pageId);
  const { error } = await supabase
    .from("status_pages")
    .delete()
    .eq("id", pageId)
    .eq("organization_id", organizationId);

  if (error !== null) {
    throwDb(error);
  }
  return { ok: true };
}

export async function attachComponent(
  supabase: StatusPageClient,
  organizationId: string,
  input: {
    pageId: string;
    monitorId: string;
    displayName: string;
    sort?: number | undefined;
  },
): Promise<StatusPageComponent> {
  await requirePage(supabase, organizationId, input.pageId);
  await requireMonitorInOrg(supabase, organizationId, input.monitorId);

  const existing = await listComponentsForPage(supabase, input.pageId);
  const sort =
    input.sort ??
    existing.reduce((max, row) => Math.max(max, row.sort), -1) + 1;

  const { data, error } = await supabase
    .from("status_page_components")
    .insert({
      status_page_id: input.pageId,
      monitor_id: input.monitorId,
      display_name: input.displayName,
      sort,
    })
    .select("*")
    .single();

  if (error !== null) {
    if (isUniqueViolation(error)) {
      conflict("That monitor is already attached to this status page");
    }
    throwDb(error);
  }
  return toComponentDto(data);
}

export async function detachComponent(
  supabase: StatusPageClient,
  organizationId: string,
  input: { pageId: string; componentId: string },
): Promise<{ ok: true }> {
  await requirePage(supabase, organizationId, input.pageId);
  const { data, error } = await supabase
    .from("status_page_components")
    .delete()
    .eq("id", input.componentId)
    .eq("status_page_id", input.pageId)
    .select("*");

  if (error !== null) {
    throwDb(error);
  }
  if (data.length === 0) {
    notFound("Component not found");
  }
  return { ok: true };
}

export async function reorderComponents(
  supabase: StatusPageClient,
  organizationId: string,
  input: {
    pageId: string;
    items: { componentId: string; sort: number }[];
  },
): Promise<StatusPageComponent[]> {
  await requirePage(supabase, organizationId, input.pageId);
  const existing = await listComponentsForPage(supabase, input.pageId);
  const allowed = new Set(existing.map((row) => row.id));

  for (const item of input.items) {
    if (!allowed.has(item.componentId)) {
      notFound("Component not found");
    }
  }

  for (const item of input.items) {
    const { error } = await supabase
      .from("status_page_components")
      .update({ sort: item.sort })
      .eq("id", item.componentId)
      .eq("status_page_id", input.pageId);

    if (error !== null) {
      throwDb(error);
    }
  }

  return listComponentsForPage(supabase, input.pageId);
}

export async function setDomain(
  supabase: StatusPageClient,
  organization: OrganizationRow,
  input: { pageId: string; customDomain: string },
): Promise<{ page: StatusPage; domain: DomainInstructions }> {
  const entitlements = entitlementsForOrganization(organization);
  if (!entitlements.customDomain) {
    forbidden("Custom domains require the Command plan");
  }

  const existing = await requirePage(supabase, organization.id, input.pageId);
  const token = issueDomainToken();
  const theme = mergeTheme(existing.theme, {}, { domainVerifyToken: token });
  const customDomain = input.customDomain.trim().toLowerCase();

  const { data, error } = await supabase
    .from("status_pages")
    .update({
      custom_domain: customDomain,
      domain_verified_at: null,
      theme,
    })
    .eq("id", existing.id)
    .eq("organization_id", organization.id)
    .select("*")
    .single();

  if (error !== null) {
    if (isUniqueViolation(error)) {
      conflict("That custom domain is already in use");
    }
    throwDb(error);
  }

  return {
    page: toStatusPageDto(data),
    domain: { record: "TXT", host: "_orvex", value: token },
  };
}

export async function verifyDomain(
  supabase: StatusPageClient,
  organization: OrganizationRow,
  input: { pageId: string; token: string },
): Promise<StatusPage> {
  const entitlements = entitlementsForOrganization(organization);
  if (!entitlements.customDomain) {
    forbidden("Custom domains require the Command plan");
  }

  const existing = await requirePage(supabase, organization.id, input.pageId);
  const stored = parseStoredTheme(existing.theme).domainVerifyToken;
  if (stored === undefined || existing.custom_domain === null) {
    badRequest("No domain verification is pending");
  }

  if (hashCacheToken(input.token) !== hashCacheToken(stored)) {
    badRequest("Domain verification token does not match");
  }

  const { data, error } = await supabase
    .from("status_pages")
    .update({ domain_verified_at: new Date().toISOString() })
    .eq("id", existing.id)
    .eq("organization_id", organization.id)
    .select("*")
    .single();

  if (error !== null) {
    throwDb(error);
  }
  return toStatusPageDto(data);
}

async function findOrganizationBySlug(
  supabase: StatusPageClient,
  slug: string,
): Promise<OrganizationRow | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error !== null) {
    throwDb(error);
  }
  return data;
}

async function findPageBySlug(
  supabase: StatusPageClient,
  pageSlug: string,
  organizationSlug?: string,
): Promise<StatusPageRow | null> {
  const slug = pageSlug.toLowerCase();
  if (organizationSlug !== undefined) {
    const organization = await findOrganizationBySlug(
      supabase,
      organizationSlug,
    );
    if (organization === null) {
      return null;
    }
    const { data, error } = await supabase
      .from("status_pages")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("slug", slug)
      .maybeSingle();
    if (error !== null) {
      throwDb(error);
    }
    return data;
  }

  const { data, error } = await supabase
    .from("status_pages")
    .select("*")
    .eq("slug", slug);

  if (error !== null) {
    throwDb(error);
  }
  return data[0] ?? null;
}

function assertPublicAccess(
  page: StatusPageRow,
  token: string | undefined,
): void {
  const visibility = isStatusPageVisibility(page.visibility)
    ? page.visibility
    : "private";

  if (visibility === "private") {
    notFound();
  }
  if (visibility === "public") {
    return;
  }

  const expected = parseStoredTheme(page.theme).unlistedTokenHash;
  if (
    token === undefined ||
    expected === undefined ||
    hashCacheToken(token) !== expected
  ) {
    notFound();
  }
}

async function buildPublicPayload(
  supabase: StatusPageClient,
  page: StatusPageRow,
  now: Date,
): Promise<StatusPagePublicPayload> {
  const components = await listComponentsForPage(supabase, page.id);
  const monitorIds = components.map((row) => row.monitorId);
  const statuses = new Map<string, MonitorStatus>();

  if (monitorIds.length > 0) {
    const { data, error } = await supabase
      .from("monitors")
      .select("id, status")
      .in("id", monitorIds);
    if (error !== null) {
      throwDb(error);
    }
    for (const row of data) {
      statuses.set(row.id, isMonitorStatus(row.status) ? row.status : "paused");
    }
  }

  const { data: incidentRows, error: incidentError } = await supabase
    .from("incidents")
    .select("*")
    .eq("organization_id", page.organization_id)
    .neq("status", "resolved")
    .order("started_at", { ascending: false });

  if (incidentError !== null) {
    throwDb(incidentError);
  }

  const monitorSet = new Set(monitorIds);
  const open = incidentRows.filter((row: IncidentRow) => {
    return row.monitor_id === null || monitorSet.has(row.monitor_id);
  });

  const incidentIds = open.map((row) => row.id);
  const updatesByIncident = new Map<
    string,
    { id: string; body: string; createdAt: string; visible: boolean }[]
  >();

  if (incidentIds.length > 0) {
    const { data: updateRows, error: updateError } = await supabase
      .from("incident_updates")
      .select("*")
      .in("incident_id", incidentIds)
      .order("created_at", { ascending: true });

    if (updateError !== null) {
      throwDb(updateError);
    }

    for (const row of updateRows) {
      const list = updatesByIncident.get(row.incident_id) ?? [];
      list.push({
        id: row.id,
        body: row.body,
        createdAt: row.created_at,
        visible: row.status_page_visible,
      });
      updatesByIncident.set(row.incident_id, list);
    }
  }

  const incidents = open
    .filter((row) => {
      const updates = updatesByIncident.get(row.id) ?? [];
      if (updates.length === 0) {
        return true;
      }
      return updates.some((update) => update.visible);
    })
    .slice(0, 10)
    .map((row) => ({
      id: row.id,
      summary: row.summary,
      severity: row.severity,
      status: row.status,
      startedAt: row.started_at,
      updates: (updatesByIncident.get(row.id) ?? [])
        .filter((update) => update.visible)
        .map((update) => ({
          id: update.id,
          body: update.body,
          createdAt: update.createdAt,
        })),
    }));

  const { data: windowRows, error: windowError } = await supabase
    .from("maintenance_windows")
    .select("*")
    .eq("organization_id", page.organization_id);

  if (windowError !== null) {
    throwDb(windowError);
  }

  const nowMs = now.getTime();
  const active = windowRows
    .filter((row) => {
      const starts = Date.parse(row.starts_at);
      const ends = Date.parse(row.ends_at);
      if (Number.isNaN(starts) || Number.isNaN(ends)) {
        return false;
      }
      if (starts > nowMs || ends < nowMs) {
        return false;
      }
      if (row.status_page_id === page.id) {
        return true;
      }
      if (row.status_page_id !== null) {
        return false;
      }
      if (row.monitor_ids.length === 0) {
        return true;
      }
      return row.monitor_ids.some((id) => monitorSet.has(id));
    })
    .sort((left, right) => right.starts_at.localeCompare(left.starts_at));

  const banner = active[0];
  const stored = parseStoredTheme(page.theme);

  return {
    page: {
      id: page.id,
      name: page.name,
      slug: page.slug,
      visibility: isStatusPageVisibility(page.visibility)
        ? page.visibility
        : "public",
      theme: { accent: stored.accent, logoUrl: stored.logoUrl },
      hideBranding: page.hide_branding,
      customDomain:
        page.domain_verified_at !== null ? page.custom_domain : null,
    },
    components: components.map((component) => ({
      id: component.id,
      monitorId: component.monitorId,
      displayName: component.displayName,
      sort: component.sort,
      status: statuses.get(component.monitorId) ?? "paused",
    })),
    incidents,
    maintenance:
      banner === undefined
        ? null
        : {
            id: banner.id,
            title: banner.title,
            body: banner.body,
            startsAt: banner.starts_at,
            endsAt: banner.ends_at,
          },
  };
}

export async function publicGetStatusPage(
  supabase: StatusPageClient,
  cache: CacheClient,
  input: {
    pageSlug: string;
    organizationSlug?: string | undefined;
    token?: string | undefined;
  },
  options: StatusPageServiceOptions = {},
): Promise<StatusPagePublicPayload> {
  const page = await findPageBySlug(
    supabase,
    input.pageSlug,
    input.organizationSlug,
  );
  if (page === null) {
    notFound();
  }
  assertPublicAccess(page, input.token);
  const now = options.now ?? (() => new Date());
  return cache.getOrSet(
    cacheKeys.statusPagePublic(page.id),
    CACHE_TTL.statusPagePublic,
    () => buildPublicPayload(supabase, page, now()),
  );
}

async function insertSubscriber(
  supabase: StatusPageClient,
  page: StatusPageRow,
  email: string,
  options: StatusPageServiceOptions,
  organizationSlug?: string,
): Promise<{ subscriber: StatusSubscriber; confirmToken: string }> {
  const confirmToken = issueToken();
  const confirmTokenHash = hashCacheToken(confirmToken);
  const { data, error } = await supabase
    .from("status_subscribers")
    .insert({
      status_page_id: page.id,
      email: email.trim().toLowerCase(),
      confirm_token_hash: confirmTokenHash,
    })
    .select("*")
    .single();

  if (error !== null) {
    if (isUniqueViolation(error)) {
      const { data: existing } = await supabase
        .from("status_subscribers")
        .select("*")
        .eq("status_page_id", page.id)
        .eq("email", email.trim().toLowerCase())
        .is("unsubscribed_at", null)
        .maybeSingle();
      if (existing !== null && existing.confirmed_at !== null) {
        return {
          subscriber: toSubscriberDto(existing),
          confirmToken: "",
        };
      }
      conflict("That email is already subscribed");
    }
    throwDb(error);
  }

  const mailer =
    options.mailer === undefined ? createStatusPageMailer() : options.mailer;

  const mailInput: {
    email: string;
    pageName: string;
    confirmToken: string;
    pageSlug: string;
    organizationSlug?: string;
  } = {
    email: data.email,
    pageName: page.name,
    confirmToken,
    pageSlug: page.slug,
  };
  if (organizationSlug !== undefined) {
    mailInput.organizationSlug = organizationSlug;
  }
  await sendSubscribeConfirmation(mailer, mailInput);

  return { subscriber: toSubscriberDto(data), confirmToken };
}

export async function addSubscriber(
  supabase: StatusPageClient,
  organizationId: string,
  input: { pageId: string; email: string },
  options: StatusPageServiceOptions = {},
): Promise<{ subscriber: StatusSubscriber; confirmToken: string }> {
  const page = await requirePage(supabase, organizationId, input.pageId);
  return insertSubscriber(supabase, page, input.email, options);
}

export async function publicSubscribe(
  supabase: StatusPageClient,
  input: {
    pageSlug: string;
    organizationSlug?: string | undefined;
    token?: string | undefined;
    email: string;
  },
  options: StatusPageServiceOptions = {},
): Promise<{ subscriber: StatusSubscriber; confirmToken: string }> {
  const page = await findPageBySlug(
    supabase,
    input.pageSlug,
    input.organizationSlug,
  );
  if (page === null) {
    notFound();
  }
  assertPublicAccess(page, input.token);
  return insertSubscriber(
    supabase,
    page,
    input.email,
    options,
    input.organizationSlug,
  );
}

export async function confirmSubscriber(
  supabase: StatusPageClient,
  input: { token: string },
): Promise<StatusSubscriber> {
  const tokenHash = hashCacheToken(input.token);
  const { data, error } = await supabase
    .from("status_subscribers")
    .select("*")
    .eq("confirm_token_hash", tokenHash)
    .is("unsubscribed_at", null)
    .maybeSingle();

  if (error !== null) {
    throwDb(error);
  }
  if (data === null) {
    notFound("Subscription not found");
  }

  const { data: updated, error: updateError } = await supabase
    .from("status_subscribers")
    .update({ confirmed_at: new Date().toISOString() })
    .eq("id", data.id)
    .select("*")
    .single();

  if (updateError !== null) {
    throwDb(updateError);
  }
  return toSubscriberDto(updated);
}

export async function unsubscribeSubscriber(
  supabase: StatusPageClient,
  input: { token: string },
): Promise<{ ok: true }> {
  const tokenHash = hashCacheToken(input.token);
  const { data, error } = await supabase
    .from("status_subscribers")
    .select("*")
    .eq("confirm_token_hash", tokenHash)
    .maybeSingle();

  if (error !== null) {
    throwDb(error);
  }
  if (data === null) {
    notFound("Subscription not found");
  }

  const { error: updateError } = await supabase
    .from("status_subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("id", data.id);

  if (updateError !== null) {
    throwDb(updateError);
  }
  return { ok: true };
}

export async function listSubscribers(
  supabase: StatusPageClient,
  organizationId: string,
  pageId: string,
): Promise<StatusSubscriber[]> {
  await requirePage(supabase, organizationId, pageId);
  const { data, error } = await supabase
    .from("status_subscribers")
    .select("*")
    .eq("status_page_id", pageId)
    .is("unsubscribed_at", null)
    .order("created_at", { ascending: true });

  if (error !== null) {
    throwDb(error);
  }
  return data.map(toSubscriberDto);
}
