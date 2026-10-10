// Calculadora "quanto custa um site?" — lógica pura, sem DOM.
// Todo número sai de PRICES, e toda entrada de PRICES diz de onde veio (fonte) e quando
// foi vista (seenOn). Quando as fontes discordam, a faixa mostrada vai do menor ao maior
// valor publicado e sai marcada com `divergem`. "a partir de" sem teto vira `aberto`.
// Pesquisa feita em 10/10/2026; para atualizar, troque os números e o seenOn juntos.

const VISTO = '2026-10-10';

// A ordem aqui é a ordem da lista "Fontes" na página (o teste confere).
export const FONTES = {
  // oficial: tabela de preço de quem vende o plano. Preço oficial diferente entre duas
  // empresas não é "fonte discordando", então não entra no aviso de divergência.
  registrobr: { nome: 'Registro.br: valores de domínio', url: 'https://registro.br/dominio/valores/', oficial: true },
  hostinger: { nome: 'Hostinger: planos do criador de sites', url: 'https://www.hostinger.com/br/criador-de-sites', oficial: true },
  wix: { nome: 'Wix: planos Premium', url: 'https://pt.wix.com/pricing', oficial: true },
  nuvemshop: { nome: 'Nuvemshop: planos e preços', url: 'https://www.nuvemshop.com.br/planos-e-precos', oficial: true },
  freelancerbr: { nome: 'Freelancer.com.br: Quanto custa fazer um site em 2026?', url: 'https://freelancer.com.br/blog/quanto-custa-fazer-um-site-em' },
  infinitepay: { nome: 'InfinitePay: Quanto custa criar um site em 2026', url: 'https://www.infinitepay.io/blog/quanto-custa-criar-um-site' },
  m2hp: { nome: 'M2HP: Quanto custa um site em 2026? Tabela de preços', url: 'https://m2hp.com.br/blog/sites/quanto-custa-criar-um-site/' },
  superix: { nome: 'Superix: Agência ou freelancer para site', url: 'https://www.superix.com.br/blog/gestao-e-negocios/agencia-ou-freelancer-para-site-custos-riscos-e-checklist' },
  webformas: { nome: 'WebFormas: Agência vs freelancer para criar seu site', url: 'https://www.webformas.com.br/blog/agencia-vs-freelancer-criar-site/' },
  metodoviral: { nome: 'Método Viral: Quanto cobra um freelancer para criar um site', url: 'https://metodoviral.com/blog/desenvolvimento-sites/quanto-cobra-um-freelancer-para-criar-um-site-2026/' },
  cronoshare: { nome: 'Cronoshare: Quanto custa criar um site?', url: 'https://www.cronoshare.com.br/quanto-custa/criar-site' },
  thallis: { nome: 'Thallis Ribeiro: oferta "site em 7 dias" (página inicial)', url: 'https://thallisribeiro.com.br/#preco', oficial: true },
};

const p = (fonte, min, max, unidade, o_que, aberto = false) => ({ fonte, min, max, unidade, o_que, aberto, seenOn: VISTO });

