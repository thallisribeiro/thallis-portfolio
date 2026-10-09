// Conteúdo editável do site Guardian Box (demonstração do painel).
// Em produção o conteúdo vem do servidor; nesta demo ele fica no localStorage do navegador.
const GB_KEY = 'gb-demo-v1';

const GB_DEFAULT = {
  contato: {
    telefone: '(47) 99286-1607',
    whatsapp: '(47) 99286-1607',
    email: 'contato@guardianbox.com.br',
    endereco: 'Rua Francisco de Paula Seara, 351\nBairro São Judas, Itajaí – SC',
    horario: 'Seg a Sex: 8h às 12h · 13h30 às 18h\nFins de semana e feriados com agendamento',
    instagram: 'https://www.instagram.com/guardian.box/',
    facebook: 'https://www.facebook.com/guardianboxoficial'
  },
  seo: {
    home: {
      title: 'Guardian Box Self Storage | Guarda-móveis em Itajaí/SC',
      description: 'Self storage em Itajaí/SC: boxes individuais a partir de R$ 180/mês, monitoramento 24h, sem fiador e sem prazo mínimo. A 15 min de Balneário Camboriú.'
    },
    blog: {
      title: 'Blog da Guardian Box | Mudança, armazenagem e organização',
      description: 'Dicas práticas para mudança, guarda-móveis, estoque e organização, escritas por quem guarda as coisas dos outros todos os dias em Itajaí/SC.'
    }
  },
  home: {
    topo: { aviso: 'Seg a Sex *8h–12h · 13h30–18h* · Fins de semana e feriados com agendamento', local: 'Itajaí/SC · *15 min* de Balneário Camboriú' },
    hero: {
      promo: 'Boxes individuais a partir de R$ 180/mês',
      titulo: 'O espaço que falta na sua *casa* e na sua *empresa*.',
      texto: 'Guarda-móveis, estoque e documentos em Itajaí com monitoramento 24h, acesso ao seu box quantas vezes quiser e *sem fiador nem prazo mínimo*.',
      imagem: 'assets/foto1.webp'
    },
    beneficios: [
      { titulo: 'Sem prazo mínimo', texto: 'Alugue pelo tempo que precisar' },
      { titulo: 'Sem fiador', texto: 'Contratação simples e rápida' },
      { titulo: 'Acesso ilimitado', texto: 'Vá ao seu box quantas vezes quiser' },
      { titulo: 'Estacionamento', texto: 'Carga e descarga com privacidade' }
    ],
    tamanhos: {
      titulo: 'Descubra o box ideal em segundos',
      texto: 'Adicione o que você vai guardar e a gente calcula o tamanho certo — e até o veículo para a mudança. Sem pagar por espaço sobrando.'
    },
    boxes: [
      { min: 0, max: 3.5, nome: 'Box 2 a 3,5 m³', eq: 'Malas e caixas', desc: 'Armazena 6 malas grandes + 12 caixas médias.', car: 'Utilitário de carroceria aberta (ex.: VW Saveiro)', preco: 'a partir de R$ 180/mês' },
      { min: 3.5, max: 8, nome: 'Box 6 a 8 m³', eq: 'Móveis de 1 quarto', desc: 'Acomoda os móveis de um quarto + 14 caixas médias.', car: 'Utilitário fechado (ex.: Fiat Doblô, furgão)', preco: '' },
      { min: 8, max: 13, nome: 'Box 9 a 13 m³', eq: 'Apto de 1 quarto até 40m²', desc: 'Mobília de um apartamento de 1 quarto + 12 caixas médias.', car: 'Van (ex.: Mercedes-Benz Sprinter)', preco: '', pop: true },
      { min: 13, max: 20, nome: 'Box 15 a 20 m³', eq: 'Casa ou apto de ~60m²', desc: 'Mobília de um apto ou casa de ~60m² + 16 caixas médias.', car: 'Caminhão pequeno (ex.: Hyundai HR baú)', preco: '' },
      { min: 20, max: 25, nome: 'Box 23 a 25 m³', eq: 'Casa ou apto de 80–90m²', desc: 'Mobília de 80 a 90m² + 40 caixas médias.', car: 'Caminhão leve com baú de 6 m (ex.: VW 8-150)', preco: '' },
      { min: 25, max: 49, nome: 'Box 26 a 49 m³', eq: 'Mudança completa', desc: 'Mudança de apto ou casa com vários cômodos.', car: 'Caminhão com baú de 8 m (ex.: MB Accelo 1016)', preco: '' }
    ],
    solucoes: {
      selo: 'Somos a extensão da sua casa e do seu negócio',
      titulo: 'Uma solução para cada momento',
      texto: 'Mudança, reforma, viagem longa, estoque de e-commerce ou arquivo da empresa: guardamos tudo com segurança.'
    },
    passos: {
      titulo: 'Seu box pronto em 3 passos',
      itens: [
        { titulo: 'Escolha o tamanho', texto: 'Use a calculadora ou fale com a gente. Ajudamos você a não pagar por espaço que não vai usar.' },
        { titulo: 'Receba o orçamento', texto: 'Valor direto no WhatsApp, sem compromisso. Contrato simples, sem fiador e sem prazo mínimo.' },
        { titulo: 'Guarde e acesse', texto: 'Traga suas coisas no horário combinado — inclusive fins de semana com agendamento — e acesse quando quiser.' }
      ]
    },
    seguranca: {
      titulo: 'Suas coisas guardadas como se fossem nossas',
      fotos: ['assets/foto1.webp', 'assets/foto3.webp', 'assets/foto2.webp'],
      itens: [
        { titulo: 'Monitoramento 24h, 7 dias por semana', texto: 'Áreas internas e externas com câmeras o tempo todo.' },
        { titulo: 'Boxes individuais e fechados', texto: 'Cada cliente com seu próprio box, com cadeado próprio e total privacidade.' },
        { titulo: 'Ambiente limpo, organizado e ventilado', texto: 'Estrutura metálica, piso tratado e corredores amplos para carga e descarga.' },
        { titulo: 'Estacionamento próprio', texto: 'Encoste o veículo e descarregue com tranquilidade.' }
      ]
    },
    avaliacoes: {
      titulo: 'O self storage mais bem avaliado da região',
      nota: '5,0',
      resumo: 'Excelente · 46 avaliações no Google',
      itens: [
        { nome: 'Daniel P. Machado', texto: 'O melhor Storage da região. Limpo, seguro e com ótimo atendimento. Altamente recomendado.' },
        { nome: 'Adriana da Luz', texto: 'Lugar seguro e organizado, além de toda a gentileza dos proprietários no atendimento. Recomendo!!!' },
        { nome: 'Giliano Baião', texto: 'Espaço muito organizado, de vários tamanhos de box... ventilado e com segurança.' },
        { nome: 'Leonardo Caron', texto: 'Excelente local para armazenagem e atendimento diferenciado.' },
        { nome: 'Giana Mara', texto: 'Ótimo atendimento e perfeita segurança. Eu indico a vocês.' },
        { nome: 'Carlos R. Ribeiro', texto: 'Ótimo atendimento, atenção e gentileza. Boas instalações. Sem problemas ou reclamações. Somente elogios.' },
        { nome: 'Nicole C. Antonioli', texto: 'Ótimo atendimento, prestativos e eficientes! Recomendo!' },
        { nome: 'Marinês Nunes', texto: 'Super bem atendida sempre que necessário... recomendo.' }
      ]
    },
    blog: { titulo: 'Dicas para guardar melhor' },
    faq: {
      titulo: 'Tudo o que você precisa saber',
      itens: [
        { p: 'Quanto custa alugar um box?', r: 'Nossos boxes individuais começam em R$ 180/mês (box de 2,18 m³), um dos menores valores por m³ da região. O valor final depende do tamanho — use a calculadora ou peça seu orçamento no WhatsApp.' },
        { p: 'Preciso de fiador ou de um prazo mínimo de contrato?', r: 'Não. Aqui não há necessidade de fiador e você pode locar pelo tempo que quiser.' },
        { p: 'Posso acessar meu box quando quiser?', r: 'Sim, quantas vezes precisar, dentro do horário de atendimento (seg a sex, 8h–12h e 13h30–18h). Nos fins de semana e feriados, atendemos com agendamento.' },
        { p: 'Como funciona a segurança?', r: 'As áreas internas e externas são monitoradas 24 horas por dia, 7 dias por semana. Cada box é individual e fechado, garantindo privacidade.' },
        { p: 'Como sei qual tamanho de box escolher?', r: 'Use nossa calculadora de espaço acima: ela soma o volume dos seus itens e indica o box ideal e o veículo recomendado para a mudança. Se preferir, nossa equipe ajuda pelo WhatsApp.' },
        { p: 'O que não posso guardar?', r: 'Itens perecíveis, inflamáveis, explosivos, produtos químicos perigosos, animais e itens ilegais não são permitidos. Em caso de dúvida, consulte nossa equipe.' },
        { p: 'Atendem empresas e e-commerce?', r: 'Sim. Oferecemos boxes para estoque, arquivo e equipamentos, além de endereço fiscal e apoio logístico (recebimento, armazenagem, etiquetagem e expedição de encomendas).' }
      ]
    },
    final: { titulo: 'Pronto para liberar espaço?', texto: 'Fale agora com a Guardian Box e receba seu orçamento sem compromisso. Boxes a partir de R$ 180/mês.' }
  },
  servicos: [
    {
      slug: 'guarda-moveis', titulo: 'Guarda-móveis', publicado: true, imagem: 'assets/foto1.webp',
      resumo: 'Para mudanças, reformas, viagens ou para liberar espaço em casa. Seus móveis protegidos em box individual.',
      seo: { title: 'Guarda-móveis em Itajaí/SC | Guardian Box Self Storage', description: 'Guarda-móveis em Itajaí com box individual, monitoramento 24h, sem fiador e sem prazo mínimo. Ideal para mudança, reforma e viagem. Orçamento no WhatsApp.' },
      conteudo: '<p>Mudança de casa, reforma, temporada fora ou simplesmente falta de espaço: no guarda-móveis da Guardian Box seus móveis ficam em um box individual e fechado, com cadeado próprio, na região central de Itajaí.</p><h2>Quando faz sentido</h2><ul><li><b>Mudança:</b> guarde tudo entre a entrega de um imóvel e a chave do outro.</li><li><b>Reforma:</b> tire os móveis do caminho da obra e da poeira.</li><li><b>Viagem longa:</b> entregue o imóvel alugado e pare de pagar aluguel por espaço vazio.</li><li><b>Liberar espaço:</b> o que não cabe em casa, mas você não quer se desfazer.</li></ul><h2>Como funciona</h2><p>Você escolhe o tamanho do box (a calculadora da página inicial ajuda), recebe o orçamento no WhatsApp e traz suas coisas no horário combinado. Sem fiador e sem prazo mínimo: fica o tempo que precisar.</p><h2>Segurança</h2><p>Áreas internas e externas monitoradas 24 horas por dia, 7 dias por semana, e estacionamento próprio para carga e descarga com privacidade.</p>'
    },
    {
      slug: 'estoque-e-commerce', titulo: 'Estoque e e-commerce', publicado: true, imagem: 'assets/foto7.webp',
      resumo: 'Reduza custos de aluguel comercial. Seu estoque organizado a 3 min do Porto de Itajaí.',
      seo: { title: 'Box para estoque e e-commerce em Itajaí | Guardian Box', description: 'Estoque organizado a 3 minutos do Porto de Itajaí, sem fiador e sem prazo mínimo. Pague só pelo espaço que usa, mais barato que sala comercial.' },
      conteudo: '<p>Aluguel de sala comercial custa caro para quem só precisa de espaço para estoque. Na Guardian Box você aluga um box do tamanho certo, a 3 minutos do Porto de Itajaí, e paga só pelo espaço que usa.</p><h2>Para quem é</h2><ul><li>Lojas virtuais e vendedores de marketplace</li><li>Representantes comerciais com mostruário</li><li>Empresas com estoque sazonal ou excedente</li><li>Prestadores de serviço que precisam guardar equipamentos</li></ul><h2>Vantagens</h2><ul><li>Sem fiador e sem prazo mínimo de contrato</li><li>Acesso ao box quantas vezes precisar, no horário de atendimento</li><li>Estacionamento para carga e descarga</li><li>Monitoramento 24 horas</li></ul><p>Precisa também de recebimento e expedição de encomendas? Veja o serviço de <a href="pagina.html?servico=endereco-fiscal-e-logistica">endereço fiscal e apoio logístico</a>.</p>'
    },
    {
      slug: 'documentos-e-arquivo', titulo: 'Documentos e arquivo', publicado: true, imagem: 'assets/foto2.webp',
      resumo: 'Guarde arquivos da empresa, coleções e equipamentos com acesso sempre que precisar.',
      seo: { title: 'Guarda-documentos e arquivo morto em Itajaí | Guardian Box', description: 'Guarde o arquivo da empresa, coleções e equipamentos em box individual com cadeado próprio e monitoramento 24h em Itajaí/SC.' },
      conteudo: '<p>Arquivo morto ocupa sala, e sala custa caro. Guarde as caixas de documentos da empresa, coleções e equipamentos em um box individual, com acesso sempre que precisar consultar alguma coisa.</p><h2>O que dá para guardar</h2><ul><li>Arquivo da empresa e documentos que precisam ser mantidos por anos</li><li>Coleções e itens de valor sentimental</li><li>Equipamentos de trabalho e materiais de eventos</li></ul><h2>Por que aqui</h2><p>Box fechado com cadeado próprio, ambiente limpo, organizado e ventilado, e monitoramento 24 horas. Sem fiador e sem prazo mínimo.</p>'
    },
    {
      slug: 'endereco-fiscal-e-logistica', titulo: 'Endereço fiscal + logística', publicado: true, imagem: '',
      resumo: 'Endereço comercial para sua empresa e apoio logístico: recebemos, guardamos, etiquetamos e expedimos suas encomendas.',
      seo: { title: 'Endereço fiscal e apoio logístico em Itajaí | Guardian Box', description: 'Endereço comercial para sua empresa em Itajaí/SC e apoio logístico: recebimento, armazenagem, etiquetagem e expedição de encomendas.' },
      conteudo: '<p>Sua empresa precisa de um endereço comercial e de alguém para cuidar das encomendas? A Guardian Box oferece endereço fiscal e apoio logístico: recebemos, guardamos, etiquetamos e expedimos suas encomendas.</p><h2>O que está incluído</h2><ul><li><b>Endereço comercial</b> para sua empresa em Itajaí/SC</li><li><b>Recebimento</b> das suas mercadorias</li><li><b>Armazenagem</b> em box individual</li><li><b>Etiquetagem e expedição</b> das encomendas</li></ul><p>Fale com a nossa equipe pelo WhatsApp para montar o pacote certo para o seu negócio.</p>'
    }
  ],
  posts: [
    {
      slug: 'quanto-custa-guarda-moveis-itajai', titulo: 'Quanto custa um guarda-móveis em Itajaí e como escolher o tamanho do box',
      data: '2026-10-02', autor: 'Equipe Guardian Box', publicado: true, imagem: 'assets/foto3.webp',
      resumo: 'Boxes a partir de R$ 180/mês. Veja como calcular o espaço certo para não pagar por metro cúbico sobrando.',
      seo: { title: 'Quanto custa um guarda-móveis em Itajaí? Preços e tamanhos', description: 'Boxes a partir de R$ 180/mês em Itajaí/SC. Veja os 6 tamanhos de box, o que cabe em cada um e como não pagar por espaço sobrando.' },
      conteudo: '<p>A pergunta que mais chega no nosso WhatsApp é: <b>quanto custa?</b> A resposta depende de um número só, o tamanho do box. E é aí que muita gente erra: escolhe grande demais "por garantia" e paga todo mês por espaço vazio.</p><h2>Os tamanhos, do menor ao maior</h2><ul><li><b>2 a 3,5 m³:</b> malas e caixas. Cabem 6 malas grandes e 12 caixas médias. A partir de R$ 180/mês.</li><li><b>6 a 8 m³:</b> móveis de um quarto e 14 caixas médias.</li><li><b>9 a 13 m³:</b> um apartamento de 1 quarto de até 40 m². É o mais procurado.</li><li><b>15 a 20 m³:</b> casa ou apartamento de cerca de 60 m².</li><li><b>23 a 25 m³:</b> casa ou apartamento de 80 a 90 m².</li><li><b>26 a 49 m³:</b> mudança completa, com vários cômodos.</li></ul><h2>Como não errar no tamanho</h2><p>Liste primeiro os itens grandes (cama, guarda-roupa, sofá, geladeira) e depois estime as caixas. A calculadora de espaço da página inicial faz essa conta, já soma uma folga para circulação e ainda sugere o veículo da mudança.</p><h2>Sem fiador e sem prazo mínimo</h2><p>Você paga pelo mês e fica o tempo que precisar. O espaço tem monitoramento 24h e estacionamento próprio para carga e descarga.</p>'
    },
    {
      slug: 'como-guardar-moveis-sem-estragar', titulo: '7 cuidados para guardar móveis por meses sem estragar nada',
      data: '2026-09-25', autor: 'Equipe Guardian Box', publicado: true, imagem: 'assets/foto2.webp',
      resumo: 'Limpar, desmontar, proteger, etiquetar e deixar um corredor: o checklist para seus móveis saírem do box do jeito que entraram.',
      seo: { title: 'Como guardar móveis sem estragar: 7 cuidados | Guardian Box', description: 'Checklist para guardar móveis por meses: limpeza, desmontagem, proteção, etiquetas e o que não pode ir para o box.' },
      conteudo: '<p>Guardar móveis por alguns meses é simples, desde que eles entrem no box do jeito certo. Separamos os cuidados que fazem diferença.</p><h2>1. Limpe e seque tudo antes</h2><p>Móvel guardado úmido cria mofo. Geladeira e máquina de lavar precisam estar descongeladas, limpas e bem secas.</p><h2>2. Desmonte o que der</h2><p>Camas, mesas e guarda-roupas desmontados ocupam menos espaço e quebram menos. Guarde os parafusos em saquinhos presos à própria peça.</p><h2>3. Proteja as superfícies</h2><p>Use mantas, papelão ou plástico bolha em tampos, espelhos e quinas. Evite plástico filme direto na madeira por muito tempo: ele segura umidade.</p><h2>4. Pesado embaixo, leve em cima</h2><p>Caixas pesadas na base e as frágeis no topo. Livros vão em caixas pequenas, para não passarem do peso.</p><h2>5. Etiquete as caixas nas laterais</h2><p>Escreva o conteúdo e o cômodo na lateral, não só na tampa. Com as caixas empilhadas, é a lateral que você vai ler.</p><h2>6. Deixe um corredor</h2><p>Um caminho até o fundo do box evita ter que tirar tudo para pegar uma coisa só. Por isso a nossa calculadora já soma uma folga de espaço.</p><h2>7. Saiba o que não pode</h2><p>Perecíveis, inflamáveis, explosivos, produtos químicos perigosos e animais não podem ser guardados. Na dúvida, pergunte para a nossa equipe.</p>'
    }
  ],
  midia: []
};

