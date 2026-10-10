// Gerador de orçamento: toda a conta, sem DOM. Dinheiro sempre em centavos inteiros,
// quantidade em milésimos, percentual em centésimos de ponto (7,5% = 750).
// Testes: node --test test/ferramentas-orcamento.test.mjs

export const UNIDADES = ['un', 'h', 'm²', 'kg', 'serviço'];
const MAX_PARCELAS = 24;

export const ERROS = {
  descricao: 'Escreva o que é o item.',
  quantidade: 'Quantidade inválida. Use números, como 2 ou 1,5 (até 3 casas depois da vírgula).',
  'quantidade-zero': 'A quantidade precisa ser maior que zero.',
  valor: 'Valor inválido. Use números, como 150 ou 1.250,90 (até 2 casas depois da vírgula).',
  numero: 'Use só números, como 150 ou 1.250,90.',
  percentual: 'Use um percentual de 0 a 100.',
  'desconto-maior': 'O desconto ficou maior que a soma dos itens.',
  grande: 'Valor alto demais para esta ferramenta.',
  parcelas: `Use de 1 a ${MAX_PARCELAS} parcelas.`,
  entrada: 'Entrada inválida. Use números, como 500 ou 30 (se for em %).',
  'entrada-maior': 'A entrada precisa ser menor que o total. Sem parcelas, escolha “À vista”.',
  dias: 'Use de 1 a 365 dias.',
};

// "1.250,90", "1250.90", "R$ 1.250,90", "10%" -> inteiro com `casas` casas implícitas, ou null.
// Com vírgula, ela é a decimal e os pontos são milhar. Sem vírgula, ponto seguido de grupos de
// 3 dígitos é milhar ("1.234" = mil duzentos e trinta e quatro); senão é decimal ("10.5").
export function parseNumero(texto, casas) {
  let s = String(texto ?? '').replace(/\s|R\$|%/gi, '');
  if (s.includes(',')) {
    if (!/^\d{1,3}(\.\d{3})*,\d*$|^\d*,\d*$/.test(s)) return null;
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const m = /^(\d*)(?:\.(\d*))?$/.exec(s);
  if (!m || !(m[1] || m[2]) || m[1].length > 9 || (m[2] ?? '').length > casas) return null;
  return Number(m[1] || 0) * 10 ** casas + Number((m[2] ?? '').padEnd(casas, '0'));
}
export const parseValor = (t) => parseNumero(t, 2);
export const parseQuantidade = (t) => parseNumero(t, 3);

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const DEC = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });
export const formatValor = (centavos) => BRL.format(centavos / 100);
export const formatQuantidade = (mil) => DEC.format(mil / 1000);
export const formatPercentual = (cp) => DEC.format(cp / 100) + '%';

// a * b / d com meio arredondado para cima, exato mesmo quando a * b passa de 2^53.
const mulDiv = (a, b, d) => Number((BigInt(a) * BigInt(b) + BigInt(d / 2)) / BigInt(d));
export const subtotalLinha = (qtdMil, centavos) => mulDiv(qtdMil, centavos, 1000);

// Desconto e entrada: { tipo: 'valor' | 'percentual', valor: texto } sobre uma base em centavos.
function ajuste(base, aj) {
  const t = String(aj?.valor ?? '').trim();
  if (!t) return { centavos: 0 };
  const n = parseNumero(t, 2);
  if (n === null) return { centavos: 0, erro: 'numero' };
  if (aj.tipo !== 'percentual') return { centavos: n };
  if (n > 10000) return { centavos: 0, erro: 'percentual' };
  return { centavos: mulDiv(base, n, 10000), percentual: n };
}

