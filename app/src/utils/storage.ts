import type {
  AchievementProgress,
  AchievementStatus,
  ExportedAchievementProgress,
} from '../types/achievement'

export const STORAGE_KEY = 'ck3-achievement-tracker-progress'
export const PROGRESS_VERSION = 1

export const createInitialProgress = (achievementIds: string[]): AchievementProgress => ({
  version: PROGRESS_VERSION,
  statuses: Object.fromEntries(achievementIds.map((id) => [id, 'pending' satisfies AchievementStatus])),
  favorites: [],
  notes: {},
  completedChecklistItems: {},
  completedGuideChecklistItems: {},
})

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object'

const isAchievementStatus = (value: unknown): value is AchievementStatus =>
  value === 'pending' || value === 'in_progress' || value === 'completed'

const normalizeStringArray = (value: unknown) => (Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [])

const normalizeStatuses = (
  value: unknown,
  achievementIds: string[],
  fallback: AchievementProgress['statuses'],
) => {
  if (!isRecord(value)) return fallback

  const next = { ...fallback }
  for (const id of achievementIds) {
    const maybeStatus = value[id]
    if (isAchievementStatus(maybeStatus)) next[id] = maybeStatus
  }
  return next
}

const normalizeChecklistItems = (value: unknown, achievementIds: string[]) => {
  if (!isRecord(value)) return {}

  return Object.fromEntries(
    achievementIds.map((achievementId) => {
      const rawItems = value[achievementId]
      return [achievementId, normalizeStringArray(rawItems)]
    }),
  )
}

const normalizeGuideChecklistItems = (value: unknown) => {
  if (!isRecord(value)) return {}

  return Object.fromEntries(
    Object.entries(value).map(([guideId, rawItems]) => [
      guideId,
      normalizeStringArray(rawItems),
    ]),
  )
}

const normalizeNotes = (value: unknown, achievementIds: string[]) => {
  if (!isRecord(value)) return {}

  return Object.fromEntries(
    achievementIds.map((achievementId) => {
      const note = value[achievementId]
      return [achievementId, typeof note === 'string' ? note : '']
    }),
  )
}

export const sanitizeProgress = (
  rawProgress: unknown,
  achievementIds: string[],
  fallback = createInitialProgress(achievementIds),
): AchievementProgress => {
  if (!isRecord(rawProgress)) return fallback

  const version = typeof rawProgress.version === 'number' ? rawProgress.version : PROGRESS_VERSION
  return {
    version,
    statuses: normalizeStatuses(rawProgress.statuses, achievementIds, fallback.statuses),
    favorites: normalizeStringArray(rawProgress.favorites).filter((id) => achievementIds.includes(id)),
    notes: normalizeNotes(rawProgress.notes, achievementIds),
    completedChecklistItems: normalizeChecklistItems(rawProgress.completedChecklistItems, achievementIds),
    completedGuideChecklistItems: normalizeGuideChecklistItems(rawProgress.completedGuideChecklistItems),
  }
}

export const loadProgress = (achievementIds: string[]): AchievementProgress => {
  if (typeof window === 'undefined') return createInitialProgress(achievementIds)

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return createInitialProgress(achievementIds)

  try {
    const parsed = JSON.parse(raw)
    return sanitizeProgress(parsed, achievementIds)
  } catch {
    return createInitialProgress(achievementIds)
  }
}

export const saveProgress = (progress: AchievementProgress) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export const clearProgress = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}

export const isValidExportedProgress = (value: unknown): value is ExportedAchievementProgress => {
  return isRecord(value) && typeof value.version === 'number'
}

export const exportProgressWithTimestamp = (progress: AchievementProgress): ExportedAchievementProgress => ({
  ...progress,
  exportedAt: new Date().toISOString(),
})
