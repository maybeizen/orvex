import { z } from "zod";

function emptyToUndefined(value: unknown): unknown {
  if (typeof value === "string" && value.trim().length === 0) {
    return undefined;
  }

  return value;
}

const portSchema = z
  .union([z.string(), z.number(), z.undefined()])
  .transform((value) => {
    if (value === undefined || value === "") {
      return 3001;
    }

    return typeof value === "number" ? value : Number(value);
  })
  .pipe(z.number().int().positive());

export const envSchema = z.object({
  PORT: portSchema,
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  REDIS_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  FRONTEND_ORIGIN: z.url(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment: ${result.error.message}`);
  }

  return result.data;
}
