import {
  BookOpen,
  BookUser,
  FileText,
  Gift,
  LayoutDashboard,
  LifeBuoy,
  Newspaper,
  Package,
  Paintbrush,
  Radio,
  ScrollText,
  Settings,
  TriangleAlert,
  Users,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { organizationPath } from "@/lib/org-paths";

export type AppNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
};

export type AppNavSection = {
  label: string | null;
  items: readonly AppNavItem[];
};

export function appNavSections(slug: string): readonly AppNavSection[] {
  return [
    {
      label: null,
      items: [
        {
          to: organizationPath(slug),
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          to: organizationPath(slug, "/monitors"),
          label: "Uptime Monitors",
          icon: Waypoints,
        },
        {
          to: organizationPath(slug, "/incidents"),
          label: "Incidents",
          icon: TriangleAlert,
        },
        {
          to: organizationPath(slug, "/status-pages"),
          label: "Status Pages",
          icon: Radio,
        },
        {
          to: organizationPath(slug, "/contact-lists"),
          label: "Contact Lists",
          icon: BookUser,
        },
        {
          to: organizationPath(slug, "/white-label"),
          label: "White Label",
          icon: Paintbrush,
        },
        {
          to: organizationPath(slug, "/team"),
          label: "Team Members",
          icon: Users,
        },
        {
          to: organizationPath(slug, "/audit-log"),
          label: "Audit Log",
          icon: ScrollText,
        },
        {
          to: organizationPath(slug, "/settings"),
          label: "Organization settings",
          icon: Settings,
        },
      ],
    },
    {
      label: "Billing",
      items: [
        {
          to: organizationPath(slug, "/orders"),
          label: "Orders",
          icon: Package,
        },
        {
          to: organizationPath(slug, "/invoices"),
          label: "Invoices",
          icon: FileText,
        },
        {
          to: organizationPath(slug, "/referrals"),
          label: "Referrals",
          icon: Gift,
        },
      ],
    },
    {
      label: null,
      items: [
        {
          to: organizationPath(slug, "/support"),
          label: "Support",
          icon: LifeBuoy,
        },
        { to: organizationPath(slug, "/docs"), label: "Docs", icon: BookOpen },
        { to: "/changelog", label: "Changelog", icon: Newspaper },
      ],
    },
  ];
}

export const APP_NAV_SECTIONS: readonly AppNavSection[] = appNavSections("org");
