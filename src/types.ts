export type Priority = 'low' | 'medium' | 'high'
export type Status = 'open' | 'in_progress' | 'done'

export interface Project {
  id: string
  name: string
  address: string
  createdAt: number
}

export interface Geo {
  lat: number
  lng: number
  accuracy?: number
}

export interface StatusChange {
  status: Status
  at: number
}

export interface PunchItem {
  id: string
  projectId: string
  title: string
  note: string
  /** Keys into the photos store; an item can have several photos (wide + close-up). */
  photoIds: string[]
  /** Completion / verification photos captured when the item was closed. */
  closePhotoIds: string[]
  location: string
  trade: string
  priority: Priority
  status: Status
  /** Subcontractor / company responsible, and where to email them. */
  assignee: string
  assigneeEmail: string
  /** Optional due date (ms timestamp, date granularity). */
  dueDate?: number
  /** Set when the item is first marked done. */
  closedAt?: number
  /** Audit trail of status transitions. */
  statusHistory: StatusChange[]
  /** Where the item was captured, if location was available. */
  geo?: Geo
  createdAt: number
  updatedAt: number
}

/** True when an open item's due date has passed. */
export function isOverdue(item: PunchItem): boolean {
  return item.status !== 'done' && item.dueDate !== undefined && item.dueDate < Date.now()
}

/** Days an item took to close (or has been open), rounded. */
export function daysOpen(item: PunchItem): number {
  const end = item.closedAt ?? Date.now()
  return Math.max(0, Math.round((end - item.createdAt) / 86400000))
}

export interface StoredPhoto {
  id: string
  blob: Blob
}

/** Company branding for the exported report. Stored locally. */
export interface Settings {
  companyName: string
  /** Logo as a data URL, or empty. */
  logo: string
}

export const TRADES = [
  'General',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Drywall',
  'Painting',
  'Flooring',
  'Carpentry',
  'Concrete',
  'Roofing',
  'Landscaping',
  'Other',
] as const

export const PRIORITIES: Priority[] = ['high', 'medium', 'low']

export const PRIORITY_LABEL: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const STATUS_LABEL: Record<Status, string> = {
  open: 'Open',
  in_progress: 'In progress',
  done: 'Done',
}
