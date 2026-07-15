/**
 * Field Punch icon set — crafted inline SVGs (Lucide-style: 24×24 grid,
 * stroke = currentColor, 2px round strokes). Replaces emoji UI glyphs so
 * icons inherit color, size, weight and motion, and never render as the
 * OS's cartoon emoji. Size defaults to 1em so they scale with text.
 */
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string }

function base({ size = '1em', ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
    ...props,
  }
}

/** Construction hardhat — the app mark. */
export function Hardhat(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M2 18h20v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1Z" />
      <path d="M4 18v-3a8 8 0 0 1 16 0v3" />
      <path d="M10 5.2V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.2" />
      <path d="M10 5.5A8 8 0 0 0 6.5 9M14 5.5A8 8 0 0 1 17.5 9" />
    </svg>
  )
}

export function Camera(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3 8a2 2 0 0 1 2-2h1.5l1.2-1.6A1 1 0 0 1 8.5 4h7a1 1 0 0 1 .8.4L17.5 6H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
      <circle cx="12" cy="12.5" r="3.2" />
    </svg>
  )
}

export function Mic(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  )
}

export function Gear(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 7l1.9 1.1M17.9 15.9l1.9 1.1M4.2 17l1.9-1.1M17.9 8.1l1.9-1.1" />
    </svg>
  )
}

export function Plus(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function ChevronLeft(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}

export function ChevronRight(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function MapPinIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.4" />
    </svg>
  )
}

export function Download(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  )
}

export function Check(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 12.5l5 5 11-11" />
    </svg>
  )
}

export function Clock(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

export function AlertTriangle(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 3.5 22 19a1 1 0 0 1-.9 1.5H2.9A1 1 0 0 1 2 19L12 3.5Z" />
      <path d="M12 9.5v4.5M12 17.5h.01" />
    </svg>
  )
}

export function X(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function Pencil(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="M13.5 6.5l3 3" />
    </svg>
  )
}

export function Dashboard(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  )
}

export function FileText(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
      <path d="M14 2v4h4M8 13h8M8 17h6" />
    </svg>
  )
}

export function ImageIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="M4 17l4.5-4.5a2 2 0 0 1 2.8 0L20 21" />
    </svg>
  )
}

export function MapIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  )
}

export function Trash(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </svg>
  )
}

export function Share(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 3v13M8 7l4-4 4 4" />
      <path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </svg>
  )
}

export function Mail(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  )
}

export function ClipboardList(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="5" y="4" width="14" height="18" rx="2" />
      <path d="M9 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V4Z" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  )
}
