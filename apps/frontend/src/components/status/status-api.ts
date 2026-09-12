import type {
  Monitor,
  StatusPage,
  StatusPageComponent,
  StatusPageVisibility,
  StatusSubscriber,
} from "@orvex/types";
import { createVanillaTrpcClient } from "@/lib/trpc";
import type {
  DomainInstructions,
  StatusPagePublicPayload,
} from "./status-helpers";

type OrgRef = {
  organizationId: string;
};

type StatusPageWrite = {
  page: StatusPage;
  unlistedToken: string | null;
  domain: DomainInstructions | null;
};

type StatusPageApi = {
  list: {
    query: (input: OrgRef) => Promise<StatusPage[]>;
  };
  get: {
    query: (input: OrgRef & { pageId: string }) => Promise<{
      page: StatusPage;
      components: StatusPageComponent[];
      domain: DomainInstructions | null;
    }>;
  };
  create: {
    mutate: (
      input: OrgRef & {
        name: string;
        slug: string;
        visibility: StatusPageVisibility;
      },
    ) => Promise<StatusPageWrite>;
  };
  update: {
    mutate: (
      input: OrgRef & {
        pageId: string;
        name?: string;
        slug?: string;
        visibility?: StatusPageVisibility;
        theme?: { accent: string | null; logoUrl: string | null };
        hideBranding?: boolean;
      },
    ) => Promise<StatusPageWrite>;
  };
  delete: {
    mutate: (input: OrgRef & { pageId: string }) => Promise<{ ok: true }>;
  };
  attachComponent: {
    mutate: (
      input: OrgRef & {
        pageId: string;
        monitorId: string;
        displayName: string;
        sort?: number;
      },
    ) => Promise<StatusPageComponent>;
  };
  detachComponent: {
    mutate: (
      input: OrgRef & { pageId: string; componentId: string },
    ) => Promise<StatusPageComponent>;
  };
  reorderComponents: {
    mutate: (
      input: OrgRef & {
        pageId: string;
        items: Array<{ componentId: string; sort: number }>;
      },
    ) => Promise<StatusPageComponent[]>;
  };
  setDomain: {
    mutate: (
      input: OrgRef & { pageId: string; customDomain: string },
    ) => Promise<{ page: StatusPage; domain: DomainInstructions }>;
  };
  verifyDomain: {
    mutate: (
      input: OrgRef & { pageId: string; token: string },
    ) => Promise<StatusPage>;
  };
  addSubscriber: {
    mutate: (
      input: OrgRef & { pageId: string; email: string },
    ) => Promise<{ subscriber: StatusSubscriber; confirmToken: string }>;
  };
  listSubscribers: {
    query: (input: OrgRef & { pageId: string }) => Promise<StatusSubscriber[]>;
  };
  confirmSubscriber: {
    mutate: (input: { token: string }) => Promise<StatusSubscriber>;
  };
  subscribe: {
    mutate: (input: {
      pageSlug: string;
      email: string;
      organizationSlug?: string;
      token?: string;
    }) => Promise<{ subscriber: StatusSubscriber }>;
  };
  publicGet: {
    query: (input: {
      pageSlug: string;
      organizationSlug?: string;
      token?: string;
    }) => Promise<StatusPagePublicPayload>;
  };
};

type MonitorApi = {
  list: {
    query: (input: OrgRef) => Promise<Monitor[]>;
  };
};

export function statusPageApi(): StatusPageApi {
  return (createVanillaTrpcClient() as unknown as { statusPage: StatusPageApi })
    .statusPage;
}

export function monitorListApi(): MonitorApi {
  return (createVanillaTrpcClient() as unknown as { monitor: MonitorApi })
    .monitor;
}
