// node --test test/pseo-recibo.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { lerModelo, slugModelo, buildRecibo } from '../gerador-de-recibo/recibo.mjs';

const require = createRequire(import.meta.url);
const { paginas, carregar, linkModelo, textoModelo, HUB } = require('../pseo/recibo.js');
const { esc } = require('../pseo/_layout.js');

const fonte = carregar();
const todas = paginas();
const [hub, ...tipos] = todas;
const slugs = fonte.textos.grupos.flatMap((g) => g.slugs);
const pega = (html, re) => (html.match(re) || [])[1];
const titulo = (p) => pega(p.html, /<title>([^<]*)<\/title>/);
const descricao = (p) => pega(p.html, /<meta name="description" content="([^"]*)">/);
const main = (p) => pega(p.html, /<main[^>]*>([\s\S]*)<\/main>/);
const desesc = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// Texto próprio da página: o <main> sem trilha, bloco legal comum, irmãs, fontes e oferta.
function palavrasProprias(p) {
  const t = main(p)
    .replace(/<nav class="pseo-trilha"[\s\S]*?<\/nav>/, '')
    .replace(/<section class="pseo-comum"[\s\S]*?<\/section>/, '')
    .replace(/<section aria-labelledby="irmas-titulo">[\s\S]*?<\/section>/, '')
    .replace(/<section class="pseo-fontes"[\s\S]*?<\/section>/, '')
    .replace(/<aside class="pseo-oferta"[\s\S]*?<\/aside>/, '')
    .replace(/<[^>]+>/g, ' ');
  return desesc(t).split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
}

