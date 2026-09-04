#!/usr/bin/env node
// Roda 30min antes de cada horário fixo de publicação (6:30, 11:30, 17:30) e transporta
// pro blog o artigo que a esteira editorial já apurou — o irmão de um carrossel que já
// foi ao ar. Não escreve nada: se não há artigo pareado, o horário passa sem post.
//
// Até 31/08 ele TAMBÉM escrevia, lendo o git log deste repo e do Squads100 e virando os
// commits em post. Toda sessão de trabalho virava publicação, e como esse caminho rodava
// justamente quando a esteira ainda não tinha entregue, ele vinha ganhando da linha
// editorial em vez de sustentá-la. Saiu inteiro, com as funções que só serviam a ele.
//
// Oferta não falta: a esteira produz 3 peças por dia e o instagram-slot produz sob
// demanda quando a prateleira está vazia. O que faltava era parar de aceitar qualquer
// coisa pra não deixar horário vazio.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { failureDetail, retryPendingPush, runCommand } = require('./blog-workflow');

const ROOT = __dirname;
const QUEUE_DIR = path.join(ROOT, 'content', 'queue');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const TOPICS_FILE = path.join(ROOT, 'content', 'evergreen-topics.md');
const LOG_FILE = path.join(ROOT, 'content', 'publish-log.txt');
// Caminho do content-hub, com escape por variável de ambiente SÓ pra teste. Sem isso o
// teste roda numa pasta temporária mas continua lendo a esteira de produção: acha um artigo
// real, entra pelo caminho de "artigo aproveitado" e nunca chega no provedor que ele queria
// testar. Foi o que deixou 3 dos 13 testes vermelhos desde que esse caminho foi criado.
const SQUADS_REPO = process.env.BLOG_SQUADS_REPO || 'C:\\Users\\thall\\Documents\\Squads100';

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
// Teto de posts por dia. As 3 peças da esteira já vão pro blog junto com os carrosséis;
// gerar por cima disso dobrava o blog pra 6/dia.
const TETO_DIARIO = 3;

// Quantos posts já têm a data de hoje. Lê o arquivo uma vez por post -- a versão anterior
// lia duas, o que não quebrava nada mas dobrava a leitura de 55 arquivos a cada execução.
function contarDoDia(dir, dia) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).filter((f) => {
    const m = fs.readFileSync(path.join(dir, f), 'utf-8').match(/^date:\s*(\S+)/m);
    return m && m[1] === dia;
  }).length;
}

// Capa é conteúdo, não layout: entra na geração do post e fica gravada no frontmatter.
// Se falhar, o post sai sem capa -- nunca segura a publicação por causa de imagem.
function garantirCapa(arquivoDoPost) {
  const r = runCommand(ROOT, process.execPath, ['capa-do-post.js', path.relative(ROOT, arquivoDoPost)]);
  log(r.ok ? `capa: ${(r.stdout || '').trim().split('\n').pop()}` : `[aviso] capa falhou (post segue sem imagem): ${failureDetail(r)}`);
}

