// Família pSEO "modelo-de-orcamento": o hub /modelo-de-orcamento/ e uma página por ofício.
//
// Itens e observações de cada modelo vêm de gerador-de-orcamento/modelos.json, o MESMO arquivo
// que o gerador busca quando abre com ?modelo=<slug>: a página mostra exatamente o que o botão
// "Usar este modelo" carrega. O texto de cada página (o que não pode faltar, erros, FAQ, leis)
// vem de pseo/dados/orcamento.json. Preço nunca vem de lugar nenhum: o dono preenche.

const fs = require('fs');
const path = require('path');
const { esc, pagina, trilha, faq, oferta } = require('./_layout');

const RAIZ = path.join(__dirname, '..');
const HUB = '/modelo-de-orcamento/';
const FERRAMENTA = '/gerador-de-orcamento/';
const TAG = 'orcamento';
const PAGE_EV = 'pseo_orcamento_viewed';
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function carregar() {
  const ler = (rel) => JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));
  return { modelos: ler('gerador-de-orcamento/modelos.json'), textos: ler('pseo/dados/orcamento.json') };
}

const dataBR = (iso) => iso.split('-').reverse().join('/');
const titulo = (termo) => [`Modelo de orçamento de ${termo}: grátis e editável`, `Modelo de orçamento de ${termo} grátis`, `Modelo de orçamento de ${termo}`]
  .find((t) => t.length <= 60);
const linkModelo = (slug) => `${FERRAMENTA}?modelo=${encodeURIComponent(slug)}`;
const lista = (itens) => `<ul>${itens.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;

function botaoModelo(slug, nome) {
  return `<div class="pseo-acao">
  <a class="btn btn-primary" href="${esc(linkModelo(slug))}" data-ev="pseo_modelo_clicked" data-ev-local="${esc(`${TAG}:${slug}`)}">Usar este modelo</a>
  <span class="pseo-miudo">Abre o gerador grátis com os itens de ${esc(nome.toLowerCase())} já preenchidos. Você só põe os seus preços.</span>
</div>`;
}

function tabelaModelo(modelo) {
  const linhas = modelo.itens.map((it) => `<tr><td data-rotulo="Item">${esc(it.descricao)}</td><td data-rotulo="Unidade">${esc(it.unidade)}</td><td data-rotulo="Qtd. sugerida">${esc(it.quantidade)}</td><td data-rotulo="Preço">defina o seu preço</td></tr>`).join('');
  return `<div class="pseo-caixa">
<table class="pseo-tabela">
<thead><tr><th scope="col">Item</th><th scope="col">Unidade</th><th scope="col">Qtd. sugerida</th><th scope="col">Preço</th></tr></thead>
<tbody>${linhas}</tbody>
</table>
<h3>Observações que já vêm no modelo</h3>
<p>${esc(modelo.observacoes)}</p>
</div>`;
}

// Bloco igual em todas as páginas: fica marcado com .pseo-comum para o teste não contar como texto próprio.
function blocoLei(textos, especificos) {
  const c = textos.comum;
  return `<section class="pseo-comum" aria-labelledby="lei-titulo">
<h2 id="lei-titulo">O que a lei já diz sobre qualquer orçamento</h2>
${lista(c.lei.map((l) => `${l.texto} (${textos.fontes[l.fonte].curto}, ${l.artigo})`))}
${especificos.length ? `<h3>Neste ofício, em especial</h3>${lista(especificos.map((l) => `${l.texto} (${textos.fontes[l.fonte].curto}, ${l.artigo})`))}` : ''}
<p class="pseo-miudo">${esc(c.aviso)}</p>
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

