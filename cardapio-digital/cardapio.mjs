// Cardápio digital: tudo que não toca no DOM.
//
// Não há servidor: o cardápio inteiro mora no próprio link, depois do #
// ("v1." + base64url(deflate-raw(JSON compacto)), ver empacotar). O # nunca é enviado ao servidor, e tudo que
// chega por decodeMenu é dado não confiável — por isso decodeMenu sempre passa por
// validateMenu, e as páginas só renderizam com textContent.

export const TEMAS = ['classico', 'escuro', 'praia'];
export const SELOS = ['vegetariano', 'vegano', 'sem-gluten', 'picante'];
export const LIMITES = {
  nome: 60, frase: 100, endereco: 120, horario: 80,
  secao: 40, item: 60, desc: 140, secoes: 12, itens: 150,
};
const MAX_CENTAVOS = 9_999_999; // R$ 99.999,99
const MAX_CODIGO = 200_000; // caracteres depois do "v1."
const MAX_JSON = 512 * 1024; // bytes descomprimidos: barra bomba de compressão no link

// ---------- preço ----------

// "R$ 1.234,50" → 123450 centavos. Aceita "25", "25,9", "25,90", "1.234,50" e o "25.90"
// de quem digita no padrão americano. Qualquer outra coisa → null.
export function parsePrice(s) {
  if (typeof s !== 'string') return null;
  const t = s.replace(/^\s*r\$/i, '').replace(/\s/g, '');
  const m = t.match(/^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/) || t.match(/^(\d+)\.(\d{1,2})$/);
  if (!m) return null;
  const c = Number(m[1].replace(/\./g, '')) * 100 + Number((m[2] || '0').padEnd(2, '0'));
  return c <= MAX_CENTAVOS ? c : null;
}

