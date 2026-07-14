import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Project, PunchItem, Settings, StoredPhoto } from './types'

interface FieldPunchDB extends DBSchema {
  projects: {
    key: string
    value: Project
  }
  items: {
    key: string
    value: PunchItem
    indexes: { 'by-project': string }
  }
  photos: {
    key: string
    value: StoredPhoto
  }
}

/** Legacy shape from schema v1: a single optional photoId instead of photoIds[]. */
type LegacyItem = Omit<PunchItem, 'photoIds'> & { photoId?: string; photoIds?: string[] }

let dbPromise: Promise<IDBPDatabase<FieldPunchDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<FieldPunchDB>('field-punch', 2, {
      async upgrade(db, oldVersion, _newVersion, tx) {
        if (oldVersion < 1) {
          db.createObjectStore('projects', { keyPath: 'id' })
          const items = db.createObjectStore('items', { keyPath: 'id' })
          items.createIndex('by-project', 'projectId')
          db.createObjectStore('photos', { keyPath: 'id' })
        }
        if (oldVersion < 2) {
          // Migrate single photoId -> photoIds[].
          const store = tx.objectStore('items')
          let cursor = await store.openCursor()
          while (cursor) {
            const item = cursor.value as unknown as LegacyItem
            if (!item.photoIds) {
              item.photoIds = item.photoId ? [item.photoId] : []
              delete item.photoId
              await cursor.update(item as unknown as PunchItem)
            }
            cursor = await cursor.continue()
          }
        }
      },
    })
  }
  return dbPromise
}

/** Small helper: RFC4122-ish unique id, works without crypto.randomUUID on older browsers. */
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ---- Projects ----

export async function listProjects(): Promise<Project[]> {
  const db = await getDB()
  const all = await db.getAll('projects')
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDB()
  return db.get('projects', id)
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDB()
  await db.put('projects', project)
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB()
  const items = await listItems(id)
  const tx = db.transaction(['projects', 'items', 'photos'], 'readwrite')
  await tx.objectStore('projects').delete(id)
  for (const item of items) {
    await tx.objectStore('items').delete(item.id)
    for (const pid of item.photoIds) await tx.objectStore('photos').delete(pid)
  }
  await tx.done
}

// ---- Items ----

export async function listItems(projectId: string): Promise<PunchItem[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('items', 'by-project', projectId)
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export async function getItem(id: string): Promise<PunchItem | undefined> {
  const db = await getDB()
  return db.get('items', id)
}

export async function saveItem(item: PunchItem): Promise<void> {
  const db = await getDB()
  await db.put('items', item)
}

export async function deleteItem(id: string): Promise<void> {
  const db = await getDB()
  const item = await db.get('items', id)
  const tx = db.transaction(['items', 'photos'], 'readwrite')
  await tx.objectStore('items').delete(id)
  if (item) for (const pid of item.photoIds) await tx.objectStore('photos').delete(pid)
  await tx.done
}

// ---- Photos ----

export async function savePhoto(id: string, blob: Blob): Promise<void> {
  const db = await getDB()
  await db.put('photos', { id, blob })
}

export async function getPhotoBlob(id: string): Promise<Blob | undefined> {
  const db = await getDB()
  const rec = await db.get('photos', id)
  return rec?.blob
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('photos', id)
}

// ---- Settings (company branding for reports) ----

const SETTINGS_KEY = 'field-punch:settings'

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { companyName: '', logo: '', ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return { companyName: '', logo: '' }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    /* ignore quota errors */
  }
}

// ---- Per-project capture memory ("same area" convenience) ----

interface CaptureMemory {
  location: string
  trade: string
}

export function loadCaptureMemory(projectId: string): CaptureMemory {
  try {
    const raw = localStorage.getItem('field-punch:last:' + projectId)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return { location: '', trade: 'General' }
}

export function saveCaptureMemory(projectId: string, memory: CaptureMemory): void {
  try {
    localStorage.setItem('field-punch:last:' + projectId, JSON.stringify(memory))
  } catch {
    /* ignore */
  }
}