export const PRICES = {
  dominio_combr: p('registrobr', 40, 40, 'R$/ano', 'Domínio .com.br registrado direto no Registro.br, por ano'),

  // Você mesmo numa plataforma
  diy_unica_freelancerbr: p('freelancerbr', 0, 500, 'R$', 'Fazer você mesmo num construtor: gasto inicial'),
  diy_unica_infinitepay: p('infinitepay', 0, 500, 'R$', 'Plataforma pronta (planos pagos): investimento inicial'),
  diy_prazo_infinitepay: p('infinitepay', 1, 2, 'semanas', 'Plataforma pronta (planos pagos): prazo de publicação'),
  hostinger_premium: p('hostinger', 10.99, 38.99, 'R$/mês', 'Hostinger Premium: R$ 10,99/mês pagando 48 meses adiantado; renova a R$ 38,99/mês'),
  hostinger_unlimited: p('hostinger', 13.99, 64.99, 'R$/mês', 'Hostinger Unlimited (tem comércio eletrônico): R$ 13,99/mês pagando 48 meses adiantado; renova a R$ 64,99/mês'),
  wix_inicial: p('wix', 15, 15, 'R$/mês', 'Wix Inicial, assinatura anual paga de uma vez (não aceita pagamentos)'),
  wix_essencial: p('wix', 32, 32, 'R$/mês', 'Wix Essencial, assinatura anual paga de uma vez (aceita pagamentos, catálogo de produtos)'),
  nuvemshop_comeco: p('nuvemshop', 0, 0, 'R$/mês', 'Nuvemshop Começo: sem mensalidade'),
  nuvemshop_taxa_comeco: p('nuvemshop', 4.69, 4.69, '% por venda', 'Nuvemshop Começo: custo por venda com o Nuvem Pago'),
  nuvemshop_essencial: p('nuvemshop', 59, 69, 'R$/mês', 'Nuvemshop Essencial: R$ 59/mês no plano anual, R$ 69/mês no mensal'),

  // Hospedagem quando alguém faz o site pra você
  hosp_infinitepay: p('infinitepay', 10, 80, 'R$/mês', 'Hospedagem compartilhada'),
  hosp_freelancerbr: p('freelancerbr', 10, 50, 'R$/mês', 'Hospedagem compartilhada (o preço baixo costuma exigir pagar 3 ou 4 anos adiantado)'),
  hosp_m2hp: p('m2hp', 50, 300, 'R$/mês', 'Hospedagem "de qualidade"'),
  manut_freelancerbr: p('freelancerbr', 100, 400, 'R$/mês', 'Manutenção sob demanda com freelancer (opcional, fora das contas)'),
  manut_contrato_freelancerbr: p('freelancerbr', 300, 1500, 'R$/mês', 'Manutenção em contrato contínuo (opcional, fora das contas)'),

  // Freelancer
  free_lp_m2hp: p('m2hp', 800, 2000, 'R$', 'Landing page com freelancer'),
  free_lp_metodoviral: p('metodoviral', 500, 1000, 'R$', 'Landing page com freelancer'),
  free_inst_superix: p('superix', 1500, 8000, 'R$', 'Site institucional com freelancer'),
  free_inst_webformas: p('webformas', 1500, 4000, 'R$', 'Site institucional com freelancer'),
  free_inst_m2hp: p('m2hp', 500, 1500, 'R$', 'Site institucional com freelancer iniciante'),
  free_inst_metodoviral: p('metodoviral', 1500, 5000, 'R$', 'Site institucional simples (5 páginas) com freelancer'),
  free_loja_superix: p('superix', 3000, 12000, 'R$', 'Loja virtual simples com freelancer'),
  free_loja_metodoviral: p('metodoviral', 7000, 20000, 'R$', 'Loja virtual básica (até 20 produtos, WooCommerce) com freelancer'),

  // Agência
  ag_lp_m2hp: p('m2hp', 3000, 8000, 'R$', 'Landing page com agência'),
  ag_inst_superix: p('superix', 4000, 15000, 'R$', 'Site institucional com agência'),
  ag_inst_webformas: p('webformas', 3500, 8000, 'R$', 'Site institucional com agência'),
  ag_inst_m2hp: p('m2hp', 2000, 15000, 'R$', 'Site institucional com agência (pequena: R$ 2.000 a R$ 5.000; especializada: R$ 5.000 a R$ 15.000)'),
  ag_loja_superix: p('superix', 8000, 40000, 'R$', 'Loja virtual simples com agência'),

  // Prazos
  prazo_lp_m2hp: p('m2hp', 1, 3, 'semanas', 'Landing page (a fonte não separa freelancer de agência)'),
  prazo_lp_freelancerbr: p('freelancerbr', 1, 2, 'semanas', 'Landing page (a fonte não separa freelancer de agência)'),
  prazo_free_inst_superix: p('superix', 2, 4, 'semanas', 'Site institucional com freelancer'),
  prazo_free_inst_webformas: p('webformas', 2, 4, 'semanas', 'Site institucional com freelancer'),
  prazo_ag_inst_superix: p('superix', 3, 6, 'semanas', 'Site institucional com agência'),
  prazo_ag_inst_webformas: p('webformas', 4, 8, 'semanas', 'Site institucional com agência'),
  prazo_free_loja_superix: p('superix', 2, 4, 'semanas', 'Loja virtual simples com freelancer'),
  prazo_loja_freelancerbr: p('freelancerbr', 3, 6, 'semanas', 'Loja virtual em plataforma pronta (a fonte não separa freelancer de agência)'),
  prazo_ag_loja_superix: p('superix', 4, 10, 'semanas', 'Loja virtual simples com agência'),

  // Recursos que mudam o tamanho do projeto
  sistema_m2hp: p('m2hp', 10000, 25000, 'R$', 'Sistema web com login, projeto simples'),
  sistema_freelancerbr: p('freelancerbr', 25000, 25000, 'R$', 'Sistema com área logada e regras próprias: a partir de R$ 25.000', true),
  prazo_sistema_m2hp: p('m2hp', 9, 26, 'semanas', 'Sistema web com login: 2 a 6 meses (cerca de 9 a 26 semanas)'),
  prazo_sistema_freelancerbr: p('freelancerbr', 13, 13, 'semanas', 'Sistema com área logada: 3 meses ou mais (cerca de 13 semanas)', true),
  multi_idioma_cronoshare: p('cronoshare', 4000, 4000, 'R$', 'Site em mais de um idioma: a partir de R$ 4.000', true),

  // Oferta do Thallis, exatamente como está na página inicial
  thallis_site: p('thallis', 997, 997, 'R$', 'Site em 7 dias: a partir de R$ 997, até 5 páginas ou uma página única, domínio .com.br incluso', true),
  thallis_blog: p('thallis', 497, 497, 'R$', 'Extra com preço fechado: blog pronto pra publicar'),
  thallis_10paginas: p('thallis', 997, 997, 'R$', 'Extra com preço fechado: 10 ou mais páginas'),
};

