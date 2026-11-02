/** Keep fictional cover requests on weekdays without changing other seed dates. */
export function coverSeedDate(offsetDays: number, base = new Date()): string {
  const date = new Date(base);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  const direction = offsetDays < 0 ? -1 : 1;
  while (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
    date.setUTCDate(date.getUTCDate() + direction);
  }
  return date.toISOString().slice(0, 10);
}
