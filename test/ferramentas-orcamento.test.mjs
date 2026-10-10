// node --test test/ferramentas-orcamento.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  UNIDADES, ERROS, parseValor, parseQuantidade, formatValor, formatQuantidade, formatPercentual,
  subtotalLinha, calcular, parseDias, somarDias, hojeISO, formatData,
  calcularPagamento, textoPagamento, formatNumero, numeroDe, resumoWhatsApp, linkWhatsApp,
} from '../gerador-de-orcamento/orcamento.mjs';

const sp = (s) => s.replace(/ /g, ' '); // Intl usa espaço não separável depois do R$
const item = (descricao, quantidade, valor, unidade = 'un') => ({ descricao, quantidade, unidade, valor });

test('parseValor: formatos brasileiros viram centavos inteiros', () => {
  const casos = {
    '150': 15000, '150,5': 15050, '150,50': 15050, '1.250,90': 125090, 'R$ 1.250,90': 125090,
    '1.234': 123400, '1.234.567': 123456700, '1234.56': 123456, '0,01': 1, ',5': 50, '5,': 500,
    ' 12 ': 1200, '0': 0, '1 000,00': 100000,
  };
  for (const [t, c] of Object.entries(casos)) assert.equal(parseValor(t), c, t);
  for (const t of ['', '   ', 'abc', '-5', '1,234,5', '1.23,4', '10,555', '1.2345', ',', '.', '1e3', '9999999999'])
    assert.equal(parseValor(t), null, JSON.stringify(t));
  assert.equal(parseValor(undefined), null);
  assert.equal(parseValor(null), null);
});

test('parseQuantidade: até 3 casas, em milésimos', () => {
  assert.equal(parseQuantidade('1'), 1000);
  assert.equal(parseQuantidade('1,5'), 1500);
  assert.equal(parseQuantidade('2.75'), 2750);
  assert.equal(parseQuantidade('0,333'), 333);
  assert.equal(parseQuantidade('1.000'), 1000000); // ponto com 3 dígitos = milhar, como no resto do país
  assert.equal(parseQuantidade('1,2345'), null);
  assert.equal(parseQuantidade('-1'), null);
});

test('formatValor e formatQuantidade', () => {
  assert.equal(sp(formatValor(125090)), 'R$ 1.250,90');
  assert.equal(sp(formatValor(0)), 'R$ 0,00');
  assert.equal(sp(formatValor(1)), 'R$ 0,01');
  assert.equal(sp(formatValor(123456789012)), 'R$ 1.234.567.890,12');
  assert.equal(formatQuantidade(1500), '1,5');
  assert.equal(formatQuantidade(2000), '2');
  assert.equal(formatQuantidade(1234333), '1.234,333');
  assert.equal(formatPercentual(1000), '10%');
  assert.equal(formatPercentual(750), '7,5%');
});

test('subtotal da linha arredonda meio centavo para cima', () => {
  assert.equal(subtotalLinha(1000, 1999), 1999);
  assert.equal(subtotalLinha(1500, 1001), 1502); // 1501,5 -> 1502
  assert.equal(subtotalLinha(333, 1000), 333);
  assert.equal(subtotalLinha(1333, 999), 1332); // 1331,667
  assert.equal(subtotalLinha(1, 499), 0); // 0,499
  assert.equal(subtotalLinha(1, 500), 1); // 0,5 exato -> 1
  assert.equal(subtotalLinha(2500, 3333), 8333); // 8332,5 -> 8333
  // produto acima de 2^53: em ponto flutuante daria 99999985000000 (errado)
  assert.equal(subtotalLinha(9999999, 9999999500), 99999985000001);
});

