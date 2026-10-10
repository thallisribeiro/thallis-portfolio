// Lógica do gerador de QR Code Pix estático. Sem DOM: a página importa, o teste também.
//
// Fontes (consultadas em 10/10/2026):
// - Manual do BR Code v2.0.1, BCB: layout EMV QRCPS-MPM, tabela 1 (00, 26-51, 52, 53, 54, 58, 59, 60, 62, 63)
//   e CRC16 polinômio 0x1021, valor inicial 0xFFFF, calculado sobre tudo até "6304" inclusive.
//   https://www.bcb.gov.br/content/estabilidadefinanceira/spb_docs/ManualBRCode.pdf
// - Manual de Padrões para Iniciação do Pix v2.10.0 (19/08/2026), BCB: seções 2.5.1 (formato das chaves),
//   2.6 (QR estático: 26-00 GUI br.gov.bcb.pix, 26-01 chave até 77, 26-02 infoAdicional, divisão dos 99
//   caracteres), 2.6.2 (txid 62-05: só A-Z, a-z, 0-9, até 25; "***" quando não usado) e o exemplo 2.6.3.
//   https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf
// - Expressões regulares das chaves: especificação da API do DICT, BCB.
//   https://www.bcb.gov.br/content/estabilidadefinanceira/pix/API-DICT.html
// - CNPJ alfanumérico (a partir de julho de 2026): 12 posições 0-9/A-Z + 2 dígitos verificadores, módulo 11
//   com o valor ASCII do caractere menos 48. Receita Federal, perguntas e respostas "CNPJ alfanumérico".
// - Nome (59) e cidade (60) têm formato "ans" do EMV: só o conjunto comum de caracteres, ou seja, ASCII
//   imprimível. O tamanho de cada campo conta caracteres; com tudo em ASCII, caractere = byte, e não há
//   leitor que conte diferente.

import { DDDS } from '../gerador-de-link-whatsapp/whatsapp.mjs';

export const ERROS = {
  chave_vazia: 'Digite a sua chave Pix.',
  chave_cpf: 'CPF inválido. Confira os 11 números.',
  chave_cnpj: 'CNPJ inválido. Confira os 14 caracteres (o CNPJ novo pode ter letras).',
  chave_celular: 'Celular da chave tem DDD e 9 dígitos começando com 9. Exemplo: (73) 98889-9345.',
  chave_celular_ddd: 'Esse DDD não existe. Confira os dois números do DDD.',
  chave_email: 'E-mail inválido. Confira o @ e o final, como nome@gmail.com (até 77 caracteres, sem acento).',
  chave_aleatoria: 'A chave aleatória tem 32 letras e números com 4 traços, como 123e4567-e12b-12d1-a456-426655440000. Copie do app do banco.',
  chave_ambigua: 'Esses 11 números podem ser CPF ou celular. Escolha o tipo da chave no campo acima.',
  chave_desconhecida: 'Não reconheci essa chave. Escolha o tipo da chave no campo acima e confira o que digitou.',
  chave_invalida: 'Chave fora do formato do Pix.',
  nome_vazio: 'Digite o nome de quem recebe.',
  cidade_vazia: 'Digite a cidade.',
  valor_invalido: 'Valor inválido. Use só números, como 25,90.',
  valor_zero: 'O valor precisa ser maior que zero. Para o cliente digitar o valor, deixe em branco.',
  valor_centavos: 'Use no máximo dois números depois da vírgula.',
  valor_alto: 'Valor acima do limite do padrão Pix (R$ 9.999.999.999,99).',
  txid_invalido: 'Use só letras sem acento e números, sem espaço, até 25.',
  descricao_longa: 'Descrição longa demais para essa chave. Encurte o texto.',
  conferir_vazio: 'Cole um código Pix copia e cola.',
  conferir_formato: 'Isso não é um código Pix copia e cola: a estrutura não bate com o padrão do Banco Central.',
  conferir_sem_crc: 'O código está cortado: falta o final (o dígito de conferência que começa com 6304).',
  conferir_crc: 'O código foi alterado ou copiado pela metade: o dígito de conferência não bate. O banco vai recusar.',
  conferir_sem_pix: 'O código está no padrão BR Code, mas não tem dados de Pix.',
  conferir_incompleto: 'Faltam campos obrigatórios no código (ou a moeda não é real). Alguns bancos vão recusar.',
};

const GUI = 'br.gov.bcb.pix';
export const TIPOS = ['cpf', 'cnpj', 'celular', 'email', 'aleatoria'];