const gbClone = o => JSON.parse(JSON.stringify(o));
function gbLoad() {
  try { const s = localStorage.getItem(GB_KEY); if (s) return JSON.parse(s); } catch (e) {}
  return gbClone(GB_DEFAULT);
}
const gbGet = (o, k) => k.split('.').reduce((a, p) => (a == null ? a : a[p]), o);
const gbEsc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// *palavra* vira destaque (igual no WhatsApp) e quebra de linha vira <br>
const gbFmt = (s, tag = 'b') => gbEsc(s).replace(/\*([^*\n]+)\*/g, `<${tag}>$1</${tag}>`).replace(/\n/g, '<br>');
const gbDigits = s => String(s || '').replace(/\D/g, '');
const gbWaLink = t => 'https://wa.me/55' + gbDigits(C.contato.whatsapp) + '?text=' + encodeURIComponent(t);
const gbData = iso => new Date(iso + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
const gbIniciais = n => { const w = String(n).trim().split(/\s+/); return ((w[0]?.[0] || '') +(w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase(); };
const gbPosts = () => C.posts.filter(p => p.publicado).sort((a, b) => b.data.localeCompare(a.data));
const gbMeta = (title, desc) => {
  document.title = title;
  document.querySelector('meta[name=description]').content = desc;
};

let C = gbLoad();

function gbBindWa(root = document) {
  root.querySelectorAll('[data-wa]').forEach(a => { a.href = gbWaLink(a.dataset.wa); a.target = '_blank'; a.rel = 'noopener'; });
}

function gbCard(s) {
  const img = s.imagem ? `<img src="${gbEsc(s.imagem)}" alt="${gbEsc(s.titulo)}" loading="lazy">` : '<div class="ph"><svg><use href="#i-build"/></svg></div>';
  return `<article class="sol">${img}<div class="b"><h3><a href="pagina.html?servico=${gbEsc(s.slug)}">${gbEsc(s.titulo)}</a></h3><p>${gbEsc(s.resumo)}</p><a href="pagina.html?servico=${gbEsc(s.slug)}">Saiba mais →</a></div></article>`;
}

function gbPostCard(p) {
  return `<a class="post-card" href="pagina.html?post=${gbEsc(p.slug)}">${p.imagem ? `<img src="${gbEsc(p.imagem)}" alt="" loading="lazy">` : '<div class="ph"></div>'}<div class="b"><small>${gbData(p.data)}</small><h3>${gbEsc(p.titulo)}</h3><p>${gbEsc(p.resumo)}</p><span>Ler artigo →</span></div></a>`;
}

const gbLists = {
  'gb-servicos': () => C.servicos.filter(s => s.publicado).map(gbCard).join(''),
  'gb-foot-servicos': () => C.servicos.filter(s => s.publicado).map(s => `<li><a href="pagina.html?servico=${gbEsc(s.slug)}">${gbEsc(s.titulo)}</a></li>`).join(''),
  'gb-faq': () => C.home.faq.itens.map((f, i) => `<details${i ? '' : ' open'}><summary>${gbEsc(f.p)}</summary><p>${gbFmt(f.r)}</p></details>`).join(''),
  'gb-reviews': () => C.home.avaliacoes.itens.map(r => `<div class="rev"><div class="stars">★★★★★</div><p>“${gbEsc(r.texto)}”</p><div class="who"><div class="av">${gbEsc(gbIniciais(r.nome))}</div><div>${gbEsc(r.nome)}<small>Google</small></div></div></div>`).join(''),
  'gb-posts-home': () => gbPosts().slice(0, 3).map(gbPostCard).join(''),
  'tiers': () => C.home.boxes.map(t => `
  <div class="tier${t.pop ? ' pop' : ''}">${t.pop ? '<span class="tag">Mais procurado</span>' : ''}
    <svg class="cube"><use href="#i-cube"/></svg>
    <h3>${gbEsc(t.nome)}</h3><div class="eq">${gbEsc(t.eq)}</div><p>${gbEsc(t.desc)}</p>
    <div class="car"><svg width="18" height="18"><use href="#i-truck"/></svg>${gbEsc(t.car)}</div>
    <div class="price"><b>${gbEsc(t.preco || 'Consulte')}</b><a data-wa="Olá! Quero um orçamento do ${gbEsc(t.nome)}.">Orçar →</a></div>
  </div>`).join('')
};

function gbRender() {
  if (window.gbExtra) gbExtra(); // conteúdo próprio da página primeiro, para os data-gb dele também serem preenchidos
  document.querySelectorAll('[data-gb]').forEach(el => { const v = gbGet(C, el.dataset.gb); if (v != null) el.innerHTML = gbFmt(v, el.dataset.gbTag); });
  document.querySelectorAll('[data-gb-src]').forEach(el => { const v = gbGet(C, el.dataset.gbSrc); if (v) el.src = v; });
  document.querySelectorAll('[data-gb-href]').forEach(el => { el.href = gbGet(C, el.dataset.gbHref) || '#'; });
  document.querySelectorAll('[data-gb-tel]').forEach(el => { el.href = 'tel:+55' + gbDigits(C.contato.telefone); });
  const end = C.contato.endereco.replace(/\n/g, ', ');
  document.querySelectorAll('[data-gb-map]').forEach(el => { const u = 'https://www.google.com/maps?q=' + encodeURIComponent(end) + '&output=embed'; if (el.src !== u) el.src = u; });
  document.querySelectorAll('[data-gb-rota]').forEach(el => { el.href = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(end); });
  const hero = document.querySelector('.hero[data-gb-bg]');
  if (hero) hero.style.backgroundImage = `linear-gradient(105deg,rgba(6,26,74,.97) 0%,rgba(10,36,99,.92) 45%,rgba(10,36,99,.55) 100%),url("${C.home.hero.imagem}")`;
  for (const id in gbLists) { const el = document.getElementById(id); if (el) el.innerHTML = gbLists[id](); }
  const blogSec = document.getElementById('blog');
  if (blogSec) blogSec.hidden = !gbPosts().length;
  const solSec = document.getElementById('solucoes');
  if (solSec) solSec.hidden = !C.servicos.some(s => s.publicado);
  if (document.body.dataset.pagina === 'home') gbMeta(C.seo.home.title, C.seo.home.description);
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
  gbBindWa();
}

// Menu do celular: abre/fecha pelo botão, fecha no Esc e ao escolher um link
addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('nav'), bt = document.querySelector('.burger');
  if (!nav || !bt) return;
  const abrir = v => { nav.classList.toggle('open', v); bt.setAttribute('aria-expanded', v); bt.setAttribute('aria-label', v ? 'Fechar menu' : 'Abrir menu'); };
  bt.onclick = () => abrir(!nav.classList.contains('open'));
  nav.addEventListener('click', e => { if (e.target.closest('a')) abrir(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { abrir(false); bt.focus(); } });
});

// Prévia do painel: recebe o rascunho e redesenha sem salvar nada.
const GB_PREVIEW = new URLSearchParams(location.search).has('preview');
if (GB_PREVIEW) {
  // Na prévia, link não navega (senão a moldura sai da página que está sendo editada)
  document.addEventListener('click', e => { const a = e.target.closest('a'); if (a && !(a.getAttribute('href') || '').startsWith('#')) e.preventDefault(); }, true);
  addEventListener('message', e => {
    if (e.origin !== location.origin || !e.data) return;
    if (e.data.gb) { C = e.data.gb; window.gbRota = e.data.rota; gbRender(); }
    if (e.data.ir) document.getElementById(e.data.ir)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
} else if (document.body.dataset.pagina) {
  // Publicou no painel em outra aba: o site atualiza sozinho.
  addEventListener('storage', e => { if (e.key === GB_KEY) { C = gbLoad(); gbRender(); } });
  addEventListener('DOMContentLoaded', () => {
    let logada = false;
    try { logada = !!localStorage.getItem('gb-login'); } catch (e) {}
    if (!logada) return;
    const bar = document.createElement('div');
    bar.className = 'gb-adminbar';
    bar.innerHTML = '<span>Você está conectada ao painel</span><a id="gb-editar" href="admin/">✎ Editar esta página</a><a href="admin/">Painel</a>';
    document.body.prepend(bar);
    const q = new URLSearchParams(location.search);
    const ed = document.getElementById('gb-editar');
    if (q.get('servico')) ed.href = 'admin/#servico/' + C.servicos.findIndex(s => s.slug === q.get('servico'));
    else if (q.get('post')) ed.href = 'admin/#post/' + C.posts.findIndex(p => p.slug === q.get('post'));
    else if (q.has('blog')) ed.href = 'admin/#blog';
    else ed.href = 'admin/#home';
  });
}
