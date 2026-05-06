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

  const routineToday = useMemo(() => todayRoutine(routines ?? []), [routines]);
  const week = meta?.start_date ? programWeek(meta.start_date) : 1;

  const [sessionId, setSessionId] = useState<string | null>(null);
  useEffect(() => {
    if (!routineToday) {
      setSessionId(null);
      return;
    }
    void getOrCreateTodaySession(routineToday.id, week).then((s) => setSessionId(s.id));
  }, [routineToday, week]);

  const routineExercises = useLiveQuery(
    () => (routineToday ? getRoutineExercises(routineToday.id) : Promise.resolve([])),
    [routineToday?.id],
    []
  );

  const timer = useRestTimer({
    vibrate: settings.vibrate !== false,
    sound: settings.sound !== false,
  });

  if (isRestDay()) {
    return (
      <PageShell>
        <Banner emoji="🛌" title={t("today.rest.title")} subtitle={t("today.rest.subtitle")} />
      </PageShell>
    );
  }
  if (isOTFDay()) {
    return (
      <PageShell>
        <Banner emoji="🔥" title={t("today.otf.title")} subtitle={t("today.otf.subtitle")} />
      </PageShell>
    );
  }
  if (!routineToday || !sessionId) {
    return (
      <PageShell>
        <Banner emoji="🤔" title={t("today.unknown.title")} subtitle={t("today.unknown.subtitle")} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <header className="flex items-baseline justify-between">
        <div>
          <h2 className="text-xl font-bold leading-tight">{routineToday.name_es}</h2>
          <p className="text-xs text-slate-500">
            {t("today.weekN", { n: week })}
          </p>
        </div>
      </header>

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
