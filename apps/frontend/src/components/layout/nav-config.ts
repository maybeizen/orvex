import {
  LayoutDashboard,
  Radio,
  Settings,
  TriangleAlert,
  UserRound,
  Waypoints,
  type LucideIcon,
} from "lucide-react";

export type AppNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export type AppNavSection = {
  label: string;
  items: readonly AppNavItem[];
};

export const APP_NAV_SECTIONS: readonly AppNavSection[] = [
  {
    label: "Observe",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/monitors", label: "Monitors", icon: Waypoints },
      { to: "/incidents", label: "Incidents", icon: TriangleAlert },
      { to: "/status-pages", label: "Status pages", icon: Radio },
    ],
  },
  {
    label: "Workspace",
    items: [
      { to: "/profile", label: "Profile", icon: UserRound },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];
