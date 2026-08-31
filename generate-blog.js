#!/usr/bin/env node
// Gera blog/ a partir de content/posts/*.md — rodar depois de criar/editar um post.
// Fluxo pra publicar: escrever content/posts/<slug>.md, rodar `node generate-blog.js`, git add+commit+push.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const OUT_DIR = path.join(ROOT, 'blog');
const SITE_URL = 'https://thallisribeiro.com.br';
// Mesma propriedade GA4 da home (index.html). Até 2026-08-28 as páginas de post
// eram geradas sem tracking nenhum: 50 posts publicados sem medir uma visita.
const GA_ID = 'G-247F9N1WQE';
const WA_LINK = 'https://wa.me/5573999865198?text=Oi%20ThallisRibeiro%2C%20vi%20um%20post%20do%20seu%20blog%20e%20quero%20conversar%20sobre%20um%20projeto';

// ── Frontmatter + markdown mínimo (headers, bold, itálico, links, listas, citação, código) ──
function parseFrontmatter(raw) {
  raw = raw.replace(/\r\n/g, '\n');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return { meta, body: m[2] };
}

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function inline(s) {
  s = esc(s);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s;
}

function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  let html = '', inList = null;
  const flushList = () => { if (inList) { html += `</${inList}>`; inList = null; } };
  for (const raw of lines) {
    const t = raw.trim();
    if (/^###\s+/.test(t)) { flushList(); html += `<h3>${inline(t.replace(/^###\s+/, ''))}</h3>`; continue; }
    if (/^##\s+/.test(t)) { flushList(); html += `<h2>${inline(t.replace(/^##\s+/, ''))}</h2>`; continue; }
    if (/^>\s?/.test(t)) { flushList(); html += `<blockquote>${inline(t.replace(/^>\s?/, ''))}</blockquote>`; continue; }
    if (/^---+$/.test(t)) { flushList(); html += '<hr>'; continue; }
    if (/^[-*]\s+/.test(t)) { if (inList !== 'ul') { flushList(); html += '<ul>'; inList = 'ul'; } html += `<li>${inline(t.replace(/^[-*]\s+/, ''))}</li>`; continue; }
    if (/^\d+\.\s+/.test(t)) { if (inList !== 'ol') { flushList(); html += '<ol>'; inList = 'ol'; } html += `<li>${inline(t.replace(/^\d+\.\s+/, ''))}</li>`; continue; }
    if (t === '') { flushList(); continue; }
    flushList(); html += `<p>${inline(t)}</p>`;
  }
  flushList();
  return html;
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function slugify(s) {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function tempoDeLeitura(md) {
  const palavras = md.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palavras / 200));
}

// Fallback pra post sem imagem própria. Era o print do Grana — errado pra post
// que não tem nada a ver com o Grana (é o que aparecia ao compartilhar qualquer
// post no Twitter/X). Agora é uma marca genérica do site (gerada por
// generate-og-image.js), nunca um case específico.
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/og-default.png`;

// ── Ícones inline (SVG monocromático via currentColor — zero dependência externa) ──
const ICONS = {
  x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23.3 22h-7l-5.5-7.2L4.5 22H1.4l8.1-9.3L1 2h7.2l5 6.6L18.9 2zm-1.2 18h1.7L6.4 4h-1.8l13.1 16z"/></svg>',
  whatsapp: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.5-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.4.1-.2 0-.4 0-.5C10.1 9 9.6 7.7 9.4 7.2c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2.1 3.2 5 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1112 20.2z"/></svg>',
  linkedin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 20.4h-3.5v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2 2 0 110-4.1 2 2 0 010 4.1zM7.1 20.4H3.6V9h3.5v11.4z"/></svg>',
  link: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.5.5l2-2a5 5 0 00-7-7l-1 1"/><path d="M14 11a5 5 0 00-7.5-.5l-2 2a5 5 0 007 7l1-1"/></svg>',
  share: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-3.9M8.6 13.5l6.8 3.9"/></svg>',
};

function shareButtons(post, canonical) {
  // summary já é escrito como gancho (é o meta description) -- bem mais forte pra
  // compartilhar que o título cru. Cai pro título só se um post antigo não tiver summary.
  const texto = encodeURIComponent(post.summary || post.title);
  const url = encodeURIComponent(canonical);
  return `
      <div class="share-bar">
        <span class="share-label">Compartilhar</span>
        <a class="share-btn" href="https://twitter.com/intent/tweet?text=${texto}&url=${url}" target="_blank" rel="noopener" aria-label="Compartilhar no X">${ICONS.x}</a>
        <a class="share-btn" href="https://wa.me/?text=${texto}%20${url}" target="_blank" rel="noopener" aria-label="Compartilhar no WhatsApp">${ICONS.whatsapp}</a>
        <a class="share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${url}" target="_blank" rel="noopener" aria-label="Compartilhar no LinkedIn">${ICONS.linkedin}</a>
        <button class="share-btn" type="button" data-copy-link="${esc(canonical)}" aria-label="Copiar link">${ICONS.link}</button>
        <button class="share-btn share-native" type="button" data-share-title="${esc(post.title)}" data-share-text="${esc(post.summary || post.title)}" data-share-url="${esc(canonical)}" aria-label="Compartilhar (Instagram e outros apps)" hidden>${ICONS.share}</button>
      </div>
      <script>
        (function(){
          var n = document.currentScript.previousElementSibling;
          var nativeBtn = n.querySelector('.share-native');
          if (navigator.share) {
            nativeBtn.hidden = false;
            nativeBtn.addEventListener('click', function(){
              navigator.share({ title: nativeBtn.dataset.shareTitle, text: nativeBtn.dataset.shareText, url: nativeBtn.dataset.shareUrl }).catch(function(){});
            });
          }
          var copyBtn = n.querySelector('[data-copy-link]');
          copyBtn.addEventListener('click', function(){
            navigator.clipboard.writeText(copyBtn.dataset.copyLink).then(function(){
              var old = copyBtn.innerHTML;
              copyBtn.innerHTML = '✓';
              setTimeout(function(){ copyBtn.innerHTML = old; }, 1500);
            });
          });
        })();
      </script>`;
}

// ── Layout compartilhado (mesmo header/footer do site) ──
function shell({ title, description, ogType = 'website', canonical, body, jsonLd = [], ogImage = DEFAULT_OG_IMAGE, ogImageWidth = 1200, ogImageHeight = 630 }) {
  const jsonLdBlock = jsonLd.map(obj => `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`).join('\n');
  const ogImageDims = (ogImageWidth && ogImageHeight)
    ? `<meta property="og:image:width" content="${ogImageWidth}">\n<meta property="og:image:height" content="${ogImageHeight}">\n`
    : '';
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
${ogImageDims}<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${canonical}">
<link rel="alternate" type="application/rss+xml" title="Blog ThallisRibeiro" href="${SITE_URL}/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%2325D366'/%3E%3Cstop offset='1' stop-color='%2358A6FF'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='16' fill='url(%23g)'/%3E%3Ctext x='32' y='42' font-family='Space Grotesk, sans-serif' font-weight='800' font-size='26' text-anchor='middle' fill='%230B0F14'%3ETR%3C/text%3E%3C/svg%3E">
${jsonLdBlock}
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA_ID}');
</script>
</head>
<body>

<header class="nav">
  <div class="nav-inner">
    <a class="logo-wrap" href="/" style="text-decoration:none;color:inherit">
      <span class="logo-bars" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="logo">Thallis Ribeiro</span>
    </a>
    <nav class="nav-links" aria-label="Seções">
      <a href="/blog/">Blog</a>
      <a href="/#projetos">Projetos</a>
      <a href="/#sobre">Sobre</a>
      <a href="/trabalhe-comigo/">Trabalhe comigo</a>
    </nav>
    <a class="btn btn-primary btn-nav" href="/maquina-de-distribuicao/" data-ev="distribution_product_clicked" data-ev-local="nav">Máquina de Distribuição</a>
  </div>
</header>

<main>
${body}
</main>

<footer class="footer">
  <span>Thallis Ribeiro © ${new Date().getFullYear()}</span>
  <a class="footer-social" href="/blog/">Blog</a>
  <a class="footer-social" href="/feed.xml"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11a9 9 0 019 9M4 4a16 16 0 0116 16"/><circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none"/></svg>RSS</a>
  <a class="footer-social" href="https://instagram.com/thallis.lab" target="_blank" rel="noopener"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>@thallis.lab</a>
  <a class="footer-social" href="https://www.linkedin.com/in/thallisribeiro/" target="_blank" rel="noopener"><svg class="ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.4 20.4h-3.5v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2 2 0 110-4.1 2 2 0 010 4.1zM7.1 20.4H3.6V9h3.5v11.4z"/></svg>LinkedIn</a>
</footer>

<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js" defer></script>
<script src="/assets/main.js" defer></script>
<script src="/assets/movimento.js" defer></script>
</body>
</html>
`;
}

