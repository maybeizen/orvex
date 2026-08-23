/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import type { AuthUser } from "@orvex/types";
import { ProfilePage } from "./profile-page.js";
import { useSessionStore } from "@/stores/session-store";

const { mockAuth, mockTrpc } = vi.hoisted(() => ({
  mockAuth: {
    updateEmail: vi.fn(),
    reauthWithPassword: vi.fn(),
    updatePassword: vi.fn(),
    verifyTotp: vi.fn(),
    enrollTotp: vi.fn(),
    challengeAndVerify: vi.fn(),
    unenroll: vi.fn(),
    discardTotpEnrollment: vi.fn(),
    listFactors: vi.fn(),
    registerPasskey: vi.fn(),
    listPasskeys: vi.fn(),
    updatePasskey: vi.fn(),
    deletePasskey: vi.fn(),
    getBrowserSession: vi.fn(),
  },
  mockTrpc: {
    profile: {
      get: { query: vi.fn() },
      updateIdentity: { mutate: vi.fn() },
      usernameAvailable: { query: vi.fn() },
    },
  },
}));

vi.mock("@/lib/passkeys", () => ({
  isPasskeysEnabled: () => true,
}));

vi.mock("@/lib/supabase", () => ({
  isAuthConfigured: () => true,
  getBrowserAuth: () => mockAuth,
  getAccessToken: async () => "token",
}));

vi.mock("@/lib/trpc", () => ({
  createVanillaTrpcClient: () => mockTrpc,
  createTrpcClient: () => mockTrpc,
  trpc: {},
}));

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

function renderProfile(user: AuthUser | null = ada) {
  useSessionStore.setState({ status: "ready", user });
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.listFactors.mockResolvedValue([]);
  mockAuth.listPasskeys.mockResolvedValue([]);
  mockAuth.getBrowserSession.mockResolvedValue({
    accessToken: "token",
    refreshToken: "refresh",
    expiresAt: 0,
    user: ada,
  });
  mockTrpc.profile.usernameAvailable.query.mockResolvedValue(true);
  mockTrpc.profile.updateIdentity.mutate.mockResolvedValue({
    username: "ada",
    firstName: "Ada",
    lastName: "Lovelace",
    avatarUrl: null,
  });
  mockTrpc.profile.get.query.mockResolvedValue({
    username: "ada",
    firstName: "Ada",
    lastName: "Lovelace",
    avatarUrl: null,
  });
});

test("profile page asks guests to sign in", () => {
  renderProfile(null);

  expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();
  expect(
    screen.getByText("Sign in to manage your account."),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/login",
  );
  expect(screen.queryByLabelText("First name")).not.toBeInTheDocument();
});

test("profile page shows identity and security in one place", async () => {
  renderProfile();

  expect(
    await screen.findByRole("heading", { name: "Ada Lovelace" }),
  ).toBeInTheDocument();
  expect(screen.getByText("@ada · ada@orvex.dev")).toBeInTheDocument();
  expect(screen.getByLabelText("First name")).toHaveValue("Ada");
  expect(screen.getByLabelText("Username")).toHaveValue("ada");
  expect(screen.getByLabelText("New email")).toBeInTheDocument();
  expect(screen.getByText("Password")).toBeInTheDocument();
  expect(screen.getByText("Authenticator app")).toBeInTheDocument();
  expect(screen.getByText("Passkeys")).toBeInTheDocument();
});

