import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module before importing the function under test
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    get: vi.fn().mockReturnValue(undefined),
  },
}));

import { lookupPayRate } from "./pay-rate-lookup";
import { db } from "@/lib/db";

describe("lookupPayRate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no rates configured", () => {
    const result = lookupPayRate("teacher", "school-1", "2026-03-15");
    expect(result).toBeNull();
  });

  it("returns school-specific rate when available", () => {
    // First call (school-specific) returns a rate
    vi.mocked(db.select().from(undefined as never).where(undefined as never).orderBy(undefined as never).get)
      .mockReturnValueOnce({ payRate: 1500, chargeRate: 2200 });

    const result = lookupPayRate("teacher", "school-1", "2026-03-15");
    expect(result).toEqual({ payRate: 1500, chargeRate: 2200 });
  });

  it("falls back to default rate when no school-specific rate exists", () => {
    // First call (school-specific) returns nothing
    // Second call (default) returns a rate
    const getMock = vi.fn()
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ payRate: 1200, chargeRate: 1800 });

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            get: getMock,
          }),
        }),
      }),
    } as never);

    const result = lookupPayRate("teacher", "school-1", "2026-03-15");
    expect(result).toEqual({ payRate: 1200, chargeRate: 1800 });
  });
});
