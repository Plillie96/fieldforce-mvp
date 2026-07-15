import type { Project, PunchItem } from './types'
import { PRIORITY_LABEL } from './types'

/**
 * Build a mailto: link that opens the user's mail app pre-filled with a
 * subcontractor's open punch items. No backend needed — the phone sends it.
 */
export function buildSubMailto(
  project: Project,
  assignee: string,
  email: string,
  items: PunchItem[],
): string {
  const open = items.filter((i) => i.status !== 'done')
  const subject = `Punch list — ${project.name} — ${assignee || 'your items'} (${open.length} open)`
  const lines = open.map((it, i) => {
    const bits = [
      `${i + 1}. ${it.title || 'Untitled item'}`,
      it.location ? `[${it.location}]` : '',
      `(${PRIORITY_LABEL[it.priority]})`,
      it.dueDate ? `due ${new Date(it.dueDate).toLocaleDateString()}` : '',
    ]
    return bits.filter(Boolean).join(' ')
  })
  const body =
    `Hi ${assignee || 'there'},\n\n` +
    `Here are your open punch list items for ${project.name}${project.address ? ` (${project.address})` : ''}:\n\n` +
    `${lines.join('\n')}\n\n` +
    `Please resolve these and reply when complete.\n\n` +
    `— Sent from Field Punch`
  const to = email ? encodeURIComponent(email) : ''
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
