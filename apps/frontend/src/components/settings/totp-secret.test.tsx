/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { TotpSecret } from "./totp-secret.js";

test("backup secret is in the document and blurred until hover or focus", () => {
  render(<TotpSecret secret="ORVEXSECRET" />);

  const secret = screen.getByText("ORVEXSECRET");
  expect(secret.className).toContain("blur-md");
  expect(secret.className).toContain("group-hover:blur-none");
  expect(secret.className).toContain("group-focus-within:blur-none");
  expect(
    screen.getByRole("button", { name: "Copy backup secret" }),
  ).toBeInTheDocument();
});
