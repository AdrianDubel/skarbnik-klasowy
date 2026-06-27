/* =========================================================================
   Generator ikon PWA — bez zewnętrznych zależności (czysty Node + zlib).
   Tworzy ikony z monogramem "S" (białe na atramentowym tle #111318),
   zgodne z brandingiem aplikacji Skarbnik Klasowy.

   Uruchom:  node scripts/gen-icons.mjs
   ========================================================================= */
import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public')
mkdirSync(OUT, { recursive: true })

// ---- kolory (RGBA) ----
const INK = [17, 19, 24, 255] // #111318
const WHITE = [255, 255, 255, 255]

// Bitmapa litery "S" w siatce 7 (szer.) x 9 (wys.). 1 = piksel litery.
const S_GLYPH = [
  '0111110',
  '1100011',
  '1100000',
  '1100000',
  '0111110',
  '0000011',
  '0000011',
  '1100011',
  '0111110',
]
const GW = S_GLYPH[0].length
const GH = S_GLYPH.length

// ---- enkoder PNG ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  // raw scanlines z filtrem 0
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function drawIcon(size, { padding = 0.18 } = {}) {
  const px = Buffer.alloc(size * size * 4)
  // tło — atrament (wypełnia całość, dobre dla ikon maskable)
  for (let i = 0; i < size * size; i++) {
    px[i * 4] = INK[0]
    px[i * 4 + 1] = INK[1]
    px[i * 4 + 2] = INK[2]
    px[i * 4 + 3] = INK[3]
  }
  // strefa bezpieczna dla glifu
  const safe = size * (1 - padding * 2)
  const cell = Math.floor(Math.min(safe / GW, safe / GH))
  const glyphW = cell * GW
  const glyphH = cell * GH
  const offX = Math.floor((size - glyphW) / 2)
  const offY = Math.floor((size - glyphH) / 2)
  for (let gy = 0; gy < GH; gy++) {
    for (let gx = 0; gx < GW; gx++) {
      if (S_GLYPH[gy][gx] !== '1') continue
      for (let y = 0; y < cell; y++) {
        for (let x = 0; x < cell; x++) {
          const px0 = offX + gx * cell + x
          const py0 = offY + gy * cell + y
          const idx = (py0 * size + px0) * 4
          px[idx] = WHITE[0]
          px[idx + 1] = WHITE[1]
          px[idx + 2] = WHITE[2]
          px[idx + 3] = WHITE[3]
        }
      }
    }
  }
  return encodePng(size, size, px)
}

const targets = [
  { name: 'pwa-192.png', size: 192, padding: 0.18 },
  { name: 'pwa-512.png', size: 512, padding: 0.18 },
  { name: 'apple-touch-icon.png', size: 180, padding: 0.12 }, // iOS nie maskuje — mniejszy padding
  { name: 'favicon-32.png', size: 32, padding: 0.12 },
]

for (const t of targets) {
  const buf = drawIcon(t.size, { padding: t.padding })
  writeFileSync(join(OUT, t.name), buf)
  console.log(`✓ ${t.name} (${t.size}×${t.size}, ${buf.length} B)`)
}

// ---- wersja SVG (skalowalna, ten sam blokowy monogram) ----
function buildSvg({ rounded = false, padding = 0.18 } = {}) {
  const V = 100
  const safe = V * (1 - padding * 2)
  const cell = Math.min(safe / GW, safe / GH)
  const glyphW = cell * GW
  const glyphH = cell * GH
  const offX = (V - glyphW) / 2
  const offY = (V - glyphH) / 2
  const rects = []
  for (let gy = 0; gy < GH; gy++) {
    for (let gx = 0; gx < GW; gx++) {
      if (S_GLYPH[gy][gx] !== '1') continue
      const x = +(offX + gx * cell).toFixed(2)
      const y = +(offY + gy * cell).toFixed(2)
      const w = +cell.toFixed(2)
      rects.push(`<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="#fff"/>`)
    }
  }
  const bg = rounded
    ? `<rect width="${V}" height="${V}" rx="22" fill="#111318"/>`
    : `<rect width="${V}" height="${V}" fill="#111318"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${V} ${V}">${bg}${rects.join('')}</svg>\n`
}

writeFileSync(join(OUT, 'favicon.svg'), buildSvg({ rounded: true, padding: 0.12 }))
writeFileSync(join(OUT, 'icon-maskable.svg'), buildSvg({ rounded: false, padding: 0.22 }))
console.log('✓ favicon.svg, icon-maskable.svg')

console.log('Gotowe — ikony zapisane w public/')
