// Família pSEO "modelo-de-recibo": o hub /modelo-de-recibo/ e uma página por tipo de recibo.
//
// O "referente a", a forma de pagamento e a dica de cada modelo vêm de gerador-de-recibo/modelos.json,
// o MESMO arquivo que o gerador busca quando abre com ?modelo=<slug>. O texto do recibo mostrado na
// página sai do buildRecibo() do próprio gerador (require de ESM, Node 22.12+), então a página mostra
// exatamente a frase que a ferramenta vai imprimir. O resto do texto vem de pseo/dados/recibo.json.

const fs = require('fs');
const path = require('path');
const { esc, pagina, trilha, faq, oferta } = require('./_layout');
const { buildRecibo } = require('../gerador-de-recibo/recibo.mjs');

const RAIZ = path.join(__dirname, '..');
const HUB = '/modelo-de-recibo/';
const FERRAMENTA = '/gerador-de-recibo/';
const TAG = 'recibo';
const PAGE_EV = 'pseo_recibo_viewed';
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function carregar() {
  const ler = (rel) => JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));
  return { modelos: ler('gerador-de-recibo/modelos.json'), textos: ler('pseo/dados/recibo.json') };
}

const dataBR = (iso) => iso.split('-').reverse().join('/');
const titulo = (termo) => [`Modelo de recibo de ${termo}: grátis, em PDF`, `Modelo de recibo de ${termo} grátis`, `Modelo de recibo de ${termo}`]
  .find((t) => t.length <= 60);
const linkModelo = (slug) => `${FERRAMENTA}?modelo=${encodeURIComponent(slug)}`;
const lista = (itens) => `<ul>${itens.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
const citacao = (textos, x) => (x.fonte ? ` (${textos.fontes[x.fonte].curto}, ${x.artigo})` : '');

/** O recibo como o gerador imprime, com lacunas no que a pessoa ainda vai preencher. */
function textoModelo(modelo) {
  return buildRecibo({ pagadorNome: '[nome de quem pagou]', referente: modelo.referente, forma: modelo.forma, cidade: '[cidade]' }).recibo;
}

function caixaModelo(slug, modelo) {
  const r = textoModelo(modelo);
  return `<div class="pseo-caixa">
<p><strong>${esc(r.titulo)}</strong> · Valor: ${esc(r.valor)}</p>
<p>${esc(r.corpo)}</p>
<p>${esc(r.local)}</p>
<p>________________________________<br>[nome de quem recebeu] · [CPF ou CNPJ]</p>
</div>
<p class="pseo-miudo">${esc(modelo.dica)}</p>
<div class="pseo-acao">
  <a class="btn btn-primary" href="${esc(linkModelo(slug))}" data-ev="pseo_modelo_clicked" data-ev-local="${esc(`${TAG}:${slug}`)}">Usar este modelo</a>
  <span class="pseo-miudo">Abre o gerador grátis com o “referente a” e a forma de pagamento preenchidos. O valor por extenso sai sozinho.</span>
</div>`;
}

// Bloco igual em todas as páginas: fica marcado com .pseo-comum para o teste não contar como texto próprio.
function blocoLei(textos) {
  return `<section class="pseo-comum" aria-labelledby="lei-titulo">
<h2 id="lei-titulo">O que a lei diz sobre qualquer recibo</h2>
${lista(textos.comum.lei.map((l) => `${l.texto}${citacao(textos, l)}`))}
<p class="pseo-miudo">${esc(textos.comum.aviso)}</p>
</section>`;
}

function blocoFontes(textos, usadas) {
  const lido = dataBR(textos.lido);
  const itens = [...usadas].map((k) => {
    const f = textos.fontes[k];
    return `<li><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.nome)}</a>, lido em ${esc(lido)}.</li>`;
  }).join('');
  return `<section class="pseo-fontes" aria-labelledby="fontes-titulo"><h2 id="fontes-titulo">Fontes</h2><ul>${itens}</ul></section>`;
}

function blocoOferta(textos) {
  return oferta({ titulo: textos.oferta.titulo, texto: textos.oferta.texto, mensagem: 'Quero um site para o meu negócio', tag: TAG });
}

function paginaTipo(slug, t, modelo, textos) {
  const loc = `${HUB}${slug}/`;
  const tr = trilha([{ nome: 'Início', loc: '/' }, { nome: 'Modelos de recibo', loc: HUB }, { nome: t.nome, loc }]);
  const f = faq(t.faq);
  const usadas = new Set([...textos.comum.lei, ...t.cuidados].map((x) => x.fonte).filter(Boolean));
  const irmas = t.relacionados.map((s) => `<li><a href="${HUB}${esc(s)}/">${esc(textos.tipos[s].nome)}</a></li>`).join('');
  const cuidados = t.cuidados.map((c) => `<h3>${esc(c.titulo)}</h3><p>${esc(`${c.texto}${citacao(textos, c)}`)}</p>`).join('\n');
  const main = `${tr.html}
