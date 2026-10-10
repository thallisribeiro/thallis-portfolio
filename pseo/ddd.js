// Família DDD: /ddd/ (os 67 códigos por estado, com busca por cidade) e /ddd/<nn>/ (de onde é,
// todas as cidades, como ligar de outro DDD, DDDs vizinhos), cada uma com o botão que abre o
// gerador de link do WhatsApp já com o DDD.
//
// Dados: pseo/dados/ddd.json, montado por pseo/dados/build-ddd.mjs a partir dos dados abertos da
// Anatel (municípios de cada código e mudanças) e da estimativa de população do IBGE (ordem das
// cidades). Texto comum curto de propósito: quem carrega cada página são os dados dela.

const { pagina, trilha, faq, oferta, esc } = require('./_layout');

const FERRAMENTA = '/gerador-de-link-whatsapp/';
const CONSULTADO = '10/10/2026';

// Novas áreas locais da telefonia fixa (Resolução Anatel nº 768/2024; cronograma do Acórdão nº 202,
// de 14/08/2025): a partir destas datas, ligação entre fixos com o mesmo DDD é local. Fonte:
// Anatel, "Perguntas frequentes sobre áreas tarifárias" (item 6) e a página "Áreas locais da
// telefonia fixa", que diz que a implantação "seguiu o cronograma" (modificada em 06/07/2026).
const AREA_LOCAL = {
  '2026-01-11': '71 73 74 75 77 79',
  '2026-02-01': '91 92 93 94 95 96 97 98 99',
  '2026-02-22': '81 82 83 84 85 86 87 88 89',
  '2026-03-15': '51 53 54 55',
  '2026-03-29': '41 42 43 44 45 46 47 48 49',
  '2026-04-19': '31 32 33 34 35 37 38',
  '2026-05-10': '21 22 24 27 28',
  '2026-05-31': '61 62 63 64 65 66 67 68 69',
  '2026-06-21': '11 12 13 14 15 16 17 18 19',
};
const AREA_LOCAL_DESDE = Object.fromEntries(Object.entries(AREA_LOCAL).flatMap(([data, cs]) => cs.split(' ').map((c) => [c, data])));

const LINK = {
  faq: 'https://sistemas.anatel.gov.br/anexar-api/publico/anexos/download/7c51a53e26edf77426cb85e42f1080de',
  areasLocais: 'https://www.gov.br/anatel/pt-br/regulado/competicao/tarifas-e-precos/areas-locais-da-telefonia-fixa',
  csp: 'https://www.gov.br/anatel/pt-br/regulado/numeracao/codigos-nacionais/codigo-de-selecao-de-prestadora-csp',
  cspConsulta: 'https://sistemas.anatel.gov.br/stel/Consultas/STFC/PrestadorasCSP/tela.asp?SISQSmodulo=17092',
  numeracao: 'https://www.gov.br/anatel/pt-br/regulado/numeracao/plano-de-numeracao-brasileiro',
  whatsapp: 'https://faq.whatsapp.com/5913398998672934',
};

const ARTIGO = { BA: 'da', PB: 'da', AC: 'do', AP: 'do', AM: 'do', CE: 'do', DF: 'do', ES: 'do', MA: 'do', PA: 'do', PR: 'do', PI: 'do', RJ: 'do', RN: 'do', RS: 'do', TO: 'do' };
// Região pelo 1º dígito do código IBGE do município (1 Norte ... 5 Centro-Oeste).
const REGIAO = { 1: 'Norte', 2: 'Nordeste', 3: 'Sudeste', 4: 'Sul', 5: 'Centro-Oeste' };

const br = (iso) => iso.split('-').reverse().join('/');
const milhar = (n) => n.toLocaleString('pt-BR');
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const lista = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);
const doEstado = (uf, estados) => `${ARTIGO[uf] || 'de'} ${estados[uf]}`;
const regiao = (x) => REGIAO[x.municipios[0].ibge[0]];

