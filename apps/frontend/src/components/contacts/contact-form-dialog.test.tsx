/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import type { Contact } from "@orvex/types";
import { ContactFormDialog } from "./contact-form-dialog.js";

const create = vi.fn();
const update = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    contact: {
      contacts: {
        create: { mutate: create },
        update: { mutate: update },
      },
    },
  }),
}));

const existing: Contact = {
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
  create.mockReset();
  update.mockReset();
  create.mockResolvedValue(existing);
  update.mockResolvedValue({ ...existing, label: "Ada Night" });
});

test("create form posts a contact and refuses slack on free", async () => {
  const onSaved = vi.fn().mockResolvedValue(undefined);
  const onOpenChange = vi.fn();
  render(
    <ContactFormDialog
      open
      organizationId="org-1"
      planId="free"
      listId="list-1"
      contact={null}
      onOpenChange={onOpenChange}
      onSaved={onSaved}
    />,
  );

  fireEvent.click(screen.getByRole("combobox", { name: "Channel" }));
  expect(screen.getByRole("option", { name: /Slack/ })).toHaveAttribute(
    "aria-disabled",
    "true",
  );

  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "Ada" },
  });
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "ada@orvex.dev" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create contact" }));

  await vi.waitFor(() => {
    expect(create).toHaveBeenCalledWith({
      organizationId: "org-1",
      listId: "list-1",
      label: "Ada",
      channel: "email",
      destination: "ada@orvex.dev",
      enabled: true,
    });
  });
  expect(onSaved).toHaveBeenCalled();
  await vi.waitFor(() => {
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

test("edit form updates the selected contact", async () => {
  const onSaved = vi.fn().mockResolvedValue(undefined);
  render(
    <ContactFormDialog
      open
      organizationId="org-1"
      planId="sentinel"
      listId="list-1"
      contact={existing}
      onOpenChange={() => undefined}
      onSaved={onSaved}
    />,
  );

  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "Ada Night" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save contact" }));

  await vi.waitFor(() => {
    expect(update).toHaveBeenCalledWith({
      organizationId: "org-1",
      contactId: existing.id,
      label: "Ada Night",
      channel: "email",
      destination: "ada@orvex.dev",
      enabled: true,
    });
  });
});