test('paginas(): hub + uma página por tipo de recibo, rel/loc válidos e únicos', () => {
  assert.equal(slugs.length, 12);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.equal(todas.length, slugs.length + 1);
  assert.equal(hub.loc, HUB);
  assert.deepEqual(tipos.map((p) => p.loc), slugs.map((s) => `${HUB}${s}/`));
  for (const p of todas) {
    assert.match(p.rel, /^[a-z0-9-]+(\/[a-z0-9-]+)*\/index\.html$/);
    assert.equal(p.loc, `/${p.rel.replace(/index\.html$/, '')}`);
    assert.ok(p.html.startsWith('<!doctype html>'));
    assert.match(p.lastmod, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(p.html.includes(`<link rel="canonical" href="https://thallisribeiro.com.br${p.loc}">`), p.loc);
    assert.ok(p.html.includes('data-page-ev="pseo_recibo_viewed"'), p.loc);
  }
  assert.equal(new Set(todas.map((p) => p.rel)).size, todas.length);
  assert.deepEqual(Object.keys(fonte.modelos).sort(), [...slugs].sort());
  assert.deepEqual(Object.keys(fonte.textos.tipos).sort(), [...slugs].sort());
});

test('títulos e descrições únicos e no limite; um H1 com a palavra-chave', () => {
  const ts = todas.map(titulo), ds = todas.map(descricao);
  assert.equal(new Set(ts).size, ts.length, 'título repetido');
  assert.equal(new Set(ds).size, ds.length, 'descrição repetida');
  for (const p of todas) {
    const t = desesc(titulo(p)), d = desesc(descricao(p));
    assert.ok(t.length <= 60, `${p.loc}: título com ${t.length}: ${t}`);
    assert.ok(d.length > 50 && d.length <= 155, `${p.loc}: descrição com ${d.length}`);
    assert.equal((p.html.match(/<h1[ >]/g) || []).length, 1, p.loc);
  }
  for (const [i, s] of slugs.entries()) {
    const h1 = desesc(pega(tipos[i].html, /<h1>([^<]*)<\/h1>/));
    assert.equal(h1, `Modelo de recibo de ${fonte.textos.tipos[s].termo}`);
    assert.ok(desesc(titulo(tipos[i])).startsWith(h1), s);
    assert.ok(/recibo/i.test(desesc(descricao(tipos[i]))), s);
  }
});

test('cada página tem pelo menos 350 palavras de texto próprio', () => {
  for (const p of todas) {
    const n = palavrasProprias(p);
    assert.ok(n >= 350, `${p.loc}: ${n} palavras próprias`);
  }
});

test('conteúdo de cada tipo: 4–6 FAQs, 4–6 irmãs, regra legal com fonte', () => {
  for (const s of slugs) {
    const t = fonte.textos.tipos[s];
    assert.ok(t.faq.length >= 4 && t.faq.length <= 6, `${s}: ${t.faq.length} FAQs`);
    assert.ok(t.relacionados.length >= 4 && t.relacionados.length <= 6, `${s}: ${t.relacionados.length} irmãs`);
    assert.ok(!t.relacionados.includes(s));
    assert.ok(t.precisa.length >= 4 && t.cuidados.length >= 3, s);
    for (const c of t.cuidados) if (c.fonte) assert.ok(fonte.textos.fontes[c.fonte] && c.artigo, `${s}: cuidado sem fonte`);
  }
  for (const f of Object.values(fonte.textos.fontes)) assert.match(f.url, /^https:\/\/(www\.planalto\.gov\.br|www\.gov\.br)\//);
  for (const p of todas) assert.ok(p.html.includes('lido em 10/10/2026'), p.loc);
  // os casos sensíveis dizem o que a lei exige além do recibo
  const html = (s) => tipos[slugs.indexOf(s)].html;
  assert.ok(html('venda-de-veiculo').includes('art. 134') && html('venda-de-veiculo').includes('arts. 123, § 1º, e 233'));
  assert.ok(html('diarista').includes('LC 150/2015, art. 1º') && html('diarista').includes('eSocial'));
  assert.ok(html('sinal').includes('arts. 418 e 419') && html('sinal').includes('art. 420') && html('sinal').includes('art. 417'));
  assert.ok(html('aluguel').includes('Lei 8.245/1991, art. 22, VI'));
});

test('a página mostra o recibo que o gerador monta com o modelos.json', () => {
  for (const [i, s] of slugs.entries()) {
    const html = tipos[i].html, m = lerModelo(fonte.modelos, s);
    assert.ok(m, s);
    const r = buildRecibo({ pagadorNome: '[nome de quem pagou]', referente: m.referente, forma: m.forma, cidade: '[cidade]' }).recibo;
    assert.deepEqual(textoModelo(fonte.modelos[s]), r);
    assert.ok(r.corpo.includes(`referente a ${m.referente.replace(/[\s.;,]+$/, '')}, paga `), s);
    assert.ok(html.includes(`<p>${esc(r.corpo)}</p>`), `${s}: corpo do recibo`);
    assert.ok(html.includes(`<p class="pseo-miudo">${esc(m.dica)}</p>`), `${s}: dica`);
  }
});

test('"Usar este modelo" abre o gerador de recibo com ?modelo=<slug>', () => {
  for (const [i, s] of slugs.entries()) {
    const href = desesc(pega(tipos[i].html, /<a class="btn btn-primary" href="([^"]*)"[^>]*>Usar este modelo<\/a>/));
    assert.equal(href, `/gerador-de-recibo/?modelo=${s}`);
    assert.equal(href, linkModelo(s));
    assert.equal(slugModelo(new URL(href, 'https://x').search), s);
  }
});

test('links internos: hub ↔ páginas, irmãs, ferramenta, /ferramentas/ e trilha', () => {
  for (const s of slugs) assert.ok(hub.html.includes(`href="${HUB}${s}/"`), `hub sem ${s}`);
  for (const [i, s] of slugs.entries()) {
    const html = tipos[i].html;
    assert.ok(html.includes(`href="${HUB}"`), s);
    assert.ok(html.includes('href="/gerador-de-recibo/"'), s);
    assert.ok(html.includes('href="/ferramentas/"'), s);
    for (const r of fonte.textos.tipos[s].relacionados) assert.ok(html.includes(`href="${HUB}${r}/"`), `${s} → ${r}`);
    assert.ok(html.includes('class="pseo-trilha"') && html.includes('"@type":"BreadcrumbList"') && html.includes('"@type":"FAQPage"'), s);
  }
});

test('oferta: WhatsApp com a etiqueta [recibo]', () => {
  for (const p of todas) {
    const href = desesc(pega(p.html, /href="(https:\/\/wa\.me\/[^"]*)"/));
    assert.ok(decodeURIComponent(new URL(href).searchParams.get('text')).endsWith(' [recibo]'), p.loc);
  }
});

test('todo dado do JSON sai escapado (<script> e aspas)', () => {
  const mau = `<script>alert("x")</script> 'aspas' & "duplas"`;
  const f = structuredClone(fonte);
  const s = slugs[0], t = f.textos.tipos[s];
  Object.assign(t, { nome: mau, termo: mau, description: mau, intro: mau, tituloCuidados: mau });
  t.precisa = [mau]; t.cuidados = [{ titulo: mau, texto: mau, fonte: 'cc', artigo: mau }]; t.faq = [{ p: mau, r: mau }];
  Object.assign(f.modelos[s], { referente: mau, dica: mau });
  f.textos.grupos[0].nome = mau;
  const [h, p] = paginas(f);
  for (const html of [h.html, p.html]) {
    assert.ok(!html.includes('<script>alert'), 'script cru no HTML');
    const semLd = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
    assert.ok(!semLd.includes(`'aspas'`) && !semLd.includes('"duplas"'), 'aspas cruas no HTML');
  }
  assert.ok(p.html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &#39;aspas&#39; &amp; &quot;duplas&quot;'));
  const lds = [...p.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((x) => JSON.parse(x[1]));
  assert.equal(lds.find((x) => x['@type'] === 'FAQPage').mainEntity[0].name, mau);
});
