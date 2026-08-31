#!/usr/bin/env node
// Garante que um post tenha uma FOTO de verdade como capa, e grava `image:` no
// frontmatter dele. Roda na geração do post, não na build: capa é conteúdo, não layout.
//
// Por que isto existe: até 31/08 a capa de cada post era uma imagem TIPOGRÁFICA gerada a
// partir do próprio título. No índice do blog o resultado era o título escrito duas
// vezes, lado a lado consigo mesmo -- a mesma informação ocupando o dobro do espaço e
// entregando zero. Miniatura existe pra dar o que o texto não dá.
//
// Ordem das fontes, da melhor pra pior:
//   1. `image:` já no frontmatter  -> respeita, não mexe
//   2. imagem irmã do content-hub  -> a esteira já gerou uma imagem dirigida pra essa
//      mesma pauta (o visual.md escolhe a cena). É a melhor que existe e é local.
//   3. nada                        -> post sem capa. Capa errada custa mais que capa
//      nenhuma: ver o comentário sobre o Openverse no fim deste arquivo.
//
// Uso:
//   node capa-do-post.js content/posts/<slug>.md          uma
//   node capa-do-post.js --todos                          todas as que faltam
//   node capa-do-post.js --self-test

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = __dirname;
const POSTS = path.join(ROOT, 'content', 'posts');
const DESTINO = path.join(ROOT, 'assets', 'posts');
const GERADO_IA = 'C:\\Users\\thall\\Documents\\Squads100\\_contenthub\\_clientes\\thallisribeiro\\assets\\gerado-ia';

// 1200x675: 16:9 no tamanho que o card (600x338) e o og:image usam sem esticar.
const LARGURA = 1200, ALTURA = 675;

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

// ── fonte 2: a imagem que a esteira já gerou pra essa pauta ──────────────────
function doContentHub(slug) {
  if (!fs.existsSync(GERADO_IA)) return null;
  const alvo = normalizar(slug).replace(/\s+/g, '-');
  const arquivos = fs.readdirSync(GERADO_IA).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  // Casa por prefixo comum longo: o nome do arquivo costuma ser o assunto, não o slug
  // inteiro ("80-acres-farms.jpg" para "dez-anos-provando-que-...").
  let melhor = null, melhorNota = 0;
  for (const f of arquivos) {
    const base = normalizar(path.parse(f).name).replace(/\s+/g, '-');
    const pedacos = base.split('-').filter((p) => p.length >= 4);
    const nota = pedacos.filter((p) => alvo.includes(p)).length;
    if (nota > melhorNota) { melhorNota = nota; melhor = path.join(GERADO_IA, f); }
  }
  return melhorNota >= 2 ? melhor : null;
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
function recortar(entrada, saida) {
  const r = spawnSync('ffmpeg', ['-y', '-i', entrada,
    '-vf', `scale=${LARGURA}:-1:flags=lanczos,crop=${LARGURA}:${ALTURA}:0:'min(ih-${ALTURA},ih*0.18)'`,
    '-frames:v', '1', saida], { encoding: 'utf8' });
  return r.status === 0 && fs.existsSync(saida);
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
  if (post.meta.image) return { slug, estado: 'já tinha' };

  fs.mkdirSync(DESTINO, { recursive: true });
  const saida = path.join(DESTINO, `${slug}.webp`);
  const publico = `/assets/posts/${slug}.webp`;

  const local = doContentHub(slug);
  if (local && recortar(local, saida)) {
    gravarImagem(arquivo, post, publico);
    return { slug, estado: 'esteira', origem: path.basename(local) };
  }

  const doUnsplash = await viaUnsplash(post.meta, slug, saida);
  if (doUnsplash) { gravarImagem(arquivo, post, publico); return { slug, estado: 'unsplash', autor: doUnsplash }; }

  return { slug, estado: 'sem capa' };
}

// Só roda se UNSPLASH_ACCESS_KEY existir no .env: buscar-imagem.js já trata a API inteira
// (inclusive o endpoint de download, que é obrigatório pelas diretrizes, não opcional).
async function viaUnsplash(meta, slug, saida) {
  if (!fs.existsSync(path.join(ROOT, '.env')) ||
      !/UNSPLASH_ACCESS_KEY=\S/.test(fs.readFileSync(path.join(ROOT, '.env'), 'utf8'))) return null;
  const termos = palavrasDe(meta);
  if (!termos.length) return null;
  const r = spawnSync(process.execPath, [path.join(ROOT, 'buscar-imagem.js'), termos.join(' ')], { encoding: 'utf8' });
  let achado; try { achado = JSON.parse(r.stdout); } catch { return null; }
  if (!achado || !achado.url) return null;
  const tmp = path.join(DESTINO, `.${slug}.tmp`);
  if (!await baixar(achado.url, tmp)) return null;
  const ok = recortar(tmp, saida);
  fs.unlinkSync(tmp);
  if (!ok) return null;
  fs.writeFileSync(path.join(DESTINO, `${slug}.json`),
    JSON.stringify({ autor: achado.fotografo, fonte: achado.url_unsplash, banco: 'Unsplash' }, null, 2) + '\n');
  return achado.fotografo;
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
  console.log('[capa-do-post] self-test OK — 6 casos');
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
