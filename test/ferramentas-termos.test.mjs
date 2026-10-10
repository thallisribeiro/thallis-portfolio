import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TIPOS, OPCOES, buildTermos, toPlainText, toHtml, validar } from '../gerador-de-termos-de-uso/termos.mjs';

const base = {
  nome: 'Ateliê Flor de Sal', documento: '11.222.333/0001-81',
  endereco: 'Rua das Flores, 100, Centro, Porto Seguro/BA, CEP 45810-000',
  email: 'contato@flordesal.com.br', whatsapp: '(73) 98889-9345', site: 'flordesal.com.br',
  tipo: 'institucional', data: '2026-10-10',
};
const com = (tipo, lista = [], extra = {}) =>
  ({ ...base, tipo, ...extra, opcoes: Object.fromEntries(lista.map((k) => [k, true])) });
const headings = (p) => p.sections.map((s) => s.heading);
const secao = (p, h) => p.sections.find((s) => s.heading === h);
const txt = (s) => toPlainText({ title: '', sections: [s] });
const vende = (t, o) => t === 'loja' || o.pagamentos;
const sempre = () => true;

// Seção aparece se e só se `quando(tipo, opções)` for verdadeiro.
const SECOES = [
  ['Quem somos', sempre],
  ['Aceitação destes termos', sempre],
  ['Sobre o site', (t) => t === 'institucional'],
  ['Compras na loja virtual', (t) => t === 'loja'],
  ['Agendamentos e serviços', (t) => t === 'servicos'],
  ['Área de membros e assinatura', (t) => t === 'membros'],
  ['Contas de usuário', (t, o) => o.contas],
  ['Pagamentos', (t, o) => o.pagamentos],
  ['Entregas', (t, o) => o.entregas],
  ['Direito de arrependimento', vende],
  ['Trocas, defeitos e garantia', (t) => t === 'loja'],
  ['Garantia dos serviços', (t) => t === 'servicos' || t === 'membros'],
  ['Cancelamento e reembolso', (t, o) => o.cancelamento],
  ['Regras de uso do site', sempre],
  ['Conteúdo enviado por você', (t, o) => o.conteudo],
  ['Propriedade intelectual', (t, o) => o.propriedade],
  ['Menores de idade', (t, o) => o.menores],
  ['Privacidade e dados pessoais', sempre],
  ['Responsabilidades', sempre],
  ['Atendimento', sempre],
  ['Lei aplicável e foro', sempre],
  ['Mudanças nestes termos', sempre],
];

// Seções que limitam direitos: o CDC (art. 54, § 4º) manda destacar.
const DESTAQUE = new Set(['Área de membros e assinatura', 'Contas de usuário', 'Cancelamento e reembolso',
  'Regras de uso do site', 'Conteúdo enviado por você']);

// Trechos que só podem aparecer quando o tipo ou a opção pede.
const MARCAS = [
  [/Decreto nº 7\.962\/2013/, vende],
  [/frete/, vende],
  [/art\. 49/, (t, o) => vende(t, o) || o.cancelamento],
  [/senha/i, (t, o) => o.contas],
  [/Marco Civil/, (t, o) => o.contas],
  [/em dobro/, (t, o) => o.pagamentos],
  [/avaliaç/i, (t, o) => o.conteudo],
  [/Lei nº 9\.610\/1998/, (t, o) => o.propriedade],
  [/Código Civil/, (t, o) => o.menores],
  [/assinatura/i, (t) => t === 'membros'],
  [/orçamento/i, (t) => t === 'servicos'],
  [/art\. 18/, (t) => t === 'loja'],
  [/art\. 20/, (t) => t === 'servicos' || t === 'membros'],
];

// Cláusulas que o CDC anula (arts. 25, 51 e 101) ou que tentam fugir da oferta (art. 30). Nunca podem sair.
const PROIBIDAS = [
  /não nos responsabilizamos/i, /isent[oa]s? de (toda |qualquer )?responsabilidade/i, /arbitragem/i,
  /foro (exclusivo|eleito)|comarca de/i, /sem (direito a )?(reembolso|devolução)/i,
  /não (há|haverá|fazemos) (reembolso|devolução|troca)/i, /renúncia|renuncia/i,
  /(exclusivo|nosso) critério/i, /sem aviso prévio/i, /alterar (os )?preços? a qualquer momento/i,
  /meramente ilustrativ/i,
];

