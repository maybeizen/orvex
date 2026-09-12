import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createMailer, type Mailer } from "@orvex/mail";
import type { SupportTicket, SupportTicketStatus } from "@orvex/types";
import { TRPCError } from "@trpc/server";
import { writeAuditEvent } from "../audit/audit-service.js";
import type { OrganizationClient } from "../organization/organization-dto.js";

export type SupportClient = Pick<OrganizationClient, "from">;
export type SupportMailer = Pick<Mailer, "send">;

type SupportTicketRow = {
  id: string;
  organization_id: string;
  user_id: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
};

const STATUSES = new Set<SupportTicketStatus>(["open", "sent", "failed"]);

function throwDb(message: string): never {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message,
  });
}

function toTicketDto(row: SupportTicketRow): SupportTicket {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    subject: row.subject,
    body: row.body,
    status: STATUSES.has(row.status as SupportTicketStatus)
      ? (row.status as SupportTicketStatus)
      : "open",
    createdAt: row.created_at,
  };
}

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

function createSupportMailer(): SupportMailer | null {
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

async function deliverSupportEmail(
  mailer: SupportMailer | null,
  input: {
    organizationName: string;
    fromName: string;
    fromEmail: string;
    subject: string;
    body: string;
  },
): Promise<SupportTicketStatus> {
  const inbox = process.env.SUPPORT_INBOX;
  if (mailer === null || inbox === undefined || inbox.length === 0) {
    return "open";
  }
  try {
    const result = await mailer.send({
      to: inbox,
      subject: `[Support] ${input.subject}`,
      template: "support",
      variables: {
        organizationName: input.organizationName,
        fromName: input.fromName,
        fromEmail: input.fromEmail,
        subject: input.subject,
        body: input.body,
      },
    });
    return result.skipped ? "open" : "sent";
  } catch {
    return "failed";
  }
}

export async function createSupportTicket(
  supabase: SupportClient,
  input: {
    organizationId: string;
    organizationName: string;
    userId: string;
    fromName: string;
    fromEmail: string;
    subject: string;
    body: string;
  },
  mailer?: SupportMailer | null,
): Promise<SupportTicket> {
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      organization_id: input.organizationId,
      user_id: input.userId,
      subject: input.subject,
      body: input.body,
      status: "open",
    })
    .select("*")
    .single();
  if (error !== null) {
    throwDb(error.message);
  }

  const status = await deliverSupportEmail(
    mailer === undefined ? createSupportMailer() : mailer,
    {
      organizationName: input.organizationName,
      fromName: input.fromName,
      fromEmail: input.fromEmail,
      subject: input.subject,
      body: input.body,
    },
  );

  if (status !== "open") {
    const { error: updateError } = await supabase
      .from("support_tickets")
      .update({ status })
      .eq("id", data.id);
    if (updateError !== null) {
      throwDb(updateError.message);
    }
    data.status = status;
  }

  await writeAuditEvent(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "support.create",
    resourceType: "support_ticket",
    resourceId: data.id,
    payload: { subject: input.subject },
  });

  return toTicketDto(data);
}
