import { ValueTransformer } from 'typeorm';

/**
 * Money crosses the wire as a fixed 2-decimal string ("1234.56") — never a
 * float (PLAN.md §2). SQLite stores decimal columns as numbers, so hydration
 * is where the normalization happens.
 */
export const moneyTransformer: ValueTransformer = {
  to: (value) => value,
  from: (value) =>
    value === null || value === undefined ? value : Number(value).toFixed(2),
};

/**
 * Date columns are stored as 'YYYY-MM-DD'. Hydration returns a Date at UTC
 * midnight so JSON serialization (`2026-01-01T00:00:00.000Z`) never shifts
 * the day in negative UTC offsets (e.g. UTC−3).
 *
 * When writing, a Date is converted through `toISOString()` (UTC), keeping
 * the stored day consistent with the value the service intended to save.
 */
export const dateTransformer: ValueTransformer = {
  to: (value) => {
    if (value === null || value === undefined) {
      return value;
    }
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    return String(value).slice(0, 10);
  },
  from: (value) => {
    if (value === null || value === undefined) {
      return value;
    }
    return new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
  },
};
