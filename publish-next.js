#!/usr/bin/env node
// Publica o próximo post da fila (content/queue/, ordem alfabética) — chamado
// pelo Task Scheduler 3x/dia (7h, 12h, 18h) e também pode ser rodado à mão.
// Fila vazia não é erro: só loga e não publica nada nesse horário (nunca
// inventa post pra não deixar buraco).

const fs = require('fs');
const path = require('path');
const { failureDetail, retryPendingPush, runCommand } = require('./blog-workflow');

const ROOT = __dirname;
const QUEUE_DIR = path.join(ROOT, 'content', 'queue');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const LOG_FILE = path.join(ROOT, 'content', 'publish-log.txt');

function log(line) {
  const ts = new Date().toISOString();
  const msg = `[${ts}] ${line}`;
  console.log(msg);
  fs.appendFileSync(LOG_FILE, msg + '\n');
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function run(cmd, args) {
  return runCommand(ROOT, cmd, args);
}

function rollbackUncommittedPublication({ queuePath, raw, postPath, publicationPaths }) {
  fs.writeFileSync(queuePath, raw);
  if (fs.existsSync(postPath)) fs.unlinkSync(postPath);
  return run('git', ['restore', '--staged', '--', ...publicationPaths]);
}

function main() {
  fs.mkdirSync(QUEUE_DIR, { recursive: true });
  fs.mkdirSync(POSTS_DIR, { recursive: true });

  const pendingPush = retryPendingPush(ROOT, log);
  if (!pendingPush.ok) { log(`[erro] ${pendingPush.reason}`); return 1; }

  const queue = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.md')).sort();
  if (queue.length === 0) {
    log('fila vazia — nada publicado neste horário');
    return 0;
  }

  const file = queue[0];
  const queuePath = path.join(QUEUE_DIR, file);
  const raw = fs.readFileSync(queuePath, 'utf-8').replace(/\r\n/g, '\n');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) { log(`[erro] ${file} não tem frontmatter válido — pulando, arquivo mantido na fila pra correção manual`); return 1; }

  const metaLines = m[1].split('\n');
  const meta = {};
  for (const line of metaLines) {
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  if (!meta.title) { log(`[erro] ${file} não tem "title" no frontmatter — pulando, arquivo mantido na fila`); return 1; }

  // slug de publicação = nome do arquivo sem prefixo numérico de ordem (ex: "01-foo.md" -> "foo")
  const slug = file.replace(/\.md$/, '').replace(/^\d+-/, '');
  const date = todayIso();
  const frontmatterLinhas = [`title: ${meta.title}`, `date: ${date}`, `summary: ${meta.summary || ''}`];
  if (meta.tema) frontmatterLinhas.push(`tema: ${meta.tema}`);
  if (meta.image) frontmatterLinhas.push(`image: ${meta.image}`);
  if (meta.image_credit) frontmatterLinhas.push(`image_credit: ${meta.image_credit}`);
  const finalMd = `---\n${frontmatterLinhas.join('\n')}\n---\n\n${m[2].trim()}\n`;

  const postRelative = `content/posts/${slug}.md`;
  const queueRelative = `content/queue/${file}`;
  const postPath = path.join(POSTS_DIR, `${slug}.md`);
  if (fs.existsSync(postPath)) {
    log(`[erro] slug "${slug}" já existe em content/posts; arquivo mantido na fila para revisão`);
    return 1;
  }
  fs.writeFileSync(postPath, finalMd);

  const gen = run(process.execPath, ['generate-blog.js']);
  if (!gen.ok) {
    fs.unlinkSync(postPath);
    log(`[erro] generate-blog.js falhou: ${failureDetail(gen)}`);
    return 1;
  }

  // A fila só é consumida depois que todos os artefatos estáticos existem.
  // Assim, uma falha do gerador continua automaticamente retryable.
  fs.unlinkSync(queuePath);

  const publicationPaths = [postRelative, queueRelative, 'blog/', 'feed.xml', 'sitemap.xml'];
  const add = run('git', ['add', '--', ...publicationPaths]);
  if (!add.ok) {
    const rollback = rollbackUncommittedPublication({ queuePath, raw, postPath, publicationPaths });
    const rollbackNote = rollback.ok ? '' : ` | rollback do index falhou: ${failureDetail(rollback)}`;
    log(`[erro] git add falhou; post devolvido à fila: ${failureDetail(add)}${rollbackNote}`);
    return 1;
  }
  const commit = run('git', ['commit', '-m', `Publica post agendado: ${meta.title}`, '--', ...publicationPaths]);
  if (!commit.ok) {
    const rollback = rollbackUncommittedPublication({ queuePath, raw, postPath, publicationPaths });
    const rollbackNote = rollback.ok ? '' : ` | rollback do index falhou: ${failureDetail(rollback)}`;
    log(`[erro] git commit falhou; post devolvido à fila: ${failureDetail(commit)}${rollbackNote}`);
    return 1;
  }

  const push = run('git', ['push']);
  if (!push.ok) { log(`[erro] git push falhou (commit local preservado para retry): ${failureDetail(push)}`); return 1; }

  log(`publicado: /blog/${slug}/ — "${meta.title}"`);
  return 0;
}

try {
  process.exitCode = main() || 0;
} catch (e) {
  console.error('[publish-next] erro fatal:', e.message);
  process.exitCode = 1;
}
