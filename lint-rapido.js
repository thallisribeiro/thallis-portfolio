#!/usr/bin/env node
// Dois segundos antes de commitar. Só checa o que já quebrou de verdade aqui.
//
// Não é um linter de estilo: é a lista dos defeitos que custaram tempo nesta casa e que
// uma máquina detecta em milissegundos.
//
//   1. caractere de controle em código  — em 31/08 um `\b` escrito dentro de string
//      Python virou o byte 0x08 no meio de uma regex. O gate ficou morto, passava em
//      todo `grep`, e só apareceu no `od -c`.
//   2. arquivo gerado fora do manifesto  — o generate-blog escreve fora de blog/, e os
//      publicadores commitam pelo manifesto. Já aconteceu 3x de um alvo novo ficar de
//      fora e a página subir velha. A terceira foi causada pelo conserto das duas
//      primeiras.
//   3. sintaxe dos scripts  — patch aplicado por script pode deixar JS inválido, e o
//      erro só aparece no horário da publicação, sem ninguém olhando.
//
// Uso: node lint-rapido.js            (sai 1 se achar algo)
//      node lint-rapido.js --self-test

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = __dirname;
const SQUADS = 'C:\\Users\\thall\\Documents\\Squads100';

// Tab, \n e \r são legítimos. O resto é acidente.
const CONTROLE = /[\x00-\x08\x0b\x0c\x0e-\x1f]/;

function achaControle(texto) {
  const m = texto.match(CONTROLE);
  if (!m) return null;
  const antes = texto.slice(0, m.index);
  return { linha: antes.split('\n').length, byte: '0x' + m[0].charCodeAt(0).toString(16).padStart(2, '0') };
}

// Só arquivos de código, e só os que a casa mantém à mão: varrer blog/ gerado seria
// ruído garantido.
function fontes() {
  const alvos = [];
  const raizes = [
    [ROOT, ['.js', '.css', '.html'], ['blog', 'assets/capas', 'assets/posts', 'node_modules', '.git', 'previa', 'ig']],
    [path.join(SQUADS, '_contenthub', 'core'), ['.js', '.cmd'], ['node_modules']],
    [path.join(SQUADS, '_contenthub', 'agents'), ['.md'], []],
  ];
  for (const [raiz, exts, pular] of raizes) {
    if (!fs.existsSync(raiz)) continue;
    const anda = (d, prof = 0) => {
      if (prof > 4) return;
      for (const nome of fs.readdirSync(d)) {
        const p = path.join(d, nome);
        const rel = path.relative(raiz, p).replace(/\\/g, '/');
        if (pular.some((x) => rel === x || rel.startsWith(x + '/'))) continue;
        let st; try { st = fs.statSync(p); } catch { continue; }
        if (st.isDirectory()) anda(p, prof + 1);
        else if (exts.includes(path.extname(nome))) alvos.push(p);
      }
    };
    anda(raiz);
  }
  return alvos;
}

function checarControle() {
  const achados = [];
  for (const f of fontes()) {
    let t; try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
    const c = achaControle(t);
    if (c) achados.push(`${path.relative(ROOT, f)}:${c.linha} — caractere de controle ${c.byte} no código`);
  }
  return achados;
}

// Barra invertida colada num TAB nunca é intencional: é uma sequência de escape que virou
// tabulação ao atravessar uma string mal escapada. O caminho "..\testes.cmd" vira
// "..\<TAB>estes.cmd", some em todo grep porque TAB é caractere legítimo, e o comando
// deixa de existir sem nenhum erro. Aconteceu três vezes em 31/08.
//
// O par é montado por código de caractere de propósito: escrevê-lo como literal aqui é
// exatamente o que produz o defeito que esta regra procura.
const BARRA_TAB = String.fromCharCode(92, 9);

function checarEscapeMastigado() {
  const achados = [];
  for (const f of fontes()) {
    let t; try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
    t.split('\n').forEach((linha, i) => {
      if (linha.includes(BARRA_TAB)) {
        achados.push(`${path.relative(ROOT, f)}:${i + 1} — barra invertida seguida de TAB (escape mastigado)`);
      }
    });
  }
  return achados;
}

// O gerador declara o que escreve fora de blog/. Se ele escreve num alvo que não está no
// manifesto, esse arquivo sobe velho para sempre e ninguém percebe.
function checarManifesto() {
  const gerador = path.join(ROOT, 'generate-blog.js');
  if (!fs.existsSync(gerador)) return [];
  const src = fs.readFileSync(gerador, 'utf8');
  const declarados = new Set((() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, '.gerados.json'), 'utf8')); } catch { return []; } })());
  const achados = [];
  // Alvos escritos por caminho literal: path.join(ROOT, 'x', 'index.html')
  const re = /path\.join\(ROOT,\s*((?:'[^']+'\s*,?\s*)+)\)/g;
  let m;
  while ((m = re.exec(src))) {
    const partes = m[1].match(/'([^']+)'/g).map((x) => x.slice(1, -1));
    const rel = partes.join('/');
    if (rel.startsWith('blog/') || rel === 'blog') continue;
    if (!/\.(html|xml|json|txt)$/.test(rel)) continue;
    if (rel === '.gerados.json') continue;
    if (!declarados.has(rel)) achados.push(`generate-blog.js escreve "${rel}" e ele não está em .gerados.json — vai subir velho`);
  }
  return [...new Set(achados)];
}

function checarSintaxe() {
  const achados = [];
  for (const f of fontes().filter((x) => x.endsWith('.js'))) {
    const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    if (r.status !== 0) achados.push(`${path.relative(ROOT, f)} — sintaxe inválida: ${(r.stderr || '').split('\n')[2] || ''}`);
  }
  return achados;
}

function selfTest() {
  const assert = require('assert');
  // 1. backspace no meio do codigo e pego, com a linha certa
  assert.strictEqual(achaControle('a\nb\n\bc').linha, 3);
  assert.strictEqual(achaControle('a\nb\n\bc').byte, '0x08');
  // 2. tab, quebra de linha e retorno sao codigo normal
  assert.strictEqual(achaControle('const a = 1;\t// ok\r\nconst b = 2;\n'), null);
  // 3. acento nao e caractere de controle
  assert.strictEqual(achaControle('const s = "história";'), null);
  // 4. o proprio arquivo passa
  assert.strictEqual(achaControle(fs.readFileSync(__filename, 'utf8')), null);

  // 5. barra invertida colada em TAB e escape mastigado
  const B = String.fromCharCode(92), T = String.fromCharCode(9);
  assert.ok(('call "%RAIZ%..' + B + T + 'estes.cmd"').includes(BARRA_TAB));
  // 6. TAB sozinho e alinhamento normal de codigo
  assert.ok(!('const a = 1;' + T + '// comentario alinhado').includes(BARRA_TAB));
  // 7. caminho do Windows com barras normais nao e falso positivo
  assert.ok(!('C:' + B + 'Users' + B + 'thall' + B + 'testes.cmd').includes(BARRA_TAB));

  console.log('[lint-rapido] self-test OK — 7 casos');
}

function main() {
  if (process.argv.includes('--self-test')) return selfTest();
  const achados = [...checarControle(), ...checarEscapeMastigado(), ...checarManifesto(), ...checarSintaxe()];
  if (!achados.length) {
    console.log('[lint-rapido] ok — sem caractere de controle, manifesto completo, sintaxe válida');
    return;
  }
  console.error(`[lint-rapido] ${achados.length} problema(s):`);
  for (const a of achados) console.error('  ' + a);
  process.exit(1);
}

main();
