import type { Language } from '../types/achievement'
import clsx from 'clsx'

interface Props {
  language: Language
  onChange: (language: Language) => void
}

export function LanguageToggle({ language, onChange }: Props) {
  return (
    <div className="language-toggle" role="group" aria-label="Language switch">
      <button type="button" className={clsx(language === 'pt' && 'active')} onClick={() => onChange('pt')}>
        PT
      </button>
      <button type="button" className={clsx(language === 'en' && 'active')} onClick={() => onChange('en')}>
        EN
      </button>
    </div>
  )
}
