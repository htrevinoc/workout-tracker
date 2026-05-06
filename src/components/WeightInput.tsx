import { useEffect, useState } from "react";
import type { Unit, WeightMode } from "@/db/schema";
import { fmtNum } from "@/lib/units";

const MODE_LABEL: Record<WeightMode, string> = {
  per_side: "×",
  pair_total: "+",
  barbell: "≡",
  bodyweight: "BW",
};

interface Props {
  value: number | undefined;
  mode: WeightMode;
  unit: Unit;
  onChange: (v: { value: number | undefined; mode: WeightMode; unit: Unit }) => void;
  /** Mode options to expose. Defaults to ["per_side","pair_total","barbell"]. */
  modes?: WeightMode[];
}

export function WeightInput({
  value,
  mode,
  unit,
  onChange,
  modes = ["per_side", "pair_total", "barbell"],
}: Props) {
  const [text, setText] = useState(value !== undefined ? fmtNum(value) : "");

  useEffect(() => {
    setText(value !== undefined ? fmtNum(value) : "");
  }, [value]);

  const commit = (raw: string) => {
    const parsed = raw.replace(",", ".").trim();
    if (parsed === "") {
      onChange({ value: undefined, mode, unit });
      return;
    }
    const n = Number.parseFloat(parsed);
    if (Number.isNaN(n)) return;
    onChange({ value: n, mode, unit });
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex overflow-hidden rounded-lg border border-slate-200">
        {modes.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange({ value, mode: m, unit })}
            className={`w-7 py-1.5 text-xs font-semibold ${
              mode === m
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-500 active:bg-slate-100"
            }`}
            aria-label={`mode ${m}`}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        placeholder="—"
        className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-right text-base tabular-nums focus:border-accent focus:outline-none"
      />
      <button
        type="button"
        onClick={() => onChange({ value, mode, unit: unit === "kg" ? "lb" : "kg" })}
        className="w-9 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-600 active:bg-slate-100"
      >
        {unit}
      </button>
    </div>
  );
}
