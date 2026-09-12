import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createMailer, type SmtpConfig } from "@orvex/mail";
import type { ChannelAdapter } from "../types.js";
import { failed, sent, skipped } from "./http.js";

function templatesDir(): string {
  return join(
    dirname(fileURLToPath(import.meta.url)),
    "../../../../../../packages/mail/templates",
  );
}

function smtpPort(): number {
  const raw = process.env.SMTP_PORT;
  if (raw === undefined || raw.length === 0) {
    return 587;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 587;
}

export const emailAdapter: ChannelAdapter = {
  async send({ destination, payload }) {
    if (destination.trim().length === 0) {
      return skipped("missing destination");
    }

    const recovery = payload.event === "on_recovery";
    const smtp: SmtpConfig = {
      port: smtpPort(),
      templatesDir: templatesDir(),
    };
    if (process.env.SMTP_HOST !== undefined) {
      smtp.host = process.env.SMTP_HOST;
    }
    if (process.env.SMTP_USER !== undefined) {
      smtp.user = process.env.SMTP_USER;
    }
    if (process.env.SMTP_PASS !== undefined) {
      smtp.pass = process.env.SMTP_PASS;
    }
    if (process.env.SMTP_FROM !== undefined) {
      smtp.from = process.env.SMTP_FROM;
    }
    const mailer = createMailer(smtp);

    try {
      const result = await mailer.send({
        to: destination,
        subject: recovery ? `Recovered: ${payload.summary}` : payload.summary,
        template: recovery ? "incident-recovery" : "incident",
        variables: {
          title: recovery ? "Incident recovered" : "Incident",
          summary: payload.summary,
          monitorName: payload.monitorName ?? "",
          event: payload.event,
        },
      });
      if (result.skipped) {
        return skipped("provider not configured");
      }
      return sent(result.messageId);
    } catch (error) {
      return failed(error instanceof Error ? error.message : "request failed");
    }
  },
};
