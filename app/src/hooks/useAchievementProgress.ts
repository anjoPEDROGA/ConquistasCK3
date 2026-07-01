import { useCallback, useState } from 'react'
import type { AchievementProgress, AchievementStatus } from '../types/achievement'
import { getGuideById } from '../utils/guides'
import {
  clearProgress,
  createInitialProgress,
  exportProgressWithTimestamp,
  loadProgress,
  sanitizeProgress,
  saveProgress,
} from '../utils/storage'

export function useAchievementProgress(achievementIds: string[]) {
  const [progress, setProgress] = useState<AchievementProgress>(() => loadProgress(achievementIds))

  const commitProgress = useCallback((updater: (current: AchievementProgress) => AchievementProgress) => {
    setProgress((current) => {
      const next = updater(current)
      saveProgress(next)
      return next
    })
  }, [])

  const setAchievementStatus = useCallback(
    (achievementId: string, status: AchievementStatus) => {
      commitProgress((current) => ({
        ...current,
        statuses: { ...current.statuses, [achievementId]: status },
      }))
    },
    [commitProgress],
  )

  const toggleFavorite = useCallback(
    (achievementId: string) => {
      commitProgress((current) => {
        const isFavorite = current.favorites.includes(achievementId)
        return {
          ...current,
          favorites: isFavorite
            ? current.favorites.filter((id) => id !== achievementId)
            : [...current.favorites, achievementId],
        }
      })
    },
    [commitProgress],
  )

  const updateNote = useCallback(
    (achievementId: string, note: string) => {
      commitProgress((current) => ({
        ...current,
        notes: { ...current.notes, [achievementId]: note },
      }))
    },
    [commitProgress],
  )

  const toggleChecklistItem = useCallback(
    (achievementId: string, itemId: string) => {
      commitProgress((current) => {
        const checkedItems = current.completedChecklistItems[achievementId] ?? []
        const nextItems = checkedItems.includes(itemId)
          ? checkedItems.filter((id) => id !== itemId)
          : [...checkedItems, itemId]

        return {
          ...current,
          completedChecklistItems: {
            ...current.completedChecklistItems,
            [achievementId]: nextItems,
          },
        }
      })
    },
    [commitProgress],
  )

  const toggleGuideChecklistItem = useCallback(
    (guideId: string, itemId: string) => {
      commitProgress((current) => {
        const checkedItems = current.completedGuideChecklistItems[guideId] ?? []
        const nextItems = checkedItems.includes(itemId)
          ? checkedItems.filter((id) => id !== itemId)
          : [...checkedItems, itemId]

        return {
          ...current,
          completedGuideChecklistItems: {
            ...current.completedGuideChecklistItems,
            [guideId]: nextItems,
          },
        }
      })
    },
    [commitProgress],
  )

  const isGuideChecklistItemCompleted = useCallback(
    (guideId: string, itemId: string) => (progress.completedGuideChecklistItems[guideId] ?? []).includes(itemId),
    [progress.completedGuideChecklistItems],
  )

  const getGuideChecklistProgress = useCallback(
    (guideId: string) => {
      const guide = getGuideById(guideId)
      const total = guide?.checklist?.length ?? 0
      const completed = progress.completedGuideChecklistItems[guideId]?.length ?? 0
      return {
        completed,
        total,
        percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
      }
    },
    [progress.completedGuideChecklistItems],
  )

  const importProgress = useCallback((fileContent: string) => {
    try {
      const parsed: unknown = JSON.parse(fileContent)
      if (!parsed || typeof parsed !== 'object' || !('version' in parsed)) {
        return { ok: false, message: 'Arquivo invalido: versao ausente.' }
      }

      const next = sanitizeProgress(parsed, achievementIds, createInitialProgress(achievementIds))
      setProgress(next)
      saveProgress(next)
      return { ok: true, message: 'Progresso importado com sucesso.' }
    } catch {
      return { ok: false, message: 'Nao foi possivel ler o arquivo JSON.' }
    }
  }, [])

  const exportProgressData = useCallback(() => exportProgressWithTimestamp(progress), [progress])

  const resetProgress = useCallback(() => {
    const next = createInitialProgress(achievementIds)
    clearProgress()
    setProgress(next)
  }, [])

  return {
    progress,
    setAchievementStatus,
    toggleFavorite,
    updateNote,
    toggleChecklistItem,
    toggleGuideChecklistItem,
    isGuideChecklistItemCompleted,
    getGuideChecklistProgress,
    importProgress,
    exportProgressData,
    resetProgress,
  }
}
