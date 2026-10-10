// Gerador de recibo: lógica pura, sem DOM. A página importa, o teste também.
//
// O que a quitação precisa dizer (Código Civil, Lei 10.406/2002, art. 320): "o valor e a
// espécie da dívida quitada, o nome do devedor, ou quem por este pagou, o tempo e o lugar
// do pagamento, com a assinatura do credor, ou do seu representante".
// https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm (consultado em 10/10/2026)
// Por isso valor, "referente a", pagador, data e cidade são obrigatórios aqui, e a folha
// impressa tem a linha de assinatura do recebedor.
//
// CNPJ alfanumérico (a partir de julho de 2026): 12 posições com 0-9 ou A-Z e 2 dígitos
// verificadores numéricos. Cada caractere vale (código ASCII - 48), então "0".."9" valem 0..9
// e "A".."Z" valem 17..42; DV por módulo 11 com pesos 2..9 da direita para a esquerda.
// Exemplo oficial: 12.ABC.345/01DE-35. Fonte: Receita Federal, Perguntas e Respostas
// "CNPJ alfanumérico", pergunta 14 (consultado em 10/10/2026). CNPJ só com números continua
// válido e passa pela mesma conta.

export const VALOR_MAXIMO = 99999999999; // R$ 999.999.999,99, em centavos

const UNI = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze',
  'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DEZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CEN = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos',
  'oitocentos', 'novecentos'];

function ate999(n) {
  if (n === 100) return 'cem';
  const r = n % 100;
  const partes = [CEN[Math.floor(n / 100)], r < 20 ? UNI[r] : DEZ[Math.floor(r / 10)], r < 20 ? '' : UNI[r % 10]];
  return partes.filter(Boolean).join(' e ');
}

// 1 a 999.999.999. As classes vão separadas por vírgula; a última entra com "e" quando é
// menor que 100 ou centena redonda ("mil e cem", "um milhão e quinhentos mil") e sem nada
// no caso contrário ("mil duzentos e trinta e quatro").
function inteiroPorExtenso(n) {
  const classes = [
    [Math.floor(n / 1e6), (g) => ate999(g) + (g === 1 ? ' milhão' : ' milhões')],
    [Math.floor(n / 1e3) % 1000, (g) => (g === 1 ? 'mil' : ate999(g) + ' mil')],
    [n % 1000, ate999],
  ].filter(([g]) => g);
  const ultimo = classes.at(-1)[0];
  return classes.map(([g, nome], i) => {
    if (i === 0) return nome(g);
    const junta = i < classes.length - 1 ? ', ' : ultimo < 100 || ultimo % 100 === 0 ? ' e ' : ' ';
    return junta + nome(g);
  }).join('');
}

export function valorPorExtenso(cents) {
  if (!Number.isInteger(cents) || cents < 1 || cents > VALOR_MAXIMO) {
    throw new RangeError('Valor por extenso só de R$ 0,01 a R$ 999.999.999,99, em centavos inteiros.');
  }
  const reais = Math.floor(cents / 100), c = cents % 100;
  const partes = [];
  if (reais) partes.push(inteiroPorExtenso(reais) + (reais % 1e6 === 0 ? ' de ' : ' ') + (reais === 1 ? 'real' : 'reais'));
  if (c) partes.push(ate999(c) + (c === 1 ? ' centavo' : ' centavos'));
  return partes.join(' e ');
}

