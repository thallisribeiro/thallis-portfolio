const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { failureDetail, runCommand } = require('../blog-workflow');

const PROJECT_ROOT = path.resolve(__dirname, '..');

function makeBlogFixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-workflow-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  fs.mkdirSync(path.join(root, 'content', 'queue'), { recursive: true });
  fs.mkdirSync(path.join(root, 'content', 'posts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'content', 'publish-log.txt'), '');
  fs.writeFileSync(
    path.join(root, 'content', 'evergreen-topics.md'),
    '# Temas\n\n- [ ] Tema de regressão\n',
  );
  fs.copyFileSync(path.join(PROJECT_ROOT, 'ensure-queue.js'), path.join(root, 'ensure-queue.js'));
  const sharedWorkflow = path.join(PROJECT_ROOT, 'blog-workflow.js');
  if (fs.existsSync(sharedWorkflow)) {
    fs.copyFileSync(sharedWorkflow, path.join(root, 'blog-workflow.js'));
  }
  // Content-hub vazio e só desta fixture: o ensure-queue lê a esteira de produção por
  // caminho fixo, e sem isolar isso o teste encontra um artigo real e desvia do caminho
  // que ele está testando. `BLOG_SQUADS_REPO` existe só para isto.
  fs.mkdirSync(path.join(root, 'contenthub-vazio'), { recursive: true });
  runGit(root, ['init']);
  runGit(root, ['config', 'user.name', 'Workflow Test']);
  runGit(root, ['config', 'user.email', 'workflow@example.invalid']);
  runGit(root, ['branch', '-M', 'main']);

  return root;
}

function writeQueuedPost(root) {
  const queueFile = path.join(root, 'content', 'queue', '01-post-de-teste.md');
  fs.writeFileSync(
    queueFile,
    '---\ntitle: Post de teste\nsummary: Resumo de teste\ntema: Teste\n---\n\nCorpo do post.\n',
  );
  return queueFile;
}

function runGit(root, args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function initializeGitWithRemote(root) {
  const remote = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-workflow-remote-'));
  spawnSync('git', ['init', '--bare', remote], { encoding: 'utf8' });
  runGit(root, ['remote', 'add', 'origin', remote]);
  return remote;
}

function createPendingCommit(root) {
  fs.writeFileSync(path.join(root, 'pending.txt'), `pending ${Date.now()}\n`);
  runGit(root, ['add', 'pending.txt']);
  runGit(root, ['commit', '-m', 'pending push']);
  return runGit(root, ['rev-parse', 'HEAD']);
}

function remoteMainSha(root, remote) {
  return runGit(root, ['--git-dir', remote, 'rev-parse', 'refs/heads/main']);
}

test('workflow commands enforce their timeout', (t) => {
  const root = makeBlogFixture(t);
  const result = runCommand(
    root,
    process.execPath,
    ['-e', 'setTimeout(() => {}, 250)'],
    { timeout: 20 },
  );

  assert.equal(result.ok, false);
  assert.equal(result.error && result.error.code, 'ETIMEDOUT');
});

test('failure diagnostics preserve stdout even when stderr is long', () => {
  const detail = failureDetail({
    status: 1,
    error: null,
    stderr: 'e'.repeat(800),
    stdout: 'weekly limit resets Friday',
  });

  assert.match(detail, /stderr:/);
  assert.match(detail, /stdout: weekly limit resets Friday/);
});

test('ensure-queue fails closed when the main branch has no upstream', (t) => {
  const root = makeBlogFixture(t);
  writeQueuedPost(root);
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'fixture without upstream']);

  const result = spawnSync(process.execPath, ['ensure-queue.js'], {
    cwd: root,
    encoding: 'utf8',
  });

  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.match(fs.readFileSync(path.join(root, 'content', 'publish-log.txt'), 'utf8'), /upstream/i);
});

test('publish-next refuses to run outside main even when another branch tracks origin/main', (t) => {
  const root = makeBlogFixture(t);
  fs.copyFileSync(path.join(PROJECT_ROOT, 'publish-next.js'), path.join(root, 'publish-next.js'));
  writeQueuedPost(root);
  const remote = initializeGitWithRemote(root);
  t.after(() => fs.rmSync(remote, { recursive: true, force: true }));
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'fixture']);
  runGit(root, ['push', '-u', 'origin', 'main']);
  runGit(root, ['checkout', '-b', 'feature']);
  runGit(root, ['branch', '--set-upstream-to', 'origin/main']);

  const result = spawnSync(process.execPath, ['publish-next.js'], {
    cwd: root,
    encoding: 'utf8',
  });

  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.match(fs.readFileSync(path.join(root, 'content', 'publish-log.txt'), 'utf8'), /branch main/i);
});

test('publish-next keeps the queue and exits nonzero when static generation fails', (t) => {
  const root = makeBlogFixture(t);
  fs.copyFileSync(path.join(PROJECT_ROOT, 'publish-next.js'), path.join(root, 'publish-next.js'));
  const queueFile = writeQueuedPost(root);
  fs.writeFileSync(
    path.join(root, 'generate-blog.js'),
    "process.stderr.write('generator exploded\\n'); process.exit(7);\n",
  );

  const result = spawnSync(process.execPath, ['publish-next.js'], {
    cwd: root,
    encoding: 'utf8',
  });

  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(fs.existsSync(queueFile), true, 'queued post must remain retryable');
  assert.equal(fs.existsSync(path.join(root, 'content', 'posts', 'post-de-teste.md')), false);
  assert.match(fs.readFileSync(path.join(root, 'content', 'publish-log.txt'), 'utf8'), /generator exploded/);
});

