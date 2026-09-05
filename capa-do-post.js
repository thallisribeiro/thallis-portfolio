#!/usr/bin/env node
// Garante que um post tenha uma FOTO de verdade como capa, e grava `image:` no
// frontmatter dele. Roda na geração do post, não na build: capa é conteúdo, não layout.
//
// Por que isto existe: até 31/08 a capa de cada post era uma imagem TIPOGRÁFICA gerada a
// partir do próprio título. No índice do blog o resultado era o título escrito duas
// vezes, lado a lado consigo mesmo -- a mesma informação ocupando o dobro do espaço e
// entregando zero. Miniatura existe pra dar o que o texto não dá.
//
// Uma fonte só, por decisão do Thallis em 31/08 ("o banco tá ótimo, não precisa gerar
// nada"): o banco Magnific/Freepik. Antes havia FLUX local e reaproveitamento da imagem
// da esteira; os dois saíram. Uma fonte não tem como divergir da outra.
//
//   1. `image:` já no frontmatter -> respeita, não mexe (salvo `--carrossel`, abaixo)
//   2. capa do carrossel irmão     -> a foto que a esteira já escolheu pra peça (Thallis,
//      05/09/2026: "usa a mesma do carrossel pra facilitar"). Recorte do topo do slide 1,
//      que é a foto sem o texto. Peça vem do `peca:` do frontmatter ou do slug do título.
//   3. banco Magnific/Freepik     -> foto editorial, só pra post sem peça na esteira
//   4. nada                       -> post sem capa. Capa errada custa mais que capa
//      nenhuma: ver o comentário sobre o Openverse mais abaixo.
//
// Uso:
//   node capa-do-post.js content/posts/<slug>.md          uma
//   node capa-do-post.js --todos                          todas as que faltam
//   node capa-do-post.js --todos --carrossel              refaz pela capa do carrossel quem tem peça
//   node capa-do-post.js --self-test

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = __dirname;
const POSTS = path.join(ROOT, 'content', 'posts');
const DESTINO = path.join(ROOT, 'assets', 'posts');

// 1200x675: 16:9 no tamanho que o card (600x338) e o og:image usam sem esticar.
const LARGURA = 1200, ALTURA = 675;
const SAIDA_ESTEIRA = 'C:\\Users\\thall\\Documents\\Squads100\\_contenthub\\_clientes\\thallisribeiro\\saida';

