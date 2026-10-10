// node --test test/ferramentas-recibo.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  valorPorExtenso, parseValor, formatValor, validaCPF, validaCNPJ, formatDocumento,
  dataPorExtenso, proximoNumero, buildRecibo, VALOR_MAXIMO,
} from '../gerador-de-recibo/recibo.mjs';

const R = (reais) => Math.round(reais * 100);

test('valorPorExtenso: tabela', () => {
  const casos = [
    [1, 'um centavo'],
    [R(1), 'um real'],
    [R(2), 'dois reais'],
    [R(10), 'dez reais'],
    [R(11), 'onze reais'],
    [R(14), 'quatorze reais'],
    [R(15), 'quinze reais'],
    [R(16), 'dezesseis reais'],
    [R(20), 'vinte reais'],
    [R(21), 'vinte e um reais'],
    [R(100), 'cem reais'],
    [R(101), 'cento e um reais'],
    [R(110), 'cento e dez reais'],
    [R(199), 'cento e noventa e nove reais'],
    [R(200), 'duzentos reais'],
    [R(1000), 'mil reais'],
    [R(1001), 'mil e um reais'],
    [R(1100), 'mil e cem reais'],
    [R(1234), 'mil duzentos e trinta e quatro reais'],
    [R(2000), 'dois mil reais'],
    [R(10000), 'dez mil reais'],
    [R(21000), 'vinte e um mil reais'],
    [R(100000), 'cem mil reais'],
    [R(101000), 'cento e um mil reais'],
    [R(1000000), 'um milhão de reais'],
    [R(1000001), 'um milhão e um reais'],
    [R(1500000), 'um milhão e quinhentos mil reais'],
    [R(2000000), 'dois milhões de reais'],
    [123456789, 'um milhão, duzentos e trinta e quatro mil quinhentos e sessenta e sete reais e oitenta e nove centavos'],
    [10101, 'cento e um reais e um centavo'],
    [50, 'cinquenta centavos'],
    [100000050, 'um milhão de reais e cinquenta centavos'],
    [VALOR_MAXIMO, 'novecentos e noventa e nove milhões, novecentos e noventa e nove mil novecentos e noventa e nove reais e noventa e nove centavos'],
  ];
  for (const [c, esperado] of casos) assert.equal(valorPorExtenso(c), esperado, String(c));
});

test('valorPorExtenso: zero, negativo, fração e acima do limite dão erro', () => {
  for (const c of [0, -1, 1.5, NaN, VALOR_MAXIMO + 1, '100']) assert.throws(() => valorPorExtenso(c), RangeError, String(c));
});

test('parseValor: formatos que o brasileiro digita', () => {
  const casos = [
    ['R$ 1.234,56', 123456], ['1234,56', 123456], ['1.234', 123400], ['1234', 123400],
    ['10,5', 1050], ['0,01', 1], ['1234.56', 123456], ['1.23', 123], ['R$1.000.000,00', 100000000],
    ['  150  ', 15000], ['r$ 80', 8000], ['0', 0], ['999.999.999,99', 99999999999],
  ];
  for (const [s, c] of casos) assert.equal(parseValor(s), c, s);
  for (const s of ['', '   ', 'abc', '1,234,56', '12.34.5', '-10', '1.2345', '10,555', 'R$', '1 000', null, undefined]) {
    assert.equal(parseValor(s), null, String(s));
  }
});

test('formatValor', () => {
  assert.equal(formatValor(123456), 'R$ 1.234,56');
  assert.equal(formatValor(1), 'R$ 0,01');
  assert.equal(formatValor(100000000), 'R$ 1.000.000,00');
});

test('CPF: dígitos verificadores', () => {
  for (const s of ['529.982.247-25', '52998224725', ' 529 982 247 25 ']) assert.ok(validaCPF(s), s);
  for (const s of ['529.982.247-24', '529.982.247-15', '111.111.111-11', '000.000.000-00', '5299822472', '529982247250', '52998224A25', '']) {
    assert.ok(!validaCPF(s), s);
  }
});

test('CNPJ numérico e alfanumérico (exemplo oficial da Receita: 12.ABC.345/01DE-35)', () => {
  for (const s of ['11.222.333/0001-81', '11222333000181', '12.ABC.345/01DE-35', '12ABC34501DE35', '12.abc.345/01de-35']) assert.ok(validaCNPJ(s), s);
  for (const s of ['11.222.333/0001-82', '12.ABC.345/01DE-36', '12.ABC.345/01DE-53', '12ABC34501DEA5', '11.111.111/1111-11', '00000000000000', '1222333000181', '12.ABC.345/01DÉ-35', '']) {
    assert.ok(!validaCNPJ(s), s);
  }
});

test('formatDocumento', () => {
  assert.equal(formatDocumento('52998224725'), '529.982.247-25');
  assert.equal(formatDocumento('11222333000181'), '11.222.333/0001-81');
  assert.equal(formatDocumento('12abc34501de35'), '12.ABC.345/01DE-35');
  assert.equal(formatDocumento(' 529.982.247-25 '), '529.982.247-25');
  assert.equal(formatDocumento('  RG 12.345  '), 'RG 12.345');
  assert.equal(formatDocumento(''), '');
});

