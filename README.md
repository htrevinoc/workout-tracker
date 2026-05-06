# Workout Tracker

PWA personal para tracking de hipertrofia + OTF. Funciona offline en iPhone (Add to Home Screen) y en cualquier browser. Sync con Google Drive.

## Stack
- React 18 + TypeScript + Vite
- Tailwind CSS
- Dexie.js (IndexedDB) — storage local offline-first
- vite-plugin-pwa — service worker, manifest, install
- react-i18next — toggle es/en
- Google Drive API (`drive.file` scope) — sync remoto

## Setup
```bash
npm install
npm run dev          # dev server en http://localhost:5173
```

## Importar tu Excel actual
```bash
python scripts/parse_xlsx.py
```
Genera `data/seed.json` desde `data/Hypertrophy_Tracker_v2.xlsx`. El JSON se carga automaticamente la primera vez que abres la app.

## Build / deploy
```bash
npm run build        # output en dist/
npm run preview      # sirve dist/ localmente
```
Deploy automatico a GitHub Pages al hacer push a `main` (ver `.github/workflows/deploy.yml`).

## Estructura
```
src/
  components/    # componentes React
  db/            # Dexie schema y queries
  i18n/          # traducciones es/en
  lib/           # utils (conversion peso, timer, etc.)
  pages/         # vistas
  App.tsx
  main.tsx
data/
  Hypertrophy_Tracker_v2.xlsx   # source of truth original
  seed.json                     # generado, gitignored
scripts/
  parse_xlsx.py
```

## Decisiones clave
- **Storage**: IndexedDB local. Drive solo para sync/backup.
- **Conflictos**: pregunta al usuario, default last-write-wins.
- **Pesos**: cada set guarda `weight`, `unit (kg|lb)`, `mode (per_side | pair_total | barbell | bodyweight)`.
- **OAuth scope**: `drive.file` (solo el archivo de la app).
