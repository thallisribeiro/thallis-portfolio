// Família "cardápio digital para <tipo>": um hub e uma página por tipo de negócio de comida.
//
// O modelo mostrado em cada página sai de cardapio-digital/modelos.json, o MESMO arquivo que
// o editor carrega com /cardapio-digital/?modelo=<slug>: o que a página mostra é o que abre
// no editor. O texto de cada página está em pseo/dados/cardapio.json.
// Todo texto passa por esc(); o modelo não traz preço (o dono define o dele).

const fs = require('fs');
const path = require('path');
const { esc, pagina, trilha, faq, oferta } = require('./_layout.js');

const RAIZ = path.join(__dirname, '..');
const HUB = '/cardapio-digital-para/';
const FERRAMENTA = '/cardapio-digital/';
const PAGE_EV = 'pseo_cardapio_viewed';
const NOME_SELO = { vegetariano: 'Vegetariano', vegano: 'Vegano', 'sem-gluten': 'Sem glúten', picante: 'Picante' };

const lerJson = (rel) => JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));

function lerDados() {
  return { ...lerJson('pseo/dados/cardapio.json'), modelos: lerJson('cardapio-digital/modelos.json') };
}

const rel = (loc) => `${loc.slice(1)}index.html`;
const seu = (meu) => meu.replace(/^o meu /, 'o seu ').replace(/^a minha /, 'a sua ');
const lista = (itens) => itens.map((i) => `<li>${i}</li>`).join('');

// O modelo como o cliente vai ver, com as cores do tema escolhido (as mesmas de cardapio-digital/ver/).
// semPreco (na seção ou no item) marca sabor que se paga pelo tamanho, ou aviso: fica sem preço
// também no cardápio do dono. O editor ignora o campo; todo item abre lá com o preço em branco.
function modelo(m) {
  const itens = (s) => s.itens.map((i) => `<li>
  <div class="cdp-linha"><span class="cdp-item">${esc(i.nome)}</span>${
    s.semPreco || i.semPreco ? '' : '<span class="cdp-preco">defina seu preço</span>'}</div>${
    i.desc ? `\n  <p class="cdp-desc">${esc(i.desc)}</p>` : ''}${
    (i.selos || []).length ? `\n  <ul class="cdp-selos" aria-label="Selos">${lista(i.selos.map((x) => esc(NOME_SELO[x] || x)))}</ul>` : ''}
</li>`).join('\n');
  return `<div class="cdp-menu" data-tema="${esc(m.tema || 'classico')}">
<p class="cdp-nome">${esc(m.nome)}</p>
${m.frase ? `<p class="cdp-topo">${esc(m.frase)}</p>` : ''}
${m.horario ? `<p class="cdp-topo"><strong>Horário:</strong> ${esc(m.horario)}</p>` : ''}
${m.secoes.map((s) => `<h3>${esc(s.nome)}</h3>\n<ul class="cdp-itens">\n${itens(s)}\n</ul>`).join('\n')}
</div><!-- /modelo -->`;
}

// Primeira frase em negrito, para a dica ser lida por cima.
function dica(d) {
  const k = d.indexOf('. ');
  return k < 0 ? esc(d) : `<strong>${esc(d.slice(0, k + 1))}</strong> ${esc(d.slice(k + 2))}`;
}

const VERDADES = [
  'É grátis, sem cadastro e sem mensalidade.',
  'O cardápio mora no próprio link. Não existe conta nem servidor guardando o seu cardápio: para mudar depois, use o link de edição que aparece junto com o QR.',
  'Mudou o cardápio, mudam o link e o QR. O QR antigo continua abrindo o cardápio antigo, então imprima de novo e troque as plaquinhas.',
  'Na maioria dos celulares, a própria câmera lê o QR e abre o cardápio no navegador, sem aplicativo.',
];

const IMPRESSAO = 'No editor, o botão Imprimir plaquinhas das mesas monta 4 plaquinhas por folha A4, com o nome do negócio, a frase "Aponte a câmera do celular para ver o cardápio" e o QR com cerca de 7 cm, com linha tracejada para recortar. O botão Baixar QR (PNG) gera a imagem para mandar à gráfica, fazer adesivo ou imprimir maior.';

function titulo(tipo) {
  return [`Cardápio digital para ${tipo}: modelo grátis com QR`, `Cardápio digital para ${tipo}: modelo grátis`, `Cardápio digital para ${tipo}`]
    .find((t) => t.length <= 60) || `Cardápio digital para ${tipo}`;
}

