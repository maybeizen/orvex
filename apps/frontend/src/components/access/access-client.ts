import { createVanillaTrpcClient } from "@/lib/trpc";

export function createAccessClient() {
  return createVanillaTrpcClient();
}