test('calcular: soma linhas, ignora linha vazia, aponta erro por campo', () => {
  const r = calcular({
    itens: [
      item('Pintura', '2', '150'),
      item('', '1', ''), // linha nova sem nada: ignorada, sem erro
      item('Massa corrida', '1,5', '33,33', 'kg'),
      item('', '1', '10'), // sem descrição
      item('Mão de obra', '0', '10'),
      item('Visita técnica', '1', '0', 'serviço'), // cortesia vale
      item('Rodapé', 'x', 'y', 'm²'),
      item('Unidade estranha', '1', '1', '<script>'),
    ],
  });
  assert.equal(r.linhas.length, 8);
  assert.equal(r.linhas[0].subtotal, 30000);
  assert.equal(r.linhas[1].vazia, true);
  assert.equal(r.linhas[2].subtotal, 5000); // 49,995 -> 50,00
  assert.equal(r.linhas[2].unidade, 'kg');
  assert.deepEqual(r.linhas[3].erros, ['descricao']);
  assert.deepEqual(r.linhas[4].erros, ['quantidade-zero']);
  assert.equal(r.linhas[5].subtotal, 0);
  assert.deepEqual(r.linhas[5].erros, []);
  assert.deepEqual(r.linhas[6].erros, ['quantidade', 'valor']);
  assert.equal(r.linhas[7].unidade, 'un');
  assert.equal(r.subtotal, 30000 + 5000 + 0 + 100);
  assert.equal(r.validas, 4);
  assert.equal(r.comErro, 3);
  assert.equal(r.total, r.subtotal);
  assert.equal(r.ok, false);
  for (const l of r.linhas) for (const e of l.erros ?? []) assert.ok(ERROS[e], e);
});

test('calcular: sem itens é zero e ok', () => {
  for (const o of [{}, { itens: [] }, { itens: [item('', '1', '')] }, undefined]) {
    const r = calcular(o);
    assert.equal(r.total, 0);
    assert.equal(r.validas, 0);
    assert.equal(r.ok, true);
  }
});

test('desconto em reais e em percentual, depois o frete', () => {
  const itens = [item('Serviço', '1', '1.000,00'), item('Material', '3', '33,33')]; // 1099,99
  let r = calcular({ itens, desconto: { tipo: 'valor', valor: '99,99' }, acrescimo: '50' });
  assert.equal(r.subtotal, 109999);
  assert.equal(r.desconto, 9999);
  assert.equal(r.acrescimo, 5000);
  assert.equal(r.total, 105000);
  assert.equal(r.ok, true);

  r = calcular({ itens, desconto: { tipo: 'percentual', valor: '10' } });
  assert.equal(r.desconto, 11000); // 10999,9 -> 11000
  assert.equal(r.percentual, 1000);
  assert.equal(r.total, 98999);

  r = calcular({ itens, desconto: { tipo: 'percentual', valor: '7,5%' } });
  assert.equal(r.desconto, 8250); // 8249,925 -> 8250
  r = calcular({ itens: [item('a', '1', '0,10')], desconto: { tipo: 'percentual', valor: '5' } });
  assert.equal(r.desconto, 1); // 0,5 centavo -> 1
  r = calcular({ itens, desconto: { tipo: 'percentual', valor: '100' } });
  assert.equal(r.total, 0);
  assert.equal(r.ok, true);
});

test('desconto e frete inválidos dão erro e não mexem no total', () => {
  const itens = [item('Serviço', '1', '100')];
  const casos = [
    [{ desconto: { tipo: 'percentual', valor: '101' } }, 'desconto', 'percentual'],
    [{ desconto: { tipo: 'valor', valor: '100,01' } }, 'desconto', 'desconto-maior'],
    [{ desconto: { tipo: 'valor', valor: 'dez' } }, 'desconto', 'numero'],
    [{ acrescimo: '-5' }, 'acrescimo', 'numero'],
  ];
  for (const [extra, campo, codigo] of casos) {
    const r = calcular({ itens, ...extra });
    assert.equal(r.erros[campo], codigo, JSON.stringify(extra));
    assert.equal(r.total, 10000);
    assert.equal(r.ok, false);
    assert.ok(ERROS[codigo]);
  }
  // em branco é zero, sem erro
  const r = calcular({ itens, desconto: { tipo: 'valor', valor: '  ' }, acrescimo: '' });
  assert.equal(r.ok, true);
  assert.equal(r.total, 10000);
});

