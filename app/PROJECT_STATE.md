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
- `rejectedBlocks`: `202`
- Invalid wiki URL removed from final JSON
- Exact post-processing removals remain in place for known false positives

## Phase 10 Closure

- Total achievements: `188`
- Duplicates: `0`
- Real images: `188/188`
- Placeholder images in final achievements: `0`
- Official difficulty distribution:
  - `very-easy`: `13`
  - `easy`: `37`
  - `medium`: `63`
  - `hard`: `56`
  - `very-hard`: `19`
  - `unknown`: `0`
- `Completed a Raid Estate scheme` was removed as an internal false positive.
- `The Heavenly Kingdom` is included in `all-under-heaven`.
- `The Heavenly Kingdom` uses the real image `/assets/images/10 All Under Heaven/The_heavenly_kingdom_achievement.png`.
- `The Heavenly Kingdom` has `difficulty: very-hard`.
- Manual difficulty curation now comes from `src/data/difficulty-manual.txt` and `src/data/difficulty-overrides.json`.
- The dataset matches the official difficulty distribution.

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
- Difficulty is still not curated in the parser; UI now safely treats missing, empty, and `unknown` difficulty as `unknown`
- PT translations are still not real translations
- Tags still need curation
- Checklists are still mostly generic
- `guides.generated.json` is still a weak initial base
- Maps are not yet integrated as a UI resource
- Warnings and rejected blocks remain as parser diagnostics

## Recommended Next Steps

1. Fase 11: guias complexas e checklists avançadas.
2. Tidy guide rendering if we want to expose long walkthroughs better.
3. Consider code-splitting if bundle size becomes a concern.
