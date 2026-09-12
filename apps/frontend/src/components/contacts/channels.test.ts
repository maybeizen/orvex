/** @vitest-environment node */
import { expect, test } from "vitest";
import {
  channelOptions,
  channelUsesSecret,
  firstAllowedChannel,
} from "./channels.js";

test("free plan allows email and locks slack", () => {
  const options = channelOptions("free");
  expect(options.find((option) => option.value === "email")).toMatchObject({
    value: "email",
    label: "Email",
  });
  expect(options.find((option) => option.value === "email")?.disabled).toBe(
    undefined,
  );
  expect(options.find((option) => option.value === "slack")).toMatchObject({
    disabled: true,
    hint: "Upgrade",
  });
  expect(firstAllowedChannel("free")).toBe("email");
});

test("sentinel unlocks sms and keeps pagerduty locked", () => {
  const options = channelOptions("sentinel");
  expect(options.find((option) => option.value === "sms")?.disabled).toBe(
    undefined,
  );
  expect(options.find((option) => option.value === "pagerduty")).toMatchObject({
    disabled: true,
    hint: "Upgrade",
  });
});

test("command allows every catalog channel", () => {
  expect(
    channelOptions("command").every((option) => option.disabled !== true),
  ).toBe(true);
  expect(channelUsesSecret("telegram")).toBe(true);
  expect(channelUsesSecret("email")).toBe(false);
});
