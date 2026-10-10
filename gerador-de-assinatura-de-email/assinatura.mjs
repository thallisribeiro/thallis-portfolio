// Lógica do gerador de assinatura de e-mail. Sem DOM: a página importa, o teste também.
//
// E-mail não é navegador. Gmail e Outlook jogam fora <style>, class, SVG, script e fonte da web,
// e o Outlook clássico desenha com o motor do Word. Por isso aqui é só tabela, style inline,
// fonte que já vem no computador e imagem por endereço https público.
//
// Limite: "Sua assinatura pode ter até 10.000 caracteres." e a imagem conta nesse limite.
// Ajuda do Gmail, "Criar uma assinatura do Gmail", https://support.google.com/mail/answer/8395?hl=pt-BR
// (consultado em 10/10/2026). O Gmail regrava o HTML ao colar, então a contagem é aproximada.

import { normalizePhone, formatPhone, buildLink, ERROS } from '../gerador-de-link-whatsapp/whatsapp.mjs';

export const LIMITE_GMAIL = 10000;
export const TEMPLATES = ['simples', 'lateral', 'faixa'];
export const COR_PADRAO = '#0B5394';

export const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const vazio = (raw) => !String(raw ?? '').trim();
const erro = (msg) => ({ erro: msg });

function fone(raw, montaHref) {
  if (vazio(raw)) return null;
  const r = normalizePhone(raw, '55');
  if (!r.ok) return erro(ERROS[r.error]);
  return { href: montaHref(r.digits), texto: formatPhone(r.digits).replace(/^\+55 /, '') };
}
export const telLink = (raw) => fone(raw, (d) => 'tel:+' + d);
export const whatsappLink = (raw) => fone(raw, (d) => buildLink(d));

export function emailLink(raw) {
  if (vazio(raw)) return null;
  const e = String(raw).trim();
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(e)
    ? { href: 'mailto:' + e, texto: e }
    : erro('E-mail incompleto. Exemplo: contato@seunegocio.com.br');
}

// Endereço digitado → URL https, ou null. Sem esquema ganha https://; qualquer outro esquema
// (javascript:, data:, http:, mailto:) é recusado. "loja.com.br:8080" é porta, não esquema.
function https(raw) {
  let s = String(raw).trim();
  if (!/^https:\/\//i.test(s)) {
    if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(s)) return null;
    s = 'https://' + s.replace(/^\/\//, '');
  }
  let u;
  try { u = new URL(s); } catch { return null; }
  if (u.protocol !== 'https:' || u.username || u.password || !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(u.hostname)) return null;
  return u;
}

export function siteLink(raw) {
  if (vazio(raw)) return null;
  if (/^\s*http:/i.test(raw)) return erro('Use o endereço com https://. Se o site ainda não tem https, deixe em branco: link sem cadeado assusta quem clica.');
  const u = https(raw);
  return u
    ? { href: u.href, texto: (u.host + u.pathname + u.search).replace(/\/$/, '') }
    : erro('Endereço do site inválido. Exemplo: www.seunegocio.com.br');
}

export function imageLink(raw) {
  if (vazio(raw)) return null;
  const u = /^\s*https:\/\//i.test(raw) && https(raw); // endereço de imagem é sempre colado inteiro; "logo.png" não é site
  return u ? { href: u.href } : erro('Use o endereço público da imagem, começando com https://. Arquivo do computador não funciona: quem recebe o e-mail não tem acesso a ele.');
}

export function instagramLink(raw) {
  if (vazio(raw)) return null;
  const s = String(raw).trim();
  const m = /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^/?#]+)/i.exec(s);
  const h = (m ? m[1] : s).replace(/^@/, '');
  return /^[A-Za-z0-9._]{1,30}$/.test(h)
    ? { href: `https://www.instagram.com/${h}/`, texto: '@' + h }
    : erro('Digite só o nome do perfil, como @seunegocio.');
}

