import { useNavigate } from 'react-router-dom'
import type { Priority, Status } from '../types'
import { PRIORITY_LABEL, STATUS_LABEL } from '../types'

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
