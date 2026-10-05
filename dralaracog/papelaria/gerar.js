#!/usr/bin/env node
// Gera a papelaria da Dra. Lara Costa a partir dos moldes HTML desta pasta:
// PDFs de impressão, prévias, PNGs da marca, capas do Instagram, ícones e imagem de compartilhamento.
//
// Uso (na raiz do repositório):  node dralaracog/papelaria/gerar.js
// Precisa só do Chrome instalado. Sobe um servidor local efêmero porque o <use href="arquivo.svg#id">
// e as fontes não carregam por file://.

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('util');
const { execFile } = require('child_process');

const RAIZ = path.resolve(__dirname, '..', '..');
const DIR = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PERFIL = fs.mkdtempSync(path.join(os.tmpdir(), 'lara-chrome-'));
const MM = 96 / 25.4;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };
const rodar = util.promisify(execFile);

// Assíncrono de propósito: com execFileSync o servidor deste mesmo processo não responderia ao Chrome.
function chrome(url, args) {
  return rodar(CHROME, ['--headless=new', `--user-data-dir=${PERFIL}`, '--disable-gpu', '--hide-scrollbars',
    '--no-first-run', '--virtual-time-budget=6000', ...args, url]);
}
const pdf = (url, saida) => chrome(url, [`--print-to-pdf=${saida}`, '--no-pdf-header-footer']);
// O Chrome não abre janela pequena (o ícone de 180 px saía cortado). Moldes que se medem pela
// janela (vw/vmin: SVG e Instagram) renderizam numa janela maior e voltam ao tamanho pela escala.
const png = (url, saida, w, h, { escala = 1, transparente = false, relativo = false } = {}) => {
  const f = relativo ? Math.max(1, Math.ceil(600 / Math.min(w, h))) : 1;
  return chrome(url, [`--screenshot=${saida}`, `--window-size=${Math.round(w * f)},${Math.round(h * f)}`,
    `--force-device-scale-factor=${escala / f}`, ...(transparente ? ['--default-background-color=00000000'] : [])]);
};

function servidor() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://local');
      if (u.pathname === '/__svg') {
        res.writeHead(200, { 'content-type': TIPOS['.html'] });
        return res.end('<!doctype html><style>html,body{margin:0;background:transparent}img{display:block;width:100vw;height:100vh}</style>' +
          `<img src="${u.searchParams.get('f').replace(/[<>"]/g, '')}">`);
      }
      const arq = path.join(RAIZ, decodeURIComponent(u.pathname).replace(/\/$/, '/index.html'));
      if (!arq.startsWith(RAIZ) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'content-type': TIPOS[path.extname(arq)] || 'application/octet-stream' });
      fs.createReadStream(arq).pipe(res);
    });
    s.listen(0, '127.0.0.1', () => ok(s));
  });
}

// [molde, arquivo de saída, largura mm, altura mm da prévia, escala da prévia]
const DOCUMENTOS = [
  ['documento.html?doc=receituario', 'receituario-a5', 148, 210, 1],
  ['documento.html?doc=atestado', 'atestado-a5', 148, 210, 1],
  ['documento.html?doc=exames', 'solicitacao-de-exames-a5', 148, 210, 1],
  ['documento.html?doc=encaminhamento', 'encaminhamento-a5', 148, 210, 1],
  ['controle-especial.html', 'receituario-controle-especial-a4', 297, 210, 1],
  ['timbrado.html', 'papel-timbrado-a4', 210, 297, 1],
  ['cartao.html', 'cartao-de-visita', 96, 112, 2],
  ['envelope.html', 'envelope-dl', 220, 110, 1],
];
const LOGOS = [['simbolo', 1000], ['simbolo', 200], ['simbolo-noite', 1000], ['simbolo-marfim', 1000],
  ['horizontal', 2000], ['horizontal-negativo', 2000], ['vertical', 1400], ['vertical-negativo', 1400],
  ['carimbo', 1400], ['bordado', 2000]];
const DESTAQUES = ['sobre', 'agenda', 'duvidas', 'saude', 'rotina', 'gratidao'];

function proporcao(svgArq) {
  const vb = fs.readFileSync(svgArq, 'utf8').match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  return vb[3] / vb[2];
}

(async () => {
  const s = await servidor();
  const base = `http://127.0.0.1:${s.address().port}/dralaracog`;
  const pasta = (p) => { fs.mkdirSync(path.join(DIR, p), { recursive: true }); return path.join(DIR, p); };
  const pdfs = pasta('papelaria/pdf'), previas = pasta('papelaria/previa'), instagram = pasta('papelaria/instagram'), pngs = pasta('marca/png');
  try {
    for (const [molde, nome, w, h, escala] of DOCUMENTOS) {
      await pdf(`${base}/papelaria/${molde}`, path.join(pdfs, `${nome}.pdf`));
      await png(`${base}/papelaria/${molde}`, path.join(previas, `${nome}.png`), w * MM, h * MM, { escala });
      console.log('papelaria', nome);
    }
    for (const [nome, w] of LOGOS) {
      const h = w * proporcao(path.join(DIR, 'marca', `${nome}.svg`));
      await png(`${base.replace('/dralaracog', '')}/__svg?f=/dralaracog/marca/${nome}.svg`, path.join(pngs, `${nome}-${w}.png`), w, h, { transparente: true, relativo: true });
      console.log('marca', nome, w);
    }
    const insta = (peca, saida, w, h) => png(`${base}/papelaria/instagram.html?peca=${peca}`, saida, w, h, { relativo: true });
    for (const d of DESTAQUES) await insta(d, path.join(instagram, `destaque-${d}.png`), 1080, 1920);
    await insta('avatar', path.join(instagram, 'avatar.png'), 1080, 1080);
    await insta('avatar', path.join(DIR, 'img', 'icone-180.png'), 180, 180);
    await insta('avatar', path.join(DIR, 'img', 'icone-512.png'), 512, 512);
    await png(`${base}/papelaria/og.html`, path.join(DIR, 'img', 'og.png'), 1200, 630);
    console.log('instagram, ícones e og prontos');
  } finally {
    s.close();
    fs.rmSync(PERFIL, { recursive: true, force: true });
  }
})().catch((e) => { console.error(e); process.exit(1); });
