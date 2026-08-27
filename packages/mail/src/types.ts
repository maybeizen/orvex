import type { OrvexLogger } from "@orvex/logger";
import type { MailMessage } from "@orvex/types";

export type SmtpConfig = {
  host?: string | undefined;
  port?: number | undefined;
  user?: string | undefined;
  pass?: string | undefined;
  from?: string | undefined;
  templatesDir: string;
  logger?: OrvexLogger | undefined;
};

export type MailSendResult =
  { skipped: true } | { skipped: false; messageId: string };

export type Mailer = {
  send(message: MailMessage): Promise<MailSendResult>;
};