// Filtro de lista sem framework: a lista inteira já está no HTML; o script só esconde o que não bate.
const FILTRO = `<script>
(function () {
  var caixa = document.getElementById('filtro');
  var campo = document.getElementById('filtro-campo');
  var aviso = document.getElementById('filtro-aviso');
  var itens = Array.prototype.slice.call(document.querySelectorAll(caixa.dataset.alvo + ' [data-busca]'));
  var norm = function (s) { return s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().trim(); };
  caixa.hidden = false;
  campo.addEventListener('input', function () {
    var q = norm(campo.value), n = 0;
    itens.forEach(function (el) { var ok = el.dataset.busca.indexOf(q) !== -1; el.hidden = !ok; if (ok) n++; });
    aviso.textContent = !q ? '' : n ? (n === 1 ? '1 resultado' : n + ' resultados') : caixa.dataset.vazio;
  });
})();
</script>`;

function campoFiltro({ alvo, rotulo, dica, vazio }) {
  return `<div class="ddd-campo" id="filtro" data-alvo="${esc(alvo)}" data-vazio="${esc(vazio)}" hidden>
  <label for="filtro-campo">${esc(rotulo)}</label>
  <input id="filtro-campo" type="search" autocomplete="off" spellcheck="false" aria-describedby="filtro-dica filtro-aviso">
  <p class="pseo-miudo" id="filtro-dica">${esc(dica)}</p>
  <p class="ddd-aviso" id="filtro-aviso" role="status"></p>
</div>`;
}

function fontes(d, extra = '') {
  const a = d.fonte.anatel, i = d.fonte.ibge;
  return `<section class="pseo-fontes" aria-labelledby="fontes-titulo">
<h2 id="fontes-titulo">Fontes</h2>
<ul>
  <li>DDD de cada município e mudanças: <a href="${esc(a.painel)}" target="_blank" rel="noopener">Anatel, painel de Códigos Nacionais</a>, <a href="${esc(a.url)}">dados abertos do Plano Geral de Códigos Nacionais</a> (arquivo ${esc(a.arquivo)} de ${esc(br(a.dataArquivo))}), baixado em ${esc(br(a.baixadoEm))}.</li>
  ${i ? `<li>População e ordem das cidades: <a href="${esc(i.url)}" target="_blank" rel="noopener">IBGE, Estimativas da População ${esc(i.ano)}, tabela 6579</a>, consultada em ${esc(br(i.baixadoEm))}.</li>` : ''}
  <li>Como discar, código da operadora opcional, ligação local dentro do mesmo DDD e o cronograma de 2026: <a href="${LINK.faq}" target="_blank" rel="noopener">Anatel, Perguntas frequentes sobre áreas tarifárias</a> e <a href="${LINK.areasLocais}" target="_blank" rel="noopener">Anatel, Áreas locais da telefonia fixa</a>, consultadas em ${CONSULTADO}.</li>
  <li>Código de operadora: <a href="${LINK.csp}" target="_blank" rel="noopener">Anatel, Código de Seleção de Prestadora (CSP)</a>. Celular com 9 dígitos e fixo com 8: <a href="${LINK.numeracao}" target="_blank" rel="noopener">Anatel, Plano de Numeração Brasileiro</a>. Consultadas em ${CONSULTADO}.</li>
  ${extra}
</ul>
</section>`;
}

// ---------- página de um DDD ----------

function relacionados(ddd, d) {
  const x = d.ddds[ddd];
  const todos = Object.keys(d.ddds).filter((c) => c !== ddd);
  const mesmoEstado = todos.filter((c) => d.ddds[c].ufs.some((u) => x.ufs.includes(u)));
  if (mesmoEstado.length >= 4) return { codigos: mesmoEstado, regiao: false };
  // Poucos DDDs no estado: completa até 6 com a mesma região, primeiro os de mesma dezena (vizinhos no mapa).
  const perto = todos
    .filter((c) => !mesmoEstado.includes(c) && regiao(d.ddds[c]) === regiao(x))
    .sort((a, b) => (a[0] !== ddd[0]) - (b[0] !== ddd[0]) || Math.abs(a - ddd) - Math.abs(b - ddd));
  return { codigos: [...mesmoEstado, ...perto].slice(0, 6), regiao: true };
}

