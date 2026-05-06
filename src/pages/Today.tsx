import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Unit } from "@/db/schema";
import { getOrCreateTodaySession, getRoutineExercises } from "@/db/queries";
import { isOTFDay, isRestDay, programWeek, todayRoutine } from "@/lib/program";
import { getProgramMeta } from "@/lib/seed";
import { useRestTimer } from "@/lib/timer";
import { useWakeLock } from "@/lib/wakeLock";
import { ExerciseCard } from "@/components/ExerciseCard";
import { RestTimerSheet } from "@/components/RestTimerSheet";
import { ActivitySelector, type ActivityChoice } from "@/components/ActivitySelector";

export function TodayPage() {
  const { t } = useTranslation();

  const routines = useLiveQuery(() => db.routines.toArray(), [], []);
  const settings = useLiveQuery(
    async () => {
      const rows = await db.settings.toArray();
      const map: Record<string, unknown> = {};
      for (const r of rows) map[r.key] = r.value;
      return map;
    },
    [],
    {} as Record<string, unknown>
  );

  const [meta, setMeta] = useState<{ start_date?: string } | null>(null);
  useEffect(() => {
    void getProgramMeta().then((m) => setMeta(m ?? null));
  }, []);

  const defaultUnit = (settings.unit as Unit | undefined) ?? "kg";
  const wakeLockEnabled = Boolean(settings.wake_lock);
  useWakeLock(wakeLockEnabled);

  const suggested: ActivityChoice = useMemo(() => {
    if (isRestDay()) return { type: "rest" };
    if (isOTFDay()) return { type: "otf" };
    const r = todayRoutine(routines ?? []);
    return r ? { type: "routine", routineId: r.id } : { type: "rest" };
  }, [routines]);

  const [choice, setChoice] = useState<ActivityChoice | null>(null);
  useEffect(() => {
    if (choice === null && (routines?.length ?? 0) > 0) {
      setChoice(suggested);
    }
  }, [choice, suggested, routines]);

  const week = meta?.start_date ? programWeek(meta.start_date) : 1;

  const activeRoutine =
    choice?.type === "routine" ? routines?.find((r) => r.id === choice.routineId) ?? null : null;

  const [sessionId, setSessionId] = useState<string | null>(null);
  useEffect(() => {
    if (!activeRoutine) {
      setSessionId(null);
      return;
    }
    void getOrCreateTodaySession(activeRoutine.id, week).then((s) => setSessionId(s.id));
  }, [activeRoutine, week]);

  const routineExercises = useLiveQuery(
    () => (activeRoutine ? getRoutineExercises(activeRoutine.id) : Promise.resolve([])),
    [activeRoutine?.id],
    []
  );

  const timer = useRestTimer({
    vibrate: settings.vibrate !== false,
    sound: settings.sound !== false,
  });

  if (!choice) {
    return (
      <PageShell>
        <p className="text-slate-500">…</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold leading-tight">{t("today.title")}</h2>
          <p className="text-xs text-slate-500">{t("today.weekN", { n: week })}</p>
        </div>
        <ActivitySelector
          routines={routines ?? []}
          selected={choice}
          suggested={suggested}
          onChange={setChoice}
        />
      </header>

      {choice.type === "rest" && (
        <Banner emoji="🛌" title={t("today.rest.title")} subtitle={t("today.rest.subtitle")} />
      )}

      {choice.type === "otf" && (
        <Banner emoji="🔥" title={t("today.otf.title")} subtitle={t("today.otf.subtitle")} />
      )}

      {choice.type === "routine" && activeRoutine && sessionId && (
        <div className="flex flex-col gap-3 pb-32">
          {routineExercises?.map((re) => (
            <ExerciseCard
              key={re.id}
              routineExercise={re}
              sessionId={sessionId}
              defaultUnit={defaultUnit}
              onSetCompleted={(rest) => timer.start(rest)}
            />
          ))}
        </div>
      )}

      <RestTimerSheet
        state={timer.state}
        onPause={timer.pause}
        onResume={timer.resume}
        onSkip={timer.skip}
        onAdd={(s) => timer.start(timer.state.remaining + s)}
      />
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-4 p-4">{children}</main>
  );
}

function Banner({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <div className="card flex flex-col items-center gap-2 p-8 text-center">
      <div className="text-5xl">{emoji}</div>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}
