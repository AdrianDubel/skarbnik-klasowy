import { useEffect } from 'react'
import { IconClose } from './Icons.jsx'

/** Bottom-sheet style modal. Closes on backdrop click + Escape. */
export default function Sheet({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sheet__handle" />
        <div className="row row--between mb-sm">
          <h2 className="sheet__title" style={{ marginBottom: 0 }}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Zamknij">
            <IconClose />
          </button>
        </div>
        {children}
        {footer && <div className="mt-md">{footer}</div>}
      </div>
    </div>
  )
}