function mudou(ddd, d) {
  const x = d.ddds[ddd], a = d.fonte.anatel;
  const grupos = new Map();
  for (const m of d.mudancas.filter((m) => m.para === ddd || m.de === ddd)) {
    const k = [m.de, m.para, m.desde, m.ato].join('|');
    grupos.set(k, [...(grupos.get(k) || []), m]);
  }
  if (!grupos.size) {
    return `Não na lista de cidades: nos dados abertos da Anatel, os ${x.municipios.length} municípios têm o DDD ${ddd} desde ${br(a.inicioPlano)} (${a.atoInicial}), sem troca registrada desde então. A mudança de 2026 foi outra: a ligação entre telefones fixos do mesmo DDD passou a ser local, e o código continuou o mesmo.`;
  }
  const frases = [...grupos.values()].map((ms) => {
    const m = ms[0], nomes = lista(ms.map((y) => y.nome)), plural = ms.length > 1;
    if (m.de === ddd) return `${nomes} ${plural ? 'deixaram' : 'deixou'} o DDD ${ddd} e ${plural ? 'passaram' : 'passou'} para o ${m.para} em ${br(m.desde)} (${m.ato}).`;
    if (m.de) return `${nomes} ${plural ? 'passaram' : 'passou'} do DDD ${m.de} para o ${ddd} em ${br(m.desde)} (${m.ato}).`;
    return `${nomes} ${plural ? 'aparecem' : 'aparece'} com o DDD ${ddd} desde ${br(m.desde)} (${m.ato}).`;
  });
  const entrou = [...grupos.values()].some((ms) => ms[0].para === ddd);
  return `Sim, na lista de cidades. Pelos dados abertos da Anatel: ${frases.join(' ')} ${entrou ? 'Os demais municípios' : `Os ${x.municipios.length} municípios da lista atual`} têm o DDD ${ddd} desde ${br(a.inicioPlano)}.`;
}

