import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { createMailer } from "./create-mailer.js";
import { MailError } from "./errors.js";

test("send skips when smtp is not configured", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "orvex-mail-"));
  await writeFile(path.join(dir, "hello.html"), "Hi {{name}}", "utf8");
  const mailer = createMailer({ templatesDir: dir });

  await expect(
    mailer.send({
      to: "ada@orvex.dev",
      subject: "Welcome",
      template: "hello",
      variables: { name: "Ada" },
    }),
  ).resolves.toEqual({ skipped: true });
});

test("send throws MailError when template is missing", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "orvex-mail-"));
  const mailer = createMailer({ templatesDir: dir });

  await expect(
    mailer.send({
      to: "ada@orvex.dev",
      subject: "Welcome",
      template: "missing",
      variables: {},
    }),
  ).rejects.toBeInstanceOf(MailError);
});
