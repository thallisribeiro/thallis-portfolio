// node --test test/pseo-orcamento.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { lerModelo, slugModelo, UNIDADES } from '../gerador-de-orcamento/orcamento.mjs';

const require = createRequire(import.meta.url);
const { paginas, carregar, linkModelo, HUB } = require('../pseo/orcamento.js');
const { esc } = require('../pseo/_layout.js');

const fonte = carregar();
const todas = paginas();
const [hub, ...oficios] = todas;
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

test('paginas(): hub + uma página por ofício, rel/loc válidos e únicos', () => {
  assert.equal(slugs.length, 38);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.equal(todas.length, slugs.length + 1);
  assert.equal(hub.loc, HUB);
  assert.deepEqual(oficios.map((p) => p.loc), slugs.map((s) => `${HUB}${s}/`));
  for (const p of todas) {
    assert.match(p.rel, /^[a-z0-9-]+(\/[a-z0-9-]+)*\/index\.html$/);
    assert.equal(p.loc, `/${p.rel.replace(/index\.html$/, '')}`);
    assert.ok(p.html.startsWith('<!doctype html>'));
    assert.match(p.lastmod, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(p.html.includes(`<link rel="canonical" href="https://thallisribeiro.com.br${p.loc}">`), p.loc);
    assert.ok(p.html.includes('data-page-ev="pseo_orcamento_viewed"'), p.loc);
  }
  assert.equal(new Set(todas.map((p) => p.rel)).size, todas.length);
  // os slugs do texto e do modelo são os mesmos: nenhum modelo órfão no JSON da ferramenta
  assert.deepEqual(Object.keys(fonte.modelos).sort(), [...slugs].sort());
  assert.deepEqual(Object.keys(fonte.textos.oficios).sort(), [...slugs].sort());
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
    const h1 = desesc(pega(oficios[i].html, /<h1>([^<]*)<\/h1>/));
    assert.equal(h1, `Modelo de orçamento de ${fonte.textos.oficios[s].termo}`);
    assert.ok(desesc(titulo(oficios[i])).startsWith(h1), s);
    assert.ok(/orçamento/i.test(desesc(descricao(oficios[i]))), `${s}: descrição sem "orçamento"`);
  }
});

test('cada página tem pelo menos 350 palavras de texto próprio', () => {
  for (const p of todas) {
    const n = palavrasProprias(p);
    assert.ok(n >= 350, `${p.loc}: ${n} palavras próprias`);
  }
});

test('conteúdo de cada ofício: 4–6 FAQs, 4–6 irmãs, nada de preço no modelo', () => {
  for (const s of slugs) {
    const t = fonte.textos.oficios[s];
    assert.ok(t.faq.length >= 4 && t.faq.length <= 6, `${s}: ${t.faq.length} FAQs`);
    assert.ok(t.relacionados.length >= 4 && t.relacionados.length <= 6, `${s}: ${t.relacionados.length} irmãs`);
    assert.ok(!t.relacionados.includes(s));
    for (const k of ['escopo', 'material', 'prazo', 'garantia', 'condicoes']) assert.ok(t.precisa[k]?.trim(), `${s}: precisa.${k}`);
    assert.ok(t.erros.length >= 3 && t.apresentar.length >= 2, s);
    for (const l of t.lei || []) assert.ok(fonte.textos.fontes[l.fonte] && l.artigo, `${s}: lei sem fonte`);
    const m = JSON.stringify(fonte.modelos[s]);
    assert.ok(!/R\$\s*\d/.test(m), `${s}: modelo com preço`);
    for (const it of fonte.modelos[s].itens) assert.ok(UNIDADES.includes(it.unidade), `${s}: unidade "${it.unidade}"`);
  }
});

test('a página mostra exatamente o que o gerador carrega do modelos.json', () => {
  for (const [i, s] of slugs.entries()) {
    const html = oficios[i].html, m = lerModelo(fonte.modelos, s);
    assert.ok(m, s);
    const linhas = [...html.matchAll(/<tr><td data-rotulo="Item">([^<]*)<\/td><td data-rotulo="Unidade">([^<]*)<\/td><td data-rotulo="Qtd. sugerida">([^<]*)<\/td><td data-rotulo="Preço">defina o seu preço<\/td><\/tr>/g)]
      .map((x) => ({ descricao: desesc(x[1]), unidade: desesc(x[2]), quantidade: desesc(x[3]), valor: '' }));
    assert.deepEqual(linhas, m.itens, `${s}: itens da página ≠ itens do gerador`);
    assert.ok(html.includes(`<p>${esc(m.observacoes)}</p>`), `${s}: observações`);
  }
});

