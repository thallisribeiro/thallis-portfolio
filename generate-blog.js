#!/usr/bin/env node
// Gera blog/ a partir de content/posts/*.md — rodar depois de criar/editar um post.
// Fluxo pra publicar: escrever content/posts/<slug>.md, rodar `node generate-blog.js`, git add+commit+push.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const OUT_DIR = path.join(ROOT, 'blog');
const SITE_URL = 'https://thallisribeiro.com.br';
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
</head>
<body>

<header class="nav">
  <div class="nav-inner">
    <a class="logo-wrap" href="/" style="text-decoration:none;color:inherit">
      <span class="logo-mark" aria-hidden="true">TR</span>
      <span class="logo">ThallisRibeiro</span>
    </a>
    <nav class="nav-links" aria-label="Seções">
      <a href="/#cases">Cases</a>
      <a href="/#servicos">Serviços</a>
      <a href="/#investimento">Investimento</a>
      <a href="/blog/">Blog</a>
      <a href="/#perguntas">Perguntas</a>
    </nav>
    <a class="btn btn-primary btn-nav" href="${WA_LINK}" target="_blank" rel="noopener">WhatsApp</a>
  </div>
</header>

<main>
${body}
</main>

<footer class="footer">
  <span>ThallisRibeiro © ${new Date().getFullYear()}</span>
  <a class="footer-social" href="https://instagram.com/thallis.lab" target="_blank" rel="noopener">@thallis.lab</a>
</footer>

</body>
</html>
`;
}

function temaPill(tema) {
  return tema ? `<a class="tema-pill" href="/blog/tema/${slugify(tema)}/">${esc(tema)}</a>` : '';
}

function postCard(post) {
  const thumb = post.image ? `<a href="/blog/${post.slug}/" class="blog-card-thumb"><img src="${esc(post.image)}" alt="" loading="lazy"></a>` : '';
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
function postsRelacionados(post, todos) {
  const outros = todos.filter(p => p.slug !== post.slug);
  const mesmoTema = post.tema ? outros.filter(p => p.tema === post.tema) : [];
  const resto = outros.filter(p => !mesmoTema.includes(p));
  return [...mesmoTema, ...resto].slice(0, 3);
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
      <div class="blog-article">${post.html}</div>
      ${shareButtons(post, canonical)}
      <div class="blog-post-cta">
        <p class="cta-final-text" style="font-size:17px">Curtiu? Isso é o tipo de coisa que eu também construo pra quem me chama.</p>
        <a class="btn btn-primary btn-lg" href="${WA_LINK}" target="_blank" rel="noopener">Chamar no WhatsApp agora →</a>
      </div>
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
    ...posts.map(p => ({ loc: `${SITE_URL}/blog/${p.slug}/`, lastmod: p.date })),
    ...temaCounts.map(t => ({ loc: `${SITE_URL}/blog/tema/${t.slug}/`, lastmod: posts[0]?.date })),
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ''}  </url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
  console.log(`[gerado] sitemap.xml (${urls.length} urls)`);
}

main();