test('dataPorExtenso', () => {
  assert.equal(dataPorExtenso('2026-10-10'), '10 de outubro de 2026');
  assert.equal(dataPorExtenso('2026-03-01'), '1º de março de 2026');
  assert.equal(dataPorExtenso('2024-02-29'), '29 de fevereiro de 2024');
  for (const s of ['2026-02-29', '2026-13-01', '2026-00-10', '10/10/2026', '', null]) assert.equal(dataPorExtenso(s), '', String(s));
});

test('proximoNumero: segue o maior número do prefixo usado por último', () => {
  assert.equal(proximoNumero([]), '');
  assert.equal(proximoNumero(['sem número']), '');
  assert.equal(proximoNumero(['1', '2', '3']), '4');
  assert.equal(proximoNumero(['10', '3']), '11'); // reimprimiu o 3 depois do 10
  assert.equal(proximoNumero(['007']), '008');
  assert.equal(proximoNumero(['099']), '100');
  assert.equal(proximoNumero(['2025-099', '2026-001']), '2026-002');
  assert.equal(proximoNumero(['99999999999999999999']), '100000000000000000000');
});

const completo = {
  recebedorNome: 'Maria da Silva', recebedorDoc: '52998224725', recebedorEndereco: 'Rua das Flores, 10, Centro',
  pagadorNome: 'Padaria Pão Bom Ltda', pagadorDoc: '11222333000181',
  valor: 'R$ 1.234,56', referente: 'serviço de limpeza do mês de setembro de 2026.',
  forma: 'pix', data: '2026-10-10', cidade: 'Eunápolis (BA)', numero: '7',
};

test('buildRecibo: recibo completo traz o que o art. 320 do Código Civil pede', () => {
  const r = buildRecibo(completo);
  assert.equal(r.ok, true);
  assert.deepEqual(r.erros, {});
  const x = r.recibo;
  assert.equal(x.titulo, 'RECIBO Nº 7');
  assert.equal(x.valorCents, 123456);
  assert.equal(x.valor, 'R$ 1.234,56');
  assert.equal(x.valorExtenso, 'mil duzentos e trinta e quatro reais e cinquenta e seis centavos');
  assert.equal(x.corpo,
    'Recebi de Padaria Pão Bom Ltda, CNPJ 11.222.333/0001-81, a importância de R$ 1.234,56 ' +
    '(mil duzentos e trinta e quatro reais e cinquenta e seis centavos), referente a serviço de limpeza ' +
    'do mês de setembro de 2026, paga por Pix. Por ser verdade, firmo o presente recibo, dando quitação deste valor.');
  assert.equal(x.local, 'Eunápolis (BA), 10 de outubro de 2026.');
  assert.deepEqual(x.recebedor, { nome: 'Maria da Silva', doc: 'CPF 529.982.247-25', endereco: 'Rua das Flores, 10, Centro' });
  assert.match(r.texto, /^\*RECIBO Nº 7\*\nValor: R\$ 1\.234,56\n\nRecebi de Padaria/);
  assert.match(r.texto, /\n\nEunápolis \(BA\), 10 de outubro de 2026\.\n\nMaria da Silva\nCPF 529\.982\.247-25\nRua das Flores, 10, Centro$/);
});

test('buildRecibo: opcionais vazios e formas de pagamento', () => {
  const frases = { pix: 'por Pix', dinheiro: 'em dinheiro', cartao: 'no cartão', transferencia: 'por transferência bancária', boleto: 'por boleto' };
  for (const [forma, frase] of Object.entries(frases)) {
    const r = buildRecibo({ ...completo, forma, recebedorDoc: '', recebedorEndereco: ' ', pagadorDoc: '', numero: '' });
    assert.equal(r.ok, true, forma);
    assert.equal(r.recibo.titulo, 'RECIBO');
    assert.ok(r.recibo.corpo.startsWith('Recebi de Padaria Pão Bom Ltda, a importância'), forma);
    assert.ok(r.recibo.corpo.includes(`, paga ${frase}.`), forma);
    assert.deepEqual(r.recibo.recebedor, { nome: 'Maria da Silva', doc: '', endereco: '' });
    assert.ok(r.texto.endsWith('\n\nMaria da Silva'), forma);
  }
});

test('buildRecibo: campos obrigatórios faltando', () => {
  const r = buildRecibo({});
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.erros).sort(), ['cidade', 'data', 'forma', 'pagadorNome', 'recebedorNome', 'referente', 'valor']);
  for (const msg of Object.values(r.erros)) assert.ok(typeof msg === 'string' && msg.length > 10);
  assert.equal(r.texto, '');
  // a prévia ainda sai, com lacunas no lugar do que falta
  assert.match(r.recibo.corpo, /^Recebi de _+, a importância de R\$ _+ \(_+\), referente a _+, paga _+\./);
});

