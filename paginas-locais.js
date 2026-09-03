// Páginas de cidade para a oferta de site em 7 dias.
//
// Por que existem (03/09/2026): a distribuição no Instagram alcança 8 pessoas por post e
// nenhuma delas está procurando site. Quem digita "criação de site em Eunápolis" no Google
// quer contratar hoje, e a disputa numa cidade do interior é quase nada — é o único canal
// da casa que mira INTENÇÃO DE COMPRA em vez de gente rolando o feed.
//
// Duas regras que impedem isto de virar lixo:
//
//   1. NADA DE PÁGINA FINA. Cada página carrega a oferta inteira — o que entra, preço,
//      prazo, garantia, exemplos clicáveis. Página de cidade que é só o nome trocado é
//      "doorway page" no vocabulário do Google, e leva punição em vez de tráfego.
//   2. NADA INVENTADO SOBRE A CIDADE. Nenhum número de população, nenhuma "cidade em
//      franco crescimento", nenhum dado que eu não possa provar. O que é local aqui é o
//      que é VERDADE: onde ele mora, quais clientes reais já foram entregues na região, e
//      como o atendimento acontece naquela distância. Inventar sobre a cidade é a forma
//      mais fácil de queimar a página e a reputação junto.

const CIDADES = [
  {
    slug: 'eunapolis', nome: 'Eunápolis', uf: 'BA',
    // Onde ele mora. É a única cidade em que "presencial" é verdade.
    relacao: 'Moro aqui. Se você preferir, a gente conversa pessoalmente antes de começar.',
    prova: ['eunoimovel', 'drdanielgazzola'],
  },
  {
    slug: 'porto-seguro', nome: 'Porto Seguro', uf: 'BA',
    relacao: 'Fica a menos de uma hora de Eunápolis, onde eu moro. O Eunoimóvel, que eu refiz do zero, anuncia imóveis daqui todo dia.',
    prova: ['eunoimovel'],
  },
  {
    slug: 'arraial-d-ajuda', nome: "Arraial d'Ajuda", uf: 'BA',
    relacao: 'Pousada, restaurante e passeio aqui vivem de quem pesquisa antes de viajar — e quem pesquisa abre no celular. O Eunoimóvel, que eu construí, atende Arraial.',
    prova: ['eunoimovel'],
  },
  {
    slug: 'trancoso', nome: 'Trancoso', uf: 'BA',
    relacao: 'O turista de Trancoso decide de longe, pelo celular, antes de chegar. O Eunoimóvel, que eu construí, atende a região.',
    prova: ['eunoimovel'],
  },
  {
    slug: 'santa-cruz-cabralia', nome: 'Santa Cruz Cabrália', uf: 'BA',
    relacao: 'Vizinha de Porto Seguro, na mesma Costa do Descobrimento que eu atendo desde o Eunoimóvel.',
    prova: ['eunoimovel'],
  },
  {
    slug: 'itabela', nome: 'Itabela', uf: 'BA',
    relacao: 'Fica na estrada entre Eunápolis e o extremo sul. O Eunoimóvel, que eu refiz, lista imóveis de Itabela.',
    prova: ['eunoimovel'],
  },
  {
    slug: 'teixeira-de-freitas', nome: 'Teixeira de Freitas', uf: 'BA',
    relacao: 'É o polo comercial do extremo sul da Bahia. Atendo daqui de Eunápolis, e todo o processo acontece por WhatsApp.',
    prova: ['drdanielgazzola'],
  },
  {
    slug: 'itamaraju', nome: 'Itamaraju', uf: 'BA',
    relacao: 'Atendo daqui de Eunápolis. Todo o processo acontece por WhatsApp, e você aprova cada versão do seu lugar.',
    prova: ['drdanielgazzola'],
  },
];

const EXEMPLOS = {
  eunoimovel: {
    url: 'https://eunoimovel.com.br', img: 'eunoimovel',
    canal: 'Imobiliária · Eunápolis, BA',
    desc: 'Eunoimóvel. Site completo com busca de imóveis, refeito do zero sem perder três anos de posicionamento no Google.',
  },
  drdanielgazzola: {
    url: 'https://drdanielgazzola.com.br', img: 'gazzola',
    canal: 'Cirurgião plástico · Florianópolis e Eunápolis',
    desc: 'Dr. Daniel Gazzola. Site do consultório com o formulário caindo direto no CRM dele. Página estática, sem framework: abre rápido no celular da paciente.',
  },
};