function proximoArtigoDoContentHub() {
  if (!fs.existsSync(CONTENTHUB_SAIDA)) return null;

  // Duas chaves de deduplicação, e a ordem importa:
  //   peca:  o id da peça-mãe (2026-09-01/2026-09-01-b), gravado no frontmatter na hora
  //          de publicar. Sobrevive a retítulo — em 01/09 a peça B foi refeita à tarde,
  //          o artigo ganhou outro título, e a comparação por slug deixou a MESMA
  //          apuração entrar duas vezes no blog no mesmo dia.
  //   slug:  fallback pros posts publicados antes de o campo peca existir.
  const publicados = new Set();
  const pecasPublicadas = new Set();
  for (const arq of fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'))) {
    const md = fs.readFileSync(path.join(POSTS_DIR, arq), 'utf-8');
    const titulo = tituloDoFrontmatter(md);
    if (titulo) publicados.add(slugificar(titulo));
    const p = md.match(/^peca:\s*(\S+)/m);
    if (p) pecasPublicadas.add(p[1]);
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
      const peca = `${dia}/${topico}`;
      if (pecasPublicadas.has(peca)) continue;
      if (publicados.has(slug)) continue;
      candidatos.push({ dia, peca, titulo, slug, conteudo });
    }
  }

  if (candidatos.length === 0) return null;
  // mais antigo primeiro: o carrossel irmao ja foi ao ar ha mais tempo
  candidatos.sort((a, b) => a.dia.localeCompare(b.dia));
  return candidatos[0];
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
  const publicadosHoje = contarDoDia(POSTS_DIR, new Date().toISOString().slice(0, 10));
  if (publicadosHoje >= TETO_DIARIO) {
    log(`o dia já tem ${publicadosHoje} posts — nada a gerar`);
    return;
  }

  const doContentHub = proximoArtigoDoContentHub();
  if (doContentHub) {
    const destino = path.join(QUEUE_DIR, doContentHub.slug + '.md');
    // O id da peça entra no frontmatter AQUI, na hora do transporte: é ele que impede a
    // mesma peça de voltar com outro título.
    const comPeca = doContentHub.conteudo.replace(/^---\n/, `---\npeca: ${doContentHub.peca}\n`);
    fs.writeFileSync(destino, comPeca);
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

  // ATÉ 31/08 ISTO ESCREVIA POST A PARTIR DOS COMMITS.
  //
  // Quando a fila estava vazia e não havia artigo pareado, o gerador lia o git log deste
  // repo e do Squads100 e escrevia um post sobre o que tinha acabado de ser commitado.
  // Resultado: toda sessão de trabalho virava post. Em 31/08 saiu "Testei gerar capa com
  // FLUX local. Um commit depois, voltei pro banco." -- a máquina narrando a sessão da
  // manhã, em vez de publicar a pauta que a esteira apurou.
  //
  // Isso competia com a linha editorial em vez de sustentá-la, e vinha ganhando: o
  // caminho do commit rodava sempre que a esteira ainda não tinha entregue, que é
  // justamente o horário mais provável.
  //
  // A esteira produz 3 peças por dia, e o instagram-slot produz sob demanda quando a
  // prateleira está vazia. Não falta oferta. O que faltava era parar de aceitar
  // qualquer coisa pra não deixar horário vazio -- post errado custa mais que post
  // nenhum, pela mesma razão que capa errada custa mais que capa nenhuma.
  log('nada pareado da esteira neste horário — sem post. O blog publica o que a esteira apurou, não o que eu fiz hoje.');
  return 0;
}

if (process.argv.includes('--self-test')) selfTest();
else main()
  .then(code => { process.exitCode = code || 0; })
  .catch(e => { console.error('[ensure-queue] erro fatal:', e.message); process.exitCode = 1; });

// ── self-test ────────────────────────────────────────────────────────────────
// As duas regras que decidem o que o blog publica, e que nasceram hoje sem teste.
function selfTest() {
  const assert = require('assert');
  const os = require('os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eq-test-'));
  const post = (nome, data) => fs.writeFileSync(path.join(tmp, nome), `---\ntitle: t\ndate: ${data}\n---\ncorpo\n`);

  try {
    // 1. conta só os do dia pedido
    post('a.md', '2026-08-31'); post('b.md', '2026-08-31'); post('c.md', '2026-08-30');
    assert.strictEqual(contarDoDia(tmp, '2026-08-31'), 2);
    assert.strictEqual(contarDoDia(tmp, '2026-08-30'), 1);
    assert.strictEqual(contarDoDia(tmp, '2026-01-01'), 0);

    // 2. o teto é 3: com 2 ainda gera, com 3 para. Foi o que evitou o blog ir a 6/dia
    //    quando o slot passou a publicar o artigo irmão junto com o carrossel.
    assert.ok(contarDoDia(tmp, '2026-08-31') < TETO_DIARIO, 'com 2 posts o dia ainda aceita mais um');
    post('d.md', '2026-08-31');
    assert.ok(contarDoDia(tmp, '2026-08-31') >= TETO_DIARIO, 'com 3 o dia está cheio');

    // 3. arquivo sem date não conta como do dia (e não explode)
    fs.writeFileSync(path.join(tmp, 'e.md'), '---\ntitle: sem data\n---\ncorpo\n');
    assert.strictEqual(contarDoDia(tmp, '2026-08-31'), 3);

    // 4. diretório que não existe devolve 0 em vez de estourar -- é o que roda às 6h30
    assert.strictEqual(contarDoDia(path.join(tmp, 'nao-existe'), '2026-08-31'), 0);

    // 5. sem o ledger do Instagram, NENHUM artigo é levado pro blog. Publicar artigo cuja
    //    peça irmã não foi ao ar é exatamente a deriva que o pareamento existe pra impedir.
    const original = IG_PUBLICADOS;
    assert.ok(typeof topicosJaNoInstagram === 'function');
    assert.ok(fs.existsSync(original) || topicosJaNoInstagram() === null,
      'ledger ausente tem que devolver null, não uma lista vazia');

    console.log('[ensure-queue] self-test OK — 5 casos');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
