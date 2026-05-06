/**
 * Program / week / today helpers.
 * Convention: program starts on `start_date`. Routines are scheduled by weekday:
 *   Mon (1) -> Upper Push, Wed (3) -> Lower, Fri (5) -> Upper Pull.
 * Tue/Thu/Sat are OTF (no lifting routine). Sun is rest.
 *
 * Routines are matched by `name_en` (case-insensitive contains) so the user
 * can rename them in Spanish without breaking the schedule.
 */

export interface Routine {
  id: string;
  name_es: string;
  name_en: string;
}

const WEEKDAY_TO_KEYWORD: Record<number, string> = {
  1: "push",
  3: "lower",
  5: "pull",
};

export function programWeek(startDate: string, today: Date = new Date()): number {
  const start = new Date(startDate + "T00:00:00");
  const ms = today.getTime() - start.getTime();
  if (ms < 0) return 1;
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000)) + 1;
}

/** Resolve which routine corresponds to today, if any. */
export function todayRoutine(routines: Routine[], today: Date = new Date()): Routine | null {
  const keyword = WEEKDAY_TO_KEYWORD[today.getDay()];
  if (!keyword) return null;
  return (
    routines.find((r) => r.name_en.toLowerCase().includes(keyword)) ??
    routines.find((r) => r.name_es.toLowerCase().includes(keyword)) ??
    null
  );
}

export function isOTFDay(today: Date = new Date()): boolean {
  const d = today.getDay();
  return d === 2 || d === 4 || d === 6; // Tue, Thu, Sat
}

export function isRestDay(today: Date = new Date()): boolean {
  return today.getDay() === 0; // Sun
}

export function todayISO(today: Date = new Date()): string {
  return today.toISOString().slice(0, 10);
}

/** Return YYYY-MM-DD for the start of today in local timezone (not UTC). */
export function todayLocalISO(today: Date = new Date()): string {
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