export const TIPOS = { landing: 'Landing page', institucional: 'Site institucional', loja: 'Loja virtual' };

export const RECURSOS = {
  whatsapp: 'Botão de WhatsApp e formulário de contato',
  blog: 'Blog',
  agendamento: 'Agendamento online',
  catalogo: 'Catálogo de produtos (sem venda no site)',
  pagamentos: 'Pagamento online no site (carrinho e checkout)',
  area_cliente: 'Área de cliente com login',
  dois_idiomas: 'Site em dois idiomas',
};

export const ROTAS = { diy: 'Você mesmo numa plataforma', freelancer: 'Freelancer', agencia: 'Agência' };

const SITE_DIY = ['hostinger_premium', 'wix_inicial'];
const LOJA_PLANO = ['nuvemshop_comeco', 'nuvemshop_essencial', 'wix_essencial', 'hostinger_unlimited'];
const HOSPEDAGEM = ['hosp_infinitepay', 'hosp_freelancerbr', 'hosp_m2hp'];
const SISTEMA = ['sistema_m2hp', 'sistema_freelancerbr'];
const PRAZO_SISTEMA = ['prazo_sistema_m2hp', 'prazo_sistema_freelancerbr'];
const PRAZO_LP = ['prazo_lp_m2hp', 'prazo_lp_freelancerbr'];
const DIY_UNICA = ['diy_unica_freelancerbr', 'diy_unica_infinitepay'];

