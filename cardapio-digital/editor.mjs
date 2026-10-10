// Editor do cardápio digital. A lógica pura (preço, validação, link, QR) está em cardapio.mjs;
// aqui só o que mexe na página. Dado do usuário entra no DOM por .value e textContent.
import {
  parsePrice, formatPrice, validateMenu, encodeMenu, decodeMenu, qrLevel,
  SELOS, LIMITES, QR_LIMITE_M, QR_LIMITE_IMPRESSAO,
} from './cardapio.mjs';

const SITE = 'https://thallisribeiro.com.br/cardapio-digital/';
const LOCAL = location.origin + '/cardapio-digital/';
const CHAVE = 'cardapio-digital:rascunho';
const CAMPOS = ['nome', 'frase', 'whatsapp', 'instagram', 'endereco', 'horario'];

const EXEMPLO = {
  nome: 'Sabor da Vila (exemplo)', frase: 'Comida baiana feita na hora', whatsapp: '', instagram: '',
  endereco: '', horario: 'Ter a dom, 11h às 22h', tema: 'classico',
  secoes: [
    { nome: 'Entradas', itens: [
      { nome: 'Pastel de queijo', desc: 'Seis unidades, massa fina', preco: 1800, selos: ['vegetariano'] },
      { nome: 'Acarajé', desc: 'Com vatapá, caruru e camarão seco', preco: 1500, selos: ['picante'] },
    ] },
    { nome: 'Pratos', itens: [
      { nome: 'Moqueca de peixe (serve 2)', desc: 'Com arroz, pirão e farofa de dendê', preco: 11990, selos: ['sem-gluten'] },
      { nome: 'Moqueca de banana-da-terra', desc: 'Com arroz e farofa', preco: 6990, selos: ['vegano', 'sem-gluten'] },
    ] },
    { nome: 'Bebidas', itens: [
      { nome: 'Suco natural', desc: 'Cajá, umbu ou maracujá', preco: 900, selos: ['vegano'] },
      { nome: 'Água de coco', desc: '', preco: 800, selos: ['vegano', 'sem-gluten'] },
    ] },
  ],
};

const $ = (id) => document.getElementById(id);
const form = $('editor');
const lista = $('secoes');
const novoItem = () => ({ nome: '', desc: '', preco: null, selos: [] });
const totalItens = () => estado.secoes.reduce((n, s) => n + s.itens.length, 0);

function lerRascunho() {
  try { return validateMenu(JSON.parse(localStorage.getItem(CHAVE)), { rascunho: true }); } catch { return null; }
}
function salvarRascunho() {
  try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch { /* modo privado: segue sem rascunho */ }
}

function aviso(texto, erro) {
  const p = $('aviso');
  p.setAttribute('role', erro ? 'alert' : 'status');
  p.textContent = texto;
  p.hidden = !texto;
}

function marcarErro(input, idErro, ligado) {
  if (ligado) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
  $(idErro).hidden = !ligado;
}

// ---------- estado → formulário ----------

function preencherCampos() {
  for (const c of CAMPOS) form.elements[c].value = estado[c];
  for (const r of form.elements.tema) r.checked = r.value === estado.tema;
}

function prefixar(raiz, p) {
  for (const n of raiz.querySelectorAll('[id],[for],[aria-describedby]')) {
    for (const a of ['id', 'for', 'aria-describedby']) {
      const v = n.getAttribute(a);
      if (v) n.setAttribute(a, v.replace(/__/g, p));
    }
  }
}

