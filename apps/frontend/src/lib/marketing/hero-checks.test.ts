import { expect, test } from "vitest";
import { countHeroChecksByStatus, HERO_CHECKS } from "./hero-checks.js";

test("hero checks expose a mixed live sweep", () => {
  expect(countHeroChecksByStatus(HERO_CHECKS)).toEqual({
    up: 2,
    down: 1,
    warn: 1,
  });
});
