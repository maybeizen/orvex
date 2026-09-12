import type { MonitorType, ProbeRegionCode } from "@orvex/types";
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

export function monitorApi() {
  return createVanillaTrpcClient().monitor;
}
