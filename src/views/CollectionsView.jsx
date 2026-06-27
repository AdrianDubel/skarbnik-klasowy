import { useState } from 'react'
import { useStore, paymentStatus, debtorsForCollection } from '../store/useStore.jsx'
import { formatMoney, fullName, initials, round2, parseAmount } from '../utils/money.js'
import Sheet from '../components/Sheet.jsx'
import ImportStatement from './ImportStatement.jsx'
import {
  IconPlus, IconEdit, IconTrash, IconStack, IconUpload, IconBack, IconCalendar,
} from '../components/Icons.jsx'

export default function CollectionsView() {
  const { state, dispatch, derived, notify } = useStore()
  const [editing, setEditing] = useState(null) // null | 'new' | collection
  const [openId, setOpenId] = useState(null)

  const open = state.collections.find((c) => c.id === openId)
  if (open) {
    return (
      <CollectionDetail
        collection={open}
        onBack={() => setOpenId(null)}
        onEdit={() => setEditing(open)}
        editingSheet={
          editing && editing !== 'new' ? (
            <CollectionForm
              collection={editing}
              onClose={() => setEditing(null)}
              onSave={(payload) => {
                dispatch({ type: 'collection/update', id: editing.id, payload })
                notify('Zapisano zbiórkę')
                setEditing(null)
              }}
            />
          ) : null
        }
      />
    )
  }

  return (
    <div className="view">
      <header className="view__head fade-in stagger-1">
        <h1 className="view__title">Zbió<em>rki</em></h1>
        <p className="view__lead">{state.collections.length} aktywnych zbiórek</p>
      </header>

      <button
        className="btn btn--primary btn--block fade-in stagger-2"
        onClick={() => setEditing('new')}
      >
        <IconPlus width={18} height={18} /> Nowa zbiórka
      </button>

      <div className="mt-md">
        {state.collections.length === 0 && (
          <div className="empty fade-in stagger-3">
            <div className="empty__icon"><IconStack width={40} height={40} /></div>
            <h4>Brak zbiórek</h4>
            <p>Utwórz pierwszą zbiórkę, np. „Składka klasowa”.</p>
          </div>
        )}

        {state.collections.map((c, i) => {
          const st = derived.collectionStats[c.id]
          const removeFromList = (ev) => {
            ev.stopPropagation()
            if (confirm(`Usunąć zbiórkę „${c.name}”? Tej operacji nie można cofnąć.`)) {
              dispatch({ type: 'collection/remove', id: c.id })
              notify('Usunięto zbiórkę')
            }
          }
          return (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              className={`card fade-in stagger-${Math.min(i + 3, 6)}`}
              style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
              onClick={() => setOpenId(c.id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpenId(c.id)}
            >
              <div className="row row--between">
                <div className="grow">
                  <h3 style={{ fontSize: '1.1rem' }} className="truncate">
                    {c.isMainFund && <span className="pill pill--paid" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}>Kasa klasowa</span>}
                    {c.name}
                  </h3>
                  <div className="item__meta">
                    Cel {formatMoney(c.target)}/os.
                    {c.deadline ? ` · do ${formatDate(c.deadline)}` : ''}
                  </div>
                </div>
                <div className="row gap-sm" style={{ alignItems: 'flex-start' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="amount amount--gold" style={{ fontSize: '1.05rem' }}>
                      {formatMoney(st.collected)}
                    </div>
                    <div className="muted" style={{ fontSize: '0.74rem' }}>
                      z {formatMoney(st.expected)}
                    </div>
                  </div>
                  <button className="icon-btn icon-btn--danger" onClick={removeFromList} aria-label={`Usuń zbiórkę ${c.name}`}>
                    <IconTrash width={18} height={18} />
                  </button>
                </div>
              </div>
              <div className="progress">
                <div className="progress__fill" style={{ width: `${st.progress * 100}%` }} />
              </div>
              <div className="row gap-sm mt-sm wrap">
                <span className="pill pill--paid"><span className="dot dot--paid" /> {st.paidCount} opłac.</span>
                <span className="pill pill--partial"><span className="dot dot--partial" /> {st.partialCount} częśc.</span>
                <span className="pill pill--unpaid"><span className="dot dot--unpaid" /> {st.unpaidCount} zalega</span>
              </div>
            </div>
          )
        })}
      </div>

      {editing === 'new' && (
        <CollectionForm
          onClose={() => setEditing(null)}
          onSave={(payload) => {
            dispatch({ type: 'collection/add', payload })
            notify('Utworzono zbiórkę')
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
function CollectionDetail({ collection, onBack, onEdit, editingSheet }) {
  const { state, dispatch, derived, notify } = useStore()
  const [importing, setImporting] = useState(false)
  const st = derived.collectionStats[collection.id]
  const students = [...state.students].sort((a, b) =>
    (a.lastName || '').localeCompare(b.lastName || '', 'pl')
  )

  const remove = () => {
    if (confirm(`Usunąć zbiórkę „${collection.name}”?`)) {
      dispatch({ type: 'collection/remove', id: collection.id })
      notify('Usunięto zbiórkę')
      onBack()
    }
  }

  return (
    <div className="view">
      <div className="row row--between fade-in stagger-1" style={{ marginBottom: '0.5rem' }}>
        <button className="icon-btn" onClick={onBack} aria-label="Wróć"><IconBack /></button>
        <div className="row gap-sm">
          <button className="icon-btn" onClick={onEdit} aria-label="Edytuj"><IconEdit width={18} height={18} /></button>
          <button className="icon-btn icon-btn--danger" onClick={remove} aria-label="Usuń"><IconTrash width={18} height={18} /></button>
        </div>
      </div>

      <header className="view__head fade-in stagger-2">
        <h1 className="view__title" style={{ fontSize: 'clamp(1.7rem, 7vw, 2.4rem)' }}>{collection.name}</h1>
        <p className="view__lead">
          {collection.isMainFund && <span className="pill pill--paid" style={{ marginRight: '0.5rem' }}>Kasa klasowa</span>}
          Cel {formatMoney(collection.target)}/os.
          {collection.deadline ? ` · termin ${formatDate(collection.deadline)}` : ''}
        </p>
      </header>

      <div className="balance fade-in stagger-3" style={{ padding: '1.4rem' }}>
        <div className="balance__label">Zebrano w tej zbiórce</div>
        <div className="balance__value" style={{ fontSize: 'clamp(2rem, 10vw, 3rem)' }}>
          {formatMoney(st.collected)}
        </div>
        <div className="progress" style={{ background: 'rgba(0,0,0,0.25)' }}>
          <div className="progress__fill" style={{ width: `${st.progress * 100}%` }} />
        </div>
        <div className="balance__meta">
          <div><span>Opłacili</span><strong className="amount--mint">{st.paidCount}/{students.length}</strong></div>
          <div><span>Brakuje</span><strong className="amount--coral">{formatMoney(Math.max(0, st.expected - st.collected))}</strong></div>
          {st.spent > 0 && (
            <>
              <div><span>Wydano</span><strong className="amount--coral">{formatMoney(st.spent)}</strong></div>
              <div><span>Zostało</span><strong className={st.remaining < 0 ? 'amount--coral' : 'amount--gold'}>{formatMoney(st.remaining)}</strong></div>
            </>
          )}
        </div>
      </div>

      <button className="btn btn--ghost btn--block mt-md fade-in stagger-4" onClick={() => setImporting(true)}>
        <IconUpload width={18} height={18} /> Importuj wyciąg bankowy
      </button>

      <div className="section-title fade-in stagger-4">
        <h3>Statusy wpłat</h3>
        <span className="count">{students.length} uczniów</span>
      </div>

      {students.length === 0 && (
        <div className="empty"><p>Najpierw dodaj uczniów w zakładce „Klasa”.</p></div>
      )}

      {students.map((s) => {
        const p = paymentStatus(collection, s.id)
        return (
          <PaymentRow
            key={s.id}
            student={s}
            payment={p}
            target={collection.target}
            onSet={(status, amount) =>
              dispatch({
                type: 'payment/set',
                payload: { collectionId: collection.id, studentId: s.id, status, amount },
              })
            }
          />
        )
      })}

      {importing && (
        <ImportStatement collection={collection} onClose={() => setImporting(false)} />
      )}
      {editingSheet}
    </div>
  )
}

function PaymentRow({ student, payment, target, onSet }) {
  const [editingAmt, setEditingAmt] = useState(false)
  const [draft, setDraft] = useState(String(payment.amount || ''))

  const cycle = () => {
    // quick toggle: unpaid -> paid (full target) -> unpaid
    if (payment.status === 'paid' || payment.amount >= target) {
      onSet('unpaid', 0)
    } else {
      onSet('paid', target)
    }
  }

  const saveAmount = () => {
    const amt = round2(parseAmount(draft))
    const status = amt >= target && target > 0 ? 'paid' : amt > 0 ? 'partial' : 'unpaid'
    onSet(status, amt)
    setEditingAmt(false)
  }

  const statusClass =
    payment.status === 'paid' ? 'pill--paid' :
    payment.status === 'partial' ? 'pill--partial' : 'pill--unpaid'
  const statusLabel =
    payment.status === 'paid' ? 'Opłacone' :
    payment.status === 'partial' ? 'Częściowo' : 'Zalega'

  return (
    <div className="item">
      <div className="avatar">{initials(student.firstName, student.lastName)}</div>
      <div className="grow" onClick={() => setEditingAmt(true)} style={{ cursor: 'pointer' }}>
        <div className="item__name truncate">{fullName(student)}</div>
        {editingAmt ? (
          <div className="row gap-sm" style={{ marginTop: 4 }} onClick={(e) => e.stopPropagation()}>
            <input
              inputMode="decimal"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveAmount()}
              style={{ padding: '0.4rem 0.6rem', maxWidth: 120 }}
            />
            <button className="btn btn--primary btn--sm" onClick={saveAmount}>OK</button>
          </div>
        ) : (
          <div className="item__meta">
            <span className="amount amount--mint">{formatMoney(payment.amount)}</span>
            {target > 0 && ` / ${formatMoney(target)}`}
          </div>
        )}
      </div>
      <button className={`pill ${statusClass}`} onClick={cycle} style={{ cursor: 'pointer', border: 'none' }}>
        {statusLabel}
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
function CollectionForm({ collection, onClose, onSave }) {
  const [name, setName] = useState(collection?.name || '')
  const [target, setTarget] = useState(collection?.target != null ? String(collection.target) : '')
  const [deadline, setDeadline] = useState(collection?.deadline || '')
  const [isMainFund, setIsMainFund] = useState(!!collection?.isMainFund)

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      target: round2(parseAmount(target)),
      deadline,
      isMainFund,
    })
  }

  return (
    <Sheet title={collection ? 'Edytuj zbiórkę' : 'Nowa zbiórka'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Nazwa zbiórki</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Wycieczka do Krakowa" autoFocus />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Kwota / osobę (zł)</label>
            <input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="50" />
          </div>
          <div className="field">
            <label>Termin</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>
        <label className="toggle-field">
          <input type="checkbox" checked={isMainFund} onChange={(e) => setIsMainFund(e.target.checked)} />
          <span>
            <strong>To jest składka na kasę klasową</strong>
            <small>Jednorazowa wpłata od rodziców zasilająca wspólny budżet klasy.</small>
          </span>
        </label>
        <button type="submit" className="btn btn--primary btn--block mt-sm">
          {collection ? 'Zapisz zmiany' : 'Utwórz zbiórkę'}
        </button>
      </form>
    </Sheet>
  )
}

function formatDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return d
  }
}