function paginaTipo(t, dados) {
  const loc = `${HUB}${t.slug}/`;
  const usar = `${FERRAMENTA}?modelo=${encodeURIComponent(t.slug)}`;
  const porSlug = new Map(dados.tipos.map((x) => [x.slug, x]));
  const tr = trilha([{ nome: 'Início', loc: '/' }, { nome: 'Ferramentas grátis', loc: '/ferramentas/' },
    { nome: 'Cardápio digital por tipo', loc: HUB }, { nome: t.nome, loc }]);
  const perguntas = faq(t.faq);
  const botao = `<div class="pseo-acao"><a class="btn btn-primary btn-lg" href="${esc(usar)}" data-ev="pseo_cardapio_usar_modelo" data-ev-local="${esc(t.slug)}">Usar este modelo</a><span class="pseo-miudo">Abre o editor grátis já preenchido. Sem cadastro.</span></div>`;
  const fontes = (t.fontes || []).map((f) => dados.fontes[f]).filter(Boolean)
    .map((f) => `<p class="pseo-fontes">Fonte: <a href="${esc(f.url)}" rel="noopener">${esc(f.nome)}</a>, lido em ${esc(f.lido)}.</p>`).join('');
  const sua = seu(t.meu);
  const m = dados.modelos[t.slug];

  const main = `${tr.html}
<h1>Cardápio digital para ${esc(t.tipo)}</h1>
<p class="pseo-lead">${esc(t.intro)}</p>
${botao}

<h2>Modelo de cardápio para ${esc(t.tipo)}</h2>
<p>Seções, itens, descrições e selos prontos. Os preços ficam em branco: no editor, você define o seu preço nos itens marcados com "defina seu preço" antes de gerar o QR code.${
  m.secoes.some((s) => s.semPreco || s.itens.some((i) => i.semPreco))
    ? ' Os outros (sabores que se pagam pelo tamanho, avisos) ficam sem preço, e o cardápio mostra só o nome e a descrição.' : ''}</p>
${modelo(m)}
${botao}

<h2>Como organizar o cardápio ${esc(t.da)}</h2>
<ul class="cdp-dicas">${lista(t.organizar.map(dica))}</ul>

<h2>O que o QR code muda no dia a dia ${esc(t.da)}</h2>
<p>${esc(t.dia)}</p>
<ul class="cdp-dicas">${lista(VERDADES.map(esc))}</ul>

<h2>Como imprimir e onde colocar o QR code</h2>
<p>${esc(IMPRESSAO)}</p>
<p>${esc(t.qr)}</p>

${perguntas.html}
${fontes}

<h2>Modelos para negócios parecidos</h2>
<ul class="pseo-lista cdp-lista">${lista(t.relacionados.map((s) => porSlug.get(s)).filter(Boolean)
    .map((r) => `<a href="${esc(`${HUB}${r.slug}/`)}"><span>${esc(r.nome)}</span><small>${esc(r.resumo)}</small></a>`))}</ul>
<p>Veja <a href="${HUB}">todos os modelos de cardápio digital</a>, abra o <a href="${FERRAMENTA}">editor de cardápio digital em branco</a> ou conheça as outras <a href="/ferramentas/">ferramentas grátis</a>.</p>

${oferta({
    titulo: `Um site para ${sua}, com endereço que não muda`,
    texto: `Aqui o cardápio mora no link, então cada mudança gera um QR novo. Num site próprio, ${sua} tem endereço fixo e domínio próprio, o cardápio é atualizado quando você quiser e o QR das mesas e das embalagens não precisa ser reimpresso. E ainda cabe foto dos pratos, que num link não cabe.`,
    mensagem: `Quero um site para ${t.meu}`,
    tag: 'cardapio',
  })}`;

  return {
    rel: rel(loc), loc, lastmod: dados.atualizado,
    html: pagina({ loc, title: titulo(t.tipo), description: t.description, main, pageEv: PAGE_EV,
      css: ['/pseo/cardapio.css'], jsonLd: [tr.ld, perguntas.ld] }),
  };
}

const PERGUNTAS_HUB = [
  { p: 'Qual a diferença entre usar um modelo e começar do zero?', r: 'Nenhuma no resultado: o modelo só preenche o editor com seções, itens, descrições e selos do seu tipo de negócio. Você pode apagar tudo e começar em branco quando quiser.' },
  { p: 'Meu negócio mistura dois tipos. Qual modelo eu uso?', r: 'Abra o que tem a parte mais difícil de organizar (na pizzaria, os tamanhos; no açaí, os complementos) e acrescente no editor as seções do outro. Fique de olho no medidor de tamanho do link: cardápio grande deixa o QR mais miúdo.' },
  { p: 'Os modelos trazem preço sugerido?', r: 'Não. Preço depende da cidade, do custo e do seu negócio, e qualquer número que estivesse aqui seria inventado. Todos os itens vêm com o preço em branco.' },
  { p: 'Preciso de cadastro para usar os modelos?', r: 'Não. O editor é grátis, não pede cadastro, e o cardápio não sai do seu navegador: ele fica guardado dentro do próprio link.' },
];

