import type { ChangeEvent } from 'react'
import { useRef, useState } from 'react'
import { Download, FileUp, RotateCcw } from 'lucide-react'

interface Props {
  onExport: () => void
  onImport: (fileContent: string) => { ok: boolean; message: string }
  onReset: () => void
}

export function ProgressControls({ onExport, onImport, onReset }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [feedback, setFeedback] = useState('')

  const triggerFileSelect = () => fileInputRef.current?.click()

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const content = await file.text()
      const result = onImport(content)
      setFeedback(result.message)
    } catch {
      setFeedback('Nao foi possivel ler o arquivo selecionado.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <section className="panel progress-controls" aria-label="Progress controls">
      <div className="controls-row">
        <button type="button" className="control-button" onClick={onExport}>
          <Download size={16} aria-hidden="true" />
          <span>Exportar progresso</span>
        </button>

        <button type="button" className="control-button" onClick={triggerFileSelect}>
          <FileUp size={16} aria-hidden="true" />
          <span>Importar progresso</span>
        </button>

        <button
          type="button"
          className="control-button danger"
          onClick={() => {
            if (window.confirm('Tem certeza que deseja resetar o progresso?')) {
              onReset()
              setFeedback('Progresso resetado.')
            }
          }}
        >
          <RotateCcw size={16} aria-hidden="true" />
          <span>Resetar progresso</span>
        </button>
      </div>

      <input ref={fileInputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={handleFileChange} />

      <p className="feedback-text" role="status" aria-live="polite">
        {feedback || 'Exporte ou importe seu progresso local quando quiser.'}
      </p>
    </section>
  )
}