function paginaDdd(ddd, d) {
  const x = d.ddds[ddd], { estados, fonte } = d, ibge = fonte.ibge;
  const n = x.municipios.length, multi = x.ufs.length > 1;
  const top = x.municipios.slice(0, 5).map((m) => m.nome);
  const estadoTxt = lista(x.ufs.map((u) => doEstado(u, estados)));
  const porUf = multi ? ` (${x.ufs.map((u) => `${u}: ${x.municipios.filter((m) => m.uf === u).length}`).join(', ')})` : '';
  const desde = br(AREA_LOCAL_DESDE[ddd]);
  const maior = x.municipios[0];
  const loc = `/ddd/${ddd}/`;
  const t = trilha([{ nome: 'Início', loc: '/' }, { nome: 'DDD do Brasil', loc: '/ddd/' }, { nome: `DDD ${ddd}`, loc }]);
  const rel = relacionados(ddd, d);

  const perguntas = [
    {
      p: `Quais cidades usam o DDD ${ddd}?`,
      r: `São ${n} municípios ${estadoTxt}${porUf}.${ibge ? ` Os mais populosos, pela estimativa do IBGE para ${ibge.ano}, são ${lista(top)}.` : ''} A lista completa está nesta página e dá para filtrar pelo nome da cidade.`,
    },
    {
      p: `O DDD ${ddd} é de celular ou de telefone fixo?`,
      r: `Dos dois. O DDD identifica a área, não o tipo de linha: dentro da mesma área todos os números têm o mesmo código, celular ou fixo. Depois do ${ddd}, celular tem 9 dígitos e fixo tem 8.`,
    },
    {
      p: `Ligar de um fixo para outro dentro do DDD ${ddd} ainda é interurbano?`,
      r: `Não. Desde ${desde}, pelo cronograma da Anatel para as novas áreas locais da telefonia fixa, as cidades com DDD ${ddd} formam uma área local só. A ligação entre elas é cobrada como local e basta discar o número, sem 0, operadora e DDD.`,
    },
    { p: `O DDD ${ddd} mudou alguma vez?`, r: mudou(ddd, d) },
  ];
  const f = faq(perguntas);

  const cidades = x.municipios.map((m) => {
    const busca = norm(m.nome + (m.nomeIbge ? ` ${m.nomeIbge}` : ''));
    const extra = [m.nomeIbge && `ou ${m.nomeIbge}`, Number.isInteger(m.pop) && `${milhar(m.pop)} hab.`].filter(Boolean).join(' · ');
    return `<li data-busca="${esc(busca)}">${esc(m.nome)}${multi ? ` (${esc(m.uf)})` : ''}${extra ? ` <small>${esc(extra)}</small>` : ''}</li>`;
  }).join('\n');

  const main = `<div class="ddd">
${t.html}
<h1>DDD ${ddd}: de onde é e quais cidades usam</h1>
<p class="pseo-lead">O DDD ${ddd} é ${esc(estadoTxt)}. ${n} municípios usam esse código${ibge ? `; os mais populosos, pela estimativa do IBGE para ${esc(ibge.ano)}, são ${esc(lista(top))}` : `, entre eles ${esc(lista(top))}`}.</p>

<dl class="pseo-caixa ddd-fatos">
  <dt>${multi ? 'Estados' : 'Estado'}</dt><dd>${esc(lista(x.ufs.map((u) => `${estados[u]} (${u})`)))}</dd>
  <dt>Municípios</dt><dd>${n}${esc(porUf)}</dd>
  ${ibge && Number.isInteger(maior.pop) ? `<dt>Maior cidade</dt><dd>${esc(maior.nome)}, ${milhar(maior.pop)} habitantes (IBGE ${esc(ibge.ano)})</dd>` : ''}
  <dt>Vale para</dt><dd>celular e telefone fixo</dd>
  <dt>Fixo para fixo no DDD ${ddd}</dt><dd>ligação local desde ${desde}</dd>
</dl>

<div class="pseo-acao">
  <a class="btn btn-primary" href="${FERRAMENTA}?ddd=${ddd}">Criar link do WhatsApp com DDD ${ddd}</a>
</div>
<p class="pseo-miudo">Abre o <a href="${FERRAMENTA}">gerador de link do WhatsApp</a> grátis com Brasil e o DDD ${ddd} já preenchidos: falta só o número.</p>

<section aria-labelledby="cidades-titulo">
<h2 id="cidades-titulo">Cidades com DDD ${ddd}</h2>
<p>${ibge ? `Da maior para a menor, pela população estimada pelo IBGE para ${esc(ibge.ano)}.` : 'Em ordem alfabética.'} Lista oficial da Anatel, com os ${n} municípios.</p>
${campoFiltro({ alvo: '#cidades', rotulo: `Procurar cidade no DDD ${ddd}`, dica: 'Pode digitar sem acento.', vazio: `Nenhuma cidade com esse nome no DDD ${ddd}. Procure em todos os DDDs no índice abaixo.` })}
<ul class="ddd-cidades" id="cidades">
${cidades}
</ul>
${FILTRO}
</section>

<section aria-labelledby="ligar-titulo">
<h2 id="ligar-titulo">Como ligar para um número com DDD ${ddd}</h2>
<h3>De um telefone com outro DDD</h3>
<p class="ddd-formula"><span>0</span> + <span>operadora</span> + <span>${ddd}</span> + <span>número</span></p>
<p>O 0 avisa que a ligação é de longa distância. A operadora entra com o Código de Seleção de Prestadora (CSP), de dois dígitos, que escolhe a empresa que vai completar a chamada; as que atendem a sua cidade aparecem na <a href="${LINK.cspConsulta}" target="_blank" rel="noopener">consulta de prestadoras da Anatel</a>. Depois vêm o ${ddd} e o número: 9 dígitos se for celular, 8 se for fixo. Pela Anatel, a ligação também pode ser feita sem o código da operadora.</p>
<h3>De um telefone com DDD ${ddd}</h3>
<p>Disque só o número, para fixo ou celular. Desde ${desde}, todas as cidades com DDD ${ddd} formam uma única área local da telefonia fixa, então ligação de fixo para fixo entre elas também é local.</p>
<h3>No WhatsApp</h3>
<p>O número vai no formato internacional: +55, o ${ddd} e o número, sem o 0 e sem código de operadora. O <a href="${FERRAMENTA}?ddd=${ddd}">gerador de link</a> monta isso sozinho e ainda entrega o QR code.</p>
</section>

<section aria-labelledby="vizinhos-titulo">
<h2 id="vizinhos-titulo">${rel.regiao ? `Outros DDDs do ${regiao(x)}` : `Outros DDDs ${esc(estadoTxt)}`}</h2>
<ul class="pseo-lista tres">
${rel.codigos.map((c) => `<li><a href="/ddd/${c}/">DDD ${c} · ${esc(d.ddds[c].municipios[0].nome)} (${esc(d.ddds[c].municipios[0].uf)})</a></li>`).join('\n')}
</ul>
<p><a href="/ddd/">Todos os 67 DDDs do Brasil, por estado</a> · <a href="/ferramentas/">Outras ferramentas grátis</a></p>
</section>

${f.html}

${oferta({
    titulo: `Tem um negócio em ${top[0]} ou outra cidade do DDD ${ddd}?`,
    texto: `Um site faz quem procura no Google pelo seu serviço em ${lista(top.slice(0, 3))} achar você, ver preços, fotos e horário, e chamar no WhatsApp com DDD ${ddd} num toque.`,
    mensagem: 'Quero um site para o meu negócio',
    tag: 'ddd',
  })}

${fontes(d, `<li>Formato internacional no WhatsApp: <a href="${LINK.whatsapp}" target="_blank" rel="noopener">Central de Ajuda do WhatsApp</a>, consultada em ${CONSULTADO}.</li>`)}
</div>`;

  const title = `DDD ${ddd} (${x.ufs.join('/')}): de onde é e quais cidades usam`;
  let description = `DDD ${ddd} é ${estadoTxt}: veja os ${n} municípios que usam o código, a começar por ${lista(top.slice(0, 2))}, e como ligar de outro DDD.`;
  if (description.length > 155) description = `DDD ${ddd} é ${estadoTxt}: veja os ${n} municípios que usam o código e como ligar para ele de outro DDD.`;

  return {
    rel: `ddd/${ddd}/index.html`,
    loc,
    lastmod: fonte.anatel.baixadoEm,
    html: pagina({ loc, title, description, main, pageEv: 'pseo_ddd_viewed', css: ['/pseo/ddd.css'], jsonLd: [t.ld, f.ld] }),
  };
}


