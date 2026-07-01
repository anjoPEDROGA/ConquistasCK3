import type { AchievementStatus, Language } from '../types/achievement'

const labels = {
  pt: { pending: 'Pendente', in_progress: 'Em andamento', completed: 'Concluída' },
  en: { pending: 'Pending', in_progress: 'In progress', completed: 'Completed' },
} satisfies Record<Language, Record<AchievementStatus, string>>

interface Props {
  status: AchievementStatus
  language: Language
}

export function StatusBadge({ status, language }: Props) {
  return <span className={`badge status ${status}`}>{labels[language][status]}</span>
}
