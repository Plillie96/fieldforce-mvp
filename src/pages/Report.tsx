import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProject, listItems, loadSettings } from '../db'
import { downloadCsv } from '../csv'
import { formatCoords, mapsLink } from '../geo'
import type { Priority, Project, PunchItem, Settings } from '../types'
import { PRIORITY_LABEL, STATUS_LABEL, TRADES, isOverdue } from '../types'
import { TopBar } from '../components/ui'
import { IconCheck, IconDownload, IconMapPin } from '../components/icons'
import { usePhotoUrl, usePhotoUrls } from '../usePhotoUrl'

const PRIO_PIN: Record<Priority, string> = { high: 'pin-high', medium: 'pin-medium', low: 'pin-low' }

function ReportPlan({
  planPhotoId,
  items,
  numberOf,
}: {
  planPhotoId: string
  items: PunchItem[]
  numberOf: (id: string) => number
}) {
  const url = usePhotoUrl(planPhotoId)
  const placed = items.filter((i) => i.pin)
  if (!url || placed.length === 0) return null
  return (
    <section className="report-group report-plan-section">
      <h2 className="report-group-head">
        Floor plan <span>{placed.length} pinned</span>
      </h2>
      <div className="plan-wrap report-plan">
        <img src={url} alt="Floor plan with item locations" />
        {placed.map((it) => (
          <span
            key={it.id}
            className={`map-pin ${PRIO_PIN[it.priority]} ${it.status === 'done' ? 'pin-done' : ''}`}
            style={{ left: `${it.pin!.x * 100}%`, top: `${it.pin!.y * 100}%` }}
          >
            {numberOf(it.id)}
          </span>
        ))}
      </div>
    </section>
  )
}

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
type GroupBy = 'area' | 'trade' | 'status' | 'assignee'
const GROUP_LABEL: Record<GroupBy, string> = { area: 'Area', trade: 'Trade', status: 'Status', assignee: 'Sub' }

function sortItems(items: PunchItem[]): PunchItem[] {
  return [...items].sort((a, b) => {
    if (PRIORITY_RANK[a.priority] !== PRIORITY_RANK[b.priority])
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    return a.createdAt - b.createdAt
  })
}

