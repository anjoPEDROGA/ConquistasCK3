import { Trophy, Star, TimerReset, ShieldHalf } from 'lucide-react'
import { getDlcLogoUrl } from '../utils/assets'
import type { DLCInfo } from '../types/achievement'

interface Props {
  total: number
  pending: number
  inProgress: number
  completed: number
  overall: number
  favorites: number
  partialChecklist: number
  dlcProgress: Array<{ dlc: string; completed: number; total: number }>
  dlcs: DLCInfo[]
}

export function Dashboard({ total, pending, inProgress, completed, overall, favorites, partialChecklist, dlcProgress, dlcs }: Props) {
  const items = [
    { label: 'Total', value: total, icon: Trophy },
    { label: 'Pendentes', value: pending, icon: TimerReset },
    { label: 'Em andamento', value: inProgress, icon: ShieldHalf },
    { label: 'Concluídas', value: completed, icon: Trophy },
  ]

  return (
    <section className="dashboard-grid">
      {items.map(({ label, value, icon: Icon }) => (
        <article key={label} className="panel stat-card">
          <div className="stat-title">
            <Icon size={16} aria-hidden="true" />
            <p>{label}</p>
          </div>
          <strong>{value}</strong>
        </article>
      ))}
      <article className="panel stat-card stat-card-wide">
        <p>Progresso geral</p>
        <strong>{overall}%</strong>
        <div className="progress-track" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${overall}%` }} />
        </div>
      </article>
      <article className="panel stat-card stat-card-wide">
        <div className="stat-title">
          <Star size={16} aria-hidden="true" />
          <p>Favoritas</p>
        </div>
        <strong>{favorites}</strong>
      </article>
      <article className="panel stat-card stat-card-wide">
        <div className="stat-title">
          <ShieldHalf size={16} aria-hidden="true" />
          <p>Checklist parcial</p>
        </div>
        <strong>{partialChecklist}</strong>
      </article>
      <article className="panel stat-card dlc-progress-card">
        <p className="dlc-progress-title">Progresso por DLC</p>
        <ul className="dlc-progress-list">
          {dlcProgress.map((item) => (
            <li key={item.dlc}>
              <span className="dlc-progress-name">
                <img
                  src={getDlcLogoUrl(dlcs.find((dlc) => dlc.id === item.dlc)?.logo)}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.src = getDlcLogoUrl()
                  }}
                />
                <span>{dlcs.find((dlc) => dlc.id === item.dlc)?.name ?? item.dlc}</span>
              </span>
              <span>{item.completed}/{item.total}</span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  )
}