// ── Captura de e-mail ─────────────────────────────────────────────────────
// A unica coisa deste site que vira ativo. Google e Instagram decidem quem ve
// o blog; a lista nao. A isca e o kit da ficha de apuracao: os dois arquivos
// prontos, nao a explicacao (essa continua aberta em /ficha-de-apuracao/,
// onde esta escrito que nao pede e-mail -- a promessa fica de pe).
//
// LISTA.usuario vazio => nenhum formulario e renderizado e o CTA antigo
// continua no lugar. Formulario que engole e-mail sem destino e pior que
// formulario nenhum, entao o site nunca mostra um.
const LISTA = {
  // Buttondown: gratis ate 100 inscritos, exporta a lista inteira em CSV,
  // form e POST puro (funciona sem JS). Criar conta e por o usuario aqui.
  usuario: '',
  endpoint(u) { return `https://buttondown.com/api/emails/embed-subscribe/${u}`; },
};

function blocoCaptura(local) {
  if (!LISTA.usuario) return '';
  const id = `captura-${local}`;
  return `<aside class="captura" id="${id}">
    <p class="captura-olho">A ficha de apuração</p>
    <p class="captura-titulo">O documento que eu preencho antes de escrever qualquer coisa</p>
    <p class="captura-texto">O template em branco e um exemplo preenchido de verdade: a apuração que virou artigo, carrossel e Reel sem ninguém reescrever a pesquisa. Chega no seu e-mail agora.</p>
    <form class="captura-form" method="post" action="${LISTA.endpoint(LISTA.usuario)}" target="_blank" data-captura data-captura-local="${local}">
      <label class="visually-hidden" for="${id}-email">Seu e-mail</label>
      <input class="captura-input" id="${id}-email" type="email" name="email" required autocomplete="email" placeholder="seu@email.com">
      <input type="hidden" name="metadata__origem" value="${local}">
      <input class="captura-isca" type="text" name="empresa" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="btn btn-primary" type="submit" data-ev="lead_magnet_submitted" data-ev-local="${local}">Receber a ficha</button>
    </form>
    <p class="captura-nota">Também recebe o post quando sai um que presta. Sai num clique, e eu não mando o seu e-mail pra lugar nenhum.</p>
  </aside>`;
}

