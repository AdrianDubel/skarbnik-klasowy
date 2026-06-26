import { createContext, useContext, useEffect, useMemo, useReducer, useState, useCallback, useRef } from 'react'
import { round2 } from '../utils/money.js'
import {
  firebaseEnabled,
  watchAuth,
  watchState,
  saveState,
  signInWithGoogle,
  signOut as fbSignOut,
} from '../firebase/sync.js'

const STORAGE_KEY = 'skarbnik-klasowy:v1'

/* ---------- ID helper ---------- */
const uid = () =>
  (crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`)

/* ---------- Initial / demo state ---------- */
function demoState() {
  const students = [
    { id: uid(), firstName: 'Anna', lastName: 'Kowalska', note: '' },
    { id: uid(), firstName: 'Piotr', lastName: 'Nowak', note: '' },
    { id: uid(), firstName: 'Maria', lastName: 'Wiśniewska', note: '' },
    { id: uid(), firstName: 'Jakub', lastName: 'Wójcik', note: '' },
  ]
  const target = 50
  const payments = {}
  payments[students[0].id] = { status: 'paid', amount: 50 }
  payments[students[1].id] = { status: 'partial', amount: 20 }
  payments[students[2].id] = { status: 'paid', amount: 50 }
  // student[3] unpaid
  const collections = [
    {
      id: uid(),
      name: 'Składka na Dzień Nauczyciela',
      target,
      deadline: '',
      createdAt: Date.now(),
      payments,
    },
  ]
  const expenses = [
    { id: uid(), description: 'Kwiaty dla wychowawcy', amount: 60, date: Date.now() },
  ]
  return { students, collections, expenses }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return demoState()
    const parsed = JSON.parse(raw)
    return {
      students: parsed.students || [],
      collections: parsed.collections || [],
      expenses: parsed.expenses || [],
    }
  } catch {
    return demoState()
  }
}

/* ---------- Cloud-mode helpers ---------- */
function emptyState() {
  return { students: [], collections: [], expenses: [] }
}
function normalizeState(d) {
  return {
    students: d?.students || [],
    collections: d?.collections || [],
    expenses: d?.expenses || [],
  }
}
function serializeState(s) {
  return JSON.stringify(normalizeState(s))
}
function mapAuthError(e) {
  const code = e?.code || ''
  if (code === 'auth/popup-closed-by-user') return 'Logowanie anulowane.'
  if (code === 'auth/cancelled-popup-request') return 'Logowanie anulowane.'
  if (code === 'auth/popup-blocked') return 'Przeglądarka zablokowała okno logowania.'
  if (code === 'auth/unauthorized-domain')
    return 'Ta domena nie jest autoryzowana w Firebase (dodaj ją w Authentication → Settings).'
  if (code === 'auth/network-request-failed') return 'Błąd sieci. Sprawdź połączenie.'
  return e?.message || 'Nie udało się zalogować.'
}

/* ---------- Reducer ---------- */
function reducer(state, action) {
  switch (action.type) {
    /* Students */
    case 'student/add':
      return { ...state, students: [...state.students, { id: uid(), ...action.payload }] }
    case 'student/update':
      return {
        ...state,
        students: state.students.map((s) =>
          s.id === action.id ? { ...s, ...action.payload } : s
        ),
      }
    case 'student/remove': {
      const collections = state.collections.map((c) => {
        const payments = { ...c.payments }
        delete payments[action.id]
        return { ...c, payments }
      })
      return {
        ...state,
        students: state.students.filter((s) => s.id !== action.id),
        collections,
      }
    }

    /* Collections */
    case 'collection/add':
      return {
        ...state,
        collections: [
          { id: uid(), createdAt: Date.now(), payments: {}, ...action.payload },
          ...state.collections,
        ],
      }
    case 'collection/update':
      return {
        ...state,
        collections: state.collections.map((c) =>
          c.id === action.id ? { ...c, ...action.payload } : c
        ),
      }
    case 'collection/remove':
      return {
        ...state,
        collections: state.collections.filter((c) => c.id !== action.id),
      }
    case 'payment/set': {
      const { collectionId, studentId, status, amount } = action.payload
      return {
        ...state,
        collections: state.collections.map((c) => {
          if (c.id !== collectionId) return c
          const payments = { ...c.payments }
          if (status === 'unpaid' && !amount) {
            delete payments[studentId]
          } else {
            payments[studentId] = { status, amount: round2(amount || 0) }
          }
          return { ...c, payments }
        }),
      }
    }
    case 'payment/bulkApply': {
      const { collectionId, entries } = action.payload // [{studentId, amount}]
      return {
        ...state,
        collections: state.collections.map((c) => {
          if (c.id !== collectionId) return c
          const payments = { ...c.payments }
          for (const { studentId, amount } of entries) {
            const existing = payments[studentId]?.amount || 0
            const total = round2(existing + amount)
            const status = total >= c.target ? 'paid' : total > 0 ? 'partial' : 'unpaid'
            payments[studentId] = { status, amount: total }
          }
          return { ...c, payments }
        }),
      }
    }

    /* Expenses */
    case 'expense/add':
      return {
        ...state,
        expenses: [{ id: uid(), date: Date.now(), ...action.payload }, ...state.expenses],
      }
    case 'expense/remove':
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) }

    /* Data */
    case 'data/reset':
      return demoState()
    case 'data/clear':
      return { students: [], collections: [], expenses: [] }
    case 'data/import':
      return action.payload

    default:
      return state
  }
}

/* ---------- Context ---------- */
const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => (firebaseEnabled ? emptyState() : loadState())
  )
  const [toast, setToast] = useState(null)

  /* ---------- Auth ---------- */
  const [user, setUser] = useState(null)
  const [authStatus, setAuthStatus] = useState(firebaseEnabled ? 'loading' : 'local')
  const [authError, setAuthError] = useState('')

  const remoteJsonRef = useRef(null) // last state JSON exchanged with the cloud
  const cloudReady = useRef(false)
  const saveTimer = useRef(null)

  const notify = useCallback((message) => {
    setToast({ message, id: Date.now() })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  /* Watch authentication state (cloud mode only) */
  useEffect(() => {
    if (!firebaseEnabled) return
    const unsub = watchAuth((u) => {
      setUser(u)
      setAuthStatus(u ? 'signedIn' : 'signedOut')
      if (!u) {
        cloudReady.current = false
        remoteJsonRef.current = null
      }
    })
    return unsub
  }, [])

  /* Subscribe to the user's cloud document in realtime */
  useEffect(() => {
    if (!firebaseEnabled || !user) return
    cloudReady.current = false
    const unsub = watchState(
      user.uid,
      async (data) => {
        if (data == null) {
          // First sign-in: migrate whatever is in localStorage (or demo data).
          const seed = loadState()
          remoteJsonRef.current = serializeState(seed)
          dispatch({ type: 'data/import', payload: normalizeState(seed) })
          cloudReady.current = true
          try {
            await saveState(user.uid, seed)
          } catch {
            /* ignore initial seed failure */
          }
          return
        }
        const incoming = normalizeState(data)
        const json = serializeState(incoming)
        if (json === remoteJsonRef.current) {
          cloudReady.current = true
          return // echo of our own write — no re-render needed
        }
        remoteJsonRef.current = json
        dispatch({ type: 'data/import', payload: incoming })
        cloudReady.current = true
      },
      (err) => setAuthError('Błąd synchronizacji: ' + err.message)
    )
    return unsub
  }, [user])

  /* Persist on every change — to localStorage or to the cloud */
  useEffect(() => {
    if (!firebaseEnabled) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        /* storage full / unavailable — ignore */
      }
      return
    }
    // cloud mode
    if (!user || !cloudReady.current) return
    const json = serializeState(state)
    if (json === remoteJsonRef.current) return // unchanged or remote echo
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      remoteJsonRef.current = json
      try {
        await saveState(user.uid, state)
      } catch (e) {
        setAuthError('Nie udało się zapisać w chmurze: ' + e.message)
      }
    }, 500)
  }, [state, user])

  const auth = useMemo(
    () => ({
      enabled: firebaseEnabled,
      user,
      status: authStatus, // 'local' | 'loading' | 'signedOut' | 'signedIn'
      error: authError,
      clearError: () => setAuthError(''),
      signIn: async () => {
        setAuthError('')
        try {
          await signInWithGoogle()
        } catch (e) {
          setAuthError(mapAuthError(e))
        }
      },
      signOut: async () => {
        clearTimeout(saveTimer.current)
        await fbSignOut()
        dispatch({ type: 'data/clear' })
      },
    }),
    [user, authStatus, authError]
  )

  /* ---------- Derived selectors ---------- */
  const derived = useMemo(() => computeDerived(state), [state])

  const value = useMemo(
    () => ({ state, dispatch, derived, notify, toast, auth }),
    [state, derived, notify, toast, auth]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

/* ---------- Derived calculations ---------- */
function computeDerived(state) {
  const { students, collections, expenses } = state

  // total paid per student across all collections
  const perStudent = {}
  for (const s of students) perStudent[s.id] = 0

  let totalCollected = 0
  for (const c of collections) {
    for (const [studentId, p] of Object.entries(c.payments || {})) {
      const amt = Number(p.amount) || 0
      totalCollected += amt
      if (perStudent[studentId] != null) perStudent[studentId] += amt
    }
  }
  for (const k of Object.keys(perStudent)) perStudent[k] = round2(perStudent[k])
  totalCollected = round2(totalCollected)

  const totalExpenses = round2(expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0))
  const balance = round2(totalCollected - totalExpenses)

  // per-collection stats
  const collectionStats = {}
  for (const c of collections) {
    let collected = 0
    let paidCount = 0
    let partialCount = 0
    for (const s of students) {
      const p = c.payments?.[s.id]
      const amt = Number(p?.amount) || 0
      collected += amt
      if (amt >= c.target && c.target > 0) paidCount++
      else if (amt > 0) partialCount++
    }
    const expected = round2((Number(c.target) || 0) * students.length)
    collectionStats[c.id] = {
      collected: round2(collected),
      expected,
      paidCount,
      partialCount,
      unpaidCount: students.length - paidCount - partialCount,
      progress: expected > 0 ? Math.min(1, collected / expected) : 0,
    }
  }

  return {
    perStudent,
    totalCollected,
    totalExpenses,
    balance,
    collectionStats,
    studentCount: students.length,
  }
}

/* ---------- Helpers exported for components ---------- */
export function paymentStatus(collection, studentId) {
  const p = collection.payments?.[studentId]
  if (!p) return { status: 'unpaid', amount: 0 }
  return p
}

export function debtorsForCollection(collection, students) {
  return students
    .map((s) => {
      const p = collection.payments?.[s.id]
      const paid = Number(p?.amount) || 0
      const due = round2((Number(collection.target) || 0) - paid)
      return { student: s, paid, due }
    })
    .filter((row) => row.due > 0.001)
    .sort((a, b) => b.due - a.due)
}

export function globalDebtors(collections, students) {
  const map = new Map()
  for (const s of students) map.set(s.id, { student: s, due: 0, collections: [] })
  for (const c of collections) {
    for (const s of students) {
      const paid = Number(c.payments?.[s.id]?.amount) || 0
      const due = round2((Number(c.target) || 0) - paid)
      if (due > 0.001) {
        const entry = map.get(s.id)
        entry.due = round2(entry.due + due)
        entry.collections.push({ name: c.name, due })
      }
    }
  }
  return [...map.values()].filter((e) => e.due > 0.001).sort((a, b) => b.due - a.due)
}
