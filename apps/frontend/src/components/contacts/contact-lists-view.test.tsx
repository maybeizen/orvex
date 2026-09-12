/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { Contact, ContactList, Organization } from "@orvex/types";
import { ContactListsView } from "./contact-lists-view.js";

const listQuery = vi.fn();
const listCreate = vi.fn();
const listUpdate = vi.fn();
const listDelete = vi.fn();
const contactsQuery = vi.fn();
const contactsCreate = vi.fn();
const contactsUpdate = vi.fn();
const contactsDelete = vi.fn();
const testSend = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    contact: {
      lists: {
        list: { query: listQuery },
        create: { mutate: listCreate },
        update: { mutate: listUpdate },
        delete: { mutate: listDelete },
      },
      contacts: {
        list: { query: contactsQuery },
        create: { mutate: contactsCreate },
        update: { mutate: contactsUpdate },
        delete: { mutate: contactsDelete },
      },
      testSend: { mutate: testSend },
    },
  }),
}));

const workspace: Organization = {
  id: "org-1",
  name: "Ada Team",
  slug: "ada-team",
  iconUrl: null,
  kind: "team",
  planId: "sentinel",
  billingStatus: "active",
  role: "owner",
  memberCount: 2,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const onCall: ContactList = {
  id: "list-1",
  organizationId: workspace.id,
  name: "On-call",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const ada: Contact = {
  id: "contact-1",
  organizationId: workspace.id,
  listId: onCall.id,
  label: "Ada",
  channel: "email",
  destination: "ada@orvex.dev",
  verified: true,
  enabled: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

function renderView(organization: Organization = workspace) {
  return render(
    <MemoryRouter>
      <ContactListsView organization={organization} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  listQuery.mockReset();
  listCreate.mockReset();
  listUpdate.mockReset();
  listDelete.mockReset();
  contactsQuery.mockReset();
  contactsCreate.mockReset();
  contactsUpdate.mockReset();
  contactsDelete.mockReset();
  testSend.mockReset();
  listQuery.mockResolvedValue([onCall]);
  contactsQuery.mockResolvedValue([ada]);
  listCreate.mockResolvedValue({
    ...onCall,
    id: "list-2",
    name: "Night",
  });
  contactsCreate.mockResolvedValue({
    ...ada,
    id: "contact-2",
    label: "Pager",
    destination: "pager@orvex.dev",
  });
  testSend.mockResolvedValue({
    id: "delivery-1",
    contactId: ada.id,
    incidentId: null,
    channel: "email",
    status: "skipped",
    providerId: null,
    error: "SMTP is not configured",
    createdAt: "2026-01-01T00:00:00.000Z",
  });
});

test("lists live contact lists and destinations", async () => {
  renderView();

  expect((await screen.findAllByText("On-call")).length).toBeGreaterThan(0);
  expect(
    screen.getByRole("heading", { name: "Contact Lists" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Ada")).toBeInTheDocument();
  expect(screen.getByText("ada@orvex.dev")).toBeInTheDocument();
  expect(screen.getByText("Email")).toBeInTheDocument();
  expect(listQuery).toHaveBeenCalledWith({ organizationId: workspace.id });
  expect(contactsQuery).toHaveBeenCalledWith({
    organizationId: workspace.id,
  });
});

test("creates a named list", async () => {
  renderView();
  await screen.findAllByText("On-call");
  fireEvent.click(screen.getByRole("button", { name: "New list" }));
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Night" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create list" }));

  await vi.waitFor(() => {
    expect(listCreate).toHaveBeenCalledWith({
      organizationId: workspace.id,
      name: "Night",
    });
  });
});

test("creates a contact on the selected list", async () => {
  renderView();
  await screen.findByText("Ada");
  fireEvent.click(screen.getByRole("button", { name: "Add contact" }));
  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "Pager" },
  });
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "pager@orvex.dev" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create contact" }));

  await vi.waitFor(() => {
    expect(contactsCreate).toHaveBeenCalledWith({
      organizationId: workspace.id,
      listId: onCall.id,
      label: "Pager",
      channel: "email",
      destination: "pager@orvex.dev",
      enabled: true,
    });
  });
});

test("opens the test-send dialog and records a delivery", async () => {
  renderView();
  await screen.findByText("Ada");
  fireEvent.click(screen.getByRole("button", { name: "Test send" }));
  fireEvent.change(screen.getByLabelText("Message"), {
    target: { value: "Desk check" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send test" }));

  await vi.waitFor(() => {
    expect(testSend).toHaveBeenCalledWith({
      organizationId: workspace.id,
      contactId: ada.id,
      message: "Desk check",
    });
  });
  expect(await screen.findByText("skipped")).toBeInTheDocument();
  expect(screen.getByText("SMTP is not configured")).toBeInTheDocument();
});

test("free plan hides write actions for members and locks slack in the picker", async () => {
  listQuery.mockResolvedValue([]);
  contactsQuery.mockResolvedValue([]);
  renderView({ ...workspace, planId: "free", role: "member" });

  expect(await screen.findByText("No contact lists yet")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "New list" }),
  ).not.toBeInTheDocument();
});

test("empty catalog offers a new list to owners", async () => {
  listQuery.mockResolvedValue([]);
  contactsQuery.mockResolvedValue([]);
  renderView();

  expect(await screen.findByText("No contact lists yet")).toBeInTheDocument();
  expect(
    screen.getAllByRole("button", { name: "New list" }).length,
  ).toBeGreaterThan(0);
});
