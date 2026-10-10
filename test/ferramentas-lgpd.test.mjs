import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  OPCOES, buildPolicy, toPlainText, toHtml, validarCPF, validarCNPJ, validarDocumento,
  formatarData, validar,
} from '../gerador-de-politica-de-privacidade/politica.mjs';

const base = {
  nome: 'Pousada Mar Azul', documento: '11.222.333/0001-81', email: 'contato@marazul.com.br',
  site: 'https://marazul.com.br', cidade: 'Porto Seguro', uf: 'BA', data: '2026-10-10',
};
const comOpcoes = (lista, extra = {}) =>
  ({ ...base, ...extra, opcoes: Object.fromEntries(lista.map((k) => [k, true])) });
const headings = (p) => p.sections.map((s) => s.heading);
const secao = (p, h) => p.sections.find((s) => s.heading === h);

// Seção própria de cada escolha: aparece se e só se `quando` for verdadeiro.
const SECOES = [
  ['Formulário de contato', (o) => o.contato],
  ['Atendimento pelo WhatsApp', (o) => o.whatsapp],
  ['Agendamento online', (o) => o.agendamento],
  ['Newsletter e e-mails de novidades', (o) => o.newsletter],
  ['Compras e pagamentos', (o) => o.loja],
  ['Cadastro e área do cliente', (o) => o.login],
  ['Registros de acesso', (o) => o.login || o.loja],
  ['Dados de saúde (dados sensíveis)', (o) => o.saude],
  ['Crianças e adolescentes', (o) => o.criancas],
  ['Transferência internacional de dados', (o) => o.exterior || o.analytics || o.meta],
];

// Palavras que só podem aparecer quando o dono marcou a opção correspondente.
const MARCAS = [
  [/formulário de contato/i, (o) => o.contato],
  [/WhatsApp/, (o) => o.whatsapp],
  [/newsletter/i, (o) => o.newsletter],
  [/agend/i, (o) => o.agendamento],
  [/pagamento|compra|PagBank Teste/i, (o) => o.loja],
  [/área do cliente/i, (o) => o.login],
  [/Marco Civil/, (o) => o.login || o.loja],
  [/cookies necessários/i, (o) => o.cookies],
  [/Google/, (o) => o.analytics],
  [/Meta Pixel|anúncio/i, (o) => o.meta],
  [/\bMeta\b/, (o) => o.meta || o.whatsapp],
  [/saúde|sensíve/i, (o) => o.saude],
  [/criança|adolescente/i, (o) => o.criancas],
  [/servidores fora do Brasil/, (o) => o.exterior],
];

test('OPCOES lista as 12 escolhas do formulário', () => {
  assert.deepEqual(OPCOES, ['contato', 'whatsapp', 'newsletter', 'agendamento', 'loja', 'cookies',
    'analytics', 'meta', 'login', 'saude', 'criancas', 'exterior']);
});

test('todas as 4096 combinações: cada seção aparece só quando a escolha pede', () => {
  for (let mask = 0; mask < 1 << OPCOES.length; mask++) {
    const o = Object.fromEntries(OPCOES.map((k, i) => [k, Boolean(mask & (1 << i))]));
    const p = buildPolicy({ ...base, processador: 'PagBank Teste', opcoes: o });
    const hs = headings(p);
    for (const [h, quando] of SECOES) {
      assert.equal(hs.includes(h), Boolean(quando(o)), `${h} com ${JSON.stringify(o)}`);
    }
    const texto = toPlainText(p);
    for (const [re, quando] of MARCAS) {
      assert.equal(re.test(texto), Boolean(quando(o)), `${re} com ${JSON.stringify(o)}`);
    }
    // Sempre presentes, qualquer que seja a escolha.
    for (const h of ['Quem somos', 'Quando você só visita o site', 'Cookies', 'Com quem compartilhamos',
      'Por quanto tempo guardamos', 'Segurança', 'Seus direitos', 'Como pedir seus direitos',
      'Mudanças nesta política']) {
      assert.ok(hs.includes(h), `${h} sempre presente`);
    }
    assert.equal(new Set(hs).size, hs.length, 'sem seção repetida');
    for (const s of p.sections) if (s.list) assert.match(s.list.at(-1), /\.$/, `lista de ${s.heading} fecha com ponto`);
  }
});

