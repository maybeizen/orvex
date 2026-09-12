export type MarketingNavLink = {
  label: string;
  to: string;
  hash?: string;
};

export const MARKETING_NAV_LINKS: readonly MarketingNavLink[] = [
  { label: "Features", to: "/#features", hash: "#features" },
  { label: "Network", to: "/#network", hash: "#network" },
  { label: "Pricing", to: "/pricing", hash: "#pricing" },
  { label: "Changelog", to: "/changelog" },
];

export function marketingNavHref(
  pathname: string,
  link: MarketingNavLink,
): string {
  if (link.hash !== undefined && pathname === "/") {
    return link.hash;
  }
  return link.to;
}
