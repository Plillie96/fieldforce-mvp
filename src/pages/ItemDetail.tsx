import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteItem, deletePhoto, getItem, savePhoto, saveItem, uid } from '../db'
import { compressImage } from '../image'
import { formatCoords, mapsLink } from '../geo'
import type { PunchItem, Priority, Status } from '../types'
import { DictateLabel, PriorityChips, TopBar, TradeChips } from '../components/ui'
import { usePhotoUrls } from '../usePhotoUrl'

const STATUS_FLOW: Status[] = ['open', 'in_progress', 'done']

export default function ItemDetail() {
  const { projectId, itemId } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<PunchItem>()
  const [editing, setEditing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const photoUrls = usePhotoUrls(item?.photoIds ?? [])

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

  async function onAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
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
    if (newIds.length) await update({ photoIds: [...item.photoIds, ...newIds] })
  }

  async function removePhoto(id: string) {
    if (!item) return
    await update({ photoIds: item.photoIds.filter((p) => p !== id) })
    await deletePhoto(id)
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
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={onAddPhotos}
        />

        {photoUrls.length > 0 && (
          <div className="detail-gallery">
            {photoUrls.map((url, i) => (
              <div className="detail-photo" key={i}>
                <img src={url} alt={`${item.title} photo ${i + 1}`} />
                {editing && (
                  <button
                    type="button"
                    className="photo-remove"
                    aria-label="Remove photo"
                    onClick={() => removePhoto(item.photoIds[i])}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {editing && (
          <button type="button" className="btn ghost full" onClick={() => fileRef.current?.click()}>
            📷 Add photo
          </button>
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
              <PriorityChips
                value={item.priority}
                onChange={(p: Priority) => update({ priority: p })}
              />
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
            <p className="detail-stamp">
              Captured {new Date(item.createdAt).toLocaleString()}
              {item.geo && (
                <>
                  {' · '}
                  <a href={mapsLink(item.geo)} target="_blank" rel="noreferrer">
                    📍 {formatCoords(item.geo)}
                  </a>
                </>
              )}
            </p>
            <button className="btn ghost full" onClick={() => setEditing(true)}>
              ✎ Edit details
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
