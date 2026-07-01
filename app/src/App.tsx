import { useMemo, useState } from 'react'
import './index.css'
import { AchievementFilters } from './components/AchievementFilters'
import { AchievementTable } from './components/AchievementTable'
import { Dashboard } from './components/Dashboard'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import achievementsData from './data/achievements.generated.json'
import { getDlcInfoList } from './data/dlcLabels'
import { useAchievementProgress } from './hooks/useAchievementProgress'
import type { Achievement, Language } from './types/achievement'
import { filterAchievements, type AchievementFilterState } from './utils/achievementFilters'
import { getAchievementCounts } from './utils/achievementStats'

const defaultFilters: AchievementFilterState = {
  search: '',
  dlc: 'all',
  status: 'all',
  difficulty: 'all',
}

function App() {
  const achievements = achievementsData as Achievement[]
  const dlcs = useMemo(() => getDlcInfoList([...new Set(achievements.map((achievement) => achievement.dlc))]), [achievements])
  const [language, setLanguage] = useState<Language>('pt')
  const [filters, setFilters] = useState(defaultFilters)
  const [expandedId, setExpandedId] = useState<string | null>(achievements[0]?.id ?? null)
  const { progress, setAchievementStatus, toggleFavorite, updateNote, toggleChecklistItem, importProgress, exportProgressData, resetProgress } =
    useAchievementProgress(achievements.map((achievement) => achievement.id))

  const filteredAchievements = useMemo(
    () => filterAchievements(achievements, language, filters, progress.statuses),
    [achievements, filters, language, progress.statuses],
  )

  const stats = useMemo(() => {
    const base = getAchievementCounts(achievements, progress)
    const favorites = progress.favorites.length
    const partialChecklist = achievements.filter((achievement) => {
      const completed = progress.completedChecklistItems[achievement.id] ?? []
      return completed.length > 0 && completed.length < achievement.checklist.length
    }).length

    const dlcProgress = dlcs.map((dlc) => {
      const achievementsInDlc = achievements.filter((achievement) => achievement.dlc === dlc.id)
      const completed = achievementsInDlc.filter((achievement) => progress.statuses[achievement.id] === 'completed').length
      return { dlc: dlc.id, completed, total: achievementsInDlc.length }
    })

    return { ...base, favorites, partialChecklist, dlcProgress }
  }, [achievements, dlcs, progress])

  const handleExport = () => {
    const data = exportProgressData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'ck3-achievement-progress.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app-shell">
      <Header
        language={language}
        onLanguageChange={setLanguage}
        onExport={handleExport}
        onImport={importProgress}
        onReset={() => {
          resetProgress()
          setFilters(defaultFilters)
        }}
      />
      <Dashboard {...stats} dlcs={dlcs} />
      <AchievementFilters
        language={language}
        filters={filters}
        dlcs={dlcs.map((dlc) => ({ id: dlc.id, name: dlc.name }))}
        filteredCount={filteredAchievements.length}
        totalCount={achievements.length}
        onChange={setFilters}
        onClear={() => setFilters(defaultFilters)}
      />
      <AchievementTable
        achievements={filteredAchievements}
        language={language}
        progress={progress}
        expandedId={expandedId}
        onToggleExpanded={(achievementId) =>
          setExpandedId((current) => (current === achievementId ? null : achievementId))
        }
        onStatusChange={setAchievementStatus}
        onToggleFavorite={toggleFavorite}
        onToggleChecklistItem={toggleChecklistItem}
        onNoteChange={updateNote}
      />
      <Footer />
    </div>
  )
}

export default App
