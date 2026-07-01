import type { Language } from '../types/achievement'
import { Shield, Sparkles } from 'lucide-react'
import { LanguageToggle } from './LanguageToggle'
import { ProgressControls } from './ProgressControls'

interface HeaderProps {
  language: Language
  onLanguageChange: (language: Language) => void
  onExport: () => void
  onImport: (fileContent: string) => { ok: boolean; message: string }
  onReset: () => void
}

export function Header({ language, onLanguageChange, onExport, onImport, onReset }: HeaderProps) {
  return (
    <header className="app-header panel">
      <div className="header-brand">
        <div className="header-mark" aria-hidden="true">
          <Shield size={20} />
        </div>
        <p className="eyebrow">Local-first tracker</p>
        <h1>
          <Sparkles size={20} aria-hidden="true" />
          <span>CK3 Achievement Tracker</span>
        </h1>
      </div>
      <div className="header-actions">
        <LanguageToggle language={language} onChange={onLanguageChange} />
        <ProgressControls onExport={onExport} onImport={onImport} onReset={onReset} />
      </div>
    </header>
  )
}
