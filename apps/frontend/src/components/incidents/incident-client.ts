import type {
  Incident,
  IncidentSeverity,
  IncidentStatus,
  IncidentUpdate,
  MaintenanceWindow,
  Monitor,
  StatusPage,
} from "@orvex/types";
import { createVanillaTrpcClient } from "@/lib/trpc";

type OrgRef = {
  organizationId: string;
};

type IncidentClient = {
  incident: {
    list: {
      query: (
        input: OrgRef & {
          status?: IncidentStatus;
          monitorId?: string;
        },
      ) => Promise<Incident[]>;
    };
    get: {
      query: (
        input: OrgRef & { incidentId: string },
      ) => Promise<{ incident: Incident; updates: IncidentUpdate[] }>;
    };
    create: {
      mutate: (
        input: OrgRef & {
          monitorId?: string | null;
          severity: IncidentSeverity;
          summary: string;
        },
      ) => Promise<Incident>;
    };
    ack: {
      mutate: (input: OrgRef & { incidentId: string }) => Promise<Incident>;
    };
    resolve: {
      mutate: (input: OrgRef & { incidentId: string }) => Promise<Incident>;
    };
    addUpdate: {
      mutate: (
        input: OrgRef & {
          incidentId: string;
          body: string;
          statusPageVisible?: boolean;
        },
      ) => Promise<IncidentUpdate>;
    };
  };
  maintenance: {
    list: {
      query: (input: OrgRef) => Promise<MaintenanceWindow[]>;
    };
    create: {
      mutate: (
        input: OrgRef & {
          statusPageId?: string | null;
          monitorIds?: string[];
          title: string;
          body?: string;
          startsAt: string;
          endsAt: string;
          suppressAlerts?: boolean;
        },
      ) => Promise<MaintenanceWindow>;
    };
  };
  monitor: {
    list: {
      query: (input: OrgRef) => Promise<Monitor[]>;
    };
  };
  statusPage: {
    list: {
      query: (input: OrgRef) => Promise<StatusPage[]>;
    };
  };
};

export function createIncidentClient(): IncidentClient {
  return createVanillaTrpcClient() as unknown as IncidentClient;
}
