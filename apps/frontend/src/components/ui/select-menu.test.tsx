/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { SelectMenu } from "./select-menu.js";

const OPTIONS = [
  { value: "http", label: "HTTP" },
  { value: "keyword", label: "Keyword" },
  { value: "heartbeat", label: "Heartbeat" },
  { value: "port", label: "Port" },
] as const;

function Harness({
  initial = "http",
  disabled = false,
  error = false,
}: {
  initial?: string | null;
  disabled?: boolean;
  error?: boolean;
}) {
  return (
    <SelectMenu
      id="monitor-type"
      name="type"
      labelledBy="type-label"
      value={initial}
      disabled={disabled}
      error={error}
      options={OPTIONS}
      onValueChange={() => undefined}
    />
  );
}

test("opens the list and chooses an option", () => {
  const onValueChange = vi.fn();
  render(
    <div>
      <span id="type-label">Type</span>
      <SelectMenu
        id="monitor-type"
        labelledBy="type-label"
        value="http"
        options={OPTIONS}
        onValueChange={onValueChange}
      />
    </div>,
  );

  const trigger = screen.getByRole("combobox", { name: "Type" });
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");

  const list = screen.getByRole("listbox");
  expect(list).toBeInTheDocument();
  fireEvent.click(screen.getByRole("option", { name: "Heartbeat" }));
  expect(onValueChange).toHaveBeenCalledWith("heartbeat");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});

test("keyboard opens, moves, and commits with enter", () => {
  const onValueChange = vi.fn();
  render(
    <SelectMenu
      aria-label="Monitor type"
      value="http"
      options={OPTIONS}
      onValueChange={onValueChange}
    />,
  );

  const trigger = screen.getByRole("combobox", { name: "Monitor type" });
  trigger.focus();
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  expect(screen.getByRole("listbox")).toBeInTheDocument();

  const list = screen.getByRole("listbox");
  fireEvent.keyDown(list, { key: "ArrowDown" });
  fireEvent.keyDown(list, { key: "Enter" });
  expect(onValueChange).toHaveBeenCalledWith("keyword");
});

test("escape and outside pointer close the menu", () => {
  render(
    <div>
      <button type="button">Away</button>
      <SelectMenu
        aria-label="Monitor type"
        value="http"
        options={OPTIONS}
        onValueChange={() => undefined}
      />
    </div>,
  );

  fireEvent.click(screen.getByRole("combobox", { name: "Monitor type" }));
  expect(screen.getByRole("listbox")).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("combobox", { name: "Monitor type" }));
  fireEvent.pointerDown(screen.getByRole("button", { name: "Away" }));
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});

test("typeahead highlights a matching option", () => {
  const onValueChange = vi.fn();
  render(
    <SelectMenu
      aria-label="Monitor type"
      value="http"
      options={OPTIONS}
      onValueChange={onValueChange}
    />,
  );

  const trigger = screen.getByRole("combobox", { name: "Monitor type" });
  trigger.focus();
  fireEvent.keyDown(trigger, { key: "p" });
  expect(screen.getByRole("listbox")).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole("listbox"), { key: "Enter" });
  expect(onValueChange).toHaveBeenCalledWith("port");
});

test("disabled trigger does not open", () => {
  render(<Harness disabled />);
  const trigger = screen.getByRole("combobox");
  expect(trigger).toBeDisabled();
  fireEvent.click(trigger);
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});

test("error state marks the trigger invalid", () => {
  render(<Harness error />);
  expect(screen.getByRole("combobox")).toHaveAttribute("aria-invalid", "true");
});
