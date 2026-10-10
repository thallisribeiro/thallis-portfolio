// node --test test/ferramentas-pix.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crc16, validateKey, buildPayload, parsePayload, parseValor, textoPix, maxDescricao, formataChave, ERROS,
} from '../gerador-qr-code-pix/pix.mjs';

// ---------- exemplos impressos nos manuais do Banco Central ----------

// Manual de Padrões para Iniciação do Pix v2.10.0, seção 2.6.3 (QR estático, chave aleatória, sem valor)
const BCB_ESTATICO = '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR' +
  '5913Fulano de Tal6008BRASILIA62070503***63041D3D';
// Mesmo manual, seção 2.7.2 (QR dinâmico)
const BCB_DINAMICO = '00020101021226700014br.gov.bcb.pix2548pix.example.com/8b3da2f39a4140d1a91abd93113bd441' +
  '5204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***630464E4';
// Mesmo manual, seção 2.8.5 (QR composto: só recorrência; e estático com valor 100.50 + recorrência)
const BCB_COMPOSTO = '00020126180014br.gov.bcb.pix5204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***' +
  '80740014br.gov.bcb.pix2552pix.example.com/rec/2353c790eefb11eaadc10242ac1200026304F2DA';
const BCB_COMPOSTO_VALOR = '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000520400005303986' +
  '5406100.505802BR5913Fulano de Tal6008BRASILIA62070503***80740014br.gov.bcb.pix2552pix.example.com/rec/' +
  '2353c790eefb11eaadc10242ac12000263042875';
// Manual do BR Code v2.0.1, seção 2.2 (cartão + Pix + outro arranjo, 270 caracteres)
const BRCODE = '00020104141234567890123426580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-426655440000' +
  '27300012BR.COM.OUTRO011001234567895204000053039865406123.455802BR5917NOME DO RECEBEDOR6008BRASILIA' +
  '61087007490062190515RP12345678-201980390012BR.COM.OUTRO01190123.ABCD.3456.WXYZ6304AD38';

const semCrc = (p) => p.slice(0, -4);

test('CRC16-CCITT-FALSE: vetor de referência "123456789" = 29B1', () => {
  assert.equal(crc16('123456789'), '29B1');
});

test('CRC16: maiúsculo, 4 dígitos com zero à esquerda', () => {
  assert.match(crc16(''), /^[0-9A-F]{4}$/);
  assert.equal(crc16(''), 'FFFF'); // valor inicial, nada processado
});

for (const [nome, p, crc] of [
  ['estático (Pix 2.6.3)', BCB_ESTATICO, '1D3D'],
  ['dinâmico (Pix 2.7.2)', BCB_DINAMICO, '64E4'],
  ['composto (Pix 2.8.5)', BCB_COMPOSTO, 'F2DA'],
  ['composto com valor (Pix 2.8.5)', BCB_COMPOSTO_VALOR, '2875'],
  ['BR Code 2.2', BRCODE, 'AD38'],
]) {
  test(`CRC16 reproduz o exemplo do BCB: ${nome} → ${crc}`, () => {
    assert.ok(p.endsWith('6304' + crc));
    assert.equal(crc16(semCrc(p)), crc);
  });
}

test('exemplo do Manual do BR Code tem os 270 caracteres que o manual diz', () => {
  assert.equal(BRCODE.length, 270);
});

test('buildPayload reproduz byte a byte o QR estático do Manual do Pix (2.6.3)', () => {
  const p = buildPayload({ key: '123e4567-e12b-12d1-a456-426655440000', name: 'Fulano de Tal', city: 'BRASILIA' });
  assert.equal(p, BCB_ESTATICO);
});

test('buildPayload com valor reproduz a parte estática do exemplo composto (5406100.50)', () => {
  const p = buildPayload({ key: '123e4567-e12b-12d1-a456-426655440000', name: 'Fulano de Tal', city: 'BRASILIA', amount: 100.5 });
  const esperado = BCB_COMPOSTO_VALOR.slice(0, BCB_COMPOSTO_VALOR.indexOf('8074'));
  assert.ok(p.startsWith(esperado), p);
  assert.equal(p.length, esperado.length + 8);
});

// ---------- chaves ----------

