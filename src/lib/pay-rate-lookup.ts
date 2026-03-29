import { eq, and, lte, isNull, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { payRates } from "@/lib/db/schema";

/**
 * Look up the applicable pay rate for a given role, school, and booking date.
 *
 * Strategy: first try a school-specific rate where effectiveFrom <= bookingDate,
 * ordered by effectiveFrom desc (most recent). If none found, fall back to the
 * default rate (schoolId IS NULL).
 *
 * Returns pay and charge rates in pence, or null if no rate is configured.
 */
export function lookupPayRate(
  roleType: string,
  schoolId: string,
  bookingDate: string
): { payRate: number; chargeRate: number } | null {
  // Try school-specific rate first
  const schoolRate = db
    .select({
      payRate: payRates.payRate,
      chargeRate: payRates.chargeRate,
    })
    .from(payRates)
    .where(
      and(
        eq(payRates.roleType, roleType as "teacher" | "ta"),
        eq(payRates.schoolId, schoolId),
        lte(payRates.effectiveFrom, bookingDate)
      )
    )
    .orderBy(desc(payRates.effectiveFrom))
    .get();

  if (schoolRate) {
    return { payRate: schoolRate.payRate, chargeRate: schoolRate.chargeRate };
  }

  // Fall back to default rate (schoolId IS NULL)
  const defaultRate = db
    .select({
      payRate: payRates.payRate,
      chargeRate: payRates.chargeRate,
    })
    .from(payRates)
    .where(
      and(
        eq(payRates.roleType, roleType as "teacher" | "ta"),
        isNull(payRates.schoolId),
        lte(payRates.effectiveFrom, bookingDate)
      )
    )
    .orderBy(desc(payRates.effectiveFrom))
    .get();

  if (defaultRate) {
    return { payRate: defaultRate.payRate, chargeRate: defaultRate.chargeRate };
  }

  return null;
}
