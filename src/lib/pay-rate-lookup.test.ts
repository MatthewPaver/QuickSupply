import { describe, it, expect, vi, beforeEach } from "vitest";

type RateRow = { payRate: number; chargeRate: number } | undefined;

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn<() => RateRow>(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    get: getMock,
  },
}));

import { lookupPayRate } from "./pay-rate-lookup";

describe("lookupPayRate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMock.mockReturnValue(undefined);
  });

  it("returns null when no rates configured", () => {
    const result = lookupPayRate("teacher", "school-1", "2026-03-15");
    expect(result).toBeNull();
  });

  it("returns school-specific rate when available", () => {
    // First call (school-specific) returns a rate
    getMock.mockReturnValueOnce({ payRate: 1500, chargeRate: 2200 });

    const result = lookupPayRate("teacher", "school-1", "2026-03-15");
    expect(result).toEqual({ payRate: 1500, chargeRate: 2200 });
  });

  it("falls back to default rate when no school-specific rate exists", () => {
    // First call (school-specific) returns nothing
    // Second call (default) returns a rate
    getMock
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ payRate: 1200, chargeRate: 1800 });

    const result = lookupPayRate("teacher", "school-1", "2026-03-15");
    expect(result).toEqual({ payRate: 1200, chargeRate: 1800 });
  });
});
