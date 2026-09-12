import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createMailer, type Mailer } from "@orvex/mail";
import type { MailMessage } from "@orvex/types";

export type StatusPageMailer = Pick<Mailer, "send">;

function templatesDir(): string {
  const fromModule = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../../../../../packages/mail/templates",
  );
  const fromCwd = resolve(process.cwd(), "../../packages/mail/templates");
  if (existsSync(fromModule)) {
    return fromModule;
  }
  return fromCwd;
}

export function createStatusPageMailer(): StatusPageMailer | null {
  const host = process.env.SMTP_HOST;
  if (host === undefined || host.length === 0) {
    return null;
  }

  const config: {
    host: string;
    port: number;
    templatesDir: string;
    user?: string;
    pass?: string;
    from?: string;
  } = {
    host,
    port:
      process.env.SMTP_PORT === undefined || process.env.SMTP_PORT.length === 0
        ? 587
        : Number(process.env.SMTP_PORT),
    templatesDir: templatesDir(),
  };
  if (process.env.SMTP_USER !== undefined && process.env.SMTP_USER.length > 0) {
    config.user = process.env.SMTP_USER;
  }
  if (process.env.SMTP_PASS !== undefined && process.env.SMTP_PASS.length > 0) {
    config.pass = process.env.SMTP_PASS;
  }
  if (process.env.SMTP_FROM !== undefined && process.env.SMTP_FROM.length > 0) {
    config.from = process.env.SMTP_FROM;
  }
  return createMailer(config);
}

export async function sendSubscribeConfirmation(
  mailer: StatusPageMailer | null,
  input: {
    email: string;
    pageName: string;
    confirmToken: string;
    pageSlug: string;
    organizationSlug?: string | undefined;
  },
): Promise<void> {
  if (mailer === null) {
    return;
  }

  const origin = process.env.FRONTEND_ORIGIN ?? "";
  const params = new URLSearchParams({ confirm: input.confirmToken });
  if (input.organizationSlug !== undefined) {
    params.set("org", input.organizationSlug);
  }
  const path = `/s/${input.pageSlug}?${params.toString()}`;
  const confirmUrl = origin.length === 0 ? path : `${origin}${path}`;

  const message: MailMessage = {
    to: input.email,
    subject: `Confirm your subscription to ${input.pageName}`,
    template: "status-subscribe",
    variables: {
      pageName: input.pageName,
      confirmUrl,
      email: input.email,
    },
  };

  try {
    await mailer.send(message);
  } catch {
    return;
  }
}
