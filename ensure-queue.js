#!/usr/bin/env node
// Roda 30min antes de cada horário fixo de publicação (6:30, 11:30, 17:30). Se a fila
// (content/queue/) já tem post, não faz nada — zero custo. Se estiver vazia, decide um
// ângulo real (commits novos desde a última checagem, neste repo e no da agência) ou,
// na falta disso, pega o próximo tema evergreen da lista — e pede pro Claude escrever
// só o texto (sem tools, sem arquivos, saída pura em stdout). Todo o resto (escolher
// ângulo, validar saída, git add/commit/push) é feito por código determinístico aqui,
// nunca pela chamada do modelo — a IA só compõe o texto.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = __dirname;
const QUEUE_DIR = path.join(ROOT, 'content', 'queue');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const TOPICS_FILE = path.join(ROOT, 'content', 'evergreen-topics.md');
const STATE_FILE = path.join(ROOT, 'content', '.ensure-queue-state.json');
const LOG_FILE = path.join(ROOT, 'content', 'publish-log.txt');
const SQUADS_REPO = 'C:\\Users\\thall\\Documents\\Squads100';

function log(line) {
  const ts = new Date().toISOString();
  const msg = `[${ts}] [ensure-queue] ${line}`;
  console.log(msg);
  fs.appendFileSync(LOG_FILE, msg + '\n');
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf-8', ...opts });
  return { ok: r.status === 0, stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim(), error: r.error };
}

function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return fallback; }
}

function slugify(s) {
  return s
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

// Commits novos desde o último SHA visto, filtrando ruído da própria automação do blog.
function newCommitsSince(cwd, lastSha) {
  const range = lastSha ? `${lastSha}..HEAD` : '-8';
  const args = lastSha ? ['log', range, '--oneline'] : ['log', '-8', '--oneline'];
  const r = run('git', args, { cwd });
  if (!r.ok) return { head: null, lines: [] };
  const head = run('git', ['rev-parse', 'HEAD'], { cwd }).stdout;
  const noise = /Publica post agendado|Adiciona fila de publica|Corrige parser de frontmatter|Update CNAME|Prepara post pro pr[oó]ximo hor[aá]rio/i;
  const lines = r.stdout.split('\n').filter(l => l.trim() && !noise.test(l));
  return { head, lines };
}

function nextEvergreenTopic() {
  if (!fs.existsSync(TOPICS_FILE)) return null;
  const content = fs.readFileSync(TOPICS_FILE, 'utf-8').replace(/\r\n/g, '\n');
  const lines = content.split('\n');
  const idx = lines.findIndex(l => /^-\s\[\s\]\s/.test(l));
  if (idx === -1) return null;
  const topic = lines[idx].replace(/^-\s\[\s\]\s/, '').trim();
  return { topic, markUsed: () => {
    lines[idx] = lines[idx].replace(/^-\s\[\s\]/, '- [x]');
    fs.writeFileSync(TOPICS_FILE, lines.join('\n'));
  } };
}

function temasJaUsados() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const temas = new Set();
  for (const f of fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'))) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8').replace(/\r\n/g, '\n');
    const m = raw.match(/^tema:\s*(.+)$/m);
    if (m) temas.add(m[1].trim());
  }
  return [...temas];
}

function buildPrompt({ mode, angle, styleReference, temasExistentes }) {
  const angleBlock = mode === 'real'
    ? `## O que aconteceu de real recentemente (commits, mais novo por último)\n${angle}\n\nEscolha APENAS UM item genuinamente interessante dessa lista e escreva um post curto e honesto sobre ele. Se nada na lista for interessante o bastante pra virar post, responda exatamente a palavra SKIP e nada mais.`
    : `## Tema evergreen designado\n${angle}\n\nEscreva um post sobre exatamente esse tema.`;

  const temasBlock = temasExistentes.length > 0
    ? `## Temas já usados no blog (reuse um se este post encaixar de verdade, nunca force)\n${temasExistentes.map(t => `- ${t}`).join('\n')}`
    : `## Temas: nenhum usado ainda, este é o primeiro post — escolha um tema curto e específico.`;

  return `Você vai escrever UM post pro blog pessoal do Thallis Ribeiro (thallisribeiro.com.br/blog).

REGRAS RÍGIDAS:
- NÃO use nenhuma ferramenta (tool). NÃO leia nem escreva nenhum arquivo. NÃO rode nenhum comando. Sua resposta inteira é o próprio texto de saída, nada além disso.
- NUNCA invente número, estatística, depoimento, cliente ou resultado que não esteja explicitamente nas informações abaixo. Onde não tiver dado real, não afirme nada no lugar — corte a frase.
- Tom: primeira pessoa (o Thallis escrevendo), direto, sem hype, honesto sobre limitação/lacuna quando existir.
- Tamanho: 300 a 600 palavras.

${angleBlock}

${temasBlock}

## Referência de estilo (post já publicado, mesmo blog)
${styleReference}

## Formato de saída EXATO — nada antes, nada depois, sem crase de bloco de código
---
title: <título do post, curto, direto>
summary: <uma frase resumindo o post>
tema: <1-3 palavras, categoria do post — reusa um tema existente da lista acima quando fizer sentido>
---

<corpo do post em markdown: parágrafos e alguns ## subtítulos, sem repetir o título como H1>`;
}

