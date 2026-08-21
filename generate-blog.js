#!/usr/bin/env node
// Gera blog/ a partir de content/posts/*.md — rodar depois de criar/editar um post.
// Fluxo pra publicar: escrever content/posts/<slug>.md, rodar `node generate-blog.js`, git add+commit+push.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const OUT_DIR = path.join(ROOT, 'blog');
const SITE_URL = 'https://thallisribeiro.com.br';
const WA_LINK = 'https://wa.me/5573988899345?text=Oi%20ThallisRibeiro%2C%20vi%20um%20post%20do%20seu%20blog%20e%20quero%20conversar%20sobre%20um%20projeto';

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

const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/grana-case.webp`;

// ── Layout compartilhado (mesmo header/footer do site) ──
function shell({ title, description, ogType = 'website', canonical, body, jsonLd = [] }) {
  const jsonLdBlock = jsonLd.map(obj => `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`).join('\n');
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
<meta property="og:image" content="${DEFAULT_OG_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="844">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${canonical}">
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

function postCard(post) {
  return `<article class="blog-card">
  <span class="blog-card-date">${formatDate(post.date)}</span>
  <h2><a href="/blog/${post.slug}/">${esc(post.title)}</a></h2>
  <p>${esc(post.summary)}</p>
  <a class="blog-card-link" href="/blog/${post.slug}/">Ler →</a>
</article>`;
}

function main() {
  if (!fs.existsSync(POSTS_DIR)) { console.error('content/posts/ não existe'); process.exit(1); }
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  const posts = files.map(f => {
    const slug = f.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8');
    const { meta, body } = parseFrontmatter(raw);
    if (!meta.title || !meta.date) { console.error(`[skip] ${f} — falta title ou date no frontmatter`); return null; }
    return { slug, title: meta.title, date: meta.date, summary: meta.summary || '', html: mdToHtml(body) };
  }).filter(Boolean).sort((a, b) => b.date.localeCompare(a.date));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Páginas de post
  for (const post of posts) {
    const postDir = path.join(OUT_DIR, post.slug);
    fs.mkdirSync(postDir, { recursive: true });
    const body = `
  <article class="section blog-article-wrap">
    <div class="section-inner section-narrow">
      <a class="blog-back" href="/blog/">← Todo o blog</a>
      <h1 class="blog-title">${esc(post.title)}</h1>
      <p class="blog-byline">Por Thallis Ribeiro · ${formatDate(post.date)}</p>
      <div class="blog-article">${post.html}</div>
      <div class="blog-post-cta">
        <p class="cta-final-text" style="font-size:17px">Curtiu? Isso é o tipo de coisa que eu também construo pra quem me chama.</p>
        <a class="btn btn-primary btn-lg" href="${WA_LINK}" target="_blank" rel="noopener">Chamar no WhatsApp agora →</a>
      </div>
    </div>
  </article>`;
    const canonical = `${SITE_URL}/blog/${post.slug}/`;
    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.summary,
        datePublished: post.date,
        dateModified: post.date,
        mainEntityOfPage: canonical,
        image: DEFAULT_OG_IMAGE,
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
    });
    fs.writeFileSync(path.join(postDir, 'index.html'), html);
    console.log(`[gerado] /blog/${post.slug}/`);
  }

  // Índice do blog
  const indexBody = `
  <section class="section blog-hero">
    <div class="section-inner section-narrow">
      <h1>Blog</h1>
      <p class="section-lead">O que eu vou construindo, testando e aprendendo — site, conteúdo e automação com IA. Publicado assim que sai do forno, sem enrolação.</p>
    </div>
  </section>
  <section class="section section-alt">
    <div class="section-inner section-narrow">
      <div class="blog-list">
        ${posts.length ? posts.map(postCard).join('\n') : '<p class="section-lead">Nenhum post ainda — o primeiro sai em breve.</p>'}
      </div>
    </div>
  </section>`;
  const indexHtml = shell({
    title: 'Blog — ThallisRibeiro',
    description: 'O que eu vou construindo, testando e aprendendo sobre site, conteúdo e automação com IA.',
    canonical: `${SITE_URL}/blog/`,
    body: indexBody,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        '@id': `${SITE_URL}/blog/#blog`,
        url: `${SITE_URL}/blog/`,
        name: 'Blog — ThallisRibeiro',
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
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHtml);
  console.log(`[gerado] /blog/ (${posts.length} post${posts.length===1?'':'s'})`);

  // Sitemap
  const urls = [
    { loc: `${SITE_URL}/`, lastmod: posts[0]?.date },
    { loc: `${SITE_URL}/blog/`, lastmod: posts[0]?.date },
    ...posts.map(p => ({ loc: `${SITE_URL}/blog/${p.slug}/`, lastmod: p.date })),
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ''}  </url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
  console.log(`[gerado] sitemap.xml (${urls.length} urls)`);
}

main();
