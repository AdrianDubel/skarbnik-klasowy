import { useMemo, useState } from 'react'
import { useStore, buildHistory } from '../store/useStore.jsx'
import { formatMoney } from '../utils/money.js'
import { IconHistory, IconPlus, IconMinus } from '../components/Icons.jsx'

export default function HistoryView() {
  const { state, derived } = useStore()
  const [filter, setFilter] = useState('all') // 'all' | 'in' | 'out'

  const events = useMemo(() => buildHistory(state), [state])
  const visible = useMemo(
    () => (filter === 'all' ? events : events.filter((e) => e.type === filter)),
    [events, filter]
  )

  const groups = useMemo(() => groupByMonth(visible), [visible])
  const negative = derived.balance < 0

  return (
    <div className="view">
      <header className="view__head fade-in stagger-1">
        <h1 className="view__title">Histo<em>ria</em></h1>
        <p className="view__lead">Wszystkie wpłaty i wydatki w czasie</p>
      </header>

      <div className="balance fade-in stagger-2" style={{ padding: '1.4rem' }}>
        <div className="balance__label">Saldo bieżące</div>
        <div className={`balance__value ${negative ? 'is-negative' : ''}`} style={{ fontSize: 'clamp(2rem, 10vw, 3rem)' }}>
          {formatMoney(derived.balance)}
        </div>
        <div className="balance__meta">
          <div><span>Wpłaty</span><strong className="amount--mint">{formatMoney(derived.totalCollected)}</strong></div>
          <div><span>Wydatki</span><strong className="amount--coral">{formatMoney(derived.totalExpenses)}</strong></div>
          <div><span>Operacji</span><strong>{events.length}</strong></div>
        </div>
      </div>

      <div className="seg fade-in stagger-3 mt-md">
        <button className={`seg__btn ${filter === 'all' ? 'is-active' : ''}`} onClick={() => setFilter('all')}>Wszystko</button>
        <button className={`seg__btn ${filter === 'in' ? 'is-active' : ''}`} onClick={() => setFilter('in')}>Wpłaty</button>
        <button className={`seg__btn ${filter === 'out' ? 'is-active' : ''}`} onClick={() => setFilter('out')}>Wydatki</button>
      </div>

      <div className="mt-md">
        {visible.length === 0 ? (
          <div className="empty fade-in stagger-4">
            <div className="empty__icon"><IconHistory width={40} height={40} /></div>
            <h4>Brak operacji</h4>
            <p>Dodaj wpłaty w zbiórkach lub wydatki, aby zobaczyć historię.</p>
          </div>
        ) : (
          groups.map((g, gi) => (
            <div key={g.key} className={`fade-in stagger-${Math.min(gi + 4, 6)}`}>
              <div className="section-title">
                <h3 style={{ fontSize: '1rem' }}>{g.label}</h3>
                <span className="count">{g.items.length} operacji</span>
              </div>
              {g.items.map((ev) => (
                <div className="item" key={ev.id}>
                  <div className={`ledger-mark ${ev.type === 'in' ? 'ledger-mark--in' : 'ledger-mark--out'}`}>
                    {ev.type === 'in' ? <IconPlus width={18} height={18} /> : <IconMinus width={18} height={18} />}
                  </div>
                  <div className="grow">
                    <div className="item__name truncate">{ev.title}</div>
                    <div className="item__meta truncate">
                      {ev.subtitle}{ev.isMainFund ? ' · składka' : ''} · {formatDate(ev.date)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={`amount ${ev.type === 'in' ? 'amount--mint' : 'amount--coral'}`} style={{ fontSize: '1.05rem' }}>
                      {ev.type === 'in' ? '+' : '−'}{formatMoney(ev.amount)}
                    </div>
                    <div className="muted" style={{ fontSize: '0.72rem' }}>
                      saldo {formatMoney(ev.runningBalance)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function groupByMonth(events) {
  const groups = []
  const byKey = new Map()
  for (const ev of events) {
    const d = new Date(ev.date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!byKey.has(key)) {
      const label = d.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
      const group = { key, label: label.charAt(0).toUpperCase() + label.slice(1), items: [] }
      byKey.set(key, group)
      groups.push(group)
    }
    byKey.get(key).items.push(ev)
  }
  return groups
}

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}
