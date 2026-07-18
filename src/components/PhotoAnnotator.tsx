import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { IconArrowUpRight, IconCircle, IconPencil } from './icons'

type Tool = 'arrow' | 'oval' | 'pen'
interface Point {
  x: number
  y: number
}
interface Shape {
  tool: Tool
  color: string
  points: Point[]
}

const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#ffffff']
const TOOLS: Array<{ id: Tool; icon: ReactNode; label: string }> = [
  { id: 'arrow', icon: <IconArrowUpRight size={19} />, label: 'Arrow' },
  { id: 'oval', icon: <IconCircle size={18} />, label: 'Circle' },
  { id: 'pen', icon: <IconPencil size={17} />, label: 'Draw' },
]

function drawShape(ctx: CanvasRenderingContext2D, s: Shape, w: number) {
  ctx.strokeStyle = s.color
  ctx.lineWidth = Math.max(3, w * 0.008)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  const a = s.points[0]
  const b = s.points[s.points.length - 1]
  if (s.tool === 'pen') {
    ctx.beginPath()
    s.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
    ctx.stroke()
  } else if (s.tool === 'oval') {
    ctx.beginPath()
    ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
    const ang = Math.atan2(b.y - a.y, b.x - a.x)
    const head = Math.max(14, w * 0.035)
    ctx.beginPath()
    ctx.moveTo(b.x, b.y)
    ctx.lineTo(b.x - head * Math.cos(ang - 0.42), b.y - head * Math.sin(ang - 0.42))
    ctx.moveTo(b.x, b.y)
    ctx.lineTo(b.x - head * Math.cos(ang + 0.42), b.y - head * Math.sin(ang + 0.42))
    ctx.stroke()
  }
}

/**
 * Full-screen markup editor: draw arrows / circles / freehand on a photo, then
 * flatten to a new JPEG blob. Non-destructive — the caller decides what to do
 * with the result.
 */
export function PhotoAnnotator({
  src,
  onSave,
  onCancel,
}: {
  src: string
  onSave: (blob: Blob) => void
  onCancel: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const shapesRef = useRef<Shape[]>([])
  const draftRef = useRef<Shape | null>(null)
  const [tool, setTool] = useState<Tool>('arrow')
  const [color, setColor] = useState(COLORS[0])
  const [count, setCount] = useState(0) // forces toolbar (undo) refresh
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      const c = canvasRef.current
      if (!c) return
      c.width = img.naturalWidth || 1200
      c.height = img.naturalHeight || 900
      redraw()
    }
    img.src = src
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  function redraw() {
    const c = canvasRef.current
    const img = imgRef.current
    if (!c || !img) return
    const ctx = c.getContext('2d')!
    ctx.drawImage(img, 0, 0, c.width, c.height)
    const all = draftRef.current ? [...shapesRef.current, draftRef.current] : shapesRef.current
    for (const s of all) drawShape(ctx, s, c.width)
  }

  function toCanvas(e: React.PointerEvent): Point {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height }
  }

  function onDown(e: React.PointerEvent) {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    draftRef.current = { tool, color, points: [toCanvas(e)] }
  }
  function onMove(e: React.PointerEvent) {
    if (!draftRef.current) return
    const p = toCanvas(e)
    if (tool === 'pen') draftRef.current.points.push(p)
    else draftRef.current.points[1] = p
    redraw()
  }
  function onUp() {
    if (draftRef.current && draftRef.current.points.length >= 1) {
      // ignore zero-length taps for arrow/oval
      const pts = draftRef.current.points
      if (tool === 'pen' || pts.length > 1) shapesRef.current.push(draftRef.current)
    }
    draftRef.current = null
    setCount((n) => n + 1)
    redraw()
  }

  function undo() {
    shapesRef.current.pop()
    setCount((n) => n + 1)
    redraw()
  }

  function save() {
    const c = canvasRef.current
    if (!c || saving) return
    setSaving(true)
    c.toBlob((blob) => blob && onSave(blob), 'image/jpeg', 0.85)
  }

  return (
    <div className="annotator">
      <div className="annotator-bar top">
        <button className="anno-btn" onClick={onCancel}>Cancel</button>
        <button className="anno-btn" onClick={undo} disabled={count === 0 && shapesRef.current.length === 0}>↺ Undo</button>
        <button className="anno-btn primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>

      <div className="annotator-canvas">
        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
        />
      </div>

      <div className="annotator-bar bottom">
        <div className="anno-tools">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              className={`anno-tool ${tool === t.id ? 'on' : ''}`}
              onClick={() => setTool(t.id)}
              aria-label={t.label}
            >
              {t.icon}
            </button>
          ))}
        </div>
        <div className="anno-colors">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`anno-color ${color === c ? 'on' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
