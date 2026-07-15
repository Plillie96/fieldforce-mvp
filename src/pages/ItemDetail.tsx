import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteItem, deletePhoto, getItem, savePhoto, saveItem, uid } from '../db'
import { compressImage } from '../image'
import { formatCoords, mapsLink } from '../geo'
import type { PunchItem, Priority, Status } from '../types'
import { STATUS_LABEL, daysOpen, isOverdue } from '../types'
import { DictateLabel, PriorityChips, TopBar, TradeChips } from '../components/ui'
import { usePhotoUrls } from '../usePhotoUrl'

const STATUS_FLOW: Status[] = ['open', 'in_progress', 'done']

function toDateInput(ts?: number): string {
  if (!ts) return ''
  // Use LOCAL date parts (dueDate is stored as local noon) so the edit field
  // matches what the detail/report show via toLocaleDateString.
  const d = new Date(ts)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export default function ItemDetail() {
  const { projectId, itemId } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<PunchItem>()
  const [editing, setEditing] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)
  const closeRef = useRef<HTMLInputElement>(null)
  const photoUrls = usePhotoUrls(item?.photoIds ?? [])
  const closeUrls = usePhotoUrls(item?.closePhotoIds ?? [])

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

  async function changeStatus(next: Status) {
    if (!item || item.status === next) return
    const now = Date.now()
    const patch: Partial<PunchItem> = {
      status: next,
      statusHistory: [...(item.statusHistory ?? []), { status: next, at: now }],
    }
    if (next === 'done') patch.closedAt = item.closedAt ?? now
    else patch.closedAt = undefined // reopened
    await update(patch)
    // Nudge a completion photo the first time it's closed without one.
    if (next === 'done' && item.closePhotoIds.length === 0) closeRef.current?.click()
  }

  async function addPhotos(e: React.ChangeEvent<HTMLInputElement>, field: 'photoIds' | 'closePhotoIds') {
    if (!item) return
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    const newIds: string[] = []
    for (const file of files) {
      const blob = await compressImage(file)
      const id = uid()
      await savePhoto(id, blob)
      newIds.push(id)
    }
    if (newIds.length) await update({ [field]: [...item[field], ...newIds] })
  }

  async function removePhoto(id: string, field: 'photoIds' | 'closePhotoIds') {
    if (!item) return
    await update({ [field]: item[field].filter((p) => p !== id) })
    await deletePhoto(id)
  }

  async function onDelete() {
    if (!item) return
    if (!confirm('Delete this punch item?')) return
    await deleteItem(item.id)
    navigate(`/project/${projectId}`, { replace: true })
  }

  if (!item) return <div className="page" />
  const overdue = isOverdue(item)

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
        <input ref={photoRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => addPhotos(e, 'photoIds')} />
        <input ref={closeRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => addPhotos(e, 'closePhotoIds')} />

        {photoUrls.length > 0 && (
          <div className="detail-gallery">
            {photoUrls.map((url, i) => (
              <div className="detail-photo" key={i}>
                <img src={url} alt={`${item.title} photo ${i + 1}`} />
                {editing && (
                  <button type="button" className="photo-remove" aria-label="Remove photo" onClick={() => removePhoto(item.photoIds[i], 'photoIds')}>
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {editing && (
          <button type="button" className="btn ghost full" onClick={() => photoRef.current?.click()}>
            📷 Add photo
          </button>
        )}

        <div className="status-switch" role="tablist" aria-label="Status">
          {STATUS_FLOW.map((s) => (
            <button
              key={s}
              className={`status-seg status-seg-${s} ${item.status === s ? 'active' : ''}`}
              onClick={() => changeStatus(s)}
            >
              {s === 'in_progress' ? 'In progress' : s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Completion / verification photos */}
        {(item.status === 'done' || closeUrls.length > 0) && (
          <div className="close-photos">
            <div className="close-photos-head">
              <span>✅ Completion photos</span>
              <button type="button" className="btn ghost small" onClick={() => closeRef.current?.click()}>
                ＋ Add
              </button>
            </div>
            {closeUrls.length > 0 ? (
              <div className="photo-strip">
                {closeUrls.map((url, i) => (
                  <div className="photo-tile" key={i}>
                    <img src={url} alt="" />
                    <button type="button" className="photo-remove" aria-label="Remove photo" onClick={() => removePhoto(item.closePhotoIds[i], 'closePhotoIds')}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted close-hint">Add an "after" photo to verify the fix — it lands in the closeout report.</p>
            )}
          </div>
        )}

        {editing ? (
          <form className="form" onSubmit={(e) => { e.preventDefault(); setEditing(false) }}>
            <div className="field">
              <DictateLabel caption="Issue" value={item.title} onChange={(v) => update({ title: v })} />
              <input value={item.title} onChange={(e) => update({ title: e.target.value })} />
            </div>
            <div className="field">
              <span className="field-label">Location / area</span>
              <input value={item.location} onChange={(e) => update({ location: e.target.value })} />
            </div>
            <div className="field">
              <span className="field-label">Trade</span>
              <TradeChips value={item.trade} onChange={(t) => update({ trade: t })} />
            </div>
            <div className="field">
              <span className="field-label">Priority</span>
              <PriorityChips value={item.priority} onChange={(p: Priority) => update({ priority: p })} />
            </div>
            <div className="grid-2">
              <label>
                Assign to (sub)
                <input value={item.assignee} onChange={(e) => update({ assignee: e.target.value })} />
              </label>
              <label>
                Due date
                <input type="date" value={toDateInput(item.dueDate)} onChange={(e) => update({ dueDate: e.target.value ? new Date(e.target.value + 'T12:00:00').getTime() : undefined })} />
              </label>
            </div>
            <label>
              Sub's email
              <input type="email" value={item.assigneeEmail} onChange={(e) => update({ assigneeEmail: e.target.value })} />
            </label>
            <div className="field">
              <DictateLabel caption="Notes" value={item.note} onChange={(v) => update({ note: v })} />
              <textarea value={item.note} rows={4} onChange={(e) => update({ note: e.target.value })} />
            </div>
            <button type="submit" className="btn primary">Done editing</button>
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
                <dd className={`prio-text prio-${item.priority}`}>{item.priority[0].toUpperCase() + item.priority.slice(1)}</dd>
              </div>
              <div>
                <dt>Assigned to</dt>
                <dd>{item.assignee || '—'}</dd>
              </div>
              <div>
                <dt>Due</dt>
                <dd className={overdue ? 'due-overdue' : ''}>
                  {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—'}
                  {overdue && ' · overdue'}
                </dd>
              </div>
              <div>
                <dt>{item.closedAt ? 'Days to close' : 'Days open'}</dt>
                <dd>{daysOpen(item)}</dd>
              </div>
            </dl>
            {item.note && <p className="detail-note">{item.note}</p>}
            <p className="detail-stamp">
              Captured {new Date(item.createdAt).toLocaleString()}
              {item.geo && (
                <>
                  {' · '}
                  <a href={mapsLink(item.geo)} target="_blank" rel="noreferrer">📍 {formatCoords(item.geo)}</a>
                </>
              )}
              {item.closedAt && ` · Closed ${new Date(item.closedAt).toLocaleDateString()}`}
            </p>

            {item.statusHistory && item.statusHistory.length > 1 && (
              <details className="audit">
                <summary>Audit trail ({item.statusHistory.length} events)</summary>
                <ul>
                  {item.statusHistory.map((h, i) => (
                    <li key={i}>
                      <span className={`badge status-${h.status}`}>{STATUS_LABEL[h.status]}</span>
                      {new Date(h.at).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <button
              className="btn ghost full"
              onClick={() => navigate(`/project/${projectId}/plan?place=${item.id}`)}
            >
              {item.pin ? '📍 Re-pin on floor plan' : '🗺️ Pin on floor plan'}
            </button>
            <button className="btn ghost full" onClick={() => setEditing(true)}>✎ Edit details</button>
          </div>
        )}
      </div>
    </div>
  )
}