test('valor alto demais não vira número inseguro', () => {
  let r = calcular({ itens: [item('Obra', '999.999', '999.999.999,99')] });
  assert.deepEqual(r.linhas[0].erros, ['grande']);
  assert.equal(r.ok, false);
  assert.equal(r.total, 0);
  r = calcular({ itens: Array.from({ length: 10 }, () => item('Obra', '999.999', '9.999.999,99')) });
  assert.equal(r.linhas[0].subtotal, 999998999000001);
  assert.equal(r.erros.total, 'grande');
  assert.equal(r.ok, false);
  assert.ok(Number.isSafeInteger(r.total));
  assert.ok(ERROS.grande);
});

test('parseDias aceita 1 a 365', () => {
  assert.equal(parseDias('15'), 15);
  assert.equal(parseDias(' 30 '), 30);
  assert.equal(parseDias(365), 365);
  for (const t of ['0', '366', '1,5', '', 'abc', '-3']) assert.equal(parseDias(t), null, t);
});

test('somarDias: dias de calendário, virada de mês, ano e ano bissexto', () => {
  assert.equal(somarDias('2026-10-10', 15), '2026-10-25');
  assert.equal(somarDias('2026-01-31', 1), '2026-02-01');
  assert.equal(somarDias('2026-01-31', 30), '2026-03-02'); // fevereiro de 2026 tem 28
  assert.equal(somarDias('2026-12-20', 15), '2027-01-04');
  assert.equal(somarDias('2028-02-28', 1), '2028-02-29'); // 2028 é bissexto
  assert.equal(somarDias('2027-02-28', 1), '2027-03-01');
  assert.equal(somarDias('2028-02-01', 30), '2028-03-02');
  assert.equal(somarDias('2100-02-28', 1), '2100-03-01'); // divisível por 100 e não por 400
  assert.equal(somarDias('2026-10-17', 1), '2026-10-18'); // perto de troca de horário de verão de outros fusos
  assert.equal(somarDias('2026-02-30', 1), null);
  assert.equal(somarDias('lixo', 1), null);
  assert.equal(somarDias('2026-10-10', null), null);
});

test('hojeISO usa o calendário local e formatData mostra dd/mm/aaaa', () => {
  assert.equal(hojeISO(new Date(2026, 0, 31, 23, 59)), '2026-01-31');
  assert.equal(hojeISO(new Date(2026, 11, 31, 0, 1)), '2026-12-31');
  assert.equal(formatData('2027-01-04'), '04/01/2027');
  assert.equal(formatData(''), '');
});

test('parcelas somam o total exato; centavos de arredondamento vão na primeira', () => {
  let p = calcularPagamento(10000, { tipo: 'parcelado', parcelas: '3' });
  assert.deepEqual(p.parcelas, [3334, 3333, 3333]);
  assert.equal(p.entrada, 0);

  p = calcularPagamento(100000, { tipo: 'parcelado', entrada: { tipo: 'percentual', valor: '30' }, parcelas: 3 });
  assert.equal(p.entrada, 30000);
  assert.deepEqual(p.parcelas, [23334, 23333, 23333]);

  p = calcularPagamento(99999, { tipo: 'parcelado', entrada: { tipo: 'valor', valor: '0,01' }, parcelas: 7 });
  assert.equal(p.parcelas[0] - p.parcelas[1], 3); // 99998 = 7 x 14285 + 3
  for (const total of [1, 7, 100, 9999, 123457, 100000001])
    for (let n = 1; n <= 24; n++)
      for (const ent of ['', '10', '33,33']) {
        const q = calcularPagamento(total, { tipo: 'parcelado', entrada: { tipo: 'percentual', valor: ent }, parcelas: n });
        assert.equal(q.entrada + q.parcelas.reduce((a, b) => a + b, 0), total, `${total} em ${n} com ${ent}%`);
        assert.equal(q.parcelas.length, n);
        assert.ok(q.parcelas.every((x) => x === q.parcelas[1] || x === q.parcelas[0]));
        assert.ok(q.parcelas[0] >= q.parcelas[n - 1]);
      }
});

