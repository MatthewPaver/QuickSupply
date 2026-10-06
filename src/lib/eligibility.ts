export type AvailabilityRecord = {
  date: string | null;
  dayOfWeek: number | null;
  isRecurring: boolean;
  isAvailable: boolean;
};

/**
 * Specific-date availability overrides the weekly pattern. Missing availability
 * remains opt-in compatible with the historical workflow and is therefore
 * treated as available; a production service should make that policy explicit.
 */
export function isAvailableForDate(
  entries: AvailabilityRecord[],
  requestDate: string,
): boolean {
  const dayOfWeek = new Date(`${requestDate}T00:00:00`).getDay();
  const specific = entries.find((entry) => !entry.isRecurring && entry.date === requestDate);
  if (specific) return specific.isAvailable;
  const recurring = entries.find(
    (entry) => entry.isRecurring && entry.dayOfWeek === dayOfWeek,
  );
  return recurring ? recurring.isAvailable : true;
}

export function isNightBeforeContactAllowed(
  contactNightBeforeOnly: boolean,
  requestDate: string,
  today = new Date(),
): boolean {
  if (!contactNightBeforeOnly) return true;
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const tomorrow = new Date(start);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return new Date(`${requestDate}T00:00:00`) <= tomorrow;
}
