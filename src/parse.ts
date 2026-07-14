import type { Priority } from './types'
import { TRADES } from './types'

export interface ParsedItem {
  title: string
  trade?: string
  priority?: Priority
  location?: string
}

const PRIORITY_WORDS: Array<{ re: RegExp; value: Priority }> = [
  { re: /\b(high priority|urgent|critical|asap|high)\b/i, value: 'high' },
  { re: /\b(low priority|minor|cosmetic|low)\b/i, value: 'low' },
  { re: /\b(medium priority|normal|medium|moderate)\b/i, value: 'medium' },
]

// Extra spoken synonyms that map onto a canonical trade.
const TRADE_HINTS: Array<{ re: RegExp; trade: string }> = [
  { re: /\b(electric\w*|outlet|wiring|breaker|light\w*)\b/i, trade: 'Electrical' },
  { re: /\b(plumb\w*|pipe|faucet|drain|leak|sink|toilet)\b/i, trade: 'Plumbing' },
  { re: /\b(hvac|duct|thermostat|furnace|ac unit|air condition\w*)\b/i, trade: 'HVAC' },
  { re: /\b(drywall|sheetrock|gypsum)\b/i, trade: 'Drywall' },
  { re: /\b(paint\w*)\b/i, trade: 'Painting' },
  { re: /\b(floor\w*|tile|carpet|hardwood)\b/i, trade: 'Flooring' },
  { re: /\b(carpentr\w*|trim|door|cabinet|framing)\b/i, trade: 'Carpentry' },
  { re: /\b(concrete|slab|foundation)\b/i, trade: 'Concrete' },
  { re: /\b(roof\w*|shingle|gutter)\b/i, trade: 'Roofing' },
  { re: /\b(landscap\w*|grading|sod|irrigation)\b/i, trade: 'Landscaping' },
]

const LOCATION_RE =
  /\b(?:in|at|by|near|on|inside|outside)\s+(?:the\s+)?([a-z0-9][a-z0-9 '\-#]{1,28}?)(?=[.,]|\s+(?:and|with|it's|its|priority|high|medium|low|urgent)\b|$)/i

/**
 * Parse a single spoken sentence into structured fields. Everything is a hint —
 * the raw sentence is always kept as the title so nothing is lost.
 */
export function parseSpokenItem(raw: string): ParsedItem {
  const text = raw.trim().replace(/\s+/g, ' ')
  if (!text) return { title: '' }

  let priority: Priority | undefined
  for (const p of PRIORITY_WORDS) {
    if (p.re.test(text)) {
      priority = p.value
      break
    }
  }

  let trade: string | undefined
  const directTrade = TRADES.find((t) => t !== 'Other' && new RegExp(`\\b${t}\\b`, 'i').test(text))
  if (directTrade) trade = directTrade
  if (!trade) {
    const hint = TRADE_HINTS.find((h) => h.re.test(text))
    if (hint) trade = hint.trade
  }

  let location: string | undefined
  const locMatch = text.match(LOCATION_RE)
  if (locMatch) {
    location = titleCase(locMatch[1].trim())
  }

  // Title: the sentence with the priority phrase trimmed, capitalized.
  let title = text
  for (const p of PRIORITY_WORDS) title = title.replace(p.re, '')
  title = title.replace(/\bpriority\b/gi, '').replace(/\s+/g, ' ').replace(/[\s,]+$/,'').trim()
  title = title.charAt(0).toUpperCase() + title.slice(1)

  return { title: title || text, trade, priority, location }
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}