const chavesOk = [
  // [entrada, tipo informado (ou undefined = detectar), tipo esperado, valor no formato do DICT]
  ['123.456.789-09', 'cpf', 'cpf', '12345678909'],
  ['12345678909', undefined, 'cpf', '12345678909'],
  ['00.038.166/0001-05', 'cnpj', 'cnpj', '00038166000105'], // CNPJ do BCB, exemplo do manual
  ['00038166000105', undefined, 'cnpj', '00038166000105'],
  ['12.ABC.345/01DE-35', 'cnpj', 'cnpj', '12ABC34501DE35'], // CNPJ alfanumérico: exemplo da Receita e do manual
  ['12.abc.345/01de-35', undefined, 'cnpj', '12ABC34501DE35'],
  ['+55 (73) 98889-9345', 'celular', 'celular', '+5573988899345'],
  ['(73) 98889-9345', 'celular', 'celular', '+5573988899345'],
  ['5573988899345', 'celular', 'celular', '+5573988899345'],
  ['073988899345', 'celular', 'celular', '+5573988899345'],
  ['+5561912345678', undefined, 'celular', '+5561912345678'], // exemplo do manual
  ['73988899345', undefined, 'celular', '+5573988899345'], // 11 dígitos, CPF inválido: só pode ser celular
  ['Fulano_da_Silva.Recebedor@Example.com', 'email', 'email', 'fulano_da_silva.recebedor@example.com'],
  ['  pix@bcb.gov.br ', undefined, 'email', 'pix@bcb.gov.br'],
  ['123e4567-e12b-12d1-a456-426655440000', 'aleatoria', 'aleatoria', '123e4567-e12b-12d1-a456-426655440000'],
  ['123E4567-E12B-12D1-A456-426655440000', undefined, 'aleatoria', '123e4567-e12b-12d1-a456-426655440000'],
  ['123e4567e12b12d1a456426655440000', 'aleatoria', 'aleatoria', '123e4567-e12b-12d1-a456-426655440000'],
  ['11912345684', 'cpf', 'cpf', '11912345684'],
  ['11912345684', 'celular', 'celular', '+5511912345684'],
];
for (const [raw, tipo, type, value] of chavesOk) {
  test(`validateKey aceita ${JSON.stringify(raw)} (${tipo ?? 'detectar'})`, () => {
    assert.deepEqual(validateKey(raw, tipo), { type, value });
  });
}

const chavesRuins = [
  ['', undefined, 'chave_vazia'],
  ['   ', 'cpf', 'chave_vazia'],
  ['12345678900', 'cpf', 'chave_cpf'], // formato do manual, mas dígito verificador errado
  ['111.111.111-11', 'cpf', 'chave_cpf'], // passa no cálculo, mas a Receita não emite
  ['1234567890', 'cpf', 'chave_cpf'],
  ['12ABC34501DE36', 'cnpj', 'chave_cnpj'],
  ['00038166000106', 'cnpj', 'chave_cnpj'],
  ['00000000000000', 'cnpj', 'chave_cnpj'],
  ['12ABC34501DEAB', 'cnpj', 'chave_cnpj'], // dígitos verificadores são sempre números
  ['12ÃBC34501DE35', 'cnpj', 'chave_cnpj'],
  ['(73) 3281-1234', 'celular', 'chave_celular'], // fixo não é chave
  ['(20) 98889-9345', 'celular', 'chave_celular_ddd'],
  ['98889-9345', 'celular', 'chave_celular'],
  ['+1 415 555 2671', 'celular', 'chave_celular'],
  ['fulano@gmail', 'email', 'chave_email'],
  ['fulano gmail.com', 'email', 'chave_email'],
  ['fulano@@gmail.com', 'email', 'chave_email'],
  ['ação@gmail.com', 'email', 'chave_email'],
  ['a'.repeat(70) + '@gmail.com', 'email', 'chave_email'], // 80 caracteres > 77
  ['123e4567-e12b-12d1-a456-42665544000', 'aleatoria', 'chave_aleatoria'],
  ['123g4567-e12b-12d1-a456-426655440000', 'aleatoria', 'chave_aleatoria'],
  ['11912345684', undefined, 'chave_ambigua'], // CPF válido e também tem cara de celular
  ['abc', undefined, 'chave_desconhecida'],
  ['12345', undefined, 'chave_desconhecida'],
];
for (const [raw, tipo, error] of chavesRuins) {
  test(`validateKey recusa ${JSON.stringify(raw.length > 40 ? raw.slice(0, 20) + '…' : raw)} (${tipo ?? 'detectar'}) com ${error}`, () => {
    assert.deepEqual(validateKey(raw, tipo), { error });
    assert.ok(ERROS[error], `mensagem para ${error}`);
  });
}