// Reconstrói a lista de seções. Só roda em mudança de estrutura (somar, tirar, mover);
// digitação atualiza o estado direto, sem redesenhar.
function montar(foco) {
  const tplS = $('tpl-secao').content, tplI = $('tpl-item').content;
  const total = totalItens();
  lista.replaceChildren(...estado.secoes.map((s, si) => {
    const sec = tplS.firstElementChild.cloneNode(true);
    sec.dataset.s = si;
    prefixar(sec, `s${si}-`);
    sec.querySelector('[data-campo="nome"]').value = s.nome;
    sec.querySelector('[data-acao="subir-secao"]').disabled = si === 0;
    sec.querySelector('[data-acao="descer-secao"]').disabled = si === estado.secoes.length - 1;
    sec.querySelector('[data-acao="add-item"]').disabled = total >= LIMITES.itens;
    sec.querySelector('.cd-itens').append(...s.itens.map((it, ii) => {
      const li = tplI.firstElementChild.cloneNode(true);
      li.dataset.i = ii;
      prefixar(li, `s${si}-i${ii}-`);
      li.querySelector('[data-campo="nome"]').value = it.nome;
      li.querySelector('[data-campo="desc"]').value = it.desc;
      li.querySelector('[data-campo="preco"]').value = it.preco === null ? '' : formatPrice(it.preco).slice(3);
      for (const cb of li.querySelectorAll('[data-campo="selo"]')) cb.checked = it.selos.includes(cb.value);
      li.querySelector('[data-acao="subir-item"]').disabled = ii === 0;
      li.querySelector('[data-acao="descer-item"]').disabled = ii === s.itens.length - 1;
      return li;
    }));
    return sec;
  }));
  form.querySelector('[data-acao="add-secao"]').disabled = estado.secoes.length >= LIMITES.secoes;
  $('limite').textContent = total >= LIMITES.itens ? `Você chegou ao limite de ${LIMITES.itens} itens.`
    : estado.secoes.length >= LIMITES.secoes ? `Você chegou ao limite de ${LIMITES.secoes} seções.` : '';
  if (foco) {
    let alvo = form.querySelector(foco);
    if (alvo?.disabled) alvo = alvo.parentElement.querySelector('button:not(:disabled)');
    alvo?.focus();
  }
}

// ---------- formulário → estado ----------

function aoDigitar(e) {
  const t = e.target;
  const sec = t.closest('[data-s]');
  if (!sec) {
    if (t.name === 'tema') estado.tema = t.value;
    else if (CAMPOS.includes(t.name)) estado[t.name] = t.value;
    if (t.name === 'nome' && t.value.trim()) marcarErro(t, 'f-nome-erro', false);
  } else {
    const s = estado.secoes[sec.dataset.s];
    const li = t.closest('[data-i]');
    const alvo = li ? s.itens[li.dataset.i] : s;
    const campo = t.dataset.campo;
    if (campo === 'preco') {
      alvo.preco = parsePrice(t.value);
      marcarErro(t, t.id + '-erro', t.value.trim() !== '' && alvo.preco === null);
      if (e.type === 'change' && alvo.preco !== null) t.value = formatPrice(alvo.preco).slice(3);
    } else if (campo === 'selo') {
      alvo.selos = SELOS.filter((x) => (x === t.value ? t.checked : alvo.selos.includes(x)));
    } else if (campo) {
      alvo[campo] = t.value;
    }
  }
  agendar();
}

// Erro de WhatsApp e Instagram só ao sair do campo: no meio da digitação todo número é "inválido".
function conferirContato(e) {
  const t = e.target;
  if (t.name !== 'whatsapp' && t.name !== 'instagram') return;
  const limpo = validateMenu({ nome: 'x', [t.name]: t.value })[t.name];
  marcarErro(t, `f-${t.name}-erro`, t.value.trim() !== '' && !limpo);
}

form.addEventListener('input', aoDigitar);
form.addEventListener('change', aoDigitar);
form.addEventListener('change', conferirContato);

const troca = (arr, a, b) => { [arr[a], arr[b]] = [arr[b], arr[a]]; };