test('publish-next rejects a slug collision without overwriting the existing post', (t) => {
  const root = makeBlogFixture(t);
  fs.copyFileSync(path.join(PROJECT_ROOT, 'publish-next.js'), path.join(root, 'publish-next.js'));
  const queueFile = writeQueuedPost(root);
  const postFile = path.join(root, 'content', 'posts', 'post-de-teste.md');
  fs.writeFileSync(postFile, 'existing published post\n');
  const remote = initializeGitWithRemote(root);
  t.after(() => fs.rmSync(remote, { recursive: true, force: true }));
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'fixture']);
  runGit(root, ['push', '-u', 'origin', 'main']);

  const result = spawnSync(process.execPath, ['publish-next.js'], {
    cwd: root,
    encoding: 'utf8',
  });

  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(fs.readFileSync(postFile, 'utf8'), 'existing published post\n');
  assert.equal(fs.existsSync(queueFile), true);
  assert.match(fs.readFileSync(path.join(root, 'content', 'publish-log.txt'), 'utf8'), /slug.*já existe/i);
});

test('publish-next commits the post, queue deletion, blog, feed, and sitemap together', (t) => {
  const root = makeBlogFixture(t);
  fs.copyFileSync(path.join(PROJECT_ROOT, 'publish-next.js'), path.join(root, 'publish-next.js'));
  writeQueuedPost(root);
  fs.writeFileSync(path.join(root, 'feed.xml'), '<rss>old</rss>\n');
  fs.writeFileSync(path.join(root, 'sitemap.xml'), '<urlset>old</urlset>\n');
  fs.writeFileSync(
    path.join(root, 'generate-blog.js'),
    [
      "const fs = require('node:fs');",
      "fs.mkdirSync('blog/post-de-teste', { recursive: true });",
      "fs.writeFileSync('blog/post-de-teste/index.html', '<h1>Post de teste</h1>\\n');",
      "fs.writeFileSync('feed.xml', '<rss>new</rss>\\n');",
      "fs.writeFileSync('sitemap.xml', '<urlset>new</urlset>\\n');",
    ].join('\n'),
  );

  const remote = initializeGitWithRemote(root);
  t.after(() => fs.rmSync(remote, { recursive: true, force: true }));
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'fixture']);
  runGit(root, ['push', '-u', 'origin', 'main']);

  const result = spawnSync(process.execPath, ['publish-next.js'], {
    cwd: root,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const committed = runGit(root, ['show', '--no-renames', '--pretty=format:', '--name-status', 'HEAD']);
  assert.match(committed, /A\s+content\/posts\/post-de-teste\.md/);
  assert.match(committed, /D\s+content\/queue\/01-post-de-teste\.md/);
  assert.match(committed, /A\s+blog\/post-de-teste\/index\.html/);
  assert.match(committed, /M\s+feed\.xml/);
  assert.match(committed, /M\s+sitemap\.xml/);
});

test('publish-next restores the queue and unstages its transaction when commit fails', (t) => {
  const root = makeBlogFixture(t);
  fs.copyFileSync(path.join(PROJECT_ROOT, 'publish-next.js'), path.join(root, 'publish-next.js'));
  const queueFile = writeQueuedPost(root);
  fs.writeFileSync(path.join(root, 'feed.xml'), '<rss>old</rss>\n');
  fs.writeFileSync(path.join(root, 'sitemap.xml'), '<urlset>old</urlset>\n');
  fs.writeFileSync(
    path.join(root, 'generate-blog.js'),
    [
      "const fs = require('node:fs');",
      "fs.mkdirSync('blog/post-de-teste', { recursive: true });",
      "fs.writeFileSync('blog/post-de-teste/index.html', '<h1>Post</h1>\\n');",
      "fs.writeFileSync('feed.xml', '<rss>new</rss>\\n');",
      "fs.writeFileSync('sitemap.xml', '<urlset>new</urlset>\\n');",
    ].join('\n'),
  );
  const remote = initializeGitWithRemote(root);
  t.after(() => fs.rmSync(remote, { recursive: true, force: true }));
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'fixture']);
  runGit(root, ['push', '-u', 'origin', 'main']);
  const hook = path.join(root, '.git', 'hooks', 'pre-commit');
  fs.writeFileSync(hook, '#!/bin/sh\nexit 1\n');
  fs.chmodSync(hook, 0o755);

  const result = spawnSync(process.execPath, ['publish-next.js'], {
    cwd: root,
    encoding: 'utf8',
  });

  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(fs.existsSync(queueFile), true);
  assert.equal(runGit(root, ['diff', '--cached', '--name-only']), '');
});

test('publish-next retries a pending push before treating an empty queue as a no-op', (t) => {
  const root = makeBlogFixture(t);
  fs.copyFileSync(path.join(PROJECT_ROOT, 'publish-next.js'), path.join(root, 'publish-next.js'));
  const remote = initializeGitWithRemote(root);
  t.after(() => fs.rmSync(remote, { recursive: true, force: true }));
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'fixture']);
  runGit(root, ['push', '-u', 'origin', 'main']);
  const pendingSha = createPendingCommit(root);

  const result = spawnSync(process.execPath, ['publish-next.js'], {
    cwd: root,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(remoteMainSha(root, remote), pendingSha);
});

test('ensure-queue retries a pending push before returning for an existing queued post', (t) => {
  const root = makeBlogFixture(t);
  writeQueuedPost(root);
  const remote = initializeGitWithRemote(root);
  t.after(() => fs.rmSync(remote, { recursive: true, force: true }));
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'fixture']);
  runGit(root, ['push', '-u', 'origin', 'main']);
  const pendingSha = createPendingCommit(root);

  const result = spawnSync(process.execPath, ['ensure-queue.js'], {
    cwd: root,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(remoteMainSha(root, remote), pendingSha);
});
