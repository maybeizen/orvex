/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ChannelPicker } from "./channel-picker.js";

test("channel picker disables destinations the plan does not include", () => {
  const onValueChange = vi.fn();
  render(
    <ChannelPicker planId="free" value="email" onValueChange={onValueChange} />,
  );

  fireEvent.click(screen.getByRole("combobox", { name: "Channel" }));
  const slack = screen.getByRole("option", { name: /Slack/ });
  expect(slack).toHaveAttribute("aria-disabled", "true");
  fireEvent.click(slack);
  expect(onValueChange).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("option", { name: "Email" }));
  expect(onValueChange).toHaveBeenCalledWith("email");
});

test("channel picker accepts slack on probe", () => {
  const onValueChange = vi.fn();
  render(
    <ChannelPicker
      planId="probe"
      value="email"
      onValueChange={onValueChange}
    />,
  );

  fireEvent.click(screen.getByRole("combobox", { name: "Channel" }));
  fireEvent.click(screen.getByRole("option", { name: "Slack" }));
  expect(onValueChange).toHaveBeenCalledWith("slack");
});
