import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { loadCaptureMemory, saveCaptureMemory, saveItem, savePhoto, uid } from '../db'
import { compressImage } from '../image'
import { getCurrentLocation, reverseGeocode } from '../geo'
import { parseSpokenItem } from '../parse'
import type { Geo, Priority } from '../types'
import { DictateLabel, PriorityChips, TopBar, TradeChips } from '../components/ui'
import { IconCamera, IconMapPin, IconMic, IconPlus } from '../components/icons'
import { useDictation } from '../useDictation'

interface DraftPhoto {
  id: string
  blob: Blob
  url: string
}

export default function CaptureItem() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const memory = useMemo(
    () =>
      projectId
        ? loadCaptureMemory(projectId)
        : { location: '', trade: 'General', assignee: '', assigneeEmail: '' },
    [projectId],
  )

  const [photos, setPhotos] = useState<DraftPhoto[]>([])
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [location, setLocation] = useState(memory.location)
  const [trade, setTrade] = useState(memory.trade)
  const [priority, setPriority] = useState<Priority>('medium')
  const [assignee, setAssignee] = useState(memory.assignee)
  const [assigneeEmail, setAssigneeEmail] = useState(memory.assigneeEmail)
  const [dueDate, setDueDate] = useState('')
  const [geo, setGeo] = useState<Geo | null>(null)
  const [geoStatus, setGeoStatus] = useState<'locating' | 'ok' | 'off'>('locating')
  const [saving, setSaving] = useState(false)

  // Voice: speak a whole item, parse into fields.
  const speech = useDictation()
  const [speakMode, setSpeakMode] = useState(false)
  const [liveText, setLiveText] = useState('')
  const wasListening = useRef(false)

  // One-shot GPS on open; reverse-geocode to prefill location if empty.
  useEffect(() => {
    let cancelled = false
    getCurrentLocation().then(async (g) => {
      if (cancelled) return
      if (!g) {
        setGeoStatus('off')
        return
      }
      setGeo(g)
      setGeoStatus('ok')
      const place = await reverseGeocode(g)
      if (!cancelled && place) setLocation((cur) => cur || place)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // When speech recognition ends, apply the parsed sentence.
  useEffect(() => {
    if (wasListening.current && !speech.listening && speakMode) {
      if (liveText.trim()) applyParsed(liveText)
      setSpeakMode(false)
    }
    wasListening.current = speech.listening
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.listening, speakMode, liveText])

  useEffect(() => {
    return () => photos.forEach((p) => URL.revokeObjectURL(p.url))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function applyParsed(text: string) {
    const parsed = parseSpokenItem(text)
    setTitle(parsed.title)
    if (parsed.trade) setTrade(parsed.trade)
    if (parsed.priority) setPriority(parsed.priority)
    if (parsed.location) setLocation(parsed.location)
  }

  function toggleSpeakItem() {
    if (speech.listening) {
      speech.stop()
      return
    }
    setLiveText('')
    setSpeakMode(true)
    speech.start((t) => setLiveText(t))
  }

  async function onPhotoPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    for (const file of files) {
      const blob = await compressImage(file)
      const id = uid()
      setPhotos((prev) => [...prev, { id, blob, url: URL.createObjectURL(blob) }])
    }
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const gone = prev.find((p) => p.id === id)
      if (gone) URL.revokeObjectURL(gone.url)
      return prev.filter((p) => p.id !== id)
    })
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!projectId || saving) return
    if (!title.trim() && photos.length === 0) {
      alert('Add a photo or say/enter what the issue is first.')
      return
    }
    setSaving(true)
    const now = Date.now()
    for (const p of photos) await savePhoto(p.id, p.blob)
    await saveItem({
      id: uid(),
      projectId,
      title: title.trim(),
      note: note.trim(),
      photoIds: photos.map((p) => p.id),
      closePhotoIds: [],
      location: location.trim(),
      trade,
      priority,
      status: 'open',
      assignee: assignee.trim(),
      assigneeEmail: assigneeEmail.trim(),
      dueDate: dueDate ? new Date(dueDate + 'T12:00:00').getTime() : undefined,
      statusHistory: [{ status: 'open', at: now }],
      geo: geo ?? undefined,
      createdAt: now,
      updatedAt: now,
    })
    saveCaptureMemory(projectId, {
      location: location.trim(),
      trade,
      assignee: assignee.trim(),
      assigneeEmail: assigneeEmail.trim(),
    })
    photos.forEach((p) => URL.revokeObjectURL(p.url))
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

        {/* Photos */}
        {photos.length === 0 ? (
          <button
            type="button"
            className="photo-drop"
            onClick={() => fileRef.current?.click()}
          >
            <span className="photo-cta">
              <span className="photo-cam"><IconCamera size={38} strokeWidth={1.7} /></span>
              Take photo
            </span>
          </button>
        ) : (
          <div className="photo-strip">
            {photos.map((p) => (
              <div className="photo-tile" key={p.id}>
                <img src={p.url} alt="" />
                <button
                  type="button"
                  className="photo-remove"
                  aria-label="Remove photo"
                  onClick={() => removePhoto(p.id)}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className="photo-add"
              onClick={() => fileRef.current?.click()}
              aria-label="Add another photo"
            >
              <IconPlus size={20} />
              <span>Add</span>
            </button>
          </div>
        )}

        {/* Speak-an-item */}
        {speech.supported && (
          <button
            type="button"
            className={`speak-item ${speech.listening ? 'on' : ''}`}
            onClick={toggleSpeakItem}
          >
            {speech.listening ? (
              <>
                <span className="mic-wave" aria-hidden="true" />
                Listening… tap to finish
              </>
            ) : (
              <>
                <IconMic size={18} />
                Speak the whole item
              </>
            )}
          </button>
        )}
        {speakMode && speech.listening && (
          <p className="speak-live">{liveText || 'e.g. "cracked tile, high priority, in the kitchen"'}</p>
        )}

        <div className="field">
          <DictateLabel caption="What's the issue?" value={title} onChange={setTitle} />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Speak or type — e.g. Cracked tile by entry"
          />
        </div>

        <div className="field">
          <div className="label-row">
            <span className="field-label">Location / area</span>
            <span className={`geo-chip geo-${geoStatus}`}>
              <IconMapPin size={12} />
              {geoStatus === 'locating' && 'locating…'}
              {geoStatus === 'ok' && 'GPS tagged'}
              {geoStatus === 'off' && 'no GPS'}
            </span>
          </div>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Kitchen, Unit 4B"
          />
        </div>

        <div className="field">
          <span className="field-label">Trade</span>
          <TradeChips value={trade} onChange={setTrade} />
        </div>

        <div className="field">
          <span className="field-label">Priority</span>
          <PriorityChips value={priority} onChange={setPriority} />
        </div>

        <div className="grid-2">
          <label>
            Assign to (sub)
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="e.g. Ace Electric"
            />
          </label>
          <label>
            Due date
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        </div>
        <label>
          Sub's email (to send their list)
          <input
            type="email"
            inputMode="email"
            value={assigneeEmail}
            onChange={(e) => setAssigneeEmail(e.target.value)}
            placeholder="optional — foreman@acetric.com"
          />
        </label>

        <div className="field">
          <DictateLabel caption="Notes" value={note} onChange={setNote} />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tap Speak and describe it — details, measurements, who's responsible…"
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
