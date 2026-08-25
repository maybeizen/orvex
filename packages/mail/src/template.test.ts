import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { MailError } from "./errors.js";
import { loadTemplate, renderTemplate } from "./template.js";

test("interpolates template variables", () => {
  expect(
    renderTemplate("Hello {{name}} from {{app}}", {
      name: "Ada",
      app: "Orvex",
    }),
  ).toBe("Hello Ada from Orvex");
});

test("keeps unknown placeholders", () => {
  expect(renderTemplate("Hi {{missing}}", {})).toBe("Hi {{missing}}");
});

test("missing template throws MailError", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "orvex-mail-"));

  await expect(loadTemplate(dir, "missing")).rejects.toBeInstanceOf(MailError);
});

test("loads html template from disk", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "orvex-mail-"));
  await writeFile(path.join(dir, "hello.html"), "Hi {{name}}", "utf8");

  expect(
    renderTemplate(await loadTemplate(dir, "hello"), { name: "Ada" }),
  ).toBe("Hi Ada");
});
