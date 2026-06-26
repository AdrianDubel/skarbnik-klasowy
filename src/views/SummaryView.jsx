import { useStore } from '../store/useStore.jsx'
import { formatMoney, fullName, initials } from '../utils/money.js'
import { IconChart } from '../components/Icons.jsx'

export default function SummaryView() {
  const { state, derived } = useStore()
  const students = [...state.students].sort(
    (a, b) => (derived.perStudent[b.id] || 0) - (derived.perStudent[a.id] || 0)
  )
  const negative = derived.balance < 0

  return (
    <div className="view">
      <header className="view__head fade-in stagger-1">
        <h1 className="view__title">Kasa <em>klasowa</em></h1>
      </header>

      <div className="balance fade-in stagger-2">
        <div className="balance__label">Saldo kasy klasowej</div>
        <div className={`balance__value ${negative ? 'is-negative' : ''}`}>
          {formatMoney(derived.balance)}
        </div>
        <div className="balance__meta">
          <div>
            <span>Wpłaty łącznie</span>
            <strong className="amount--mint">{formatMoney(derived.totalCollected)}</strong>
          </div>
          <div>
            <span>Wydatki</span>
            <strong className="amount--coral">{formatMoney(derived.totalExpenses)}</strong>
          </div>
        </div>
      </div>

      <div className="stat-grid mt-md fade-in stagger-3">
        <div className="stat">
          <span>Uczniów</span>
          <strong>{derived.studentCount}</strong>
        </div>
        <div className="stat">
          <span>Zbiórek</span>
          <strong>{state.collections.length}</strong>
        </div>
      </div>

      <div className="section-title fade-in stagger-4">
        <h3>Wpłaty per uczeń</h3>
        <span className="count">łącznie ze wszystkich zbiórek</span>
      </div>

      {students.length === 0 && (
        <div className="empty fade-in stagger-4">
          <div className="empty__icon"><IconChart width={40} height={40} /></div>
          <h4>Brak danych</h4>
          <p>Dodaj uczniów i zbiórki, aby zobaczyć podsumowanie.</p>
        </div>
      )}

      {students.map((s, i) => {
        const total = derived.perStudent[s.id] || 0
        return (
          <div className={`item fade-in stagger-${Math.min(i + 4, 6)}`} key={s.id}>
            <div className="avatar">{initials(s.firstName, s.lastName)}</div>
            <div className="grow">
              <div className="item__name truncate">{fullName(s)}</div>
            </div>
            <div className="amount amount--gold" style={{ fontSize: '1.1rem' }}>
              {formatMoney(total)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
