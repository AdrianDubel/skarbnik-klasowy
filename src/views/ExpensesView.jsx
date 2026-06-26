import { useState } from 'react'
import { useStore } from '../store/useStore.jsx'
import { formatMoney, parseAmount, round2 } from '../utils/money.js'
import Sheet from '../components/Sheet.jsx'
import { IconPlus, IconTrash, IconMinus } from '../components/Icons.jsx'

export default function ExpensesView() {
  const { state, dispatch, derived, notify } = useStore()
  const [adding, setAdding] = useState(false)
  const expenses = state.expenses

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
              <div className="item__meta">{formatDate(e.date)}</div>
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

function ExpenseForm({ onClose, onSave }) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const amt = round2(parseAmount(amount))
    if (!description.trim() || amt <= 0) return
    onSave({ description: description.trim(), amount: amt })
  }

  return (
    <Sheet title="Nowy wydatek" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Opis</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="np. Bilety do kina" autoFocus />
        </div>
        <div className="field">
          <label>Kwota (zł)</label>
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="120" />
        </div>
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