const WHATSAPP = '5573988899345';
const SITE = 'https://thallisribeiro.com.br';
const GA_ID = 'G-247F9N1WQE';

function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function zap(cidade) {
  const texto = encodeURIComponent(`Quero um site pro meu negócio em ${cidade.nome}. Vi a página de R$ 397 em 7 dias.`);
  return `https://wa.me/${WHATSAPP}?text=${texto}`;
}

function cardExemplo(chave) {
  const e = EXEMPLOS[chave];
  if (!e) return '';
  return `        <li class="saida">
          <a class="saida-link" href="${e.url}" target="_blank" rel="noopener" data-ev="site7_examples_clicked" data-ev-local="${chave}">
            <img class="saida-thumb" src="/assets/sites/${e.img}.jpg" alt="" width="640" height="400" loading="lazy" decoding="async">
            <span class="saida-canal">${esc(e.canal)}</span>
            <span class="saida-desc">${esc(e.desc)}</span>
            <span class="saida-acao">Abrir o site →</span>
          </a>
        </li>`;
}

function pagina(cidade) {
  const nome = cidade.nome;
  const titulo = `Criação de site em ${nome} — R$ 397, no ar em 7 dias`;
  const descricao = `Site profissional para o seu negócio em ${nome} (${cidade.uf}) a partir de R$ 397, com domínio .com.br incluso e primeira versão em 48 horas. Preço e prazo fechados antes de começar.`;
  const url = `${SITE}/site-em-7-dias/${cidade.slug}/`;
  const link = zap(cidade);

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/og-default.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%230B0F14'/%3E%3Crect x='10' y='14' width='44' height='4' rx='2' fill='%23E8A33D'/%3E%3Crect x='10' y='30' width='30' height='4' rx='2' fill='%238B949E'/%3E%3Crect x='10' y='46' width='18' height='4' rx='2' fill='%238B949E'/%3E%3C/svg%3E">
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA_ID}');
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Criação de site em ${esc(nome)}",
  "serviceType": "Criação de site",
  "provider": { "@type": "Person", "name": "Thallis Ribeiro", "url": "${SITE}/" },
  "areaServed": { "@type": "City", "name": "${esc(nome)}", "containedInPlace": { "@type": "State", "name": "${cidade.uf}" } },
  "offers": { "@type": "Offer", "price": "397", "priceCurrency": "BRL", "url": "${url}" },
  "description": "${esc(descricao)}"
}
</script>
</head>
<body data-page-ev="site7_local_viewed">

<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>

<header class="nav nav-landing">
  <div class="nav-inner">
    <span class="logo-wrap">
      <span class="logo-bars" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="logo">Thallis Ribeiro</span>
    </span>
    <div class="nav-actions">
      <a class="btn btn-primary btn-nav" href="#preco">A partir de R$ 397</a>
    </div>
  </div>
</header>

<main id="conteudo">

  <section class="hero-tese">
    <div class="tese-inner">
      <p class="tese-kicker">Site profissional · ${esc(nome)}, ${cidade.uf}</p>
      <h1 class="tese-h1">
        <span class="tese-linha tese-linha-fria">Seu site no ar em 7 dias.</span>
        <span class="tese-linha tese-linha-quente">A partir de R$&nbsp;397, domínio incluso.</span>
      </h1>
      <p class="tese-sub">${esc(cidade.relacao)} Design, textos, versão de celular, otimizado pro Google e publicado no seu domínio. Primeira versão em 48 horas pra você ver e ajustar.</p>
      <div class="tese-ctas">
        <a class="btn btn-primary btn-lg" href="${link}" target="_blank" rel="noopener" data-ev="site7_cta_clicked" data-ev-local="hero-${cidade.slug}">Quero meu site</a>
        <a class="btn btn-ghost btn-lg" href="#exemplos" data-ev="site7_examples_clicked" data-ev-local="hero-${cidade.slug}">Ver sites que entreguei</a>
      </div>
      <p class="gatilho">Você será direcionado ao WhatsApp. Quem responde sou eu.</p>
    </div>
  </section>

  <section class="section section-linha" id="como">
    <div class="section-inner">
      <div class="secao-topo"><h2 class="secao-titulo">Como funciona</h2></div>
      <ol class="ciclo">
        <li>Você me diz o que o negócio faz</li>
        <li>Manda 3 sites que gosta</li>
        <li>Em 48h vê a primeira versão no ar</li>
        <li>Pede os ajustes</li>
        <li>Em até 7 dias está publicado</li>
        <li>Aprende a editar em 15 minutos</li>
      </ol>
      <p class="ciclo-remate">Sem reunião de briefing de duas horas. Sem "vou te mandar um orçamento". O preço é este e o prazo é este.</p>
    </div>
  </section>

  <section class="section" id="exemplos">
    <div class="section-inner">
      <div class="secao-topo">
        <h2 class="secao-titulo">Sites que entreguei</h2>
        <span class="secao-estado">no ar, de verdade</span>
      </div>
      <p class="secao-lead">Clique e navegue. Nenhum é mockup: são negócios reais, com cliente de verdade usando.</p>
      <ul class="saidas">
