import { useMemo, useState } from 'react'
import { useStore, debtorsForCollection, globalDebtors } from '../store/useStore.jsx'
import { formatMoney, fullName, initials } from '../utils/money.js'
import { IconCheck, IconAlert } from '../components/Icons.jsx'

export default function DebtorsView() {
  const { state, derived, notify } = useStore()
  const [scope, setScope] = useState(derived.mainFundId || 'global') // 'global' | collectionId

  const debtors = useMemo(() => {
    if (scope === 'global') {
      return globalDebtors(state.collections, state.students).map((d) => ({
        student: d.student,
        due: d.due,
        detail: d.collections.map((c) => c.name).join(', '),
      }))
    }
    const c = state.collections.find((x) => x.id === scope)
    if (!c) return []
    return debtorsForCollection(c, state.students).map((d) => ({
      student: d.student,
      due: d.due,
      detail: `Wpłacono ${formatMoney(d.paid)} z ${formatMoney(c.target)}`,
    }))
  }, [scope, state])

  const totalDue = debtors.reduce((s, d) => s + d.due, 0)

  const copyList = async () => {
    const title =
      scope === 'global'
        ? 'Lista dłużników (globalnie)'
        : `Dłużnicy: ${state.collections.find((c) => c.id === scope)?.name || ''}`
    const lines = debtors.map((d) => `• ${fullName(d.student)} — ${formatMoney(d.due)}`)
    const text = `${title}\n${lines.join('\n')}\n\nRazem: ${formatMoney(totalDue)}`
    try {
      await navigator.clipboard.writeText(text)
      notify('Skopiowano listę do schowka')
    } catch {
      notify('Nie udało się skopiować')
    }
  }

  return (
    <div className="view">
      <header className="view__head fade-in stagger-1">
        <h1 className="view__title">Dłuż<em>nicy</em></h1>
        <p className="view__lead">Uczniowie zalegający z wpłatą</p>
      </header>

      <div className="field fade-in stagger-2">
        <label>Zakres</label>
        <select value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="global">Globalnie — wszystkie zbiórki</option>
          {state.collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.isMainFund ? `Kasa klasowa — ${c.name}` : c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="balance fade-in stagger-3" style={{ padding: '1.4rem' }}>
        <div className="balance__label">Łączne zaległości</div>
        <div className="balance__value is-negative" style={{ fontSize: 'clamp(2rem, 10vw, 3rem)' }}>
          {formatMoney(totalDue)}
        </div>
        <div className="balance__meta">
          <div><span>Dłużników</span><strong className="amount--coral">{debtors.length}</strong></div>
        </div>
      </div>

      {debtors.length > 0 && (
        <button className="btn btn--ghost btn--block mt-md fade-in stagger-3" onClick={copyList}>
          Kopiuj listę do schowka
        </button>
      )}

      <div className="mt-md">
        {debtors.length === 0 ? (
          <div className="empty fade-in stagger-4">
            <div className="empty__icon" style={{ color: 'var(--accent-mint)' }}>
              <IconCheck width={44} height={44} />
            </div>
            <h4>Wszystko opłacone!</h4>
            <p>Brak zaległości w wybranym zakresie.</p>
          </div>
        ) : (
          debtors.map((d, i) => (
            <div className={`item fade-in stagger-${Math.min(i + 4, 6)}`} key={d.student.id}>
              <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--accent-coral), var(--accent-gold))' }}>
                {initials(d.student.firstName, d.student.lastName)}
              </div>
              <div className="grow">
                <div className="item__name truncate">{fullName(d.student)}</div>
                <div className="item__meta truncate">{d.detail}</div>
              </div>
              <div className="amount amount--coral" style={{ fontSize: '1.1rem' }}>
                {formatMoney(d.due)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
