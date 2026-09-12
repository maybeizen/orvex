import { expect, test } from "vitest";
import type { ContextRequest } from "../../trpc/context.js";
import { withCache } from "../../trpc/test-context.js";
import { supportRouter } from "./router.js";
import { createSupportTicket } from "./support-service.js";
import {
  createLedgerMemory,
  memberRow,
  organizationRow,
  orgTestUser,
} from "./test-support.js";

const req: ContextRequest = { headers: {} };

test("support.create inserts a ticket and skips mail without SMTP", async () => {
  const org = organizationRow();
  const memory = createLedgerMemory({
    organizations: [org],
    members: [memberRow()],
  });

  const caller = supportRouter.createCaller(
    withCache({
      user: orgTestUser,
      req,
      supabase: memory.supabase,
    }),
  );
  const created = await caller.create({
    organizationId: org.id,
    subject: "Cannot invite",
    body: "The invite form fails",
  });

  expect(created.subject).toBe("Cannot invite");
  expect(created.body).toBe("The invite form fails");
  expect(created.status).toBe("open");
  expect(created.organizationId).toBe(org.id);
  expect(created.userId).toBe(orgTestUser.id);
  expect(memory.supportTickets).toHaveLength(1);
  expect(
    memory.auditEvents.some((row) => row.action === "support.create"),
  ).toBe(true);
});

test("support.create marks sent when the mailer delivers", async () => {
  const org = organizationRow();
  const memory = createLedgerMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const previous = process.env.SUPPORT_INBOX;
  process.env.SUPPORT_INBOX = "help@orvex.dev";
  try {
    const ticket = await createSupportTicket(
      memory.supabase,
      {
        organizationId: org.id,
        organizationName: org.name,
        userId: orgTestUser.id,
        fromName: orgTestUser.displayName,
        fromEmail: orgTestUser.email,
        subject: "Billing",
        body: "Invoice question",
      },
      {
        send() {
          return Promise.resolve({ skipped: false, messageId: "msg-1" });
        },
      },
    );
    expect(ticket.status).toBe("sent");
    expect(memory.supportTickets[0]?.status).toBe("sent");
  } finally {
    if (previous === undefined) {
      delete process.env.SUPPORT_INBOX;
    } else {
      process.env.SUPPORT_INBOX = previous;
    }
  }
});
