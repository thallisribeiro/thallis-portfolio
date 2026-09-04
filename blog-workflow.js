const { spawnSync } = require('node:child_process');

function runCommand(cwd, cmd, args, options = {}) {
  const command = String(cmd).toLowerCase();
  const isGit = command === 'git' || /[\\/]git(?:\.exe)?$/.test(command);
  const env = isGit
    ? { ...process.env, GIT_TERMINAL_PROMPT: '0', ...(options.env || {}) }
    : { ...process.env, ...(options.env || {}) };
  const result = spawnSync(cmd, args, {
    cwd,
    encoding: 'utf-8',
    env,
    timeout: options.timeout ?? 2 * 60 * 1000,
    windowsHide: true,
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
    error: result.error,
  };
}

function failureDetail(result) {
  const channels = [
    ['erro', result.error && result.error.message],
    ['stderr', result.stderr],
    ['stdout', result.stdout],
  ]
    .map(([label, value]) => [label, (value || '').trim().replace(/\s+/g, ' ')])
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => `${label}: ${value.slice(0, 500)}`);
  return channels.join(' | ') || `código ${result.status ?? 'desconhecido'}, sem diagnóstico`;
}

function retryPendingPush(root, log) {
  const inside = runCommand(root, 'git', ['rev-parse', '--is-inside-work-tree']);
  if (!inside.ok || inside.stdout !== 'true') {
    return { ok: false, reason: `repositório Git indisponível: ${failureDetail(inside)}` };
  }

  const branch = runCommand(root, 'git', ['branch', '--show-current']);
  if (!branch.ok) return { ok: false, reason: `não foi possível identificar a branch: ${failureDetail(branch)}` };
  if (branch.stdout !== 'main') {
    return { ok: false, reason: `workflow exige a branch main; branch atual: ${branch.stdout || '(detached HEAD)'}` };
  }

  const upstream = runCommand(root, 'git', [
    'rev-parse',
    '--abbrev-ref',
    '--symbolic-full-name',
    '@{upstream}',
  ]);
  if (!upstream.ok) {
    const head = runCommand(root, 'git', ['rev-parse', '--verify', 'HEAD']);
    if (!head.ok) return { ok: true, pushed: false };
    return { ok: false, reason: `branch main sem upstream configurado: ${failureDetail(upstream)}` };
  }
  if (upstream.stdout !== 'origin/main') {
    return { ok: false, reason: `upstream inesperado: ${upstream.stdout}; esperado: origin/main` };
  }

  const ahead = runCommand(root, 'git', ['rev-list', '--count', `${upstream.stdout}..HEAD`]);
  if (!ahead.ok) return { ok: false, reason: `não foi possível comparar o upstream: ${failureDetail(ahead)}` };
  if (Number(ahead.stdout) === 0) return { ok: true, pushed: false };

  log(`${ahead.stdout} commit(s) local(is) aguardando push — tentando novamente`);
  let push = runCommand(root, 'git', ['push']);
  // Rejeição por remoto que andou: o slot do Instagram (publicarArtigoIrmao) e o
  // BlogPublish escrevem no MESMO repo em horários coladinhos, e em 03/09 às 21h10 o push
  // voltou com "cannot lock ref ... is at X but expected Y". Repetir o mesmo push falha de
  // novo pra sempre; quem resolve é `pull --rebase` antes de tentar. O slot já fazia isso,
  // este caminho não — mesma corrida, dois arquivos, um só corrigido.
  for (let tentativa = 1; tentativa <= 2 && !push.ok && /reject|lock|fetch first|non-fast-forward/i.test(failureDetail(push)); tentativa++) {
    log(`push rejeitado (tentativa ${tentativa}) — pull --rebase e tento de novo`);
    runCommand(root, 'git', ['pull', '--rebase', 'origin', 'main']);
    push = runCommand(root, 'git', ['push']);
  }
  if (!push.ok) return { ok: false, reason: `retry de git push falhou: ${failureDetail(push)}` };
  log('push pendente concluído');
  return { ok: true, pushed: true };
}

module.exports = { failureDetail, retryPendingPush, runCommand };
