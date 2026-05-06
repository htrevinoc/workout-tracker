import { useEffect, useState } from "react";
import { HashRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TodayPage } from "@/pages/Today";
import { SettingsPage } from "@/pages/SettingsPage";
import { loadSeedIfEmpty } from "@/lib/seed";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void loadSeedIfEmpty().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <main className="flex min-h-full items-center justify-center p-4">
        <p className="text-slate-500">…</p>
      </main>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <BottomNav />
    </HashRouter>
  );
}

function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const items = [
    { path: "/", label: t("nav.today"), icon: "💪" },
    { path: "/settings", label: t("nav.settings"), icon: "⚙️" },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/90 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md">
        {items.map((it) => {
          const active = location.pathname === it.path;
          return (
            <Link
              key={it.path}
              to={it.path}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                active ? "text-accent" : "text-slate-500"
              }`}
            >
              <span className="text-lg leading-none">{it.icon}</span>
              <span>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
