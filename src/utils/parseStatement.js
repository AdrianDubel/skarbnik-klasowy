import Papa from 'papaparse'
import { transactionsFromRows, transactionsFromText } from './matching.js'

/* =========================================================================
   File readers that turn an uploaded bank statement (CSV / PDF) into a
   normalized transaction list.
   ========================================================================= */

export async function parseStatementFile(file) {
  const name = (file.name || '').toLowerCase()
  if (name.endsWith('.csv') || file.type === 'text/csv') {
    return parseCsv(file)
  }
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    return parsePdf(file)
  }
  // try CSV as a fallback for txt
  if (name.endsWith('.txt')) return parseCsv(file)
  throw new Error('Nieobsługiwany format. Wgraj plik CSV lub PDF.')
}

function parseCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      delimiter: '', // auto-detect (handles ; and ,)
      skipEmptyLines: true,
      complete: (res) => {
        try {
          resolve(transactionsFromRows(res.data))
        } catch (e) {
          reject(e)
        }
      },
      error: (err) => reject(err),
    })
  })
}

async function parsePdf(file) {
  // Lazy-load pdfjs and configure the worker from the bundled module.
  const pdfjs = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const buffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: buffer }).promise
  let fullText = ''
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    // Reconstruct lines using the y-coordinate of each text item.
    const lines = new Map()
    for (const item of content.items) {
      const y = Math.round(item.transform[5])
      if (!lines.has(y)) lines.set(y, [])
      lines.get(y).push(item.str)
    }
    const ordered = [...lines.entries()].sort((a, b) => b[0] - a[0])
    fullText += ordered.map(([, parts]) => parts.join(' ')).join('\n') + '\n'
  }
  return transactionsFromText(fullText)
}
