import { useRef, useState } from 'react'
import { useStore } from '../store/useStore.jsx'
import { parseStatementFile } from '../utils/parseStatement.js'
import { matchTransactions } from '../utils/matching.js'
import { formatMoney, fullName, round2 } from '../utils/money.js'
import Sheet from '../components/Sheet.jsx'
import { IconUpload, IconSparkle, IconCheck } from '../components/Icons.jsx'

/**
 * Import a bank statement (CSV/PDF) scoped to one collection and map the
 * transactions onto students automatically. The user reviews / overrides the
 * matches before applying them to the payment statuses.
 */
export default function ImportStatement({ collection, onClose }) {
  const { state, dispatch, notify } = useStore()
  const fileRef = useRef(null)
  const [step, setStep] = useState('upload') // upload | review
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([]) // [{txn, studentId, by, amount, include}]
  const [unmatchedCount, setUnmatchedCount] = useState(0)

  const onFile = async (file) => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const transactions = await parseStatementFile(file)
      if (!transactions.length) {
        setError('Nie wykryto żadnych wpłat w pliku. Sprawdź format wyciągu.')
        setBusy(false)
        return
      }
      const { matches, unmatched } = matchTransactions(
        transactions,
        state.students,
        collection.target
      )
      const reviewRows = matches.map((m, i) => ({
        key: `m-${i}`,
        txn: m.txn,
        studentId: m.studentId,
        by: m.by,
        amount: m.amount,
        include: true,
      }))
      // also surface unmatched so the user can assign them manually
      unmatched.forEach((txn, i) => {
        reviewRows.push({
          key: `u-${i}`,
          txn,
          studentId: '',
          by: '',
          amount: txn.amount,
          include: false,
        })
      })
      setRows(reviewRows)
      setUnmatchedCount(unmatched.length)
      setStep('review')
    } catch (e) {
      setError(e.message || 'Nie udało się odczytać pliku.')
    } finally {
      setBusy(false)
    }
  }

  const updateRow = (key, patch) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const apply = () => {
    const entries = rows
      .filter((r) => r.include && r.studentId)
      .map((r) => ({ studentId: r.studentId, amount: round2(Number(r.amount) || 0) }))
    if (!entries.length) {
      setError('Zaznacz przynajmniej jedną wpłatę z przypisanym uczniem.')
      return
    }
    dispatch({ type: 'payment/bulkApply', payload: { collectionId: collection.id, entries } })
    notify(`Zaksięgowano ${entries.length} wpłat`)
    onClose()
  }

  const matchedSelected = rows.filter((r) => r.include && r.studentId).length

  return (
    <Sheet
      title="Import wyciągu"
      onClose={onClose}
      footer={
        step === 'review' && (
          <button className="btn btn--primary btn--block" onClick={apply}>
            <IconCheck width={18} height={18} /> Zaksięguj {matchedSelected} wpłat
          </button>
        )
      }
    >
      <p className="secondary" style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
        Zbiórka: <strong>{collection.name}</strong> · cel {formatMoney(collection.target)}/os.
      </p>

      {step === 'upload' && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.pdf,.txt,text/csv,application/pdf"
            className="hide"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <button
            className="card"
            style={{
              width: '100%',
              cursor: 'pointer',
              textAlign: 'center',
              borderStyle: 'dashed',
              borderColor: 'var(--line-strong)',
              padding: '2.2rem 1rem',
            }}
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            <div style={{ color: 'var(--accent-mint)', marginBottom: '0.6rem' }}>
              <IconUpload width={34} height={34} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>
              {busy ? 'Przetwarzanie…' : 'Wgraj plik CSV lub PDF'}
            </div>
            <div className="muted" style={{ fontSize: '0.82rem', marginTop: '0.3rem' }}>
              Wyciąg bankowy zostanie automatycznie dopasowany do uczniów
            </div>
          </button>

          <div className="card mt-md" style={{ background: 'var(--bg-secondary)' }}>
            <div className="row gap-sm" style={{ alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--accent-gold)' }}><IconSparkle width={20} height={20} /></span>
              <div className="grow">
                <strong style={{ fontFamily: 'var(--font-display)' }}>Jak działa dopasowanie?</strong>
                <p className="secondary" style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
                  Aplikacja czyta tytuły przelewów i szuka nazwisk uczniów (ignorując
                  polskie znaki i wielkość liter). Każdą wpłatę możesz ręcznie
                  poprawić przed zaksięgowaniem.
                </p>
              </div>
            </div>
          </div>
          {error && <p style={{ color: 'var(--accent-coral)', marginTop: '1rem' }}>{error}</p>}
        </>
      )}

      {step === 'review' && (
        <>
          <div className="row row--between mb-sm">
            <span className="pill pill--paid">
              <IconCheck width={13} height={13} /> Dopasowano {rows.length - unmatchedCount}
            </span>
            {unmatchedCount > 0 && (
              <span className="pill pill--unpaid">Bez przypisania {unmatchedCount}</span>
            )}
          </div>

          {rows.map((r) => (
            <div className="card" key={r.key} style={{ padding: '0.85rem' }}>
              <div className="row row--between">
                <label className="row gap-sm" style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}>
                  <input
                    type="checkbox"
                    checked={r.include}
                    onChange={(e) => updateRow(r.key, { include: e.target.checked })}
                    style={{ width: 20, height: 20, flexShrink: 0 }}
                  />
                  <span className="amount amount--mint" style={{ fontSize: '1.05rem' }}>
                    {formatMoney(r.amount)}
                  </span>
                </label>
                {r.by && <span className="pill pill--neutral">{r.by}</span>}
              </div>

              <p className="muted truncate" style={{ fontSize: '0.78rem', margin: '0.4rem 0' }}>
                {r.txn.description || r.txn.raw}
              </p>

              <select
                value={r.studentId}
                onChange={(e) =>
                  updateRow(r.key, { studentId: e.target.value, include: !!e.target.value })
                }
              >
                <option value="">— przypisz ucznia —</option>
                {state.students.map((s) => (
                  <option key={s.id} value={s.id}>{fullName(s)}</option>
                ))}
              </select>
            </div>
          ))}

          {error && <p style={{ color: 'var(--accent-coral)', marginTop: '1rem' }}>{error}</p>}
          <button className="btn btn--ghost btn--block mt-sm" onClick={() => setStep('upload')}>
            Wgraj inny plik
          </button>
        </>
      )}
    </Sheet>
  )
}