function paginaOficio(slug, t, modelo, textos) {
  const loc = `${HUB}${slug}/`;
  const nome = t.nome;
  const tr = trilha([{ nome: 'Início', loc: '/' }, { nome: 'Modelos de orçamento', loc: HUB }, { nome, loc }]);
  const f = faq(t.faq);
  const lei = t.lei || [];
  const usadas = new Set([...textos.comum.lei, ...lei].map((l) => l.fonte));
  const irmas = t.relacionados.map((s) => `<li><a href="${HUB}${esc(s)}/">${esc(textos.oficios[s].nome)}</a></li>`).join('');
  const p = t.precisa;
  const main = `${tr.html}
<h1>Modelo de orçamento de ${esc(t.termo)}</h1>
<p class="pseo-lead">${esc(t.intro)}</p>
${botaoModelo(slug, nome)}

<section aria-labelledby="modelo-titulo">
<h2 id="modelo-titulo">O modelo: itens de um orçamento de ${esc(t.termo)}</h2>
<p>Quantidades são só um ponto de partida. Troque pelo que você mediu ou combinou com o cliente e apague o que não for usar.</p>
${tabelaModelo(modelo)}
</section>

<section aria-labelledby="precisa-titulo">
<h2 id="precisa-titulo">O que o orçamento de ${esc(t.termo)} precisa dizer</h2>
<h3>Escopo</h3><p>${esc(p.escopo)}</p>
<h3>Material incluso ou não</h3><p>${esc(p.material)}</p>
<h3>Prazo</h3><p>${esc(p.prazo)}</p>
<h3>Garantia</h3><p>${esc(p.garantia)}</p>
<h3>Condições</h3><p>${esc(p.condicoes)}</p>
</section>

<section aria-labelledby="erros-titulo">
<h2 id="erros-titulo">Erros comuns</h2>
${lista(t.erros)}
</section>

<section aria-labelledby="apresentar-titulo">
<h2 id="apresentar-titulo">Como apresentar ao cliente</h2>
${lista(t.apresentar)}
</section>

${blocoLei(textos, lei)}

${f.html}

<section aria-labelledby="irmas-titulo">
<h2 id="irmas-titulo">Modelos de ofícios parecidos</h2>
<ul class="pseo-lista">${irmas}</ul>
<p><a href="${HUB}">Todos os modelos de orçamento</a> · <a href="${FERRAMENTA}">Gerador de orçamento</a> · <a href="/ferramentas/">Ferramentas grátis</a></p>
</section>

${blocoFontes(textos, usadas)}

${oferta(t.slug === 'criacao-de-site'
    // Quem faz site é colega de ofício: a oferta útil é terceirizar o que foge do escopo dele.
    ? {
      titulo: 'Cliente pediu loja, sistema ou SaaS?',
      texto: 'Se o projeto passou do que você costuma entregar, eu faço com preço fechado: loja virtual, sistema com login, integrações ou SaaS do zero, com você na frente do cliente se preferir.',
      mensagem: 'Quero terceirizar um projeto de site ou sistema',
      tag: TAG,
    }
    : {
      titulo: `Um site para o seu negócio de ${t.oficio}`,
      texto: `O orçamento fecha o cliente que já chegou. Um site mostra seus serviços e trabalhos de ${t.oficio}, aparece para quem procura no Google na sua cidade e traz o pedido de orçamento já com as informações certas pelo WhatsApp.`,
      mensagem: `Quero um site para o meu negócio de ${t.oficio}`,
      tag: TAG,
    })}`;
  return {
    rel: `${loc.slice(1)}index.html`,
    loc,
    lastmod: textos.atualizado,
    html: pagina({
      loc, title: titulo(t.termo), description: t.description, main, pageEv: PAGE_EV,
      jsonLd: [tr.ld, f.ld],
    }),
  };
}

function paginaHub(textos) {
  const h = textos.hub;
  const tr = trilha([{ nome: 'Início', loc: '/' }, { nome: 'Modelos de orçamento', loc: HUB }]);
  const f = faq(h.faq);
  const grupos = textos.grupos.map((g) => `<h3>${esc(g.nome)}</h3>
<ul class="pseo-lista tres">${g.slugs.map((s) => `<li><a href="${HUB}${esc(s)}/">${esc(textos.oficios[s].nome)}</a></li>`).join('')}</ul>`).join('\n');
  const usadas = new Set(textos.comum.lei.map((l) => l.fonte));
  const main = `${tr.html}
<h1>${esc(h.h1)}</h1>
<p class="pseo-lead">${esc(h.intro)}</p>
<div class="pseo-acao"><a class="btn btn-primary" href="${FERRAMENTA}">Abrir o gerador de orçamento</a></div>

<section aria-labelledby="oficios-titulo">
<h2 id="oficios-titulo">Escolha o seu ofício</h2>
${grupos}
</section>

<section aria-labelledby="como-titulo">
<h2 id="como-titulo">Como usar um modelo</h2>
<ol>${h.passos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
</section>

<section aria-labelledby="todo-titulo">
<h2 id="todo-titulo">O que todo orçamento precisa ter</h2>
${lista(h.todo)}
</section>

${blocoLei(textos, [])}

${f.html}

<p><a href="${FERRAMENTA}">Gerador de orçamento grátis</a> · <a href="/ferramentas/">Todas as ferramentas grátis</a></p>

${blocoFontes(textos, usadas)}

${oferta({
    titulo: h.oferta.titulo,
    texto: h.oferta.texto,
    mensagem: 'Quero um site para o meu negócio',
    tag: TAG,
  })}`;
  return {
    rel: `${HUB.slice(1)}index.html`,
    loc: HUB,
    lastmod: textos.atualizado,
    html: pagina({ loc: HUB, title: h.title, description: h.description, main, pageEv: PAGE_EV, jsonLd: [tr.ld, f.ld] }),
  };
}

/** Hub + uma página por ofício. `fonte` existe para o teste passar dados próprios. */
function paginas(fonte = carregar()) {
  const { modelos, textos } = fonte;
  const slugs = textos.grupos.flatMap((g) => g.slugs);
  for (const s of slugs) {
    if (!SLUG.test(s)) throw new Error(`orcamento: slug inválido "${s}"`);
    if (!textos.oficios[s]) throw new Error(`orcamento: "${s}" sem texto em pseo/dados/orcamento.json`);
    if (!modelos[s]) throw new Error(`orcamento: "${s}" sem modelo em gerador-de-orcamento/modelos.json`);
    for (const r of textos.oficios[s].relacionados) if (!textos.oficios[r] || r === s) throw new Error(`orcamento: "${s}" relaciona "${r}"`);
  }
  return [paginaHub(textos), ...slugs.map((s) => paginaOficio(s, textos.oficios[s], modelos[s], textos))];
}

module.exports = { paginas, carregar, titulo, linkModelo, HUB };
