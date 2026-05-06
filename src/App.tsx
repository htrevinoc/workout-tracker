import { useTranslation } from "react-i18next";

export default function App() {
  const { t, i18n } = useTranslation();

  const toggleLang = () => {
    const next = i18n.language.startsWith("es") ? "en" : "es";
    i18n.changeLanguage(next);
  };

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("app.title")}</h1>
        <button onClick={toggleLang} className="btn-secondary px-3 py-1.5 text-sm">
          {i18n.language.startsWith("es") ? "EN" : "ES"}
        </button>
      </header>

      <section className="card">
        <p className="text-slate-700">{t("app.scaffoldReady")}</p>
        <p className="mt-2 text-sm text-slate-500">{t("app.nextStep")}</p>
      </section>

      <section className="card">
        <h2 className="font-semibold">{t("app.checks.title")}</h2>
        <ul className="mt-2 space-y-1 text-sm">
          <li>PWA: <code>vite-plugin-pwa</code></li>
          <li>Storage: <code>Dexie / IndexedDB</code></li>
          <li>i18n: <code>react-i18next</code></li>
          <li>Deploy: <code>GitHub Pages</code></li>
        </ul>
      </section>
    </main>
  );
}
