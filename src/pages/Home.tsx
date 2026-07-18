import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { importProject, listItems, listProjects, saveProject, uid } from '../db'
import type { Project } from '../types'
import { EmptyState } from '../components/ui'

interface ProjectRow extends Project {
  total: number
  open: number
}

export default function Home() {
  const [rows, setRows] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const bundle = JSON.parse(await file.text())
      await importProject(bundle)
      refresh()
    } catch {
      alert('That doesn’t look like a Field Punch project file.')
    }
  }

  async function refresh() {
    const projects = await listProjects()
    const withCounts = await Promise.all(
      projects.map(async (p) => {
        const items = await listItems(p.id)
        return {
          ...p,
          total: items.length,
          open: items.filter((i) => i.status !== 'done').length,
        }
      }),
    )
    setRows(withCounts)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function createProject(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await saveProject({
      id: uid(),
      name: name.trim(),
      address: address.trim(),
      createdAt: Date.now(),
    })
    setName('')
    setAddress('')
    setShowForm(false)
    refresh()
  }

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-mark">FP</div>
        <div className="hero-titles">
          <h1>Field Punch</h1>
          <p>Walk the site. Snap, speak, done.</p>
        </div>
        <Link to="/settings" className="hero-gear" aria-label="Company & report settings">
          ⚙
        </Link>
      </header>

      <div className="page-body">
        {loading ? (
          <EmptyState icon="…" title="Loading" />
        ) : rows.length === 0 && !showForm ? (
          <EmptyState
            icon="📋"
            title="No projects yet"
            hint="Create a project for the site or building you're walking."
          />
        ) : (
          <ul className="card-list">
            {rows.map((p) => (
              <li key={p.id}>
                <Link to={`/project/${p.id}`} className="card project-card">
                  <div className="project-card-main">
                    <h3>{p.name}</h3>
                    {p.address && <p className="muted">{p.address}</p>}
                    {p.total > 0 && (
                      <div className="proj-pct">
                        <div className="pct-bar">
                          <span style={{ width: `${Math.round(((p.total - p.open) / p.total) * 100)}%` }} />
                        </div>
                        <div className="proj-pct-row">
                          <span>{p.open} open</span>
                          <span>{Math.round(((p.total - p.open) / p.total) * 100)}% complete</span>
                        </div>
                      </div>
                    )}
                    {p.total === 0 && <p className="muted proj-pct-row">No items yet</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {showForm && (
          <form className="card form-card" onSubmit={createProject}>
            <h3>New project</h3>
            <label>
              Project name
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maple St. Renovation"
              />
            </label>
            <label>
              Address / site (optional)
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Maple St, Unit 4"
              />
            </label>
            <div className="form-actions">
              <button type="button" className="btn ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn primary">
                Create
              </button>
            </div>
          </form>
        )}
      </div>

      {!showForm && !loading && (
        <div className="home-import">
          <input ref={importRef} type="file" accept=".json,application/json" hidden onChange={onImport} />
          <button className="link-btn" onClick={() => importRef.current?.click()}>
            ⬇ Import a project file
          </button>
        </div>
      )}

      {!showForm && (
        <button className="fab" onClick={() => setShowForm(true)} aria-label="New project">
          +
        </button>
      )}
    </div>
  )
}