${(cidade.prova || []).map(cardExemplo).join('\n')}
      </ul>
      <p class="secao-lead"><a href="/site-em-7-dias/">Ver a oferta completa e todos os exemplos →</a></p>
    </div>
  </section>

  <section class="section section-linha" id="preco">
    <div class="section-inner">
      <div class="secao-topo"><h2 class="secao-titulo">O que está incluso</h2></div>
      <div class="oferta-grade">
        <div class="oferta-entrega">
          <ul class="lista-marcada">
            <li><strong>Até 5 páginas</strong> (início, sobre, serviços, contato e mais uma) — ou uma página única de conversão, se for pra anúncio</li>
            <li><strong>Textos escritos</strong> a partir do que você me contar; você revisa, eu ajusto</li>
            <li><strong>Funciona no celular</strong> — é onde 8 em cada 10 clientes vão abrir</li>
            <li><strong>Botão de WhatsApp</strong> em toda página, e formulário de contato que chega no seu e-mail</li>
            <li><strong>Google:</strong> títulos, descrições e velocidade prontos pra indexar; cadastro no Perfil de Empresa do Google se você ainda não tiver</li>
            <li><strong>Domínio .com.br incluso</strong>, registrado no seu nome — é seu, não meu</li>
            <li><strong>Você aprende a editar</strong> textos e fotos em 15 minutos, sem depender de mim</li>
          </ul>
        </div>
        <div class="oferta-preco">
          <p class="oferta-rotulo">a partir de</p>
          <p class="oferta-valor"><span class="oferta-moeda">R$</span>397</p>
          <p class="preco-nota" style="margin-top:-6px">Domínio .com.br incluso. Hospedagem R$ 29/mês a partir do segundo mês, cancela quando quiser.</p>
          <ul class="preco-lista">
            <li><span class="preco-item">Primeira versão</span><span class="preco-valor">em 48 horas</span></li>
            <li><span class="preco-item">Entrega</span><span class="preco-valor">em até 7 dias</span></li>
            <li><span class="preco-item">Pagamento</span><span class="preco-valor preco-valor-texto">metade pra começar, metade na entrega</span></li>
          </ul>
          <a class="btn btn-primary btn-lg oferta-btn" href="${link}" target="_blank" rel="noopener" data-ev="site7_cta_clicked" data-ev-local="preco-${cidade.slug}">Quero meu site</a>
          <p class="preco-nota">Se em 48 horas a primeira versão não te agradar, você não paga a segunda metade e fica com o que viu. Sem discussão.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section section-dfy" id="fim">
    <div class="section-inner">
      <h2 class="dfy-titulo">Seu negócio em ${esc(nome)} sem site é um negócio que não aparece</h2>
      <p class="secao-lead">Quem procura o que você vende hoje abre o Google no celular. Se não te acha, acha outro. Em 7 dias isso deixa de ser um problema.</p>
      <a class="btn btn-primary btn-lg" href="${link}" target="_blank" rel="noopener" data-ev="site7_cta_clicked" data-ev-local="fim-${cidade.slug}">Quero meu site em ${esc(nome)}</a>
      <p class="nota-canal">Você será direcionado ao WhatsApp. Quem responde sou eu.</p>
    </div>
  </section>

</main>

<footer class="footer">
  <span>Thallis Ribeiro · ${new Date().getFullYear()}</span>
  <a href="/">Início</a>
  <a href="/site-em-7-dias/">A oferta</a>
  <a href="/blog/">Blog</a>
</footer>

<script src="/assets/main.js" defer></script>
</body>
</html>
`;
}

module.exports = { CIDADES, pagina, zap };
