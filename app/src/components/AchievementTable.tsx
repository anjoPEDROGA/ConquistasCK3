import type { Achievement, AchievementProgress, AchievementStatus, Language } from '../types/achievement'
import { AchievementDetails } from './AchievementDetails'
import { DifficultyBadge } from './DifficultyBadge'
import { StatusBadge } from './StatusBadge'
import { ProgressBar } from './ProgressBar'
import clsx from 'clsx'
import { ChevronDown, ChevronUp, Heart, ListChecks } from 'lucide-react'
import { getAchievementIconUrl } from '../utils/assets'
import { getDlcDisplayName } from '../data/dlcLabels'
import { getAchievementText } from '../utils/achievementFilters'
import { getGuideByAchievementId, hasGuide } from '../utils/guides'

interface Props {
  achievements: Achievement[]
  language: Language
  progress: AchievementProgress
  expandedId: string | null
  onToggleExpanded: (achievementId: string) => void
  onStatusChange: (achievementId: string, status: AchievementStatus) => void
  onToggleFavorite: (achievementId: string) => void
  onToggleChecklistItem: (achievementId: string, itemId: string) => void
  onToggleGuideChecklistItem: (guideId: string, itemId: string) => void
  isGuideChecklistItemCompleted: (guideId: string, itemId: string) => boolean
  getGuideChecklistProgress: (guideId: string) => { completed: number; total: number; percentage: number }
  onNoteChange: (achievementId: string, note: string) => void
}

export function AchievementTable({
  achievements,
  language,
  progress,
  expandedId,
  onToggleExpanded,
  onStatusChange,
  onToggleFavorite,
  onToggleChecklistItem,
  onToggleGuideChecklistItem,
  isGuideChecklistItemCompleted,
  getGuideChecklistProgress,
  onNoteChange,
}: Props) {
  return (
    <section className="panel table-panel">
      <div className="table-header">
        <h2>{language === 'pt' ? 'Conquistas' : 'Achievements'}</h2>
        <p>{language === 'pt' ? 'Toque em uma conquista para expandir os detalhes.' : 'Click an achievement to expand details.'}</p>
      </div>

      <div className="achievement-table">
        {achievements.map((achievement) => {
          const status = progress.statuses[achievement.id] ?? 'pending'
          const isFavorite = progress.favorites.includes(achievement.id)
          const completed = progress.completedChecklistItems[achievement.id] ?? []
          const guide = getGuideByAchievementId(achievement.id)
          const guideProgress = guide ? getGuideChecklistProgress(guide.id) : null
          const checklistPercent = achievement.checklist.length
            ? Math.round((completed.length / achievement.checklist.length) * 100)
            : 0

          return (
            <article key={achievement.id} className={clsx('achievement-row', expandedId === achievement.id && 'expanded')}>
              <div className="achievement-summary">
                <span className="achievement-icon" aria-hidden="true">
                  <img
                    src={getAchievementIconUrl(achievement.icon)}
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = getAchievementIconUrl()
                    }}
                  />
                </span>
                <button
                  type="button"
                  className="achievement-main achievement-toggle"
                  onClick={() => onToggleExpanded(achievement.id)}
                >
                  <strong>{getAchievementText(achievement, language).name}</strong>
                  <span className="achievement-meta">
                    <StatusBadge status={status} language={language} />
                    <DifficultyBadge difficulty={achievement.difficulty} language={language} />
                    <span className="dlc-pill">{getDlcDisplayName(achievement.dlc)}</span>
                    {hasGuide(achievement.id) && (
                      <span className="guide-pill guide-badge">
                        {guideProgress && guideProgress.total > 0
                          ? language === 'pt'
                            ? `Guia ${guideProgress.completed}/${guideProgress.total} — ${guideProgress.percentage}%`
                            : `Guide ${guideProgress.completed}/${guideProgress.total} — ${guideProgress.percentage}%`
                          : language === 'pt'
                            ? 'Guia'
                            : 'Guide'}
                      </span>
                    )}
                  </span>
                </button>
                <span className="achievement-controls">
                  <select
                    aria-label={language === 'pt' ? 'Alterar status da conquista' : 'Change achievement status'}
                    value={status}
                    onChange={(event) => onStatusChange(achievement.id, event.target.value as AchievementStatus)}
                  >
                    <option value="pending">{language === 'pt' ? 'Pendente' : 'Pending'}</option>
                    <option value="in_progress">{language === 'pt' ? 'Em andamento' : 'In progress'}</option>
                    <option value="completed">{language === 'pt' ? 'Concluída' : 'Completed'}</option>
                  </select>
                  <button
                    type="button"
                    className={clsx('favorite', isFavorite && 'active')}
                    aria-label={isFavorite ? 'Desfavoritar' : 'Favoritar'}
                    onClick={() => onToggleFavorite(achievement.id)}
                  >
                    <Heart size={16} aria-hidden="true" fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button type="button" className="expand-toggle" aria-label={expandedId === achievement.id ? 'Recolher' : 'Expandir'} onClick={() => onToggleExpanded(achievement.id)}>
                    {expandedId === achievement.id ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                  </button>
                </span>
              </div>

              <div className="achievement-progress">
                <ListChecks size={16} aria-hidden="true" />
                <ProgressBar value={checklistPercent} />
                <span>{checklistPercent}%</span>
              </div>

              {expandedId === achievement.id && (
                <AchievementDetails
                  achievement={achievement}
                  language={language}
                  progress={progress}
                  onToggleChecklistItem={onToggleChecklistItem}
                  onToggleGuideChecklistItem={onToggleGuideChecklistItem}
                  isGuideChecklistItemCompleted={isGuideChecklistItemCompleted}
                  getGuideChecklistProgress={getGuideChecklistProgress}
                  onNoteChange={onNoteChange}
                />
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