test('formataChave: pontuação só para leitura humana', () => {
  assert.equal(formataChave('cpf', '12345678909'), '123.456.789-09');
  assert.equal(formataChave('cnpj', '12ABC34501DE35'), '12.ABC.345/01DE-35');
  assert.equal(formataChave('cnpj', '00038166000105'), '00.038.166/0001-05');
  assert.equal(formataChave('celular', '+5573988899345'), '+55 (73) 98889-9345');
  assert.equal(formataChave('email', 'pix@bcb.gov.br'), 'pix@bcb.gov.br');
});

test('e-mail com exatamente 77 caracteres passa', () => {
  const e = 'a'.repeat(67) + '@gmail.com';
  assert.equal(e.length, 77);
  assert.deepEqual(validateKey(e, 'email'), { type: 'email', value: e });
});

// ---------- valor ----------

const base = { key: '+5573988899345', name: 'Loja', city: 'Eunapolis' };
const campo = (p, id) => parsePayload(p).campos[id];

for (const [amount, texto] of [[10, '10.00'], [1234.5, '1234.50'], [0.01, '0.01'], [0.1 + 0.2, '0.30'], [9999999999.99, '9999999999.99']]) {
  test(`valor ${amount} vai no campo 54 como "${texto}"`, () => {
    const p = buildPayload({ ...base, amount });
    assert.equal(campo(p, '54'), texto);
    assert.ok(p.includes('54' + String(texto.length).padStart(2, '0') + texto));
  });
}

test('sem valor não há campo 54 (o cliente digita no app)', () => {
  for (const amount of [undefined, null, '']) assert.equal(campo(buildPayload({ ...base, amount }), '54'), undefined);
});

for (const [amount, codigo] of [[0, 'valor_zero'], [-5, 'valor_zero'], [10.005, 'valor_centavos'], [1e10, 'valor_alto'], [NaN, 'valor_invalido'], [Infinity, 'valor_invalido'], ['10', 'valor_invalido']]) {
  test(`valor ${String(amount)} é recusado com ${codigo}`, () => {
    assert.throws(() => buildPayload({ ...base, amount }), { message: codigo });
    assert.ok(ERROS[codigo]);
  });
}

for (const [texto, esperado] of [
  ['10', 10], ['10,5', 10.5], ['10,50', 10.5], ['R$ 1.234,56', 1234.56], ['1.234', 1234], ['1.234.567', 1234567],
  ['10.5', 10.5], ['10.50', 10.5], [' 0,01 ', 0.01], ['', null], ['   ', null],
]) {
  test(`parseValor(${JSON.stringify(texto)}) = ${esperado}`, () => assert.equal(parseValor(texto), esperado));
}
for (const texto of ['abc', '10,5,5', '1,2.3', '-5', '10 reais e 5']) {
  test(`parseValor(${JSON.stringify(texto)}) é NaN`, () => assert.ok(Number.isNaN(parseValor(texto))));
}

// ---------- nome, cidade, acentos e limites ----------

test('acentos saem: o padrão EMV só aceita o conjunto comum de caracteres (ASCII)', () => {
  assert.equal(textoPix('Pão de Açúcar Ótica São João', 99), 'Pao de Acucar Otica Sao Joao');
  assert.equal(textoPix('  Café   do  Zé ☕ ', 99), 'Cafe do Ze');
  assert.equal(textoPix('D’Ávila “Bar” – Ñandú', 99), 'D\'Avila "Bar" - Nandu');
  const p = buildPayload({ ...base, name: 'Açaí da Conceição', city: 'Eunápolis' });
  assert.equal(campo(p, '59'), 'Acai da Conceicao');
  assert.equal(campo(p, '60'), 'Eunapolis');
  assert.match(p, /^[\x20-\x7e]+$/);
});

