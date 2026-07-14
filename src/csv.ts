import type { Project, PunchItem } from './types'
import { PRIORITY_LABEL, STATUS_LABEL } from './types'
import { formatCoords } from './geo'

function esc(value: string): string {
  const needsQuotes = /[",\n]/.test(value)
  const v = value.replace(/"/g, '""')
  return needsQuotes ? `"${v}"` : v
}

/** Build a punch-list CSV (one row per item) suitable for a spreadsheet. */
export function itemsToCsv(items: PunchItem[]): string {
  const headers = [
    '#',
    'Title',
    'Location',
    'Trade',
    'Priority',
    'Status',
    'Notes',
    'Photos',
    'Coordinates',
    'Created',
  ]
  const rows = items.map((item, i) =>
    [
      String(i + 1),
      item.title,
      item.location,
      item.trade,
      PRIORITY_LABEL[item.priority],
      STATUS_LABEL[item.status],
      item.note,
      String(item.photoIds.length),
      item.geo ? formatCoords(item.geo) : '',
      new Date(item.createdAt).toISOString(),
    ]
      .map(esc)
      .join(','),
  )
  return [headers.join(','), ...rows].join('\n')
}

export function downloadCsv(project: Project, items: PunchItem[]): void {
  const csv = itemsToCsv(items)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safeName = project.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'punch-list'
  a.href = url
  a.download = `${safeName}-punch-list.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
