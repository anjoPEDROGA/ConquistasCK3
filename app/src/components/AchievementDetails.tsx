import type { Achievement, AchievementProgress, Language } from '../types/achievement'
import { ProgressBar } from './ProgressBar'
import { CheckSquare2 } from 'lucide-react'
import { getAchievementIconUrl } from '../utils/assets'
import { getDlcDisplayName } from '../data/dlcLabels'

interface Props {
  achievement: Achievement
  language: Language
  progress: AchievementProgress
  onToggleChecklistItem: (achievementId: string, itemId: string) => void
  onNoteChange: (achievementId: string, note: string) => void
}

export function AchievementDetails({
  achievement,
  language,
  progress,
  onToggleChecklistItem,
  onNoteChange,
}: Props) {
  const completed = progress.completedChecklistItems[achievement.id] ?? []
  const note = progress.notes[achievement.id] ?? ''
  const percentage = achievement.checklist.length
    ? Math.round((completed.length / achievement.checklist.length) * 100)
    : 0
  const displayText = (primary?: string, fallback = '') => (primary && primary.trim() ? primary : fallback)

  return (
    <div className="achievement-details">
      <div className="details-hero">
        <img
          className="details-icon"
          src={getAchievementIconUrl(achievement.icon)}
          alt={language === 'pt' ? displayText(achievement.name_pt, achievement.name_en) : achievement.name_en}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = getAchievementIconUrl()
          }}
        />
        <div>
          <p className="detail-dlc">{getDlcDisplayName(achievement.dlc)}</p>
          <h4>{language === 'pt' ? displayText(achievement.name_pt, achievement.name_en) : achievement.name_en}</h4>
        </div>
      </div>

      <p className="achievement-description">
        {language === 'pt' ? displayText(achievement.description_pt, achievement.description_en) : achievement.description_en}
      </p>

      {(achievement.how_to_pt || achievement.how_to_en) && (
        <div className="detail-block">
          <h4>{language === 'pt' ? 'Como conquistar' : 'How to unlock'}</h4>
          <p>{language === 'pt' ? displayText(achievement.how_to_pt, achievement.how_to_en ?? '') : achievement.how_to_en}</p>
        </div>
      )}

      <div className="detail-block">
        <h4>{language === 'pt' ? 'Checklist' : 'Checklist'}</h4>
        <ProgressBar value={percentage} />
        <ul className="checklist">
          {achievement.checklist.map((item) => {
            const checked = completed.includes(item.id)
            return (
              <li key={item.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleChecklistItem(achievement.id, item.id)}
                  />
                  <CheckSquare2 size={14} aria-hidden="true" className={checked ? 'check-icon checked' : 'check-icon'} />
                  <span>{language === 'pt' ? item.label_pt : item.label_en ?? item.label_pt}</span>
                </label>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="detail-block">
        <h4>{language === 'pt' ? 'Notas pessoais' : 'Personal notes'}</h4>
        <textarea
          value={note}
          onChange={(event) => onNoteChange(achievement.id, event.target.value)}
          rows={4}
          placeholder={language === 'pt' ? 'Escreva suas observações...' : 'Write your notes...'}
        />
      </div>
    </div>
  )
}
