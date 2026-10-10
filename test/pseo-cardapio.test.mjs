// node --test test/pseo-cardapio.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { validateMenu, encodeMenu, qrLevel } from '../cardapio-digital/cardapio.mjs';

const require = createRequire(import.meta.url);
const { paginas, lerDados } = require('../pseo/cardapio.js');

const dados = lerDados();
const todas = paginas();
const HUB = '/cardapio-digital-para/';
const porLoc = new Map(todas.map((p) => [p.loc, p]));
const doTipo = (slug) => porLoc.get(`${HUB}${slug}/`);
const clone = (x) => JSON.parse(JSON.stringify(x));

const entidades = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" };
const semTags = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => entidades[e]).replace(/\s+/g, ' ').trim();
const meio = (html) => html.slice(html.indexOf('<main'), html.indexOf('</main>'));
const tag = (html, nome) => (html.match(new RegExp(`<${nome}>([^<]*)</${nome}>`)) || [])[1];
const meta = (html) => (html.match(/<meta name="description" content="([^"]*)">/) || [])[1];
const desesc = (s) => s.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => entidades[e]);

test('paginas(): hub + uma por tipo, caminhos válidos e únicos', () => {
  assert.equal(dados.tipos.length, 20);
  assert.equal(todas.length, dados.tipos.length + 1);
  assert.ok(porLoc.has(HUB));
  for (const t of dados.tipos) assert.ok(doTipo(t.slug), t.slug);
  assert.equal(new Set(todas.map((p) => p.rel)).size, todas.length);
  for (const p of todas) {
    assert.match(p.rel, /^cardapio-digital-para\/([a-z0-9-]+\/)?index\.html$/);
    assert.equal(p.loc, `/${p.rel.replace(/index\.html$/, '')}`);
    assert.match(p.lastmod, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(p.html.startsWith('<!doctype html>'));
    assert.match(p.html, /data-page-ev="pseo_cardapio_viewed"/);
  }
});

test('título ≤ 60, descrição ≤ 155, únicos; H1 com a palavra-chave', () => {
  const titulos = new Set(), descricoes = new Set();
  for (const p of todas) {
    const t = desesc(tag(p.html, 'title')), d = desesc(meta(p.html));
    assert.ok(t.length <= 60, `${p.loc}: título com ${t.length}: ${t}`);
    assert.ok(d.length > 70 && d.length <= 155, `${p.loc}: descrição com ${d.length}`);
    titulos.add(t);
    descricoes.add(d);
    assert.equal((p.html.match(/<h1[ >]/g) || []).length, 1, p.loc);
  }
  assert.equal(titulos.size, todas.length);
  assert.equal(descricoes.size, todas.length);
  for (const t of dados.tipos) {
    assert.equal(desesc(tag(doTipo(t.slug).html, 'h1')), `Cardápio digital para ${t.tipo}`);
    assert.match(desesc(tag(doTipo(t.slug).html, 'title')), new RegExp(`^Cardápio digital para ${t.tipo}`));
  }
  assert.match(desesc(tag(porLoc.get(HUB).html, 'h1')), /^Cardápio digital para/);
});

test('cada página tem ≥ 350 palavras de texto próprio (sem layout e sem o que se repete)', () => {
  // Pedaços de texto do <main> (sem a oferta). O que aparece em mais de uma página não conta.
  const pedacos = new Map(todas.map((p) => [p.loc, meio(p.html)
    .replace(/<aside class="pseo-oferta"[\s\S]*?<\/aside>/, '')
    .split(/<\/(?:p|li|h\d|summary|a|span|div)>/).map(semTags).filter(Boolean)]));
  const emQuantas = new Map();
  for (const lista of pedacos.values()) for (const x of new Set(lista)) emQuantas.set(x, (emQuantas.get(x) || 0) + 1);
  for (const [loc, lista] of pedacos) {
    const palavras = lista.filter((x) => emQuantas.get(x) === 1).join(' ').split(/\s+/).length;
    assert.ok(palavras >= 350, `${loc}: só ${palavras} palavras próprias`);
  }
});

test('modelos.json: um modelo por tipo, válido no validateMenu, sem perder nada, preço em branco', () => {
  assert.deepEqual(Object.keys(dados.modelos).sort(), dados.tipos.map((t) => t.slug).sort());
  for (const [slug, bruto] of Object.entries(dados.modelos)) {
    const m = validateMenu(bruto);
    assert.ok(m, slug);
    for (const campo of ['nome', 'frase', 'horario', 'tema']) assert.equal(m[campo], bruto[campo] ?? (campo === 'tema' ? 'classico' : ''), `${slug}.${campo}`);
    assert.deepEqual(
      m.secoes.map((s) => [s.nome, s.itens.map((i) => [i.nome, i.desc, i.preco, i.selos])]),
      bruto.secoes.map((s) => [s.nome, s.itens.map((i) => [i.nome, i.desc ?? '', null, i.selos ?? []])]),
      `${slug}: validateMenu cortou ou mudou algo`,
    );
  }
});

test('modelos.json: cada modelo cabe num QR imprimível, mesmo com WhatsApp, Instagram e endereço', async () => {
  const contatos = { whatsapp: '73988887777', instagram: 'nome_do_negocio_aqui', endereco: 'Rua das Flores, 1234, Centro, Porto Seguro - BA', horario: 'Ter a dom, 11h às 23h' };
  for (const [slug, bruto] of Object.entries(dados.modelos)) {
    for (const m of [bruto, { ...bruto, ...contatos }]) {
      const url = 'https://thallisribeiro.com.br/cardapio-digital/ver/#' + await encodeMenu(m);
      const q = qrLevel(url);
      assert.ok(q.fits && !q.tooLong, `${slug}: link com ${url.length} caracteres`);
    }
  }
});

test('a página mostra o mesmo modelo que a ferramenta carrega', () => {
  // A ferramenta busca modelos.json ao lado do editor; o módulo lê o mesmo arquivo do disco.
  assert.match(readFileSync(new URL('../cardapio-digital/editor.mjs', import.meta.url), 'utf8'), /new URL\('modelos\.json', import\.meta\.url\)/);
  const doDisco = JSON.parse(readFileSync(new URL('../cardapio-digital/modelos.json', import.meta.url), 'utf8'));
  assert.deepEqual(dados.modelos, doDisco);
  const ROTULO = { vegetariano: 'Vegetariano', vegano: 'Vegano', 'sem-gluten': 'Sem glúten', picante: 'Picante' };
  for (const t of dados.tipos) {
    const html = doTipo(t.slug).html;
    const bloco = html.slice(html.indexOf('<div class="cdp-menu"'), html.indexOf('<!-- /modelo -->'));
    assert.ok(bloco.length > 100, t.slug);
    const m = doDisco[t.slug];
    const esperado = [m.nome, ...m.secoes.flatMap((s) => [s.nome, ...s.itens.flatMap((i) => [i.nome, i.desc || '', ...(i.selos || []).map((x) => ROTULO[x])])])].filter(Boolean);
    const visto = semTags(bloco.replace(/></g, '> <'));
    let desde = 0;
    for (const x of esperado) { // na mesma ordem do modelo
      const k = visto.indexOf(x, desde);
      assert.ok(k >= 0, `${t.slug}: "${x}" não aparece (na ordem) no modelo da página`);
      desde = k + x.length;
    }
    // "defina seu preço" em todo item que leva preço; sabor pago pelo tamanho e aviso (semPreco) ficam sem.
    const comPreco = m.secoes.reduce((n, s) => n + (s.semPreco ? 0 : s.itens.filter((i) => !i.semPreco).length), 0);
    assert.ok(comPreco > 0, t.slug);
    assert.equal((bloco.match(/defina seu preço/g) || []).length, comPreco, `${t.slug}: preço em branco nos itens com preço`);
    assert.ok(!/R\$\s*\d/.test(bloco), `${t.slug}: modelo não traz preço`);
  }
});

test('"Usar este modelo" abre a ferramenta com ?modelo=<slug>', () => {
  for (const t of dados.tipos) {
    const links = [...doTipo(t.slug).html.matchAll(/<a [^>]*href="([^"]*)"[^>]*>Usar este modelo<\/a>/g)].map((x) => x[1]);
    assert.ok(links.length >= 1, t.slug);
    for (const href of links) assert.equal(href, `/cardapio-digital/?modelo=${t.slug}`);
    assert.match(t.slug, /^[a-z0-9-]+$/);
  }
});

test('links internos: hub ↔ páginas, 4 a 6 irmãs, ferramenta e /ferramentas/', () => {
  const hub = porLoc.get(HUB).html;
  const slugs = new Set(dados.tipos.map((t) => t.slug));
  for (const t of dados.tipos) {
    assert.ok(hub.includes(`href="${HUB}${t.slug}/"`), `hub sem link para ${t.slug}`);
    const html = doTipo(t.slug).html;
    assert.ok(t.relacionados.length >= 4 && t.relacionados.length <= 6, t.slug);
    assert.ok(!t.relacionados.includes(t.slug), t.slug);
    assert.equal(new Set(t.relacionados).size, t.relacionados.length, t.slug);
    for (const r of t.relacionados) {
      assert.ok(slugs.has(r), `${t.slug} → ${r} não existe`);
      assert.ok(html.includes(`href="${HUB}${r}/"`), `${t.slug} sem link para ${r}`);
    }
    for (const href of [HUB, '/cardapio-digital/', '/ferramentas/']) assert.ok(html.includes(`href="${href}"`), `${t.slug} sem ${href}`);
    assert.match(html, /class="pseo-trilha"/);
    assert.match(html, /"@type":"BreadcrumbList"/);
    assert.match(html, /"@type":"FAQPage"/);
    assert.ok(t.faq.length >= 4 && t.faq.length <= 6, t.slug);
  }
  assert.ok(hub.includes('href="/cardapio-digital/"') && hub.includes('href="/ferramentas/"'));
});

test('oferta: WhatsApp com a etiqueta [cardapio] e a mensagem do tipo', () => {
  for (const t of dados.tipos) {
    const msg = encodeURIComponent(`Quero um site para ${t.meu} [cardapio]`);
    assert.ok(doTipo(t.slug).html.includes(`https://wa.me/5573988899345?text=${msg}`), t.slug);
    assert.match(doTipo(t.slug).html, /endereço|domínio/);
  }
  assert.ok(porLoc.get(HUB).html.includes(encodeURIComponent('[cardapio]')));
});

test('regra legal só com fonte oficial e data de leitura', () => {
  for (const t of dados.tipos) {
    const html = doTipo(t.slug).html;
    if (!/ECA|Estatuto da Criança/.test(semTags(meio(html)))) continue;
    assert.ok(html.includes('href="https://www.planalto.gov.br/ccivil_03/leis/l8069.htm"'), t.slug);
    assert.match(html, /lido em \d{2}\/\d{2}\/\d{4}/, t.slug);
  }
});

test('todo dado dos JSON sai escapado, inclusive <script> e aspas', () => {
  const mau = clone(dados);
  const t = mau.tipos[0];
  const xss = '<script>alert("x")</script>';
  t.nome = `Pizza ${xss}`;
  t.tipo = `pizzaria "aspas" <b>`;
  t.intro = `${xss} & 'aspas'`;
  t.organizar[0] = `<img src=x onerror=alert(1)>. Resto`;
  t.dia = xss; t.qr = xss; t.resumo = xss;
  t.faq[0] = { p: `"><script>alert(1)</script>`, r: `</script><script>alert(2)</script>` };
  t.meu = `a minha "pizzaria" <script>`;
  t.slug = 'pizzaria';
  const m = mau.modelos.pizzaria;
  m.nome = xss; m.frase = `" onmouseover="alert(1)`; m.horario = xss;
  m.secoes[0].nome = xss;
  m.secoes[0].itens[0] = { nome: xss, desc: `" onmouseover="alert(1)`, selos: ['vegano'] };
  const html = paginas(mau).map((p) => p.html).join('\n');
  const limpo = paginas().map((p) => p.html).join('\n');
  assert.ok(!html.includes('<script>alert'), 'script cru');
  assert.ok(!html.includes('<img src=x'), 'img crua');
  assert.ok(!html.includes('" onmouseover="'), 'atributo injetado');
  assert.ok(!html.includes('<b>'), 'tag crua');
  assert.ok(html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'));
  assert.ok(html.includes('&#39;aspas&#39;'));
  assert.equal((html.match(/<script/g) || []).length, (limpo.match(/<script/g) || []).length, 'nenhum <script> a mais');
  assert.equal((html.match(/<\/script>/g) || []).length, (limpo.match(/<\/script>/g) || []).length, 'nenhum </script> a mais');
});
