// node --test test/pseo-ddd.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { DDDS, dddDaUrl } from '../gerador-de-link-whatsapp/whatsapp.mjs';

const require = createRequire(import.meta.url);
const { paginas } = require('../pseo/ddd.js');
const { esc } = require('../pseo/_layout.js');
const dados = require('../pseo/dados/ddd.json');

const pags = paginas();
const hub = pags.find((p) => p.loc === '/ddd/');
const porDdd = new Map(pags.filter((p) => p !== hub).map((p) => [p.loc.slice(5, 7), p]));

const main = (html) => html.slice(html.indexOf('<main'), html.indexOf('</main>'));
const texto = (html) => main(html).replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[#a-z0-9]+;/gi, ' ');
const palavras = (html) => texto(html).split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length;
const titulo = (html) => /<title>([^<]*)<\/title>/.exec(html)[1];
const descricao = (html) => /<meta name="description" content="([^"]*)">/.exec(html)[1];
const linksDdd = (html) => [...main(html).matchAll(/href="\/ddd\/(\d\d)\/"/g)].map((m) => m[1]);
const cidadesNaPagina = (html) => [...html.matchAll(/<li data-busca="[^"]*">([^<]+)</g)].map((m) => m[1].trim().replace(/ \([A-Z]{2}\)$/, ''));

test('o hub e uma página por DDD, com caminhos válidos e únicos', () => {
  assert.ok(hub, 'hub /ddd/');
  assert.equal(pags.length, 68);
  assert.equal(porDdd.size, 67);
  const rels = new Set();
  for (const p of pags) {
    assert.match(p.rel, /^ddd\/(\d\d\/)?index\.html$/);
    assert.equal(p.loc, `/${p.rel.replace(/index\.html$/, '')}`);
    assert.match(p.lastmod, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(p.html.startsWith('<!doctype html>'));
    assert.ok(!rels.has(p.rel), p.rel);
    rels.add(p.rel);
  }
});

test('todo DDD da lista do gerador de WhatsApp tem página, e os dados têm só esses 67', () => {
  for (const d of DDDS) assert.ok(porDdd.has(d), `página do DDD ${d}`);
  assert.deepEqual(Object.keys(dados.ddds).sort(), [...DDDS].sort());
});

test('cada município aparece uma vez só, na página do seu DDD', () => {
  const vistos = new Map();
  for (const [ddd, x] of Object.entries(dados.ddds)) {
    for (const m of x.municipios) {
      assert.match(m.ibge, /^\d{7}$/);
      assert.ok(x.ufs.includes(m.uf), `${m.nome} ${m.uf} no DDD ${ddd}`);
      vistos.set(m.ibge, [...(vistos.get(m.ibge) || []), ddd]);
    }
    assert.deepEqual(cidadesNaPagina(porDdd.get(ddd).html), x.municipios.map((m) => esc(m.nome)), `lista completa no HTML do DDD ${ddd}`);
  }
  const repetidos = [...vistos].filter(([, d]) => d.length > 1);
  assert.deepEqual(repetidos, [], 'município listado em dois DDDs: conferir na Anatel e relatar');
  assert.ok(vistos.size >= 5570, `${vistos.size} municípios`);
});

test('com população do IBGE, a lista vai da maior cidade para a menor', () => {
  assert.ok(dados.fonte.ibge, 'fonte do IBGE nos dados');
  for (const [ddd, x] of Object.entries(dados.ddds)) {
    const pops = x.municipios.map((m) => m.pop);
    assert.ok(pops.every((p, i) => Number.isInteger(p) && (i === 0 || pops[i - 1] >= p)), `DDD ${ddd}`);
  }
  assert.equal(dados.ddds['11'].municipios[0].nome, 'São Paulo');
  assert.ok(porDdd.get('73').html.includes('tabela/6579'), 'cita a tabela do IBGE');
});

test('títulos e descrições únicos e dentro do limite; H1 com a palavra-chave', () => {
  const ts = new Set(), ds = new Set();
  for (const p of pags) {
    const t = titulo(p.html), d = descricao(p.html);
    assert.ok(t.length <= 60, `${t.length}: ${t}`);
    assert.ok(d.length <= 155, `${d.length}: ${d}`);
    assert.ok(!ts.has(t) && !ds.has(d), p.loc);
    ts.add(t); ds.add(d);
  }
  for (const [ddd, p] of porDdd) assert.ok(p.html.includes(`<h1>DDD ${ddd}: de onde é e quais cidades usam</h1>`), ddd);
  assert.match(hub.html, /<h1>[^<]*DDD[^<]*<\/h1>/);
});

test('nenhuma página fina: 350 palavras ou mais de texto próprio', () => {
  for (const p of pags) assert.ok(palavras(p.html) >= 350, `${p.loc}: ${palavras(p.html)} palavras`);
});

test('botão "Criar link do WhatsApp" abre o gerador com o DDD, e o gerador aceita', () => {
  for (const [ddd, p] of porDdd) {
    assert.ok(p.html.includes(`<a class="btn btn-primary" href="/gerador-de-link-whatsapp/?ddd=${ddd}">Criar link do WhatsApp com DDD ${ddd}</a>`), ddd);
    assert.equal(dddDaUrl(`?ddd=${ddd}`), ddd);
  }
});

test('links internos: hub, ferramenta, /ferramentas/ e 4 ou mais DDDs relacionados', () => {
  for (const [ddd, p] of porDdd) {
    const m = main(p.html);
    assert.ok(m.includes('href="/ddd/"') && m.includes('href="/ferramentas/"'), ddd);
    const outros = new Set(linksDdd(p.html).filter((d) => d !== ddd));
    assert.ok(outros.size >= 4, `DDD ${ddd}: ${outros.size} relacionados`);
    for (const d of outros) assert.ok(porDdd.has(d), `DDD ${ddd} aponta para ${d}`);
    const mesmoEstado = Object.keys(dados.ddds).filter((d) => d !== ddd && dados.ddds[d].ufs.some((u) => dados.ddds[ddd].ufs.includes(u)));
    for (const d of mesmoEstado) assert.ok(outros.has(d), `DDD ${ddd} liga o ${d}, do mesmo estado`);
  }
  assert.deepEqual([...new Set(linksDdd(hub.html))].sort(), [...DDDS].sort(), 'hub liga os 67');
});

test('discagem e mudanças vêm das fontes da Anatel, com data', () => {
  for (const [ddd, p] of porDdd) {
    assert.match(texto(p.html), /desde \d\d\/\d\d\/2026/i, `data da nova área local no DDD ${ddd}`);
    assert.ok(p.html.includes(`0 + operadora + ${ddd} + número`) || p.html.includes(`<span>${ddd}</span>`), ddd);
    assert.ok(p.html.includes(esc(dados.fonte.anatel.url)) && p.html.includes('7c51a53e26edf77426cb85e42f1080de'), ddd);
  }
  assert.ok(dados.mudancas.length > 0);
  for (const m of dados.mudancas) {
    for (const d of [m.de, m.para].filter(Boolean)) {
      assert.ok(porDdd.get(d).html.includes(esc(m.nome)), `${m.nome} na página do DDD ${d}`);
    }
  }
  const saubara = texto(porDdd.get('71').html);
  assert.match(saubara, /Saubara/);
  assert.match(saubara, /02\/09\/2012/);
});

test('dado vindo do JSON sai escapado, inclusive no JSON-LD', () => {
  const falso = structuredClone(dados);
  const ruim = `<script>alert("x")</script> D'Oeste`;
  falso.ddds['73'].municipios[0].nome = ruim;
  falso.estados.BA = 'Bahia <b>"x"</b>';
  const html = paginas(falso).find((p) => p.loc === '/ddd/73/').html;
  assert.ok(!html.includes('<script>alert'), 'sem <script> cru');
  assert.ok(!html.includes('<b>"x"</b>'), 'sem tag crua do estado');
  assert.ok(html.includes(esc(ruim)), 'nome escapado no HTML');
  for (const ld of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    assert.doesNotThrow(() => JSON.parse(ld[1]));
  }
});
