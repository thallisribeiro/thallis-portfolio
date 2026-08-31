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
const { failureDetail, retryPendingPush, runCommand } = require('./blog-workflow');

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
  const cwd = opts.cwd || ROOT;
  const { cwd: _ignored, ...commandOptions } = opts;
  return runCommand(cwd, cmd, args, commandOptions);
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

// Quem decide o ritmo dos dois canais. O carrossel sai primeiro (slot das 07h) e o
// artigo irmao entra na fila logo depois, no ensure-queue das 09h30.
const IG_PUBLICADOS = path.join(SQUADS_REPO, '_opensquad', '_memory', 'instagram-publicados.json');

// Tópicos cujo carrossel JÁ foi ao ar no Instagram, como `<dia>/<topico>`.
function topicosJaNoInstagram() {
  try {
    const bruto = JSON.parse(fs.readFileSync(IG_PUBLICADOS, 'utf-8'));
    return new Set(bruto.map(r => String(r.aprovacaoId || '').split('/').slice(1).join('/')).filter(Boolean));
  } catch {
    // Ledger ilegível não pode publicar artigo solto: sem ele não dá pra saber o que
    // já foi ao ar, e post de blog sem o carrossel irmão é exatamente a deriva que
    // esta função existe pra impedir.
    return null;
  }
}

const CONTENTHUB_SAIDA = path.join(
  SQUADS_REPO, '_contenthub', '_clientes', 'thallisribeiro', 'saida'
);