// Loja em plataforma (Nuvemshop etc.) já traz hospedagem na mensalidade (freelancerbr).
const BASE = {
  diy: {
    unica: { landing: DIY_UNICA, institucional: DIY_UNICA, loja: DIY_UNICA },
    mensal: { landing: SITE_DIY, institucional: SITE_DIY, loja: LOJA_PLANO },
    prazo: { landing: ['diy_prazo_infinitepay'], institucional: ['diy_prazo_infinitepay'], loja: ['diy_prazo_infinitepay'] },
  },
  freelancer: {
    unica: {
      landing: ['free_lp_m2hp', 'free_lp_metodoviral'],
      institucional: ['free_inst_superix', 'free_inst_webformas', 'free_inst_m2hp', 'free_inst_metodoviral'],
      loja: ['free_loja_superix', 'free_loja_metodoviral'],
    },
    mensal: { landing: HOSPEDAGEM, institucional: HOSPEDAGEM, loja: LOJA_PLANO },
    prazo: {
      landing: PRAZO_LP,
      institucional: ['prazo_free_inst_superix', 'prazo_free_inst_webformas'],
      loja: ['prazo_free_loja_superix', 'prazo_loja_freelancerbr'],
    },
  },
  agencia: {
    unica: {
      landing: ['ag_lp_m2hp'],
      institucional: ['ag_inst_superix', 'ag_inst_webformas', 'ag_inst_m2hp'],
      loja: ['ag_loja_superix'],
    },
    mensal: { landing: HOSPEDAGEM, institucional: HOSPEDAGEM, loja: LOJA_PLANO },
    prazo: {
      landing: PRAZO_LP,
      institucional: ['prazo_ag_inst_superix', 'prazo_ag_inst_webformas'],
      loja: ['prazo_ag_loja_superix'],
    },
  },
};

// Faixa combinada: do menor ao maior número publicado entre as entradas.
function faixa(ids) {
  const xs = ids.map((id) => PRICES[id]);
  const estimativas = xs.filter((x) => !FONTES[x.fonte].oficial);
  return {
    min: Math.min(...xs.map((x) => x.min)),
    max: Math.max(...xs.map((x) => x.max)),
    aberto: xs.some((x) => x.aberto),
    divergem: estimativas.some((x) => x.min !== estimativas[0].min || x.max !== estimativas[0].max),
    refs: [...ids],
  };
}

// Um recurso que muda o porte do projeto empurra a faixa para cima, nunca para baixo.
function subir(a, b) {
  return {
    min: Math.max(a.min, b.min),
    max: Math.max(a.max, b.max),
    aberto: a.aberto || b.aberto,
    divergem: a.divergem || b.divergem,
    refs: [...new Set([...a.refs, ...b.refs])],
  };
}

const centavos = (v) => Math.round(v * 100) / 100;

export function normalizar(x = {}) {
  const tipo = Object.hasOwn(TIPOS, x.tipo) ? x.tipo : 'institucional';
  let paginas = Math.round(Number(x.paginas));
  if (!Number.isFinite(paginas) || paginas < 1) paginas = 1;
  if (paginas > 100) paginas = 100;
  if (tipo === 'landing') paginas = 1;
  const pedidos = Array.isArray(x.recursos) ? x.recursos : [];
  const recursos = Object.keys(RECURSOS).filter((r) => pedidos.includes(r));
  const quem = Object.hasOwn(ROTAS, x.quem) ? x.quem : null;
  return { tipo, paginas, recursos, quem };
}

export function erroPaginas(texto) {
  const t = String(texto ?? '').trim();
  if (!/^\d+$/.test(t)) return 'Digite um número inteiro de páginas, de 1 a 100.';
  const n = Number(t);
  if (n < 1 || n > 100) return 'O número de páginas vai de 1 a 100.';
  return null;
}

