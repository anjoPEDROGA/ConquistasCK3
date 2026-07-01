# CK3 Achievement Tracker

Local-first web app for tracking Crusader Kings III achievements.

This project is fan-made and not affiliated with Paradox Interactive.

## Stack

- Vite
- React
- TypeScript
- Pure CSS
- `localStorage` persistence

## Current State

- The UI consumes `src/data/achievements.generated.json`
- The generated dataset contains 188 achievements
- The parser uses `raw/dlcs` as the default source
- `raw/conteudo.txt` is legacy fallback only
- Progress, favorites, notes, and checklist state persist in `localStorage`

## Features

- Medieval-inspired dashboard with progress summaries
- PT/EN language toggle
- Search, DLC, status, and difficulty filters
- Achievement table with expandable details
- Checklist tracking per achievement
- Personal notes per achievement
- Favorites
- Export progress to JSON
- Import progress from JSON
- Reset progress
- Responsive layout for smaller screens

## Data Flow

1. `npm run parse:achievements` reads `raw/dlcs/*.txt`
2. The parser writes generated data into `src/data/achievements.generated.json`
3. The UI imports that JSON directly
4. Progress is stored locally in the browser

## Commands

```powershell
cd E:\ConquistasCK3\app
npm install
npm run dev
```

Production build:

```powershell
npm run build
```

Parse generated data:

```powershell
npm run parse:achievements
```

## Notes

- Progress is stored in `localStorage` under `ck3-achievement-tracker-progress`.
- Exported files include `version`, `statuses`, `favorites`, `notes`, `completedChecklistItems`, and `exportedAt`.
- Imported JSON is validated minimally and unknown fields are ignored.
- PT fields remain empty unless a real translation exists; the UI falls back to EN.

## Asset Structure

Local assets live under `public/assets` and are copied from the raw archive as needed.

## Links

- Parser: [`scripts/parse-achievements.mjs`](./scripts/parse-achievements.mjs)
- Generated achievements: [`src/data/achievements.generated.json`](./src/data/achievements.generated.json)
- Parse report: [`src/data/parse-report.json`](./src/data/parse-report.json)
- Diagnostics: [`src/data/parse-diagnostics.md`](./src/data/parse-diagnostics.md)
