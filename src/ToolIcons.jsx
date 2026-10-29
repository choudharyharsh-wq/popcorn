// iOS-style app icons for the four tools: squircle, soft gradient, gloss, white glyph.
// Plain inline SVG, a few hundred bytes each.

const SQUIRCLE = 'M60 0C102 0 120 18 120 60S102 120 60 120 0 102 0 60 18 0 60 0Z'

function AppIcon({ id, from, to, children }) {
  return (
    <svg viewBox="0 0 120 120" className="app-icon" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#000" stopOpacity="0.25" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={SQUIRCLE} />
        </clipPath>
        <filter id={`${id}-sh`} x="-25%" y="-25%" width="150%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.6" floodColor="#000" floodOpacity="0.3" />
        </filter>
      </defs>
      <path d={SQUIRCLE} fill={`url(#${id}-bg)`} />
      <g clipPath={`url(#${id}-clip)`}>
        <ellipse cx="60" cy="10" rx="62" ry="44" fill={`url(#${id}-gloss)`} />
      </g>
      <g filter={`url(#${id}-sh)`}>{children}</g>
      <path d={SQUIRCLE} fill="none" stroke={`url(#${id}-rim)`} strokeWidth="1.6" />
    </svg>
  )
}

const stroke = { fill: 'none', stroke: '#fff', strokeLinecap: 'round', strokeLinejoin: 'round' }

// Wiggle: a squiggle with a playhead dot (animation previewer)
export function WiggleIcon() {
  return (
    <AppIcon id="wg" from="#C084FC" to="#EC4899">
      <path d="M24 70C34 38 48 38 56 62S78 88 96 46" {...stroke} strokeWidth="10" />
      <circle cx="96" cy="46" r="9" fill="#fff" />
    </AppIcon>
  )
}

// Quill: a feather nib (copy writer)
export function QuillIcon() {
  return (
    <AppIcon id="qu" from="#FDE047" to="#F97316">
      <path d="M88 26C62 26 42 44 36 72L30 96 52 88C80 80 96 56 88 26Z" fill="#fff" />
      <path d="M34 92L68 52" {...stroke} stroke="#F97316" strokeWidth="5" />
    </AppIcon>
  )
}

// Poke: a tap with ripples (interaction library)
export function PokeIcon() {
  return (
    <AppIcon id="pk" from="#5EEAD4" to="#0EA5E9">
      <circle cx="60" cy="60" r="34" {...stroke} strokeWidth="5" opacity="0.5" />
      <circle cx="60" cy="60" r="21" {...stroke} strokeWidth="7" opacity="0.85" />
      <circle cx="60" cy="60" r="9" fill="#fff" />
    </AppIcon>
  )
}

// Squish: a block pressed from both sides (compressor)
export function SquishIcon() {
  return (
    <AppIcon id="sq" from="#60A5FA" to="#6366F1">
      <rect x="42" y="38" width="36" height="44" rx="11" fill="#fff" />
      <path d="M14 60H30M23 50L31 60L23 70" {...stroke} strokeWidth="8" />
      <path d="M106 60H90M97 50L89 60L97 70" {...stroke} strokeWidth="8" />
    </AppIcon>
  )
}

// Placeholders for tools that are not built yet
export function GlintIcon() {
  return (
    <AppIcon id="gl" from="#FDA4AF" to="#E11D48">
      <path d="M60 24L68 52L96 60L68 68L60 96L52 68L24 60L52 52Z" fill="#fff" />
    </AppIcon>
  )
}

export function DriftIcon() {
  return (
    <AppIcon id="dr" from="#86EFAC" to="#16A34A">
      <path d="M24 44H78M24 62H96M24 80H64" {...stroke} strokeWidth="9" />
    </AppIcon>
  )
}

export function NudgeIcon() {
  return (
    <AppIcon id="nd" from="#FCA5A5" to="#F59E0B">
      <rect x="30" y="30" width="60" height="60" rx="16" {...stroke} strokeWidth="8" />
      <circle cx="60" cy="60" r="10" fill="#fff" />
    </AppIcon>
  )
}

export function FlipIcon() {
  return (
    <AppIcon id="fl" from="#C4B5FD" to="#7C3AED">
      <path d="M32 50H86L74 38M88 70H34L46 82" {...stroke} strokeWidth="8" />
    </AppIcon>
  )
}
