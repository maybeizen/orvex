export type ChangelogEntry = {
  date: string;
  title: string;
  body: string;
};

export const CHANGELOG_ENTRIES: readonly ChangelogEntry[] = [
  {
    date: "2026-09-11",
    title: "Control room chrome",
    body: "Dashboard shell, organization switcher, profile, and settings. Monitor execution is still being wired; the desk layout is live.",
  },
  {
    date: "2026-08-23",
    title: "Workspace onboarding",
    body: "Create a Single or Team organization, pick Free, Probe, Sentinel, or Command, and continue while Stripe checkout is pending.",
  },
  {
    date: "2026-08-12",
    title: "Account security",
    body: "Email sign-in, OAuth, TOTP, passkeys, and recovery codes. One session hydrates the desk.",
  },
];