test('TIPOS e OPCOES do formulário', () => {
  assert.deepEqual(TIPOS, ['institucional', 'loja', 'servicos', 'membros']);
  assert.deepEqual(OPCOES, ['contas', 'pagamentos', 'entregas', 'cancelamento', 'conteudo', 'propriedade', 'menores']);
});

test('todas as 512 combinações de tipo e opções: seções e trechos só quando pedidos, nada que a lei anula', () => {
  for (const tipo of TIPOS) {
    for (let mask = 0; mask < 1 << OPCOES.length; mask++) {
      const o = Object.fromEntries(OPCOES.map((k, i) => [k, Boolean(mask & (1 << i))]));
      const p = buildTermos({ ...base, tipo, opcoes: o });
      const caso = `${tipo} ${JSON.stringify(o)}`;
      const hs = headings(p);
      for (const [h, quando] of SECOES) assert.equal(hs.includes(h), Boolean(quando(tipo, o)), `${h} | ${caso}`);
      assert.deepEqual(hs, SECOES.map(([h]) => h).filter((h) => hs.includes(h)), `ordem | ${caso}`);
      const texto = toPlainText(p);
      for (const [re, quando] of MARCAS) assert.equal(re.test(texto), Boolean(quando(tipo, o)), `${re} | ${caso}`);
      for (const re of PROIBIDAS) assert.doesNotMatch(texto, re, caso);
      for (const s of p.sections) {
        assert.equal(Boolean(s.destaque), DESTAQUE.has(s.heading), `destaque ${s.heading}`);
        if (s.list && s.heading !== 'Quem somos') assert.match(s.list.at(-1), /\.$/, `lista de ${s.heading} fecha com ponto`);
      }
      assert.match(texto, /Lei nº 13\.709\/2018/, 'LGPD só por referência à política');
      assert.match(texto, /art\. 47/);
      assert.match(texto, /art\. 101, I/);
    }
  }
});

test('loja virtual sempre traz arrependimento (CDC art. 49) e identificação (Decreto 7.962, art. 2º)', () => {
  for (let mask = 0; mask < 1 << OPCOES.length; mask++) {
    const p = buildTermos(com('loja', OPCOES.filter((_, i) => mask & (1 << i))));
    const quem = txt(secao(p, 'Quem somos'));
    assert.match(quem, /Decreto nº 7\.962\/2013 \(art\. 2º\)/);
    assert.match(quem, /- Nome ou razão social: Ateliê Flor de Sal/);
    assert.match(quem, /- CNPJ: 11\.222\.333\/0001-81/);
    assert.match(quem, /- Endereço: Rua das Flores, 100/);
    assert.match(quem, /- E-mail: contato@flordesal\.com\.br/);
    assert.match(quem, /- WhatsApp: \+55 \(73\) 98889-9345/);
    const arr = txt(secao(p, 'Direito de arrependimento'));
    assert.match(arr, /7 \(sete\) dias/);
    assert.match(arr, /art\. 49 do Código de Defesa do Consumidor/);
    assert.match(arr, /a qualquer título, inclusive o frete/);
    assert.match(arr, /mesma ferramenta/); // Decreto art. 5º, § 1º
    assert.match(arr, /art\. 5º, § 4º/);
    assert.match(arr, /estornad/); // § 3º
    assert.match(arr, /sem custo para você/);
  }
});

test('pagamento online em outro tipo de site também ganha arrependimento e identificação', () => {
  const p = buildTermos(com('membros', ['pagamentos']));
  assert.ok(secao(p, 'Direito de arrependimento'));
  assert.match(txt(secao(p, 'Quem somos')), /Decreto nº 7\.962\/2013/);
  assert.doesNotMatch(txt(secao(p, 'Direito de arrependimento')), /sem custo para você/, 'devolução de produto só na loja');
});

test('sem venda online: identificação sem o decreto e sem campos vazios', () => {
  const p = buildTermos(com('servicos', [], { documento: '', endereco: '', whatsapp: '', site: '' }));
  const quem = secao(p, 'Quem somos');
  assert.deepEqual(quem.list, ['Nome ou razão social: Ateliê Flor de Sal', 'E-mail: contato@flordesal.com.br']);
  assert.doesNotMatch(txt(quem), /Decreto/);
});

