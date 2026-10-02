import { useState } from 'react'
import { useStore, studentCollectionHistory } from '../store/useStore.jsx'
import { initials, fullName, formatMoney } from '../utils/money.js'
import Sheet from '../components/Sheet.jsx'
import { IconPlus, IconEdit, IconTrash, IconUsers, IconBack } from '../components/Icons.jsx'

export default function StudentsView() {
  const { state, dispatch, derived, notify } = useStore()
  const [editing, setEditing] = useState(null) // null | 'new' | student
  const [openId, setOpenId] = useState(null)
  const students = [...state.students].sort((a, b) =>
    (a.lastName || '').localeCompare(b.lastName || '', 'pl')
  )

  const open = state.students.find((s) => s.id === openId)
  if (open) {
    return <StudentDetail student={open} onBack={() => setOpenId(null)} />
  }

  const remove = (s) => {
    if (confirm(`Usunąć ucznia „${fullName(s)}”? Jego wpłaty zostaną też usunięte.`)) {
      dispatch({ type: 'student/remove', id: s.id })
      notify('Usunięto ucznia')
    }
  }

  return (
    <div className="view">
      <header className="view__head fade-in stagger-1">
        <h1 className="view__title">Lista <em>klasy</em></h1>
        <p className="view__lead">{students.length} uczniów w klasie</p>
      </header>

      <button
        className="btn btn--primary btn--block fade-in stagger-2"
        onClick={() => setEditing('new')}
      >
        <IconPlus width={18} height={18} /> Dodaj ucznia
      </button>

      <div className="mt-md">
        {students.length === 0 && (
          <div className="empty fade-in stagger-3">
            <div className="empty__icon"><IconUsers width={40} height={40} /></div>
            <h4>Brak uczniów</h4>
            <p>Dodaj pierwszego ucznia, aby zacząć.</p>
          </div>
        )}

        {students.map((s, i) => (
          <div className={`item fade-in stagger-${Math.min(i + 3, 6)}`} key={s.id}>
            <div
              className="row grow"
              role="button"
              tabIndex={0}
              onClick={() => setOpenId(s.id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpenId(s.id)}
              style={{ cursor: 'pointer', gap: '0.75rem', alignItems: 'center' }}
            >
              <div className="avatar">{initials(s.firstName, s.lastName)}</div>
              <div className="grow">
                <div className="item__name truncate">{fullName(s)}</div>
                <div className="item__meta">
                  Wpłacono łącznie:{' '}
                  <span className="amount amount--mint">
                    {formatMoney(derived.perStudent[s.id] || 0)}
                  </span>
                  {s.note ? ` · ${s.note}` : ''}
                </div>
              </div>
            </div>
            <button className="icon-btn" onClick={() => setEditing(s)} aria-label="Edytuj">
              <IconEdit width={18} height={18} />
            </button>
            <button className="icon-btn icon-btn--danger" onClick={() => remove(s)} aria-label="Usuń">
              <IconTrash width={18} height={18} />
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <StudentForm
          student={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(payload) => {
            if (editing === 'new') {
              dispatch({ type: 'student/add', payload })
              notify('Dodano ucznia')
            } else {
              dispatch({ type: 'student/update', id: editing.id, payload })
              notify('Zapisano zmiany')
            }
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function StudentDetail({ student, onBack }) {
  const { state, dispatch, notify } = useStore()
  const rows = studentCollectionHistory(state, student.id)

  const paidRows = rows.filter((r) => r.status === 'paid')
  const partialRows = rows.filter((r) => r.status === 'partial')
  const unpaidRows = rows.filter((r) => r.status === 'unpaid')
  const naRows = rows.filter((r) => r.status === 'notApplicable')
  const owedRows = [...partialRows, ...unpaidRows]
  const totalPaid = rows.reduce((s, r) => s + r.paid, 0)
  const totalDue = owedRows.reduce((s, r) => s + r.due, 0)

  const statusPill = (r) => {
    const cls =
      r.status === 'paid' ? 'pill--paid' :
      r.status === 'notApplicable' ? 'pill--na' :
      r.status === 'partial' ? 'pill--partial' : 'pill--unpaid'
    const label =
      r.status === 'paid' ? 'Opłacone' :
      r.status === 'notApplicable' ? 'Nie dotyczy' :
      r.status === 'partial' ? 'Częściowo' : 'Zalega'
    return (
      <button
        className={`pill ${cls}`}
        onClick={() => cycleStatus(r)}
        style={{ cursor: 'pointer', border: 'none' }}
        title="Kliknij, aby zmienić status wpłaty"
      >
        {label}
      </button>
    )
  }

  const cycleStatus = (r) => {
    // zalega/częściowo → opłacone → nie dotyczy → zalega
    let status, amount
    if (r.status === 'notApplicable') {
      status = 'unpaid'; amount = 0
    } else if (r.status === 'paid' || (r.target > 0 && r.paid >= r.target)) {
      status = 'notApplicable'; amount = 0
    } else {
      status = 'paid'; amount = r.target
    }
    dispatch({
      type: 'payment/set',
      payload: { collectionId: r.id, studentId: student.id, status, amount },
    })
    notify('Zaktualizowano status wpłaty')
  }

  const copySummary = async () => {
    const lines = [`Rozliczenie – ${fullName(student)}`, '']
    if (owedRows.length) {
      lines.push(`Do zapłaty (${formatMoney(totalDue)}):`)
      for (const r of owedRows) {
        lines.push(`• ${r.name} — ${formatMoney(r.due)} (wpłacono ${formatMoney(r.paid)} z ${formatMoney(r.target)})`)
      }
      lines.push('')
    }
    if (paidRows.length) {
      lines.push('Opłacone:')
      for (const r of paidRows) lines.push(`• ${r.name} — ${formatMoney(r.paid)}`)
      lines.push('')
    }
    if (naRows.length) {
      lines.push('Nie dotyczy:')
      for (const r of naRows) lines.push(`• ${r.name}`)
      lines.push('')
    }
    const text = lines.join('\n').trim()
    try {
      await navigator.clipboard.writeText(text)
      notify('Skopiowano rozliczenie do schowka')
    } catch {
      notify('Nie udało się skopiować')
    }
  }

  return (
    <div className="view">
      <div className="detail-bar fade-in stagger-1">
        <div className="row row--between">
          <button className="icon-btn" onClick={onBack} aria-label="Wróć"><IconBack /></button>
        </div>
      </div>

      <header className="view__head fade-in stagger-2">
        <div className="row" style={{ gap: '0.75rem', alignItems: 'center' }}>
          <div className="avatar" style={{ width: 52, height: 52, fontSize: '1.1rem' }}>
            {initials(student.firstName, student.lastName)}
          </div>
          <div>
            <h1 className="view__title" style={{ fontSize: 'clamp(1.6rem, 7vw, 2.2rem)' }}>{fullName(student)}</h1>
            {student.note && <p className="view__lead">{student.note}</p>}
          </div>
        </div>
      </header>

      <div className="balance fade-in stagger-3" style={{ padding: '1.4rem' }}>
        <div className="balance__label">Wpłacono łącznie</div>
        <div className="balance__value" style={{ fontSize: 'clamp(2rem, 10vw, 3rem)' }}>
          {formatMoney(totalPaid)}
        </div>
        <div className="balance__meta">
          <div><span>Do zapłaty</span><strong className={totalDue > 0 ? 'amount--coral' : 'amount--mint'}>{formatMoney(totalDue)}</strong></div>
          <div><span>Zbiórek</span><strong className="amount--gold">{rows.length}</strong></div>
        </div>
      </div>

      {rows.length > 0 && (
        <button className="btn btn--ghost btn--block mt-md fade-in stagger-3" onClick={copySummary}>
          Kopiuj rozliczenie dla rodzica
        </button>
      )}

      <div className="section-title fade-in stagger-4">
        <h3>Historia zbiórek</h3>
        <span className="count">{rows.length}</span>
      </div>

      {rows.length === 0 && (
        <div className="empty fade-in stagger-4"><p>Brak zbiórek do wyświetlenia.</p></div>
      )}

      {rows.map((r, i) => (
        <div className={`item fade-in stagger-${Math.min(i + 4, 6)}`} key={r.id}>
          <div className="grow">
            <div className="item__name truncate">
              {r.isMainFund && <span className="pill pill--paid" style={{ marginRight: '0.4rem', verticalAlign: 'middle' }}>Kasa</span>}
              {r.name}
            </div>
            <div className="item__meta">
              {r.status === 'notApplicable'
                ? 'Nie dotyczy tej zbiórki'
                : <><span className="amount amount--mint">{formatMoney(r.paid)}</span>{r.target > 0 && ` / ${formatMoney(r.target)}`}</>}
            </div>
          </div>
          {statusPill(r)}
        </div>
      ))}
    </div>
  )
}

function StudentForm({ student, onClose, onSave }) {
  const [firstName, setFirstName] = useState(student?.firstName || '')
  const [lastName, setLastName] = useState(student?.lastName || '')
  const [note, setNote] = useState(student?.note || '')

  const submit = (e) => {
    e.preventDefault()
    if (!firstName.trim() && !lastName.trim()) return
    onSave({ firstName: firstName.trim(), lastName: lastName.trim(), note: note.trim() })
  }

  return (
    <Sheet title={student ? 'Edytuj ucznia' : 'Nowy uczeń'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field-row">
          <div className="field">
            <label>Imię</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Anna" autoFocus />
          </div>
          <div className="field">
            <label>Nazwisko</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Kowalska" />
          </div>
        </div>
        <div className="field">
          <label>Notatka (opcjonalnie)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="np. nr telefonu rodzica" />
        </div>
        <button type="submit" className="btn btn--primary btn--block mt-sm">
          {student ? 'Zapisz' : 'Dodaj do klasy'}
        </button>
      </form>
    </Sheet>
  )
}