function buildGroups(items: PunchItem[], by: GroupBy): Array<{ key: string; items: PunchItem[] }> {
  const map = new Map<string, PunchItem[]>()
  for (const item of items) {
    const key =
      by === 'area'
        ? item.location.trim() || 'Unspecified area'
        : by === 'trade'
          ? item.trade
          : by === 'assignee'
            ? item.assignee.trim() || 'Unassigned'
            : STATUS_LABEL[item.status]
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  const keys = Array.from(map.keys())
  if (by === 'trade') keys.sort((a, b) => TRADES.indexOf(a as never) - TRADES.indexOf(b as never))
  else if (by === 'status') keys.sort() // In progress, Open, Done — alpha is fine enough
  else keys.sort((a, b) => a.localeCompare(b))
  return keys.map((key) => ({ key, items: sortItems(map.get(key)!) }))
}

function ReportRow({ item, index }: { item: PunchItem; index: number }) {
  const urls = usePhotoUrls(item.photoIds)
  return (
    <div className="report-item">
      <div className="report-photos">
        {urls.length ? (
          urls.slice(0, 3).map((u, i) => <img key={i} src={u} alt="" />)
        ) : (
          <div className="report-nophoto">No photo</div>
        )}
      </div>
      <div className="report-item-body">
        <div className="report-item-head">
          <span className="report-num">#{index}</span>
          <strong>{item.title || 'Untitled item'}</strong>
          <span className={`report-tag prio-${item.priority}`}>{PRIORITY_LABEL[item.priority]}</span>
          <span className="report-tag report-status">{STATUS_LABEL[item.status]}</span>
        </div>
        <div className="report-item-meta">
          {[item.location, item.trade, item.assignee].filter(Boolean).join(' · ') || 'No location'}
          {item.dueDate && (
            <span className={isOverdue(item) ? 'due-overdue' : ''}>
              {' · due '}
              {new Date(item.dueDate).toLocaleDateString()}
              {isOverdue(item) && ' (overdue)'}
            </span>
          )}
          {item.geo && (
            <>
              {' · '}
              <a href={mapsLink(item.geo)} target="_blank" rel="noreferrer">
                <IconMapPin size={12} /> {formatCoords(item.geo)}
              </a>
            </>
          )}
        </div>
        {item.note && <p className="report-item-note">{item.note}</p>}
        {item.closePhotoIds.length > 0 && (
          <div className="report-verified"><IconCheck size={13} /> Verified complete ({item.closePhotoIds.length} photo{item.closePhotoIds.length > 1 ? 's' : ''})</div>
        )}
      </div>
    </div>
  )
}

function StatTile({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className={`stat-tile ${tone ? 'tone-' + tone : ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export default function Report() {
  const { projectId } = useParams()
  const [project, setProject] = useState<Project>()
  const [items, setItems] = useState<PunchItem[]>([])
  const [settings, setSettings] = useState<Settings>({ companyName: '', logo: '' })
  const [groupBy, setGroupBy] = useState<GroupBy>('area')

  useEffect(() => {
    if (!projectId) return
    setSettings(loadSettings())
    Promise.all([getProject(projectId), listItems(projectId)]).then(([p, i]) => {
      setProject(p)
      setItems(i)
    })
  }, [projectId])

  const stats = useMemo(() => {
    const done = items.filter((i) => i.status === 'done').length
    return {
      total: items.length,
      open: items.filter((i) => i.status === 'open').length,
      in_progress: items.filter((i) => i.status === 'in_progress').length,
      done,
      pct: items.length ? Math.round((done / items.length) * 100) : 0,
      high: items.filter((i) => i.priority === 'high').length,
      medium: items.filter((i) => i.priority === 'medium').length,
      low: items.filter((i) => i.priority === 'low').length,
    }
  }, [items])

  const groups = useMemo(() => buildGroups(items, groupBy), [items, groupBy])

  if (!project) return <div className="page" />

  const generated = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const order = groups.flatMap((g) => g.items)
  const numberMap = new Map(order.map((it, i) => [it.id, i + 1]))
  const numberOf = (id: string) => numberMap.get(id) ?? 0

  return (
    <div className="page report-page">
      <div className="no-print">
        <TopBar
          title="Punch list report"
          back={`/project/${projectId}`}
          right={
            <button className="btn primary small" onClick={() => window.print()}>
              Print / PDF
            </button>
          }
        />
        <div className="report-controls">
          <div className="seg-group" role="group" aria-label="Group by">
            <span className="seg-caption">Group by</span>
            {(['area', 'trade', 'status', 'assignee'] as GroupBy[]).map((g) => (
              <button
                key={g}
                className={`seg-btn ${groupBy === g ? 'active' : ''}`}
                onClick={() => setGroupBy(g)}
              >
                {GROUP_LABEL[g]}
              </button>
            ))}
          </div>
          <button className="btn ghost small" onClick={() => downloadCsv(project, items)}>
            <IconDownload size={14} /> CSV
          </button>
        </div>
      </div>

      <div className="report-sheet">
        <div className="report-header">
          <div className="report-brand">
            {settings.logo && <img className="report-logo" src={settings.logo} alt="" />}
            <div>
              {settings.companyName && <div className="report-company">{settings.companyName}</div>}
              <h1>{project.name}</h1>
              {project.address && <p className="report-address">{project.address}</p>}
            </div>
          </div>
          <div className="report-header-right">
            <div className="report-title-word">PUNCH LIST</div>
            <div className="report-generated">Generated {generated}</div>
          </div>
        </div>

        <div className="report-dashboard">
          <StatTile label="Items" value={stats.total} />
          <StatTile label="Open" value={stats.open} tone="open" />
          <StatTile label="In progress" value={stats.in_progress} tone="prog" />
          <StatTile label="Done" value={stats.done} tone="done" />
          <div className="stat-tile tone-pct">
            <div className="stat-value">{stats.pct}%</div>
            <div className="stat-label">Complete</div>
            <div className="pct-bar">
              <span style={{ width: `${stats.pct}%` }} />
            </div>
          </div>
        </div>

        <div className="report-prio-row">
          <span className="report-tag prio-high">{stats.high} High</span>
          <span className="report-tag prio-medium">{stats.medium} Medium</span>
          <span className="report-tag prio-low">{stats.low} Low</span>
        </div>

        {project.planPhotoId && (
          <ReportPlan planPhotoId={project.planPhotoId} items={items} numberOf={numberOf} />
        )}

        {items.length === 0 ? (
          <p className="muted">No items captured yet.</p>
        ) : (
          groups.map((group) => (
            <section className="report-group" key={group.key}>
              <h2 className="report-group-head">
                {group.key} <span>{group.items.length}</span>
              </h2>
              {group.items.map((item) => (
                <ReportRow key={item.id} item={item} index={numberOf(item.id)} />
              ))}
            </section>
          ))
        )}

        <div className="report-signoff">
          <div className="signoff-line">
            <span className="signoff-slot" />
            <span className="signoff-label">Contractor — signature &amp; date</span>
          </div>
          <div className="signoff-line">
            <span className="signoff-slot" />
            <span className="signoff-label">Owner / GC — signature &amp; date</span>
          </div>
        </div>

        <div className="report-footer">
          {settings.companyName ? `${settings.companyName} · ` : ''}Generated with Field Punch
        </div>
      </div>
    </div>
  )
}