test('loja sem documento ou endereço mostra marcador no lugar (e validar barra a exportação)', () => {
  const quem = txt(secao(buildTermos(com('loja', [], { documento: '', endereco: '' })), 'Quem somos'));
  assert.match(quem, /CNPJ ou CPF: \[CNPJ ou CPF\]/);
  assert.match(quem, /Endereço: \[endereço\]/);
});

test('documento: CNPJ numérico, alfanumérico e CPF formatados; dígito errado fica de fora', () => {
  const doc = (d, tipo = 'institucional') => txt(secao(buildTermos(com(tipo, [], { documento: d })), 'Quem somos'));
  assert.match(doc('11222333000181'), /CNPJ: 11\.222\.333\/0001-81/);
  assert.match(doc('12abc34501de35'), /CNPJ: 12\.ABC\.345\/01DE-35/);
  assert.match(doc('52998224725'), /CPF: 529\.982\.247-25/);
  assert.doesNotMatch(doc('11222333000182'), /CNPJ|CPF/);
  assert.match(doc('11222333000182', 'loja'), /CNPJ ou CPF: \[CNPJ ou CPF\]/);
});

test('cancelamento: arrependimento de 7 dias, devolução do não prestado e direito igual ao nosso (art. 51, XI)', () => {
  const s = txt(secao(buildTermos(com('servicos', ['cancelamento'])), 'Cancelamento e reembolso'));
  assert.match(s, /7 \(sete\) dias/);
  assert.match(s, /ainda não foram prestados/);
  assert.match(s, /art\. 51, XI/);
  assert.match(s, /remarcar/);
  const m = txt(secao(buildTermos(com('membros', ['cancelamento', 'pagamentos'])), 'Cancelamento e reembolso'));
  assert.match(m, /explicado acima/);
  assert.match(m, /cancelar a assinatura/);
  assert.match(m, /mesmo meio usado para contratar/);
});

