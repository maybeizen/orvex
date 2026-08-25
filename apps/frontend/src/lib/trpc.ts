import type { AppRouter } from "@orvex/api";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { getAccessToken } from "./supabase";

export const trpc = createTRPCReact<AppRouter>();

function trpcUrl(): string {
  return `${import.meta.env.VITE_API_URL ?? "http://localhost:3001"}/trpc`;
}

async function trpcHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  if (token === null) {
    return {};
  }

  return { Authorization: `Bearer ${token}` };
}

export function createTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: trpcUrl(),
        headers: trpcHeaders,
      }),
    ],
  });
}

export function createVanillaTrpcClient() {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: trpcUrl(),
        headers: trpcHeaders,
      }),
    ],
  });
}
