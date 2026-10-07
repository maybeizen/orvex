import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const css = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "globals.css"),
  "utf8",
);

function channel(hex: string, offset: number): number {
  return Number.parseInt(hex.slice(offset, offset + 2), 16);
}

function linear(value: number): number {
  const channelValue = value / 255;
  return channelValue <= 0.04045
    ? channelValue / 12.92
    : ((channelValue + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  return (
    0.2126 * linear(channel(hex, 1)) +
    0.7152 * linear(channel(hex, 3)) +
    0.0722 * linear(channel(hex, 5))
  );
}

function contrast(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function mix(foreground: string, background: string, alpha: number): string {
  const channels = [1, 3, 5].map((offset) =>
    Math.round(
      channel(foreground, offset) * alpha +
        channel(background, offset) * (1 - alpha),
    ),
  );
  return `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function variables(selector: string): Map<string, string> {
  const match = new RegExp(`${selector}\\s*\\{([^}]*)\\}`).exec(css);
  expect(match?.[1]).toBeTruthy();
  const found = new Map<string, string>();
  for (const line of (match?.[1] ?? "").split("\n")) {
    const variable = /^\s*(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/.exec(line);
    if (variable?.[1] !== undefined && variable[2] !== undefined) {
      found.set(variable[1], variable[2].toLowerCase());
    }
  }
  return found;
}

test("light and dark tokens meet the text and border contrast floors", () => {
  const light = variables(":root");
  const dark = variables("\\.dark");
  const background = "#f3f5f7";
  const white = "#ffffff";
  const primary = "#0d6b5c";
  const primaryHover = "#0b5c4f";
  const warning = "#855308";
  const success = "#0d6b5c";

  expect(light.get("--primary")).toBe(primary);
  expect(light.get("--primary-hover")).toBe(primaryHover);
  expect(light.get("--primary-foreground")).toBe(background);
  expect(light.get("--warning")).toBe(warning);
  expect(light.get("--success")).toBe(success);
  expect(light.get("--input")).toBe("#80868e");
  expect(dark.get("--input")).toBe("#616772");
  expect(dark.get("--primary")).toBe("#3ddcb0");
  expect(dark.get("--primary-hover")).toBe("#4ae8bc");
  expect(dark.get("--primary-foreground")).toBe("#0b0d10");

  expect(contrast(primary, background)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(primaryHover, background)).toBeGreaterThanOrEqual(4.5);
  expect(contrast("#3ddcb0", "#0b0d10")).toBeGreaterThanOrEqual(4.5);
  expect(contrast("#4ae8bc", "#0b0d10")).toBeGreaterThanOrEqual(4.5);

  for (const token of [warning, success]) {
    expect(contrast(token, white)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token, background)).toBeGreaterThanOrEqual(4.5);
    for (const alpha of [0.1, 0.15]) {
      expect(contrast(token, mix(token, white, alpha))).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(
        contrast(token, mix(token, background, alpha)),
      ).toBeGreaterThanOrEqual(4.5);
    }
  }

  expect(contrast("#80868e", background)).toBeGreaterThanOrEqual(3);
  expect(contrast("#80868e", white)).toBeGreaterThanOrEqual(3);
  expect(contrast("#616772", "#0b0d10")).toBeGreaterThanOrEqual(3);
  expect(contrast("#616772", "#12151a")).toBeGreaterThanOrEqual(3);
});
