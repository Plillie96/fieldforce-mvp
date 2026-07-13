import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listItems, listProjects, saveProject, uid } from '../db'
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
        <div className="hero-mark">◉</div>
        <div>
          <h1>Field Punch</h1>
          <p>Walk the site. Snap, note, done.</p>
        </div>
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
                  </div>
                  <div className="project-card-stats">
                    <span className="stat-open">{p.open} open</span>
                    <span className="muted">{p.total} total</span>
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

      {!showForm && (
        <button className="fab" onClick={() => setShowForm(true)} aria-label="New project">
          +
        </button>
      )}
    </div>
  )
}
