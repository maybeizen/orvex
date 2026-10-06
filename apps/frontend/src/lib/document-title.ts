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
  [/^\/organization\/[^/]+$/, "Dashboard"],
  [/^\/s\/[^/]+$/, "Status"],
];

export function titleForPath(pathname: string): string {
  for (const [pattern, title] of TITLES) {
    if (pattern.test(pathname)) {
      return title === "Orvex Monitor" ? title : `${title} · Orvex Monitor`;
    }
  }
  return "Orvex Monitor";
}
