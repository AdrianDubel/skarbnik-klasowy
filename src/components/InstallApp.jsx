import { useEffect, useState, useCallback } from 'react'
import Sheet from './Sheet.jsx'
import {
  IconDownload, IconShareIos, IconAddSquare, IconDots,
  IconApple, IconAndroid, IconCheck, IconChart,
} from './Icons.jsx'

/* =========================================================================
   InstallApp — przycisk + instrukcja instalacji aplikacji jako PWA.
   - Na Androidzie/Chrome przechwytuje zdarzenie `beforeinstallprompt`
     i pozwala zainstalować jednym dotknięciem.
   - Dla iOS/Safari oraz komputerów pokazuje instrukcję krok po kroku.
   - Ukrywa się, gdy aplikacja działa już jako zainstalowane PWA.
   ========================================================================= */

function detectPlatform() {
  const ua = (navigator.userAgent || '').toLowerCase()
  const isIOS =
    /iphone|ipad|ipod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /android/.test(ua)
  if (isIOS) return 'ios'
  if (isAndroid) return 'android'
  return 'desktop'
}

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

/** Hook: natywny prompt instalacji (Chrome/Edge/Android). */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [installed, setInstalled] = useState(isStandalone())

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setDeferred(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferred) return false
    deferred.prompt()
    const choice = await deferred.userChoice.catch(() => null)
    setDeferred(null)
    return choice?.outcome === 'accepted'
  }, [deferred])

  return { canPrompt: !!deferred, promptInstall, installed }
}

function Step({ n, children }) {
  return (
    <li className="step">
      <span className="step__num">{n}</span>
      <span className="step__text">{children}</span>
    </li>
  )
}

function AndroidGuide({ canPrompt, onInstall }) {
  return (
    <div className="install__panel">
      {canPrompt && (
        <button className="btn btn--primary btn--block install__cta" onClick={onInstall}>
          <IconDownload width={18} height={18} /> Zainstaluj teraz
        </button>
      )}
      <ol className="install__steps">
        <Step n={1}>Otwórz tę stronę w przeglądarce <strong>Chrome</strong>.</Step>
        <Step n={2}>
          Dotknij menu <IconDots width={16} height={16} className="inline-ic" /> (trzy kropki)
          w prawym górnym rogu.
        </Step>
        <Step n={3}>
          Wybierz <strong>„Zainstaluj aplikację”</strong> lub
          <strong> „Dodaj do ekranu głównego”</strong>.
        </Step>
        <Step n={4}>
          Potwierdź <strong>„Zainstaluj”</strong> — ikona Skarbnika pojawi się na ekranie głównym.
        </Step>
      </ol>
    </div>
  )
}

function IosGuide() {
  return (
    <div className="install__panel">
      <p className="install__hint">
        Na iPhonie i iPadzie instalacja działa wyłącznie w przeglądarce
        <strong> Safari</strong> (nie w Chrome).
      </p>
      <ol className="install__steps">
        <Step n={1}>Otwórz tę stronę w przeglądarce <strong>Safari</strong>.</Step>
        <Step n={2}>
          Dotknij przycisku <strong>Udostępnij</strong>
          <IconShareIos width={16} height={16} className="inline-ic" /> na dolnym pasku.
        </Step>
        <Step n={3}>
          Przewiń listę i wybierz
          <strong> „Do ekranu początkowego”</strong>
          <IconAddSquare width={16} height={16} className="inline-ic" />.
        </Step>
        <Step n={4}>
          Dotknij <strong>„Dodaj”</strong> w prawym górnym rogu — gotowe.
        </Step>
      </ol>
    </div>
  )
}

function DesktopGuide({ canPrompt, onInstall }) {
  return (
    <div className="install__panel">
      {canPrompt && (
        <button className="btn btn--primary btn--block install__cta" onClick={onInstall}>
          <IconDownload width={18} height={18} /> Zainstaluj teraz
        </button>
      )}
      <ol className="install__steps">
        <Step n={1}>Otwórz stronę w przeglądarce <strong>Chrome</strong> lub <strong>Edge</strong>.</Step>
        <Step n={2}>
          Kliknij ikonę instalacji <IconDownload width={16} height={16} className="inline-ic" />
          po prawej stronie paska adresu (lub menu ⋮ → <strong>„Zainstaluj…”</strong>).
        </Step>
        <Step n={3}>Potwierdź <strong>„Zainstaluj”</strong>.</Step>
        <Step n={4}>Aplikacja otworzy się w osobnym oknie, jak zwykły program.</Step>
      </ol>
    </div>
  )
}

const TABS = [
  { id: 'android', label: 'Android', Icon: IconAndroid },
  { id: 'ios', label: 'iPhone / iPad', Icon: IconApple },
  { id: 'desktop', label: 'Komputer', Icon: IconChart },
]

export function InstallGuide({ onClose }) {
  const { canPrompt, promptInstall } = useInstallPrompt()
  const [tab, setTab] = useState(detectPlatform())

  const handleInstall = async () => {
    const ok = await promptInstall()
    if (ok) onClose?.()
  }

  return (
    <Sheet title="Zainstaluj aplikację" onClose={onClose}>
      <p className="install__lead">
        Dodaj <strong>Skarbnika</strong> do ekranu głównego telefonu lub na pulpit
        komputera. Aplikacja otwiera się na pełnym ekranie, ma własną ikonę i
        działa również offline.
      </p>

      <div className="install__tabs" role="tablist">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={`install__tab ${tab === id ? 'is-active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon width={18} height={18} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'android' && <AndroidGuide canPrompt={canPrompt} onInstall={handleInstall} />}
      {tab === 'ios' && <IosGuide />}
      {tab === 'desktop' && <DesktopGuide canPrompt={canPrompt} onInstall={handleInstall} />}

      <div className="install__benefits">
        <span><IconCheck width={15} height={15} /> Pełny ekran, bez paska przeglądarki</span>
        <span><IconCheck width={15} height={15} /> Szybki dostęp z ikony</span>
        <span><IconCheck width={15} height={15} /> Działa offline</span>
      </div>
    </Sheet>
  )
}

/**
 * Przycisk otwierający instrukcję instalacji.
 * @param {'button'|'icon'|'link'} variant — wygląd elementu wyzwalającego.
 */
export default function InstallApp({ variant = 'button', label = 'Pobierz aplikację', className = '' }) {
  const [open, setOpen] = useState(false)
  const { installed } = useInstallPrompt()

  // Nie pokazuj, jeśli aplikacja działa już jako zainstalowane PWA.
  if (installed) return null

  return (
    <>
      {variant === 'icon' ? (
        <button
          className={`icon-btn ${className}`}
          onClick={() => setOpen(true)}
          aria-label="Pobierz aplikację"
          title="Pobierz aplikację"
        >
          <IconDownload width={18} height={18} />
        </button>
      ) : variant === 'link' ? (
        <button className={`install__link ${className}`} onClick={() => setOpen(true)}>
          <IconDownload width={16} height={16} /> {label}
        </button>
      ) : (
        <button
          className={`btn btn--ghost btn--block install__open ${className}`}
          onClick={() => setOpen(true)}
        >
          <IconDownload width={18} height={18} /> {label}
        </button>
      )}

      {open && <InstallGuide onClose={() => setOpen(false)} />}
    </>
  )
}