function slugificar(texto) {
  return texto
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

function tituloDoFrontmatter(conteudo) {
  const m = conteudo.match(/^title:\s*"?(.+?)"?\s*$/m);
  return m ? m[1].trim() : null;
}

// Varre os artigos que o _contenthub ja escreveu e devolve o primeiro que ainda
// nao virou post. Compara por slug do titulo, que e como o blog nomeia arquivo.
// Capa é conteúdo, não layout: entra na geração do post e fica gravada no frontmatter.
// Se falhar, o post sai sem capa -- nunca segura a publicação por causa de imagem.
function garantirCapa(arquivoDoPost) {
  const r = runCommand(ROOT, process.execPath, ['capa-do-post.js', path.relative(ROOT, arquivoDoPost)]);
  log(r.ok ? `capa: ${(r.stdout || '').trim().split('\n').pop()}` : `[aviso] capa falhou (post segue sem imagem): ${failureDetail(r)}`);
}

function proximoArtigoDoContentHub() {
  if (!fs.existsSync(CONTENTHUB_SAIDA)) return null;

  const publicados = new Set();
  for (const arq of fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'))) {
    const titulo = tituloDoFrontmatter(fs.readFileSync(path.join(POSTS_DIR, arq), 'utf-8'));
    if (titulo) publicados.add(slugificar(titulo));
  }

  const noInstagram = topicosJaNoInstagram();
  if (!noInstagram) return null;

  const candidatos = [];
  for (const dia of fs.readdirSync(CONTENTHUB_SAIDA)) {
    const dirDia = path.join(CONTENTHUB_SAIDA, dia);
    if (!fs.statSync(dirDia).isDirectory()) continue;
    for (const topico of fs.readdirSync(dirDia)) {
      // O par é a regra: artigo só vai pro blog depois que o carrossel do mesmo
      // tópico foi ao ar. Um assunto, os dois canais, o mesmo dia.
      if (!noInstagram.has(`${dia}/${topico}`)) continue;
      const artigo = path.join(dirDia, topico, 'artigo', 'artigo.md');
      if (!fs.existsSync(artigo)) continue;
      const conteudo = fs.readFileSync(artigo, 'utf-8').replace(/\r\n/g, '\n');
      const titulo = tituloDoFrontmatter(conteudo);
      if (!titulo) continue;
      const slug = slugificar(titulo);
      if (publicados.has(slug)) continue;
      candidatos.push({ dia, titulo, slug, conteudo });
    }
  }

  if (candidatos.length === 0) return null;
  // mais antigo primeiro: o carrossel irmao ja foi ao ar ha mais tempo
  candidatos.sort((a, b) => a.dia.localeCompare(b.dia));
  return candidatos[0];
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
- Tamanho: decida pela profundidade real do tema, nunca convirja sempre pro mesmo número.
  Nota rápida de bastidor/decisão pontual: 300-600 palavras. Tema que sustenta explicação,
  comparação ou passo a passo de verdade (principalmente evergreen educativo, o tipo que
  alguém acharia buscando no Google): 1000-1800 palavras, com seções ## e exemplo concreto
  em cada uma — nunca resumir um tema profundo só pra caber em 500 palavras.

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
  const args = [
    '-p',
    '--safe-mode',
    '--tools', '',
    '--disable-slash-commands',
    '--strict-mcp-config',
    '--no-session-persistence',
    '--session-id', sessionId,
  ];
  const command = process.env.BLOG_CLAUDE_COMMAND || 'claude';
  const invocation = process.platform === 'win32'
    ? {
        command: process.env.ComSpec || 'cmd.exe',
        args: ['/d', '/s', '/c', [command, ...args].map(quoteCmdArg).join(' ')],
      }
    : { command, args };
  const r = spawnSync(invocation.command, invocation.args, {
    cwd: ROOT,
    input: prompt,
    encoding: 'utf-8',
    timeout: 5 * 60 * 1000,
  });
  if (r.error || r.status !== 0) {
    return { ok: false, reason: `claude falhou (código ${r.status ?? 'indisponível'}): ${failureDetail(r)}` };
  }
  return { ok: true, text: (r.stdout || '').trim() };
}

function quoteCmdArg(value) {
  if (value === '') return '""';
  if (!/[\s&|<>^()"]/.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

async function main() {
  fs.mkdirSync(QUEUE_DIR, { recursive: true });

  const pendingPush = retryPendingPush(ROOT, log);
  if (!pendingPush.ok) { log(`[erro] ${pendingPush.reason}`); return 1; }

  const queue = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.md'));
  if (queue.length > 0) {
    // Antes de sair: arquivo de fila não rastreado é versionado aqui. Se ele ficar
    // untracked, o publish-next tenta versionar a remoção dele, o pathspec falha e a
    // publicação inteira volta atrás -- e esta função saía cedo sem nunca corrigir,
    // travando os dois lados. Aconteceu em 29/08 e segurou o blog por um dia.
    const naoRastreados = queue
      .map(f => `content/queue/${f}`)
      .filter(rel => runCommand(ROOT, 'git', ['ls-files', '--', rel]).stdout.trim().length === 0);
    if (naoRastreados.length > 0) {
      log(`fila com ${naoRastreados.length} arquivo(s) fora do git — versionando pra destravar o publish`);
      const add = runCommand(ROOT, 'git', ['add', '--', ...naoRastreados]);
      if (!add.ok) log(`[erro] git add da fila falhou: ${failureDetail(add)}`);
      else {
        const commit = runCommand(ROOT, 'git', ['commit', '-m', 'Versiona post da fila que ficou fora do git', '--', ...naoRastreados]);
        if (!commit.ok) log(`[erro] git commit da fila falhou: ${failureDetail(commit)}`);
      }
    }
    log(`fila já tem ${queue.length} post(s) — nada a gerar`);
    return;
  }

  // Mao dupla com o Instagram: o _contenthub deriva da mesma peca-mae um carrossel
  // e um artigo, e o artigo ja sai reangulado pra intencao de busca. Ele so nunca
  // era transportado ate aqui -- em 2026-08-28 havia 8 artigos escritos e parados.
  // Entra antes de tudo: ja esta pronto, nao custa chamada de modelo.
  // Teto do dia. As 3 pecas da esteira ja vao pro blog junto com os carrosseis (o
  // instagram-slot publica o artigo irmao no mesmo minuto). Gerar por cima disso dobrava
  // o blog pra 6/dia. Aqui ele so entra quando a esteira nao entregou.
  const hoje = new Date().toISOString().slice(0, 10);
  const publicadosHoje = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'))
    .filter(f => /^date:\s*(\S+)/m.test(fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8'))
      && fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8').match(/^date:\s*(\S+)/m)[1] === hoje).length;
  if (publicadosHoje >= 3) {
    log(`o dia já tem ${publicadosHoje} posts — nada a gerar`);
    return;
  }

  const doContentHub = proximoArtigoDoContentHub();
  if (doContentHub) {
    const destino = path.join(QUEUE_DIR, doContentHub.slug + '.md');
    fs.writeFileSync(destino, doContentHub.conteudo);
    log(`artigo do content-hub aproveitado (par do carrossel ${doContentHub.dia}): ${doContentHub.titulo}`);
    garantirCapa(destino);
    // A assinatura é runCommand(cwd, cmd, args). Estava chamada como
    // runCommand('git', [...], ROOT) -- cwd virava "git" e cmd virava um Array, e o
    // spawnSync jogava "The file argument must be of type string". Como isso estourava
    // logo depois de gravar o arquivo, o post ficava na fila SEM ser versionado, e o
    // publish-next travava tentando versionar a remoção dele. Foi a causa raiz do blog
    // parado em 29/08, e o commit não é opcional: sem ele o arquivo nasce órfão.
    const add = runCommand(ROOT, 'git', ['add', '--', path.relative(ROOT, destino).replace(/\\/g, '/')]);
    if (!add.ok) {
      log(`[erro] git add do artigo falhou: ${failureDetail(add)}`);
      return 1;
    }
    const commit = runCommand(ROOT, 'git', ['commit', '-m', `Prepara post do content-hub: ${doContentHub.titulo}`]);
    if (!commit.ok) {
      log(`[erro] git commit do artigo falhou: ${failureDetail(commit)}`);
      return 1;
    }
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

  if (!result.ok) { log(`[erro] geração falhou: ${result.reason}`); return 1; }
  if (result.text === 'SKIP' || result.text.startsWith('SKIP')) { log('modelo decidiu que nada era interessante o bastante — pulando este horário'); return; }
  if (!/^---\n?title:/.test(result.text) && !/^---\r?\ntitle:/.test(result.text)) {
    log(`[erro] saída não bate com o formato esperado, descartando. Início: ${result.text.slice(0, 120)}`);
    return 1;
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

  const queueRelative = `content/queue/01-${slug}.md`;
  fs.writeFileSync(path.join(ROOT, queueRelative), finalText + '\n');
  if (markEvergreenUsed) markEvergreenUsed();

  const newState = {
    portfolioSha: portfolio.head || state.portfolioSha,
    squadsSha: squads.head || state.squadsSha,
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2));

  const generationPaths = [queueRelative, 'content/.ensure-queue-state.json'];
  if (markEvergreenUsed) generationPaths.push('content/evergreen-topics.md');
  const add = run('git', ['add', '--', ...generationPaths]);
  if (!add.ok) { log(`[erro] git add falhou: ${failureDetail(add)}`); return 1; }
  const commit = run('git', ['commit', '-m', `Prepara post pro próximo horário (auto): ${title}`, '--', ...generationPaths]);
  if (!commit.ok) { log(`[erro] git commit falhou: ${failureDetail(commit)}`); return 1; }
  const push = run('git', ['push']);
  if (!push.ok) { log(`[erro] git push falhou (commit local ok): ${failureDetail(push)}`); return 1; }

  log(`preparado pra publicar: "${title}" (modo ${mode})`);
  return 0;
}

main()
  .then(code => { process.exitCode = code || 0; })
  .catch(e => { console.error('[ensure-queue] erro fatal:', e.message); process.exitCode = 1; });
