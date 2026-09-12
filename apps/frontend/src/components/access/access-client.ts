import type {
  AuditEvent,
  Organization,
  OrganizationMemberList,
  ProbeRegionCode,
  SupportTicket,
} from "@orvex/types";
import { createVanillaTrpcClient } from "@/lib/trpc";

export type OrganizationDefaults = {
  timezone: string;
  defaultRegions: string[];
  supportEmail: string | null;
};

export type OrganizationOidc = {
  issuer: string | null;
  clientId: string | null;
  configured: boolean;
};

export type OrganizationListResult = {
  items: Organization[];
  activeOrganizationId: string | null;
};

type OrgRef = {
  organizationId: string;
};

type AuditFilters = OrgRef & {
  action?: string;
  resourceType?: string;
  from?: string;
  to?: string;
};

type AccessClient = {
  organization: {
    list: {
      query: () => Promise<OrganizationListResult>;
    };
    members: {
      list: {
        query: (input: OrgRef) => Promise<OrganizationMemberList>;
      };
      lock: {
        mutate: (input: OrgRef & { userId: string }) => Promise<{ ok: true }>;
      };
    };
    defaults: {
      query: (input: OrgRef) => Promise<OrganizationDefaults>;
    };
    updateDefaults: {
      mutate: (
        input: OrgRef & {
          timezone: string;
          defaultRegions: ProbeRegionCode[];
          supportEmail: string | null;
        },
      ) => Promise<OrganizationDefaults>;
    };
    oidc: {
      query: (input: OrgRef) => Promise<OrganizationOidc>;
    };
    updateOidc: {
      mutate: (
        input: OrgRef & {
          issuer: string;
          clientId: string;
          clientSecret: string;
        },
      ) => Promise<OrganizationOidc>;
    };
    transferOwnership: {
      mutate: (input: OrgRef & { userId: string }) => Promise<{ ok: true }>;
    };
    leave: {
      mutate: (input: OrgRef) => Promise<{ ok: true }>;
    };
  };
  audit: {
    list: {
      query: (input: AuditFilters) => Promise<AuditEvent[]>;
    };
    export: {
      query: (input: AuditFilters) => Promise<string[][]>;
    };
  };
  support: {
    create: {
      mutate: (
        input: OrgRef & { subject: string; body: string },
      ) => Promise<SupportTicket>;
    };
  };
};

export function createAccessClient(): AccessClient {
  return createVanillaTrpcClient() as unknown as AccessClient;
}