test('buildRecibo: valores e documentos inválidos', () => {
  const erro = (campo, extra) => buildRecibo({ ...completo, ...extra }).erros[campo];
  assert.ok(erro('valor', { valor: '0' }));
  assert.ok(erro('valor', { valor: '0,00' }));
  assert.ok(erro('valor', { valor: 'cem reais' }));
  assert.ok(erro('valor', { valor: '1.000.000.000,00' }));
  assert.ok(erro('pagadorDoc', { pagadorDoc: '11.222.333/0001-82' }));
  assert.ok(erro('recebedorDoc', { recebedorDoc: '529.982.247-24' }));
  assert.ok(erro('recebedorDoc', { recebedorDoc: '1234' }));
  assert.ok(erro('data', { data: '2026-02-30' }));
  assert.ok(erro('forma', { forma: 'cheque' }));
  assert.ok(erro('recebedorNome', { recebedorNome: '   ' }));
  // CNPJ alfanumérico é aceito e sai formatado
  const r = buildRecibo({ ...completo, pagadorDoc: '12abc34501de35' });
  assert.equal(r.ok, true);
  assert.ok(r.recibo.corpo.includes('CNPJ 12.ABC.345/01DE-35'));
});

test('buildRecibo: espaços e quebras de linha viram um espaço só', () => {
  const r = buildRecibo({ ...completo, referente: '  aluguel\n\nde outubro  ', pagadorNome: ' João   Souza ' });
  assert.ok(r.recibo.corpo.includes('Recebi de João Souza,'));
  assert.ok(r.recibo.corpo.includes('referente a aluguel de outubro, paga'));
});

// ---------- abrir com modelo: /gerador-de-recibo/?modelo=<slug> ----------
import { slugModelo, lerModelo, temRascunho } from '../gerador-de-recibo/recibo.mjs';
import { readFileSync } from 'node:fs';

test('slugModelo: só aceita slug simples vindo da URL', () => {
  assert.equal(slugModelo('?modelo=aluguel'), 'aluguel');
  assert.equal(slugModelo('?x=1&modelo=venda-de-veiculo'), 'venda-de-veiculo');
  for (const busca of ['', '?modelo=', '?modelo=Aluguel', '?modelo=%3Cscript%3E', '?modelo=__proto__', '?modelo=a_b', `?modelo=${'a'.repeat(61)}`, null])
    assert.equal(slugModelo(busca), null, String(busca));
});

test('lerModelo: referente até 200 caracteres, forma conhecida, dica opcional', () => {
  const modelos = {
    ok: { nome: 'Aluguel', referente: 'aluguel de [mês/ano]', forma: 'transferencia', dica: 'Troque o que está entre colchetes.' },
    longo: { nome: 'Longo', referente: 'r'.repeat(300), forma: 'cheque', dica: 7 },
    vazio: { nome: 'Vazio', referente: '  ', forma: 'pix' },
  };
  assert.deepEqual(lerModelo(modelos, 'ok'), { nome: 'Aluguel', referente: 'aluguel de [mês/ano]', forma: 'transferencia', dica: 'Troque o que está entre colchetes.' });
  const l = lerModelo(modelos, 'longo');
  assert.equal(l.referente.length, 200);
  assert.equal(l.forma, 'pix', 'forma desconhecida volta para Pix');
  assert.equal(l.dica, '');
  for (const slug of ['vazio', 'nada', 'constructor', 'toString', '', undefined]) assert.equal(lerModelo(modelos, slug), null, String(slug));
  assert.equal(lerModelo(undefined, 'ok'), null);
});

test('temRascunho: pagador, valor ou referente escritos pedem confirmação antes de trocar', () => {
  assert.equal(temRascunho({}), false);
  assert.equal(temRascunho({ recebedorNome: 'Maria', cidade: 'Eunápolis', forma: 'pix', numero: '3' }), false, 'dados de quem recebe ficam');
  for (const k of ['pagadorNome', 'pagadorDoc', 'valor', 'referente']) assert.equal(temRascunho({ [k]: 'x' }), true, k);
  assert.equal(temRascunho({ referente: '   ' }), false);
});

test('modelos.json: todo modelo carrega e vira um recibo completo quando a pessoa preenche o resto', () => {
  const modelos = JSON.parse(readFileSync(new URL('../gerador-de-recibo/modelos.json', import.meta.url), 'utf8'));
  const slugs = Object.keys(modelos);
  assert.ok(slugs.length > 0);
  for (const slug of slugs) {
    assert.equal(slugModelo(`?modelo=${slug}`), slug, slug);
    const bruto = modelos[slug], m = lerModelo(modelos, slug);
    assert.ok(m && m.nome && m.dica, slug);
    assert.equal(m.referente, bruto.referente, `${slug}: referente passa de 200 caracteres`);
    assert.equal(m.forma, bruto.forma, `${slug}: forma "${bruto.forma}" não existe no gerador`);
    assert.ok(!/R\$\s*\d/.test(m.referente), `${slug}: modelo não traz valor`);
    const r = buildRecibo({ ...completo, referente: m.referente, forma: m.forma });
    assert.equal(r.ok, true, slug);
    assert.ok(r.recibo.corpo.includes(`referente a ${m.referente.replace(/[\s.;,]+$/, '')}, paga `), slug);
  }
});