// "R$ 1.234,56" → 123456. Vírgula é sempre decimal. Sem vírgula, ponto seguido de 1 ou 2
// dígitos no fim é decimal ("1234.56"); ponto em grupos de 3 é milhar ("1.234").
// Devolve centavos inteiros ou null.
export function parseValor(s) {
  const t = String(s ?? '').trim().replace(/^r\$\s*/i, '');
  const m = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/.exec(t) || /^(\d+)\.(\d{1,2})$/.exec(t);
  if (!m) return null;
  return Number(m[1].replace(/\./g, '')) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatValor = (cents) => BRL.format(cents / 100);

const limpaDoc = (s) => String(s ?? '').replace(/[\s./-]/g, '').toUpperCase();

// Módulo 11, pesos de 2 até `teto` da direita para a esquerda (CNPJ volta a 2 depois do 9).
function digito(valores, teto) {
  let soma = 0, peso = 2;
  for (let i = valores.length - 1; i >= 0; i--) {
    soma += valores[i] * peso;
    peso = peso === teto ? 2 : peso + 1;
  }
  const r = soma % 11;
  return r < 2 ? 0 : 11 - r;
}

export function validaCPF(s) {
  const d = limpaDoc(s);
  if (!/^\d{11}$/.test(d) || /^(.)\1+$/.test(d)) return false;
  const v = [...d].map(Number);
  return digito(v.slice(0, 9), 11) === v[9] && digito(v.slice(0, 10), 11) === v[10];
}

export function validaCNPJ(s) {
  const d = limpaDoc(s);
  if (!/^[0-9A-Z]{12}\d{2}$/.test(d) || /^(.)\1+$/.test(d)) return false;
  const v = [...d].map((ch) => ch.charCodeAt(0) - 48);
  return digito(v.slice(0, 12), 9) === v[12] && digito(v.slice(0, 13), 9) === v[13];
}

// Põe a máscara de CPF (11 dígitos) ou CNPJ (14 posições); qualquer outra coisa volta como veio.
export function formatDocumento(s) {
  const d = limpaDoc(s);
  if (/^\d{11}$/.test(d)) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  if (/^[0-9A-Z]{12}\d{2}$/.test(d)) return d.replace(/^(..)(...)(...)(....)(..)$/, '$1.$2.$3/$4-$5');
  return String(s ?? '').trim();
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro',
  'outubro', 'novembro', 'dezembro'];

// "2026-10-10" (valor de <input type="date">) → "10 de outubro de 2026"; data impossível → "".
export function dataPorExtenso(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ''));
  if (!m) return '';
  const [a, mes, d] = [+m[1], +m[2], +m[3]];
  const dt = new Date(Date.UTC(a, mes - 1, d));
  if (dt.getUTCFullYear() !== a || dt.getUTCMonth() !== mes - 1 || dt.getUTCDate() !== d) return '';
  return `${d === 1 ? '1º' : d} de ${MESES[mes - 1]} de ${a}`;
}

// Próximo número a partir dos já usados neste aparelho: pega o prefixo do último usado e
// soma 1 ao maior número com esse prefixo, mantendo os zeros à esquerda ("007" → "008",
// "2026-001" → "2026-002"). Sem número reconhecível, "".
export function proximoNumero(usados) {
  const partes = (usados || []).map((u) => /^(.*?)(\d+)$/.exec(String(u).trim())).filter(Boolean);
  if (!partes.length) return '';
  const prefixo = partes.at(-1)[1];
  let maior = null;
  for (const p of partes) if (p[1] === prefixo && (!maior || BigInt(p[2]) > BigInt(maior[2]))) maior = p;
  return prefixo + String(BigInt(maior[2]) + 1n).padStart(maior[2].length, '0');
}

const FORMAS = {
  pix: 'por Pix', dinheiro: 'em dinheiro', cartao: 'no cartão',
  transferencia: 'por transferência bancária', boleto: 'por boleto',
};

const ERROS = {
  recebedorNome: 'Escreva o nome de quem recebeu o dinheiro (você ou sua empresa).',
  pagadorNome: 'Escreva o nome de quem pagou.',
  valorVazio: 'Digite o valor recebido. Exemplo: 150,00.',
  valorFormato: 'Não entendi esse valor. Use só números, com vírgula nos centavos: 1.250,00.',
  valorZero: 'O valor precisa ser maior que zero.',
  valorMaximo: 'Este gerador vai até R$ 999.999.999,99.',
  referente: 'Diga a que se refere o pagamento. Exemplo: aluguel de outubro de 2026.',
  forma: 'Escolha a forma de pagamento.',
  data: 'Escolha a data do pagamento.',
  cidade: 'Escreva a cidade onde o pagamento foi feito.',
  cpf: 'Esse CPF não confere: os dois últimos números não batem com os nove primeiros. Confira se não trocou algum número.',
  cnpj: 'Esse CNPJ não confere: os dois últimos números não batem com o resto. Confira se não trocou algum caractere.',
  docTamanho: 'CPF tem 11 números e CNPJ tem 14 caracteres. Confira o que falta, ou deixe em branco.',
};

function checaDoc(s) {
  const d = limpaDoc(s);
  if (!d) return { doc: '' };
  if (/^\d{11}$/.test(d)) return validaCPF(d) ? { doc: 'CPF ' + formatDocumento(d) } : { erro: ERROS.cpf };
  if (d.length === 14) return validaCNPJ(d) ? { doc: 'CNPJ ' + formatDocumento(d) } : { erro: ERROS.cnpj };
  return { erro: ERROS.docTamanho };
}

