/* Money & formatting helpers (PLN) */

export const PLN = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  minimumFractionDigits: 2,
})

export function formatMoney(value) {
  const n = Number(value) || 0
  return PLN.format(n)
}

/** Parse a user/bank-provided amount string into a Number (grosze-safe). */
export function parseAmount(raw) {
  if (raw == null) return 0
  if (typeof raw === 'number') return raw
  let s = String(raw).trim()
  if (!s) return 0
  // strip currency words / spaces / non-breaking spaces
  s = s.replace(/(pln|zł|zl|\s|\u00a0)/gi, '')
  // if both separators present, the last one is the decimal separator
  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      s = s.replace(/,/g, '')
    }
  } else if (lastComma > -1) {
    // assume comma is decimal separator
    s = s.replace(/\./g, '').replace(',', '.')
  }
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

/** Round to 2 decimals avoiding float drift. */
export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

export function initials(firstName = '', lastName = '') {
  const a = (firstName || '').trim()[0] || ''
  const b = (lastName || '').trim()[0] || ''
  return (a + b).toUpperCase() || '?'
}

export function fullName(s) {
  return `${s.firstName || ''} ${s.lastName || ''}`.trim()
}
