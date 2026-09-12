export type LegalSection = {
  title: string;
  body: string;
};

export const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    title: "What we store",
    body: "Account identity (email, name, username, avatar), authentication factors, organization membership, plan selection, and the check configuration you enter. We do not sell this data.",
  },
  {
    title: "Probe data",
    body: "When checks run, we keep the samples needed to show latency, status, and incident timelines: timestamps, status codes, error text, and certificate windows. Do not point checks at systems you are not allowed to monitor.",
  },
  {
    title: "Processors",
    body: "Supabase holds the database and auth. Stripe will process paid invoices when checkout is live. Hosting and mail providers see what they need to deliver the product.",
  },
  {
    title: "Retention",
    body: "We keep account and organization records while the workspace exists. Delete the workspace or close the account and we remove the associated rows on a regular cleanup cycle.",
  },
  {
    title: "Contact",
    body: "Questions about this notice go to the operator of the Orvex Monitor project you signed up on.",
  },
];
