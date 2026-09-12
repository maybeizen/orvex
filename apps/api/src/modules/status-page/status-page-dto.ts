import type {
  Database,
  MonitorStatus,
  StatusPage,
  StatusPageComponent,
  StatusPageTheme,
  StatusPageVisibility,
  StatusSubscriber,
} from "@orvex/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type StatusPageRow = Database["public"]["Tables"]["status_pages"]["Row"];
export type ThemeJson = StatusPageRow["theme"];
export type StatusPageComponentRow =
  Database["public"]["Tables"]["status_page_components"]["Row"];
export type StatusSubscriberRow =
  Database["public"]["Tables"]["status_subscribers"]["Row"];
export type MonitorRow = Database["public"]["Tables"]["monitors"]["Row"];
export type IncidentRow = Database["public"]["Tables"]["incidents"]["Row"];
export type IncidentUpdateRow =
  Database["public"]["Tables"]["incident_updates"]["Row"];
export type MaintenanceWindowRow =
  Database["public"]["Tables"]["maintenance_windows"]["Row"];
export type OrganizationRow =
  Database["public"]["Tables"]["organizations"]["Row"];

export type StatusPageClient = Pick<SupabaseClient<Database>, "from">;

export type StoredTheme = {
  accent: string | null;
  logoUrl: string | null;
  domainVerifyToken?: string | undefined;
  unlistedTokenHash?: string | undefined;
};

export type DomainInstructions = {
  record: "TXT";
  host: "_orvex";
  value: string;
};

export type StatusPageWriteResult = {
  page: StatusPage;
  unlistedToken: string | null;
  domain: DomainInstructions | null;
};

export type PublicComponent = {
  id: string;
  monitorId: string;
  displayName: string;
  sort: number;
  status: MonitorStatus;
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
    visibility: StatusPageVisibility;
    theme: StatusPageTheme;
    hideBranding: boolean;
    customDomain: string | null;
  };
  components: PublicComponent[];
  incidents: PublicIncident[];
  maintenance: PublicMaintenance | null;
};

const VISIBILITIES = new Set<StatusPageVisibility>([
  "public",
  "unlisted",
  "private",
]);

const MONITOR_STATUSES = new Set<MonitorStatus>([
  "up",
  "down",
  "degraded",
  "paused",
]);

export function isStatusPageVisibility(
  value: string,
): value is StatusPageVisibility {
  return VISIBILITIES.has(value as StatusPageVisibility);
}

export function isMonitorStatus(value: string): value is MonitorStatus {
  return MONITOR_STATUSES.has(value as MonitorStatus);
}

export function asThemeRecord(
  value: ThemeJson,
): Record<string, ThemeJson | undefined> {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }
  return {};
}

export function readThemeString(
  record: Record<string, ThemeJson | undefined>,
  key: string,
): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function toPublicTheme(theme: ThemeJson): StatusPageTheme {
  const record = asThemeRecord(theme);
  return {
    accent:
      typeof record.accent === "string" && record.accent.length > 0
        ? record.accent
        : null,
    logoUrl:
      typeof record.logoUrl === "string" && record.logoUrl.length > 0
        ? record.logoUrl
        : null,
  };
}

export function parseStoredTheme(theme: ThemeJson): StoredTheme {
  const record = asThemeRecord(theme);
  const publicTheme = toPublicTheme(theme);
  return {
    accent: publicTheme.accent,
    logoUrl: publicTheme.logoUrl,
    domainVerifyToken: readThemeString(record, "domainVerifyToken"),
    unlistedTokenHash: readThemeString(record, "unlistedTokenHash"),
  };
}

export function serializeTheme(theme: StoredTheme): ThemeJson {
  const record: Record<string, ThemeJson | undefined> = {
    accent: theme.accent,
    logoUrl: theme.logoUrl,
  };
  if (theme.domainVerifyToken !== undefined) {
    record.domainVerifyToken = theme.domainVerifyToken;
  }
  if (theme.unlistedTokenHash !== undefined) {
    record.unlistedTokenHash = theme.unlistedTokenHash;
  }
  return record;
}

export function toStatusPageDto(row: StatusPageRow): StatusPage {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    slug: row.slug,
    visibility: isStatusPageVisibility(row.visibility)
      ? row.visibility
      : "public",
    theme: toPublicTheme(row.theme),
    customDomain: row.custom_domain,
    domainVerifiedAt: row.domain_verified_at,
    hideBranding: row.hide_branding,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toComponentDto(
  row: StatusPageComponentRow,
): StatusPageComponent {
  return {
    id: row.id,
    statusPageId: row.status_page_id,
    monitorId: row.monitor_id,
    displayName: row.display_name,
    sort: row.sort,
  };
}

export function toSubscriberDto(row: StatusSubscriberRow): StatusSubscriber {
  return {
    id: row.id,
    statusPageId: row.status_page_id,
    email: row.email,
    confirmedAt: row.confirmed_at,
    unsubscribedAt: row.unsubscribed_at,
  };
}

export function domainInstructionsFromTheme(
  theme: ThemeJson,
): DomainInstructions | null {
  const token = parseStoredTheme(theme).domainVerifyToken;
  if (token === undefined) {
    return null;
  }
  return { record: "TXT", host: "_orvex", value: token };
}
