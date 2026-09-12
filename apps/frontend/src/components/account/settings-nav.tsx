import { NavLink } from "react-router";
import { cn } from "@/lib/cn";

const ITEMS = [
  { to: "/settings/organization", label: "Organization", end: true },
  { to: "/profile", label: "Profile", end: true },
  { to: "/settings", label: "Appearance", end: true },
  { to: "/settings/billing", label: "Billing", end: true },
] as const;

export function SettingsNav() {
  return (
    <nav
      aria-label="Settings"
      className="flex gap-1 overflow-x-auto lg:w-44 lg:shrink-0 lg:flex-col lg:overflow-visible"
    >
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "shrink-0 rounded-md px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
