import { describe, expect, it } from "vitest";

import { isAvailableForDate, isNightBeforeContactAllowed } from "./eligibility";

describe("assignment eligibility", () => {
  it("does not let a specific-date block get overridden by preference", () => {
    const available = isAvailableForDate(
      [
        { date: null, dayOfWeek: 2, isRecurring: true, isAvailable: true },
        { date: "2026-08-11", dayOfWeek: null, isRecurring: false, isAvailable: false },
      ],
      "2026-08-11",
    );
    expect(available).toBe(false);
  });

  it("enforces night-before contact timing", () => {
    const today = new Date("2026-08-11T10:00:00Z");
    expect(isNightBeforeContactAllowed(true, "2026-08-12", today)).toBe(true);
    expect(isNightBeforeContactAllowed(true, "2026-08-13", today)).toBe(false);
  });
});
