// node --test test/ferramentas-cardapio.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  parsePrice, formatPrice, validateMenu, encodeMenu, decodeMenu, qrLevel,
  whatsappUrl, instagramUrl, LIMITES, QR_LIMITE_M, QR_LIMITE_IMPRESSAO, QR_LIMITE_MAX,
} from '../cardapio-digital/cardapio.mjs';

const qrcode = createRequire(import.meta.url)('../assets/ferramentas/qrcode.js');

const base = () => ({
  nome: 'Sabor da Vila',
  frase: 'Comida baiana feita na hora',
  whatsapp: '73988899345',
  instagram: 'sabordavila',
  endereco: 'Rua da Praia, 100',
  horario: 'Ter a dom, 11h às 22h',
  tema: 'praia',
  secoes: [
    { nome: 'Entradas', itens: [
      { nome: 'Pastel de queijo', desc: 'Seis unidades', preco: 1800, selos: ['vegetariano'] },
      { nome: 'Bolinho de aipim', desc: '', preco: 3200, selos: [] },
    ] },
    { nome: 'Bebidas', itens: [{ nome: 'Água de coco', desc: '', preco: 800, selos: ['vegano', 'sem-gluten'] }] },
  ],
});

// ---------- preço ----------

test('parsePrice: formatos aceitos', () => {
  const casos = [
    ['R$ 1.234,50', 123450], ['25', 2500], ['25,9', 2590], ['25,90', 2590],
    ['1.234,50', 123450], ['  R$25,00 ', 2500], ['r$ 7', 700], ['R$ 18,00', 1800],
    ['1234,5', 123450], ['0', 0], ['0,05', 5], ['1.234', 123400], ['25.90', 2590],
    ['25.9', 2590], ['99.999,99', 9999999], ['12.345.678', null],
  ];
  for (const [entrada, esperado] of casos) assert.equal(parsePrice(entrada), esperado, entrada);
});

test('parsePrice: lixo vira null', () => {
  for (const lixo of ['', '   ', 'abc', 'R$', '25,999', '1,2,3', '-5', '12.34.5', '1.23,00',
    '25,', ',50', '1e3', 'Infinity', 'NaN', '25 reais', '100.000,00', '0x10', null, undefined, 25, {}]) {
    assert.equal(parsePrice(lixo), null, String(lixo));
  }
});

test('formatPrice: centavos em pt-BR', () => {
  assert.equal(formatPrice(2590), 'R$ 25,90');
  assert.equal(formatPrice(123450), 'R$ 1.234,50');
  assert.equal(formatPrice(0), 'R$ 0,00');
  assert.equal(formatPrice(5), 'R$ 0,05');
  assert.equal(formatPrice(9999999), 'R$ 99.999,99');
  for (const c of [0, 1, 99, 100, 2590, 123450, 9999999]) assert.equal(parsePrice(formatPrice(c)), c);
});

// ---------- validação ----------

test('validateMenu: rejeita o que não é cardápio', () => {
  for (const x of [null, undefined, 'x', 42, [], [base()], { nome: '' }, { nome: '   ' }, { secoes: [] }]) {
    assert.equal(validateMenu(x), null, JSON.stringify(x));
  }
});

test('validateMenu: devolve só campos conhecidos, aparados', () => {
  const sujo = { ...base(), nome: '  Sabor da Vila  ', onload: 'x', __proto__: { admin: true } };
  sujo.secoes[0].itens[0].extra = '<b>';
  const m = validateMenu(sujo);
  assert.deepEqual(Object.keys(m), ['nome', 'frase', 'whatsapp', 'instagram', 'endereco', 'horario', 'tema', 'secoes']);
  assert.deepEqual(Object.keys(m.secoes[0].itens[0]), ['nome', 'desc', 'preco', 'selos']);
  assert.equal(m.nome, 'Sabor da Vila');
  assert.equal(m.admin, undefined);
  assert.equal(Object.getPrototypeOf(m), Object.prototype);
});

test('validateMenu: XSS fica texto puro, sem escape nem perda', () => {
  const xss = '<img src=x onerror=alert(1)>';
  const m = validateMenu({ ...base(), nome: xss, frase: '"><script>alert(1)</script>' });
  assert.equal(m.nome, xss);
  assert.equal(m.frase, '"><script>alert(1)</script>');
});