export function crc16(str) {
  let crc = 0xffff;
  for (const b of new TextEncoder().encode(str)) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Módulo 11 dos dois dígitos verificadores. Pesos da direita para a esquerda a partir de 2: no CPF
// sobem sem parar (2..11), no CNPJ voltam a 2 depois do 9. O CNPJ alfanumérico usa ASCII - 48, que
// para dígito dá o próprio dígito e para letra dá A=17 ... Z=42.
function dvOk(s, ciclo) {
  if (new Set(s).size === 1) return false; // 111.111.111-11 e afins passam na conta, mas não existem
  const v = [...s].map((c) => c.charCodeAt(0) - 48);
  for (const n of [s.length - 2, s.length - 1]) {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += v[n - 1 - i] * ((i % ciclo) + 2);
    const resto = soma % 11;
    if (v[n] !== (resto < 2 ? 0 : 11 - resto)) return false;
  }
  return true;
}
const cpfOk = (d) => /^\d{11}$/.test(d) && dvOk(d, Infinity);
const cnpjOk = (d) => /^[0-9A-Z]{12}\d{2}$/.test(d) && dvOk(d, 8);

const EMAIL = /^[a-z0-9.!#$'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/;
const EVP = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const VALIDA = {
  cpf(s) {
    const d = s.replace(/[.\-\s]/g, '');
    return cpfOk(d) ? d : 'chave_cpf';
  },
  cnpj(s) {
    const d = s.replace(/[.\-/\s]/g, '').toUpperCase();
    return cnpjOk(d) ? d : 'chave_cnpj';
  },
  celular(s) {
    let d = s.replace(/\D/g, '');
    if (s.startsWith('+')) {
      if (!d.startsWith('55')) return 'chave_celular';
      d = d.slice(2);
    } else {
      d = d.replace(/^0+/, ''); // 0 de tronco
      if (d.length === 13 && d.startsWith('55')) d = d.slice(2);
    }
    if (!/^\d{11}$/.test(d)) return 'chave_celular';
    if (!DDDS.has(d.slice(0, 2))) return 'chave_celular_ddd';
    return d[2] === '9' ? '+55' + d : 'chave_celular';
  },
  email(s) {
    const e = s.toLowerCase();
    // O DICT aceita domínio sem ponto; ninguém tem e-mail assim, e "fulano@gmailcom" é erro de digitação.
    return e.length <= 77 && EMAIL.test(e) && e.split('@')[1].includes('.') ? e : 'chave_email';
  },
  aleatoria(s) {
    let e = s.toLowerCase();
    if (/^[0-9a-f]{32}$/.test(e)) e = e.replace(/^(.{8})(.{4})(.{4})(.{4})/, '$1-$2-$3-$4-');
    return EVP.test(e) ? e : 'chave_aleatoria';
  },
};

function detecta(s) {
  if (s.includes('@')) return 'email';
  if (/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(s)) return 'aleatoria';
  if (s.startsWith('+')) return 'celular';
  const d = s.replace(/[.\-/\s()]/g, '');
  if (/^\d{11}$/.test(d)) {
    const cpf = cpfOk(d), cel = !VALIDA.celular(d).startsWith('chave_');
    if (cpf && cel) return 'ambigua';
    return cel ? 'celular' : 'cpf';
  }
  if (/^[0-9a-z]{14}$/i.test(d)) return 'cnpj';
  if (/^\d{10}$|^\d{12,13}$/.test(d)) return 'celular';
  return 'desconhecida';
}

// tipo: um de TIPOS, ou vazio para descobrir pelo formato. Devolve a chave no formato do DICT.
export function validateKey(raw, tipo) {
  const s = String(raw ?? '').trim();
  if (!s) return { error: 'chave_vazia' };
  const type = tipo || detecta(s);
  if (!VALIDA[type]) return { error: 'chave_' + type };
  const r = VALIDA[type](s);
  return r.startsWith('chave_') ? { error: r } : { type, value: r };
}

// Só para mostrar na tela e no cartaz; no QR a chave vai sem pontuação.
export function formataChave(type, v) {
  if (type === 'cpf') return v.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  if (type === 'cnpj') return v.replace(/^(\w{2})(\w{3})(\w{3})(\w{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  if (type === 'celular') return v.replace(/^\+55(\d\d)(\d{5})(\d{4})$/, '+55 ($1) $2-$3');
  return v;
}

// Nome, cidade e descrição: sem acento, só ASCII imprimível, espaços colapsados, cortado em max.
export function textoPix(s, max) {
  return String(s ?? '')
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-')
    .replace(/[^\x20-\x7e]/g, ' ').replace(/ {2,}/g, ' ').trim()
    .slice(0, max).trim();
}

// 26 = 00(GUI, 4+14) + 01(chave, 4+n) + 02(4+descrição) <= 99. Tabela do manual: descrição até 72.
export const maxDescricao = (key) => Math.max(0, Math.min(72, 99 - 18 - 4 - String(key).length - 4));

// "25,90", "R$ 1.234,56", "1.234" (milhar), "10.5" (ponto decimal). null = vazio; NaN = não é valor.
export function parseValor(text) {
  let s = String(text ?? '').replace(/r\$|\s/gi, '');
  if (!s) return null;
  if (s.includes(',')) {
    if (!/^(\d{1,3}(\.\d{3})+|\d+),\d{1,2}$/.test(s)) return NaN;
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  else if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
  return Number(s);
}

function formataValor(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) throw new Error('valor_invalido');
  if (n <= 0) throw new Error('valor_zero');
  const s = n.toFixed(2);
  if (Math.abs(Number(s) - n) > 1e-6) throw new Error('valor_centavos'); // 0.1 + 0.2 passa; 10.005 não
  if (s.length > 13) throw new Error('valor_alto'); // campo 54: 01..13 caracteres
  return s;
}

const tlv = (id, v) => id + String(v.length).padStart(2, '0') + v;

export function buildPayload({ key, name, city, amount, txid, description } = {}) {
  key = String(key ?? '');
  // Aqui a chave já vem no formato do DICT: ela só vale se algum tipo a devolve sem mudar nada.
  if (!TIPOS.some((t) => validateKey(key, t).value === key)) throw new Error('chave_invalida');
  const nome = textoPix(name, 25);
  if (!nome) throw new Error('nome_vazio');
  const cidade = textoPix(city, 15);
  if (!cidade) throw new Error('cidade_vazia');
  const desc = textoPix(description, 99);
  if (desc.length > maxDescricao(key)) throw new Error('descricao_longa');
  const id = String(txid ?? '').trim() || '***';
  if (id !== '***' && !/^[A-Za-z0-9]{1,25}$/.test(id)) throw new Error('txid_invalido');
  const valor = amount === undefined || amount === null || amount === '' ? '' : formataValor(amount);

  const p = tlv('00', '01') +
    tlv('26', tlv('00', GUI) + tlv('01', key) + (desc ? tlv('02', desc) : '')) +
    tlv('52', '0000') +
    tlv('53', '986') +
    (valor ? tlv('54', valor) : '') +
    tlv('58', 'BR') +
    tlv('59', nome) +
    tlv('60', cidade) +
    tlv('62', tlv('05', id)) +
    '6304';
  return p + crc16(p);
}

// Lê "ID, tamanho, valor" em sequência. Conta caracteres (pontos de código), não bytes. null = malformado.
function lerTLV(texto) {
  const s = Array.from(texto), out = [];
  for (let i = 0; i < s.length;) {
    const id = s.slice(i, i + 2).join(''), tam = s.slice(i + 2, i + 4).join('');
    if (!/^\d\d$/.test(id) || !/^\d\d$/.test(tam) || tam === '00') return null;
    const v = s.slice(i + 4, i + 4 + Number(tam));
    if (v.length !== Number(tam)) return null;
    out.push([id, v.join('')]);
    i += 4 + Number(tam);
  }
  return out;
}

const sub = (v) => Object.fromEntries(lerTLV(v ?? '') ?? []);

export function parsePayload(str) {
  const texto = String(str ?? '').trim();
  const r = { ok: false, erro: '', crc: null, campos: {}, ordem: [], pix: null };
  if (!texto) return { ...r, erro: 'vazio' };
  const raiz = lerTLV(texto);
  if (!raiz || raiz[0][0] !== '00' || raiz[0][1] !== '01') return { ...r, erro: 'formato' };
  for (const [id, v] of raiz) {
    if (id in r.campos) return { ...r, erro: 'formato' }; // ID repetido na raiz não pode
    r.campos[id] = v;
    r.ordem.push(id);
  }
  const [idFim, crcInformado] = raiz.at(-1);
  if (idFim !== '63' || crcInformado.length !== 4) return { ...r, erro: 'sem_crc' };
  const calculado = crc16(texto.slice(0, -4));
  r.crc = { informado: crcInformado, calculado, ok: crcInformado.toUpperCase() === calculado };

  const conta = r.ordem.filter((id) => id >= '26' && id <= '51').map((id) => sub(r.campos[id]))
    .find((t) => String(t['00']).toLowerCase() === GUI);
  if (conta) {
    r.pix = { chave: conta['01'], descricao: conta['02'], url: conta['25'], valor: r.campos['54'],
      nome: r.campos['59'], cidade: r.campos['60'], txid: sub(r.campos['62'])['05'] };
  }
  const completo = ['52', '58', '59', '60', '62'].every((id) => id in r.campos) && r.campos['53'] === '986';
  r.erro = !r.crc.ok ? 'crc' : !conta ? 'sem_pix' : !completo ? 'incompleto' : '';
  r.ok = !r.erro;
  return r;
}
