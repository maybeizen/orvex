const TITLES: Array<[RegExp, string]> = [
  [/^\/$/, "Orvex Monitor"],
  [/^\/login$/, "Sign in"],
  [/^\/login\/2fa$/, "Two-factor authentication"],
  [/^\/register$/, "Create account"],
  [/^\/forgot-password$/, "Reset password"],
  [/^\/reset-password$/, "Choose a new password"],
  [/^\/onboarding$/, "Onboarding"],
  [/^\/onboarding\/checkout$/, "Checkout"],
  [/^\/pricing$/, "Pricing"],
  [/^\/about$/, "About"],
  [/^\/changelog$/, "Changelog"],
  [/^\/terms$/, "Terms"],
  [/^\/privacy$/, "Privacy"],
  [/^\/organizations$/, "Organizations"],
  [/^\/settings$/, "Settings"],
  [/^\/forbidden$/, "Forbidden"],
  [/^\/organization\/[^/]+\/monitors\/new$/, "New monitor"],
  [/^\/organization\/[^/]+\/monitors\/[^/]+\/edit$/, "Edit monitor"],
  [/^\/organization\/[^/]+\/monitors\/[^/]+$/, "Monitor"],
  [/^\/organization\/[^/]+\/monitors$/, "Monitors"],
  [/^\/organization\/[^/]+\/incidents\/[^/]+$/, "Incident"],
  [/^\/organization\/[^/]+\/incidents$/, "Incidents"],
  [/^\/organization\/[^/]+\/maintenance$/, "Maintenance"],
  [/^\/organization\/[^/]+\/status-pages\/[^/]+$/, "Status page"],
  [/^\/organization\/[^/]+\/status-pages$/, "Status pages"],
  [/^\/organization\/[^/]+\/contact-lists$/, "Contact lists"],
  [/^\/organization\/[^/]+\/team$/, "Team"],
  [/^\/organization\/[^/]+\/billing$/, "Billing"],
  [/^\/organization\/[^/]+\/settings$/, "Organization settings"],
  [/^\/organization\/[^/]+\/support$/, "Support"],
  [/^\/organization\/[^/]+\/docs$/, "Docs"],
  [/^\/organization\/[^/]+\/audit-log$/, "Audit log"],
  [/^\/organization\/[^/]+\/orders$/, "Orders"],
  [/^\/organization\/[^/]+\/invoices$/, "Invoices"],
  [/^\/organization\/[^/]+\/referrals$/, "Referrals"],
  [/^\/organization\/[^/]+\/white-label$/, "White label"],
  [/^\/organization\/[^/]+$/, "Dashboard"],
  [/^\/admin$/, "Admin"],
  [/^\/docs$/, "Docs"],
  [/^\/invite\/[^/]+$/, "Invitation"],
  [/^\/auth\/callback$/, "Signing in"],
  [/^\/s\/[^/]+$/, "Status board"],
  [/^\/status\/[^/]+\/confirm$/, "Confirm subscription"],
  [/^\/status\/[^/]+\/[^/]+\/confirm$/, "Confirm subscription"],
  [/^\/profile$/, "Settings"],
  [/^\/dashboard$/, "Dashboard"],
  [/^\/monitors\/new$/, "New monitor"],
  [/^\/monitors\/[^/]+\/edit$/, "Edit monitor"],
  [/^\/monitors\/[^/]+$/, "Monitor"],
  [/^\/monitors$/, "Monitors"],
  [/^\/incidents\/[^/]+$/, "Incident"],
  [/^\/incidents$/, "Incidents"],
  [/^\/maintenance$/, "Maintenance"],
  [/^\/status-pages\/[^/]+$/, "Status page"],
  [/^\/status-pages$/, "Status pages"],
  [/^\/contact-lists$/, "Contact lists"],
  [/^\/white-label$/, "White label"],
  [/^\/team$/, "Team"],
  [/^\/audit-log$/, "Audit log"],
  [/^\/orders$/, "Orders"],
  [/^\/invoices$/, "Invoices"],
  [/^\/referrals$/, "Referrals"],
  [/^\/support$/, "Support"],
  [/^\/settings\/organization$/, "Organization settings"],
  [/^\/settings\/billing$/, "Invoices"],
  [/^\/billing$/, "Billing"],
];

const LEGACY_SPLATS: Array<[RegExp, string]> = [
  [/^\/monitors\/.+/, "Monitors"],
  [/^\/incidents\/.+/, "Incidents"],
  [/^\/maintenance\/.+/, "Maintenance"],
  [/^\/status-pages\/.+/, "Status pages"],
];

export function formatDocumentTitle(title: string): string {
  return title === "Orvex Monitor" ? title : `${title} · Orvex Monitor`;
}

export function titleForPath(pathname: string): string {
  for (const [pattern, title] of TITLES) {
    if (pattern.test(pathname)) {
      return formatDocumentTitle(title);
    }
  }
  for (const [pattern, title] of LEGACY_SPLATS) {
    if (pattern.test(pathname)) {
      return formatDocumentTitle(title);
    }
  }
  return formatDocumentTitle("Page not found");
}