export function calcular(orc = {}) {
  const linhas = [], erros = {};
  let subtotal = 0, validas = 0, comErro = 0;
  for (const it of orc?.itens ?? []) {
    const descricao = String(it?.descricao ?? '').trim(), vt = String(it?.valor ?? '').trim();
    // Linha nova vem com quantidade 1 e mais nada: não é erro, só não entra.
    if (!descricao && !vt) { linhas.push({ vazia: true, erros: [] }); continue; }
    const quantidade = parseQuantidade(it?.quantidade), valor = parseValor(vt), e = [];
    if (!descricao) e.push('descricao');
    if (quantidade === null) e.push('quantidade'); else if (quantidade === 0) e.push('quantidade-zero');
    if (valor === null) e.push('valor');
    let sub = e.length ? 0 : subtotalLinha(quantidade, valor);
    if (!Number.isSafeInteger(sub)) { e.push('grande'); sub = 0; }
    linhas.push({ descricao, quantidade, valor, subtotal: sub, erros: e, unidade: UNIDADES.includes(it?.unidade) ? it.unidade : 'un' });
    if (e.length) comErro++; else { validas++; subtotal += sub; }
  }
  const d = ajuste(subtotal, orc?.desconto);
  if (d.erro) erros.desconto = d.erro;
  else if (d.centavos > subtotal) { erros.desconto = 'desconto-maior'; d.centavos = 0; }
  const acrescimo = String(orc?.acrescimo ?? '').trim() ? parseValor(orc.acrescimo) : 0;
  if (acrescimo === null) erros.acrescimo = 'numero';
  let total = subtotal - d.centavos + (acrescimo ?? 0);
  if (!Number.isSafeInteger(subtotal + (acrescimo ?? 0))) { erros.total = 'grande'; subtotal = d.centavos = total = 0; }
  return {
    linhas, validas, comErro, subtotal, desconto: d.centavos, percentual: d.percentual ?? null,
    acrescimo: acrescimo ?? 0, total, erros, ok: comErro === 0 && Object.keys(erros).length === 0,
  };
}

// ---------- datas: 'AAAA-MM-DD' em dias de calendário (UTC só como régua, sem fuso nem horário de verão) ----------
export function parseDias(t) {
  const s = String(t ?? '').trim();
  return /^\d{1,3}$/.test(s) && +s >= 1 && +s <= 365 ? +s : null;
}

export function somarDias(iso, dias) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ''));
  if (!m || !Number.isInteger(dias)) return null;
  const base = new Date(Date.UTC(+m[1], m[2] - 1, +m[3]));
  if (base.getUTCDate() !== +m[3] || base.getUTCMonth() !== m[2] - 1) return null; // 30/02 e afins
  base.setUTCDate(base.getUTCDate() + dias);
  return base.toISOString().slice(0, 10);
}

const doisDig = (n) => String(n).padStart(2, '0');
export const hojeISO = (d = new Date()) => `${d.getFullYear()}-${doisDig(d.getMonth() + 1)}-${doisDig(d.getDate())}`;
export const formatData = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(iso ?? '') ? iso.split('-').reverse().join('/') : '');

// ---------- pagamento ----------
// { tipo: 'avista' | 'parcelado', entrada: {tipo, valor}, parcelas, forma }
export function calcularPagamento(total, pag = {}) {
  if (pag?.tipo !== 'parcelado') return { tipo: 'avista', entrada: 0, parcelas: [] };
  const n = Number(String(pag.parcelas ?? '').trim() || NaN);
  if (!Number.isInteger(n) || n < 1 || n > MAX_PARCELAS) return { erro: 'parcelas' };
  const ent = ajuste(total, pag.entrada);
  if (ent.erro) return { erro: ent.erro === 'numero' ? 'entrada' : 'entrada-maior' };
  if (ent.centavos > total || (total > 0 && ent.centavos === total)) return { erro: 'entrada-maior' };
  const resto = total - ent.centavos, base = Math.floor(resto / n);
  const parcelas = Array(n).fill(base);
  parcelas[0] += resto - base * n; // os centavos que sobram da divisão vão na 1ª
  return { tipo: 'parcelado', entrada: ent.centavos, percentual: ent.percentual ?? null, parcelas };
}

export function textoPagamento(total, pag) {
  const p = calcularPagamento(total, pag);
  if (p.erro) return '';
  if (p.tipo === 'avista') return `À vista: ${formatValor(total)}`;
  const n = p.parcelas.length, [a, b] = p.parcelas;
  let t = n === 1 ? `1 parcela de ${formatValor(a)}`
    : a === b ? `${n} parcelas de ${formatValor(a)}`
    : n === 2 ? `2 parcelas: 1ª de ${formatValor(a)} e 2ª de ${formatValor(b)}`
    : `${n} parcelas: 1ª de ${formatValor(a)} e as outras ${n - 1} de ${formatValor(b)}`;
  if (p.entrada) t = `Entrada de ${formatValor(p.entrada)}${p.percentual === null ? '' : ` (${formatPercentual(p.percentual)})`} + ${t}`;
  return t;
}