// A pagina da ficha e estatica, mas o formulario tem que sair do mesmo lugar
// que o dos posts: endpoint duplicado e endpoint que um dia diverge.
function injetarNaFicha() {
  const alvo = path.join(ROOT, 'ficha-de-apuracao', 'index.html');
  if (!fs.existsSync(alvo)) return;
  const antes = fs.readFileSync(alvo, 'utf8');
  const bloco = blocoCaptura('ficha');
  const depois = antes.replace(
    /<!-- CAPTURA_INICIO -->[\s\S]*?<!-- CAPTURA_FIM -->/,
    `<!-- CAPTURA_INICIO -->\n      ${bloco}\n      <!-- CAPTURA_FIM -->`
  );
  if (depois !== antes) {
    fs.writeFileSync(alvo, depois);
    console.log('  ficha-de-apuracao: captura ' + (bloco ? 'inserida' : 'removida (LISTA.usuario vazio)'));
  }
}

// CTA de fim de artigo. O padrão é a tese; um artigo sobrescreve pondo
// `cta: trabalhe-comigo` no frontmatter. Fica DEPOIS do texto e dos botões de
// compartilhar, de propósito: primeiro entrega o valor, depois oferece o próximo passo.
// Nunca no meio da leitura, nunca cobrindo o conteúdo.
const CTAS = {
  distribuicao: {
    frase: '<span class="fria">Construir ficou barato.</span> <span class="quente">Distribuir virou o gargalo.</span>',
    texto: 'Estou construindo um sistema que transforma uma apuração só em publicação em vários canais. É ele que publica este blog.',
    rotulo: 'Conhecer a Máquina de Distribuição',
    href: '/maquina-de-distribuicao/',
    evento: 'distribution_product_clicked',
    externo: false,
  },
  'trabalhe-comigo': {
    frase: '<span class="quente">Prefere que eu faça?</span>',
    texto: 'Pego poucos projetos por vez: site, landing page, produto, automação e sistema de distribuição.',
    rotulo: 'Trabalhar comigo',
    href: '/trabalhe-comigo/',
    evento: 'work_with_me_clicked',
    externo: false,
  },
};

