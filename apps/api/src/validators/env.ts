import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import { z } from "zod";

function emptyToUndefined(value: unknown): unknown {
  if (typeof value === "string" && value.trim().length === 0) {
    return undefined;
  }

  return value;
}

const portSchema = z.preprocess((value) => {
  if (value === undefined || value === "") {
    return 3001;
  }

  return typeof value === "number" ? value : Number(value);
}, z.number().int().positive());

export const envSchema = z.object({
  PORT: portSchema,
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  REDIS_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  FRONTEND_ORIGIN: z.url(),
});

export type Env = z.infer<typeof envSchema>;

export function applyEnvFiles(): void {
  const fromModule = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../../../../.env",
  );
  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../../.env"),
    fromModule,
  ];
  const loaded = new Set<string>();
  for (const path of candidates) {
    if (loaded.has(path) || !existsSync(path)) {
      continue;
    }
    loaded.add(path);
    loadEnvFile(path);
  }
}

export function loadEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment: ${result.error.message}`);
  }

  return result.data;
}