// ---------- numeração ----------
export const formatNumero = (n) => 'ORC-' + String(n).padStart(4, '0');
export const numeroDe = (t) => Number(/(\d+)\D*$/.exec(String(t ?? ''))?.[1] ?? 0);

// ---------- resumo para WhatsApp ----------
const MAX_ITENS_RESUMO = 5;

export function resumoWhatsApp(orc = {}) {
  const r = calcular(orc), txt = (v) => String(v ?? '').trim();
  const linhas = r.linhas.filter((l) => !l.vazia && !l.erros.length);
  const out = [txt(orc.numero) ? `*Orçamento ${txt(orc.numero)}*` : '*Orçamento*'];
  if (txt(orc.empresa?.nome)) out.push(`De: ${txt(orc.empresa.nome)}`);
  if (txt(orc.cliente?.nome)) out.push(`Para: ${txt(orc.cliente.nome)}`);
  out.push('');
  for (const l of linhas.slice(0, MAX_ITENS_RESUMO))
    out.push(`• ${l.descricao} (${formatQuantidade(l.quantidade)} ${l.unidade}): ${formatValor(l.subtotal)}`);
  if (linhas.length > MAX_ITENS_RESUMO) out.push(`+ ${linhas.length - MAX_ITENS_RESUMO} itens (detalhes no orçamento completo)`);
  if (r.desconto || r.acrescimo) out.push(`Subtotal: ${formatValor(r.subtotal)}`);
  if (r.desconto) out.push(`Desconto${r.percentual === null ? '' : ` (${formatPercentual(r.percentual)})`}: -${formatValor(r.desconto)}`);
  if (r.acrescimo) out.push(`Frete/acréscimo: ${formatValor(r.acrescimo)}`);
  out.push(`*Total: ${formatValor(r.total)}*`, '');
  const pag = textoPagamento(r.total, orc.pagamento);
  if (pag) out.push(`Pagamento: ${pag}`);
  if (txt(orc.pagamento?.forma)) out.push(`Forma: ${txt(orc.pagamento.forma)}`);
  if (txt(orc.prazo)) out.push(`Prazo de execução: ${txt(orc.prazo)}`);
  const ate = somarDias(orc.emissao, parseDias(orc.validadeDias));
  if (ate) out.push(`Válido até ${formatData(ate)}`);
  return out.join('\n').trim();
}

// Sem número: o WhatsApp abre a lista de conversas e a pessoa escolhe o cliente.
export const linkWhatsApp = (texto) => 'https://wa.me/?text=' + encodeURIComponent(texto);

// ---------- modelo por ofício: /gerador-de-orcamento/?modelo=<slug>, itens em modelos.json ----------
// O mesmo modelos.json alimenta as páginas /modelo-de-orcamento/<slug>/ (pseo/orcamento.js).
export function slugModelo(busca) {
  const s = new URLSearchParams(busca ?? '').get('modelo') ?? '';
  return s.length <= 60 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) ? s : null;
}

// Só os campos conhecidos, com os limites dos campos da página; preço nunca vem do modelo.
export function lerModelo(modelos, slug) {
  const m = slug && modelos && Object.hasOwn(modelos, slug) ? modelos[slug] : null;
  if (!Array.isArray(m?.itens) || !m.itens.length) return null;
  const txt = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
  return {
    nome: txt(m.nome, 80),
    itens: m.itens.slice(0, 200).map((it) => ({
      descricao: txt(it?.descricao, 500),
      unidade: UNIDADES.includes(it?.unidade) ? it.unidade : 'un',
      quantidade: txt(it?.quantidade, 12) || '1',
      valor: '',
    })),
    observacoes: txt(m.observacoes, 2000),
  };
}

// Rascunho que vale perguntar antes de trocar (dados da empresa não contam: eles ficam).
export const temConteudo = (orc) => Boolean(String(orc?.cliente?.nome ?? '').trim() || String(orc?.observacoes ?? '').trim()
  || (orc?.itens ?? []).some((i) => String(i?.descricao ?? '').trim() || String(i?.valor ?? '').trim()));
