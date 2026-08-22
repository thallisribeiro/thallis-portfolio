#!/usr/bin/env node
// Encripta o digest mais recente do squad board-diario e publica em admin/data.enc.json.
// Rodar depois que a rotina diária gerar um digest novo, depois `git add admin/data.enc.json && git commit && git push`.
// Senha: passe por ADMIN_PASSWORD (env var) ou digite quando o script pedir. Nunca fica salva no repo.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const SQUADS_ROOT = process.env.SQUADS_ROOT || 'C:\\Users\\thall\\Documents\\Squads100';
const DIGEST_DIR = path.join(SQUADS_ROOT, 'squads', 'board-diario', 'output');
const OUT_FILE = path.join(__dirname, '..', 'admin', 'data.enc.json');
const ITERATIONS = 300000;

function findLatestDigest() {
  const runs = fs.readdirSync(DIGEST_DIR)
    .filter(d => fs.statSync(path.join(DIGEST_DIR, d)).isDirectory())
    .sort()
    .reverse();
  for (const run of runs) {
    const runDir = path.join(DIGEST_DIR, run);
    const htmlFile = fs.readdirSync(runDir).find(f => f.endsWith('.html'));
    if (htmlFile) return path.join(runDir, htmlFile);
  }
  throw new Error(`nenhum digest .html encontrado em ${DIGEST_DIR}`);
}

function encrypt(plaintext, password) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    data: Buffer.concat([ciphertext, tag]).toString('base64'),
    iterations: ITERATIONS,
  };
}

function askPassword() {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Senha do /admin: ', answer => { rl.close(); resolve(answer); });
  });
}

async function main() {
  const digestPath = findLatestDigest();
  console.log(`[publish-admin] usando digest: ${digestPath}`);
  const html = fs.readFileSync(digestPath, 'utf-8');

  const password = process.env.ADMIN_PASSWORD || await askPassword();
  if (!password) throw new Error('senha vazia');

  const payload = encrypt(html, password);
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload));
  console.log(`[publish-admin] escrito ${OUT_FILE}`);
  console.log('[publish-admin] agora: git add admin/data.enc.json && git commit && git push');
}

main().catch(e => { console.error(e.message); process.exit(1); });
