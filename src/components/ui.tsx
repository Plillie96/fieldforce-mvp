import { useNavigate } from 'react-router-dom'
import type { Priority, Status } from '../types'
import { PRIORITY_LABEL, STATUS_LABEL } from '../types'
import { useDictation } from '../useDictation'

export function TopBar({
  title,
  subtitle,
  back,
  right,
}: {
  title: string
  subtitle?: string
  back?: string | number
  right?: React.ReactNode
}) {
  const navigate = useNavigate()
  return (
    <header className="topbar">
      {back !== undefined && (
        <button
          className="icon-btn"
          aria-label="Back"
          onClick={() => (typeof back === 'number' ? navigate(back) : navigate(back))}
        >
          ‹
        </button>
      )}
      <div className="topbar-titles">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {right && <div className="topbar-right">{right}</div>}
    </header>
  )
}

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`badge status-${status}`}>{STATUS_LABEL[status]}</span>
}

export function PriorityDot({ priority }: { priority: Priority }) {
  return (
    <span className={`prio-dot prio-${priority}`} title={`${PRIORITY_LABEL[priority]} priority`}>
      <span className="prio-label">{PRIORITY_LABEL[priority]}</span>
    </span>
  )
}

/**
 * A field label paired with a dictation (speak-to-text) button. Renders the
 * mic only where the browser supports speech recognition; elsewhere it's just
 * the label and users type / use the keyboard's own dictation.
 */
export function DictateLabel({
  caption,
  value,
  onChange,
}: {
  caption: string
  value: string
  onChange: (next: string) => void
}) {
  const { supported, listening, start, stop } = useDictation()

  function toggle() {
    if (listening) {
      stop()
      return
    }
    const base = value.trim() ? value.trimEnd() + ' ' : ''
    start((text) => onChange(base + text))
  }

  return (
    <div className="label-row">
      <span className="field-label">{caption}</span>
      {supported && (
        <button
          type="button"
          className={`mic-btn ${listening ? 'mic-on' : ''}`}
          onClick={toggle}
          aria-pressed={listening}
          aria-label={listening ? 'Stop dictation' : `Dictate ${caption}`}
        >
          {listening ? (
            <>
              <span className="mic-wave" aria-hidden="true" />
              Listening… tap to stop
            </>
          ) : (
            <>🎤 Speak</>
          )}
        </button>
      )}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: string
  title: string
  hint?: string
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <p className="empty-title">{title}</p>
      {hint && <p className="empty-hint">{hint}</p>}
    </div>
  )
}
