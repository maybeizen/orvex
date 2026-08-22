import { expect, test } from "vitest";
import { createBrowserSupabaseClient } from "./browser.js";
import { DbConfigError } from "./errors.js";
import { createServiceSupabaseClient } from "./service.js";
import { createUserSupabaseClient } from "./user.js";

test("createBrowserSupabaseClient throws when url is empty", () => {
  expect(() =>
    createBrowserSupabaseClient({ url: "", anonKey: "anon" }),
  ).toThrow(DbConfigError);
});

test("createBrowserSupabaseClient throws when anonKey is empty", () => {
  expect(() =>
    createBrowserSupabaseClient({
      url: "https://example.supabase.co",
      anonKey: "   ",
    }),
  ).toThrow(DbConfigError);
});

test("createServiceSupabaseClient throws when serviceRoleKey is empty", () => {
  expect(() =>
    createServiceSupabaseClient({
      url: "https://example.supabase.co",
      serviceRoleKey: "",
    }),
  ).toThrow(DbConfigError);
});

test("createUserSupabaseClient throws when accessToken is empty", () => {
  expect(() =>
    createUserSupabaseClient({
      url: "https://example.supabase.co",
      anonKey: "anon",
      accessToken: "",
    }),
  ).toThrow(DbConfigError);
});
