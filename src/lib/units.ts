import type { Unit, WeightMode } from "@/db/schema";

export const KG_TO_LB = 2.2046226218;

export function kgToLb(kg: number): number {
  return kg * KG_TO_LB;
}

export function lbToKg(lb: number): number {
  return lb / KG_TO_LB;
}

/** Convert from one unit to another. Idempotent if `from === to`. */
export function convert(value: number, from: Unit, to: Unit): number {
  if (from === to) return value;
  return from === "kg" ? kgToLb(value) : lbToKg(value);
}

/** Round to a sensible plate increment for the given unit. */
export function roundToIncrement(value: number, unit: Unit, increment?: number): number {
  const inc = increment ?? (unit === "kg" ? 0.5 : 1);
  return Math.round(value / inc) * inc;
}

/** Format a number trimming trailing zeros (14.5 -> "14.5", 20.0 -> "20"). */
export function fmtNum(n: number, maxFrac = 2): string {
  return Number(n.toFixed(maxFrac))
    .toString()
    .replace(/\.0+$/, "");
}

export interface WeightDisplayOpts {
  value: number;
  unit: Unit;
  mode: WeightMode;
  /** Optional asymmetric values for per_side mode (e.g. [10, 12.5]) */
  asymmetric?: [number, number];
}

/**
 * Format a weight for display.
 * per_side  -> "14.5×14.5 kg"
 * pair_total -> "8+8 kg" (16 total)
 * barbell    -> "30 kg"
 * bodyweight -> "BW"
 */
export function fmtWeight(opts: WeightDisplayOpts): string {
  const { value, unit, mode, asymmetric } = opts;
  if (mode === "bodyweight") return "BW";
  if (mode === "per_side") {
    if (asymmetric) {
      return `${fmtNum(asymmetric[0])}×${fmtNum(asymmetric[1])} ${unit}`;
    }
    return `${fmtNum(value)}×${fmtNum(value)} ${unit}`;
  }
  if (mode === "pair_total") {
    const half = value / 2;
    return `${fmtNum(half)}+${fmtNum(half)} ${unit}`;
  }
  return `${fmtNum(value)} ${unit}`;
}

/** Total weight lifted in one rep (both hands / both sides), useful for volume calc. */
export function totalWeight(opts: { value: number; mode: WeightMode }): number {
  if (opts.mode === "per_side") return opts.value * 2;
  if (opts.mode === "pair_total") return opts.value;
  if (opts.mode === "barbell") return opts.value;
  return 0;
}
