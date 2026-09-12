import { createVanillaTrpcClient } from "@/lib/trpc";

export function createIncidentClient() {
  return createVanillaTrpcClient();
}
