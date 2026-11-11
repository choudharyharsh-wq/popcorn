// Small glyphs approximating n8n's own node-type icon language (generic shapes we drew
// ourselves — not n8n's or any integration's actual logo/trademark).
const stroke = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }

export function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <circle cx="12" cy="12" r="8.5" {...stroke} stroke="#e8e6e3" strokeWidth="1.6" />
      <path d="M12 7.5V12L15.3 14" {...stroke} stroke="#e8e6e3" strokeWidth="1.6" />
    </svg>
  )
}

export function CursorIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <path d="M6 4L18 12.5L12.8 13.6L15.6 19L13 20.2L10.2 14.8L6 18V4Z" fill="#e8e6e3" />
    </svg>
  )
}

export function LightningBadge() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13">
      <path d="M13 2L5 14H11L10 22L19 9H13L13 2Z" fill="#ff8f3c" stroke="#1a1512" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

export function SheetsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30">
      <rect x="2" y="2" width="20" height="20" rx="4.5" fill="#3fae5c" />
      <rect x="6.2" y="6.2" width="11.6" height="11.6" rx="1.3" {...stroke} stroke="#fff" strokeWidth="1.4" />
      <path d="M6.2 10.6H17.8M6.2 15H17.8M10.6 6.2V17.8" {...stroke} stroke="#fff" strokeWidth="1.1" />
    </svg>
  )
}

export function HttpIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <circle cx="12" cy="12" r="8.5" {...stroke} stroke="#7b8cf0" strokeWidth="1.6" />
      <path d="M3.5 12H20.5M12 3.5C14.8 6.3 14.8 17.7 12 20.5M12 3.5C9.2 6.3 9.2 17.7 12 20.5" {...stroke} stroke="#7b8cf0" strokeWidth="1.2" />
    </svg>
  )
}

export function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <path d="M4 6H20M6.5 12H17.5M9.5 18H14.5" {...stroke} stroke="#5aa7ff" strokeWidth="1.8" />
      <circle cx="16" cy="6" r="1.4" fill="#5aa7ff" />
      <circle cx="8.5" cy="12" r="1.4" fill="#5aa7ff" />
      <circle cx="13" cy="18" r="1.4" fill="#5aa7ff" />
    </svg>
  )
}

export function BranchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <path d="M4 12H10C12.5 12 12.5 7 15 7H18M15 7L12.5 4.5M15 7L12.5 9.5" {...stroke} stroke="#5fd38a" strokeWidth="1.7" />
      <path d="M10 12C12.5 12 12.5 17 15 17H18M15 17L12.5 14.5M15 17L12.5 19.5" {...stroke} stroke="#5fd38a" strokeWidth="1.7" />
      <circle cx="4" cy="12" r="1.6" fill="#5fd38a" />
    </svg>
  )
}

export function MergeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <path d="M4 7H9C11.5 7 11.5 17 14 17H18M14 17L16.5 14.5M14 17L16.5 19.5" {...stroke} stroke="#4fd1c5" strokeWidth="1.8" />
      <path d="M4 17H9" {...stroke} stroke="#4fd1c5" strokeWidth="1.8" opacity="0.45" />
    </svg>
  )
}

export function LoopIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <path d="M5 9.5C5 6.8 7.2 5 10 5H15.5M15.5 5L12.8 2.5M15.5 5L12.8 7.5" {...stroke} stroke="#4fd1c5" strokeWidth="1.7" />
      <path d="M19 14.5C19 17.2 16.8 19 14 19H8.5M8.5 19L11.2 21.5M8.5 19L11.2 16.5" {...stroke} stroke="#4fd1c5" strokeWidth="1.7" />
    </svg>
  )
}

export function LimitIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <rect x="4" y="5" width="16" height="11" rx="3" {...stroke} stroke="#4fd1c5" strokeWidth="1.6" strokeDasharray="3 2.6" />
      <path d="M8 19.5H16" {...stroke} stroke="#4fd1c5" strokeWidth="1.6" />
    </svg>
  )
}

export function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <path d="M9 4C7.5 4 7 5 7 6.5V9.5C7 10.5 6.5 11 5.5 11.5C6.5 12 7 12.5 7 13.5V16.5C7 18 7.5 19 9 19" {...stroke} stroke="#ffb454" strokeWidth="1.5" />
      <path d="M15 4C16.5 4 17 5 17 6.5V9.5C17 10.5 17.5 11 18.5 11.5C17.5 12 17 12.5 17 13.5V16.5C17 18 16.5 19 15 19" {...stroke} stroke="#ffb454" strokeWidth="1.5" />
    </svg>
  )
}

let sparkleId = 0
export function SparkleIcon() {
  const id = `sparkle-${sparkleId++}`
  return (
    <svg viewBox="0 0 24 24" width="24" height="24">
      <defs>
        <linearGradient id={id} x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4d82e0" />
          <stop offset="0.45" stopColor="#9b6bd6" />
          <stop offset="0.75" stopColor="#d6558f" />
          <stop offset="1" stopColor="#ffb454" />
        </linearGradient>
      </defs>
      <path d="M12 2.5C12.5 7.5 13 9 19.5 9.5C13 10 12.5 11.5 12 16.5C11.5 11.5 11 10 4.5 9.5C11 9 11.5 7.5 12 2.5Z" fill={`url(#${id})`} />
      <path d="M18.5 15C18.8 17 19 17.5 21.5 17.8C19 18 18.8 18.5 18.5 20.5C18.2 18.5 18 18 15.5 17.8C18 17.5 18.2 17 18.5 15Z" fill={`url(#${id})`} />
    </svg>
  )
}

export function NodeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <circle cx="12" cy="12" r="7" {...stroke} stroke="#b59a82" strokeWidth="1.6" />
    </svg>
  )
}
