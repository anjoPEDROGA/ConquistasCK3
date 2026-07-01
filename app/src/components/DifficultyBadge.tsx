import type { AchievementDifficultyValue, Language } from '../types/achievement'

const labels = {
  pt: {
    'very-easy': 'Muito fácil',
    easy: 'Fácil',
    medium: 'Média',
    hard: 'Difícil',
    'very-hard': 'Muito difícil',
  },
  en: {
    'very-easy': 'Very easy',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    'very-hard': 'Very hard',
  },
} satisfies Record<Language, Record<Exclude<AchievementDifficultyValue, 'unknown'>, string>>

const unknownLabels = {
  pt: 'Não definida',
  en: 'Unknown',
}

interface Props {
  difficulty?: AchievementDifficultyValue | ''
  language: Language
}

export function DifficultyBadge({ difficulty, language }: Props) {
  const value = difficulty || 'unknown'
  const label = value === 'unknown' ? unknownLabels[language] : labels[language][value]
  return <span className={`badge difficulty ${value}`}>{label}</span>
}
