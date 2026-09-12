import { expect, test } from "vitest";
import {
  formatCents,
  formatLedgerDate,
  orderKindLabel,
  titleStatus,
} from "./format.js";

test("formatCents uses the invoice currency", () => {
  expect(formatCents(1200, "usd")).toBe("$12");
  expect(formatCents(3240, "usd")).toBe("$32.40");
});

test("formatLedgerDate and labels stay readable", () => {
  expect(formatLedgerDate(null)).toBe("—");
  expect(titleStatus("past_due")).toBe("Past Due");
  expect(orderKindLabel("checkout")).toBe("Checkout");
});
