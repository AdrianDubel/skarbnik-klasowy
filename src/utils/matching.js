import { parseAmount, round2 } from './money.js'

/* =========================================================================
   Bank statement parsing (CSV + PDF) and student matching.
   ========================================================================= */

/** Remove Polish diacritics + lowercase for fuzzy matching. */
export function normalize(text = '') {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/* ---------- CSV ---------- */
/**
 * Parse CSV rows (already parsed by PapaParse into array-of-arrays or array-of-objects)
 * into a normalized list of transactions: { description, amount, raw }.
 * Heuristics detect amount + description columns automatically.
 */
export function transactionsFromRows(rows) {
  if (!rows || !rows.length) return []
  const txns = []

  for (const row of rows) {
    const cells = Array.isArray(row) ? row : Object.values(row)
    if (!cells || !cells.length) continue

    // Find the most plausible "credit/amount" cell.
    // Prefer cells holding a money value with two decimals (120,00 / 1 250.00),
    // skipping anything that looks like a date (2026-05-04, 04/05/2026).
    let bestAmount = 0
    let amountIdx = -1
    let bestHasDecimals = false
    cells.forEach((cell, i) => {
      const str = String(cell ?? '')
      if (isDateLike(str)) return
      const hasDecimals = /\d[.,]\d{2}(?!\d)/.test(str)
      // require either a decimal money pattern, or a plain positive integer
      if (!hasDecimals && !/^\s*-?\d{1,7}\s*(zł|pln)?\s*$/i.test(str)) return
      const val = parseAmount(str)
      if (val <= 0) return
      // decimal money always wins over bare integers; otherwise take the largest
      const better = hasDecimals
        ? !bestHasDecimals || val > bestAmount
        : !bestHasDecimals && val > bestAmount
      if (better) {
        bestAmount = val
        amountIdx = i
        bestHasDecimals = hasDecimals
      }
    })
    if (bestAmount <= 0) continue

    // Description = concat of the remaining textual cells.
    const description = cells
      .map((c, i) => (i === amountIdx ? '' : String(c ?? '')))
      .filter((c) => c && !/^[\d\s.,-]+$/.test(c))
      .join(' ')
      .trim()

    txns.push({ description, amount: round2(bestAmount), raw: cells.join(' | ') })
  }
  return txns
}

/* ---------- PDF text ---------- */
/**
 * Extract transactions from raw PDF text. Looks for lines that contain
 * an amount pattern and treats the surrounding text as the description.
 */
export function transactionsFromText(text) {
  if (!text) return []
  const txns = []
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  // amount like 120,00 / 1 250,00 / 50.00 (with optional zł)
  const amountRe = /(\d{1,3}(?:[ \u00a0]\d{3})*|\d+)[.,]\d{2}/g

  for (const line of lines) {
    const matches = [...line.matchAll(amountRe)]
    if (!matches.length) continue
    // pick the largest positive amount on the line as the payment value
    let amount = 0
    let matchStr = ''
    for (const m of matches) {
      const v = parseAmount(m[0])
      if (v > amount) { amount = v; matchStr = m[0] }
    }
    if (amount <= 0) continue
    const description = line.replace(matchStr, ' ').replace(/\s+/g, ' ').trim()
    txns.push({ description, amount: round2(amount), raw: line })
  }
  return txns
}

/* ---------- Matching transactions -> students ---------- */
/**
 * Match parsed transactions to students.
 * Strategy (in order of confidence):
 *   1. Last name (and ideally first name) found in the transaction description.
 *   2. Unique amount equal to the collection target → the single remaining unpaid student? (no — amount alone is ambiguous, only used as hint)
 * Returns { matches: [{ studentId, amount, txn, by }], unmatched: [txn] }
 */
export function matchTransactions(transactions, students, target = 0) {
  const matches = []
  const unmatched = []
  const usedStudent = new Set()

  const prepared = students.map((s) => ({
    s,
    last: normalize(s.lastName),
    first: normalize(s.firstName),
    full: normalize(`${s.firstName} ${s.lastName}`),
    rev: normalize(`${s.lastName} ${s.firstName}`),
  }))

  for (const txn of transactions) {
    const desc = normalize(txn.description)
    let found = null
    let by = ''

    // 1a. full name (either order) present
    for (const p of prepared) {
      if (!p.last) continue
      if ((p.full && desc.includes(p.full)) || (p.rev && desc.includes(p.rev))) {
        found = p.s; by = 'imię i nazwisko'; break
      }
    }

    // 1b. last name present (must be reasonably unique within description)
    if (!found) {
      const lastHits = prepared.filter((p) => p.last && p.last.length >= 3 && wordIncludes(desc, p.last))
      if (lastHits.length === 1) {
        found = lastHits[0].s; by = 'nazwisko'
      } else if (lastHits.length > 1) {
        // disambiguate with first name
        const refined = lastHits.filter((p) => p.first && wordIncludes(desc, p.first))
        if (refined.length === 1) { found = refined[0].s; by = 'imię i nazwisko' }
      }
    }

    if (found) {
      matches.push({ studentId: found.id, amount: txn.amount, txn, by })
      usedStudent.add(found.id)
    } else {
      unmatched.push(txn)
    }
  }

  // 2. Amount-based hint for the still-unmatched: if a txn amount equals the
  // target exactly AND exactly one student is still unmatched with no payment,
  // we surface it as a low-confidence suggestion (by = 'kwota').
  return { matches, unmatched }
}

function wordIncludes(haystack, needle) {
  return new RegExp(`(^|\\s)${escapeRe(needle)}(\\s|$)`).test(haystack)
}
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Detect cells that are dates rather than money amounts. */
function isDateLike(str) {
  const s = str.trim()
  return (
    /\b\d{4}[-./]\d{1,2}[-./]\d{1,2}\b/.test(s) || // 2026-05-04
    /\b\d{1,2}[-./]\d{1,2}[-./]\d{2,4}\b/.test(s)    // 04.05.2026
  )
}