test('nome passa de 25 e cidade de 15: cortados no limite do padrão', () => {
  const p = buildPayload({ ...base, name: 'Restaurante e Pizzaria Bom Sabor', city: 'Teixeira de Freitas' });
  assert.equal(campo(p, '59'), 'Restaurante e Pizzaria Bo');
  assert.equal(campo(p, '60'), 'Teixeira de Fre');
  assert.equal(textoPix('Santa Cruz Cabrália', 15), 'Santa Cruz Cabr');
  assert.equal(textoPix('Arraial d Ajuda ', 15), 'Arraial d Ajuda');
  assert.equal(textoPix('Porto Seguro  BA', 13), 'Porto Seguro'); // espaço no fim do corte some
});

test('nome ou cidade vazios (ou só emoji) são recusados', () => {
  assert.throws(() => buildPayload({ ...base, name: '  ' }), { message: 'nome_vazio' });
  assert.throws(() => buildPayload({ ...base, name: '🍕🍕' }), { message: 'nome_vazio' });
  assert.throws(() => buildPayload({ ...base, city: '' }), { message: 'cidade_vazia' });
});

test('chave fora do formato do DICT é recusada por buildPayload', () => {
  for (const key of ['', '(73) 98889-9345', '123.456.789-09', '12345678900', 'Fulano@Example.com', 'x'])
    assert.throws(() => buildPayload({ ...base, key }), { message: 'chave_invalida' }, key);
});

// ---------- identificador (txid) ----------

test('txid padrão é *** e vai no 62-05', () => {
  const p = buildPayload(base);
  assert.ok(p.includes('62070503***6304'));
  assert.equal(parsePayload(p).pix.txid, '***');
  assert.equal(parsePayload(buildPayload({ ...base, txid: '***' })).pix.txid, '***');
});

test('txid com letras e números, até 25', () => {
  const p = buildPayload({ ...base, txid: 'Mesa12' });
  assert.ok(p.includes('62100506Mesa12'));
  const t25 = 'A'.repeat(25);
  assert.ok(buildPayload({ ...base, txid: t25 }).includes('6229' + '0525' + t25));
});

for (const txid of ['mesa 12', 'pedido-12', 'ação', 'A'.repeat(26), '***x']) {
  test(`txid ${JSON.stringify(txid)} é recusado`, () => {
    assert.throws(() => buildPayload({ ...base, txid }), { message: 'txid_invalido' });
  });
}

// ---------- descrição (infoAdicional, 26-02) ----------

test('descrição vai no 26-02, sem acento', () => {
  const p = buildPayload({ ...base, description: 'Almoço executivo' });
  const pix = parsePayload(p).pix;
  assert.equal(pix.descricao, 'Almoco executivo');
  assert.equal(pix.chave, '+5573988899345');
});

test('limite da descrição: chave e descrição dividem os 99 caracteres do campo 26', () => {
  // exemplo do manual 2.6.1: chave de 9 caracteres deixa 64 para o texto livre
  assert.equal(maxDescricao('x'.repeat(9)), 64);
  assert.equal(maxDescricao('x'), 72); // teto da tabela do manual
  assert.equal(maxDescricao('123e4567-e12b-12d1-a456-426655440000'), 37);
  assert.equal(maxDescricao('a'.repeat(67) + '@gmail.com'), 0);
  const key = '123e4567-e12b-12d1-a456-426655440000';
  const p = buildPayload({ ...base, key, description: 'd'.repeat(37) });
  assert.equal(p.slice(6, 10), '2699'); // depois de 000201: campo 26 com os 99 caracteres cheios
  assert.throws(() => buildPayload({ ...base, key, description: 'd'.repeat(38) }), { message: 'descricao_longa' });
});

test('descrição vazia ou só espaço não cria o 26-02', () => {
  assert.equal(buildPayload({ ...base, description: '   ' }), buildPayload(base));
});

// ---------- leitura (conferir) ----------

