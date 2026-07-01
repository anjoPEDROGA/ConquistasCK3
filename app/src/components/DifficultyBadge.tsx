import type { AchievementDifficulty, Language } from '../types/achievement'

const labels = {
  pt: { easy: 'Fácil', medium: 'Média', hard: 'Difícil', 'very-hard': 'Muito difícil' },
  en: { easy: 'Easy', medium: 'Medium', hard: 'Hard', 'very-hard': 'Very hard' },
} satisfies Record<Language, Record<AchievementDifficulty, string>>

interface Props {
  difficulty: AchievementDifficulty
  language: Language
}

export function DifficultyBadge({ difficulty, language }: Props) {
  return <span className={`badge difficulty ${difficulty}`}>{labels[language][difficulty]}</span>
}
