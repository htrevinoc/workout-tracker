import { useTranslation } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Unit } from "@/db/schema";

export function SettingsPage() {
  const { t, i18n } = useTranslation();
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

  const setKey = async (key: string, value: unknown) => {
    await db.settings.put({ key, value });
  };

  const unit = (settings.unit as Unit | undefined) ?? "kg";
  const wakeLock = Boolean(settings.wake_lock);
  const vibrate = settings.vibrate !== false;
  const sound = settings.sound !== false;

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-4 p-4">
      <h2 className="text-xl font-bold">{t("settings.title")}</h2>

      <section className="card flex flex-col gap-3">
        <Row label={t("settings.language")}>
          <Toggle
            options={[
              { value: "es", label: "ES" },
              { value: "en", label: "EN" },
            ]}
            value={i18n.language.startsWith("es") ? "es" : "en"}
            onChange={(v) => void i18n.changeLanguage(v)}
          />
        </Row>

        <Row label={t("settings.unit")}>
          <Toggle
            options={[
              { value: "kg", label: "kg" },
              { value: "lb", label: "lb" },
            ]}
            value={unit}
            onChange={(v) => void setKey("unit", v)}
          />
        </Row>

        <Row label={t("settings.wakeLock")}>
          <Switch checked={wakeLock} onChange={(v) => void setKey("wake_lock", v)} />
        </Row>

        <Row label={t("settings.vibrate")}>
          <Switch checked={vibrate} onChange={(v) => void setKey("vibrate", v)} />
        </Row>

        <Row label={t("settings.sound")}>
          <Switch checked={sound} onChange={(v) => void setKey("sound", v)} />
        </Row>
      </section>

      <section className="card flex flex-col gap-2">
        <h3 className="font-semibold">{t("settings.dataTitle")}</h3>
        <button
          className="btn-secondary"
          onClick={async () => {
            const tables = {
              meta: (await db.settings.get("program_meta"))?.value,
              exercises: await db.exercises.toArray(),
              routines: await db.routines.toArray(),
              routine_exercises: await db.routineExercises.toArray(),
              sessions: await db.sessions.toArray(),
              session_sets: await db.sessionSets.toArray(),
              bodyweight: await db.bodyweight.toArray(),
              available_weights: await db.availableWeights.toArray(),
            };
            const blob = new Blob([JSON.stringify(tables, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `workout-tracker-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          {t("settings.exportJson")}
        </button>
      </section>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-slate-700">{label}</span>
      {children}
    </div>
  );
}

interface ToggleOption {
  value: string;
  label: string;
}

function Toggle({
  options,
  value,
  onChange,
}: {
  options: ToggleOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-slate-200">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-sm font-semibold ${
            value === opt.value
              ? "bg-slate-800 text-white"
              : "bg-white text-slate-600 active:bg-slate-100"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${
        checked ? "bg-accent" : "bg-slate-300"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}
