import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getProject, listItems, removeProjectPlan, saveItem, setProjectPlan } from '../db'
import { compressImage } from '../image'
import type { Priority, Project, PunchItem } from '../types'
import { EmptyState, TopBar } from '../components/ui'
import { IconCircle, IconMap, IconMapPin, IconTrash } from '../components/icons'
import { usePhotoUrl } from '../usePhotoUrl'

const PRIO_CLASS: Record<Priority, string> = { high: 'pin-high', medium: 'pin-medium', low: 'pin-low' }

export default function PlanView() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [project, setProject] = useState<Project>()
  const [items, setItems] = useState<PunchItem[]>([])
  const [armed, setArmed] = useState<string | null>(params.get('place'))
  const fileRef = useRef<HTMLInputElement>(null)
  const planUrl = usePhotoUrl(project?.planPhotoId)

  async function refresh() {
    if (!projectId) return
    const [p, i] = await Promise.all([getProject(projectId), listItems(projectId)])
    setProject(p)
    setItems(i)
  }
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !projectId) return
    const blob = await compressImage(file, 2200, 0.82)
    await setProjectPlan(projectId, blob)
    refresh()
  }

  async function onPlanClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!armed) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))
    const item = items.find((it) => it.id === armed)
    if (item) await saveItem({ ...item, pin: { x, y }, updatedAt: Date.now() })
    clearArmed()
    refresh()
  }

  function clearArmed() {
    setArmed(null)
    if (params.has('place')) {
      params.delete('place')
      setParams(params, { replace: true })
    }
  }

  async function onRemovePlan() {
    if (!projectId) return
    if (!confirm('Remove the floor plan? Item pins are kept but won’t be shown until a new plan is added.')) return
    await removeProjectPlan(projectId)
    refresh()
  }

  if (!project) return <div className="page" />

  const placed = items.filter((i) => i.pin)
  const unplaced = items.filter((i) => !i.pin)
  const armedItem = items.find((i) => i.id === armed)
  const numberOf = (id: string) => items.findIndex((i) => i.id === id) + 1

  return (
    <div className="page">
      <TopBar
        title="Floor plan"
        subtitle={project.name}
        back={`/project/${projectId}`}
        right={
          project.planPhotoId ? (
            <button className="icon-btn" aria-label="Remove plan" onClick={onRemovePlan}>
              <IconTrash size={18} />
            </button>
          ) : undefined
        }
      />

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} />

      {!project.planPhotoId ? (
        <div className="page-body">
          <EmptyState
            icon={<IconMap size={30} />}
            title="No floor plan yet"
            hint="Upload a plan or sketch, then drop a pin on each item so the office sees exactly where every issue is."
          />
          <button className="btn primary full" onClick={() => fileRef.current?.click()}>
            Upload floor plan
          </button>
        </div>
      ) : (
        <div className="page-body">
          {armedItem && (
            <div className="plan-arm-banner">
              Tap the plan to place <strong>#{numberOf(armedItem.id)} {armedItem.title || 'item'}</strong>
              <button className="link-btn" onClick={clearArmed}>Cancel</button>
            </div>
          )}

          <div className={`plan-wrap ${armed ? 'placing' : ''}`} onClick={onPlanClick}>
            {planUrl && <img src={planUrl} alt="Floor plan" />}
            {placed.map((it) => (
              <button
                key={it.id}
                className={`map-pin ${PRIO_CLASS[it.priority]} ${it.status === 'done' ? 'pin-done' : ''}`}
                style={{ left: `${it.pin!.x * 100}%`, top: `${it.pin!.y * 100}%` }}
                onClick={(e) => {
                  if (armed) return // placing — let container handle it
                  e.stopPropagation()
                  navigate(`/project/${projectId}/item/${it.id}`)
                }}
                title={it.title}
              >
                {numberOf(it.id)}
              </button>
            ))}
          </div>

          <div className="plan-tools">
            <button className="btn ghost small" onClick={() => fileRef.current?.click()}>
              Replace plan
            </button>
            <span className="muted">{placed.length} placed · {unplaced.length} to place</span>
          </div>

          {items.length > 0 && (
            <div className="plan-picker">
              <p className="field-label">
                {armed ? 'Now tap the plan…' : 'Tap an item, then tap its spot on the plan:'}
              </p>
              <div className="chips chips-wrap">
                {items.map((it) => (
                  <button
                    key={it.id}
                    className={`chip-pick ${armed === it.id ? 'picked' : ''} ${it.pin ? 'chip-placed' : ''}`}
                    onClick={() => setArmed(armed === it.id ? null : it.id)}
                  >
                    {it.pin ? <IconMapPin size={13} /> : <IconCircle size={11} />} #{numberOf(it.id)} {it.title || 'Untitled'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
