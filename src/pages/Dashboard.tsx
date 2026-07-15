import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProject, listItems } from '../db'
import { buildSubMailto } from '../mailto'
import type { Project, PunchItem } from '../types'
import { TRADES, daysOpen, isOverdue } from '../types'
import { TopBar } from '../components/ui'

function StatTile({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className={`stat-tile ${tone ? 'tone-' + tone : ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function Bar({ label, open, total, max }: { label: string; open: number; total: number; max: number }) {
  return (
    <div className="bar-row">
      <div className="bar-label">{label}</div>
      <div className="bar-track">
        <span className="bar-fill" style={{ width: `${max ? (total / max) * 100 : 0}%` }} />
      </div>
      <div className="bar-num">
        <strong>{open}</strong>/{total}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { projectId } = useParams()
  const [project, setProject] = useState<Project>()
  const [items, setItems] = useState<PunchItem[]>([])

  useEffect(() => {
    if (!projectId) return
    Promise.all([getProject(projectId), listItems(projectId)]).then(([p, i]) => {
      setProject(p)
      setItems(i)
    })
  }, [projectId])

  const m = useMemo(() => {
    const done = items.filter((i) => i.status === 'done')
    const closeTimes = done.filter((i) => i.closedAt).map((i) => daysOpen(i))
    const byTrade = new Map<string, { total: number; open: number }>()
    const bySub = new Map<string, { total: number; open: number; email: string }>()
    for (const it of items) {
      const t = byTrade.get(it.trade) ?? { total: 0, open: 0 }
      t.total++
      if (it.status !== 'done') t.open++
      byTrade.set(it.trade, t)

      const key = it.assignee.trim() || 'Unassigned'
      const s = bySub.get(key) ?? { total: 0, open: 0, email: '' }
      s.total++
      if (it.status !== 'done') s.open++
      if (!s.email && it.assigneeEmail) s.email = it.assigneeEmail
      bySub.set(key, s)
    }
    return {
      total: items.length,
      open: items.filter((i) => i.status === 'open').length,
      inProgress: items.filter((i) => i.status === 'in_progress').length,
      done: done.length,
      overdue: items.filter(isOverdue).length,
      pct: items.length ? Math.round((done.length / items.length) * 100) : 0,
      avgClose: closeTimes.length ? Math.round(closeTimes.reduce((a, b) => a + b, 0) / closeTimes.length) : null,
      byTrade: Array.from(byTrade.entries())
        .filter(([, v]) => v.total > 0)
        .sort((a, b) => TRADES.indexOf(a[0] as never) - TRADES.indexOf(b[0] as never)),
      bySub: Array.from(bySub.entries()).sort((a, b) => b[1].open - a[1].open),
      aging: items.filter((i) => i.status !== 'done').sort((a, b) => a.createdAt - b.createdAt).slice(0, 5),
    }
  }, [items])

  if (!project) return <div className="page" />
  const tradeMax = Math.max(1, ...m.byTrade.map(([, v]) => v.total))

  return (
    <div className="page">
      <TopBar title="Dashboard" subtitle={project.name} back={`/project/${projectId}`} />

      <div className="page-body">
        <div className="report-dashboard dash-kpis">
          <StatTile label="Items" value={m.total} />
          <StatTile label="Open" value={m.open} tone="open" />
          <StatTile label="In progress" value={m.inProgress} tone="prog" />
          <StatTile label="Done" value={m.done} tone="done" />
          <StatTile label="Overdue" value={m.overdue} tone="open" />
          <StatTile label="Avg days to close" value={m.avgClose ?? '—'} />
        </div>

        <div className="dash-pct">
          <div className="dash-pct-head">
            <span>{m.pct}% complete</span>
            <span className="muted">{m.done}/{m.total} done</span>
          </div>
          <div className="pct-bar big">
            <span style={{ width: `${m.pct}%` }} />
          </div>
        </div>

        {m.byTrade.length > 0 && (
          <section className="dash-section">
            <h3>By trade <span className="muted">(open / total)</span></h3>
            {m.byTrade.map(([trade, v]) => (
              <Bar key={trade} label={trade} open={v.open} total={v.total} max={tradeMax} />
            ))}
          </section>
        )}

        <section className="dash-section">
          <h3>By subcontractor</h3>
          {m.bySub.map(([sub, v]) => {
            const subItems = items.filter((i) => (i.assignee.trim() || 'Unassigned') === sub)
            const mailto = buildSubMailto(project, sub === 'Unassigned' ? '' : sub, v.email, subItems)
            return (
              <div className="sub-row" key={sub}>
                <div className="sub-main">
                  <strong>{sub}</strong>
                  <span className="muted">{v.open} open · {v.total} total</span>
                </div>
                {sub !== 'Unassigned' && v.open > 0 && (
                  <a className="btn ghost small" href={mailto}>✉ Email list</a>
                )}
              </div>
            )
          })}
        </section>

        {m.aging.length > 0 && (
          <section className="dash-section">
            <h3>Oldest open items</h3>
            {m.aging.map((it) => (
              <Link key={it.id} to={`/project/${projectId}/item/${it.id}`} className="aging-row">
                <span className="aging-title">{it.title || 'Untitled item'}</span>
                <span className={`aging-days ${isOverdue(it) ? 'due-overdue' : ''}`}>{daysOpen(it)}d</span>
              </Link>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
