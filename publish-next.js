#!/usr/bin/env node
// Publica o próximo post da fila (content/queue/, ordem alfabética) — chamado
// pelo Task Scheduler 3x/dia (7h, 12h, 18h) e também pode ser rodado à mão.
// Fila vazia não é erro: só loga e não publica nada nesse horário (nunca
// inventa post pra não deixar buraco).

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

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
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf-8' });
  return { ok: r.status === 0, stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim() };
}

function main() {
  fs.mkdirSync(QUEUE_DIR, { recursive: true });
  fs.mkdirSync(POSTS_DIR, { recursive: true });

  const queue = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.md')).sort();
  if (queue.length === 0) {
    log('fila vazia — nada publicado neste horário');
    return;
  }

  const file = queue[0];
  const raw = fs.readFileSync(path.join(QUEUE_DIR, file), 'utf-8').replace(/\r\n/g, '\n');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) { log(`[erro] ${file} não tem frontmatter válido — pulando, arquivo mantido na fila pra correção manual`); return; }

  const metaLines = m[1].split('\n');
  const meta = {};
  for (const line of metaLines) {
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  if (!meta.title) { log(`[erro] ${file} não tem "title" no frontmatter — pulando, arquivo mantido na fila`); return; }

  // slug de publicação = nome do arquivo sem prefixo numérico de ordem (ex: "01-foo.md" -> "foo")
  const slug = file.replace(/\.md$/, '').replace(/^\d+-/, '');
  const date = todayIso();
  const finalMd = `---\ntitle: ${meta.title}\ndate: ${date}\nsummary: ${meta.summary || ''}\n---\n\n${m[2].trim()}\n`;

  fs.writeFileSync(path.join(POSTS_DIR, `${slug}.md`), finalMd);
  fs.unlinkSync(path.join(QUEUE_DIR, file));

  const gen = run(process.execPath, ['generate-blog.js']);
  if (!gen.ok) { log(`[erro] generate-blog.js falhou: ${gen.stderr}`); return; }

  run('git', ['add', 'content/', 'blog/']);
  const commit = run('git', ['commit', '-m', `Publica post agendado: ${meta.title}`]);
  if (!commit.ok) { log(`[erro] git commit falhou: ${commit.stderr || commit.stdout}`); return; }

  const push = run('git', ['push', 'origin', 'main']);
  if (!push.ok) { log(`[erro] git push falhou (commit local ok, retry manual necessário): ${push.stderr}`); return; }

  log(`publicado: /blog/${slug}/ — "${meta.title}"`);
}

main();
