// node --test test/ferramentas-calculadora.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PRICES, FONTES, TIPOS, RECURSOS, ROTAS,
  normalizar, calcular, erroPaginas, linkWhatsApp, formatarFaixa as fmt,
} from '../quanto-custa-um-site/calculadora.mjs';

const tipos = Object.keys(TIPOS);
const recursos = Object.keys(RECURSOS);
const rotas = Object.keys(ROTAS);
const PAGINAS = [1, 5, 6, 10, 20];

// 3 tipos x 5 tamanhos x 128 combinações de recursos.
function* todas() {
  for (const tipo of tipos)
    for (const paginas of PAGINAS)
      for (let m = 0; m < 1 << recursos.length; m++)
        yield { tipo, paginas, recursos: recursos.filter((_, i) => m & (1 << i)) };
}

const CAMPOS = ['unica', 'mensal', 'dominio', 'anual', 'primeiroAno', 'prazo'];
const perto = (a, b) => Math.abs(a - b) < 0.005;
const ORDEM_STATUS = { cabe: 0, consultar: 1, conversa: 2 };

test('toda combinação devolve faixas ordenadas (min <= max)', () => {
  let n = 0;
  for (const e of todas()) {
    const r = calcular(e);
    for (const id of rotas) {
      for (const c of CAMPOS) {
        const f = r.rotas[id][c];
        assert.ok(Number.isFinite(f.min) && Number.isFinite(f.max), `${id}.${c} finito em ${JSON.stringify(e)}`);
        assert.ok(f.min >= 0, `${id}.${c} >= 0`);
        assert.ok(f.min <= f.max, `${id}.${c}: ${f.min} > ${f.max} em ${JSON.stringify(e)}`);
      }
    }
    n++;
  }
  assert.equal(n, 3 * PAGINAS.length * 128);
});

test('totais fecham: anual = 12 x mensal + domínio; 1º ano = único + anual', () => {
  for (const e of todas()) {
    for (const id of rotas) {
      const x = calcular(e).rotas[id];
      for (const k of ['min', 'max']) {
        assert.ok(perto(x.anual[k], x.mensal[k] * 12 + x.dominio[k]), `${id} anual.${k}`);
        assert.ok(perto(x.primeiroAno[k], x.unica[k] + x.anual[k]), `${id} primeiroAno.${k}`);
      }
      assert.equal(x.primeiroAno.aberto, x.unica.aberto);
    }
  }
});

test('cada recurso só sobe (ou mantém) custo, mensalidade e prazo', () => {
  for (const e of todas()) {
    const antes = calcular(e);
    for (const novo of recursos.filter((r) => !e.recursos.includes(r))) {
      const depois = calcular({ ...e, recursos: [...e.recursos, novo] });
      for (const id of rotas) {
        for (const c of ['unica', 'mensal', 'prazo', 'primeiroAno']) {
          for (const k of ['min', 'max']) {
            assert.ok(depois.rotas[id][c][k] >= antes.rotas[id][c][k],
              `${novo} baixou ${id}.${c}.${k} em ${JSON.stringify(e)}`);
          }
        }
      }
      const [a, d] = [antes.oferta, depois.oferta];
      assert.ok(ORDEM_STATUS[d.status] >= ORDEM_STATUS[a.status], `${novo} melhorou o encaixe da oferta`);
      if (a.preco !== null && d.preco !== null) assert.ok(d.preco >= a.preco);
    }
  }
});

test('recursos que pesam de fato sobem o preço', () => {
  const base = { tipo: 'institucional', paginas: 5, recursos: [] };
  const sobe = (rec, rota, campo = 'unica') =>
    calcular({ ...base, recursos: [rec] }).rotas[rota][campo].min > calcular(base).rotas[rota][campo].min;
  assert.ok(sobe('pagamentos', 'freelancer'));
  assert.ok(sobe('pagamentos', 'agencia'));
  assert.ok(sobe('area_cliente', 'agencia'));
  assert.ok(sobe('area_cliente', 'freelancer', 'prazo'));
  assert.ok(sobe('dois_idiomas', 'freelancer'));
  assert.ok(calcular({ ...base, recursos: ['catalogo'] }).rotas.diy.mensal.max > calcular(base).rotas.diy.mensal.max);
  assert.equal(calcular({ ...base, recursos: ['blog'] }).oferta.preco, 997 + 497);
});