test('validateMenu: limites de tamanho e caracteres de controle', () => {
  const m = validateMenu({ ...base(), nome: 'a'.repeat(500), frase: 'x\u0000y\u001b[31mz', endereco: 'b'.repeat(500) });
  assert.equal(m.nome.length, LIMITES.nome);
  assert.equal(m.endereco.length, LIMITES.endereco);
  assert.equal(m.frase, 'x y [31mz');
  // corte não parte emoji ao meio
  const e = validateMenu({ ...base(), nome: '🍕'.repeat(100) });
  assert.equal([...e.nome].length, LIMITES.nome);
  assert.ok(!/[\ud800-\udbff](?![\udc00-\udfff])/.test(e.nome));
});

test('validateMenu: WhatsApp só dígitos, 10 a 13', () => {
  const w = (v) => validateMenu({ ...base(), whatsapp: v }).whatsapp;
  assert.equal(w('(73) 98889-9345'), '73988899345');
  assert.equal(w('+55 73 98889-9345'), '5573988899345');
  assert.equal(w('7332881234'), '7332881234');
  assert.equal(w('123'), '');
  assert.equal(w('12345678901234'), '');
  assert.equal(w(73988899345), '');
});

test('validateMenu: Instagram', () => {
  const i = (v) => validateMenu({ ...base(), instagram: v }).instagram;
  assert.equal(i('@sabor.da_vila'), 'sabor.da_vila');
  assert.equal(i('https://www.instagram.com/sabordavila/?hl=pt'), 'sabordavila');
  assert.equal(i('instagram.com/sabor'), 'sabor');
  assert.equal(i('bad handle!'), '');
  assert.equal(i('a'.repeat(31)), '');
  assert.equal(i('javascript:alert(1)'), '');
});

test('validateMenu: tema da lista fixa', () => {
  assert.equal(validateMenu({ ...base(), tema: 'escuro' }).tema, 'escuro');
  assert.equal(validateMenu({ ...base(), tema: 'neon' }).tema, 'classico');
  assert.equal(validateMenu({ ...base(), tema: undefined }).tema, 'classico');
});

test('validateMenu: no máximo 12 seções e 150 itens', () => {
  const secoes = Array.from({ length: 20 }, (_, s) => ({
    nome: 'Seção ' + s,
    itens: Array.from({ length: 20 }, (_, i) => ({ nome: `Item ${s}-${i}`, preco: 100 })),
  }));
  const m = validateMenu({ ...base(), secoes });
  assert.equal(m.secoes.length, LIMITES.secoes);
  assert.equal(m.secoes.reduce((n, s) => n + s.itens.length, 0), LIMITES.itens);
  assert.equal(m.secoes[7].itens.length, 10);
  assert.equal(m.secoes[8].itens.length, 0);
});

test('validateMenu: preço, selos e itens sem nome', () => {
  const m = validateMenu({ ...base(), secoes: [{ nome: 'A', itens: [
    { nome: 'ok', preco: 2590, selos: ['vegano', 'vegano', 'radioativo', 'picante'] },
    { nome: 'neg', preco: -1 }, { nome: 'frac', preco: 2.5 }, { nome: 'texto', preco: '2590' },
    { nome: 'enorme', preco: 1e9 }, { nome: '   ', preco: 100 }, 'lixo', null,
  ] }, { nome: '', itens: [{ nome: 'órfão' }] }, { nome: 'B', itens: 'x' }] });
  assert.equal(m.secoes.length, 2);
  const [ok, ...resto] = m.secoes[0].itens;
  assert.deepEqual(ok, { nome: 'ok', desc: '', preco: 2590, selos: ['vegano', 'picante'] });
  assert.deepEqual(resto.map((i) => i.preco), [null, null, null, null]);
  assert.equal(resto.length, 4);
  assert.deepEqual(m.secoes[1], { nome: 'B', itens: [] });
});

test('validateMenu rascunho: guarda campos ainda vazios do editor', () => {
  const r = validateMenu({ nome: '', secoes: [{ nome: '', itens: [{ nome: '', preco: null }] }] }, { rascunho: true });
  assert.equal(r.nome, '');
  assert.equal(r.secoes.length, 1);
  assert.equal(r.secoes[0].itens.length, 1);
  assert.equal(validateMenu('x', { rascunho: true }), null);
});

