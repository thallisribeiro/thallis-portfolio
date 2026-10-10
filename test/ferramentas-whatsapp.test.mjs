// node --test test/ferramentas-whatsapp.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DDDS, normalizePhone, formatPhone, buildLink, buttonSnippet, ERROS } from '../gerador-de-link-whatsapp/whatsapp.mjs';

test('DDDs: os 67 códigos nacionais da Anatel, nenhum a mais', () => {
  assert.equal(DDDS.size, 67);
  for (const d of ['11', '19', '21', '24', '27', '28', '38', '49', '55', '61', '69', '73', '79', '89', '99']) assert.ok(DDDS.has(d), d);
  for (const d of ['10', '20', '23', '25', '26', '29', '30', '36', '39', '40', '50', '52', '56', '57', '58', '59', '60', '70', '72', '76', '78', '80', '90']) assert.ok(!DDDS.has(d), d);
});

const ok = [
  // [entrada, país padrão, dígitos esperados, tipo]
  ['+55 (73) 98889-9345', '55', '5573988899345', 'celular'],
  ['73988899345', '55', '5573988899345', 'celular'],
  ['5573988899345', '55', '5573988899345', 'celular'],
  ['0xx73988899345', '55', '5573988899345', 'celular'],
  ['0xx73 98889-9345', '55', '5573988899345', 'celular'],
  ['0 15 73 98889-9345', '55', '5573988899345', 'celular'], // 0 + código de operadora
  ['0055 73 98889-9345', '55', '5573988899345', 'celular'],
  ['  (73)98889.9345  ', '55', '5573988899345', 'celular'],
  ['(73) 3281-1234', '55', '557332811234', 'fixo'],
  ['557332811234', '55', '557332811234', 'fixo'],
  ['(11) 9123-4567', '55', '551191234567', 'fixo'], // 8 dígitos = formato de fixo, aceito com aviso
  ['(55) 99123-4567', '55', '5555991234567', 'celular'], // DDD 55 (RS) sem código do país
  ['+55 55 99123-4567', '55', '5555991234567', 'celular'],
  ['5555991234567', '55', '5555991234567', 'celular'],
  ['415 555 2671', '1', '14155552671', 'internacional'],
  ['+1 (415) 555-2671', '55', '14155552671', 'internacional'], // + vence o país escolhido
  ['07911 123456', '44', '447911123456', 'internacional'], // zero de tronco some
  ['912 345 678', '351', '351912345678', 'internacional'],
];
for (const [raw, pais, digits, tipo] of ok) {
  test(`normalizePhone aceita ${JSON.stringify(raw)} (país ${pais})`, () => {
    assert.deepEqual(normalizePhone(raw, pais), { ok: true, digits, tipo });
  });
}

const ruins = [
  ['', '55', 'vazio'],
  ['   ', '55', 'vazio'],
  [null, '55', 'vazio'],
  ['(20) 98889-9345', '55', 'ddd'],
  ['(23) 98889-9345', '55', 'ddd'],
  ['(52) 3281-1234', '55', 'ddd'],
  ['(90) 98889-9345', '55', 'ddd'],
  ['+55 (10) 98889-9345', '55', 'ddd'],
  ['(73) 88889-9345', '55', 'celular'], // 9 dígitos sem começar com 9
  ['(73) 38889-9345', '55', 'celular'],
  ['98889-9345', '55', 'sem_ddd'],
  ['3281-1234', '55', 'sem_ddd'],
  ['123', '55', 'tamanho'],
  ['739888993451', '55', 'tamanho'], // 12 dígitos sem 55 na frente
  ['55739888993451', '55', 'tamanho'],
  ['+1 23', '55', 'internacional'],
  ['12', '1', 'internacional'],
  ['+1234567890123456', '55', 'internacional'], // 16 dígitos, acima do E.164
];
for (const [raw, pais, error] of ruins) {
  test(`normalizePhone recusa ${JSON.stringify(raw)} com "${error}"`, () => {
    assert.deepEqual(normalizePhone(raw, pais), { ok: false, error });
    assert.ok(ERROS[error], 'todo código de erro tem mensagem em português');
  });
}

test('mensagens de erro em português simples', () => {
  assert.match(ERROS.ddd, /Esse DDD não existe/);
  assert.match(ERROS.celular, /Celular tem 9 dígitos começando com 9/);
});

test('país padrão é o Brasil', () => {
  assert.deepEqual(normalizePhone('73988899345'), { ok: true, digits: '5573988899345', tipo: 'celular' });
});

test('formatPhone mostra o número como a pessoa reconhece', () => {
  assert.equal(formatPhone('5573988899345'), '+55 (73) 98889-9345');
  assert.equal(formatPhone('557332811234'), '+55 (73) 3281-1234');
  assert.equal(formatPhone('14155552671'), '+14155552671');
});

const P = '5573988899345';
const textoDe = (link) => new URL(link).searchParams.get('text');

