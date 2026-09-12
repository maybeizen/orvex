import type { CheckStatus } from "@/lib/console";
import { formatCheckTime } from "@/lib/console";
import { ORG_SLUG_PATTERN, slugFromName } from "@/lib/organization-slug";

export const PAGE_SLUG_PATTERN = ORG_SLUG_PATTERN;

export const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "unlisted", label: "Unlisted" },
  { value: "private", label: "Private" },
] as const;

export type DomainInstructions = {
  record: "TXT";
  host: string;
  value: string;
};

export type PublicComponent = {
  id: string;
  monitorId: string;
  displayName: string;
  sort: number;
  status: CheckStatus;
};

export type PublicIncidentUpdate = {
  id: string;
  body: string;
  createdAt: string;
};

export type PublicIncident = {
  id: string;
  summary: string;
  severity: string;
  status: string;
  startedAt: string;
  updates: PublicIncidentUpdate[];
};

export type PublicMaintenance = {
  id: string;
  title: string;
  body: string;
  startsAt: string;
  endsAt: string;
};

export type StatusPagePublicPayload = {
  page: {
    id: string;
    name: string;
    slug: string;
    visibility: "public" | "unlisted" | "private";
    theme: { accent: string | null; logoUrl: string | null };
    hideBranding: boolean;
    customDomain: string | null;
  };
  components: PublicComponent[];
  incidents: PublicIncident[];
  maintenance: PublicMaintenance | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function isPageSlug(value: string): boolean {
  return PAGE_SLUG_PATTERN.test(value);
}

export function pageSlugFromName(name: string): string {
  return slugFromName(name);
}

export function pageSlugHint(slug: string): string | null {
  if (slug.length === 0) {
    return "Lowercase letters, numbers, and hyphens.";
  }
  if (slug.length < 3) {
    return "Use at least 3 characters.";
  }
  if (!PAGE_SLUG_PATTERN.test(slug)) {
    return "Start and end with a letter or number. Hyphens in between.";
  }
  return null;
}

export function faultMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.length > 0
    ? error.message
    : fallback;
}

export function isNotFound(error: unknown): boolean {
  if (error instanceof Error && /not found/i.test(error.message)) {
    return true;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null &&
    "code" in error.data
  ) {
    return error.data.code === "NOT_FOUND";
  }
  return false;
}

export function visibilityLabel(value: string): string {
  if (value === "unlisted") {
    return "Unlisted";
  }
  if (value === "private") {
    return "Private";
  }
  return "Public";
}

export function publicStatusPath(
  pageSlug: string,
  options: { organizationSlug?: string; token?: string } = {},
): string {
  const params = new URLSearchParams();
  if (options.organizationSlug !== undefined) {
    params.set("org", options.organizationSlug);
  }
  if (options.token !== undefined && options.token.length > 0) {
    params.set("token", options.token);
  }
  const query = params.toString();
  return query.length === 0 ? `/s/${pageSlug}` : `/s/${pageSlug}?${query}`;
}

export function overallStatus(
  components: readonly PublicComponent[],
): CheckStatus {
  if (components.length === 0) {
    return "paused";
  }
  if (components.some((component) => component.status === "down")) {
    return "down";
  }
  if (components.some((component) => component.status === "degraded")) {
    return "degraded";
  }
  if (components.every((component) => component.status === "paused")) {
    return "paused";
  }
  return "up";
}

export function overallStatusCopy(status: CheckStatus): string {
  if (status === "down") {
    return "Service disruption";
  }
  if (status === "degraded") {
    return "Degraded performance";
  }
  if (status === "paused") {
    return "Awaiting checks";
  }
  return "All systems operational";
}

export function formatWhen(iso: string): string {
  return formatCheckTime(iso);
}

export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
