/* =========================================================================
   Firebase auth + Firestore sync helpers.
   The entire app state is stored as a single document per user:
     users/{uid}/skarbnik/data
   This keeps the existing reducer model intact while enabling realtime
   multi-device sync via onSnapshot.
   ========================================================================= */
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider, firebaseEnabled } from './config.js'

export { firebaseEnabled }

/** Subscribe to auth changes. Returns an unsubscribe function. */
export function watchAuth(callback) {
  if (!firebaseEnabled) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

export async function signInWithGoogle() {
  if (!firebaseEnabled) throw new Error('Firebase nie jest skonfigurowany.')
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

export async function signOut() {
  if (!firebaseEnabled) return
  await fbSignOut(auth)
}

function userDocRef(uid) {
  return doc(db, 'users', uid, 'skarbnik', 'data')
}

/**
 * Subscribe to the user's state document in realtime.
 * onData receives the parsed state object, or null if the doc doesn't exist.
 */
export function watchState(uid, onData, onError) {
  return onSnapshot(
    userDocRef(uid),
    (snap) => {
      onData(snap.exists() ? snap.data() : null)
    },
    (err) => onError?.(err)
  )
}

/** Persist the entire state object for a user. */
export async function saveState(uid, state) {
  await setDoc(userDocRef(uid), {
    students: state.students || [],
    collections: state.collections || [],
    expenses: state.expenses || [],
    updatedAt: Date.now(),
  })
}
