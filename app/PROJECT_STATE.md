# Project State

## Project

CK3 Achievement Tracker

## Location

- Root: `E:\ConquistasCK3`
- App: `E:\ConquistasCK3\app`

## Stack

- Vite
- React
- TypeScript
- Pure CSS
- `localStorage`
- No backend
- No database
- No Electron/Tauri yet

## Goal

Build a local-first web app for tracking Crusader Kings III achievements, with room for future PWA, mobile, static deploy, or packaged app work.

## Current State

- The UI consumes `src/data/achievements.generated.json`
- The generated dataset contains 188 achievements
- The parser uses `raw/dlcs` by default
- `raw/conteudo.txt` remains legacy fallback only
- Parser build and app build both pass
- PT fields remain empty when no real translation exists

## Validated Commands

- `npm run parse:achievements`
- `npm run build`
- `npm run dev` tested manually

## Parser State

- `sourceMode`: `dlc-files`
- `duplicates`: `0`
- `with image`: `188`
- `without image`: `0`
- `guides`: `1`
- `warnings`: `179`
- `rejectedBlocks`: `201`
- Invalid wiki URL removed from final JSON
- Exact post-processing removals remain in place for known false positives

## Generated Data

- `src/data/achievements.generated.json`
- `src/data/guides.generated.json`
- `src/data/parse-report.json`
- `src/data/parse-diagnostics.md`

## UI State

- Dashboard uses real achievements
- DLC filters use real IDs and human-readable labels
- Search falls back from PT to EN when PT fields are empty
- Achievement details fall back from PT to EN when PT fields are empty
- Progress persists in `localStorage`
- Favorites, notes, checklist items, and status updates persist

## Key Files

- [`src/App.tsx`](./src/App.tsx)
- [`src/hooks/useAchievementProgress.ts`](./src/hooks/useAchievementProgress.ts)
- [`src/components/AchievementTable.tsx`](./src/components/AchievementTable.tsx)
- [`src/components/AchievementDetails.tsx`](./src/components/AchievementDetails.tsx)
- [`src/components/AchievementFilters.tsx`](./src/components/AchievementFilters.tsx)
- [`src/components/Dashboard.tsx`](./src/components/Dashboard.tsx)
- [`src/data/achievements.generated.json`](./src/data/achievements.generated.json)
- [`src/data/dlcLabels.ts`](./src/data/dlcLabels.ts)
- [`scripts/parse-achievements.mjs`](./scripts/parse-achievements.mjs)

## Decisions

- Use generated data as the source of truth for the UI
- Keep the parser strict about known false positives
- Preserve legacy raw content only as fallback
- Keep PT fields empty instead of copying EN
- Keep the UI resilient to empty PT strings

## Non-Blocking Pending Items

- Vite chunk-size warning
- Possible future guide cleanup
- Optional UI polish for large-data browsing

## Recommended Next Steps

1. Add UI polish for browsing 188 achievements comfortably.
2. Tidy guide rendering if we want to expose long walkthroughs better.
3. Consider code-splitting if bundle size becomes a concern.
