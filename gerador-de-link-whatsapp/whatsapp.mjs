// Lógica do gerador de link do WhatsApp. Sem DOM: a página importa, o teste também.
//
// Formato do link: https://wa.me/<número em formato internacional, só dígitos>?text=<mensagem codificada>
// Fonte: Central de Ajuda do WhatsApp, "Como usar o recurso clique para conversa"
// https://faq.whatsapp.com/5913398998672934 (consultado em 10/10/2026).
//
// DDDs: os 67 Códigos Nacionais (CN) vigentes do Plano Geral de Códigos Nacionais (PGCN) da
// Anatel, conferidos no arquivo Codigos_Nacionais.csv dos dados abertos do painel
// https://informacoes.anatel.gov.br/paineis/areas-tarifarias/codigos-nacionais
// (arquivo de 05/10/2026, consultado em 10/10/2026).

export const DDDS = new Set(
  ('11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 ' +
   '51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 ' +
   '91 92 93 94 95 96 97 98 99').split(' ')
);

// ?ddd=73 (vindo das páginas /ddd/<nn>/): devolve o DDD só se for um dos 67; qualquer outra coisa vira ''.
export function dddDaUrl(search) {
  const d = new URLSearchParams(search ?? '').get('ddd') ?? '';
  return DDDS.has(d) ? d : '';
}

export const ERROS = {
  vazio: 'Digite o número do WhatsApp.',
  sem_ddd: 'Coloque o DDD antes do número. Exemplo: (73) 98889-9345.',
  ddd: 'Esse DDD não existe. Confira os dois números entre parênteses.',
  celular: 'Celular tem 9 dígitos começando com 9. Exemplo: (73) 98889-9345.',
  tamanho: 'Número brasileiro tem DDD + 8 ou 9 dígitos. Exemplo: (73) 98889-9345.',
  internacional: 'Número de outro país tem de 8 a 15 dígitos, contando o código do país.',
};

const falha = (error) => ({ ok: false, error });

// Devolve { ok: true, digits: '5573988899345', tipo: 'celular' | 'fixo' | 'internacional' }
// ou { ok: false, error: <chave de ERROS> }.
export function normalizePhone(raw, defaultCountry = '55') {
  const s = String(raw ?? '').trim();
  let d = s.replace(/\D/g, '');
  if (!d) return falha('vazio');

  let intl = s.startsWith('+') || d.startsWith('00');
  if (d.startsWith('00')) d = d.slice(2);
  else if (!intl && d.startsWith('0')) {
    // 0 de tronco ("0xx73...") e, no Brasil, o código de operadora que vem junto ("0 15 73 ...")
    d = d.replace(/^0+/, '');
    if (defaultCountry === '55' && (d.length === 12 || d.length === 13)) d = d.slice(2);
  }

  if (intl && d.startsWith('55')) { d = d.slice(2); intl = false; defaultCountry = '55'; }
  if (intl || defaultCountry !== '55') {
    const full = intl ? d : defaultCountry + d;
    return /^[1-9]\d{7,14}$/.test(full) ? { ok: true, digits: full, tipo: 'internacional' } : falha('internacional');
  }

  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
  if (d.length === 8 || d.length === 9) return falha('sem_ddd');
  if (d.length !== 10 && d.length !== 11) return falha('tamanho');
  const ddd = d.slice(0, 2), num = d.slice(2);
  if (!DDDS.has(ddd)) return falha('ddd');
  if (num.length === 9 && num[0] !== '9') return falha('celular');
  return { ok: true, digits: '55' + d, tipo: num.length === 9 ? 'celular' : 'fixo' };
}

export function formatPhone(digits) {
  const m = /^55(\d\d)(\d{4,5})(\d{4})$/.exec(digits);
  return m ? `+55 (${m[1]}) ${m[2]}-${m[3]}` : '+' + digits;
}

export function buildLink(phone, message = '') {
  if (!/^[1-9]\d{7,14}$/.test(phone)) throw new TypeError('telefone precisa ser só dígitos, com código do país');
  let msg = String(message ?? '').replace(/\r\n?/g, '\n').trim();
  msg = msg.toWellFormed?.() ?? msg; // surrogate solto (colagem quebrada) faria o encodeURIComponent lançar
  return `https://wa.me/${phone}` + (msg ? `?text=${encodeURIComponent(msg)}` : '');
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Ícone de balão de conversa desenhado aqui (não é o logo oficial, que tem regras de uso).
const icone = (px) =>
  `<svg width="${px}" height="${px}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="flex:none">` +
  '<path fill="currentColor" d="M12 2.5C6.75 2.5 2.5 6.36 2.5 11.1c0 2.5 1.19 4.76 3.1 6.33L4.6 21.5l4.6-2.3c.9.23 1.84.35 2.8.35 5.25 0 9.5-3.86 9.5-8.6S17.25 2.5 12 2.5Zm-3.4 6.2c.2-.02.42.06.53.3l.78 1.75c.1.22.05.47-.12.64l-.55.55c.65 1.3 1.68 2.32 2.98 2.98l.55-.55c.17-.17.42-.22.64-.12l1.75.78c.24.11.32.33.3.53-.12 1.3-1.2 2.12-2.46 1.86-3.06-.62-5.48-3.04-6.1-6.1-.26-1.26.56-2.34 1.7-2.62Z"/></svg>';

const VERDE = 'background:#25D366;color:#0B1F14'; // texto escuro: branco sobre esse verde dá 2:1, reprova no WCAG

export function buttonSnippet(link, label, style = 'inline') {
  if (!/^https:\/\/wa\.me\/[1-9]\d{7,14}(\?text=[A-Za-z0-9\-_.!~*'()%]*)?$/.test(link)) {
    throw new TypeError('link precisa ser um https://wa.me/ gerado por buildLink');
  }
  const href = esc(link);
  const texto = esc(String(label ?? '').trim() || 'Fale no WhatsApp');
  if (style === 'flutuante') {
    return `<a href="${href}" target="_blank" rel="noopener" aria-label="${texto}" title="${texto}" ` +
      `style="position:fixed;right:16px;bottom:16px;z-index:9999;display:flex;align-items:center;justify-content:center;` +
      `width:60px;height:60px;border-radius:50%;${VERDE};box-shadow:0 4px 14px rgba(0,0,0,.3);text-decoration:none">` +
      `${icone(30)}</a>`;
  }
  return `<a href="${href}" target="_blank" rel="noopener" ` +
    `style="display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:12px 22px;border-radius:999px;${VERDE};` +
    `font:600 16px/1.2 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;text-decoration:none">` +
    `${icone(22)}${texto}</a>`;
}