<h1>Modelo de recibo de ${esc(t.termo)}</h1>
<p class="pseo-lead">${esc(t.intro)}</p>

<section aria-labelledby="modelo-titulo">
<h2 id="modelo-titulo">O modelo de recibo de ${esc(t.termo)}</h2>
<p>O que está entre colchetes você troca; as linhas em branco o gerador preenche com o valor, o valor por extenso e a data.</p>
${caixaModelo(slug, modelo)}
</section>

<section aria-labelledby="precisa-titulo">
<h2 id="precisa-titulo">O que não pode faltar</h2>
${lista(t.precisa)}
</section>

<section aria-labelledby="cuidados-titulo">
<h2 id="cuidados-titulo">${esc(t.tituloCuidados)}</h2>
${cuidados}
</section>

${blocoLei(textos)}

${f.html}

<section aria-labelledby="irmas-titulo">
<h2 id="irmas-titulo">Outros modelos de recibo</h2>
<ul class="pseo-lista">${irmas}</ul>
<p><a href="${HUB}">Todos os modelos de recibo</a> · <a href="${FERRAMENTA}">Gerador de recibo</a> · <a href="/ferramentas/">Ferramentas grátis</a></p>
</section>

${blocoFontes(textos, usadas)}

${blocoOferta(textos)}`;
  return {
    rel: `${loc.slice(1)}index.html`,
    loc,
    lastmod: textos.atualizado,
    html: pagina({ loc, title: titulo(t.termo), description: t.description, main, pageEv: PAGE_EV, jsonLd: [tr.ld, f.ld] }),
  };
}

function paginaHub(textos) {
  const h = textos.hub;
  const tr = trilha([{ nome: 'Início', loc: '/' }, { nome: 'Modelos de recibo', loc: HUB }]);
  const f = faq(h.faq);
  const grupos = textos.grupos.map((g) => `<h3>${esc(g.nome)}</h3>
<ul class="pseo-lista tres">${g.slugs.map((s) => `<li><a href="${HUB}${esc(s)}/">${esc(textos.tipos[s].nome)}</a></li>`).join('')}</ul>`).join('\n');
  const usadas = new Set(textos.comum.lei.map((l) => l.fonte));
  const main = `${tr.html}
<h1>${esc(h.h1)}</h1>
<p class="pseo-lead">${esc(h.intro)}</p>
<div class="pseo-acao"><a class="btn btn-primary" href="${FERRAMENTA}">Abrir o gerador de recibo</a></div>

<section aria-labelledby="tipos-titulo">
<h2 id="tipos-titulo">Escolha o tipo de recibo</h2>
${grupos}
</section>

<section aria-labelledby="como-titulo">
<h2 id="como-titulo">Como usar um modelo</h2>
<ol>${h.passos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
</section>

<section aria-labelledby="todo-titulo">
<h2 id="todo-titulo">O que todo recibo precisa ter</h2>
${lista(h.todo)}
</section>

${blocoLei(textos)}

${f.html}

<p><a href="${FERRAMENTA}">Gerador de recibo grátis</a> · <a href="/ferramentas/">Todas as ferramentas grátis</a></p>

${blocoFontes(textos, usadas)}

${blocoOferta(textos)}`;
  return {
    rel: `${HUB.slice(1)}index.html`,
    loc: HUB,
    lastmod: textos.atualizado,
    html: pagina({ loc: HUB, title: h.title, description: h.description, main, pageEv: PAGE_EV, jsonLd: [tr.ld, f.ld] }),
  };
}

/** Hub + uma página por tipo de recibo. `fonte` existe para o teste passar dados próprios. */
function paginas(fonte = carregar()) {
  const { modelos, textos } = fonte;
  const slugs = textos.grupos.flatMap((g) => g.slugs);
  for (const s of slugs) {
    if (!SLUG.test(s)) throw new Error(`recibo: slug inválido "${s}"`);
    if (!textos.tipos[s]) throw new Error(`recibo: "${s}" sem texto em pseo/dados/recibo.json`);
    if (!modelos[s]) throw new Error(`recibo: "${s}" sem modelo em gerador-de-recibo/modelos.json`);
    for (const r of textos.tipos[s].relacionados) if (!textos.tipos[r] || r === s) throw new Error(`recibo: "${s}" relaciona "${r}"`);
  }
  return [paginaHub(textos), ...slugs.map((s) => paginaTipo(s, textos.tipos[s], modelos[s], textos))];
}

module.exports = { paginas, carregar, titulo, linkModelo, textoModelo, HUB };
