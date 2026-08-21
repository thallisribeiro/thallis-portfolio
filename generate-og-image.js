#!/usr/bin/env node
// Gera assets/og-default.png (1200x630) — a imagem de compartilhamento padrão pra
// qualquer página sem imagem própria (posts de blog sem capa, por exemplo). Antes
// disso o fallback era o print do Grana, que aparecia errado ao compartilhar posts
// sem nada a ver com o Grana.
//
// PNG puro escrito na mão (assinatura + IHDR + IDAT via zlib nativo + IEND), sem
// nenhuma dependência nova — mesma convenção do resto do repo (buscar-imagem.js
// também usa só módulos nativos do Node).

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const W = 1200, H = 630;
const BG = [0x0B, 0x0F, 0x14];       // --background
const G1 = [0x25, 0xD3, 0x66];       // --primary
const G2 = [0x58, 0xA6, 0xFF];       // --accent

function mix(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }

// Distância até um retângulo arredondado centralizado, pra desenhar o logomark
// com anti-aliasing simples (mesma lógica visual do .logo-mark do site, ampliada).
function roundedRectAlpha(px, py, cx, cy, halfW, halfH, radius) {
  const dx = Math.abs(px - cx) - (halfW - radius);
  const dy = Math.abs(py - cy) - (halfH - radius);
  let dist;
  if (dx > 0 && dy > 0) dist = Math.sqrt(dx * dx + dy * dy) - radius;
  else dist = Math.max(dx, dy) - radius;
  return Math.max(0, Math.min(1, 0.5 - dist));
}

// Monograma "TR" como bitmap em blocos (5x7 cada letra) — mesma ideia do favicon,
// sem precisar rasterizar fonte nenhuma.
const LETTER_T = [
  '11111',
  '00100',
  '00100',
  '00100',
  '00100',
  '00100',
  '00100',
];
const LETTER_R = [
  '11110',
  '10001',
  '10001',
  '11110',
  '10100',
  '10010',
  '10001',
];

function letterAlpha(bitmap, px, py, originX, originY, cell) {
  const col = Math.floor((px - originX) / cell);
  const row = Math.floor((py - originY) / cell);
  if (row < 0 || row >= bitmap.length || col < 0 || col >= bitmap[0].length) return 0;
  return bitmap[row][col] === '1' ? 1 : 0;
}

function buildPixels() {
  const buf = Buffer.alloc(W * H * 4);
  const cx = W / 2, cy = H / 2;
  const halfW = 180, halfH = 180, radius = 46;

  // Geometria do monograma: T e R, cada uma 5x7 células, célula de 18px,
  // com um espaço de 1 célula entre as duas letras — centralizado no quadrado.
  const cell = 18;
  const letterW = 5 * cell, letterH = 7 * cell, gap = cell;
  const monoW = letterW * 2 + gap;
  const monoOriginX = cx - monoW / 2;
  const monoOriginY = cy - letterH / 2;
  const rOriginX = monoOriginX + letterW + gap;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      // fundo sólido
      let r = BG[0], g = BG[1], b = BG[2];

      const alpha = roundedRectAlpha(x, y, cx, cy, halfW, halfH, radius);
      if (alpha > 0) {
        // gradiente diagonal (135deg, igual ao CSS: canto sup-esq -> inf-dir)
        const t = ((x - (cx - halfW)) / (halfW * 2) + (y - (cy - halfH)) / (halfH * 2)) / 2;
        const col = mix(G1, G2, Math.max(0, Math.min(1, t)));
        r = Math.round(r + (col[0] - r) * alpha);
        g = Math.round(g + (col[1] - g) * alpha);
        b = Math.round(b + (col[2] - b) * alpha);

        // monograma TR em cima do gradiente, cor escura (igual ao favicon)
        const tAlpha = letterAlpha(LETTER_T, x, y, monoOriginX, monoOriginY, cell);
        const rAlpha = letterAlpha(LETTER_R, x, y, rOriginX, monoOriginY, cell);
        const letterMix = Math.max(tAlpha, rAlpha) * alpha;
        if (letterMix > 0) {
          r = Math.round(r + (BG[0] - r) * letterMix);
          g = Math.round(g + (BG[1] - g) * letterMix);
          b = Math.round(b + (BG[2] - b) * letterMix);
        }
      }

      buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
    }
  }
  return buf;
}

// ── PNG encoder mínimo ──────────────────────────────────────────────────────
function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4); lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePng(pixels, w, h) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Cada linha precisa de 1 byte de filtro (0 = none) antes dos pixels.
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    pixels.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outPath = path.join(__dirname, 'assets', 'og-default.png');
fs.writeFileSync(outPath, encodePng(buildPixels(), W, H));
console.log(`[gerado] ${outPath} (${W}x${H})`);