test("identity form saves name and username", async () => {
  mockTrpc.profile.updateIdentity.mutate.mockResolvedValue({
    username: "lovelace",
    firstName: "Ada",
    lastName: "Byron",
    avatarUrl: null,
  });
  renderProfile();

  fireEvent.change(await screen.findByLabelText("Last name"), {
    target: { value: "Byron" },
  });
  fireEvent.change(screen.getByLabelText("Username"), {
    target: { value: "lovelace" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

  await waitFor(() => {
    expect(mockTrpc.profile.updateIdentity.mutate).toHaveBeenCalledWith({
      username: "lovelace",
      firstName: "Ada",
      lastName: "Byron",
    });
  });
});

test("upload rejects files that are not jpeg png or webp", () => {
  renderProfile();
  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  const file = new File(["gif"], "face.gif", { type: "image/gif" });
  fireEvent.change(input, { target: { files: [file] } });

  expect(screen.queryByText("Crop your photo")).not.toBeInTheDocument();
});

test("email form sends a verification to the new address", async () => {
  mockAuth.updateEmail.mockResolvedValue({
    ...ada,
    newEmail: "ada.next@orvex.dev",
  });
  mockAuth.getBrowserSession.mockResolvedValue({
    accessToken: "token",
    refreshToken: "refresh",
    expiresAt: 0,
    user: { ...ada, newEmail: "ada.next@orvex.dev" },
  });
  renderProfile();

  fireEvent.change(await screen.findByLabelText("New email"), {
    target: { value: "ada.next@orvex.dev" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Update email" }));

  await waitFor(() => {
    expect(mockAuth.updateEmail).toHaveBeenCalledWith(
      "ada.next@orvex.dev",
      `${window.location.origin}/auth/callback`,
    );
  });
  expect(
    await screen.findByText("Confirmation sent to ada.next@orvex.dev", {
      exact: false,
    }),
  ).toBeInTheDocument();
});

test("password form rejects a mismatched confirmation", async () => {
  renderProfile();

  fireEvent.change(await screen.findByLabelText("Current password"), {
    target: { value: "old-secret1" },
  });
  fireEvent.change(screen.getByLabelText("New password"), {
    target: { value: "new-secret1" },
  });
  fireEvent.change(screen.getByLabelText("Confirm password"), {
    target: { value: "new-secret2" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));

  await waitFor(() => {
    expect(mockAuth.reauthWithPassword).not.toHaveBeenCalled();
    expect(mockAuth.updatePassword).not.toHaveBeenCalled();
  });
});

test("password form reauthenticates then updates", async () => {
  mockAuth.reauthWithPassword.mockResolvedValue({
    user: ada,
    accessToken: "token",
    mfaRequired: false,
    factorId: null,
  });
  mockAuth.updatePassword.mockResolvedValue(undefined);
  renderProfile();

  fireEvent.change(await screen.findByLabelText("Current password"), {
    target: { value: "old-secret1" },
  });
  fireEvent.change(screen.getByLabelText("New password"), {
    target: { value: "new-secret1" },
  });
  fireEvent.change(screen.getByLabelText("Confirm password"), {
    target: { value: "new-secret1" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));

  await waitFor(() => {
    expect(mockAuth.reauthWithPassword).toHaveBeenCalledWith("old-secret1");
    expect(mockAuth.updatePassword).toHaveBeenCalledWith("new-secret1");
  });
});

test("totp enable opens a QR dialog and verifies the code", async () => {
  mockAuth.enrollTotp.mockResolvedValue({
    id: "factor-1",
    type: "totp",
    friendlyName: null,
    qrCode: "data:image/svg+xml,<svg></svg>",
    secret: "ORVEXSECRET",
    uri: "otpauth://totp/Orvex",
  });
  mockAuth.challengeAndVerify.mockResolvedValue({
    user: ada,
    accessToken: "token",
    mfaRequired: false,
  });
  mockAuth.listFactors
    .mockResolvedValueOnce([])
    .mockResolvedValue([{ id: "factor-1", status: "verified" }]);
  renderProfile();

  fireEvent.click(await screen.findByRole("button", { name: "Enable" }));

  await waitFor(() => {
    expect(mockAuth.enrollTotp).toHaveBeenCalledWith({
      issuer: "Orvex",
      friendlyName: "Authenticator",
    });
  });

  expect(
    await screen.findByRole("heading", { name: "Set up authenticator" }),
  ).toBeInTheDocument();
  expect(
    await screen.findByAltText("Authenticator QR code"),
  ).toBeInTheDocument();
  expect(screen.getByText("ORVEXSECRET")).toBeInTheDocument();
  expect(
    screen.getByText(/Hover to reveal. Copy this key if you cannot scan/),
  ).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Authenticator code"), {
    target: { value: "123456" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Verify and enable" }));

  await waitFor(() => {
    expect(mockAuth.challengeAndVerify).toHaveBeenCalledWith(
      "factor-1",
      "123456",
    );
  });
});

test("passkeys can be renamed and revoked", async () => {
  mockAuth.listPasskeys.mockResolvedValue([
    {
      id: "pk-1",
      friendlyName: "Laptop",
      createdAt: "2026-01-01T00:00:00.000Z",
      lastUsedAt: null,
    },
  ]);
  mockAuth.updatePasskey.mockResolvedValue({
    id: "pk-1",
    friendlyName: "Office key",
    createdAt: "2026-01-01T00:00:00.000Z",
    lastUsedAt: null,
  });
  mockAuth.deletePasskey.mockResolvedValue(undefined);
  renderProfile();

  expect(await screen.findByText("Laptop")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Rename" }));
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Office key" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));

  await waitFor(() => {
    expect(mockAuth.updatePasskey).toHaveBeenCalledWith("pk-1", "Office key");
  });

  fireEvent.click(screen.getByRole("button", { name: "Revoke" }));
  fireEvent.click(screen.getByRole("button", { name: "Revoke passkey" }));

  await waitFor(() => {
    expect(mockAuth.deletePasskey).toHaveBeenCalledWith("pk-1");
  });
});