test('pagamento: à vista e erros', () => {
  assert.deepEqual(calcularPagamento(5000, {}), { tipo: 'avista', entrada: 0, parcelas: [] });
  assert.equal(calcularPagamento(5000, { tipo: 'parcelado', parcelas: '0' }).erro, 'parcelas');
  assert.equal(calcularPagamento(5000, { tipo: 'parcelado', parcelas: '25' }).erro, 'parcelas');
  assert.equal(calcularPagamento(5000, { tipo: 'parcelado', parcelas: '2,5' }).erro, 'parcelas');
  assert.equal(calcularPagamento(5000, { tipo: 'parcelado', parcelas: 2, entrada: { tipo: 'valor', valor: '50' } }).erro, 'entrada-maior');
  assert.equal(calcularPagamento(5000, { tipo: 'parcelado', parcelas: 2, entrada: { tipo: 'percentual', valor: '100' } }).erro, 'entrada-maior');
  assert.equal(calcularPagamento(5000, { tipo: 'parcelado', parcelas: 2, entrada: { tipo: 'valor', valor: 'x' } }).erro, 'entrada');
  // orçamento ainda vazio não acusa erro de entrada
  assert.deepEqual(calcularPagamento(0, { tipo: 'parcelado', parcelas: 2 }).parcelas, [0, 0]);
  for (const c of ['parcelas', 'entrada-maior', 'entrada']) assert.ok(ERROS[c]);
});

test('texto das condições de pagamento', () => {
  assert.equal(sp(textoPagamento(100000, { tipo: 'avista' })), 'À vista: R$ 1.000,00');
  assert.equal(sp(textoPagamento(90000, { tipo: 'parcelado', parcelas: 3 })), '3 parcelas de R$ 300,00');
  assert.equal(sp(textoPagamento(10000, { tipo: 'parcelado', parcelas: 3 })), '3 parcelas: 1ª de R$ 33,34 e as outras 2 de R$ 33,33');
  assert.equal(sp(textoPagamento(10001, { tipo: 'parcelado', parcelas: 2 })), '2 parcelas: 1ª de R$ 50,01 e 2ª de R$ 50,00');
  assert.equal(sp(textoPagamento(10000, { tipo: 'parcelado', parcelas: 1, entrada: { tipo: 'valor', valor: '40' } })),
    'Entrada de R$ 40,00 + 1 parcela de R$ 60,00');
  assert.equal(sp(textoPagamento(100000, { tipo: 'parcelado', parcelas: 2, entrada: { tipo: 'percentual', valor: '50' } })),
    'Entrada de R$ 500,00 (50%) + 2 parcelas de R$ 250,00');
  assert.equal(textoPagamento(100, { tipo: 'parcelado', parcelas: 99 }), '');
});

test('numeração ORC-0001', () => {
  assert.equal(formatNumero(1), 'ORC-0001');
  assert.equal(formatNumero(12345), 'ORC-12345');
  assert.equal(numeroDe('ORC-0050'), 50);
  assert.equal(numeroDe('2026/17'), 17);
  assert.equal(numeroDe('sem número'), 0);
  assert.equal(numeroDe(''), 0);
});

const exemplo = () => ({
  numero: 'ORC-0007',
  emissao: '2026-10-10',
  validadeDias: '15',
  empresa: { nome: 'Pinturas Silva', documento: '12.345.678/0001-90', contato: '(73) 98888-0000' },
  cliente: { nome: 'Maria Souza', contato: 'maria@exemplo.com' },
  itens: [item('Pintura de parede', '40', '25', 'm²'), item('Tinta acrílica 18 L', '2', '389,90'), item('', '1', '')],
  desconto: { tipo: 'percentual', valor: '5' },
  acrescimo: '80',
  pagamento: { tipo: 'parcelado', entrada: { tipo: 'percentual', valor: '50' }, parcelas: '2', forma: 'Pix ou cartão' },
  prazo: '5 dias úteis',
  observacoes: 'Não inclui massa corrida.',
});