export function linkedinLink(raw) {
  if (vazio(raw)) return null;
  const s = String(raw).trim();
  const m = /^(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/(in|company)\/([^/?#]+)/i.exec(s) ||
    /^(?:(in|company)\/)?([^/?#:]+)\/?$/i.exec(s);
  return m && /^[A-Za-z0-9_%-]{2,150}$/.test(m[2])
    ? { href: `https://www.linkedin.com/${(m[1] || 'in').toLowerCase()}/${m[2]}/`, texto: 'LinkedIn' }
    : erro('Cole o endereço do perfil, como linkedin.com/in/seu-nome, ou da página da empresa.');
}

export function normalizeColor(raw) {
  const s = String(raw ?? '').trim();
  return /^#[0-9a-f]{6}$/i.test(s) ? s.toUpperCase() : null;
}

export function initials(nome) {
  const p = String(nome ?? '').trim().split(/\s+/).filter(Boolean);
  const f = (w) => [...w][0].toUpperCase();
  return !p.length ? '' : p.length === 1 ? f(p[0]) : f(p[0]) + f(p[p.length - 1]);
}

const LINKS = { telefone: telLink, whatsapp: whatsappLink, email: emailLink, site: siteLink, instagram: instagramLink, linkedin: linkedinLink, imagem: imageLink };

// { dados, erros }: dados só com o que passou na validação; erros só de campo preenchido e inválido.
export function readInput(input = {}) {
  const dados = {}, erros = {};
  for (const k of ['nome', 'cargo', 'empresa', 'endereco']) dados[k] = String(input[k] ?? '').trim().replace(/\s+/g, ' ');
  for (const [k, f] of Object.entries(LINKS)) {
    const r = f(input[k]);
    if (r?.erro) erros[k] = r.erro;
    dados[k] = r && !r.erro ? r : null;
  }
  dados.cor = normalizeColor(input.cor);
  if (!dados.cor) {
    if (!vazio(input.cor)) erros.cor = 'Cor no formato #RRGGBB, como #0B5394.';
    dados.cor = COR_PADRAO;
  }
  return { dados, erros };
}

// Contraste WCAG, para o texto sobre a cor escolhida e para a cor dos links sobre fundo branco.
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const ESCURO = '#1A1A1A';

const FONTE = 'font-family:Arial,Helvetica,sans-serif;';
const TABELA = '<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;';
const CORPO = 'font-size:13px;line-height:20px;color:#333333;';
const td = (estilo, conteudo, attrs = '') => `<td${attrs} style="${FONTE}${estilo}">${conteudo}</td>`;

function contatos(d, cor) {
  const corLink = contraste(cor, '#FFFFFF') >= 4.5 ? cor : ESCURO; // amarelo-claro em link some no fundo branco
  const a = (l) => `<a href="${escapeHtml(l.href)}" style="color:${corLink};text-decoration:${corLink === cor ? 'none' : 'underline'}">${escapeHtml(l.texto)}</a>`;
  // Um item por linha: separador "|" quebra feio no celular, com a barra sobrando no fim da linha.
  return [
    d.telefone && 'Tel.: ' + a(d.telefone), d.whatsapp && 'WhatsApp: ' + a(d.whatsapp),
    d.email && a(d.email), d.site && a(d.site), d.endereco && escapeHtml(d.endereco),
    d.instagram && 'Instagram: ' + a(d.instagram), d.linkedin && a(d.linkedin),
  ].filter(Boolean).join('<br>');
}

function identidade(d, corNome, corSub) {
  const sub = escapeHtml([d.cargo, d.empresa].filter(Boolean).join(' | '));
  return (d.nome ? `<span style="font-size:17px;line-height:24px;font-weight:bold;color:${corNome}">${escapeHtml(d.nome)}</span>` : '') +
    (d.nome && sub ? '<br>' : '') +
    (sub ? `<span style="font-size:13px;line-height:20px;color:${corSub}">${sub}</span>` : '');
}

export function buildSignatureHtml(input, template) {
  const { dados: d } = readInput(input);
  const cor = d.cor, sobreCor = contraste(cor, '#FFFFFF') >= contraste(cor, ESCURO) ? '#FFFFFF' : ESCURO;
  const cont = contatos(d, cor);

  if (template === 'faixa') {
    return `${TABELA}max-width:520px">` +
      `<tr>${td(`padding:12px 16px;background-color:${cor};color:${sobreCor};`, identidade(d, sobreCor, sobreCor), ` bgcolor="${cor}"`)}</tr>` +
      (cont ? `<tr>${td(`padding:10px 16px;${CORPO}border:1px solid #DDDDDD;border-top:0;`, cont)}</tr>` : '') +
      '</table>';
  }

  if (template === 'lateral') {
    const ini = initials(d.nome || d.empresa);
    const lado = d.imagem
      ? `<img src="${escapeHtml(d.imagem.href)}" alt="${escapeHtml(d.nome || d.empresa)}" width="80" style="display:block;width:80px;max-width:80px;height:auto;border:0">`
      : ini
        ? `${TABELA}"><tr><td width="64" height="64" align="center" valign="middle" bgcolor="${cor}" style="${FONTE}width:64px;height:64px;` +
          `background-color:${cor};color:${sobreCor};font-size:24px;font-weight:bold;text-align:center;vertical-align:middle;border-radius:8px">${escapeHtml(ini)}</td></tr></table>`
        : '';
    const borda = `border-left:2px solid ${cor};`;
    return `${TABELA}"><tr>` +
      (lado ? `<td rowspan="2" valign="top" style="padding:0 14px 0 0;vertical-align:top">${lado}</td>` : '') +
      td(`padding:0 0 0 14px;${borda}vertical-align:top;`, identidade(d, ESCURO, '#555555'), ' valign="top"') +
      `</tr><tr>${td(`padding:6px 0 0 14px;${borda}vertical-align:top;${CORPO}`, cont, ' valign="top"')}</tr></table>`;
  }

  return `${TABELA}">` +
    `<tr>${td(`padding:0 0 8px;border-bottom:2px solid ${cor};`, identidade(d, ESCURO, '#555555'))}</tr>` +
    (cont ? `<tr>${td(`padding:8px 0 0;${CORPO}`, cont)}</tr>` : '') +
    '</table>';
}

export function plainTextSignature(input) {
  const { dados: d } = readInput(input);
  return [
    d.nome, [d.cargo, d.empresa].filter(Boolean).join(' | '),
    d.telefone && 'Tel.: ' + d.telefone.texto, d.whatsapp && 'WhatsApp: ' + d.whatsapp.texto,
    d.email?.texto, d.site?.texto, d.endereco,
    d.instagram && 'Instagram: ' + d.instagram.texto, d.linkedin && 'LinkedIn: ' + d.linkedin.href,
  ].filter(Boolean).join('\n');
}

export const charCount = (html) => [...String(html ?? '')].length;
