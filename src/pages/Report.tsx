import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProject, listItems } from '../db'
import type { Project, PunchItem } from '../types'
import { PRIORITY_LABEL, STATUS_LABEL } from '../types'
import { TopBar } from '../components/ui'
import { usePhotoUrl } from '../usePhotoUrl'

const PRIORITY_RANK: Record<PunchItem['priority'], number> = { high: 0, medium: 1, low: 2 }

function ReportRow({ item, index }: { item: PunchItem; index: number }) {
  const url = usePhotoUrl(item.photoId)
  return (
    <div className="report-item">
      <div className="report-photo">
        {url ? <img src={url} alt="" /> : <div className="report-nophoto">No photo</div>}
      </div>
      <div className="report-item-body">
        <div className="report-item-head">
          <span className="report-num">#{index + 1}</span>
          <strong>{item.title || 'Untitled item'}</strong>
          <span className={`report-tag prio-${item.priority}`}>{PRIORITY_LABEL[item.priority]}</span>
          <span className="report-tag report-status">{STATUS_LABEL[item.status]}</span>
        </div>
        <div className="report-item-meta">
          {[item.location, item.trade].filter(Boolean).join(' · ') || 'No location'}
        </div>
        {item.note && <p className="report-item-note">{item.note}</p>}
      </div>
    </div>
  )
}

export default function Report() {
  const { projectId } = useParams()
  const [project, setProject] = useState<Project>()
  const [items, setItems] = useState<PunchItem[]>([])

  useEffect(() => {
    if (!projectId) return
    Promise.all([getProject(projectId), listItems(projectId)]).then(([p, i]) => {
      setProject(p)
      setItems(
        [...i].sort((a, b) => {
          if (PRIORITY_RANK[a.priority] !== PRIORITY_RANK[b.priority])
            return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
          return a.createdAt - b.createdAt
        }),
      )
    })
  }, [projectId])

  if (!project) return <div className="page" />

  const open = items.filter((i) => i.status !== 'done').length
  const generated = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

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
      </div>

      <div className="report-sheet">
        <div className="report-header">
          <div>
            <h1>{project.name}</h1>
            {project.address && <p className="report-address">{project.address}</p>}
          </div>
          <div className="report-header-right">
            <div className="report-title-word">PUNCH LIST</div>
            <div className="report-generated">Generated {generated}</div>
          </div>
        </div>

        <div className="report-summary">
          <span>
            <strong>{items.length}</strong> items
          </span>
          <span>
            <strong>{open}</strong> open
          </span>
          <span>
            <strong>{items.length - open}</strong> done
          </span>
        </div>

        {items.length === 0 ? (
          <p className="muted">No items captured yet.</p>
        ) : (
          <div className="report-list">
            {items.map((item, idx) => (
              <ReportRow key={item.id} item={item} index={idx} />
            ))}
          </div>
        )}

        <div className="report-footer">Generated with Field Punch</div>
      </div>
    </div>
  )
}
