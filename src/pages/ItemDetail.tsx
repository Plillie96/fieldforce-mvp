import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteItem, getItem, saveItem } from '../db'
import type { PunchItem, Priority, Status } from '../types'
import { TRADES } from '../types'
import { DictateLabel, TopBar } from '../components/ui'
import { usePhotoUrl } from '../usePhotoUrl'

const STATUS_FLOW: Status[] = ['open', 'in_progress', 'done']

export default function ItemDetail() {
  const { projectId, itemId } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<PunchItem>()
  const [editing, setEditing] = useState(false)
  const photoUrl = usePhotoUrl(item?.photoId)

  useEffect(() => {
    if (!itemId) return
    getItem(itemId).then((i) => {
      if (!i) navigate(`/project/${projectId}`, { replace: true })
      else setItem(i)
    })
  }, [itemId, projectId, navigate])

  async function update(patch: Partial<PunchItem>) {
    if (!item) return
    const next = { ...item, ...patch, updatedAt: Date.now() }
    setItem(next)
    await saveItem(next)
  }

  async function onDelete() {
    if (!item) return
    if (!confirm('Delete this punch item?')) return
    await deleteItem(item.id)
    navigate(`/project/${projectId}`, { replace: true })
  }

  if (!item) return <div className="page" />

  return (
    <div className="page">
      <TopBar
        title="Punch item"
        back={`/project/${projectId}`}
        right={
          <button className="icon-btn" aria-label="Delete item" onClick={onDelete}>
            🗑
          </button>
        }
      />

      <div className="page-body">
        {photoUrl && (
          <div className="detail-photo">
            <img src={photoUrl} alt={item.title} />
          </div>
        )}

        <div className="status-switch" role="tablist" aria-label="Status">
          {STATUS_FLOW.map((s) => (
            <button
              key={s}
              className={`status-seg status-seg-${s} ${item.status === s ? 'active' : ''}`}
              onClick={() => update({ status: s })}
            >
              {s === 'in_progress' ? 'In progress' : s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {editing ? (
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault()
              setEditing(false)
            }}
          >
            <div className="field">
              <DictateLabel
                caption="Issue"
                value={item.title}
                onChange={(v) => update({ title: v })}
              />
              <input value={item.title} onChange={(e) => update({ title: e.target.value })} />
            </div>
            <label>
              Location / area
              <input value={item.location} onChange={(e) => update({ location: e.target.value })} />
            </label>
            <div className="grid-2">
              <label>
                Trade
                <select value={item.trade} onChange={(e) => update({ trade: e.target.value })}>
                  {TRADES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select
                  value={item.priority}
                  onChange={(e) => update({ priority: e.target.value as Priority })}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>
            </div>
            <div className="field">
              <DictateLabel caption="Notes" value={item.note} onChange={(v) => update({ note: v })} />
              <textarea
                value={item.note}
                rows={4}
                onChange={(e) => update({ note: e.target.value })}
              />
            </div>
            <button type="submit" className="btn primary">
              Done editing
            </button>
          </form>
        ) : (
          <div className="detail-body">
            <h2>{item.title || 'Untitled item'}</h2>
            <dl className="detail-meta">
              <div>
                <dt>Location</dt>
                <dd>{item.location || '—'}</dd>
              </div>
              <div>
                <dt>Trade</dt>
                <dd>{item.trade}</dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd className={`prio-text prio-${item.priority}`}>
                  {item.priority[0].toUpperCase() + item.priority.slice(1)}
                </dd>
              </div>
            </dl>
            {item.note && <p className="detail-note">{item.note}</p>}
            <button className="btn ghost full" onClick={() => setEditing(true)}>
              ✎ Edit details
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