test('todo número usado tem fonte e data em que foi visto', () => {
  const hoje = new Date().toISOString().slice(0, 10);
  for (const [id, p] of Object.entries(PRICES)) {
    assert.ok(FONTES[p.fonte], `${id}: fonte ${p.fonte} não existe`);
    assert.match(p.seenOn, /^\d{4}-\d{2}-\d{2}$/, `${id}: seenOn`);
    assert.ok(p.seenOn <= hoje, `${id}: seenOn no futuro`);
    assert.ok(typeof p.o_que === 'string' && p.o_que.length > 5, `${id}: o_que`);
    assert.ok(Number.isFinite(p.min) && Number.isFinite(p.max) && p.min <= p.max, `${id}: faixa`);
  }
  for (const f of Object.values(FONTES)) assert.match(f.url, /^https:\/\//);

  // Cada faixa mostrada vem de números da tabela, e cita as entradas de onde veio.
  const valores = new Set(Object.values(PRICES).flatMap((p) => [p.min, p.max]));
  for (const e of todas()) {
    const r = calcular(e);
    for (const id of rotas) {
      for (const c of ['unica', 'mensal', 'dominio', 'prazo']) {
        const f = r.rotas[id][c];
        assert.ok(f.refs.length > 0, `${id}.${c} sem fonte`);
        for (const ref of f.refs) assert.ok(PRICES[ref], `ref ${ref} inexistente`);
        assert.ok(valores.has(f.min) && valores.has(f.max), `${id}.${c} tem número fora da tabela`);
      }
    }
    for (const ref of r.oferta.refs) assert.ok(PRICES[ref]);
  }
});

test('a página não mostra preço sem fonte e lista todas as fontes', () => {
  const html = readFileSync(new URL('../quanto-custa-um-site/index.html', import.meta.url), 'utf8');
  const valores = new Set(Object.values(PRICES).flatMap((p) => [p.min, p.max]));
  const achados = [...html.matchAll(/R\$(?:&nbsp;|\s)?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g)].map((m) =>
    Number(m[1].replace(/\./g, '').replace(',', '.')));
  assert.ok(achados.length > 5);
  for (const v of achados) assert.ok(valores.has(v), `R$ ${v} na página não está em PRICES`);
  let pos = -1;
  for (const [id, f] of Object.entries(FONTES)) {
    assert.ok(html.includes(f.url), `fonte ${id} não listada`);
    const i = html.indexOf(`id="fonte-${id}"`);
    assert.ok(i > pos, `fonte ${id} fora de ordem na lista`);
    pos = i;
  }
});

test('a oferta do Thallis segue a página inicial e nunca fica de fora', () => {
  const of = (e) => calcular(e).oferta;
  for (const e of todas()) assert.ok(['cabe', 'consultar', 'conversa'].includes(of(e).status));

  // Loja, login, sistema e 10+ páginas: + R$ 997, preço fechado.
  for (const e of [
    { tipo: 'loja', paginas: 5, recursos: [] },
    { tipo: 'institucional', paginas: 5, recursos: ['pagamentos'] },
    { tipo: 'landing', paginas: 1, recursos: ['area_cliente'] },
    { tipo: 'institucional', paginas: 12, recursos: [] },
    { tipo: 'institucional', paginas: 20, recursos: [] },
  ]) {
    assert.equal(of(e).status, 'cabe', JSON.stringify(e));
    assert.equal(of(e).preco, 997 + 997, JSON.stringify(e));
  }
  // Mais de um item dessa linha: não soma além do que a home diz; "a partir de", fecha no WhatsApp.
  const dois = of({ tipo: 'loja', paginas: 20, recursos: [] });
  assert.equal(dois.status, 'consultar');
  assert.equal(dois.preco, 997 + 997);
  assert.equal(dois.multiplos, true);
  // Login + cobrança online = SaaS: preço fechado depois de uma conversa.
  const saas = of({ tipo: 'institucional', paginas: 5, recursos: ['area_cliente', 'pagamentos'] });
  assert.equal(saas.status, 'conversa');
  assert.equal(saas.preco, null);
  assert.equal(of({ tipo: 'loja', paginas: 5, recursos: ['area_cliente'] }).status, 'conversa');

  assert.equal(of({ tipo: 'institucional', paginas: 7, recursos: [] }).status, 'consultar');
  assert.equal(of({ tipo: 'institucional', paginas: 7, recursos: [] }).preco, 997);
  assert.equal(of({ tipo: 'institucional', paginas: 5, recursos: ['dois_idiomas'] }).status, 'consultar');

  const simples = of({ tipo: 'landing', paginas: 1, recursos: ['whatsapp'] });
  assert.equal(simples.status, 'cabe');
  assert.equal(simples.preco, 997);
  assert.equal(of({ tipo: 'loja', paginas: 5, recursos: ['blog'] }).preco, 997 + 997 + 497);

  // Plataforma pronta com área de cliente leva aviso.
  assert.ok(calcular({ tipo: 'institucional', paginas: 5, recursos: ['area_cliente'] }).rotas.diy.avisos.length > 0);
});

test('fontes que discordam ficam marcadas', () => {
  const r = calcular({ tipo: 'institucional', paginas: 5, recursos: [] });
  assert.equal(r.rotas.freelancer.unica.divergem, true);
  assert.equal(r.rotas.diy.dominio.divergem, false);
});

test('entrada não confiável é normalizada', () => {
  assert.deepEqual(normalizar({ tipo: '<script>', paginas: 'abc', recursos: ['x', 'blog', 'blog'], quem: 'hacker' }),
    { tipo: 'institucional', paginas: 1, recursos: ['blog'], quem: null });
  assert.equal(normalizar({ tipo: 'landing', paginas: 9 }).paginas, 1);
  assert.equal(normalizar({ tipo: 'institucional', paginas: 9999 }).paginas, 100);
  assert.equal(erroPaginas('5'), null);
  assert.ok(erroPaginas(''));
  assert.ok(erroPaginas('0'));
  assert.ok(erroPaginas('2.5'));
  assert.ok(erroPaginas('101'));
});

test('link do WhatsApp segue o padrão do site com a tag [calculadora]', () => {
  const url = linkWhatsApp({ tipo: 'institucional', paginas: 5, recursos: ['blog'] });
  assert.ok(url.startsWith('https://wa.me/5573988899345?text='));
  assert.ok(url.endsWith('%20%5Bcalculadora%5D'));
  const texto = decodeURIComponent(url.split('text=')[1]);
  assert.match(texto, /^Fiz a conta na calculadora e quero um orçamento/);
  assert.match(texto, /blog/i);
  assert.ok(!/[<>"]/.test(texto));
});

test('formatação das faixas', () => {
  const formatarFaixa = (...a) => fmt(...a).replace(/\xa0/g, ' ');
  assert.equal(formatarFaixa({ min: 1500, max: 8000 }), 'R$ 1.500 a R$ 8.000');
  assert.equal(formatarFaixa({ min: 40, max: 40 }), 'R$ 40');
  assert.equal(formatarFaixa({ min: 10.99, max: 38.99 }), 'R$ 10,99 a R$ 38,99');
  assert.equal(formatarFaixa({ min: 4000, max: 4000, aberto: true }), 'a partir de R$ 4.000');
  assert.equal(formatarFaixa({ min: 10000, max: 25000, aberto: true }), 'R$ 10.000 a R$ 25.000 ou mais');
  assert.equal(formatarFaixa({ min: 0, max: 0 }), 'R$ 0');
  assert.equal(formatarFaixa({ min: 1, max: 2 }, 'semanas'), '1 a 2 semanas');
  assert.equal(formatarFaixa({ min: 13, max: 13, aberto: true }, 'semanas'), '13 semanas ou mais');
  assert.equal(fmt({ min: 500, max: 500 }), 'R$\xa0500');
});