// ---------- hub ----------

function paginaHub(d) {
  const { estados, fonte, ddds } = d, ibge = fonte.ibge;
  const linhas = [];
  for (const [ddd, x] of Object.entries(ddds)) {
    for (const uf of x.ufs) {
      const ms = x.municipios.filter((m) => m.uf === uf);
      linhas.push({ ddd, uf, ms });
    }
  }
  linhas.sort((a, b) => estados[a.uf].localeCompare(estados[b.uf], 'pt-BR') || a.ddd - b.ddd);
  const tabela = linhas.map(({ ddd, uf, ms }) => {
    const busca = norm([ddd, uf, estados[uf], ...ms.map((m) => m.nome + (m.nomeIbge ? ` ${m.nomeIbge}` : ''))].join('|'));
    return `<tr data-busca="${esc(busca)}"><td data-rotulo="Estado">${esc(estados[uf])} (${esc(uf)})</td><td data-rotulo="DDD"><a href="/ddd/${ddd}/">DDD ${ddd}</a></td><td data-rotulo="${ibge ? 'Maiores cidades' : 'Algumas cidades'}">${esc(lista(ms.slice(0, 3).map((m) => m.nome)))}</td><td data-rotulo="Municípios">${ms.length}</td></tr>`;
  }).join('\n');

  const total = Object.values(ddds).reduce((s, x) => s + x.municipios.length, 0);
  const porTamanho = Object.entries(ddds).sort((a, b) => b[1].municipios.length - a[1].municipios.length);
  const [maisDdd, maisX] = porTamanho[0], [menosDdd, menosX] = porTamanho[porTamanho.length - 1];
  const divisa = Object.entries(ddds).filter(([, x]) => x.ufs.length > 1);
  const cronograma = Object.entries(AREA_LOCAL).map(([data, cs]) => {
    const ufs = [...new Set(cs.split(' ').flatMap((c) => ddds[c].ufs))].sort();
    return `<tr><td data-rotulo="Desde">${br(data)}</td><td data-rotulo="DDDs">${cs.split(' ').map((c) => `<a href="/ddd/${c}/">${c}</a>`).join(', ')}</td><td data-rotulo="Estados">${esc(ufs.join(', '))}</td></tr>`;
  }).join('\n');

  const perguntas = [
    { p: 'Quantos DDDs existem no Brasil?', r: `São 67. A Anatel organiza o país em 67 áreas de numeração, cada uma com um código nacional, o DDD. Juntos, eles cobrem os ${milhar(total)} municípios da lista oficial.` },
    { p: 'Qual DDD tem mais cidades?', r: `O DDD ${maisDdd}, ${doEstado(maisX.ufs[0], estados)}, com ${maisX.municipios.length} municípios. O que tem menos é o ${menosDdd}, ${lista(menosX.ufs.map((u) => doEstado(u, estados)))}, com ${menosX.municipios.length}.` },
    { p: 'Como descobrir o DDD de uma cidade?', r: 'Digite o nome da cidade na busca acima, com ou sem acento: a tabela mostra a linha do DDD dela. Na página de cada DDD está a lista completa de municípios. A fonte oficial é o painel de Códigos Nacionais da Anatel.' },
    { p: 'O DDD vale para celular e para telefone fixo?', r: 'Vale para os dois. Dentro da mesma área, todos os números têm o mesmo DDD. O que muda é o tamanho do número: depois do DDD, celular tem 9 dígitos e fixo tem 8.' },
  ];
  const f = faq(perguntas);
  const t = trilha([{ nome: 'Início', loc: '/' }, { nome: 'DDD do Brasil', loc: '/ddd/' }]);

  const main = `<div class="ddd">
${t.html}
<h1>DDD do Brasil: os 67 códigos por estado e cidade</h1>
<p class="pseo-lead">São 67 DDDs, que a Anatel chama de códigos nacionais. Cada um cobre um grupo de municípios, quase sempre de um estado só. A tabela vem dos dados abertos da Anatel (arquivo de ${esc(br(fonte.anatel.dataArquivo))})${ibge ? ` e mostra as maiores cidades de cada código pela estimativa do IBGE para ${esc(ibge.ano)}` : ''}.</p>

${campoFiltro({ alvo: '#tabela-ddd', rotulo: 'Procure a cidade, o estado ou o DDD', dica: `Busca nos ${milhar(total)} municípios, com ou sem acento.`, vazio: 'Nada encontrado. Confira a grafia ou procure pelo estado.' })}
<table class="pseo-tabela" id="tabela-ddd">
<caption class="ddd-legenda">DDDs por estado${ibge ? ', com as três maiores cidades de cada um' : ''}</caption>
<thead><tr><th scope="col">Estado</th><th scope="col">DDD</th><th scope="col">${ibge ? 'Maiores cidades' : 'Algumas cidades'}</th><th scope="col">Municípios</th></tr></thead>
<tbody>
${tabela}
</tbody>
</table>
${FILTRO}

<section aria-labelledby="divisa-titulo">
<h2 id="divisa-titulo">DDDs que passam da divisa</h2>
<p>${divisa.length} códigos têm cidades de dois estados: ${esc(lista(divisa.map(([c, x]) => `o ${c} (${x.ufs.map((u) => `${estados[u]}: ${x.municipios.filter((m) => m.uf === u).length}`).join('; ')})`)))}. Por isso eles aparecem duas vezes na tabela, uma em cada estado.</p>
</section>

<section aria-labelledby="ligar-titulo">
<h2 id="ligar-titulo">Como ligar de um DDD para outro</h2>
<p class="ddd-formula"><span>0</span> + <span>operadora</span> + <span>DDD</span> + <span>número</span></p>
<p>O 0 avisa que a ligação é de longa distância; a operadora entra com o Código de Seleção de Prestadora (CSP), de dois dígitos, e as que atendem a sua cidade estão na <a href="${LINK.cspConsulta}" target="_blank" rel="noopener">consulta de prestadoras da Anatel</a>. Pela Anatel, a ligação também pode ser feita sem esse código. Dentro do mesmo DDD, basta o número.</p>
<p>Em 2026 a telefonia fixa mudou: as cidades de cada DDD passaram a formar uma única área local, e ligação de fixo para fixo com o mesmo DDD virou local. A mudança foi feita em etapas, nestas datas:</p>
<table class="pseo-tabela">
<caption class="ddd-legenda">Novas áreas locais da telefonia fixa, cronograma da Anatel</caption>
<thead><tr><th scope="col">Desde</th><th scope="col">DDDs</th><th scope="col">Estados</th></tr></thead>
<tbody>
${cronograma}
</tbody>
</table>
<div class="pseo-acao">
  <a class="btn btn-primary" href="${FERRAMENTA}">Criar link do WhatsApp com o seu DDD</a>
</div>
<p class="pseo-miudo">Grátis e sem cadastro. Ou veja as outras <a href="/ferramentas/">ferramentas grátis</a>.</p>
</section>

${f.html}

${oferta({
    titulo: 'Quem procura o seu serviço na sua cidade acha você?',
    texto: 'Um site com seu endereço, preços, fotos e o botão do WhatsApp faz o cliente da sua região chegar até você pelo Google, e não só quem já te segue.',
    mensagem: 'Quero um site para o meu negócio',
    tag: 'ddd',
  })}

${fontes(d)}
</div>`;

  return {
    rel: 'ddd/index.html',
    loc: '/ddd/',
    lastmod: fonte.anatel.baixadoEm,
    html: pagina({
      loc: '/ddd/',
      title: 'DDD do Brasil: lista dos 67 códigos por estado e cidade',
      description: `Os 67 DDDs do Brasil por estado, com as maiores cidades de cada um e busca nos ${milhar(total)} municípios. Dados da Anatel e como ligar de outro DDD.`,
      main, pageEv: 'pseo_ddd_viewed', css: ['/pseo/ddd.css'], jsonLd: [t.ld, f.ld],
    }),
  };
}

function paginas(dados = require('./dados/ddd.json')) {
  const codigos = Object.keys(dados.ddds);
  const semData = codigos.filter((c) => !AREA_LOCAL_DESDE[c]);
  if (semData.length) throw new Error(`pseo/ddd: DDD sem data de nova área local: ${semData.join(', ')}`);
  return [paginaHub(dados), ...codigos.map((c) => paginaDdd(c, dados))];
}

module.exports = { paginas };