test('parsePayload confere o CRC e lê os exemplos do BCB', () => {
  const e = parsePayload(BCB_ESTATICO);
  assert.equal(e.ok, true);
  assert.equal(e.crc.ok, true);
  assert.deepEqual(e.pix, { chave: '123e4567-e12b-12d1-a456-426655440000', descricao: undefined, url: undefined,
    valor: undefined, nome: 'Fulano de Tal', cidade: 'BRASILIA', txid: '***' });

  const d = parsePayload(BCB_DINAMICO);
  assert.equal(d.ok, true);
  assert.equal(d.pix.url, 'pix.example.com/8b3da2f39a4140d1a91abd93113bd441');
  assert.equal(d.campos['01'], '12');

  const b = parsePayload(BRCODE);
  assert.equal(b.ok, true);
  assert.equal(b.pix.chave, '123e4567-e12b-12d1-a456-426655440000'); // GUI em maiúsculas também vale
  assert.equal(b.pix.valor, '123.45');
  assert.equal(b.pix.txid, 'RP12345678-2019');

  assert.equal(parsePayload(BCB_COMPOSTO_VALOR).ok, true);
});

test('parsePayload aceita espaço e quebra de linha nas pontas (colagem)', () => {
  assert.equal(parsePayload('  ' + BCB_ESTATICO + '\n').ok, true);
});

test('parsePayload acusa CRC errado', () => {
  const r = parsePayload(BCB_ESTATICO.replace('Fulano', 'Fulana'));
  assert.equal(r.ok, false);
  assert.equal(r.crc.ok, false);
  assert.equal(r.crc.calculado.length, 4);
  assert.equal(r.erro, 'crc');
});

for (const [nome, p, erro] of [
  ['vazio', '', 'vazio'],
  ['lixo', 'ola mundo', 'formato'],
  ['tamanho maior que o resto', '000201269900', 'formato'],
  ['sem CRC no fim', BCB_ESTATICO.slice(0, -8), 'sem_crc'],
  ['não começa com 000201', '0002025802BR6304' + crc16('0002025802BR6304'), 'formato'],
  ['sem Pix (outro arranjo)', '000201' + '27300012BR.COM.OUTRO0110012345678952040000' + '6304', 'sem_pix'],
  ['faltam campos obrigatórios', '000201' + '26180014br.gov.bcb.pix' + '6304', 'incompleto'],
  ['moeda que não é real', BCB_ESTATICO.slice(0, -8).replace('5303986', '5303840') + '6304', 'incompleto'],
]) {
  test(`parsePayload recusa: ${nome}`, () => {
    const s = p.endsWith('6304') ? p + crc16(p) : p;
    const r = parsePayload(s);
    assert.equal(r.ok, false);
    assert.equal(r.erro, erro);
    assert.ok(ERROS['conferir_' + erro], erro);
  });
}

test('ida e volta: o que buildPayload gera, parsePayload lê igual e com CRC certo', () => {
  const casos = [
    { key: '12345678909', name: 'Maria', city: 'Itabela' },
    { key: '12ABC34501DE35', name: 'Pousada Mar Azul', city: 'Trancoso', amount: 350, txid: 'Reserva2026' },
    { key: '+5573988899345', name: 'Ótica Visão', city: 'Porto Seguro', amount: 1234.5, description: 'Óculos de sol' },
    { key: 'contato@padaria.com.br', name: 'Padaria Pão Quente do Zé Ltda', city: 'Santa Cruz Cabrália', amount: 0.5, txid: 'a1', description: 'Pão' },
    { key: '123e4567-e12b-12d1-a456-426655440000', name: 'X', city: 'Y' },
  ];
  for (const c of casos) {
    const p = buildPayload(c);
    const r = parsePayload(p);
    assert.equal(r.ok, true, p);
    assert.equal(r.crc.calculado, p.slice(-4));
    assert.equal(r.pix.chave, c.key);
    assert.equal(r.pix.nome, textoPix(c.name, 25));
    assert.equal(r.pix.cidade, textoPix(c.city, 15));
    assert.equal(r.pix.valor, c.amount === undefined ? undefined : c.amount.toFixed(2));
    assert.equal(r.pix.txid, c.txid ?? '***');
    assert.equal(r.pix.descricao, c.description === undefined ? undefined : textoPix(c.description, 99));
    assert.deepEqual(r.ordem, ['00', '26', '52', '53', ...(c.amount ? ['54'] : []), '58', '59', '60', '62', '63']);
    assert.equal(r.campos['52'], '0000');
    assert.equal(r.campos['53'], '986');
    assert.equal(r.campos['58'], 'BR');
  }
});
