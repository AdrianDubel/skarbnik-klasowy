import { useState } from 'react'
import { useStore } from '../store/useStore.jsx'
import { initials, fullName, formatMoney } from '../utils/money.js'
import Sheet from '../components/Sheet.jsx'
import { IconPlus, IconEdit, IconTrash, IconUsers } from '../components/Icons.jsx'

export default function StudentsView() {
  const { state, dispatch, derived, notify } = useStore()
  const [editing, setEditing] = useState(null) // null | 'new' | student
  const students = [...state.students].sort((a, b) =>
    (a.lastName || '').localeCompare(b.lastName || '', 'pl')
  )

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