test('responsabilidade e foro seguem o CDC', () => {
  const t = toPlainText(buildTermos(com('loja')));
  assert.match(t, /Nenhuma regra destes termos afasta ou diminui essa responsabilidade \(arts\. 25 e 51, I/);
  assert.match(t, /cidade onde mora \(art\. 101, I/);
  assert.match(t, /não é obrigatório \(art\. 51, XVII/);
  assert.match(t, /responde(mos)? em até 5 \(cinco\) dias/);
});

test('menores de idade citam o Código Civil e a política de privacidade', () => {
  const s = txt(secao(buildTermos(com('loja', ['menores', 'contas'])), 'Menores de idade'));
  assert.match(s, /arts\. 3º e 4º do Código Civil/);
  assert.match(s, /comprar, criar conta ou contratar/);
  assert.match(s, /Política de Privacidade/);
  assert.match(txt(secao(buildTermos(com('institucional', ['menores'])), 'Menores de idade')), /só podem contratar pelo site/);
});

test('aceitação lista as ações certas', () => {
  assert.match(txt(secao(buildTermos(com('institucional')), 'Aceitação destes termos')), /Ao usar o site, você concorda/);
  assert.match(txt(secao(buildTermos(com('loja', ['contas'])), 'Aceitação destes termos')), /Ao usar o site, criar uma conta ou concluir uma compra, você concorda/);
});

test('avisos para o dono do negócio', () => {
  const av = (tipo, ops) => buildTermos(com(tipo, ops)).avisos;
  assert.equal(av('institucional', []).length, 1);
  assert.match(av('institucional', [])[0], /negrito a seção “Regras de uso do site”\./);
  assert.match(av('membros', ['contas', 'conteudo'])[0], /“Área de membros e assinatura”, “Contas de usuário”, “Regras de uso do site” e “Conteúdo enviado por você”/);
  assert.match(av('loja', []).join(' '), /rodapé/);
  assert.match(av('institucional', ['cancelamento']).join(' '), /taxa/);
  assert.match(av('institucional', ['menores']).join(' '), /Lei nº 15\.211\/2025/);
});

test('data aparece como "Última atualização"; campos vazios viram marcadores', () => {
  assert.match(toPlainText(buildTermos({ ...base, data: '2027-03-05' })), /Última atualização: 5 de março de 2027\.\n$/);
  const t = toPlainText(buildTermos({}));
  assert.match(t, /^Termos de Uso — \[nome do negócio\]\n/);
  assert.match(t, /\[e-mail de atendimento\]/);
  assert.match(t, /Última atualização: \[data\]/);
  assert.ok(secao(buildTermos({ tipo: 'nada' }), 'Sobre o site'), 'tipo desconhecido vira institucional');
});

test('toHtml escapa tudo o que veio do usuário', () => {
  const html = toHtml(buildTermos(com('loja', [], {
    nome: '<script>alert(1)</script> & "Cia" \'x\'', endereco: '<img src=x onerror=alert(2)>', site: '<b>x</b>.com',
  })));
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="pt-BR">/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /<b>x/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; &quot;Cia&quot; &#39;x&#39;/);
  assert.match(html, /<title>Termos de Uso — &lt;script&gt;/);
});

test('toHtml destaca o que limita direitos e usa letra de 12 pt ou mais (CDC art. 54, §§ 3º e 4º)', () => {
  const p = buildTermos(com('membros', ['contas', 'conteudo', 'cancelamento']));
  const html = toHtml(p);
  assert.equal((html.match(/<section class="destaque">/g) || []).length, p.sections.filter((s) => s.destaque).length);
  assert.match(html, /font-size:16px/);
});

test('toPlainText: título, seções e itens com hífen', () => {
  const t = toPlainText(buildTermos(com('institucional')));
  assert.match(t, /^Termos de Uso — Ateliê Flor de Sal\n/);
  assert.match(t, /\nRegras de uso do site\n/);
  assert.match(t, /\n- não se passar por outra pessoa\./);
});

test('validar: obrigatórios, formatos e o que a loja virtual exige', () => {
  assert.deepEqual(validar(com('institucional')), {});
  assert.deepEqual(validar(com('loja')), {});
  assert.deepEqual(validar(com('loja', [], { documento: '12.ABC.345/01DE-35' })), {});
  assert.deepEqual(validar(com('servicos', [], { documento: '', endereco: '', whatsapp: '', site: '' })), {});
  assert.deepEqual(Object.keys(validar(com('loja', [], { documento: '', endereco: ' ' }))).sort(), ['documento', 'endereco']);
  assert.deepEqual(Object.keys(validar(com('institucional', ['pagamentos'], { documento: '', endereco: '' }))).sort(), ['documento', 'endereco']);
  assert.match(validar(com('loja', [], { documento: '' })).documento, /Decreto nº 7\.962\/2013, art\. 2º, I/);
  const e = validar({ nome: ' ', email: 'x@', documento: '123', whatsapp: '123', site: 'ftp://x', data: '2026-02-30' });
  assert.deepEqual(Object.keys(e).sort(), ['data', 'documento', 'email', 'nome', 'site', 'whatsapp']);
  assert.match(validar({ ...base, whatsapp: '(20) 98889-9345' }).whatsapp, /DDD/);
});

test('página: FAQ do HTML e do JSON-LD batem, CTA [termos], formulário bate com TIPOS e OPCOES', () => {
  const html = readFileSync(new URL('../gerador-de-termos-de-uso/index.html', import.meta.url), 'utf8');
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
  assert.match(html, /https:\/\/wa\.me\/5573988899345\?text=[^"]+%20%5Btermos%5D"/);
  assert.match(html, /<h1[^>]*>Gerador de termos de uso grátis<\/h1>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/thallisribeiro\.com\.br\/gerador-de-termos-de-uso\/">/);
  assert.match(html, /G-247F9N1WQE/);
  assert.match(html, /data-page-ev="tool_termos_viewed"/);
  assert.match(html, /O que você digita não sai do seu navegador/);
  assert.match(html, /href="\/gerador-de-politica-de-privacidade\/"/);
  assert.doesNotMatch(html, /innerHTML/);
  for (const k of OPCOES) assert.match(html, new RegExp(`type="checkbox" id="op-${k}" name="${k}"`), k);
  for (const t of TIPOS) assert.match(html, new RegExp(`type="radio" name="tipo" value="${t}"`), t);
});

test('o gerador de política de privacidade aponta para este', () => {
  const html = readFileSync(new URL('../gerador-de-politica-de-privacidade/index.html', import.meta.url), 'utf8');
  assert.match(html, /href="\/gerador-de-termos-de-uso\/"/);
});
