import type { Achievement, AchievementDifficulty, AchievementStatus, Language } from '../types/achievement'

export interface AchievementFilterState {
  search: string
  dlc: string
  status: AchievementStatus | 'all'
  difficulty: AchievementDifficulty | 'all'
}

export const filterAchievements = (
  achievements: Achievement[],
  language: Language,
  filters: AchievementFilterState,
  statuses: Record<string, AchievementStatus>,
) => {
  const searchText = filters.search.trim().toLowerCase()

  return achievements.filter((achievement) => {
    const name = language === 'pt' ? achievement.name_pt || achievement.name_en : achievement.name_en
    const description = language === 'pt' ? achievement.description_pt || achievement.description_en : achievement.description_en
    const haystack = `${name} ${description} ${achievement.tags.join(' ')} ${achievement.dlc}`.toLowerCase()
    const matchesSearch = searchText.length === 0 || haystack.includes(searchText)
    const matchesDlc = filters.dlc === 'all' || achievement.dlc === filters.dlc
    const matchesStatus = filters.status === 'all' || statuses[achievement.id] === filters.status
    const matchesDifficulty = filters.difficulty === 'all' || achievement.difficulty === filters.difficulty

    return matchesSearch && matchesDlc && matchesStatus && matchesDifficulty
  })
}
