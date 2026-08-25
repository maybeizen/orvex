import type { OrvexLogger } from "@orvex/logger";
import type { MailMessage } from "@orvex/types";

export type SmtpConfig = {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
  templatesDir: string;
  logger?: OrvexLogger;
};

export type MailSendResult =
  { skipped: true } | { skipped: false; messageId: string };

export type Mailer = {
  send(message: MailMessage): Promise<MailSendResult>;
};
