import { permissionMaskHas } from "@orvex/access";
import { OrganizationPermission } from "@orvex/types/permissions";
import {
  Activity,
  Contact,
  CreditCard,
  LayoutTemplate,
  LifeBuoy,
  Mail,
  Newspaper,
  Palette,
  ScrollText,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type OrgNavItem = {
  id: string;
  label: string;
  segment: string;
  icon: LucideIcon;
  requiredPermission?: OrganizationPermission;
};

export type OrgNavCategory = {
  id: string;
  label: string;
  items: OrgNavItem[];
};

export const ORG_NAV_CATEGORIES: OrgNavCategory[] = [
  {
    id: "monitoring",
    label: "Monitoring",
    items: [
      {
        id: "monitors",
        label: "Uptime Monitors",
        segment: "monitors",
        icon: Activity,
        requiredPermission: OrganizationPermission.MonitorViewAll,
      },
      {
        id: "status-pages",
        label: "Status Pages",
        segment: "status-pages",
        icon: LayoutTemplate,
        requiredPermission: OrganizationPermission.StatusPageView,
      },
    ],
  },
  {
    id: "alerts",
    label: "Alerts",
    items: [
      {
        id: "contact-lists",
        label: "Contact Lists",
        segment: "contact-lists",
        icon: Contact,
        requiredPermission: OrganizationPermission.AlertChannelView,
      },
    ],
  },
  {
    id: "organization",
    label: "Organization",
    items: [
      {
        id: "team-members",
        label: "Team Members",
        segment: "team-members",
        icon: Users,
        requiredPermission: OrganizationPermission.MemberViewList,
      },
      {
        id: "white-label",
        label: "White Label",
        segment: "white-label",
        icon: Palette,
        requiredPermission: OrganizationPermission.OrgProfileEdit,
      },
      {
        id: "settings",
        label: "Settings",
        segment: "settings",
        icon: Settings,
        requiredPermission: OrganizationPermission.OrgProfileView,
      },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    items: [
      {
        id: "logs",
        label: "Logs",
        segment: "logs",
        icon: ScrollText,
        requiredPermission: OrganizationPermission.OrgAuditLogsView,
      },
      {
        id: "billing",
        label: "Billing",
        segment: "billing",
        icon: CreditCard,
        requiredPermission: OrganizationPermission.OrgBillingView,
      },
    ],
  },
  {
    id: "help",
    label: "Help",
    items: [
      { id: "support", label: "Support", segment: "support", icon: LifeBuoy },
      {
        id: "contact-us",
        label: "Contact Us",
        segment: "contact-us",
        icon: Mail,
      },
      {
        id: "changelog",
        label: "Changelog",
        segment: "changelog",
        icon: Newspaper,
      },
    ],
  },
];

export const ORG_NAV_COPY: Record<string, string> = {
  monitors: "HTTP, TLS, and heartbeat checks will live here.",
  "status-pages": "Public status pages will live here.",
  "contact-lists": "Notification recipient lists will live here.",
  "team-members": "Invitations and roles will live here.",
  "white-label": "A branded status page and custom domain will live here.",
  settings: "Organization profile and workspace preferences will live here.",
  logs: "Audit logs will live here.",
  billing: "Plan and invoices will live here.",
  support: "Help and tickets will live here.",
  "contact-us": "A support address will live here. This is not a mailbox.",
  changelog: "Product notes will live here.",
};

export const ORG_NAV_LEGACY_SEGMENTS: Record<string, string> = {
  contacts: "contact-lists",
  "support/changelog": "changelog",
  "support/docs": "support",
  "support/email": "contact-us",
};

function navAllows(
  permissionMask: string,
  permission: OrganizationPermission | undefined,
): boolean {
  if (permission === undefined) {
    return true;
  }
  try {
    return permissionMaskHas(permissionMask, permission);
  } catch {
    return false;
  }
}

export function visibleOrgNavCategories(
  permissionMask: string,
): OrgNavCategory[] {
  return ORG_NAV_CATEGORIES.flatMap((category) => {
    const items = category.items.filter((item) =>
      navAllows(permissionMask, item.requiredPermission),
    );
    if (items.length === 0) {
      return [];
    }
    return [{ ...category, items }];
  });
}

export function findOrgNavItem(segment: string): OrgNavItem | undefined {
  for (const category of ORG_NAV_CATEGORIES) {
    const item = category.items.find((entry) => entry.segment === segment);
    if (item !== undefined) {
      return item;
    }
  }
  return undefined;
}

export function orgNavSegments(): string[] {
  return ORG_NAV_CATEGORIES.flatMap((category) =>
    category.items.map((item) => item.segment),
  );
}
