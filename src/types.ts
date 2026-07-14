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

export interface PunchItem {
  id: string
  projectId: string
  title: string
  note: string
  /** Keys into the photos store; an item can have several photos (wide + close-up). */
  photoIds: string[]
  location: string
  trade: string
  priority: Priority
  status: Status
  /** Where the item was captured, if location was available. */
  geo?: Geo
  createdAt: number
  updatedAt: number
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
