/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import { PublicStatusPage } from "./public-status-page.js";
import type { StatusPagePublicPayload } from "@/components/status/status-helpers";

const publicGet = vi.fn();
const subscribe = vi.fn();
const confirmSubscriber = vi.fn();

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => ({
    statusPage: {
      publicGet: { query: publicGet },
      subscribe: { mutate: subscribe },
      confirmSubscriber: { mutate: confirmSubscriber },
    },
  }),
}));

const payload: StatusPagePublicPayload = {
  page: {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Ada Status",
    slug: "ada-status",
    visibility: "unlisted",
    theme: { accent: "#0f766e", logoUrl: null },
    hideBranding: false,
    customDomain: null,
  },
  components: [
    {
      id: "c1",
      monitorId: "m1",
      displayName: "API",
      sort: 0,
      status: "degraded",
    },
  ],
  incidents: [
    {
      id: "i1",
      summary: "API is slow",
      severity: "degraded",
      status: "open",
      startedAt: "2026-01-01T00:00:00.000Z",
      updates: [
        {
          id: "u1",
          body: "Investigating latency",
          createdAt: "2026-01-01T00:05:00.000Z",
        },
      ],
    },
  ],
  maintenance: {
    id: "w1",
    title: "Scheduled work",
    body: "Database failover",
    startsAt: "2026-01-01T01:00:00.000Z",
    endsAt: "2026-01-01T02:00:00.000Z",
  },
};

beforeEach(() => {
  publicGet.mockReset();
  subscribe.mockReset();
  confirmSubscriber.mockReset();
  publicGet.mockResolvedValue(payload);
  confirmSubscriber.mockResolvedValue({
    id: "s1",
    statusPageId: payload.page.id,
    email: "ada@orvex.dev",
    confirmedAt: "2026-01-01T00:10:00.000Z",
    unsubscribedAt: null,
  });
  subscribe.mockResolvedValue({
    subscriber: {
      id: "s1",
      statusPageId: payload.page.id,
      email: "ada@orvex.dev",
      confirmedAt: null,
      unsubscribedAt: null,
    },
  });
});

test("public status page loads live components incidents and maintenance", async () => {
  render(
    <MemoryRouter
      initialEntries={["/s/ada-status?org=lovelace-lab&token=secret"]}
    >
      <Routes>
        <Route path="/s/:pageSlug" element={<PublicStatusPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(
    await screen.findByRole("heading", { name: "Ada Status" }),
  ).toBeInTheDocument();
  expect(screen.getByText("API")).toBeInTheDocument();
  expect(screen.getByText("Degraded performance")).toBeInTheDocument();
  expect(screen.getByText("API is slow")).toBeInTheDocument();
  expect(screen.getByText("Investigating latency")).toBeInTheDocument();
  expect(screen.getByText("Scheduled work")).toBeInTheDocument();
  expect(screen.getByText("Powered by Orvex Monitor")).toBeInTheDocument();
  expect(publicGet).toHaveBeenCalledWith({
    pageSlug: "ada-status",
    organizationSlug: "lovelace-lab",
    token: "secret",
  });

  fireEvent.click(screen.getByRole("button", { name: "Subscribe" }));
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "ada@orvex.dev" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Subscribe" }));
  await vi.waitFor(() => {
    expect(subscribe).toHaveBeenCalledWith({
      pageSlug: "ada-status",
      email: "ada@orvex.dev",
      organizationSlug: "lovelace-lab",
      token: "secret",
    });
  });
});

test("public status page is a designed miss without access", async () => {
  publicGet.mockRejectedValue(new Error("Status page not found"));
  render(
    <MemoryRouter initialEntries={["/s/missing-page"]}>
      <Routes>
        <Route path="/s/:pageSlug" element={<PublicStatusPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(
    await screen.findByRole("heading", { name: "Status page not found" }),
  ).toBeInTheDocument();
});

test("public status page confirms a subscriber from the confirm query", async () => {
  render(
    <MemoryRouter initialEntries={["/s/ada-status?confirm=confirm-token"]}>
      <Routes>
        <Route path="/s/:pageSlug" element={<PublicStatusPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(
    await screen.findByText("Subscription confirmed."),
  ).toBeInTheDocument();
  expect(confirmSubscriber).toHaveBeenCalledWith({ token: "confirm-token" });
});