const FAZ_RECURSO = {
  diy: {
    whatsapp: 'Colocar o botão do WhatsApp e testar o formulário',
    blog: 'Escrever e publicar os posts',
    agendamento: 'Escolher e configurar uma ferramenta de agenda online',
    catalogo: 'Cadastrar produtos, fotos e preços',
    pagamentos: 'Configurar o meio de pagamento, o frete e a política de troca',
    area_cliente: 'Configurar cadastro e login de clientes e cuidar dos dados pessoais (LGPD)',
    dois_idiomas: 'Traduzir tudo e manter as duas versões iguais',
  },
  contratado: {
    blog: 'Escrever os posts, ou pagar alguém pra escrever',
    agendamento: 'Manter a agenda atualizada; confirme se a integração está no orçamento',
    catalogo: 'Mandar a lista de produtos com fotos e preços',
    pagamentos: 'Abrir conta no meio de pagamento e decidir frete e trocas',
    area_cliente: 'Decidir o que o cliente vê na área logada e as regras de dados pessoais (LGPD)',
    dois_idiomas: 'Providenciar a tradução, se ela não estiver no orçamento',
  },
};

function voceFaz(rota, e) {
  const montar = e.tipo === 'landing' ? 'Escolher um modelo e montar a página' : `Escolher um modelo e montar as ${e.paginas} páginas`;
  const base = {
    diy: [
      montar,
      'Escrever os textos e conseguir as fotos',
      'Registrar o domínio e ligar no site',
      'Cuidar do Google: título, descrição e Perfil de Empresa',
      'Atualizar sozinho quando algo mudar',
    ],
    freelancer: [
      'Explicar o negócio e mandar textos e fotos (ou pagar à parte por eles)',
      'Aprovar o layout e pedir ajustes',
      'Conferir no orçamento: domínio no seu nome, hospedagem, manutenção e quem edita depois',
    ],
    agencia: [
      'Participar do briefing e das reuniões de aprovação',
      'Mandar textos, fotos e acessos dentro do cronograma',
      'Decidir se assina contrato mensal de manutenção',
    ],
  }[rota];
  const extras = FAZ_RECURSO[rota === 'diy' ? 'diy' : 'contratado'];
  return [...base, ...e.recursos.map((r) => extras[r]).filter(Boolean)];
}

function avisos(rota, e, viraLoja) {
  const out = [];
  const reais = (v) => formatarReais(v);
  if (rota === 'diy') {
    if (!viraLoja && !e.recursos.includes('catalogo')) {
      const h = PRICES.hostinger_premium;
      out.push(`O ${reais(h.min)}/mês da Hostinger exige pagar 48 meses adiantado; na renovação vai a ${reais(h.max)}/mês.`);
    } else {
      out.push(`O plano grátis da Nuvemshop cobra ${String(PRICES.nuvemshop_taxa_comeco.min).replace('.', ',')}% por venda no Nuvem Pago.`);
    }
    if (e.recursos.includes('area_cliente')) out.push('Área de cliente em plataforma pronta depende do plano e de aplicativos; confira antes de assinar.');
  } else if (e.tipo !== 'landing' && e.paginas > 10) {
    out.push(`As fontes dão faixa para sites de até 10 páginas. Com ${e.paginas}, conte com o topo da faixa ou acima.`);
  }
  return out;
}

function oferta(e) {
  const tem = (r) => e.recursos.includes(r);
  const fora = [];
  const consultar = [];
  const extras = [];
  // Limites da página inicial: até 5 páginas no pacote; "10+ páginas" é extra fechado;
  // "você quer 20 páginas — aí é outro projeto"; loja com carrinho e pagamento, sistema e
  // área de login estão em "Não é pra você se".
  if (e.tipo === 'loja') fora.push('loja virtual com carrinho e pagamento');
  else if (tem('pagamentos')) fora.push('pagamento online no site');
  if (tem('area_cliente')) fora.push('área de cliente com login');
  if (e.paginas >= 20) fora.push(`${e.paginas} páginas`);
  else if (e.paginas >= 10) extras.push('thallis_10paginas');
  else if (e.paginas > 5) consultar.push(`${e.paginas} páginas (o pacote inclui até 5)`);
  if (tem('blog')) extras.push('thallis_blog');
  if (tem('agendamento')) consultar.push('agendamento online');
  if (tem('catalogo') && e.tipo !== 'loja') consultar.push('catálogo de produtos');
  if (tem('dois_idiomas')) consultar.push('site em dois idiomas');

  const status = fora.length ? 'fora' : consultar.length ? 'consultar' : 'cabe';
  const preco = status === 'fora' ? null : extras.reduce((s, id) => s + PRICES[id].min, PRICES.thallis_site.min);
  return {
    status,
    preco,
    extras: extras.map((id) => ({ nome: PRICES[id].o_que.replace('Extra com preço fechado: ', ''), valor: PRICES[id].min, ref: id })),
    consultar,
    fora,
    refs: ['thallis_site', 'dominio_combr', ...extras],
  };
}

