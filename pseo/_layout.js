// Moldura comum das páginas de pSEO: <head> com SEO e o mesmo Google Analytics do site,
// cabeçalho e rodapé das ferramentas, e o /assets/main.js (dispara data-page-ev e data-ev).
// Cada família monta só o <main>.

const SITE_URL = 'https://thallisribeiro.com.br';
const WHATSAPP = '5573988899345';

/** Escapa texto para HTML (conteúdo e atributos). Todo dado de pseo/*.js passa por aqui. */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Link do WhatsApp do Thallis no padrão da casa: mensagem + etiqueta de origem. */
function whatsappCta(mensagem, tag) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`${mensagem} [${tag}]`)}`;
}

/** JSON-LD seguro dentro de <script>: impede "</script>" no meio dos dados. */
function jsonLd(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
}

const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%230B0F14'/%3E%3Crect x='10' y='14' width='44' height='4' rx='2' fill='%23E8A33D'/%3E%3Crect x='10' y='30' width='30' height='4' rx='2' fill='%238B949E'/%3E%3Crect x='10' y='46' width='18' height='4' rx='2' fill='%238B949E'/%3E%3C/svg%3E";

/**
 * Página inteira.
 * @param {{ loc: string, title: string, description: string, main: string, pageEv: string,
 *           css?: string[], jsonLd?: object[], extraHead?: string }} o
 *   loc      caminho público com barra final ("/modelo-de-orcamento/eletricista/")
 *   main     HTML do <main> já escapado pela família
 *   css      folhas extras (caminhos absolutos do site)
 */
function pagina(o) {
  const url = `${SITE_URL}${o.loc}`;
  const css = (o.css || []).map((h) => `<link rel="stylesheet" href="${esc(h)}">`).join('\n');
  const ld = (o.jsonLd || []).map(jsonLd).join('\n');
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${SITE_URL}/assets/og-default.png">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
<link rel="stylesheet" href="/pseo/pseo.css">
${css}
<link rel="icon" type="image/svg+xml" href="${FAVICON}">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-247F9N1WQE"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-247F9N1WQE');
</script>
${ld}
${o.extraHead || ''}
</head>
<body data-page-ev="${esc(o.pageEv)}">
<a class="pseo-pular" href="#conteudo">Pular para o conteúdo</a>
<header class="nav nav-landing">
  <div class="nav-inner">
    <a class="logo-wrap pseo-logo" href="/" aria-label="Thallis Ribeiro, página inicial">
      <span class="logo-bars" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="logo">Thallis Ribeiro</span>
    </a>
    <div class="nav-actions">
      <a class="pseo-nav-link" href="/ferramentas/">Ferramentas grátis</a>
    </div>
  </div>
</header>
<main id="conteudo" class="pseo">
${o.main}
</main>
<footer class="footer">
  <span>Thallis Ribeiro · 2026</span>
  <a href="/">Início</a>
  <a href="/ferramentas/">Ferramentas grátis</a>
  <a href="/blog/">Blog</a>
</footer>
<script src="/assets/main.js" defer></script>
</body>
</html>
`;
}

/** Trilha de navegação visível + BreadcrumbList. itens: [{ nome, loc }] do topo até a página. */
function trilha(itens) {
  const html = `<nav class="pseo-trilha" aria-label="Você está em"><ol>${itens.map((i, k) =>
    k === itens.length - 1
      ? `<li aria-current="page">${esc(i.nome)}</li>`
      : `<li><a href="${esc(i.loc)}">${esc(i.nome)}</a></li>`).join('')}</ol></nav>`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: itens.map((i, k) => ({ '@type': 'ListItem', position: k + 1, name: i.nome, item: `${SITE_URL}${i.loc}` })),
  };
  return { html, ld };
}

/** FAQ visível (<details>) + FAQPage. perguntas: [{ p, r }] em texto puro. */
function faq(perguntas) {
  const html = `<section class="pseo-faq" aria-labelledby="faq-titulo"><h2 id="faq-titulo">Perguntas frequentes</h2>${perguntas.map((q) =>
    `<details><summary>${esc(q.p)}</summary><p>${esc(q.r)}</p></details>`).join('')}</section>`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: perguntas.map((q) => ({ '@type': 'Question', name: q.p, acceptedAnswer: { '@type': 'Answer', text: q.r } })),
  };
  return { html, ld };
}

/** Bloco da oferta, sempre depois do conteúdo útil. */
function oferta({ titulo, texto, mensagem, tag }) {
  return `<aside class="pseo-oferta" aria-labelledby="oferta-${esc(tag)}">
  <h2 id="oferta-${esc(tag)}">${esc(titulo)}</h2>
  <p>${esc(texto)}</p>
  <a class="btn btn-primary btn-lg" href="${esc(whatsappCta(mensagem, tag))}" target="_blank" rel="noopener" data-ev="pseo_cta_clicked" data-ev-local="${esc(tag)}">Falar com o Thallis no WhatsApp</a>
  <p class="pseo-miudo">Site profissional a partir de R$ 997, no ar em 7 dias. Também faço loja virtual, sistema e SaaS.</p>
</aside>`;
}

module.exports = { SITE_URL, esc, whatsappCta, jsonLd, pagina, trilha, faq, oferta };
