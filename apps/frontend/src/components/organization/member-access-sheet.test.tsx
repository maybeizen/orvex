/** @vitest-environment jsdom */
import { presetPermissionMask } from "@orvex/access";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { MemberAccessSheet } from "./member-access-sheet.js";
import { emptyMemberDraft } from "@/lib/member-access";
import { useState } from "react";

function SheetHarness() {
  const [draft, setDraft] = useState(emptyMemberDraft());
  return (
    <MemberAccessSheet
      open
      onOpenChange={() => undefined}
      title="Invite member"
      description="Send an email invitation with a preset or custom access mask."
      email="grace@orvex.dev"
      onEmailChange={() => undefined}
      draft={draft}
      onDraftChange={setDraft}
      callerMask={presetPermissionMask("owner")}
      pending={false}
      submitLabel="Send invite"
      onSubmit={() => undefined}
    />
  );
}

test("access sheet shows the member access code and updates on admin", () => {
  render(<SheetHarness />);

  expect(screen.getByText(presetPermissionMask("member"))).toBeInTheDocument();
  fireEvent.click(screen.getByRole("radio", { name: "Admin" }));
  expect(screen.getByText(presetPermissionMask("admin"))).toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toHaveValue("grace@orvex.dev");
  expect(
    screen.getByRole("button", { name: "Copy access code" }),
  ).toBeEnabled();
});