export function calcular(entrada) {
  const e = normalizar(entrada);
  const tem = (r) => e.recursos.includes(r);
  const viraLoja = e.tipo === 'loja' || tem('pagamentos');
  const dominio = faixa(['dominio_combr']);
  const rotas = {};
  for (const id of Object.keys(ROTAS)) {
    const b = BASE[id];
    let unica = faixa(b.unica[e.tipo]);
    let mensal = faixa(b.mensal[e.tipo]);
    let prazo = faixa(b.prazo[e.tipo]);
    if (viraLoja) {
      unica = subir(unica, faixa(b.unica.loja));
      mensal = subir(mensal, faixa(b.mensal.loja));
      prazo = subir(prazo, faixa(b.prazo.loja));
    }
    if (id === 'diy' && tem('catalogo')) mensal = subir(mensal, faixa(LOJA_PLANO));
    if (id !== 'diy' && tem('area_cliente')) {
      unica = subir(unica, faixa(SISTEMA));
      prazo = subir(prazo, faixa(PRAZO_SISTEMA));
    }
    if (id !== 'diy' && tem('dois_idiomas')) unica = subir(unica, faixa(['multi_idioma_cronoshare']));

    const anual = { min: centavos(mensal.min * 12 + dominio.min), max: centavos(mensal.max * 12 + dominio.max) };
    const primeiroAno = { min: centavos(unica.min + anual.min), max: centavos(unica.max + anual.max), aberto: unica.aberto };
    rotas[id] = { id, nome: ROTAS[id], unica, mensal, dominio, anual, primeiroAno, prazo, voceFaz: voceFaz(id, e), avisos: avisos(id, e, viraLoja) };
  }
  return { entrada: e, rotas, oferta: oferta(e) };
}

export function formatarReais(v) {
  const casas = Number.isInteger(v) ? 0 : 2;
  // Espaço não separável: no celular "R$" não fica sozinho no fim da linha.
  return 'R$' + String.fromCharCode(160) + v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function formatarFaixa(f, unidade = 'R$') {
  const um = (v) => (unidade === 'R$' ? formatarReais(v) : `${v}`);
  const sufixo = unidade === 'R$' ? '' : ` ${unidade}`;
  if (f.min === f.max) {
    if (!f.aberto) return um(f.min) + sufixo;
    return unidade === 'R$' ? `a partir de ${um(f.min)}` : `${f.min}${sufixo} ou mais`;
  }
  return `${um(f.min)} a ${um(f.max)}${sufixo}${f.aberto ? ' ou mais' : ''}`;
}

export function linkWhatsApp(entrada) {
  const e = normalizar(entrada);
  const tamanho = e.tipo === 'landing' ? '' : `, ${e.paginas} ${e.paginas === 1 ? 'página' : 'páginas'}`;
  const minuscula = (s) => s[0].toLowerCase() + s.slice(1);
  const com = e.recursos.length ? `, com ${e.recursos.map((r) => minuscula(RECURSOS[r])).join('; ')}` : '';
  const texto = `Fiz a conta na calculadora e quero um orçamento: ${TIPOS[e.tipo].toLowerCase()}${tamanho}${com}.`;
  return `https://wa.me/5573988899345?text=${encodeURIComponent(texto)}%20%5Bcalculadora%5D`;
}