test('"Usar este modelo" abre o gerador com ?modelo=<slug> do próprio ofício', () => {
  for (const [i, s] of slugs.entries()) {
    const href = desesc(pega(oficios[i].html, /<a class="btn btn-primary" href="([^"]*)"[^>]*>Usar este modelo<\/a>/));
    assert.equal(href, `/gerador-de-orcamento/?modelo=${s}`);
    assert.equal(href, linkModelo(s));
    assert.equal(slugModelo(new URL(href, 'https://x').search), s, 'o gerador entende o link');
  }
});

test('links internos: hub ↔ páginas, irmãs, ferramenta, /ferramentas/ e trilha', () => {
  for (const s of slugs) assert.ok(hub.html.includes(`href="${HUB}${s}/"`), `hub sem ${s}`);
  for (const [i, s] of slugs.entries()) {
    const html = oficios[i].html;
    assert.ok(html.includes(`href="${HUB}"`), s);
    assert.ok(html.includes('href="/gerador-de-orcamento/"'), s);
    assert.ok(html.includes('href="/ferramentas/"'), s);
    for (const r of fonte.textos.oficios[s].relacionados) assert.ok(html.includes(`href="${HUB}${r}/"`), `${s} → ${r}`);
    assert.ok(html.includes('class="pseo-trilha"') && html.includes('"@type":"BreadcrumbList"'), s);
    assert.ok(html.includes('"@type":"FAQPage"'), s);
  }
});

test('oferta: WhatsApp com a etiqueta [orcamento] e o ofício na mensagem', () => {
  for (const [i, s] of slugs.entries()) {
    const href = desesc(pega(oficios[i].html, /href="(https:\/\/wa\.me\/[^"]*)"/));
    const texto = decodeURIComponent(new URL(href).searchParams.get('text'));
    assert.equal(texto, `Quero um site para o meu negócio de ${fonte.textos.oficios[s].oficio} [orcamento]`);
  }
  assert.ok(decodeURIComponent(hub.html).includes('[orcamento]'));
});

test('fontes legais citadas com link oficial e data de leitura', () => {
  for (const f of Object.values(fonte.textos.fontes)) assert.match(f.url, /^https:\/\/(www\.planalto\.gov\.br|www1\.cfc\.org\.br|anvisalegis\.datalegis\.net)\//);
  for (const p of todas) assert.ok(p.html.includes('lido em 10/10/2026'), p.loc);
  const cdc = oficios[0].html;
  assert.ok(cdc.includes('art. 40, § 1º') && cdc.includes('10 dias'), 'CDC art. 40 na página');
});

test('todo dado do JSON sai escapado (<script> e aspas)', () => {
  const mau = `<script>alert("x")</script> 'aspas' & "duplas"`;
  const f = structuredClone(fonte);
  const s = slugs[0], t = f.textos.oficios[s];
  Object.assign(t, { nome: mau, termo: mau, oficio: mau, description: mau, intro: mau });
  t.precisa.escopo = mau; t.erros = [mau, mau, mau]; t.apresentar = [mau, mau]; t.faq = [{ p: mau, r: mau }];
  t.lei = [{ texto: mau, fonte: 'cdc', artigo: mau }];
  f.modelos[s].itens = [{ descricao: mau, unidade: mau, quantidade: mau }];
  f.modelos[s].observacoes = mau;
  f.textos.grupos[0].nome = mau;
  const [h, p] = paginas(f);
  for (const html of [h.html, p.html]) {
    assert.ok(!html.includes('<script>alert'), 'script cru no HTML');
    const semLd = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
    assert.ok(!semLd.includes(`'aspas'`) && !semLd.includes('"duplas"'), 'aspas cruas no HTML');
  }
  assert.ok(p.html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &#39;aspas&#39; &amp; &quot;duplas&quot;'));
  // no JSON-LD o "<" vira < (nem lá o </script> fecha a tag) e o JSON continua válido
  const lds = [...p.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((x) => JSON.parse(x[1]));
  assert.equal(lds.find((x) => x['@type'] === 'FAQPage').mainEntity[0].name, mau);
});

test('paginas() recusa slug inválido e irmã que não existe', () => {
  const f = structuredClone(fonte);
  f.textos.oficios[slugs[0]].relacionados = ['nao-existe'];
  assert.throws(() => paginas(f), /relaciona/);
  const g = structuredClone(fonte);
  g.textos.grupos[0].slugs.push('../fora');
  assert.throws(() => paginas(g), /slug inválido/);
});
