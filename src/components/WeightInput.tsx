import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Unit, WeightMode } from "@/db/schema";
import { fmtNum } from "@/lib/units";

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
  const { t } = useTranslation();
  const [text, setText] = useState(value !== undefined ? fmtNum(value) : "");

  const modeLabel: Record<WeightMode, string> = {
    per_side: t("weightMode.perSide"),
    pair_total: t("weightMode.pairTotal"),
    barbell: t("weightMode.barbell"),
    bodyweight: t("weightMode.bodyweight"),
  };
  const modeHint: Record<WeightMode, string> = {
    per_side: t("weightMode.perSideHint"),
    pair_total: t("weightMode.pairTotalHint"),
    barbell: t("weightMode.barbellHint"),
    bodyweight: t("weightMode.bodyweightHint"),
  };

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
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
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
        <div className="flex overflow-hidden rounded-lg border border-slate-200">
          {modes.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onChange({ value, mode: m, unit })}
              className={`px-2 py-1.5 text-[11px] font-semibold ${
                mode === m
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-500 active:bg-slate-100"
              }`}
              title={modeHint[m]}
              aria-label={modeHint[m]}
            >
              {modeLabel[m]}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[11px] leading-tight text-slate-400">{modeHint[mode]}</p>
    </div>
  );
}
