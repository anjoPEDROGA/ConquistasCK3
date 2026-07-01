import { useCallback, useState } from 'react'
import type { AchievementProgress, AchievementStatus } from '../types/achievement'
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
    importProgress,
    exportProgressData,
    resetProgress,
  }
}