// ── frontmatter ──────────────────────────────────────────────────────────────
function lerPost(arquivo) {
  const bruto = fs.readFileSync(arquivo, 'utf8').replace(/\r\n/g, '\n');
  const m = bruto.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;
  const meta = {};
  for (const linha of m[1].split('\n')) {
    const kv = linha.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return { meta, frontmatter: m[1], corpo: m[2], bruto };
}

function gravarImagem(arquivo, post, valor) {
  const linha = `image: ${valor}`;
  const novo = /^image:\s*/m.test(post.frontmatter)
    ? post.frontmatter.replace(/^image:\s*.*$/m, linha)
    : `${post.frontmatter}\n${linha}`;
  fs.writeFileSync(arquivo, `---\n${novo}\n---\n${post.corpo}`, 'utf8');
}

// ── palavras-chave: o Openverse indexa em inglês ─────────────────────────────
// Sem tradução por modelo: um mapa pequeno resolve o vocabulário que estes posts de fato
// usam, e palavra que não está no mapa simplesmente não entra na busca. Query curta e
// concreta acha foto melhor que query longa e abstrata.
const PT_EN = {
  robo: 'robot', robos: 'robots', agente: 'robot', agentes: 'robots',
  site: 'website', sites: 'website', blog: 'writing', post: 'writing', posts: 'writing',
  carrossel: 'smartphone', instagram: 'smartphone', linkedin: 'office',
  google: 'search', busca: 'search', seo: 'search',
  dinheiro: 'money', preco: 'price tag', precos: 'price tag', faturou: 'money',
  cliente: 'handshake', clientes: 'handshake', venda: 'handshake', vendas: 'handshake',
  agencia: 'office', empresa: 'office', empresas: 'office', negocio: 'office',
  produto: 'product design', saas: 'software', software: 'software', codigo: 'code',
  automacao: 'automation', esteira: 'conveyor belt', maquina: 'machine',
  fabrica: 'factory', carro: 'car', carros: 'car', montadora: 'car factory',
  fazenda: 'farm', agricultura: 'farm', comida: 'food',
  imobiliaria: 'real estate', imovel: 'real estate', casa: 'house',
  medico: 'doctor', saude: 'health', clinica: 'clinic',
  governo: 'government building', lei: 'law', regra: 'law',
  telefone: 'telephone', ligacao: 'telephone', whatsapp: 'smartphone',
  email: 'mailbox', lista: 'checklist', erro: 'warning sign', erros: 'warning sign',
  tempo: 'clock', dia: 'sunrise', noite: 'night city', trabalho: 'workshop',
  pessoas: 'people', funcionario: 'worker', funcionarios: 'workers', engenheiro: 'engineer',
  ia: 'artificial intelligence', inteligencia: 'artificial intelligence',
};

const VAZIAS = new Set(['que','com','por','para','uma','dos','das','nao','mais','sem','como','isso','esse','essa','pelo','pela','the','and','foi','era','ser','tem','ter','meu','minha','seu','sua','voce','eu','ele','ela','mas','ja','ate','sobre','quando','porque','entre','depois','antes','todo','toda','cada','aqui','agora','ainda']);

function normalizar(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');
}

// No máximo 3 termos: o Openverse trata a query como AND aproximado, e query longa
// devolve vazio muito mais que devolve foto boa.
function palavrasDe(post) {
  const texto = normalizar(`${post.title || ''} ${post.summary || ''}`);
  const termos = [];
  for (const p of texto.split(/\s+/)) {
    if (p.length < 3 || VAZIAS.has(p)) continue;
    const en = PT_EN[p];
    if (en && !termos.includes(en)) termos.push(en);
    if (termos.length === 3) break;
  }
  if (!termos.length && post.tema) {
    const t = normalizar(post.tema).split(/\s+/).map((p) => PT_EN[p]).filter(Boolean);
    if (t.length) termos.push(t[0]);
  }
  return termos;
}

// ── por que não existe fonte 3 ──────────────────────────────────────────────
// Tentei o Openverse (banco com licença aberta, sem chave de API) em 31/08. Pedindo a
// capa do post sobre a Ford, ele devolveu o still de vídeo de uma pessoa real
// identificável, de um centro de pesquisa, sem nenhuma relação com o assunto. O pool
// comercial dele é majoritariamente arquivo do Wikimedia: com substantivo concreto
// ("car factory", "robot") devolve foto útil, com termo abstrato devolve gente em
// palestra. Rosto de pessoa real ao lado de um artigo que não fala dela sugere uma
// associação que não existe -- isso não é risco de design, é risco de verdade.
//
// Um banco editorial de verdade (Unsplash) resolveria, e `buscar-imagem.js` neste mesmo
// repositório já implementa a API inteira, inclusive o endpoint de download que as
// diretrizes exigem. Falta só UNSPLASH_ACCESS_KEY no .env. Enquanto não houver, post sem
// imagem irmã fica sem capa, de propósito.

// ── recorte 16:9 ─────────────────────────────────────────────────────────────
// As imagens da esteira são 896x1152 (retrato, pra carrossel). Cortar o centro-alto
// preserva o sujeito: o visual.md posiciona o assunto na parte de cima do quadro.
// `topo` = fração da altura onde o recorte começa. Foto de banco: 0.18 (tira céu/margem).
// Slide de carrossel (4:5, texto embaixo): 0, pra ficar só a foto e nenhuma letra cortada.
function recortar(entrada, saida, topo = 0.18) {
  // `force_original_aspect_ratio=increase` cobre o quadro nas DUAS orientações. A versão
  // anterior escalava só pela largura, então foto mais larga que 16:9 virava 1200x673 e o
  // crop de 675 estourava a altura -- ffmpeg falhava e o post ficava sem capa em silêncio.
  // Foi o que aconteceu com 7 dos 53 posts.
  const r = spawnSync('ffmpeg', ['-y', '-i', entrada,
    '-vf', `scale=${LARGURA}:${ALTURA}:force_original_aspect_ratio=increase:flags=lanczos,`
         + `crop=${LARGURA}:${ALTURA}:(iw-${LARGURA})/2:'min(ih-${ALTURA},ih*${topo})'`,
    '-frames:v', '1', saida], { encoding: 'utf8' });
  return r.status === 0 && fs.existsSync(saida);
}

// Mesmo slug que o ensure-queue usa pra nomear o post: é como se acha a peça de um post
// publicado antes de existir o campo `peca:`.
function slugificar(texto) {
  return String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
}

let indiceDePecas = null;
function pecaDoPost(meta, slug, saida = SAIDA_ESTEIRA) {
  if (meta.peca && fs.existsSync(path.join(saida, meta.peca, 'carrossel', 'slide-01.png'))) return meta.peca;
  if (!fs.existsSync(saida)) return null;
  if (!indiceDePecas) {
    indiceDePecas = new Map();
    for (const dia of fs.readdirSync(saida).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))) {
      for (const id of fs.readdirSync(path.join(saida, dia))) {
        const art = path.join(saida, dia, id, 'artigo', 'artigo.md');
        if (!fs.existsSync(art) || !fs.existsSync(path.join(saida, dia, id, 'carrossel', 'slide-01.png'))) continue;
        const t = fs.readFileSync(art, 'utf8').match(/^title:\s*"?(.+?)"?\s*$/m);
        if (t) indiceDePecas.set(slugificar(t[1]), `${dia}/${id}`);
      }
    }
  }
  return indiceDePecas.get(slug) || indiceDePecas.get(slugificar(meta.title || '')) || null;
}

