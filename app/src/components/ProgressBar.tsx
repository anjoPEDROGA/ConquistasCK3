interface Props {
  value: number
}

export function ProgressBar({ value }: Props) {
  return (
    <div className="progress-track compact" aria-label={`Checklist ${value}% complete`}>
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  )
}
