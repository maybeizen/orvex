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
  TriangleAlert,
  Users,
  Waypoints,
  type LucideIcon,
} from "lucide-react";

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

export const APP_NAV_SECTIONS: readonly AppNavSection[] = [
  {
    label: null,
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/monitors", label: "Uptime Monitors", icon: Waypoints },
      { to: "/incidents", label: "Incidents", icon: TriangleAlert },
      { to: "/status-pages", label: "Status Pages", icon: Radio },
      { to: "/contact-lists", label: "Contact Lists", icon: BookUser },
      { to: "/white-label", label: "White Label", icon: Paintbrush },
      { to: "/team", label: "Team Members", icon: Users },
      { to: "/audit-log", label: "Audit Log", icon: ScrollText },
    ],
  },
  {
    label: "Billing",
    items: [
      { to: "/orders", label: "Orders", icon: Package },
      { to: "/invoices", label: "Invoices", icon: FileText },
      { to: "/referrals", label: "Referrals", icon: Gift },
    ],
  },
  {
    label: null,
    items: [
      { to: "/support", label: "Support", icon: LifeBuoy },
      { to: "/docs", label: "Docs", icon: BookOpen },
      { to: "/changelog", label: "Changelog", icon: Newspaper },
    ],
  },
];