// A foto ORIGINAL da capa (roteiro.json, slides[0].imagem: URL do banco ou arquivo local)
// vem primeiro. O slide montado é o plano B: nele a foto está sob o scrim escuro e com
// texto por cima, e em peça de capa escura vira um retângulo preto no índice do blog.
async function fotoDaCapa(peca, tmp) {
  try {
    const r = JSON.parse(fs.readFileSync(path.join(SAIDA_ESTEIRA, peca, 'carrossel', 'roteiro.json'), 'utf8'));
    const img = String(((r.slides || [])[0] || {}).imagem || '');
    if (/^https?:\/\//.test(img)) return (await baixar(img, tmp)) ? { arquivo: tmp, topo: 0.18 } : null;
    if (img && fs.existsSync(img)) return { arquivo: img, topo: 0.18 };
  } catch { /* sem roteiro legível */ }
  return null;
}

async function viaCarrossel(meta, slug, saida) {
  const peca = pecaDoPost(meta, slug);
  if (!peca) return null;
  const tmp = path.join(DESTINO, `.${slug}.capa.tmp`);
  const foto = (await fotoDaCapa(peca, tmp)) || { arquivo: path.join(SAIDA_ESTEIRA, peca, 'carrossel', 'slide-01.png'), topo: 0 };
  const ok = recortar(foto.arquivo, saida, foto.topo);
  try { fs.unlinkSync(tmp); } catch {}
  if (!ok) return null;
  // Crédito de banco não vale mais pra esta capa: a foto é da própria peça.
  try { fs.unlinkSync(path.join(DESTINO, `${slug}.json`)); } catch {}
  return { peca };
}

async function baixar(url, destino) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'thallisribeiro-blog/1.0' } });
    if (!r.ok) return false;
    fs.writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
    return true;
  } catch { return false; }
}

async function capaDe(arquivo) {
  const post = lerPost(arquivo);
  if (!post) return { slug: path.parse(arquivo).name, estado: 'sem frontmatter' };
  const slug = path.parse(arquivo).name;
  const refazer = process.argv.includes('--carrossel');
  if (post.meta.image && !refazer) return { slug, estado: 'já tinha' };

  fs.mkdirSync(DESTINO, { recursive: true });
  const saida = path.join(DESTINO, `${slug}.webp`);
  const publico = `/assets/posts/${slug}.webp`;

  const daPeca = await viaCarrossel(post.meta, slug, saida);
  if (daPeca) { gravarImagem(arquivo, post, publico); return { slug, estado: 'carrossel', origem: daPeca.peca }; }
  if (post.meta.image) return { slug, estado: 'já tinha' };

  const stock = await viaMagnific(post.meta, slug, saida);
  if (stock) { gravarImagem(arquivo, post, publico); return { slug, estado: 'magnific', autor: stock.autor, query: stock.query }; }

  return { slug, estado: 'sem capa', termos: palavrasDe(post.meta) };
}

// ── banco Magnific/Freepik ───────────────────────────────────────────────────
// A chave já existe no .env do Squads100 e responde direto na API de stock, então isto
// funciona sem MCP e sem sessão aberta: o agendador das 06:00 usa igual.
function chaveMagnific() {
  try {
    const env = fs.readFileSync('C:\\Users\\thall\\Documents\\Squads100\\.env', 'utf8');
    const m = env.match(/^MAGNIFIC_API_KEY=(\S+)/m);
    return m ? m[1] : null;
  } catch { return null; }
}

