// node --test test/ferramentas-assinatura.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeHtml, telLink, whatsappLink, emailLink, siteLink, instagramLink, linkedinLink, imageLink,
  normalizeColor, initials, readInput, buildSignatureHtml, plainTextSignature, charCount, LIMITE_GMAIL, TEMPLATES,
} from '../gerador-de-assinatura-de-email/assinatura.mjs';

const COMPLETO = {
  nome: 'Ana Souza', cargo: 'Proprietária', empresa: 'Pousada Mar & Sol',
  telefone: '(73) 3281-1234', whatsapp: '(73) 98889-9345', email: 'ana@pousadamaresol.com.br',
  site: 'pousadamaresol.com.br', endereco: 'Rua da Praia, 10 - Porto Seguro/BA',
  instagram: '@pousadamaresol', linkedin: 'linkedin.com/in/ana-souza', cor: '#0B5394',
  imagem: 'https://pousadamaresol.com.br/logo.png',
};

test('escapeHtml troca os cinco caracteres perigosos', () => {
  assert.equal(escapeHtml(`<script>"a" & 'b'</script>`), '&lt;script&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/script&gt;');
  assert.equal(escapeHtml(null), '');
});

for (const t of TEMPLATES) {
  test(`${t}: nada do que a pessoa digita vira tag ou atributo`, () => {
    const html = buildSignatureHtml({
      ...COMPLETO,
      nome: `<script>alert(1)</script> D'Ávila "Zé"`,
      cargo: '<img src=x onerror=alert(1)>',
      empresa: 'A&B <b>',
      endereco: '"><svg onload=alert(1)>',
    }, t);
    assert.ok(!/<script/i.test(html));
    assert.ok(!/<svg/i.test(html));
    assert.ok(!/<img src=x/i.test(html));
    assert.ok(!/<b>/.test(html));
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt; D&#39;Ávila &quot;Zé&quot;'));
    assert.ok(html.includes('A&amp;B &lt;b&gt;'));
  });

  test(`${t}: só tabela e estilo inline (sem class, style, script, svg, fonte web)`, () => {
    const html = buildSignatureHtml(COMPLETO, t);
    assert.match(html, /^<table/);
    assert.ok(!/\sclass=/i.test(html));
    assert.ok(!/<style|<script|<svg|<link|@import|url\(/i.test(html));
    assert.ok(!/<div/i.test(html), 'div some ou vira bloco no Outlook; tudo em td');
    for (const m of html.matchAll(/(?:href|src)="([^"]*)"/g)) assert.match(m[1], /^(https:\/\/|tel:\+|mailto:)/, m[1]);
    assert.ok(html.includes('font-family:Arial,Helvetica,sans-serif'));
  });

  test(`${t}: assinatura completa cabe com folga no limite do Gmail`, () => {
    assert.ok(charCount(buildSignatureHtml(COMPLETO, t)) < LIMITE_GMAIL / 2);
  });

  test(`${t}: campo inválido fica de fora em vez de virar link`, () => {
    const html = buildSignatureHtml({
      nome: 'Ana', site: 'javascript:alert(1)', imagem: 'http://x.com/a.png', instagram: 'javascript:alert(1)',
      linkedin: 'javascript:alert(1)', email: 'javascript:alert(1)//@x.com', telefone: 'abc', cor: 'red;background:url(x)',
    }, t);
    assert.ok(!/javascript/i.test(html));
    assert.ok(!html.includes('http://'));
    assert.ok(!html.includes('red;'));
    assert.ok(!html.includes('url('));
  });
}

test('telLink: telefone vira tel: em formato internacional', () => {
  assert.deepEqual(telLink('(73) 3281-1234'), { href: 'tel:+557332811234', texto: '(73) 3281-1234' });
  assert.deepEqual(telLink('+55 73 98889-9345'), { href: 'tel:+5573988899345', texto: '(73) 98889-9345' });
  assert.equal(telLink(''), null);
  assert.ok(telLink('123').erro);
  assert.ok(telLink('javascript:alert(1)').erro);
});

test('whatsappLink: https://wa.me/ com só dígitos', () => {
  assert.deepEqual(whatsappLink('(73) 98889-9345'), { href: 'https://wa.me/5573988899345', texto: '(73) 98889-9345' });
  assert.ok(whatsappLink('(20) 98889-9345').erro);
  assert.equal(whatsappLink('  '), null);
});

test('emailLink: mailto: só com e-mail plausível', () => {
  assert.deepEqual(emailLink(' Ana@Loja.com.br '), { href: 'mailto:Ana@Loja.com.br', texto: 'Ana@Loja.com.br' });
  for (const ruim of ['ana', 'ana@loja', 'a b@loja.com', 'javascript:alert(1)//@x.com', 'a"@x.com', 'a@x.com?bcc=b@y.com']) {
    assert.ok(emailLink(ruim).erro, ruim);
  }
});

test('siteLink: aceita sem https:// e devolve https', () => {
  assert.deepEqual(siteLink('loja.com.br'), { href: 'https://loja.com.br/', texto: 'loja.com.br' });
  assert.deepEqual(siteLink('www.loja.com.br/'), { href: 'https://www.loja.com.br/', texto: 'www.loja.com.br' });
  assert.deepEqual(siteLink('HTTPS://Loja.com.br/cardapio'), { href: 'https://loja.com.br/cardapio', texto: 'loja.com.br/cardapio' });
});

test('siteLink: recusa javascript:, data:, http:// e lixo', () => {
  for (const ruim of [
    'javascript:alert(1)', 'JaVaScRiPt:alert(1)', ' javascript:alert(1)', 'data:text/html,<script>', 'vbscript:x',
    'http://loja.com.br', 'ftp://loja.com.br', 'loja', 'https://', 'https://user:senha@loja.com.br', 'loja .com.br', 'mailto:a@b.com',
  ]) {
    assert.ok(siteLink(ruim).erro, ruim);
  }
  assert.equal(siteLink(''), null);
});

test('instagramLink: @perfil, perfil ou URL viram https://www.instagram.com/perfil/', () => {
  for (const ok of ['@pousada.mar_sol', 'pousada.mar_sol', 'instagram.com/pousada.mar_sol', 'https://www.instagram.com/pousada.mar_sol/?hl=pt']) {
    assert.deepEqual(instagramLink(ok), { href: 'https://www.instagram.com/pousada.mar_sol/', texto: '@pousada.mar_sol' }, ok);
  }
  for (const ruim of ['javascript:alert(1)', 'a b', '@' + 'a'.repeat(31), 'https://evil.com/pousada', '<script>']) {
    assert.ok(instagramLink(ruim).erro, ruim);
  }
});

test('linkedinLink: perfil pessoal ou página de empresa', () => {
  const ana = { href: 'https://www.linkedin.com/in/ana-souza/', texto: 'LinkedIn' };
  assert.deepEqual(linkedinLink('ana-souza'), ana);
  assert.deepEqual(linkedinLink('https://br.linkedin.com/in/ana-souza'), ana);
  assert.deepEqual(linkedinLink('linkedin.com/in/ana-souza/'), ana);
  assert.deepEqual(linkedinLink('https://www.linkedin.com/company/pousada-mar-sol/about/'),
    { href: 'https://www.linkedin.com/company/pousada-mar-sol/', texto: 'LinkedIn' });
  for (const ruim of ['javascript:alert(1)', 'https://evil.com/in/ana', 'ana souza', 'in/"x"']) assert.ok(linkedinLink(ruim).erro, ruim);
});

test('imageLink: só endereço https público, sem data: nem http', () => {
  assert.deepEqual(imageLink('https://loja.com.br/logo.png'), { href: 'https://loja.com.br/logo.png' });
  for (const ruim of ['http://loja.com.br/logo.png', 'data:image/png;base64,AAAA', 'javascript:alert(1)', 'C:\\fotos\\logo.png', 'logo.png']) {
    assert.ok(imageLink(ruim).erro, ruim);
  }
});

test('normalizeColor: só #RRGGBB', () => {
  assert.equal(normalizeColor('#0b5394'), '#0B5394');
  assert.equal(normalizeColor(' #A1B2C3 '), '#A1B2C3');
  for (const ruim of ['red', '#fff', '#12345', '#1234567', '0B5394', 'rgb(1,2,3)', '#0B5394;background:url(x)', 'expression(alert(1))', null]) {
    assert.equal(normalizeColor(ruim), null, String(ruim));
  }
});

test('initials: primeira e última palavra, com acento', () => {
  assert.equal(initials('ana maria da souza'), 'AS');
  assert.equal(initials('  Ângela '), 'Â');
  assert.equal(initials(''), '');
});

test('readInput separa o que entrou do que tem erro', () => {
  const { dados, erros } = readInput({ nome: ' Ana ', site: 'http://x.com', whatsapp: '(73) 98889-9345', cor: 'azul' });
  assert.equal(dados.nome, 'Ana');
  assert.equal(dados.site, null);
  assert.equal(dados.whatsapp.href, 'https://wa.me/5573988899345');
  assert.equal(dados.cor, '#0B5394'); // cor inválida volta para a padrão
  assert.deepEqual(Object.keys(erros).sort(), ['cor', 'site']);
});

test('modelo lateral: sem imagem, quadrado com as iniciais numa célula de tabela', () => {
  const html = buildSignatureHtml({ ...COMPLETO, imagem: '' }, 'lateral');
  assert.ok(!html.includes('<img'));
  assert.match(html, /<td[^>]*bgcolor="#0B5394"[^>]*>AS<\/td>/);
  const comFoto = buildSignatureHtml(COMPLETO, 'lateral');
  assert.match(comFoto, /<img src="https:\/\/pousadamaresol\.com\.br\/logo\.png" alt="Ana Souza" width="80"/);
});

test('texto sobre a cor escolhida fica legível (branco no escuro, escuro no claro)', () => {
  assert.match(buildSignatureHtml({ nome: 'Ana', cor: '#0B5394' }, 'faixa'), /background-color:#0B5394;color:#FFFFFF/);
  assert.match(buildSignatureHtml({ nome: 'Ana', cor: '#FFE066' }, 'faixa'), /background-color:#FFE066;color:#1A1A1A/);
});

test('modelo desconhecido cai no simples', () => {
  assert.equal(buildSignatureHtml(COMPLETO, 'xyz'), buildSignatureHtml(COMPLETO, 'simples'));
});

test('plainTextSignature: uma informação por linha, sem HTML e sem campo inválido', () => {
  assert.equal(plainTextSignature({ ...COMPLETO, site: 'javascript:alert(1)', cargo: '<b>Dona</b>' }), [
    'Ana Souza',
    '<b>Dona</b> | Pousada Mar & Sol',
    'Tel.: (73) 3281-1234',
    'WhatsApp: (73) 98889-9345',
    'ana@pousadamaresol.com.br',
    'Rua da Praia, 10 - Porto Seguro/BA',
    'Instagram: @pousadamaresol',
    'LinkedIn: https://www.linkedin.com/in/ana-souza/',
  ].join('\n'));
  assert.equal(plainTextSignature({}), '');
});

test('charCount conta caracteres, não bytes nem metades de emoji', () => {
  assert.equal(charCount('abc'), 3);
  assert.equal(charCount('ção'), 3);
  assert.equal(charCount('😀'), 1);
  assert.equal(LIMITE_GMAIL, 10000);
});

test('pior caso: todos os campos no tamanho máximo do formulário ainda cabem no limite', () => {
  const max = {
    nome: '&'.repeat(80), cargo: '"'.repeat(80), empresa: '<'.repeat(80), endereco: "'".repeat(160),
    telefone: '(73) 3281-1234', whatsapp: '(73) 98889-9345', email: 'a'.repeat(64) + '@' + 'b'.repeat(60) + '.com',
    site: 'https://' + 'c'.repeat(60) + '.com.br/' + 'd'.repeat(200), instagram: 'e'.repeat(30),
    linkedin: 'in/' + 'f'.repeat(100), imagem: 'https://' + 'g'.repeat(60) + '.com/' + 'h'.repeat(220), cor: '#123456',
  };
  for (const t of TEMPLATES) assert.ok(charCount(buildSignatureHtml(max, t)) < LIMITE_GMAIL, t);
});
