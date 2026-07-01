import { FilterX, Search } from 'lucide-react'
import clsx from 'clsx'
import type { AchievementDifficulty, AchievementStatus, Language } from '../types/achievement'
import type { AchievementFilterState } from '../utils/achievementFilters'

interface Props {
  language: Language
  filters: AchievementFilterState
  dlcs: Array<{ id: string; name: string }>
  filteredCount: number
  totalCount: number
  onChange: (next: AchievementFilterState) => void
  onClear: () => void
}

export function AchievementFilters({ language, filters, dlcs, filteredCount, totalCount, onChange, onClear }: Props) {
  return (
    <section className="panel filters">
      <div className="filter-field search-field">
        <label htmlFor="achievement-search">{language === 'pt' ? 'Busca textual' : 'Text search'}</label>
        <div className="input-with-icon">
          <Search size={16} aria-hidden="true" />
          <input
            id="achievement-search"
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            placeholder={language === 'pt' ? 'Buscar conquistas, tags ou descrições' : 'Search achievements, tags, or descriptions'}
          />
        </div>
      </div>

      <div className="filter-field">
        <label htmlFor="achievement-dlc">{language === 'pt' ? 'DLC' : 'DLC'}</label>
        <select id="achievement-dlc" value={filters.dlc} onChange={(event) => onChange({ ...filters, dlc: event.target.value })}>
          <option value="all">{language === 'pt' ? 'Todos os DLCs' : 'All DLCs'}</option>
          {dlcs.map((dlc) => (
            <option key={dlc.id} value={dlc.id}>
              {dlc.name}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="achievement-status">{language === 'pt' ? 'Status' : 'Status'}</label>
        <select
          id="achievement-status"
          value={filters.status}
          onChange={(event) => onChange({ ...filters, status: event.target.value as AchievementStatus | 'all' })}
        >
          <option value="all">{language === 'pt' ? 'Todos os status' : 'All statuses'}</option>
          <option value="pending">{language === 'pt' ? 'Pendente' : 'Pending'}</option>
          <option value="in_progress">{language === 'pt' ? 'Em andamento' : 'In progress'}</option>
          <option value="completed">{language === 'pt' ? 'Concluída' : 'Completed'}</option>
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="achievement-difficulty">{language === 'pt' ? 'Dificuldade' : 'Difficulty'}</label>
        <select
          id="achievement-difficulty"
          value={filters.difficulty}
          onChange={(event) =>
            onChange({ ...filters, difficulty: event.target.value as AchievementDifficulty | 'all' })
          }
        >
          <option value="all">{language === 'pt' ? 'Todas as dificuldades' : 'All difficulties'}</option>
          <option value="easy">{language === 'pt' ? 'Fácil' : 'Easy'}</option>
          <option value="medium">{language === 'pt' ? 'Média' : 'Medium'}</option>
          <option value="hard">{language === 'pt' ? 'Difícil' : 'Hard'}</option>
          <option value="very-hard">{language === 'pt' ? 'Muito difícil' : 'Very hard'}</option>
        </select>
      </div>

      <div className="filters-footer">
        <p className="filters-count">
          {language === 'pt'
            ? `Mostrando ${filteredCount} de ${totalCount} conquistas`
            : `Showing ${filteredCount} of ${totalCount} achievements`}
        </p>
        <button type="button" className={clsx('control-button', 'ghost')} onClick={onClear}>
          <FilterX size={16} aria-hidden="true" />
          <span>{language === 'pt' ? 'Limpar filtros' : 'Clear filters'}</span>
        </button>
      </div>
    </section>
  )
}
