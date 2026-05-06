import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import type { SessionSet, Unit } from "@/db/schema";
import {
  getLatestSetForExercise,
  getSessionSetsForExercise,
  rememberAvailableWeight,
  upsertSet,
} from "@/db/queries";
import type { RoutineExerciseFull } from "@/db/queries";
import { fmtWeight } from "@/lib/units";
import { SetRow } from "./SetRow";

interface Props {
  routineExercise: RoutineExerciseFull;
  sessionId: string;
  defaultUnit: Unit;
  onSetCompleted: (restSeconds: number) => void;
}

export function ExerciseCard({
  routineExercise,
  sessionId,
  defaultUnit,
  onSetCompleted,
}: Props) {
  const { t } = useTranslation();
  const ex = routineExercise.exercise;

  const sets = useLiveQuery(
    () => getSessionSetsForExercise(sessionId, ex.id),
    [sessionId, ex.id],
    [] as SessionSet[]
  );

  const [latestPrior, setLatestPrior] = useState<SessionSet | null>(null);
  useEffect(() => {
    let cancelled = false;
    void getLatestSetForExercise(ex.id).then((s) => {
      if (cancelled) return;
      // exclude sets from the current session
      if (s && s.session_id !== sessionId) setLatestPrior(s);
      else if (s && s.session_id === sessionId) setLatestPrior(null);
      else setLatestPrior(null);
    });
    return () => {
      cancelled = true;
    };
  }, [ex.id, sessionId, sets?.length]);

  const targetSets = routineExercise.target_sets;
  const rows = useMemo(() => {
    const arr: { setNumber: number; data?: SessionSet }[] = [];
    const max = Math.max(targetSets, sets?.length ?? 0);
    for (let i = 1; i <= max; i++) {
      arr.push({
        setNumber: i,
        data: sets?.find((s) => s.set_number === i),
      });
    }
    return arr;
  }, [sets, targetSets]);

  async function handleCommit(setNumber: number, patch: Partial<SessionSet>) {
    const existing = sets?.find((s) => s.set_number === setNumber);
    const next: SessionSet = {
      id: existing?.id ?? crypto.randomUUID(),
      session_id: sessionId,
      exercise_id: ex.id,
      set_number: setNumber,
      weight_value: existing?.weight_value,
      weight_unit: existing?.weight_unit ?? defaultUnit,
      weight_mode: existing?.weight_mode ?? ex.default_weight_mode,
      reps: existing?.reps,
      rpe: existing?.rpe,
      completed_at: existing?.completed_at,
      ...patch,
    };
    await upsertSet(next);
    if (next.weight_value !== undefined && next.weight_unit) {
      void rememberAvailableWeight({
        location: "home",
        equipment: ex.equipment,
        value: next.weight_value,
        unit: next.weight_unit,
      });
    }
  }

  async function handleToggleComplete(setNumber: number) {
    const existing = sets?.find((s) => s.set_number === setNumber);
    const isDone = Boolean(existing?.completed_at);
    const next: SessionSet = {
      id: existing?.id ?? crypto.randomUUID(),
      session_id: sessionId,
      exercise_id: ex.id,
      set_number: setNumber,
      weight_value: existing?.weight_value,
      weight_unit: existing?.weight_unit ?? defaultUnit,
      weight_mode: existing?.weight_mode ?? ex.default_weight_mode,
      reps: existing?.reps,
      rpe: existing?.rpe,
      completed_at: isDone ? undefined : new Date().toISOString(),
    };
    await upsertSet(next);
    if (!isDone) onSetCompleted(routineExercise.rest_seconds);
  }

  const targetLabel = `${targetSets} × ${routineExercise.target_reps_min}-${routineExercise.target_reps_max}`;

  return (
    <article className="card flex flex-col gap-2">
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold leading-tight">{ex.name_es}</h3>
        <span className="text-xs text-slate-500 tabular-nums">{targetLabel}</span>
      </header>

      {latestPrior && (
        <p className="text-xs text-slate-500">
          {t("exercise.lastTime")}:{" "}
          <span className="font-medium text-slate-700">
            {latestPrior.weight_value !== undefined && latestPrior.weight_unit
              ? fmtWeight({
                  value: latestPrior.weight_value,
                  unit: latestPrior.weight_unit,
                  mode: latestPrior.weight_mode ?? "barbell",
                })
              : "—"}
            {latestPrior.reps !== undefined ? ` × ${latestPrior.reps}` : ""}
          </span>
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <SetRow
            key={row.setNumber}
            setNumber={row.setNumber}
            data={row.data}
            defaultMode={ex.default_weight_mode}
            defaultUnit={defaultUnit}
            onCommit={(patch) => void handleCommit(row.setNumber, patch)}
            onComplete={() => void handleToggleComplete(row.setNumber)}
          />
        ))}
      </div>
    </article>
  );
}
