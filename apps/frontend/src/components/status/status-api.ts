import { createVanillaTrpcClient } from "@/lib/trpc";

export function statusPageApi() {
  return createVanillaTrpcClient().statusPage;
}

export function monitorListApi() {
  return createVanillaTrpcClient().monitor;
}