// CTA do INDICE do blog. A auditoria de 30/08 achou o buraco mais caro do site:
// o indice tem 48 posts e 12.000px de pagina, e o unico caminho de saida era o
// link da nav. Quem gostou do que leu nao tinha onde continuar -- e o blog e
// justamente o motor de audiencia da casa.
//
// Os dois proximos passos sao de compromissos diferentes de proposito: um caro
// (entrar na lista do produto) e um barato (seguir em outro lugar). Sem o barato,
// quem ainda nao confia sai e nao volta.
function ctaDoIndice() {
  return `<aside class="cta-tese">
    <p class="cta-tese-frase"><span class="fria">Construir ficou barato.</span> <span class="quente">Distribuir virou o gargalo.</span></p>
    <p class="cta-tese-texto">Este blog é a saída de uma esteira que apura, checa e publica sozinha. Estou transformando isso em produto e escrevendo o processo aqui enquanto acontece.</p>
    <a class="btn btn-primary btn-lg" href="/maquina-de-distribuicao/" data-ev="distribution_product_clicked" data-ev-local="indice-blog">Conhecer a Máquina de Distribuição</a>
    ${blocoCaptura('indice-blog')}
    <p class="cta-tese-seguir">Ou me acompanhe em
      <a href="https://www.linkedin.com/in/thallisribeiro/" target="_blank" rel="noopener" data-ev="social_clicked" data-ev-local="linkedin">LinkedIn</a>,
      <a href="https://instagram.com/thallis.lab" target="_blank" rel="noopener" data-ev="social_clicked" data-ev-local="instagram">Instagram</a>
      e <a href="/feed.xml" data-ev="social_clicked" data-ev-local="rss">RSS</a>.</p>
  </aside>`;
}

function ctaDoPost(post) {
  // Quem acabou de ler tem a maior intencao do dia. Um pedido so: o e-mail.
  // Post com `cta:` no frontmatter mantem o dele (intencao de servico e outra
  // conversa, e nao vale trocar por captura).
  if (!post.cta) {
    const captura = blocoCaptura('fim-de-artigo');
    if (captura) return captura;
  }
  const c = CTAS[post.cta] || CTAS.distribuicao;
  const alvo = c.externo ? ' target="_blank" rel="noopener"' : '';
  return `<aside class="cta-tese">
    <p class="cta-tese-frase">${c.frase}</p>
    <p class="cta-tese-texto">${esc(c.texto)}</p>
    <a class="btn btn-primary btn-lg" href="${c.href}"${alvo} data-ev="${c.evento}" data-ev-local="fim-de-artigo">${esc(c.rotulo)}</a>
  </aside>`;
}

function temaPill(tema) {
  return tema ? `<a class="tema-pill" href="/blog/tema/${slugify(tema)}/">${esc(tema)}</a>` : '';
}

// Capa de cada post: a imagem propria do frontmatter quando existe, senao a
// capa gerada a partir do TITULO e do TEMA reais (assets/capas/<slug>.webp).
// Nenhum dos 49 posts tinha imagem, e o indice era 12.000px de texto puro --
// isto nao e ilustracao inventada, e a tipografia do site aplicada ao texto do
// proprio post, mesma logica de uma imagem de compartilhamento.
function capaDoPost(post) {
  if (post.image) return esc(post.image);
  const gerada = path.join(ROOT, 'assets', 'capas', post.slug + '.webp');
  return fs.existsSync(gerada) ? `/assets/capas/${post.slug}.webp` : '';
}

function postCard(post) {
  const capa = capaDoPost(post);
  const thumb = capa ? `<a href="/blog/${post.slug}/" class="blog-card-thumb" tabindex="-1" aria-hidden="true"><img src="${capa}" alt="" width="600" height="338" loading="lazy" decoding="async"></a>` : '';
  return `<article class="blog-card">
  ${thumb}
  <div class="blog-card-meta">
    <span class="blog-card-date">${formatDate(post.date)} · ${post.readingTime} min de leitura</span>
    ${temaPill(post.tema)}
  </div>
  <h2><a href="/blog/${post.slug}/">${esc(post.title)}</a></h2>
  <p>${esc(post.summary)}</p>
  <a class="blog-card-link" href="/blog/${post.slug}/">Ler →</a>
</article>`;
}

