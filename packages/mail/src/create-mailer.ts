import nodemailer from "nodemailer";
import { createLogger } from "@orvex/logger";
import type { MailMessage } from "@orvex/types";
import { loadTemplate, renderTemplate } from "./template.js";
import type { MailSendResult, Mailer, SmtpConfig } from "./types.js";

function isConfigured(
  config: SmtpConfig,
): config is SmtpConfig & { host: string } {
  return config.host !== undefined && config.host.length > 0;
}

export function createMailer(config: SmtpConfig): Mailer {
  const logger = config.logger ?? createLogger({ service: "mail" });

  return {
    async send(message: MailMessage): Promise<MailSendResult> {
      const html = renderTemplate(
        await loadTemplate(config.templatesDir, message.template),
        message.variables,
      );

      if (!isConfigured(config)) {
        logger.info("mail skipped (smtp not configured)", {
          to: message.to,
          subject: message.subject,
          template: message.template,
        });
        return { skipped: true };
      }

      const auth =
        config.user !== undefined &&
        config.user.length > 0 &&
        config.pass !== undefined &&
        config.pass.length > 0
          ? { user: config.user, pass: config.pass }
          : undefined;

      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port ?? 587,
        ...(auth === undefined ? {} : { auth }),
      });

      const info = await transporter.sendMail({
        from: config.from,
        to: message.to,
        subject: message.subject,
        html,
      });

      return { skipped: false, messageId: info.messageId };
    },
  };
}
