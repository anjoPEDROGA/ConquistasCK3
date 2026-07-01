import type {
  Achievement,
  AchievementDifficulty,
  AchievementDifficultyValue,
  AchievementStatus,
  Language,
} from '../types/achievement'
import { hasGuide } from './guides'

export interface AchievementFilterState {
  search: string
  dlc: string
  status: AchievementStatus | 'all'
  difficulty: AchievementDifficultyValue | 'unknown' | 'all'
  favoritesOnly: boolean
  hasGuideOnly: boolean
  hideCompleted: boolean
}

export type AchievementSortOption =
  | 'default'
  | 'dlc'
  | 'name-asc'
  | 'name-desc'
  | 'status'
  | 'difficulty'
  | 'checklist-incomplete-first'
  | 'completed-last'

const getDisplayName = (achievement: Achievement, language: Language) =>
  language === 'pt' ? achievement.name_pt?.trim() || achievement.name_en : achievement.name_en

const getDisplayDescription = (achievement: Achievement, language: Language) =>
  language === 'pt'
    ? achievement.description_pt?.trim() || achievement.description_en
    : achievement.description_en

const getDisplayHowTo = (achievement: Achievement, language: Language) =>
  language === 'pt' ? achievement.how_to_pt?.trim() || achievement.how_to_en || '' : achievement.how_to_en || ''

const statusRank: Record<AchievementStatus, number> = {
  pending: 0,
  in_progress: 1,
  completed: 2,
}

const difficultyRank: Record<AchievementDifficulty, number> = {
  'very-easy': 0,
  easy: 1,
  medium: 2,
  hard: 3,
  'very-hard': 4,
}

export const normalizeDifficulty = (difficulty?: string | null): AchievementDifficultyValue | 'unknown' => {
  if (
    difficulty === 'very-easy' ||
    difficulty === 'easy' ||
    difficulty === 'medium' ||
    difficulty === 'hard' ||
    difficulty === 'very-hard'
  ) {
    return difficulty
  }
  return 'unknown'
}

export const getAchievementText = (achievement: Achievement, language: Language) => ({
  name: getDisplayName(achievement, language),
  description: getDisplayDescription(achievement, language),
  howTo: getDisplayHowTo(achievement, language),
})

export const filterAchievements = (
  achievements: Achievement[],
  language: Language,
  filters: AchievementFilterState,
  statuses: Record<string, AchievementStatus>,
  favorites: string[],
) => {
  const searchText = filters.search.trim().toLowerCase()

  return achievements.filter((achievement) => {
    const { name, description, howTo } = getAchievementText(achievement, language)
    const haystack = `${name} ${description} ${howTo} ${achievement.tags.join(' ')} ${achievement.dlc}`.toLowerCase()
    const normalizedDifficulty = normalizeDifficulty(achievement.difficulty)
    const matchesSearch = searchText.length === 0 || haystack.includes(searchText)
    const matchesDlc = filters.dlc === 'all' || achievement.dlc === filters.dlc
    const matchesStatus = filters.status === 'all' || statuses[achievement.id] === filters.status
    const matchesDifficulty =
      filters.difficulty === 'all' ? true : normalizedDifficulty === filters.difficulty
    const matchesFavorites = !filters.favoritesOnly || favorites.includes(achievement.id)
    const matchesGuide = !filters.hasGuideOnly || hasGuide(achievement.id)
    const matchesCompleted = !filters.hideCompleted || statuses[achievement.id] !== 'completed'

    return (
      matchesSearch &&
      matchesDlc &&
      matchesStatus &&
      matchesDifficulty &&
      matchesFavorites &&
      matchesGuide &&
      matchesCompleted
    )
  })
}

export const sortAchievements = (
  achievements: Achievement[],
  language: Language,
  sortBy: AchievementSortOption,
  statuses: Record<string, AchievementStatus>,
  completedChecklistItems: Record<string, string[]>,
) => {
  const withMeta = achievements.map((achievement, index) => {
    const status = statuses[achievement.id] ?? 'pending'
    const completed = completedChecklistItems[achievement.id] ?? []
    const incompleteChecklist = achievement.checklist.length - completed.length
    const difficulty = normalizeDifficulty(achievement.difficulty)

    return {
      achievement,
      index,
      name: getAchievementText(achievement, language).name.toLowerCase(),
      status,
      statusRank: statusRank[status],
      difficultyRank: difficulty === 'unknown' ? Number.POSITIVE_INFINITY : difficultyRank[difficulty],
      checklistComplete: achievement.checklist.length > 0 && completed.length === achievement.checklist.length,
      incompleteChecklist,
    }
  })

  const compareText = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' })

  return withMeta
    .sort((a, b) => {
      if (sortBy === 'default') return a.index - b.index
      if (sortBy === 'dlc') {
        const dlcCompare = compareText(a.achievement.dlc, b.achievement.dlc)
        return dlcCompare !== 0 ? dlcCompare : a.index - b.index
      }
      if (sortBy === 'name-asc') {
        const nameCompare = compareText(a.name, b.name)
        return nameCompare !== 0 ? nameCompare : a.index - b.index
      }
      if (sortBy === 'name-desc') {
        const nameCompare = compareText(b.name, a.name)
        return nameCompare !== 0 ? nameCompare : a.index - b.index
      }
      if (sortBy === 'status') {
        const statusCompare = a.statusRank - b.statusRank
        return statusCompare !== 0 ? statusCompare : a.index - b.index
      }
      if (sortBy === 'difficulty') {
        const difficultyCompare = a.difficultyRank - b.difficultyRank
        return difficultyCompare !== 0 ? difficultyCompare : a.index - b.index
      }
      if (sortBy === 'checklist-incomplete-first') {
        const completeCompare = Number(a.checklistComplete) - Number(b.checklistComplete)
        if (completeCompare !== 0) return completeCompare
        const incompleteCompare = b.incompleteChecklist - a.incompleteChecklist
        return incompleteCompare !== 0 ? incompleteCompare : a.index - b.index
      }
      if (sortBy === 'completed-last') {
        const completedCompare = Number(a.status === 'completed') - Number(b.status === 'completed')
        return completedCompare !== 0 ? completedCompare : a.index - b.index
      }
      return a.index - b.index
    })
    .map(({ achievement }) => achievement)
}