// Sidebar de temas — usada no índice do blog e nas páginas por tema.
function sidebarTemas(temaCounts, temaAtual) {
  if (temaCounts.length === 0) return '';
  const itens = temaCounts.map(({ tema, slug, count }) => {
    const ativo = slug === temaAtual ? ' class="tema-link ativo"' : ' class="tema-link"';
    return `<li><a href="/blog/tema/${slug}/"${ativo}>${esc(tema)} <span class="tema-count">${count}</span></a></li>`;
  }).join('\n');
  return `
      <aside class="blog-sidebar">
        <h2 class="sidebar-title">Temas</h2>
        <ul class="tema-list">
          <li><a href="/blog/" class="tema-link${temaAtual ? '' : ' ativo'}">Todos os posts</a></li>
          ${itens}
        </ul>
        <a class="sidebar-rss" href="/feed.xml">Assinar por RSS →</a>
      </aside>`;
}

// Posts relacionados: mesmo tema primeiro (mais recentes), completa com os mais
// recentes de qualquer tema até 3, nunca inclui o próprio post.
// Palavras de conteudo de um texto: sem acento, sem palavra curta, sem as
// que aparecem em quase todo post daqui (elas nao distinguem nada).
const VAZIAS = new Set(['para','como','isso','esse','essa','mais','pelo','pela','uma','que','com','por','dos','das','nao','sem','the','sobre','quando','porque','entre','depois','antes','todo','toda','cada','meu','minha','seu','sua','voce','aqui','agora','ainda','ate','fazer','feito','virou','vira','sai','saiu','tem','ter','foi','era','ser','estar','esta','ia','site','post','posts','blog']);

function palavrasDe(txt) {
  return new Set(String(txt || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !VAZIAS.has(w)));
}

// Quanto dois posts tem a ver. Tema igual pesa, mas nao decide sozinho: dois
// posts do mesmo tema podem nao ter nada em comum, e dois de temas diferentes
// podem tratar do mesmo caso.
function pontuarRelacao(a, b) {
  const pa = palavrasDe(a.title + ' ' + a.summary);
  const pb = palavrasDe(b.title + ' ' + b.summary);
  let comuns = 0;
  pa.forEach(w => { if (pb.has(w)) comuns++; });
  return comuns * 2 + (a.tema && a.tema === b.tema ? 3 : 0);
}

function postsRelacionados(post, todos) {
  return todos
    .filter(p => p.slug !== post.slug)
    .map(p => ({ p, nota: pontuarRelacao(post, p) }))
    .sort((x, y) => y.nota - x.nota || y.p.date.localeCompare(x.p.date))
    .slice(0, 3)
    .map(x => x.p);
}

// Link no MEIO do texto, que e onde a pessoa de fato clica: o bloco do rodape
// so pega quem chegou ate o fim. Entra depois do 3o paragrafo, uma vez por
// post, e so quando ha relacao de verdade (nota minima) e texto suficiente pra
// nao interromper uma leitura curta.
function linkNoMeio(post, todos, html) {
  const paras = (html.match(/<\/p>/g) || []).length;
  if (paras < 6) return html;

  const alvo = todos
    .filter(p => p.slug !== post.slug)
    .map(p => ({ p, nota: pontuarRelacao(post, p) }))
    .sort((x, y) => y.nota - x.nota)[0];
  if (!alvo || alvo.nota < 6) return html;

  const bloco = `<aside class="leia-tambem"><span class="leia-rotulo">Leia também</span>`
    + `<a href="/blog/${alvo.p.slug}/" data-ev="article_clicked" data-ev-local="no-meio">${esc(alvo.p.title)}</a></aside>`;

  let n = 0;
  return html.replace(/<\/p>/g, (m) => (++n === 3 ? m + bloco : m));
}