async function viaMagnific(meta, slug, saida) {
  const chave = chaveMagnific();
  if (!chave) return null;
  const termos = palavrasDe(meta);
  if (!termos.length) return null;
  const cab = { 'x-freepik-api-key': chave };

  // Mesma escada do Openverse: 3 termos, 2, 1. Query longa volta vazia.
  let escolhido = null, usada = '';
  for (let n = termos.length; n >= 1 && !escolhido; n--) {
    const q = encodeURIComponent(termos.slice(0, n).join(' '));
    const url = `https://api.freepik.com/v1/resources?term=${q}&limit=10`
      + '&filters%5Bcontent_type%5D%5Bphoto%5D=1'
      + '&filters%5Blicense%5D%5Bfreemium%5D=1'
      + '&filters%5Borientation%5D%5Blandscape%5D=1';
    try {
      const r = await fetch(url, { headers: cab });
      if (!r.ok) continue;
      const d = await r.json();
      if (d.data && d.data.length) { escolhido = d.data[0]; usada = termos.slice(0, n).join(' '); }
    } catch { /* próxima volta */ }
  }
  if (!escolhido) return null;

  let arquivo;
  try {
    const r = await fetch(`https://api.freepik.com/v1/resources/${escolhido.id}/download`, { headers: cab });
    if (!r.ok) return null;
    arquivo = (await r.json()).data;
  } catch { return null; }
  if (!arquivo || !arquivo.url) return null;

  const tmp = path.join(DESTINO, `.${slug}.tmp`);
  if (!await baixar(arquivo.url, tmp)) return null;
  const ok = recortar(tmp, saida);
  try { fs.unlinkSync(tmp); } catch {}
  if (!ok) return null;

  const autor = (escolhido.author && escolhido.author.name) || 'Freepik';
  fs.writeFileSync(path.join(DESTINO, `${slug}.json`),
    JSON.stringify({ autor, fonte: escolhido.url || '', banco: 'Freepik' }, null, 2) + '\n');
  return { autor, query: usada };
}


// ── self-test ────────────────────────────────────────────────────────────────
function selfTest() {
  const assert = require('assert');
  // 1. termo traduzido entra
  assert.ok(palavrasDe({ title: 'O robô quis parar no meio do trabalho' }).includes('robot'));
  // 2. no máximo 3 termos, senão a busca volta vazia
  assert.ok(palavrasDe({ title: 'robo site dinheiro cliente agencia produto codigo' }).length <= 3);
  // 3. palavra sem tradução não vira query (query ruim é pior que nenhuma)
  assert.deepStrictEqual(palavrasDe({ title: 'Zorplax quixote blargh' }), []);
  // 4. cai no tema quando o título não dá nada
  assert.deepStrictEqual(palavrasDe({ title: 'Zorplax quixote', tema: 'Automação de conteúdo' }), ['automation']);
  // 5. vazias não entram
  assert.ok(!palavrasDe({ title: 'que com por para uma robo' }).includes('que'));
  // 6. acento não quebra o casamento
  assert.ok(palavrasDe({ title: 'A automação da agência' }).includes('automation'));
  assert.strictEqual(slugificar('Uma IA demitiu um funcionário em San Francisco: o que aconteceu na Andon Market'), 'uma-ia-demitiu-um-funcionario-em-san-francisco-o-que-aconteceu-na-ando', 'slug igual ao do ensure-queue');
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'capa-'));
  fs.mkdirSync(path.join(tmp, '2026-09-04', 'x', 'carrossel'), { recursive: true });
  fs.mkdirSync(path.join(tmp, '2026-09-04', 'x', 'artigo'), { recursive: true });
  fs.writeFileSync(path.join(tmp, '2026-09-04', 'x', 'carrossel', 'slide-01.png'), '');
  fs.writeFileSync(path.join(tmp, '2026-09-04', 'x', 'artigo', 'artigo.md'), '---\ntitle: "Título da Peça"\n---\n');
  indiceDePecas = null;
  assert.strictEqual(pecaDoPost({ peca: '2026-09-04/x' }, 'qualquer', tmp), '2026-09-04/x', 'peca: do frontmatter vale primeiro');
  assert.strictEqual(pecaDoPost({}, 'titulo-da-peca', tmp), '2026-09-04/x', 'sem peca:, casa pelo slug do título do artigo');
  assert.strictEqual(pecaDoPost({ title: 'Outra coisa' }, 'outra-coisa', tmp), null, 'post sem peça na esteira não inventa capa');
  indiceDePecas = null;
  console.log('[capa-do-post] self-test OK — 10 casos');
}

async function main() {
  if (process.argv.includes('--self-test')) return selfTest();
  const alvo = process.argv[2];
  if (!alvo) {
    console.error('Uso: node capa-do-post.js <content/posts/slug.md> | --todos | --self-test');
    process.exit(2);
  }
  const arquivos = alvo === '--todos'
    ? fs.readdirSync(POSTS).filter((f) => f.endsWith('.md')).map((f) => path.join(POSTS, f))
    : [path.resolve(alvo)];

  const contagem = {};
  for (const a of arquivos) {
    const r = await capaDe(a);
    contagem[r.estado] = (contagem[r.estado] || 0) + 1;
    if (arquivos.length === 1 || r.estado !== 'já tinha') {
      console.log(`  ${r.estado.padEnd(14)} ${r.slug}${r.autor ? ` — foto de ${r.autor}` : ''}${r.origem ? ` — ${r.origem}` : ''}`);
    }
  }
  console.log('[capa-do-post] ' + Object.entries(contagem).map(([k, v]) => `${k}: ${v}`).join(' | '));
}

main();
