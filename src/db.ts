import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Project, PunchItem, StoredPhoto } from './types'

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

let dbPromise: Promise<IDBPDatabase<FieldPunchDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<FieldPunchDB>('field-punch', 1, {
      upgrade(db) {
        db.createObjectStore('projects', { keyPath: 'id' })
        const items = db.createObjectStore('items', { keyPath: 'id' })
        items.createIndex('by-project', 'projectId')
        db.createObjectStore('photos', { keyPath: 'id' })
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
    if (item.photoId) await tx.objectStore('photos').delete(item.photoId)
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
  if (item?.photoId) await tx.objectStore('photos').delete(item.photoId)
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