// Feito à mão em vez de Intl: Intl põe espaço não separável e varia entre navegadores.
export function formatPrice(c) {
  const reais = String(Math.floor(c / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${reais},${String(c % 100).padStart(2, '0')}`;
}

// ---------- validação ----------

// Apara, troca caractere de controle por espaço e corta por caractere (não parte emoji).
const texto = (v, max) => typeof v === 'string'
  ? [...v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim()].slice(0, max).join('').trim()
  : '';

const lista = (v) => (Array.isArray(v) ? v : []);
const objeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function arroba(v) {
  if (typeof v !== 'string') return '';
  const h = v.trim()
    .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '');
  return /^[A-Za-z0-9._]{1,30}$/.test(h) ? h : '';
}

// Devolve um cardápio limpo (só campos conhecidos, dentro dos limites) ou null.
// rascunho: true é para o autosave do editor — aceita nome vazio e itens ainda sem nome.
export function validateMenu(obj, { rascunho = false } = {}) {
  if (!objeto(obj)) return null;
  const nome = texto(obj.nome, LIMITES.nome);
  if (!nome && !rascunho) return null;
  const zap = typeof obj.whatsapp === 'string' ? obj.whatsapp.replace(/\D/g, '') : '';

  let restam = LIMITES.itens;
  const secoes = [];
  for (const s of lista(obj.secoes)) {
    if (secoes.length === LIMITES.secoes) break;
    if (!objeto(s)) continue;
    const nomeSecao = texto(s.nome, LIMITES.secao);
    if (!nomeSecao && !rascunho) continue;
    const itens = [];
    for (const i of lista(s.itens)) {
      if (!restam) break;
      if (!objeto(i)) continue;
      const nomeItem = texto(i.nome, LIMITES.item);
      if (!nomeItem && !rascunho) continue;
      const p = i.preco;
      itens.push({
        nome: nomeItem,
        desc: texto(i.desc, LIMITES.desc),
        preco: Number.isInteger(p) && p >= 0 && p <= MAX_CENTAVOS ? p : null,
        selos: SELOS.filter((x) => lista(i.selos).includes(x)),
      });
      restam--;
    }
    secoes.push({ nome: nomeSecao, itens });
  }

  return {
    nome,
    frase: texto(obj.frase, LIMITES.frase),
    whatsapp: /^\d{10,13}$/.test(zap) ? zap : '',
    instagram: arroba(obj.instagram),
    endereco: texto(obj.endereco, LIMITES.endereco),
    horario: texto(obj.horario, LIMITES.horario),
    tema: TEMAS.includes(obj.tema) ? obj.tema : 'classico',
    secoes,
  };
}

// ---------- link ----------

const paraB64 = (bytes) => {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const deB64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function ler(stream, max = Infinity) {
  const leitor = stream.getReader();
  const partes = [];
  let total = 0;
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    total += value.length;
    if (total > max) { leitor.cancel().catch(() => {}); return null; }
    partes.push(value);
  }
  return new Uint8Array(await new Blob(partes).arrayBuffer());
}

// No link o cardápio vai como lista, sem nomes de campo, e os selos como bits: o link do
// cardápio de exemplo cai ~20% (527 → 418 caracteres), e cada byte a menos deixa o QR
// mais fácil de ler. [nome, frase, whatsapp, instagram, endereco, horario, tema,
// [[secao, [[item, desc, preco, selos]]]]]
const empacotar = (m) => [m.nome, m.frase, m.whatsapp, m.instagram, m.endereco, m.horario, TEMAS.indexOf(m.tema),
  m.secoes.map((s) => [s.nome, s.itens.map((i) => [i.nome, i.desc, i.preco, i.selos.reduce((b, x) => b | (1 << SELOS.indexOf(x)), 0)])])];

const desempacotar = (a) => Array.isArray(a) && {
  nome: a[0], frase: a[1], whatsapp: a[2], instagram: a[3], endereco: a[4], horario: a[5], tema: TEMAS[a[6]],
  secoes: lista(a[7]).map((s) => Array.isArray(s) && {
    nome: s[0],
    itens: lista(s[1]).map((i) => Array.isArray(i) && { nome: i[0], desc: i[1], preco: i[2], selos: SELOS.filter((_, k) => i[3] & (1 << k)) }),
  }),
};

export async function encodeMenu(menu) {
  const m = validateMenu(menu);
  if (!m) throw new TypeError('cardápio inválido: falta o nome do restaurante');
  const bytes = new TextEncoder().encode(JSON.stringify(empacotar(m)));
  try {
    return 'v1.' + paraB64(await ler(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))));
  } catch {
    return 'v0.' + paraB64(bytes); // navegador sem CompressionStream, ou sem 'deflate-raw' (Chrome < 103)
  }
}

// Lixo, link cortado, versão desconhecida, JSON inválido ou cardápio inválido → null.
export async function decodeMenu(str) {
  if (typeof str !== 'string') return null;
  const m = str.replace(/^#/, '').match(/^v([01])\.([A-Za-z0-9_-]+)$/);
  if (!m || m[2].length > MAX_CODIGO) return null;
  try {
    let bytes = deB64(m[2]);
    if (m[1] === '1') {
      bytes = await ler(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')), MAX_JSON);
      if (!bytes) return null;
    }
    return validateMenu(desempacotar(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))));
  } catch {
    return null;
  }
}

// ---------- QR ----------

// Capacidade em modo byte (ISO/IEC 18004, tabela 7) — o link é ASCII, então 1 caractere = 1 byte:
//   versão 20, nível M:  666 bytes, 97×97 módulos
//   versão 25, nível L: 1273 bytes, 117×117 módulos
//   versão 40, nível L: 2953 bytes, 177×177 módulos (o máximo que existe)
// A plaquinha imprime o QR com uns 7 cm. Até a versão 20 cada módulo fica com ~0,65 mm e
// sobra folga para o nível M (aguenta ~15% do código manchado ou amassado). Passando disso,
// trocar para L mantém o símbolo menor — módulo grande lê melhor que redundância em celular
// barato com pouca luz. Na versão 25 o módulo fica com ~0,55 mm, o limite que uma câmera
// comum resolve a 20–30 cm da mesa; acima disso o QR ainda é gerado, mas avisamos que
// pode falhar. Acima de 2953 bytes não existe QR que caiba.
export const QR_LIMITE_M = 666;
export const QR_LIMITE_IMPRESSAO = 1273;
export const QR_LIMITE_MAX = 2953;

export function qrLevel(url) {
  const n = new TextEncoder().encode(url).length;
  return { level: n <= QR_LIMITE_M ? 'M' : 'L', tooLong: n > QR_LIMITE_IMPRESSAO, fits: n <= QR_LIMITE_MAX };
}

// ---------- links de contato (só com valor já validado) ----------

export function whatsappUrl(digitos, mensagem) {
  if (!/^\d{10,13}$/.test(digitos)) return null;
  const numero = digitos.length <= 11 ? '55' + digitos : digitos; // sem DDI → Brasil
  return 'https://wa.me/' + numero + (mensagem ? '?text=' + encodeURIComponent(mensagem) : '');
}

export function instagramUrl(handle) {
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? `https://www.instagram.com/${handle}/` : null;
}
