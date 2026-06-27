import { useState } from 'react'
import { useStore } from '../store/useStore.jsx'
import { formatMoney, parseAmount, round2 } from '../utils/money.js'
import Sheet from '../components/Sheet.jsx'
import { IconPlus, IconTrash, IconMinus } from '../components/Icons.jsx'

export default function ExpensesView() {
  const { state, dispatch, derived, notify } = useStore()
  const [adding, setAdding] = useState(false)
  const expenses = state.expenses

  const sourceLabel = (e) => {
    const c = e.source ? state.collections.find((x) => x.id === e.source) : null
    return c ? c.name : 'Kasa klasowa'
  }

  const remove = (e) => {
    if (confirm(`Usunąć wydatek „${e.description}”?`)) {
      dispatch({ type: 'expense/remove', id: e.id })
      notify('Usunięto wydatek')
    }
  }

  return (
    <div className="view">
      <header className="view__head fade-in stagger-1">
        <h1 className="view__title">Wyda<em>tki</em></h1>
        <p className="view__lead">Pomniejszają saldo kasy klasowej</p>
      </header>

      <div className="balance fade-in stagger-2" style={{ padding: '1.4rem' }}>
        <div className="balance__label">Wydatki łącznie</div>
        <div className="balance__value is-negative" style={{ fontSize: 'clamp(2rem, 10vw, 3rem)' }}>
          −{formatMoney(derived.totalExpenses)}
        </div>
        <div className="balance__meta">
          <div><span>Saldo po wydatkach</span><strong className={derived.balance < 0 ? 'amount--coral' : 'amount--mint'}>{formatMoney(derived.balance)}</strong></div>
        </div>
      </div>

      <button className="btn btn--primary btn--block mt-md fade-in stagger-3" onClick={() => setAdding(true)}>
        <IconPlus width={18} height={18} /> Dodaj wydatek
      </button>

      <div className="mt-md">
        {expenses.length === 0 && (
          <div className="empty fade-in stagger-4">
            <div className="empty__icon"><IconMinus width={40} height={40} /></div>
            <h4>Brak wydatków</h4>
            <p>Dodaj pierwszy wydatek klasowy.</p>
          </div>
        )}

        {expenses.map((e, i) => (
          <div className={`item fade-in stagger-${Math.min(i + 4, 6)}`} key={e.id}>
            <div className="grow">
              <div className="item__name truncate">{e.description}</div>
              <div className="item__meta truncate">{sourceLabel(e)} · {formatDate(e.date)}</div>
            </div>
            <div className="amount amount--coral" style={{ fontSize: '1.05rem' }}>
              −{formatMoney(e.amount)}
            </div>
            <button className="icon-btn icon-btn--danger" onClick={() => remove(e)} aria-label="Usuń">
              <IconTrash width={18} height={18} />
            </button>
          </div>
        ))}
      </div>

      {adding && (
        <ExpenseForm
          collections={state.collections}
          stats={derived.collectionStats}
          balance={derived.balance}
          defaultSource={derived.mainFundId || 'general'}
          onClose={() => setAdding(false)}
          onSave={(payload) => {
            dispatch({ type: 'expense/add', payload })
            notify('Dodano wydatek')
            setAdding(false)
          }}
        />
      )}
    </div>
  )
}

function ExpenseForm({ collections, stats, balance, defaultSource, onClose, onSave }) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState(defaultSource || 'general')
  const [error, setError] = useState('')

  const available =
    source === 'general'
      ? round2(balance || 0)
      : round2(stats?.[source]?.remaining || 0)
  const sourceName =
    source === 'general'
      ? 'kasie klasowej'
      : `zbiórce „${collections.find((c) => c.id === source)?.name || ''}”`

  const submit = (e) => {
    e.preventDefault()
    const amt = round2(parseAmount(amount))
    if (!description.trim() || amt <= 0) {
      setError('Podaj opis i kwotę większą od zera.')
      return
    }
    if (amt > available) {
      setError(`Kwota przekracza dostępne środki w ${sourceName} (${formatMoney(available)}).`)
      return
    }
    onSave({ description: description.trim(), amount: amt, source })
  }

  return (
    <Sheet title="Nowy wydatek" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Opis</label>
          <input value={description} onChange={(e) => { setDescription(e.target.value); setError('') }} placeholder="np. Bilety do kina" autoFocus />
        </div>
        <div className="field">
          <label>Kwota (zł)</label>
          <input inputMode="decimal" value={amount} onChange={(e) => { setAmount(e.target.value); setError('') }} placeholder="120" />
        </div>
        <div className="field">
          <label>Z jakiego konta</label>
          <select value={source} onChange={(e) => { setSource(e.target.value); setError('') }}>
            <option value="general">Kasa klasowa (ogólne saldo) ({formatMoney(balance || 0)})</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.isMainFund ? `Składka na kasę — ${c.name}` : c.name} ({formatMoney(stats?.[c.id]?.collected || 0)})
              </option>
            ))}
          </select>
          <div className="item__meta" style={{ marginTop: '0.4rem' }}>
            Dostępne do wypłaty: <span className={available <= 0 ? 'amount amount--coral' : 'amount amount--mint'}>{formatMoney(available)}</span>
          </div>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn--primary btn--block mt-sm">Dodaj wydatek</button>
      </form>
    </Sheet>
  )
}

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}