test('buildLink sem mensagem não leva ?text', () => {
  assert.equal(buildLink(P, ''), 'https://wa.me/5573988899345');
  assert.equal(buildLink(P), 'https://wa.me/5573988899345');
  assert.equal(buildLink(P, '  \n '), 'https://wa.me/5573988899345');
});

test('buildLink codifica acento, vírgula e espaço', () => {
  assert.equal(buildLink(P, 'Olá, quero um orçamento'), 'https://wa.me/5573988899345?text=Ol%C3%A1%2C%20quero%20um%20or%C3%A7amento');
});

test('buildLink codifica emoji em UTF-8', () => {
  assert.equal(buildLink(P, '👍'), 'https://wa.me/5573988899345?text=%F0%9F%91%8D');
});

test('buildLink: quebra de linha vira %0A (inclusive \\r\\n do Windows)', () => {
  assert.equal(buildLink(P, 'Linha 1\nLinha 2'), 'https://wa.me/5573988899345?text=Linha%201%0ALinha%202');
  assert.equal(buildLink(P, 'Linha 1\r\nLinha 2'), 'https://wa.me/5573988899345?text=Linha%201%0ALinha%202');
});

test('buildLink: &, #, ?, +, % e = não quebram o link', () => {
  assert.equal(buildLink(P, 'a & b # c ? d'), 'https://wa.me/5573988899345?text=a%20%26%20b%20%23%20c%20%3F%20d');
  assert.equal(buildLink(P, '50% + R$ 10 = ok'), 'https://wa.me/5573988899345?text=50%25%20%2B%20R%24%2010%20%3D%20ok');
});

test('buildLink: o texto volta idêntico ao decodificar', () => {
  for (const m of ['Olá! Vi seu site 😀\nQuero pedir: 2x pizza & 1 refri #promo ? 50%+', "Pode ser às 14h? D'Ajuda", 'çãõéíú ÇÃÕ ñ 🇧🇷 👨‍👩‍👧']) {
    assert.equal(textoDe(buildLink(P, m)), m);
  }
});

test('buildLink recusa telefone que não é só dígito', () => {
  for (const ruim of ['', 'abc', '55 73 98889', '+5573988899345', '0573988899345', '1234567', '1234567890123456', 'javascript:alert(1)']) {
    assert.throws(() => buildLink(ruim, 'oi'), TypeError, ruim);
  }
});

const LINK = buildLink(P, "Olá, D'Ajuda");

test('buttonSnippet: rótulo com <script> fica texto', () => {
  for (const estilo of ['inline', 'flutuante']) {
    const html = buttonSnippet(LINK, '<script>alert(1)</script>', estilo);
    assert.ok(!html.includes('<script'), estilo);
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), estilo);
  }
});

test('buttonSnippet: aspas no rótulo não fecham o atributo', () => {
  const html = buttonSnippet(LINK, 'Fale "já" \' agora', 'flutuante');
  assert.ok(html.includes('aria-label="Fale &quot;já&quot; &#39; agora"'));
});

test('buttonSnippet: apóstrofo que o encodeURIComponent deixa passar sai escapado no href', () => {
  const html = buttonSnippet(LINK, 'Fale no WhatsApp', 'inline');
  assert.ok(html.includes('href="https://wa.me/5573988899345?text=Ol%C3%A1%2C%20D&#39;Ajuda"'));
});

test('buttonSnippet inline: botão com texto, ícone SVG inline, abre em nova aba', () => {
  const html = buttonSnippet(LINK, 'Pedir orçamento', 'inline');
  assert.match(html, /^<a href="https:\/\/wa\.me\//);
  assert.ok(html.includes('>Pedir orçamento</a>'));
  assert.ok(html.includes('target="_blank" rel="noopener"'));
  assert.ok(html.includes('<svg') && html.includes('aria-hidden="true"'));
  assert.ok(!/<img|src=|url\(/.test(html), 'sem imagem externa');
  assert.ok(!html.includes('position:fixed'));
});

test('buttonSnippet flutuante: canto inferior direito, nome acessível', () => {
  const html = buttonSnippet(LINK, 'Pedir orçamento', 'flutuante');
  assert.ok(html.includes('position:fixed') && html.includes('right:') && html.includes('bottom:'));
  assert.ok(html.includes('aria-label="Pedir orçamento"'));
  assert.ok(!/<img|src=|url\(/.test(html), 'sem imagem externa');
});

test('buttonSnippet: rótulo vazio usa o padrão', () => {
  assert.ok(buttonSnippet(LINK, '   ', 'inline').includes('>Fale no WhatsApp</a>'));
});

test('buttonSnippet recusa link que não é do wa.me', () => {
  for (const ruim of ['javascript:alert(1)', 'https://evil.com/?https://wa.me/55', 'https://wa.me/55" onclick="x', 'http://wa.me/5573988899345']) {
    assert.throws(() => buttonSnippet(ruim, 'x', 'inline'), TypeError, ruim);
  }
});
