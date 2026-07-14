import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteProject, getProject, listItems } from '../db'
import type { Project, PunchItem, Status } from '../types'
import { EmptyState, PriorityDot, StatusBadge, TopBar } from '../components/ui'
import { usePhotoUrl } from '../usePhotoUrl'

const PRIORITY_RANK: Record<PunchItem['priority'], number> = { high: 0, medium: 1, low: 2 }

function ItemThumb({ item }: { item: PunchItem }) {
  const url = usePhotoUrl(item.photoIds[0])
  return (
    <div className="thumb">
      {url ? <img src={url} alt="" /> : <span className="thumb-placeholder">📷</span>}
      {item.photoIds.length > 1 && <span className="thumb-count">{item.photoIds.length}</span>}
    </div>
  )
}

type Filter = 'all' | Status

export default function ProjectView() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project>()
  const [items, setItems] = useState<PunchItem[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    Promise.all([getProject(projectId), listItems(projectId)]).then(([p, i]) => {
      if (!p) {
        navigate('/')
        return
      }
      setProject(p)
      setItems(i)
      setLoading(false)
    })
  }, [projectId, navigate])

  const counts = useMemo(() => {
    return {
      all: items.length,
      open: items.filter((i) => i.status === 'open').length,
      in_progress: items.filter((i) => i.status === 'in_progress').length,
      done: items.filter((i) => i.status === 'done').length,
    }
  }, [items])

  const visible = useMemo(() => {
    const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter)
    // Open items first, then by priority, then newest.
    return [...filtered].sort((a, b) => {
      const doneA = a.status === 'done' ? 1 : 0
      const doneB = b.status === 'done' ? 1 : 0
      if (doneA !== doneB) return doneA - doneB
      if (PRIORITY_RANK[a.priority] !== PRIORITY_RANK[b.priority])
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
      return b.createdAt - a.createdAt
    })
  }, [items, filter])

  async function onDeleteProject() {
    if (!project) return
    if (!confirm(`Delete "${project.name}" and all ${items.length} of its items? This cannot be undone.`))
      return
    await deleteProject(project.id)
    navigate('/')
  }

  if (loading || !project) return <div className="page" />

  return (
    <div className="page">
      <TopBar
        title={project.name}
        subtitle={project.address || undefined}
        back="/"
        right={
          <button className="icon-btn" aria-label="Delete project" onClick={onDeleteProject}>
            🗑
          </button>
        }
      />

      <div className="filter-row">
        {(['all', 'open', 'in_progress', 'done'] as Filter[]).map((f) => (
          <button
            key={f}
            className={`chip ${filter === f ? 'chip-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'in_progress' ? 'In progress' : f[0].toUpperCase() + f.slice(1)}
            <span className="chip-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      <div className="page-body">
        {items.length > 0 && (
          <Link to={`/project/${project.id}/report`} className="report-link">
            📄 View / export punch list report
          </Link>
        )}

        {visible.length === 0 ? (
          <EmptyState
            icon="📷"
            title={items.length === 0 ? 'No punch items yet' : 'Nothing here'}
            hint={
              items.length === 0
                ? 'Tap the camera button to capture your first item.'
                : 'Try a different filter.'
            }
          />
        ) : (
          <ul className="card-list">
            {visible.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/project/${project.id}/item/${item.id}`}
                  className={`card item-card ${item.status === 'done' ? 'is-done' : ''}`}
                >
                  <ItemThumb item={item} />
                  <div className="item-card-main">
                    <div className="item-card-head">
                      <h3>{item.title || 'Untitled item'}</h3>
                      <PriorityDot priority={item.priority} />
                    </div>
                    <p className="muted item-meta">
                      {[item.location, item.trade].filter(Boolean).join(' · ') || 'No location'}
                    </p>
                    <StatusBadge status={item.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        className="fab camera-fab"
        onClick={() => navigate(`/project/${project.id}/capture`)}
        aria-label="Add punch item"
      >
        <span className="fab-cam">＋</span>
      </button>
    </div>
  )
}
