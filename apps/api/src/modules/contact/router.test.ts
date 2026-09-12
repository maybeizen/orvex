import { TRPCError } from "@trpc/server";
import { afterEach, expect, test } from "vitest";
import type { ContextRequest } from "../../trpc/context.js";
import { router } from "../../trpc/trpc.js";
import { withCache } from "../../trpc/test-context.js";
import { contactRouter } from "./router.js";
import {
  createContactMemory,
  memberRow,
  organizationRow,
  orgTestUser,
} from "./test-support.js";

const req: ContextRequest = { headers: {} };

const testRouter = router({
  contact: contactRouter,
});

function caller(supabase: ReturnType<typeof createContactMemory>["supabase"]) {
  return testRouter.createCaller(
    withCache({
      user: orgTestUser,
      req,
      supabase,
    }),
  );
}

const smtpHost = process.env.SMTP_HOST;
const twilioSid = process.env.TWILIO_ACCOUNT_SID;

afterEach(() => {
  if (smtpHost === undefined) {
    delete process.env.SMTP_HOST;
  } else {
    process.env.SMTP_HOST = smtpHost;
  }
  if (twilioSid === undefined) {
    delete process.env.TWILIO_ACCOUNT_SID;
  } else {
    process.env.TWILIO_ACCOUNT_SID = twilioSid;
  }
});

test("creates a list and an email contact", async () => {
  const org = organizationRow();
  const memory = createContactMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const api = caller(memory.supabase);

  const list = await api.contact.lists.create({
    organizationId: org.id,
    name: "On-call",
  });
  expect(list.name).toBe("On-call");
  expect(list.organizationId).toBe(org.id);
  expect(memory.lists).toHaveLength(1);

  const contact = await api.contact.contacts.create({
    organizationId: org.id,
    listId: list.id,
    label: "Ada",
    channel: "email",
    destination: "ada@orvex.dev",
    secret: "super-secret",
  });
  expect(contact.label).toBe("Ada");
  expect(contact.channel).toBe("email");
  expect(contact.destination).toBe("ada@orvex.dev");
  expect(contact).not.toHaveProperty("encrypted_secret");
  expect(contact).not.toHaveProperty("encryptedSecret");
  expect(memory.contacts[0]?.encrypted_secret).not.toBe("super-secret");

  const listed = await api.contact.contacts.list({
    organizationId: org.id,
    listId: list.id,
  });
  expect(listed).toEqual([expect.objectContaining({ id: contact.id })]);
  expect(listed[0]).not.toHaveProperty("encrypted_secret");
});

test("rejects a channel that is not on the free plan", async () => {
  const org = organizationRow({ plan_id: "free" });
  const memory = createContactMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const api = caller(memory.supabase);
  const list = await api.contact.lists.create({
    organizationId: org.id,
    name: "Alerts",
  });

  const error = await api.contact.contacts
    .create({
      organizationId: org.id,
      listId: list.id,
      label: "Slack",
      channel: "slack",
      destination: "https://hooks.slack.com/services/x",
    })
    .catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).code).toBe("BAD_REQUEST");
  expect((error as TRPCError).message).toBe(
    "That channel is not available on this plan",
  );
  expect(memory.contacts).toHaveLength(0);
});

test("testSend skips when provider keys are missing", async () => {
  delete process.env.SMTP_HOST;
  const org = organizationRow();
  const memory = createContactMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const api = caller(memory.supabase);
  const list = await api.contact.lists.create({
    organizationId: org.id,
    name: "On-call",
  });
  const contact = await api.contact.contacts.create({
    organizationId: org.id,
    listId: list.id,
    label: "Ada",
    channel: "email",
    destination: "ada@orvex.dev",
  });

  const delivery = await api.contact.testSend({
    organizationId: org.id,
    contactId: contact.id,
  });

  expect(delivery.status).toBe("skipped");
  expect(delivery.contactId).toBe(contact.id);
  expect(delivery.channel).toBe("email");
  expect(memory.deliveries).toHaveLength(1);
  expect(memory.deliveries[0]?.status).toBe("skipped");
});

test("rules CRUD stores event flags", async () => {
  const org = organizationRow();
  const memory = createContactMemory({
    organizations: [org],
    members: [memberRow()],
  });
  const api = caller(memory.supabase);
  const list = await api.contact.lists.create({
    organizationId: org.id,
    name: "On-call",
  });

  const created = await api.contact.rules.create({
    organizationId: org.id,
    listId: list.id,
    onDown: true,
    onRecovery: false,
    onIncident: true,
    onMaintenance: false,
  });
  expect(created.onDown).toBe(true);
  expect(created.onRecovery).toBe(false);
  expect(created.onIncident).toBe(true);
  expect(created.onMaintenance).toBe(false);

  const updated = await api.contact.rules.update({
    organizationId: org.id,
    ruleId: created.id,
    onRecovery: true,
  });
  expect(updated.onRecovery).toBe(true);
});
