export type StatusPageVisibility = "public" | "unlisted" | "private";

export type StatusPageTheme = {
  accent: string | null;
  logoUrl: string | null;
};

export type StatusPage = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  visibility: StatusPageVisibility;
  theme: StatusPageTheme;
  customDomain: string | null;
  domainVerifiedAt: string | null;
  hideBranding: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StatusPageComponent = {
  id: string;
  statusPageId: string;
  monitorId: string;
  displayName: string;
  sort: number;
};

export type StatusSubscriber = {
  id: string;
  statusPageId: string;
  email: string;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
};
