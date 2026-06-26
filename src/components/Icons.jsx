/* Inline SVG icon set — single stroke style, no external deps. */
const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const IconWallet = (p) => (
  <svg {...base} {...p}><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H5a2 2 0 0 0-2 2z"/><path d="M3 8v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H5"/><circle cx="16.5" cy="13" r="1.2" fill="currentColor" stroke="none"/></svg>
)
export const IconUsers = (p) => (
  <svg {...base} {...p}><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.5a3 3 0 0 1 0 5.8"/><path d="M17.5 14.2a5.5 5.5 0 0 1 3 4.8"/></svg>
)
export const IconStack = (p) => (
  <svg {...base} {...p}><path d="M12 3 3 7.5 12 12l9-4.5z"/><path d="m3 12 9 4.5L21 12"/><path d="m3 16.5 9 4.5 9-4.5"/></svg>
)
export const IconChart = (p) => (
  <svg {...base} {...p}><path d="M4 4v16h16"/><rect x="7" y="11" width="3" height="6" rx="0.6"/><rect x="12.5" y="7" width="3" height="10" rx="0.6"/><rect x="18" y="13" width="0.1" height="4"/></svg>
)
export const IconAlert = (p) => (
  <svg {...base} {...p}><path d="M12 4 2.5 20h19z"/><path d="M12 10v4"/><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"/></svg>
)
export const IconPlus = (p) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14"/></svg>
)
export const IconEdit = (p) => (
  <svg {...base} {...p}><path d="M4 20h4l10-10-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>
)
export const IconTrash = (p) => (
  <svg {...base} {...p}><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg>
)
export const IconUpload = (p) => (
  <svg {...base} {...p}><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
)
export const IconCheck = (p) => (
  <svg {...base} {...p}><path d="m5 12 5 5 9-11"/></svg>
)
export const IconClose = (p) => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>
)
export const IconCalendar = (p) => (
  <svg {...base} {...p}><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></svg>
)
export const IconMinus = (p) => (
  <svg {...base} {...p}><path d="M5 12h14"/></svg>
)
export const IconChevron = (p) => (
  <svg {...base} {...p}><path d="m9 6 6 6-6 6"/></svg>
)
export const IconBack = (p) => (
  <svg {...base} {...p}><path d="m15 6-6 6 6 6"/></svg>
)
export const IconSparkle = (p) => (
  <svg {...base} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>
)
export const IconCloud = (p) => (
  <svg {...base} {...p}><path d="M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 9.5a3.5 3.5 0 0 1 0 8.5z"/></svg>
)
export const IconLogout = (p) => (
  <svg {...base} {...p}><path d="M15 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2"/><path d="M10 17l-5-5 5-5"/><path d="M5 12h11"/></svg>
)
export const IconGoogle = (p) => (
  <svg width={p?.width || 18} height={p?.height || 18} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.6 5C9.4 39.6 16.1 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C39 35.7 44 30.6 44 24c0-1.2-.1-2.4-.4-3.5z"/>
  </svg>
)
