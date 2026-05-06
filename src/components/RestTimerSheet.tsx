import { useTranslation } from "react-i18next";
import { fmtSeconds, type RestTimerState } from "@/lib/timer";

interface Props {
  state: RestTimerState;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onAdd: (seconds: number) => void;
}

export function RestTimerSheet({ state, onPause, onResume, onSkip, onAdd }: Props) {
  const { t } = useTranslation();
  if (state.total === 0) return null;

  const pct = state.total > 0 ? ((state.total - state.remaining) / state.total) * 100 : 100;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md p-3">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-lg">
        <div className="h-1.5 overflow-hidden rounded-t-2xl bg-slate-100">
          <div
            className="h-full bg-accent transition-[width] duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center gap-3 p-3">
          <div className="text-3xl font-bold tabular-nums">{fmtSeconds(state.remaining)}</div>
          <div className="ml-auto flex gap-1">
            <button onClick={() => onAdd(15)} className="btn-secondary px-3 py-1.5 text-sm">
              +15
            </button>
            {state.isRunning ? (
              <button onClick={onPause} className="btn-secondary px-3 py-1.5 text-sm">
                {t("timer.pause")}
              </button>
            ) : (
              <button onClick={onResume} className="btn-secondary px-3 py-1.5 text-sm">
                {t("timer.resume")}
              </button>
            )}
            <button onClick={onSkip} className="btn-primary px-3 py-1.5 text-sm">
              {t("timer.skip")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
