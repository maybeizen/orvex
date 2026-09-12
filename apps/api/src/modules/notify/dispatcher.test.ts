import { afterEach, expect, test } from "vitest";
import {
  contactListRow,
  contactRow,
  createContactMemory,
  memberRow,
  notificationRuleRow,
  organizationRow,
} from "../contact/test-support.js";
import { dispatchIncident } from "./dispatcher.js";

const smtpHost = process.env.SMTP_HOST;
const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom = process.env.TWILIO_FROM_NUMBER;

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
  if (twilioToken === undefined) {
    delete process.env.TWILIO_AUTH_TOKEN;
  } else {
    process.env.TWILIO_AUTH_TOKEN = twilioToken;
  }
  if (twilioFrom === undefined) {
    delete process.env.TWILIO_FROM_NUMBER;
  } else {
    process.env.TWILIO_FROM_NUMBER = twilioFrom;
  }
});

test("dispatcher writes a skipped delivery when provider keys are missing", async () => {
  delete process.env.SMTP_HOST;
  const org = organizationRow();
  const list = contactListRow();
  const contact = contactRow();
  const rule = notificationRuleRow();
  const memory = createContactMemory({
    organizations: [org],
    members: [memberRow()],
    lists: [list],
    contacts: [contact],
    rules: [rule],
  });

  const result = await dispatchIncident({
    supabase: memory.supabase,
    organizationId: org.id,
    event: "on_down",
    incidentId: null,
    summary: "Probe failed",
    monitorName: "api",
  });

  expect(result.delivered).toBe(1);
  expect(memory.deliveries).toHaveLength(1);
  expect(memory.deliveries[0]).toEqual(
    expect.objectContaining({
      contact_id: contact.id,
      channel: "email",
      status: "skipped",
      incident_id: null,
    }),
  );
});

test("dispatcher skips contacts that do not match the event", async () => {
  delete process.env.SMTP_HOST;
  const org = organizationRow();
  const list = contactListRow();
  const contact = contactRow();
  const rule = notificationRuleRow({ on_down: false, on_recovery: true });
  const memory = createContactMemory({
    organizations: [org],
    members: [memberRow()],
    lists: [list],
    contacts: [contact],
    rules: [rule],
  });

  const result = await dispatchIncident({
    supabase: memory.supabase,
    organizationId: org.id,
    event: "on_down",
    summary: "Probe failed",
  });

  expect(result.delivered).toBe(0);
  expect(memory.deliveries).toHaveLength(0);
});

test("sms adapter skip is recorded as skipped", async () => {
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.TWILIO_FROM_NUMBER;
  const org = organizationRow({ plan_id: "command" });
  const list = contactListRow();
  const contact = contactRow({
    channel: "sms",
    destination: "+15555550100",
  });
  const rule = notificationRuleRow();
  const memory = createContactMemory({
    organizations: [org],
    members: [memberRow()],
    lists: [list],
    contacts: [contact],
    rules: [rule],
  });

  const result = await dispatchIncident({
    supabase: memory.supabase,
    organizationId: org.id,
    event: "on_incident",
    summary: "Page the on-call",
  });

  expect(result.delivered).toBe(1);
  expect(memory.deliveries[0]?.status).toBe("skipped");
  expect(memory.deliveries[0]?.channel).toBe("sms");
});
