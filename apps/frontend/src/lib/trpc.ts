import type { AppRouter } from "@orvex/api";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { getAccessToken } from "./supabase";

export const trpc = createTRPCReact<AppRouter>();

export function createTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${import.meta.env.VITE_API_URL ?? "http://localhost:3001"}/trpc`,
        headers: async () => {
          const token = await getAccessToken();
          if (token === null) {
            return {};
          }

          return { Authorization: `Bearer ${token}` };
        },
      }),
    ],
  });
}
