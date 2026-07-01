export type AchievementStatus = 'pending' | 'in_progress' | 'completed'

export type AchievementDifficulty = 'easy' | 'medium' | 'hard' | 'very-hard'

export interface ChecklistItem {
  id: string
  label_pt: string
  label_en?: string
  description_pt?: string
  description_en?: string
}

export interface Achievement {
  id: string
  name_en: string
  name_pt: string
  dlc: string
  icon?: string
  difficulty: AchievementDifficulty
  description_en: string
  description_pt: string
  requirements_en?: string
  requirements_pt?: string
  starting_conditions_en?: string
  starting_conditions_pt?: string
  how_to_en?: string
  how_to_pt?: string
  tags: string[]
  checklist: ChecklistItem[]
  guide_id?: string
  maps?: string[]
}

export interface AchievementProgress {
  version: number
  statuses: Record<string, AchievementStatus>
  favorites: string[]
  notes: Record<string, string>
  completedChecklistItems: Record<string, string[]>
}

export type Language = 'pt' | 'en'

export interface ExportedAchievementProgress extends AchievementProgress {
  exportedAt: string
}

export interface DLCInfo {
  id: string
  name: string
  logo?: string
}
