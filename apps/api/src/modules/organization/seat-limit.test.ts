import { expect, test } from "vitest";
import {
  occupancyAfterMemberInsert,
  seatLimitExceeded,
  seatLimitForOrganization,
} from "./seat-limit.js";

test("pending checkout uses the free seat limit", () => {
  expect(seatLimitForOrganization("team", "probe", "pending_checkout")).toBe(2);
  expect(seatLimitForOrganization("team", "probe", "active")).toBe(3);
  expect(seatLimitForOrganization("team", "command", "past_due")).toBe(2);
  expect(seatLimitForOrganization("single", "probe", "active")).toBe(1);
});

test("accepting the invite that fills the last seat stays within the limit", () => {
  const limit = seatLimitForOrganization("team", "free", "active");
  const lastSeat = occupancyAfterMemberInsert({
    activeMembersIncludingNew: 2,
    pendingInvites: 1,
    newMemberMatchesPendingInvite: true,
  });
  expect(limit).toBe(2);
  expect(seatLimitExceeded(lastSeat, limit)).toBe(false);

  const extraMember = occupancyAfterMemberInsert({
    activeMembersIncludingNew: 3,
    pendingInvites: 0,
    newMemberMatchesPendingInvite: false,
  });
  expect(seatLimitExceeded(extraMember, limit)).toBe(true);
});

test("a pending invite for someone else still occupies a seat", () => {
  const occupied = occupancyAfterMemberInsert({
    activeMembersIncludingNew: 2,
    pendingInvites: 1,
    newMemberMatchesPendingInvite: false,
  });
  expect(seatLimitExceeded(occupied, 2)).toBe(true);
});
