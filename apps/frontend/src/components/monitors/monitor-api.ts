import type {
  CheckResult,
  Monitor,
  MonitorType,
  ProbeRegionCode,
} from "@orvex/types";
import { createVanillaTrpcClient } from "@/lib/trpc";

type OrgRef = {
  organizationId: string;
};

export type MonitorWriteInput = OrgRef & {
  name: string;
  type: MonitorType;
  intervalSeconds: number;
  regions: ProbeRegionCode[];
  target?: string;
  keyword?: string;
  port?: number;
};

type MonitorApi = {
  list: {
    query: (input: OrgRef) => Promise<Monitor[]>;
  };
  get: {
    query: (input: OrgRef & { monitorId: string }) => Promise<Monitor>;
  };
  samples: {
    query: (
      input: OrgRef & { monitorId: string; limit?: number },
    ) => Promise<CheckResult[]>;
  };
  create: {
    mutate: (input: MonitorWriteInput) => Promise<Monitor>;
  };
  update: {
    mutate: (
      input: MonitorWriteInput & { monitorId: string },
    ) => Promise<Monitor>;
  };
  pause: {
    mutate: (input: OrgRef & { monitorId: string }) => Promise<Monitor>;
  };
  unpause: {
    mutate: (input: OrgRef & { monitorId: string }) => Promise<Monitor>;
  };
  delete: {
    mutate: (input: OrgRef & { monitorId: string }) => Promise<{ ok: boolean }>;
  };
};

export function monitorApi(): MonitorApi {
  return (createVanillaTrpcClient() as { monitor: MonitorApi }).monitor;
}