test('base legal certa por finalidade', () => {
  const p = buildPolicy(comOpcoes(OPCOES));
  const txt = (h) => toPlainText({ title: '', sections: [secao(p, h)] });
  assert.match(txt('Newsletter e e-mails de novidades'), /consentimento \(art\. 7º, I/);
  assert.match(txt('Formulário de contato'), /art\. 7º, V/);
  assert.match(txt('Compras e pagamentos'), /art\. 7º, V.*art\. 7º, II/s);
  assert.match(txt('Dados de saúde (dados sensíveis)'), /art\. 11/);
  assert.match(txt('Crianças e adolescentes'), /art\. 14/);
  assert.match(txt('Transferência internacional de dados'), /art\. 33/);
  const cookies = txt('Cookies');
  assert.match(cookies, /cookies necessários.*legítimo interesse/is);
  assert.match(cookies, /Google Analytics.*consentimento/is);
  assert.match(cookies, /Meta Pixel.*consentimento/is);
});

test('registros de acesso: obrigação legal só para CNPJ (Marco Civil, art. 15)', () => {
  const pj = toPlainText(buildPolicy(comOpcoes(['login'])));
  assert.match(pj, /6 \(seis\) meses/);
  assert.match(pj, /obrigação legal \(art\. 7º, II\) prevista no art\. 15/);
  const pf = toPlainText(buildPolicy(comOpcoes(['login'], { documento: '529.982.247-25' })));
  assert.match(pf, /6 \(seis\) meses/);
  assert.doesNotMatch(pf, /obrigação legal \(art\. 7º, II\) prevista no art\. 15/);
  assert.match(pf, /legítimo interesse/);
});

test('sem cookie marcado, diz que não usa estatística nem publicidade', () => {
  const t = toPlainText(buildPolicy(comOpcoes([])));
  assert.match(t, /não usa cookies de estatística nem de publicidade/);
});

test('encarregado indicado aparece com nome e e-mail; omitido cita a Resolução nº 2/2022', () => {
  const com = toPlainText(buildPolicy(comOpcoes([], { encarregadoNome: 'Ana Souza', encarregadoEmail: 'dpo@marazul.com.br' })));
  assert.match(com, /Ana Souza/);
  assert.match(com, /dpo@marazul\.com\.br/);
  assert.match(com, /art\. 41/);
  const sem = toPlainText(buildPolicy(comOpcoes([])));
  assert.match(sem, /Resolução CD\/ANPD nº 2\/2022/);
  assert.match(sem, /contato@marazul\.com\.br/);
});

test('direitos do titular do art. 18 e o caminho para pedir', () => {
  const p = buildPolicy(comOpcoes([]));
  assert.equal(secao(p, 'Seus direitos').list.length, 9);
  const t = toPlainText(p);
  assert.match(t, /portabilidade/);
  assert.match(t, /revogar o consentimento/);
  assert.match(t, /ANPD/);
  assert.match(t, /15 dias/);
});

test('documento: CNPJ/CPF válido entra formatado; inválido fica de fora', () => {
  assert.match(toPlainText(buildPolicy(base)), /como Pousada Mar Azul, CNPJ 11\.222\.333\/0001-81, de Porto Seguro\/BA, trata/);
  assert.match(toPlainText(buildPolicy({ ...base, cidade: '', uf: '' })), /como Pousada Mar Azul, CNPJ 11\.222\.333\/0001-81, trata/);
  assert.match(toPlainText(buildPolicy({ ...base, documento: '' })), /como Pousada Mar Azul, de Porto Seguro\/BA, trata/);
  assert.match(toPlainText(buildPolicy({ ...base, documento: '11222333000181' })), /CNPJ 11\.222\.333\/0001-81/);
  assert.match(toPlainText(buildPolicy({ ...base, documento: '52998224725' })), /CPF 529\.982\.247-25/);
  assert.match(toPlainText(buildPolicy({ ...base, documento: '12abc34501de35' })), /CNPJ 12\.ABC\.345\/01DE-35/);
  assert.doesNotMatch(toPlainText(buildPolicy({ ...base, documento: '11222333000182' })), /CNPJ|CPF/);
});

test('validação de CPF', () => {
  for (const ok of ['529.982.247-25', '111.444.777-35', '52998224725']) assert.equal(validarCPF(ok), true, ok);
  for (const ruim of ['529.982.247-24', '111.111.111-11', '123', '', '5299822472a']) assert.equal(validarCPF(ruim), false, ruim);
});

test('validação de CNPJ numérico e alfanumérico (exemplo oficial da Receita: 12.ABC.345/01DE-35)', () => {
  for (const ok of ['11.222.333/0001-81', '11.444.777/0001-61', '12.ABC.345/01DE-35', '12abc34501de35']) {
    assert.equal(validarCNPJ(ok), true, ok);
  }
  for (const ruim of ['11.222.333/0001-82', '12.ABC.345/01DE-36', '11.111.111/1111-11', '00000000000000',
    '12ABC34501DEAB', '1122233300018', '']) {
    assert.equal(validarCNPJ(ruim), false, ruim);
  }
});

test('validarDocumento diz o tipo e aceita vazio', () => {
  assert.deepEqual(validarDocumento(''), { tipo: null, valido: true });
  assert.deepEqual(validarDocumento('529.982.247-25'), { tipo: 'cpf', valido: true });
  assert.deepEqual(validarDocumento('11.222.333/0001-81'), { tipo: 'cnpj', valido: true });
  assert.deepEqual(validarDocumento('529.982.247-24'), { tipo: 'cpf', valido: false });
  assert.equal(validarDocumento('abc').valido, false);
});

test('formatação de data em português', () => {
  assert.equal(formatarData('2026-10-10'), '10 de outubro de 2026');
  assert.equal(formatarData('2026-01-01'), '1º de janeiro de 2026');
  assert.equal(formatarData('2024-02-29'), '29 de fevereiro de 2024');
  assert.equal(formatarData('2026-02-30'), '');
  assert.equal(formatarData('10/10/2026'), '');
  assert.equal(formatarData(''), '');
});

test('data escolhida aparece como "Última atualização"', () => {
  const t = toPlainText(buildPolicy({ ...base, data: '2027-03-05' }));
  assert.match(t, /Última atualização: 5 de março de 2027/);
});

test('campos vazios viram marcadores, sem quebrar a prévia', () => {
  const t = toPlainText(buildPolicy({}));
  assert.match(t, /\[nome do negócio\]/);
  assert.match(t, /\[e-mail de contato\]/);
  assert.match(t, /Última atualização: \[data\]/);
});

test('toHtml escapa tudo o que veio do usuário', () => {
  const p = buildPolicy(comOpcoes(['loja'], {
    nome: '<script>alert(1)</script> & "Cia" \'x\'', processador: '<img src=x onerror=alert(2)>',
    cidade: '<b>Porto</b>',
  }));
  const html = toHtml(p);
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="pt-BR">/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /<b>Porto/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; &quot;Cia&quot; &#39;x&#39;/);
  assert.match(html, /<title>Política de Privacidade — &lt;script&gt;/);
});

test('toPlainText: título, seções e itens com hífen', () => {
  const t = toPlainText(buildPolicy(comOpcoes([])));
  assert.match(t, /^Política de Privacidade — Pousada Mar Azul\n/);
  assert.match(t, /\nSeus direitos\n/);
  assert.match(t, /\n- confirmar se tratamos/);
});

test('validar aponta campos obrigatórios e formatos', () => {
  assert.deepEqual(validar(base), {});
  const e = validar({ nome: ' ', email: 'x@', documento: '123', encarregadoEmail: 'nao', data: '2026-02-30', site: 'ftp://x' });
  assert.deepEqual(Object.keys(e).sort(), ['data', 'documento', 'email', 'encarregadoEmail', 'nome', 'site']);
  assert.deepEqual(validar({ ...base, site: 'marazul.com.br' }), {});
});

test('avisos para o dono: saúde, crianças e cookies de terceiros', () => {
  assert.deepEqual(buildPolicy(comOpcoes([])).avisos, []);
  assert.match(buildPolicy(comOpcoes(['saude'])).avisos.join(' '), /advogad/);
  assert.match(buildPolicy(comOpcoes(['criancas'])).avisos.join(' '), /advogad/);
  assert.match(buildPolicy(comOpcoes(['analytics'])).avisos.join(' '), /Rejeitar/);
  assert.match(buildPolicy(comOpcoes(['meta'])).avisos.join(' '), /Rejeitar/);
});

test('página: FAQ do HTML e do JSON-LD batem, CTA com a tag [lgpd]', () => {
  const html = readFileSync(new URL('../gerador-de-politica-de-privacidade/index.html', import.meta.url), 'utf8');
  const blocos = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const faq = blocos.find((b) => b['@type'] === 'FAQPage');
  const app = blocos.find((b) => b['@type'] === 'WebApplication');
  assert.equal(app.offers.price, '0');
  assert.equal(app.offers.priceCurrency, 'BRL');
  const resumos = [...html.matchAll(/<summary>([\s\S]*?)<\/summary>/g)].map((m) => m[1].trim());
  assert.deepEqual(faq.mainEntity.map((q) => q.name), resumos);
  const respostas = [...html.matchAll(/<\/summary>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => m[1].trim());
  assert.deepEqual(faq.mainEntity.map((q) => q.acceptedAnswer.text), respostas);
  assert.ok(resumos.length >= 5 && resumos.length <= 7);
  assert.match(html, /https:\/\/wa\.me\/5573988899345\?text=[^"]+%20%5Blgpd%5D"/);
  assert.match(html, /<h1[^>]*>Gerador de política de privacidade grátis \(LGPD\)<\/h1>/);
  assert.match(html, /G-247F9N1WQE/);
  assert.match(html, /data-page-ev="tool_lgpd_viewed"/);
  assert.doesNotMatch(html, /innerHTML/);
});