form.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-acao]');
  if (!b) return;
  const si = Number(b.closest('[data-s]')?.dataset.s);
  const ii = Number(b.closest('[data-i]')?.dataset.i);
  const s = estado.secoes[si];
  const sel = (sx, ix, resto) => `[data-s="${sx}"] ` + (ix === undefined ? '' : `[data-i="${ix}"] `) + resto;
  let foco;
  switch (b.dataset.acao) {
    case 'add-secao':
      estado.secoes.push({ nome: '', itens: totalItens() < LIMITES.itens ? [novoItem()] : [] });
      foco = sel(estado.secoes.length - 1, undefined, '[data-campo="nome"]');
      break;
    case 'subir-secao': troca(estado.secoes, si, si - 1); foco = sel(si - 1, undefined, '[data-acao="subir-secao"]'); break;
    case 'descer-secao': troca(estado.secoes, si, si + 1); foco = sel(si + 1, undefined, '[data-acao="descer-secao"]'); break;
    case 'remover-secao': {
      const n = s.itens.filter((i) => i.nome.trim()).length;
      if (n && !confirm(`Remover a seção "${s.nome || 'sem nome'}" e os ${n} itens dela?`)) return;
      estado.secoes.splice(si, 1);
      foco = estado.secoes.length ? sel(Math.min(si, estado.secoes.length - 1), undefined, '[data-campo="nome"]') : '[data-acao="add-secao"]';
      break;
    }
    case 'add-item':
      s.itens.push(novoItem());
      foco = sel(si, s.itens.length - 1, '[data-campo="nome"]');
      break;
    case 'subir-item': troca(s.itens, ii, ii - 1); foco = sel(si, ii - 1, '[data-acao="subir-item"]'); break;
    case 'descer-item': troca(s.itens, ii, ii + 1); foco = sel(si, ii + 1, '[data-acao="descer-item"]'); break;
    case 'remover-item':
      s.itens.splice(ii, 1);
      foco = s.itens.length ? sel(si, Math.min(ii, s.itens.length - 1), '[data-campo="nome"]') : sel(si, undefined, '[data-acao="add-item"]');
      break;
    default: return;
  }
  montar(foco);
  agendar();
});

$('zerar').addEventListener('click', () => {
  if (!confirm('Apagar todo o cardápio desta tela e começar um em branco?')) return;
  estado = { ...validateMenu({}, { rascunho: true }), tema: estado.tema, secoes: [{ nome: '', itens: [novoItem()] }] };
  preencherCampos();
  montar('#f-nome');
  aviso('');
  agendar();
});

$('ir-resultado').addEventListener('click', () => {
  if (!estado.nome.trim()) {
    marcarErro(form.elements.nome, 'f-nome-erro', true);
    form.elements.nome.focus();
    return;
  }
  $('resultado').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  $('resultado-titulo').focus({ preventScroll: true });
});

// ---------- saída: link, QR, plaquinhas ----------

let qrAtual = null;

function svgDoQr(qr) {
  const NS = 'http://www.w3.org/2000/svg';
  const n = qr.getModuleCount(), lado = n + 8; // 4 módulos de margem branca, como pede a norma
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + 4} ${r + 4}h1v1h-1z`;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${lado} ${lado}`);
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('aria-hidden', 'true');
  const fundo = document.createElementNS(NS, 'rect');
  fundo.setAttribute('width', lado);
  fundo.setAttribute('height', lado);
  fundo.setAttribute('fill', '#fff');
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', '#000');
  svg.append(fundo, path);
  return svg;
}

function el(tag, classe, texto) {
  const e = document.createElement(tag);
  e.className = classe;
  e.textContent = texto;
  return e;
}

function montarPlaquinhas(nome, svg) {
  const caixa = $('plaquinhas');
  caixa.replaceChildren();
  if (!svg) return caixa.append(el('p', 'cd-plaq-vazio', 'Escreva o nome do restaurante e gere o QR code para imprimir as plaquinhas.'));
  for (let k = 0; k < 4; k++) {
    const card = el('div', 'cd-plaquinha', '');
    card.append(el('p', 'cd-plaq-nome', nome), el('p', 'cd-plaq-texto', 'Aponte a câmera do celular para ver o cardápio'), svg.cloneNode(true));
    caixa.append(card);
  }
}

const medidor = $('medidor');
medidor.max = QR_LIMITE_IMPRESSAO;
medidor.low = QR_LIMITE_M;
medidor.high = Math.round(QR_LIMITE_IMPRESSAO * 0.9);
medidor.optimum = 0;

