import { useTranslation } from "react-i18next";
import type { Routine } from "@/db/schema";

export type ActivityChoice =
  | { type: "routine"; routineId: string }
  | { type: "otf" }
  | { type: "rest" };

export function isSameChoice(a: ActivityChoice, b: ActivityChoice): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "routine" && b.type === "routine") return a.routineId === b.routineId;
  return true;
}

interface Props {
  routines: Routine[];
  selected: ActivityChoice;
  suggested: ActivityChoice;
  onChange: (choice: ActivityChoice) => void;
}

export function ActivitySelector({ routines, selected, suggested, onChange }: Props) {
  const { t } = useTranslation();

  const options: { choice: ActivityChoice; label: string; icon: string }[] = [
    ...routines.map((r) => ({
      choice: { type: "routine" as const, routineId: r.id },
      label: r.name_es,
      icon: "💪",
    })),
    { choice: { type: "otf" }, label: t("activity.otf"), icon: "🔥" },
    { choice: { type: "rest" }, label: t("activity.rest"), icon: "🛌" },
  ];

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex gap-2 pb-1">
        {options.map((opt, i) => {
          const isSelected = isSameChoice(selected, opt.choice);
          const isSuggested = isSameChoice(suggested, opt.choice);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(opt.choice)}
              className={`flex shrink-0 flex-col items-center gap-0.5 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                isSelected
                  ? "border-accent bg-accent text-white"
                  : "border-slate-200 bg-white text-slate-700 active:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-base leading-none">{opt.icon}</span>
                <span>{opt.label}</span>
              </span>
              {isSuggested && !isSelected && (
                <span className="text-[10px] font-normal text-slate-400">
                  {t("activity.suggested")}
                </span>
              )}
              {isSuggested && isSelected && (
                <span className="text-[10px] font-normal text-white/80">
                  {t("activity.suggested")}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
