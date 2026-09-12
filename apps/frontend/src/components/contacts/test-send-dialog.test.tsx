/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import type { Contact } from "@orvex/types";
import { TestSendDialog } from "./test-send-dialog.js";

const testSend = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    contact: {
      testSend: { mutate: testSend },
    },
  }),
}));

const contact: Contact = {
  id: "contact-1",
  organizationId: "org-1",
  listId: "list-1",
  label: "Ada",
  channel: "email",
  destination: "ada@orvex.dev",
  verified: true,
  enabled: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  testSend.mockReset();
  testSend.mockResolvedValue({
    id: "delivery-1",
    contactId: contact.id,
    incidentId: null,
    channel: "email",
    status: "sent",
    providerId: "msg-1",
    error: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  });
});

test("test send posts an optional message and shows status", async () => {
  render(
    <TestSendDialog
      open
      organizationId="org-1"
      contact={contact}
      onOpenChange={() => undefined}
    />,
  );

  expect(
    screen.getByText(/Dispatch one Email message to ada@orvex.dev/),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Message"), {
    target: { value: "Ping" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send test" }));

  await vi.waitFor(() => {
    expect(testSend).toHaveBeenCalledWith({
      organizationId: "org-1",
      contactId: contact.id,
      message: "Ping",
    });
  });
  expect(await screen.findByText("sent")).toBeInTheDocument();
});