// ---------- link ----------

test('encode/decode: ida e volta com acento e emoji', async () => {
  const m = validateMenu({ ...base(), nome: 'Açaí do Zé 🍧', frase: 'Pão, maçã, coração — “aspas” ½ ✓' });
  const codigo = await encodeMenu(m);
  assert.match(codigo, /^v1\.[A-Za-z0-9_-]+$/);
  assert.deepEqual(await decodeMenu(codigo), m);
  assert.deepEqual(await decodeMenu('#' + codigo), m, 'aceita o # do location.hash');
});

test('encode/decode: XSS volta como texto igual', async () => {
  const xss = { ...base(), nome: '<script>alert(1)</script>' };
  xss.secoes[0].itens[0].desc = '<img src=x onerror="alert(document.cookie)">';
  const m = await decodeMenu(await encodeMenu(xss));
  assert.equal(m.nome, '<script>alert(1)</script>');
  assert.equal(m.secoes[0].itens[0].desc, '<img src=x onerror="alert(document.cookie)">');
});

test('encode/decode: cardápio de 150 itens', async () => {
  const secoes = Array.from({ length: 10 }, (_, s) => ({
    nome: 'Seção ' + s,
    itens: Array.from({ length: 15 }, (_, i) => ({ nome: `Prato ${s}.${i} à moda`, desc: 'Com arroz e feijão', preco: 1000 + i, selos: ['picante'] })),
  }));
  const m = validateMenu({ ...base(), secoes });
  const codigo = await encodeMenu(m);
  assert.deepEqual(await decodeMenu(codigo), m);
  assert.equal((await decodeMenu(codigo)).secoes.flatMap((s) => s.itens).length, 150);
});

test('encode: formato compacto, sem nomes de campo', async () => {
  const m = validateMenu({ nome: 'X', tema: 'praia', secoes: [{ nome: 'A', itens: [{ nome: 'b', preco: 990, selos: ['vegano', 'picante'] }] }] });
  const codigo = await semCompressao(() => encodeMenu(m));
  assert.equal(Buffer.from(codigo.slice(3), 'base64url').toString(), '["X","","","","","",2,[["A",[["b","",990,10]]]]]');
});

test('encode: rejeita cardápio inválido', async () => {
  await assert.rejects(encodeMenu({ nome: '' }));
});

async function semCompressao(fn) {
  const guardado = globalThis.CompressionStream;
  delete globalThis.CompressionStream;
  try { return await fn(); } finally { globalThis.CompressionStream = guardado; }
}

test('encode sem CompressionStream: cai para v0 e decodifica', async () => {
  const m = validateMenu({ ...base(), nome: 'Café ☕' });
  const codigo = await semCompressao(() => encodeMenu(m));
  assert.match(codigo, /^v0\.[A-Za-z0-9_-]+$/);
  assert.deepEqual(await decodeMenu(codigo), m);
});

test('encode com CompressionStream sem deflate-raw (Chrome < 103): cai para v0', async () => {
  const guardado = globalThis.CompressionStream;
  globalThis.CompressionStream = class { constructor(f) { throw new TypeError('formato não suportado: ' + f); } };
  try {
    const m = validateMenu(base());
    const codigo = await encodeMenu(m);
    assert.match(codigo, /^v0\./);
    assert.deepEqual(await decodeMenu(codigo), m);
  } finally { globalThis.CompressionStream = guardado; }
});

test('decode v1 sem DecompressionStream: null, sem exceção', async () => {
  const codigo = await encodeMenu(validateMenu(base()));
  const guardado = globalThis.DecompressionStream;
  delete globalThis.DecompressionStream;
  try { assert.equal(await decodeMenu(codigo), null); } finally { globalThis.DecompressionStream = guardado; }
});

const b64 = (s) => Buffer.from(s).toString('base64url');

test('decode: lixo vira null', async () => {
  for (const lixo of [null, undefined, 42, '', '#', 'abc', 'v1.', 'v0.', 'v1.!!!!', 'v1.AAAA', 'v2.' + b64('{}'),
    'v0.' + b64('não é json'), 'v0.' + b64('[1,2]'), 'v0.' + b64('[""]'), 'v0.' + b64('{"nome":"objeto não é o formato"}'), 'v0.' + b64('null'),
    'v0.%7B%7D', 'v1.' + 'A'.repeat(30000)]) {
    assert.equal(await decodeMenu(lixo), null, String(lixo).slice(0, 40));
  }
});

