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

/** Legacy shape across schema versions (single photoId; missing pro fields). */
type LegacyItem = Omit<PunchItem, 'photoIds'> & { photoId?: string; photoIds?: string[] }

let dbPromise: Promise<IDBPDatabase<FieldPunchDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<FieldPunchDB>('field-punch', 3, {
      async upgrade(db, oldVersion, _newVersion, tx) {
        if (oldVersion < 1) {
          db.createObjectStore('projects', { keyPath: 'id' })
          const items = db.createObjectStore('items', { keyPath: 'id' })
          items.createIndex('by-project', 'projectId')
          db.createObjectStore('photos', { keyPath: 'id' })
        }
        if (oldVersion >= 1 && oldVersion < 3) {
          const store = tx.objectStore('items')
          let cursor = await store.openCursor()
          while (cursor) {
            const item = cursor.value as unknown as LegacyItem
            // v2: single photoId -> photoIds[]
            if (!item.photoIds) {
              item.photoIds = item.photoId ? [item.photoId] : []
              delete item.photoId
            }
            // v3: assignee, due date, close photos, audit trail
            if (item.closePhotoIds === undefined) item.closePhotoIds = []
            if (item.assignee === undefined) item.assignee = ''
            if (item.assigneeEmail === undefined) item.assigneeEmail = ''
            if (item.statusHistory === undefined) {
              item.statusHistory = [{ status: item.status, at: item.createdAt }]
            }
            if (item.status === 'done' && item.closedAt === undefined) {
              item.closedAt = item.updatedAt
            }
            await cursor.update(item as unknown as PunchItem)
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
  const [project, items] = await Promise.all([getProject(id), listItems(id)])
  const tx = db.transaction(['projects', 'items', 'photos'], 'readwrite')
  await tx.objectStore('projects').delete(id)
  if (project?.planPhotoId) await tx.objectStore('photos').delete(project.planPhotoId)
  for (const item of items) {
    await tx.objectStore('items').delete(item.id)
    for (const pid of [...item.photoIds, ...(item.closePhotoIds ?? [])]) {
      await tx.objectStore('photos').delete(pid)
    }
  }
  await tx.done
}

/** Set (or replace) the project's floor-plan image. Returns the photo id. */
export async function setProjectPlan(projectId: string, blob: Blob): Promise<string> {
  const project = await getProject(projectId)
  if (!project) throw new Error('Project not found')
  const id = uid()
  await savePhoto(id, blob)
  if (project.planPhotoId) await deletePhoto(project.planPhotoId)
  await saveProject({ ...project, planPhotoId: id })
  return id
}

export async function removeProjectPlan(projectId: string): Promise<void> {
  const project = await getProject(projectId)
  if (!project?.planPhotoId) return
  await deletePhoto(project.planPhotoId)
  await saveProject({ ...project, planPhotoId: undefined })
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

// ---- Project export / import (device-to-device transfer) ----

export interface ProjectBundle {
  format: 'field-punch-project'
  version: 1
  exportedAt: number
  project: Project
  items: PunchItem[]
  photos: Array<{ id: string; dataUrl: string }>
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}

export async function exportProject(projectId: string): Promise<ProjectBundle> {
  const project = await getProject(projectId)
  if (!project) throw new Error('Project not found')
  const items = await listItems(projectId)
  const photoIds = new Set<string>()
  if (project.planPhotoId) photoIds.add(project.planPhotoId)
  for (const item of items) {
    for (const id of item.photoIds) photoIds.add(id)
    for (const id of item.closePhotoIds) photoIds.add(id)
  }
  const photos: ProjectBundle['photos'] = []
  for (const id of photoIds) {
    const blob = await getPhotoBlob(id)
    if (blob) photos.push({ id, dataUrl: await blobToDataUrl(blob) })
  }
  return {
    format: 'field-punch-project',
    version: 1,
    exportedAt: Date.now(),
    project,
    items,
    photos,
  }
}

/** Import a bundle as a NEW project (fresh ids) so it never collides. Returns the new project id. */
export async function importProject(bundle: ProjectBundle): Promise<string> {
  if (bundle?.format !== 'field-punch-project') throw new Error('Not a Field Punch project file')
  const db = await getDB()

  // Remap photo ids so imports never clobber existing photos.
  const photoIdMap = new Map<string, string>()
  for (const p of bundle.photos) {
    const newId = uid()
    photoIdMap.set(p.id, newId)
    await db.put('photos', { id: newId, blob: await dataUrlToBlob(p.dataUrl) })
  }

  const newProjectId = uid()
  await db.put('projects', {
    ...bundle.project,
    id: newProjectId,
    name: bundle.project.name + ' (imported)',
    planPhotoId: bundle.project.planPhotoId ? photoIdMap.get(bundle.project.planPhotoId) : undefined,
    createdAt: Date.now(),
  })

  const remap = (ids: string[]) => ids.map((id) => photoIdMap.get(id)).filter((x): x is string => !!x)
  for (const item of bundle.items) {
    await db.put('items', {
      ...item,
      id: uid(),
      projectId: newProjectId,
      photoIds: remap(item.photoIds),
      closePhotoIds: remap(item.closePhotoIds ?? []),
    })
  }
  return newProjectId
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

export interface CaptureMemory {
  location: string
  trade: string
  assignee: string
  assigneeEmail: string
}

export function loadCaptureMemory(projectId: string): CaptureMemory {
  const fallback = { location: '', trade: 'General', assignee: '', assigneeEmail: '' }
  try {
    const raw = localStorage.getItem('field-punch:last:' + projectId)
    if (raw) return { ...fallback, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return fallback
}

export function saveCaptureMemory(projectId: string, memory: CaptureMemory): void {
  try {
    localStorage.setItem('field-punch:last:' + projectId, JSON.stringify(memory))
  } catch {
    /* ignore */
  }
}