function main() {
  if (!fs.existsSync(POSTS_DIR)) { console.error('content/posts/ não existe'); process.exit(1); }
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  const posts = files.map(f => {
    const slug = f.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8');
    const { meta, body } = parseFrontmatter(raw);
    if (!meta.title || !meta.date) { console.error(`[skip] ${f} — falta title ou date no frontmatter`); return null; }
    return {
      slug, title: meta.title, date: meta.date, summary: meta.summary || '',
      image: meta.image || '', imageCredit: meta.image_credit || '', tema: meta.tema || '',
      cta: (meta.cta || '').trim().toLowerCase(),
      readingTime: tempoDeLeitura(body), html: mdToHtml(body),
    };
  }).filter(Boolean).sort((a, b) => b.date.localeCompare(a.date));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Contagem de temas (ordenado por quantidade, depois alfabético) — usado na sidebar.
  const temaCountMap = new Map();
  for (const p of posts) {
    if (!p.tema) continue;
    temaCountMap.set(p.tema, (temaCountMap.get(p.tema) || 0) + 1);
  }
  const temaCounts = [...temaCountMap.entries()]
    .map(([tema, count]) => ({ tema, slug: slugify(tema), count }))
    .sort((a, b) => b.count - a.count || a.tema.localeCompare(b.tema));

  // Páginas de post
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const anterior = posts[i + 1]; // mais antigo (array já ordenado do mais novo pro mais antigo)
    const proximo = posts[i - 1];  // mais novo
    const postDir = path.join(OUT_DIR, post.slug);
    fs.mkdirSync(postDir, { recursive: true });
    const heroImg = post.image
      ? `<figure class="blog-hero-img"><img src="${esc(post.image)}" alt="${esc(post.title)}" loading="eager"><figcaption>${post.imageCredit || ''}</figcaption></figure>`
      : '';
    const canonical = `${SITE_URL}/blog/${post.slug}/`;
    const relacionados = postsRelacionados(post, posts);
    const relacionadosBlock = relacionados.length ? `
      <section class="blog-related">
        <h2 class="sidebar-title">Continue lendo</h2>
        <div class="blog-list blog-list-related">
          ${relacionados.map(postCard).join('\n')}
        </div>
      </section>` : '';
    const navLinks = (anterior || proximo) ? `
      <nav class="blog-post-nav" aria-label="Navegação entre posts">
        ${proximo ? `<a class="blog-post-nav-link blog-post-nav-next" href="/blog/${proximo.slug}/"><span>Próximo</span>${esc(proximo.title)}</a>` : '<span></span>'}
        ${anterior ? `<a class="blog-post-nav-link blog-post-nav-prev" href="/blog/${anterior.slug}/"><span>Anterior</span>${esc(anterior.title)}</a>` : ''}
      </nav>` : '';
    const body = `
  <article class="section blog-article-wrap">
    <div class="section-inner section-narrow">
      <a class="blog-back" href="/blog/">← Todo o blog</a>
      <h1 class="blog-title">${esc(post.title)}</h1>
      <p class="blog-byline">Por Thallis Ribeiro · ${formatDate(post.date)} · ${post.readingTime} min de leitura${post.tema ? ` · ${temaPill(post.tema)}` : ''}</p>
      ${heroImg}
      <div class="blog-article">${linkNoMeio(post, posts, post.html)}</div>
      ${shareButtons(post, canonical)}
      ${ctaDoPost(post)}
      ${navLinks}
      ${relacionadosBlock}
    </div>
  </article>`;
    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.summary,
        datePublished: post.date,
        dateModified: post.date,
        mainEntityOfPage: canonical,
        image: post.image || DEFAULT_OG_IMAGE,
        author: { '@id': `${SITE_URL}/#person` },
        publisher: { '@id': `${SITE_URL}/#person` },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog/` },
          { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
        ],
      },
    ];
    const html = shell({
      title: `${post.title} — Blog ThallisRibeiro`,
      description: post.summary,
      ogType: 'article',
      canonical,
      body,
      jsonLd,
      ogImage: post.image || DEFAULT_OG_IMAGE,
      // Imagem própria (ex: Unsplash) não tem dimensão fixa conhecida — omite
      // og:image:width/height nesse caso em vez de declarar um tamanho errado.
      ogImageWidth: post.image ? null : 1200,
      ogImageHeight: post.image ? null : 630,
    });
    fs.writeFileSync(path.join(postDir, 'index.html'), html);
    console.log(`[gerado] /blog/${post.slug}/`);
  }

  // Índice do blog (e páginas por tema, mesmo template com filtro)
  function paginaDeLista({ postsFiltrados, temaAtual, urlPath, title, description, heading, lead }) {
    const body = `
  <section class="section blog-hero">
    <div class="section-inner">
      <h1>${heading}</h1>
      <p class="section-lead">${lead}</p>
    </div>
  </section>
  <section class="section section-alt">
    <div class="section-inner blog-layout">
      <div class="blog-list">
        ${postsFiltrados.length ? postsFiltrados.map(postCard).join('\n') : '<p class="section-lead">Nenhum post ainda — o primeiro sai em breve.</p>'}
      </div>
      ${sidebarTemas(temaCounts, temaAtual)}
    </div>
  </section>
  <section class="section">
    <div class="section-inner section-narrow">
      ${ctaDoIndice()}
    </div>
  </section>`;
    return shell({
      title,
      description,
      canonical: `${SITE_URL}${urlPath}`,
      body,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          '@id': `${SITE_URL}/blog/#blog`,
          url: `${SITE_URL}${urlPath}`,
          name: title,
          publisher: { '@id': `${SITE_URL}/#person` },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog/` },
          ],
        },
      ],
    });
  }

  const indexHtml = paginaDeLista({
    postsFiltrados: posts,
    temaAtual: null,
    urlPath: '/blog/',
    title: 'Blog — ThallisRibeiro',
    description: 'O que eu vou construindo, testando e aprendendo sobre site, conteúdo e automação com IA.',
    heading: 'Blog',
    lead: 'O que eu vou construindo, testando e aprendendo — site, conteúdo e automação com IA. Publicado assim que sai do forno, sem enrolação.',
  });
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHtml);
  console.log(`[gerado] /blog/ (${posts.length} post${posts.length===1?'':'s'})`);

  // Páginas por tema
  for (const { tema, slug } of temaCounts) {
    const postsFiltrados = posts.filter(p => p.tema === tema);
    const temaDir = path.join(OUT_DIR, 'tema', slug);
    fs.mkdirSync(temaDir, { recursive: true });
    const html = paginaDeLista({
      postsFiltrados,
      temaAtual: slug,
      urlPath: `/blog/tema/${slug}/`,
      title: `${tema} — Blog ThallisRibeiro`,
      description: `Posts do blog sobre ${tema}.`,
      heading: tema,
      lead: `${postsFiltrados.length} post${postsFiltrados.length === 1 ? '' : 's'} sobre ${tema}.`,
    });
    fs.writeFileSync(path.join(temaDir, 'index.html'), html);
  }
  console.log(`[gerado] ${temaCounts.length} página(s) de tema`);

  // RSS
  const rssItems = posts.slice(0, 20).map(p => `  <item>
    <title>${esc(p.title)}</title>
    <link>${SITE_URL}/blog/${p.slug}/</link>
    <guid>${SITE_URL}/blog/${p.slug}/</guid>
    <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    <description>${esc(p.summary)}</description>
  </item>`).join('\n');
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>Blog — ThallisRibeiro</title>
  <link>${SITE_URL}/blog/</link>
  <description>O que eu vou construindo, testando e aprendendo sobre site, conteúdo e automação com IA.</description>
  <language>pt-BR</language>
${rssItems}
</channel></rss>
`;
  fs.writeFileSync(path.join(ROOT, 'feed.xml'), rss);
  console.log(`[gerado] feed.xml (${posts.length ? Math.min(posts.length, 20) : 0} itens)`);

  // Sitemap
  const urls = [
    { loc: `${SITE_URL}/`, lastmod: posts[0]?.date },
    { loc: `${SITE_URL}/blog/`, lastmod: posts[0]?.date },
    { loc: `${SITE_URL}/maquina-de-distribuicao/` },
    { loc: `${SITE_URL}/trabalhe-comigo/` },
    { loc: `${SITE_URL}/ficha-de-apuracao/` },
    ...posts.map(p => ({ loc: `${SITE_URL}/blog/${p.slug}/`, lastmod: p.date })),
    ...temaCounts.map(t => ({ loc: `${SITE_URL}/blog/tema/${t.slug}/`, lastmod: posts[0]?.date })),
  ];
  // PROVA, injetada do dado real. Numero escrito a mao envelhece e vira mentira:
  // "49 posts" fica errado no dia seguinte. Daqui sai sempre o que o blog TEM.
  //
  // Isto e a autoridade que o site nao mostrava: 49 posts em 21 dias e a propria
  // tese ("distribuir e o gargalo") demonstrada, e qualquer visitante confere
  // contando o blog.
  if (fs.existsSync(path.join(ROOT, 'index.html'))) {
    const datas = posts.map((p) => p.date).sort();
    const dias = Math.max(1, Math.round((new Date(datas[datas.length - 1]) - new Date(datas[0])) / 86400000));
    const HOME_P = path.join(ROOT, 'index.html');
    let h = fs.readFileSync(HOME_P, 'utf-8');
    const iniP = '<!-- PROVA_INICIO -->', fimP = '<!-- PROVA_FIM -->';
    const a1 = h.indexOf(iniP), b1 = h.indexOf(fimP);
    if (a1 !== -1 && b1 > a1) {
      const bloco = `${iniP}
        <div class="prova-item"><span class="prova-num">${posts.length}</span><span class="prova-rot">posts publicados</span></div>
        <div class="prova-item"><span class="prova-num">${dias}</span><span class="prova-rot">dias no ar</span></div>
        <div class="prova-item"><span class="prova-num">${temaCounts.length}</span><span class="prova-rot">temas</span></div>
        <div class="prova-item"><span class="prova-num">3</span><span class="prova-rot">sites em produção</span></div>
        ${fimP}`;
      h = h.slice(0, a1) + bloco + h.slice(b1 + fimP.length);
      fs.writeFileSync(HOME_P, h);

      // Mesma prova na pagina do produto. La ela pesa mais: e a pagina que
      // promete um sistema de distribuicao sem mostrar distribuicao nenhuma.
      const PROD = path.join(ROOT, 'maquina-de-distribuicao', 'index.html');
      if (fs.existsSync(PROD)) {
        let d = fs.readFileSync(PROD, 'utf-8');
        const a2 = d.indexOf(iniP), b2 = d.indexOf(fimP);
        if (a2 !== -1 && b2 > a2) {
          fs.writeFileSync(PROD, d.slice(0, a2) + bloco + d.slice(b2 + fimP.length));
        }
      }
      console.log(`[gerado] prova: ${posts.length} posts em ${dias} dias`);
    } else {
      console.error('[erro] index.html sem marcadores de prova');
      process.exitCode = 1;
    }
  }

  // Home: a lista de "Ultimas ideias" e INJETADA aqui, entre marcadores, em vez de
  // escrita a mao no index.html. Lista escrita a mao envelhece em silencio -- publica
  // um post e a home continua mostrando os de tres semanas atras. Assim ela nunca mente.
  const HOME = path.join(ROOT, 'index.html');
  if (fs.existsSync(HOME)) {
    const html = fs.readFileSync(HOME, 'utf-8');
    const ini = '<!-- ULTIMAS_IDEIAS_INICIO -->', fim = '<!-- ULTIMAS_IDEIAS_FIM -->';
    const a0 = html.indexOf(ini), b0 = html.indexOf(fim);
    if (a0 === -1 || b0 === -1 || b0 < a0) {
      console.error('[erro] index.html sem os marcadores de ultimas ideias — home NAO atualizada');
      process.exitCode = 1;
    } else {
      const itens = posts.slice(0, 4).map(p => `        <li class="ideia">
          <a class="ideia-link" href="/blog/${p.slug}/" data-ev="article_clicked" data-ev-local="${p.slug}">
            <span class="ideia-capa">${capaDoPost(p) ? `<img src="${capaDoPost(p)}" alt="" width="600" height="338" loading="lazy" decoding="async">` : ''}</span>
            <span class="ideia-texto">
            <span class="ideia-meta">${formatDate(p.date)} · ${p.readingTime} min${p.tema ? ` · ${esc(p.tema)}` : ''}</span>
            <span class="ideia-titulo">${esc(p.title)}</span>
            <span class="ideia-resumo">${esc(p.summary)}</span>
            </span>
          </a>
        </li>`).join('\n');
      const bloco = `${ini}\n      <ul class="ideias-lista">\n${itens}\n      </ul>\n      ${fim}`;
      const novo = html.slice(0, a0) + bloco + html.slice(b0 + fim.length);
      if (novo !== html) fs.writeFileSync(HOME, novo);
      console.log(`[gerado] home: ${Math.min(posts.length, 4)} ideias recentes`);
    }
  }

  injetarNaFicha();

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ''}  </url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
  console.log(`[gerado] sitemap.xml (${urls.length} urls)`);

  // Manifesto: os arquivos que este script escreve FORA de blog/. Quem publica lê daqui
  // em vez de manter a própria lista -- duas listas escritas à mão divergem, e foi assim
  // que a página da Máquina passou um dia inteira com a prova velha enquanto a home e o
  // blog estavam certos. Só entra caminho que existe de verdade no disco.
  const gerados = ['index.html', 'maquina-de-distribuicao/index.html', 'ficha-de-apuracao/index.html',
    'feed.xml', 'sitemap.xml']
    .filter((rel) => fs.existsSync(path.join(ROOT, rel)));
  fs.writeFileSync(path.join(ROOT, '.gerados.json'), JSON.stringify(gerados, null, 2) + '\n');
  console.log(`[gerado] .gerados.json (${gerados.length} arquivos fora de blog/)`);
}

main();