test('decode: lista hostil sai saneada', async () => {
  const m = await decodeMenu('v0.' + b64('["X",0,["7"],{},0,0,"__proto__",[["A",[["b",0,"25",{}],"c",null]],7,null,["B","x"]]]'));
  assert.deepEqual(m, {
    nome: 'X', frase: '', whatsapp: '', instagram: '', endereco: '', horario: '', tema: 'classico',
    secoes: [{ nome: 'A', itens: [{ nome: 'b', desc: '', preco: null, selos: [] }] }, { nome: 'B', itens: [] }],
  });
});

test('decode: link cortado vira null', async () => {
  const m = validateMenu(base());
  const v1 = await encodeMenu(m);
  const v0 = await semCompressao(() => encodeMenu(m));
  for (const codigo of [v1, v0]) {
    for (const corte of [4, 10, Math.floor(codigo.length / 2), codigo.length - 3, codigo.length - 1]) {
      assert.equal(await decodeMenu(codigo.slice(0, corte)), null, `${codigo.slice(0, 2)} cortado em ${corte}`);
    }
  }
});

test('decode: bomba de compressão é recusada', async () => {
  const json = '{"nome":"x","frase":"' + ' '.repeat(3_000_000) + '"}';
  const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  const codigo = 'v1.' + Buffer.from(bytes).toString('base64url');
  assert.ok(codigo.length < 20000, 'cabe num link');
  assert.equal(await decodeMenu(codigo), null);
});

// ---------- QR ----------

test('qrLevel: limiares', () => {
  const url = (n) => 'x'.repeat(n);
  assert.deepEqual(qrLevel(url(100)), { level: 'M', tooLong: false, fits: true });
  assert.deepEqual(qrLevel(url(QR_LIMITE_M)), { level: 'M', tooLong: false, fits: true });
  assert.deepEqual(qrLevel(url(QR_LIMITE_M + 1)), { level: 'L', tooLong: false, fits: true });
  assert.deepEqual(qrLevel(url(QR_LIMITE_IMPRESSAO)), { level: 'L', tooLong: false, fits: true });
  assert.deepEqual(qrLevel(url(QR_LIMITE_IMPRESSAO + 1)), { level: 'L', tooLong: true, fits: true });
  assert.deepEqual(qrLevel(url(QR_LIMITE_MAX)), { level: 'L', tooLong: true, fits: true });
  assert.deepEqual(qrLevel(url(QR_LIMITE_MAX + 1)), { level: 'L', tooLong: true, fits: false });
});

test('qrLevel: limiares batem com a biblioteca de QR vendorizada', () => {
  const versao = (n, nivel) => { const q = qrcode(0, nivel); q.addData('x'.repeat(n)); q.make(); return (q.getModuleCount() - 17) / 4; };
  assert.equal(versao(QR_LIMITE_M, 'M'), 20);
  assert.equal(versao(QR_LIMITE_M + 1, 'M'), 21);
  assert.equal(versao(QR_LIMITE_IMPRESSAO, 'L'), 25);
  assert.equal(versao(QR_LIMITE_IMPRESSAO + 1, 'L'), 26);
  assert.equal(versao(QR_LIMITE_MAX, 'L'), 40);
  assert.throws(() => versao(QR_LIMITE_MAX + 1, 'L'));
});

test('links de contato montados só com valor validado', () => {
  assert.equal(whatsappUrl('73988899345'), 'https://wa.me/5573988899345');
  assert.equal(whatsappUrl('5573988899345'), 'https://wa.me/5573988899345');
  assert.equal(whatsappUrl('73988899345', 'Olá! Vi o cardápio'), 'https://wa.me/5573988899345?text=Ol%C3%A1!%20Vi%20o%20card%C3%A1pio');
  assert.equal(whatsappUrl('123'), null);
  assert.equal(whatsappUrl('javascript:alert(1)'), null);
  assert.equal(instagramUrl('sabor.da_vila'), 'https://www.instagram.com/sabor.da_vila/');
  assert.equal(instagramUrl('a/b'), null);
  assert.equal(instagramUrl(''), null);
});