function paginaHub(dados) {
  const n = dados.tipos.length;
  const tr = trilha([{ nome: 'Início', loc: '/' }, { nome: 'Ferramentas grátis', loc: '/ferramentas/' }, { nome: 'Cardápio digital por tipo', loc: HUB }]);
  const perguntas = faq(PERGUNTAS_HUB);
  const grupos = [...new Set(dados.tipos.map((t) => t.grupo))];
  const main = `${tr.html}
<h1>Cardápio digital para cada tipo de negócio</h1>
<p class="pseo-lead">Modelos prontos de cardápio digital para ${n} tipos de negócio de comida e bebida, da pizzaria à pousada. Cada modelo abre no editor grátis já preenchido, com seções, itens, descrições e selos; você define os preços e gera o link e o QR code.</p>

<h2>Escolha o modelo do seu negócio</h2>
${grupos.map((g) => `<h3>${esc(g)}</h3>
<ul class="pseo-lista tres cdp-lista">${lista(dados.tipos.filter((t) => t.grupo === g)
    .map((t) => `<a href="${esc(`${HUB}${t.slug}/`)}"><span>${esc(t.nome)}</span><small>${esc(t.resumo)}</small></a>`))}</ul>`).join('\n')}

<h2>O que muda de um modelo para outro</h2>
<p>O que muda de um negócio para outro não é o nome dos pratos, é o jeito de cobrar. Pizzaria cobra pelo tamanho, açaí pelo copo e pelos adicionais, self-service pelo quilo, bar pela porção e pela dose, confeitaria pelo quilo e pelo cento, adega pela embalagem. Como a ferramenta tem um preço por item, cada modelo resolve isso de um jeito: tamanho como item, sabores sem preço, acréscimos numa seção própria. Por isso vale abrir o modelo do seu negócio em vez de copiar o de outro.</p>

<h2>O que todos os modelos têm em comum</h2>
<ul class="cdp-dicas">${lista([
    '<strong>Preço em branco.</strong> Nenhum modelo vem com preço: você define o seu em cada item, no editor.',
    '<strong>Selos só onde cabem.</strong> Vegetariano, vegano, sem glúten e picante aparecem só onde o item permite. O selo sem glúten aparece pouco de propósito: contaminação na cozinha conta, e só você sabe se pode garantir.',
    '<strong>Tamanho certo para o QR.</strong> Cada modelo foi conferido para caber num QR code que se lê impresso na mesa, com folga para você acrescentar itens, WhatsApp e endereço.',
    '<strong>O que muda todo dia fica de fora.</strong> Prato do dia, sabor da semana e marca de cerveja aparecem como "pergunte", porque cada mudança no cardápio gera um link e um QR novos.',
  ])}</ul>

<h2>Como usar um modelo</h2>
<ol class="cdp-dicas">${lista([
    'Abra a página do seu tipo de negócio e clique em <strong>Usar este modelo</strong>. O editor abre preenchido; se você já tinha um cardápio em edição neste aparelho, ele pergunta antes de substituir.',
    'Troque o nome, defina os preços, apague o que você não vende e acrescente o que falta. A prévia mostra como fica no celular do cliente.',
    'Gere o link e o QR, imprima as plaquinhas e guarde o link de edição: é com ele que você muda o cardápio depois.',
  ])}</ol>
<p>Prefere começar sem modelo? Abra o <a href="${FERRAMENTA}">editor de cardápio digital</a> direto, ou veja as outras <a href="/ferramentas/">ferramentas grátis para pequenos negócios</a>.</p>

${perguntas.html}

${oferta({
    titulo: 'Um site do seu negócio, com endereço que não muda',
    texto: 'Aqui o cardápio mora no link, então cada mudança gera um QR novo. Num site próprio, o endereço é fixo e no seu domínio, o cardápio é atualizado quando você quiser e o QR das mesas não precisa ser reimpresso. E ainda cabe foto dos pratos.',
    mensagem: 'Quero um site para o meu restaurante',
    tag: 'cardapio',
  })}`;

  return {
    rel: rel(HUB), loc: HUB, lastmod: dados.atualizado,
    html: pagina({
      loc: HUB,
      title: `Cardápio digital: ${n} modelos grátis por tipo de negócio`,
      description: `Modelos prontos de cardápio digital para pizzaria, açaí, bar, padaria, pousada e mais ${n - 5} tipos. Abra no editor grátis, ponha seus preços e gere o QR.`,
      main, pageEv: PAGE_EV, css: ['/pseo/cardapio.css'], jsonLd: [tr.ld, perguntas.ld],
    }),
  };
}

/** Hub + uma página por tipo. `dados` só é passado nos testes. */
function paginas(dados = lerDados()) {
  return [paginaHub(dados), ...dados.tipos.map((t) => paginaTipo(t, dados))];
}

module.exports = { paginas, lerDados };