test('resumoWhatsApp traz o essencial em texto curto', () => {
  const t = sp(resumoWhatsApp(exemplo()));
  // 1000 + 779,80 = 1779,80; -5% = 88,99; +80 = 1770,81
  for (const trecho of [
    '*Orçamento ORC-0007*', 'De: Pinturas Silva', 'Para: Maria Souza',
    '• Pintura de parede (40 m²): R$ 1.000,00', '• Tinta acrílica 18 L (2 un): R$ 779,80',
    'Subtotal: R$ 1.779,80', 'Desconto (5%): -R$ 88,99', 'Frete/acréscimo: R$ 80,00', '*Total: R$ 1.770,81*',
    'Pagamento: Entrada de R$ 885,41 (50%) + 2 parcelas de R$ 442,70', 'Forma: Pix ou cartão',
    'Prazo de execução: 5 dias úteis', 'Válido até 25/10/2026',
  ]) assert.ok(t.includes(trecho), `falta "${trecho}" em:\n${t}`);
  assert.ok(!t.includes('undefined') && !t.includes('null') && !t.includes('NaN'));
  assert.ok(!t.includes('Não inclui massa'), 'observação fica no PDF, não no resumo curto');
});

test('resumoWhatsApp com muitos itens lista só os 5 primeiros', () => {
  const o = exemplo();
  o.itens = Array.from({ length: 25 }, (_, i) => item(`Item ${i + 1}`, '1', '10'));
  o.desconto = {}; o.acrescimo = ''; o.pagamento = { tipo: 'avista' }; o.prazo = ''; o.cliente = {};
  const t = sp(resumoWhatsApp(o));
  assert.ok(t.includes('• Item 5 (1 un): R$ 10,00'));
  assert.ok(!t.includes('Item 6 '));
  assert.ok(t.includes('+ 20 itens'));
  assert.ok(!t.includes('Subtotal'), 'sem desconto nem frete, subtotal é o total');
  assert.ok(!t.includes('Para:'));
  assert.ok(t.includes('*Total: R$ 250,00*'));
  assert.ok(t.includes('Pagamento: À vista: R$ 250,00'));
});

test('resumoWhatsApp de orçamento vazio não quebra', () => {
  const t = resumoWhatsApp({});
  assert.equal(typeof t, 'string');
  assert.ok(!/undefined|null|NaN/.test(t));
});

test('linkWhatsApp abre o WhatsApp sem número, para escolher o contato', () => {
  assert.equal(linkWhatsApp('Olá & tchau\n*R$ 10*'), 'https://wa.me/?text=Ol%C3%A1%20%26%20tchau%0A*R%24%2010*');
});

test('unidades oferecidas', () => {
  assert.deepEqual(UNIDADES, ['un', 'h', 'm²', 'kg', 'serviço']);
});

// ---------- abrir com modelo: /gerador-de-orcamento/?modelo=<slug> ----------
import { slugModelo, lerModelo, temConteudo } from '../gerador-de-orcamento/orcamento.mjs';
import { readFileSync } from 'node:fs';

test('slugModelo: só aceita slug simples vindo da URL', () => {
  assert.equal(slugModelo('?modelo=eletricista'), 'eletricista');
  assert.equal(slugModelo('?utm_source=x&modelo=mudanca-e-frete'), 'mudanca-e-frete');
  for (const busca of ['', '?', '?modelo=', '?modelo=Eletricista', '?modelo=%3Cscript%3E', '?modelo=__proto__',
    '?modelo=a--b', '?modelo=-a', '?modelo=../x', `?modelo=${'a'.repeat(61)}`, undefined])
    assert.equal(slugModelo(busca), null, String(busca));
});

