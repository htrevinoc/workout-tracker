import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SessionSet, Unit, WeightMode } from "@/db/schema";
import { WeightInput } from "./WeightInput";

interface Props {
  setNumber: number;
  data?: SessionSet;
  defaultMode: WeightMode;
  defaultUnit: Unit;
  onCommit: (patch: Partial<SessionSet>) => void;
  onComplete: () => void; // user pressed the check
}

export function SetRow({ setNumber, data, defaultMode, defaultUnit, onCommit, onComplete }: Props) {
  const { t } = useTranslation();
  const completed = Boolean(data?.completed_at);

  const [reps, setReps] = useState<string>(data?.reps !== undefined ? String(data.reps) : "");

  const commitReps = (raw: string) => {
    const n = Number.parseInt(raw, 10);
    onCommit({ reps: Number.isNaN(n) ? undefined : n });
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-2 py-2 ${
        completed ? "border-green-300 bg-green-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="w-8 shrink-0 text-center text-sm font-bold text-slate-500">
        {setNumber}
      </div>

      <WeightInput
        value={data?.weight_value}
        mode={data?.weight_mode ?? defaultMode}
        unit={data?.weight_unit ?? defaultUnit}
        onChange={(w) =>
          onCommit({
            weight_value: w.value,
            weight_mode: w.mode,
            weight_unit: w.unit,
          })
        }
      />

      <input
        type="text"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value.replace(/\D/g, ""))}
        onBlur={(e) => commitReps(e.target.value)}
        placeholder={t("set.reps")}
        className="w-12 rounded-lg border border-slate-300 bg-white px-1 py-1.5 text-center text-base tabular-nums focus:border-accent focus:outline-none"
      />

      <button
        type="button"
        onClick={onComplete}
        aria-label={completed ? t("set.uncheck") : t("set.check")}
        className={`ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
          completed
            ? "bg-green-500 text-white active:bg-green-600"
            : "border-2 border-slate-300 bg-white text-slate-400 active:bg-slate-100"
        }`}
      >
        {completed ? "✓" : "○"}
      </button>
    </div>
  );
}
