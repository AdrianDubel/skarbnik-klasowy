import { useState } from 'react'
import { StoreProvider, useStore } from './store/useStore.jsx'
import SummaryView from './views/SummaryView.jsx'
import StudentsView from './views/StudentsView.jsx'
import CollectionsView from './views/CollectionsView.jsx'
import ExpensesView from './views/ExpensesView.jsx'
import DebtorsView from './views/DebtorsView.jsx'
import LoginView from './views/LoginView.jsx'
import {
  IconWallet, IconUsers, IconStack, IconMinus, IconAlert, IconCheck, IconLogout,
} from './components/Icons.jsx'

const TABS = [
  { id: 'kasa', label: 'Kasa', Icon: IconWallet, View: SummaryView },
  { id: 'klasa', label: 'Klasa', Icon: IconUsers, View: StudentsView },
  { id: 'zbiorki', label: 'Zbiórki', Icon: IconStack, View: CollectionsView },
  { id: 'wydatki', label: 'Wydatki', Icon: IconMinus, View: ExpensesView },
  { id: 'dluznicy', label: 'Dłużnicy', Icon: IconAlert, View: DebtorsView },
]

function AccountControl() {
  const { auth } = useStore()
  if (!auth.enabled || auth.status !== 'signedIn' || !auth.user) return null
  const name = auth.user.displayName || auth.user.email || 'Konto'
  const photo = auth.user.photoURL
  return (
    <div className="account">
      {photo ? (
        <img className="account__avatar" src={photo} alt="" referrerPolicy="no-referrer" />
      ) : (
        <div className="account__avatar account__avatar--fallback">
          {name[0]?.toUpperCase()}
        </div>
      )}
      <button className="icon-btn" onClick={auth.signOut} aria-label="Wyloguj" title={`Wyloguj (${name})`}>
        <IconLogout width={18} height={18} />
      </button>
    </div>
  )
}

function Shell() {
  const [active, setActive] = useState('kasa')
  const { toast } = useStore()
  const Current = TABS.find((t) => t.id === active).View

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <div className="brand__mark">S</div>
          <div>
            <div className="brand__name">Skarbnik</div>
            <div className="brand__sub">Kasa klasowa</div>
          </div>
        </div>
        <AccountControl />
      </div>

      <main key={active}>
        <Current />
      </main>

      {toast && (
        <div className="toast" key={toast.id}>
          <IconCheck width={16} height={16} /> {toast.message}
        </div>
      )}

      <nav className="tabbar">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`tab ${active === id ? 'is-active' : ''}`}
            onClick={() => setActive(id)}
            aria-current={active === id}
          >
            <span className="tab__icon"><Icon width={21} height={21} /></span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}

function Gate() {
  const { auth } = useStore()
  // Cloud mode: require sign-in before showing the app.
  if (auth.enabled && auth.status !== 'signedIn') {
    return <LoginView />
  }
  return <Shell />
}

export default function App() {
  return (
    <StoreProvider>
      <Gate />
    </StoreProvider>
  )
}
