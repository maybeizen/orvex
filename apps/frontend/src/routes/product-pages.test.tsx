/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { expect, test } from "vitest";
import type { AuthUser, Organization } from "@orvex/types";
import { IncidentDetailPage } from "./incident-detail-page.js";
import { IncidentsPage } from "./incidents-page.js";
import { MonitorCreatePage } from "./monitor-create-page.js";
import { MonitorDetailPage } from "./monitor-detail-page.js";
import { MonitorsPage } from "./monitors-page.js";
import { StatusPageDetailPage } from "./status-page-detail-page.js";
import { StatusPagesPage } from "./status-pages-page.js";
import { useOrgStore } from "@/stores/org-store";
import { useSessionStore } from "@/stores/session-store";

const ada: AuthUser = {
  id: "user-1",
  email: "ada@orvex.dev",
  emailConfirmedAt: "2026-01-01T00:00:00.000Z",
  newEmail: null,
  firstName: "Ada",
  lastName: "Lovelace",
  username: "ada",
  displayName: "Ada Lovelace",
  avatarUrl: null,
};

const workspace: Organization = {
  id: "org-1",
  name: "Lovelace Lab",
  slug: "lovelace-lab",
  iconUrl: null,
  kind: "team",
  planId: "sentinel",
  billingStatus: "active",
  role: "owner",
};

function signIn(): void {
  useSessionStore.setState({ status: "ready", user: ada });
  useOrgStore.getState().hydrate([workspace], workspace.id);
}

test("monitors list asks guests to sign in", () => {
  useSessionStore.setState({ status: "ready", user: null });
  render(
    <MemoryRouter>
      <MonitorsPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Monitors" })).toBeInTheDocument();
  expect(screen.getByText("Sign in to see your monitors.")).toBeInTheDocument();
});

test("monitors list shows a designed empty catalog", () => {
  signIn();
  render(
    <MemoryRouter>
      <MonitorsPage />
    </MemoryRouter>,
  );

  expect(screen.getByText("No monitors on this frequency")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Create monitor" })).toHaveAttribute(
    "href",
    "/monitors/new",
  );
  expect(
    screen.getByRole("searchbox", { name: "Filter monitors" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Down" }));
  expect(screen.getByText("No monitors on this frequency")).toBeInTheDocument();
});

test("new monitor form validates and reports the core is offline", () => {
  signIn();
  render(
    <MemoryRouter>
      <MonitorCreatePage />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Arm monitor" }));
  expect(screen.getByText("Name is required.")).toBeInTheDocument();
  expect(screen.getByText("Target is required.")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "api-prod" },
  });
  fireEvent.change(screen.getByLabelText("URL"), {
    target: { value: "https://api.example.com/health" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Arm monitor" }));

  expect(screen.getByText("Check accepted locally")).toBeInTheDocument();
  expect(
    screen.getByText(/The monitoring core is not connected/),
  ).toBeInTheDocument();
});

test("monitor detail is a designed miss when the catalog is empty", () => {
  signIn();
  render(
    <MemoryRouter initialEntries={["/monitors/chk-1"]}>
      <Routes>
        <Route path="/monitors/:monitorId" element={<MonitorDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Monitor not on frequency" }),
  ).toBeInTheDocument();
  expect(screen.getByText("chk-1 is not a known check")).toBeInTheDocument();
});

test("incidents page shows a clear board", () => {
  signIn();
  render(
    <MemoryRouter>
      <IncidentsPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Incidents" }),
  ).toBeInTheDocument();
  expect(screen.getByText("No incidents on record")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "open" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("incident detail is a designed miss", () => {
  signIn();
  render(
    <MemoryRouter initialEntries={["/incidents/inc-9"]}>
      <Routes>
        <Route path="/incidents/:incidentId" element={<IncidentDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Incident not found" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText("inc-9 is not a stored incident"),
  ).toBeInTheDocument();
});

test("status pages show an unpublished empty state", () => {
  signIn();
  render(
    <MemoryRouter>
      <StatusPagesPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Status pages" }),
  ).toBeInTheDocument();
  expect(screen.getByText("No status page published")).toBeInTheDocument();
  expect(screen.getAllByText("1 page").length).toBeGreaterThan(0);
});

test("status page detail is a designed miss", () => {
  signIn();
  render(
    <MemoryRouter initialEntries={["/status-pages/pub-1"]}>
      <Routes>
        <Route
          path="/status-pages/:pageId"
          element={<StatusPageDetailPage />}
        />
      </Routes>
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Status page not found" }),
  ).toBeInTheDocument();
});
