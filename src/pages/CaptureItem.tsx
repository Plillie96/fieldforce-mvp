import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { saveItem, savePhoto, uid } from '../db'
import { compressImage } from '../image'
import type { Priority } from '../types'
import { TRADES } from '../types'
import { DictateLabel, TopBar } from '../components/ui'

export default function CaptureItem() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [previewUrl, setPreviewUrl] = useState<string>()
  const [photoBlob, setPhotoBlob] = useState<Blob>()
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [location, setLocation] = useState('')
  const [trade, setTrade] = useState<string>('General')
  const [priority, setPriority] = useState<Priority>('medium')
  const [saving, setSaving] = useState(false)

  async function onPhotoPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const blob = await compressImage(file)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPhotoBlob(blob)
    setPreviewUrl(URL.createObjectURL(blob))
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!projectId || saving) return
    if (!title.trim() && !photoBlob) {
      alert('Add a photo or a title first.')
      return
    }
    setSaving(true)
    const now = Date.now()
    let photoId: string | undefined
    if (photoBlob) {
      photoId = uid()
      await savePhoto(photoId, photoBlob)
    }
    await saveItem({
      id: uid(),
      projectId,
      title: title.trim(),
      note: note.trim(),
      photoId,
      location: location.trim(),
      trade,
      priority,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    })
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    navigate(`/project/${projectId}`, { replace: true })
  }

  return (
    <div className="page">
      <TopBar title="New punch item" back={-1} />

      <form className="page-body form" onSubmit={onSave}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={onPhotoPicked}
        />

        <button
          type="button"
          className={`photo-drop ${previewUrl ? 'has-photo' : ''}`}
          onClick={() => fileRef.current?.click()}
        >
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="Captured" />
              <span className="photo-retake">Tap to retake</span>
            </>
          ) : (
            <span className="photo-cta">
              <span className="photo-cam">📷</span>
              Take photo
            </span>
          )}
        </button>

        <div className="field">
          <DictateLabel caption="What's the issue?" value={title} onChange={setTitle} />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Speak or type — e.g. Cracked tile by entry"
          />
        </div>

        <label>
          Location / area
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Kitchen, Unit 4B"
          />
        </label>

        <div className="grid-2">
          <label>
            Trade
            <select value={trade} onChange={(e) => setTrade(e.target.value)}>
              {TRADES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
        </div>

        <div className="field">
          <DictateLabel caption="Notes" value={note} onChange={setNote} />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tap 🎤 Speak and describe it — details, measurements, who's responsible…"
            rows={3}
          />
        </div>

        <div className="sticky-actions">
          <button type="button" className="btn ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save item'}
          </button>
        </div>
      </form>
    </div>
  )
}
