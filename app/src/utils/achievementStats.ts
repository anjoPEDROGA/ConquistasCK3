import type { Achievement, AchievementProgress, AchievementStatus } from '../types/achievement'

export const getChecklistCompletion = (achievement: Achievement, completedIds: string[]) => {
  const total = achievement.checklist.length
  if (total === 0) return 0
  return Math.round((completedIds.length / total) * 100)
}

export const getAchievementCounts = (achievements: Achievement[], progress: AchievementProgress) => {
  const total = achievements.length
  const completed = achievements.filter((achievement) => progress.statuses[achievement.id] === 'completed').length
  const inProgress = achievements.filter((achievement) => progress.statuses[achievement.id] === 'in_progress').length
  const pending = total - completed - inProgress
  const overall = total === 0 ? 0 : Math.round((completed / total) * 100)

  return { total, pending, inProgress, completed, overall }
}

export const normalizeStatus = (status: string): AchievementStatus => {
  if (status === 'completed' || status === 'in_progress') return status
  return 'pending'
}