function callClaude(prompt) {
  const sessionId = require('crypto').randomUUID();
  const r = spawnSync('claude', ['-p', '--dangerously-skip-permissions', '--session-id', sessionId], {
    cwd: ROOT,
    input: prompt,
    encoding: 'utf-8',
    shell: true,
    timeout: 5 * 60 * 1000,
  });
  if (r.error) return { ok: false, reason: `spawn falhou: ${r.error.message}` };
  if (r.status !== 0) return { ok: false, reason: `claude saiu com código ${r.status}: ${(r.stderr || '').slice(0, 300)}` };
  return { ok: true, text: (r.stdout || '').trim() };
}

async function main() {
  fs.mkdirSync(QUEUE_DIR, { recursive: true });

  const queue = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.md'));
  if (queue.length > 0) {
    log(`fila já tem ${queue.length} post(s) — nada a gerar`);
    return;
  }

  const state = readJson(STATE_FILE, {});
  const portfolio = newCommitsSince(ROOT, state.portfolioSha);
  const squads = fs.existsSync(SQUADS_REPO) ? newCommitsSince(SQUADS_REPO, state.squadsSha) : { head: null, lines: [] };
  const allNotes = [...portfolio.lines.map(l => `[thallis-portfolio] ${l}`), ...squads.lines.map(l => `[agência] ${l}`)];

  let mode, angle, markEvergreenUsed = null;
  if (allNotes.length > 0) {
    mode = 'real';
    angle = allNotes.join('\n');
  } else {
    const ever = nextEvergreenTopic();
    if (!ever) { log('nada real novo e a lista evergreen acabou — não publico nada neste horário, precisa de mais temas'); return; }
    mode = 'evergreen';
    angle = ever.topic;
    markEvergreenUsed = ever.markUsed;
  }

  const stylePost = path.join(POSTS_DIR, 'raio-x-da-copy-do-meu-site.md');
  const styleReference = fs.existsSync(stylePost)
    ? fs.readFileSync(stylePost, 'utf-8').replace(/\r\n/g, '\n').slice(0, 2500)
    : '(sem referência disponível)';

  const prompt = buildPrompt({ mode, angle, styleReference, temasExistentes: temasJaUsados() });
  log(`gerando post — modo: ${mode}`);
  const result = callClaude(prompt);

  if (!result.ok) { log(`[erro] geração falhou: ${result.reason}`); return; }
  if (result.text === 'SKIP' || result.text.startsWith('SKIP')) { log('modelo decidiu que nada era interessante o bastante — pulando este horário'); return; }
  if (!/^---\n?title:/.test(result.text) && !/^---\r?\ntitle:/.test(result.text)) {
    log(`[erro] saída não bate com o formato esperado, descartando. Início: ${result.text.slice(0, 120)}`);
    return;
  }

  const titleMatch = result.text.match(/title:\s*(.+)/);
  const title = titleMatch ? titleMatch[1].trim() : 'post-sem-titulo';
  const slug = slugify(title) || `post-${Date.now()}`;

  // Imagem de destaque (Unsplash, busca por palavra-chave do título) — falha graciosa:
  // se não achar chave/imagem, publica sem imagem, nunca trava o post por causa disso.
  let finalText = result.text.trim();
  try {
    const { buscarImagem } = require('./buscar-imagem');
    const imagem = await buscarImagem(title);
    if (imagem) {
      finalText = finalText.replace(
        /^---\n/,
        `---\nimage: ${imagem.url}\nimage_credit: ${imagem.credit_html}\n`
      );
      log(`imagem encontrada: foto de ${imagem.fotografo} no Unsplash`);
    } else {
      log('sem imagem pra este post (sem chave configurada ou nada encontrado) — seguindo sem imagem');
    }
  } catch (e) {
    log(`[aviso] busca de imagem falhou, seguindo sem imagem: ${e.message}`);
  }

  fs.writeFileSync(path.join(QUEUE_DIR, `01-${slug}.md`), finalText + '\n');
  if (markEvergreenUsed) markEvergreenUsed();

  const newState = {
    portfolioSha: portfolio.head || state.portfolioSha,
    squadsSha: squads.head || state.squadsSha,
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2));

  run('git', ['add', 'content/']);
  const commit = run('git', ['commit', '-m', `Prepara post pro próximo horário (auto): ${title}`]);
  if (!commit.ok) { log(`[erro] git commit falhou: ${commit.stderr || commit.stdout}`); return; }
  const push = run('git', ['push', 'origin', 'main']);
  if (!push.ok) { log(`[erro] git push falhou (commit local ok): ${push.stderr}`); return; }

  log(`preparado pra publicar: "${title}" (modo ${mode})`);
}

main().catch(e => { console.error('[ensure-queue] erro fatal:', e.message); process.exit(1); });