const CAMPOS = ['recebedorNome', 'recebedorDoc', 'recebedorEndereco', 'pagadorNome', 'pagadorDoc',
  'valor', 'referente', 'forma', 'data', 'cidade', 'numero'];
const LACUNA = '_______________';

// Monta o recibo a partir do formulário. Sempre devolve `recibo` (com lacunas no que falta,
// para a prévia); `ok` só é true sem nenhum erro, e só então sai `texto` para copiar.
export function buildRecibo(input = {}) {
  const t = Object.fromEntries(CAMPOS.map((k) => [k, String(input[k] ?? '').replace(/\s+/g, ' ').trim()]));
  const erros = {};
  if (!t.recebedorNome) erros.recebedorNome = ERROS.recebedorNome;
  const rd = checaDoc(t.recebedorDoc);
  if (rd.erro) erros.recebedorDoc = rd.erro;
  if (!t.pagadorNome) erros.pagadorNome = ERROS.pagadorNome;
  const pd = checaDoc(t.pagadorDoc);
  if (pd.erro) erros.pagadorDoc = pd.erro;

  const cents = parseValor(t.valor);
  if (!t.valor) erros.valor = ERROS.valorVazio;
  else if (cents === null) erros.valor = ERROS.valorFormato;
  else if (cents === 0) erros.valor = ERROS.valorZero;
  else if (cents > VALOR_MAXIMO) erros.valor = ERROS.valorMaximo;
  const valorOk = !erros.valor;

  const referente = t.referente.replace(/[\s.;,]+$/, '');
  if (!referente) erros.referente = ERROS.referente;
  const forma = FORMAS[t.forma];
  if (!forma) erros.forma = ERROS.forma;
  const data = dataPorExtenso(t.data);
  if (!data) erros.data = ERROS.data;
  if (!t.cidade) erros.cidade = ERROS.cidade;

  const valor = valorOk ? formatValor(cents) : 'R$ ' + LACUNA;
  const valorExtenso = valorOk ? valorPorExtenso(cents) : '';
  const pagador = t.pagadorNome ? t.pagadorNome + (pd.doc ? ', ' + pd.doc : '') : LACUNA;
  const recibo = {
    titulo: t.numero ? `RECIBO Nº ${t.numero}` : 'RECIBO',
    valorCents: valorOk ? cents : 0,
    valor,
    valorExtenso,
    corpo: `Recebi de ${pagador}, a importância de ${valor} (${valorExtenso || LACUNA}), ` +
      `referente a ${referente || LACUNA}, paga ${forma || LACUNA}. ` +
      'Por ser verdade, firmo o presente recibo, dando quitação deste valor.',
    local: `${t.cidade || LACUNA}, ${data || LACUNA}.`,
    recebedor: { nome: t.recebedorNome, doc: rd.doc || '', endereco: t.recebedorEndereco },
  };
  const ok = Object.keys(erros).length === 0;
  const assinatura = [recibo.recebedor.nome, recibo.recebedor.doc, recibo.recebedor.endereco].filter(Boolean).join('\n');
  const texto = ok ? `*${recibo.titulo}*\nValor: ${valor}\n\n${recibo.corpo}\n\n${recibo.local}\n\n${assinatura}` : '';
  return { ok, erros, recibo, texto };
}

// ---------- modelo por tipo de recibo: /gerador-de-recibo/?modelo=<slug>, dados em modelos.json ----------
// O mesmo modelos.json alimenta as páginas /modelo-de-recibo/<slug>/ (pseo/recibo.js).
export function slugModelo(busca) {
  const s = new URLSearchParams(busca ?? '').get('modelo') ?? '';
  return s.length <= 60 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) ? s : null;
}

// Só os campos conhecidos: "referente a" com o limite do campo (200), forma que o select tem.
export function lerModelo(modelos, slug) {
  const m = slug && modelos && Object.hasOwn(modelos, slug) ? modelos[slug] : null;
  if (typeof m?.referente !== 'string' || !m.referente.trim()) return null;
  const txt = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
  return { nome: txt(m.nome, 80), referente: m.referente.slice(0, 200), forma: Object.hasOwn(FORMAS, m.forma) ? m.forma : 'pix', dica: txt(m.dica, 400) };
}

// Rascunho que vale perguntar antes de trocar (os dados de quem recebe ficam, como no "Novo recibo").
export const temRascunho = (campos) => ['pagadorNome', 'pagadorDoc', 'valor', 'referente'].some((k) => String(campos?.[k] ?? '').trim());