function mostrarSaida(menu, codigo) {
  $('saida').hidden = !menu;
  $('saida-vazia').hidden = !!menu;
  if (!menu) { qrAtual = null; return montarPlaquinhas(); }

  const publico = SITE + 'ver/#' + codigo;
  $('link-publico').value = publico;
  $('link-edicao').value = SITE + '#' + codigo;
  $('abrir').href = LOCAL + 'ver/#' + codigo;

  const nivel = qrLevel(publico);
  const n = publico.length;
  qrAtual = null;
  if (nivel.fits) {
    qrAtual = qrcode(0, nivel.level);
    qrAtual.addData(publico);
    qrAtual.make();
  }
  const svg = qrAtual && svgDoQr(qrAtual);
  $('qr').replaceChildren(svg || el('p', 'cd-sem-qr', 'Sem QR: o cardápio não cabe num QR code.'));
  $('baixar').disabled = $('imprimir').disabled = !qrAtual;
  montarPlaquinhas(menu.nome, svg);

  medidor.value = n;
  const lado = qrAtual ? ` O QR tem ${qrAtual.getModuleCount()} × ${qrAtual.getModuleCount()} quadradinhos.` : '';
  $('medidor-texto').textContent = `${n.toLocaleString('pt-BR')} de ${QR_LIMITE_IMPRESSAO.toLocaleString('pt-BR')} caracteres.${lado}`;
  const alerta = $('medidor-aviso');
  alerta.textContent = !nivel.fits
    ? 'O cardápio ficou grande demais para caber num QR code. O link ainda funciona no WhatsApp e no Instagram; para ter QR, encurte as descrições ou tire alguns itens.'
    : nivel.tooLong
      ? 'Link longo: o QR pode falhar em celular simples ou com pouca luz. Descrições mais curtas deixam o QR mais fácil de ler.'
      : nivel.level === 'L' ? 'Dica: descrições mais curtas deixam o QR mais fácil de ler.' : '';
  alerta.hidden = !alerta.textContent;
}

let timer, vez = 0;
function agendar() {
  clearTimeout(timer);
  timer = setTimeout(atualizar, 250);
}

async function atualizar() {
  const minha = ++vez;
  salvarRascunho();
  const menu = validateMenu(estado);
  // A prévia mostra o cardápio mesmo antes de ter nome.
  const previa = validateMenu({ ...estado, nome: estado.nome.trim() || 'Nome do restaurante' });
  const [codigo, codigoPrevia] = await Promise.all([menu && encodeMenu(menu), encodeMenu(previa)]);
  if (minha !== vez) return; // já existe uma versão mais nova a caminho
  // replace(): trocar só o # não recarrega a prévia e não enche o histórico do botão voltar.
  $('previa').contentWindow.location.replace(LOCAL + 'ver/#' + codigoPrevia);
  mostrarSaida(menu, codigo);
}

$('resultado').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-copiar]');
  if (!b) return;
  const input = $(b.dataset.copiar);
  try {
    await navigator.clipboard.writeText(input.value);
  } catch {
    input.select();
    document.execCommand('copy');
  }
  $('copiado').textContent = input.id === 'link-publico'
    ? 'Link do cardápio copiado.'
    : 'Link de edição copiado. Guarde num lugar seguro.';
});

$('baixar').addEventListener('click', () => {
  if (!qrAtual) return;
  const n = qrAtual.getModuleCount(), lado = n + 8;
  const escala = Math.max(1, Math.floor(1024 / lado)); // inteiro: módulo com borda nítida, ~1000 px
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = lado * escala;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (qrAtual.isDark(r, c)) ctx.fillRect((c + 4) * escala, (r + 4) * escala, escala, escala);
  }
  const nome = estado.nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qr-cardapio${nome ? '-' + nome : ''}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }, 'image/png');
});

$('imprimir').addEventListener('click', () => print());

// ---------- início ----------

let estado = lerRascunho() || JSON.parse(JSON.stringify(EXEMPLO));
if (window.cardapioCodigo) {
  const doLink = await decodeMenu(window.cardapioCodigo);
  if (doLink) {
    estado = doLink;
    aviso('Cardápio aberto pelo link de edição. Cada mudança gera um link e um QR novos.');
  } else {
    aviso('Este link de edição está incompleto ou quebrado (às vezes ele é cortado ao ser copiado). Mostramos o último rascunho salvo neste aparelho.', true);
  }
}
preencherCampos();
montar();
atualizar();

// Link de edição colado na mesma aba só troca o #, sem recarregar: recarrega para o script
// do <head> ler o cardápio (e tirá-lo do endereço antes do Analytics).
addEventListener('hashchange', () => { if (/^#v\d\./.test(location.hash)) location.reload(); });
