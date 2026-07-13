export type Priority = 'low' | 'medium' | 'high'
export type Status = 'open' | 'in_progress' | 'done'

export interface Project {
  id: string
  name: string
  address: string
  createdAt: number
}

export interface PunchItem {
  id: string
  projectId: string
  title: string
  note: string
  /** Key into the photos store; undefined if no photo attached. */
  photoId?: string
  location: string
  trade: string
  priority: Priority
  status: Status
  createdAt: number
  updatedAt: number
}

export interface StoredPhoto {
  id: string
  blob: Blob
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