test('lerModelo: itens sem preço, unidade conhecida e limites dos campos da página', () => {
  const modelos = {
    teste: {
      nome: 'Teste',
      itens: [
        { descricao: 'Pintura de parede', unidade: 'm²', quantidade: '40' },
        { descricao: 'x'.repeat(600), unidade: '<script>', quantidade: '' },
        { descricao: 'Com preço no JSON', unidade: 'h', quantidade: '2', valor: '999' },
        null,
      ],
      observacoes: 'o'.repeat(2500),
    },
  };
  const m = lerModelo(modelos, 'teste');
  assert.equal(m.nome, 'Teste');
  assert.deepEqual(m.itens[0], { descricao: 'Pintura de parede', unidade: 'm²', quantidade: '40', valor: '' });
  assert.equal(m.itens[1].descricao.length, 500);
  assert.equal(m.itens[1].unidade, 'un');
  assert.equal(m.itens[1].quantidade, '1');
  assert.equal(m.itens[2].valor, '', 'preço nunca vem do modelo');
  assert.deepEqual(m.itens[3], { descricao: '', unidade: 'un', quantidade: '1', valor: '' });
  assert.equal(m.observacoes.length, 2000);
  for (const slug of ['nada', 'constructor', 'toString', '__proto__', '', null]) assert.equal(lerModelo(modelos, slug), null, String(slug));
  assert.equal(lerModelo({ vazio: { itens: [] } }, 'vazio'), null);
  assert.equal(lerModelo(null, 'teste'), null);
});

test('temConteudo: rascunho com cliente, item ou observação pede confirmação antes de trocar', () => {
  assert.equal(temConteudo({}), false);
  assert.equal(temConteudo({ cliente: { nome: ' ' }, itens: [{ descricao: '', quantidade: '1', valor: '' }], observacoes: '' }), false);
  assert.equal(temConteudo({ empresa: { nome: 'Minha empresa' }, itens: [] }), false, 'dado da empresa fica, não conta');
  assert.equal(temConteudo({ cliente: { nome: 'Maria' } }), true);
  assert.equal(temConteudo({ itens: [{ descricao: 'Pintura' }] }), true);
  assert.equal(temConteudo({ itens: [{ valor: '10' }] }), true);
  assert.equal(temConteudo({ observacoes: 'Não inclui massa.' }), true);
});

test('modelos.json: todo modelo carrega, sem preço, com unidade que o gerador oferece', () => {
  const modelos = JSON.parse(readFileSync(new URL('../gerador-de-orcamento/modelos.json', import.meta.url), 'utf8'));
  const slugs = Object.keys(modelos);
  assert.ok(slugs.length > 0);
  for (const slug of slugs) {
    assert.equal(slugModelo(`?modelo=${slug}`), slug, `slug inválido: ${slug}`);
    const bruto = modelos[slug], m = lerModelo(modelos, slug);
    assert.ok(m && m.nome, slug);
    assert.ok(m.observacoes.trim(), `${slug}: sem observações`);
    assert.equal(m.observacoes, bruto.observacoes, `${slug}: observações passam do limite`);
    assert.equal(m.itens.length, bruto.itens.length);
    m.itens.forEach((it, i) => {
      assert.ok(UNIDADES.includes(bruto.itens[i].unidade), `${slug}: unidade "${bruto.itens[i].unidade}"`);
      assert.equal(it.descricao, bruto.itens[i].descricao, `${slug}: descrição passa do limite`);
      assert.ok(it.descricao.trim(), `${slug}: item sem descrição`);
      assert.ok(parseQuantidade(it.quantidade) > 0, `${slug}: quantidade "${it.quantidade}"`);
      assert.equal(it.valor, '');
      assert.ok(!('valor' in bruto.itens[i]), `${slug}: modelo não traz preço`);
    });
    // o modelo abre como um orçamento válido assim que a pessoa põe os preços
    const r = calcular({ itens: m.itens.map((it) => ({ ...it, valor: '10' })) });
    assert.equal(r.ok, true, slug);
    assert.equal(r.validas, m.itens.length, slug);
  }
});
