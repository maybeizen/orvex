import { expect, test } from "vitest";
import { loadEnv } from "./env.js";

const valid = {
  PORT: "4010",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  REDIS_URL: "redis://127.0.0.1:6379",
  FRONTEND_ORIGIN: "http://localhost:5173",
};

test("loadEnv parses required fields and port", () => {
  const env = loadEnv(valid);
  expect(env.PORT).toEqual(4010);
  expect(env.REDIS_URL).toEqual("redis://127.0.0.1:6379");
  expect(env.FRONTEND_ORIGIN).toEqual("http://localhost:5173");
});

test("loadEnv allows omitted smtp fields", () => {
  const env = loadEnv(valid);
  expect(env.SMTP_HOST).toBeUndefined();
});

test("loadEnv defaults port when PORT is omitted", () => {
  const { PORT: _port, ...rest } = valid;
  const env = loadEnv(rest);
  expect(env.PORT).toEqual(3001);
});

test("loadEnv drops an empty redis url", () => {
  const env = loadEnv({
    ...valid,
    REDIS_URL: "",
  });
  expect(env.REDIS_URL).toBeUndefined();
});

test("loadEnv rejects missing supabase url", () => {
  expect(() =>
    loadEnv({
      ...valid,
      SUPABASE_URL: "",
    }),
  ).toThrow(/Invalid environment/u);
});
