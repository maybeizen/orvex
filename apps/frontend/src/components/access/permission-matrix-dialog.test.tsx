/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { PermissionMatrixDialog } from "./permission-matrix-dialog.js";

test("permission matrix marks preset bits for each role", () => {
  render(
    <PermissionMatrixDialog
      open
      role="member"
      displayName="Grace Hopper"
      onClose={vi.fn()}
    />,
  );

  expect(
    screen.getByRole("heading", { name: "Permissions" }),
  ).toBeInTheDocument();
  expect(screen.getByText(/for Grace Hopper/)).toBeInTheDocument();
  expect(screen.getByLabelText("org.settings owner")).toBeChecked();
  expect(screen.getByLabelText("org.settings member")).not.toBeChecked();
  expect(screen.getByLabelText("maintenance.write owner")).toBeChecked();
  expect(screen.getByLabelText("maintenance.write member")).not.toBeChecked();
});
