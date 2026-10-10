// Gerador de política de privacidade (LGPD) — lógica pura, sem DOM.
// Artigos conferidos no texto compilado da Lei 13.709/2018 (planalto.gov.br) em 10/10/2026,
// no Marco Civil (Lei 12.965/2014, art. 15), na Resolução CD/ANPD nº 2/2022 e no Guia
// Orientativo de Cookies da ANPD (out/2022). Fontes com link no rodapé da página.

export const OPCOES = ['contato', 'whatsapp', 'newsletter', 'agendamento', 'loja', 'cookies',
  'analytics', 'meta', 'login', 'saude', 'criancas', 'exterior'];

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto',
  'setembro', 'outubro', 'novembro', 'dezembro'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE = /^(https?:\/\/)?[^\s/$.?#]+\.[^\s]+$/i;

const limpa = (s) => String(s ?? '').toUpperCase().replace(/[.\-/\s]/g, '');

export function formatarData(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ''));
  if (!m) return '';
  const [a, mes, d] = m.slice(1).map(Number);
  const dt = new Date(Date.UTC(a, mes - 1, d));
  if (dt.getUTCMonth() !== mes - 1 || dt.getUTCDate() !== d) return '';
  return `${d === 1 ? '1º' : d} de ${MESES[mes - 1]} de ${a}`;
}

export function validarCPF(cpf) {
  const d = limpa(cpf);
  if (!/^\d{11}$/.test(d) || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (n) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += d[i] * (n + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === +d[9] && dv(10) === +d[10];
}

// Aceita o CNPJ alfanumérico (novas inscrições desde julho/2026): cada caractere vale
// código ASCII − 48, módulo 11 com os pesos de sempre (FAQ CNPJ alfanumérico, Receita Federal).
export function validarCNPJ(cnpj) {
  const c = limpa(cnpj);
  if (!/^[0-9A-Z]{12}\d{2}$/.test(c) || /^(.)\1{13}$/.test(c)) return false;
  const v = [...c].map((ch) => ch.charCodeAt(0) - 48);
  const PESOS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const dv = (n) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += v[i] * PESOS[13 - n + i];
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(12) === v[12] && dv(13) === v[13];
}

export function validarDocumento(doc) {
  const c = limpa(doc);
  if (!c) return { tipo: null, valido: true };
  if (/^\d{11}$/.test(c)) return { tipo: 'cpf', valido: validarCPF(c) };
  return { tipo: 'cnpj', valido: validarCNPJ(c) };
}

function formatarDoc(doc) {
  const c = limpa(doc);
  return c.length === 11
    ? `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`
    : `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}

// Erros por campo, prontos para mostrar ao lado de cada um. Vazio = tudo certo.
export function validar(i = {}) {
  const t = (k) => String(i[k] ?? '').trim();
  const e = {};
  if (!t('nome')) e.nome = 'Escreva o nome do seu negócio.';
  if (!EMAIL.test(t('email'))) e.email = 'Escreva um e-mail válido, como contato@seunegocio.com.br.';
  if (!validarDocumento(i.documento).valido) e.documento = 'Esse CNPJ ou CPF tem dígito errado. Confira ou deixe em branco.';
  if (t('site') && !SITE.test(t('site'))) e.site = 'Endereço inválido. Exemplo: seunegocio.com.br';
  if (t('encarregadoEmail') && !EMAIL.test(t('encarregadoEmail'))) e.encarregadoEmail = 'E-mail do encarregado inválido.';
  if (!formatarData(i.data)) e.data = 'Escolha uma data válida.';
  return e;
}

export function buildPolicy(input = {}) {
  const o = Object.fromEntries(OPCOES.map((k) => [k, Boolean(input.opcoes?.[k])]));
  const t = (k) => String(input[k] ?? '').trim();
  const nome = t('nome') || '[nome do negócio]';
  const email = t('email') || '[e-mail de contato]';
  const site = t('site');
  const doc = validarDocumento(input.documento);
  const temDoc = doc.tipo && doc.valido;
  const pj = temDoc && doc.tipo === 'cnpj';
  const local = [t('cidade'), t('uf')].filter(Boolean).join('/');
  const aposto = [temDoc && `${doc.tipo.toUpperCase()} ${formatarDoc(input.documento)}`, local && `de ${local}`]
    .filter(Boolean).join(', ');
  const proc = t('processador');
  const encNome = t('encarregadoNome');
  const encEmail = t('encarregadoEmail');
  const consentimento = 'Base legal: seu consentimento (art. 7º, I, da LGPD); só ativamos depois que você aceitar.';

  const sections = [];
  const add = (heading, paragraphs, list) =>
    sections.push(list ? { heading, paragraphs, list } : { heading, paragraphs });

  add('Quem somos', [
    `Esta política explica, em linguagem simples, como ${nome}${aposto ? `, ${aposto},` : ''} trata os dados pessoais de quem visita ${site ? `o site ${site}` : 'o nosso site'} ou fala com a gente. Ela segue a Lei Geral de Proteção de Dados Pessoais (LGPD, Lei nº 13.709/2018).`,
    `${nome} é o controlador dos seus dados: é quem decide para que eles são usados (art. 5º, VI, da LGPD). Dado pessoal é qualquer informação que identifica você ou pode identificar, como nome, telefone, e-mail ou endereço IP. Fale com a gente pelo e-mail ${email}.`,
  ]);

  add('Quando você só visita o site', [
    'Mesmo que você não preencha nada, a empresa que hospeda o site pode registrar dados técnicos da visita, como endereço IP, data e hora, páginas abertas e tipo de navegador. Usamos isso só para manter o site no ar, seguro e funcionando. Base legal: legítimo interesse (art. 7º, IX, da LGPD).',
  ]);

  if (o.contato) add('Formulário de contato', [
    'Quando você preenche o formulário de contato, recebemos o que você escrever nele, normalmente nome, e-mail, telefone e a sua mensagem. Usamos esses dados só para responder você.',
    'Base legal: atender um pedido seu antes de fechar negócio, como um orçamento (procedimentos preliminares de contrato, art. 7º, V, da LGPD), ou, em mensagens gerais, nosso legítimo interesse em responder quem nos procura (art. 7º, IX).',
  ]);

  if (o.whatsapp) add('Atendimento pelo WhatsApp', [
    'Se você fala com a gente pelo WhatsApp, vemos seu número, o nome do seu perfil e o que você enviar na conversa (textos, fotos, áudios). Usamos isso para atender você, tirar dúvidas, passar orçamentos e acompanhar o seu atendimento.',
    'O WhatsApp é um serviço da Meta, que também trata esses dados conforme a política de privacidade do próprio WhatsApp.',
    'Base legal: procedimentos preliminares e execução de contrato a seu pedido (art. 7º, V, da LGPD) e legítimo interesse em responder quem nos procura (art. 7º, IX).',
  ]);

  if (o.agendamento) add('Agendamento online', [
    'Para agendar um horário, pedimos nome, telefone ou e-mail e o dia e o serviço escolhidos. Usamos esses dados para confirmar o agendamento, mandar lembretes e avisar se algo mudar.',
    'Base legal: execução de contrato ou de procedimentos preliminares a seu pedido (art. 7º, V, da LGPD).',
  ]);

  if (o.newsletter) add('Newsletter e e-mails de novidades', [
    `Se você assinar a nossa newsletter, usamos seu e-mail (e o nome, se você informar) para mandar novidades, ofertas e conteúdos. Você pode cancelar quando quiser pelo link de cancelamento dos e-mails ou pedindo pelo e-mail ${email}.`,
    'Base legal: seu consentimento (art. 7º, I, da LGPD), que você pode retirar a qualquer momento, de graça (art. 8º, § 5º). Só mandamos esses e-mails para quem pediu.',
  ]);

  if (o.loja) add('Compras e pagamentos', [
    'Quando você faz uma compra, pedimos os dados necessários para concluir o pedido: nome, CPF ou CNPJ (para a nota fiscal), e-mail, telefone e endereço de entrega. Usamos esses dados para processar o pedido, entregar, emitir a nota fiscal e prestar suporte e garantia.',
    `Os pagamentos são processados ${proc ? `pela empresa ${proc}` : 'por uma empresa especializada em pagamentos'}. Os dados de pagamento que você digita no ambiente dela são tratados por essa empresa, conforme a política de privacidade dela.`,
    'Base legal: execução do contrato de compra (art. 7º, V, da LGPD) e cumprimento de obrigação legal, como as regras fiscais (art. 7º, II).',
  ]);

  if (o.login) add('Cadastro e área do cliente', [
    'Se você criar uma conta na nossa área do cliente, guardamos seu nome, e-mail, os dados de acesso que você criar e o que você registrar na conta. Usamos isso para deixar você entrar, ver seu histórico e usar os serviços da conta.',
    'Base legal: execução de contrato a seu pedido (art. 7º, V, da LGPD).',
  ]);

  if (o.login || o.loja) add('Registros de acesso', [
    `Guardamos os registros de acesso ao site (endereço IP, data e hora de cada acesso) em sigilo e em ambiente seguro por 6 (seis) meses. ${pj
      ? 'Isso é uma obrigação legal (art. 7º, II) prevista no art. 15 do Marco Civil da Internet (Lei nº 12.965/2014) para empresas que mantêm aplicações na internet.'
      : 'Fazemos isso por segurança e para prevenir fraudes, com base no legítimo interesse (art. 7º, IX, da LGPD), seguindo o prazo do art. 15 do Marco Civil da Internet (Lei nº 12.965/2014).'} Esses registros só são entregues a terceiros com ordem judicial.`,
  ]);

  if (o.saude) add('Dados de saúde (dados sensíveis)', [
    'Para atender você, podemos precisar de informações sobre a sua saúde, como queixas, histórico, exames e tratamentos. A LGPD chama esses dados de sensíveis (art. 5º, II) e exige cuidado redobrado com eles.',
    'Base legal: tutela da saúde, em procedimento feito por profissionais de saúde ou serviços de saúde (art. 11, II, "f", da LGPD), e cumprimento de obrigação legal ou regulatória, como as normas que obrigam a manter registro dos atendimentos (art. 11, II, "a"). Quando o uso não se encaixar nessas hipóteses, pedimos antes o seu consentimento específico e destacado (art. 11, I).',
    'Só quem participa do seu atendimento tem acesso a esses dados, e nunca os usamos para publicidade.',
  ]);

  if (o.criancas) add('Crianças e adolescentes', [
    'Nosso público inclui crianças (até 12 anos incompletos) e adolescentes (de 12 a 18 anos), como define o Estatuto da Criança e do Adolescente (Lei nº 8.069/1990, art. 2º). Tratamos esses dados sempre no melhor interesse deles (art. 14 da LGPD). Pais e responsáveis podem pedir a qualquer momento para ver, corrigir ou apagar os dados, pelos canais da seção "Como pedir seus direitos".',
    'Na prática:',
  ], [
    'dados de crianças só são usados com o consentimento específico e em destaque de pelo menos um dos pais ou do responsável legal (art. 14, § 1º);',
    'sem esse consentimento, só coletamos o necessário para contatar os pais ou o responsável, uma única vez e sem guardar, ou para proteger a criança, e nunca repassamos esses dados a terceiros (art. 14, § 3º);',
    'não pedimos mais dados do que o estritamente necessário para a participação em qualquer atividade (art. 14, § 4º);',
    'fazemos esforços razoáveis para confirmar que o consentimento foi dado pelo responsável (art. 14, § 5º).',
  ]);

  const algumCookie = o.cookies || o.analytics || o.meta;
  const cookieList = [];
  if (o.cookies) cookieList.push('Cookies necessários: fazem o site funcionar, por exemplo para lembrar suas preferências e manter o site seguro. Base legal: legítimo interesse (art. 7º, IX, e art. 10 da LGPD).');
  if (o.analytics) cookieList.push(`Google Analytics (estatísticas): conta quantas pessoas visitam o site, de onde vêm e quais páginas leem, para melhorarmos o conteúdo. Esses dados são tratados pelo Google. ${consentimento}`);
  if (o.meta) cookieList.push(`Meta Pixel (publicidade): registra visitas e ações no site para medir e mostrar anúncios no Facebook e no Instagram, inclusive para quem já visitou o site. Esses dados são tratados pela Meta. ${consentimento}`);
  add('Cookies', [
    'Cookies são pequenos arquivos que o site guarda no seu navegador para lembrar informações entre uma página e outra.',
    ...(!o.analytics && !o.meta ? ['Hoje este site não usa cookies de estatística nem de publicidade. Se isso mudar, atualizamos esta política e só ativamos esse tipo de cookie depois que você aceitar.'] : []),
    ...(algumCookie ? [`Você pode apagar ou bloquear cookies nas configurações do seu navegador (Chrome, Safari, Firefox, Edge e outros).${o.cookies ? ' Bloquear os cookies necessários pode fazer partes do site pararem de funcionar.' : ''}`] : []),
    ...(o.analytics || o.meta ? [`Você pode retirar o consentimento quando quiser, de graça e de forma fácil, pelo aviso de cookies do site ou pedindo pelo e-mail ${email} (art. 8º, § 5º, da LGPD).`] : []),
    ...(algumCookie ? ['Os cookies que usamos:'] : []),
  ], algumCookie ? cookieList : undefined);

  add('Com quem compartilhamos', [
    'Não vendemos seus dados. Quem presta serviço em nosso nome só pode usar os dados para esse serviço. Você pode pedir a lista completa de com quem compartilhamos (art. 18, VII, da LGPD).',
    'Compartilhamos só o necessário com:',
  ], [
    'a empresa de hospedagem do site, que guarda os arquivos do site e os dados técnicos de acesso;',
    ...(o.contato ? ['o serviço de e-mail que recebe as mensagens do formulário de contato;'] : []),
    ...(o.whatsapp ? ['o WhatsApp (Meta), por onde acontecem as conversas;'] : []),
    ...(o.agendamento ? ['o sistema de agendamento que usamos, que guarda os horários marcados;'] : []),
    ...(o.newsletter ? ['a ferramenta de envio da newsletter, que guarda a lista de assinantes;'] : []),
    ...(o.loja ? [`${proc || 'a empresa de pagamento'}, que processa os pagamentos, e a empresa de entrega, quando a compra é enviada;`] : []),
    ...(o.analytics ? ['o Google, que fornece o Google Analytics;'] : []),
    ...(o.meta ? ['a Meta (Facebook e Instagram), que fornece o Meta Pixel e as ferramentas de anúncio;'] : []),
    'autoridades públicas e a Justiça, quando a lei ou uma ordem judicial exigir.',
  ]);

  if (o.exterior || o.analytics || o.meta) add('Transferência internacional de dados', [
    'Alguns serviços que usamos tratam dados fora do Brasil. Essa transferência só é feita nas hipóteses permitidas pelo art. 33 da LGPD, como para países com proteção de dados adequada, com garantias contratuais oferecidas pelo fornecedor (por exemplo, cláusulas-padrão contratuais) ou quando é necessária para cumprir o contrato com você.',
    'Os serviços que tratam dados fora do Brasil são:',
  ], [
    ...(o.exterior ? ['nossa hospedagem ou armazenamento de dados, que usa servidores fora do Brasil;'] : []),
    ...(o.analytics ? ['Google Analytics (Google);'] : []),
    ...(o.meta ? ['Meta Pixel (Meta);'] : []),
  ]);

  add('Por quanto tempo guardamos', [
    'Guardamos seus dados só pelo tempo necessário para cada finalidade. Quando a finalidade termina, ou quando você pede, apagamos os dados, exceto quando a lei nos obriga a guardar por mais tempo (arts. 15 e 16 da LGPD).',
  ], [
    'dados técnicos de visita: pelo prazo definido pela empresa de hospedagem;',
    ...(o.contato ? ['mensagens do formulário de contato: até o fim do atendimento;'] : []),
    ...(o.whatsapp ? ['conversas no WhatsApp: enquanto forem necessárias para o atendimento e o seu histórico com a gente;'] : []),
    ...(o.agendamento ? ['agendamentos: enquanto houver horário marcado e pelo tempo necessário para o histórico de atendimentos;'] : []),
    ...(o.newsletter ? ['e-mail da newsletter: até você cancelar a inscrição;'] : []),
    ...(o.loja ? ['dados de compras e notas fiscais: pelo prazo que a legislação fiscal e de defesa do consumidor exigir;'] : []),
    ...(o.login ? ['dados da conta na área do cliente: enquanto a conta estiver ativa; depois, só o que a lei mandar guardar;'] : []),
    ...(o.login || o.loja ? ['registros de acesso: 6 (seis) meses (art. 15 do Marco Civil da Internet);'] : []),
    ...(o.saude ? ['dados de saúde: pelo prazo exigido pelas normas da profissão de saúde e pela legislação sanitária;'] : []),
    ...(algumCookie ? ['cookies: pelo prazo definido em cada um; você pode apagá-los quando quiser no navegador;'] : []),
  ]);

  add('Segurança', [
    'Nenhum sistema é 100% seguro. Se acontecer um incidente de segurança que possa trazer risco ou dano relevante para você, avisamos você e a Agência Nacional de Proteção de Dados (ANPD), como manda o art. 48 da LGPD.',
    'Adotamos medidas técnicas e administrativas para proteger seus dados contra acesso não autorizado, perda, vazamento ou uso indevido (art. 46 da LGPD), como:',
  ], [
    'acesso aos dados só para quem precisa deles para trabalhar;',
    'senhas fortes e verificação em duas etapas nas contas e sistemas que guardam dados;',
    'conexão segura (HTTPS) no site;',
    'fornecedores que também se comprometem a proteger os dados.',
  ]);

  add('Seus direitos', [
    'A LGPD (art. 18) garante que você pode, a qualquer momento e de graça:',
  ], [
    'confirmar se tratamos dados seus;',
    'acessar os seus dados;',
    'corrigir dados incompletos, errados ou desatualizados;',
    'pedir a anonimização, o bloqueio ou a eliminação de dados desnecessários, excessivos ou tratados em desacordo com a LGPD;',
    'pedir a portabilidade dos seus dados para outro fornecedor, conforme as regras da ANPD;',
    'pedir a eliminação dos dados tratados com o seu consentimento, exceto quando a lei permite guardar (art. 16);',
    'saber com quais empresas e órgãos públicos compartilhamos seus dados;',
    'saber que você pode não dar o consentimento e o que acontece se não der;',
    'revogar o consentimento quando quiser.',
  ]);

  const encarregado = encNome
    ? `Nosso encarregado pelo tratamento de dados pessoais (art. 41 da LGPD) é ${encNome}${encEmail ? `, e-mail ${encEmail}` : ''}. Ele recebe reclamações e pedidos sobre seus dados e se comunica com a ANPD.`
    : encEmail
      ? `O contato do nosso encarregado pelo tratamento de dados pessoais (art. 41 da LGPD) é ${encEmail}.`
      : `Como agente de tratamento de pequeno porte, não indicamos um encarregado, como permite o art. 11 da Resolução CD/ANPD nº 2/2022. O canal para qualquer assunto sobre seus dados é o e-mail ${email}.`;
  add('Como pedir seus direitos', [
    `Mande seu pedido para ${email}. Para proteger você, podemos pedir uma confirmação de identidade antes de mostrar ou alterar dados. O atendimento é gratuito (art. 18, § 5º, da LGPD).`,
    'Respondemos pedidos de confirmação e de acesso aos dados em até 15 dias (art. 19, II, da LGPD) e os demais pedidos o mais rápido possível. Você também pode se opor a um uso dos seus dados feito sem consentimento, se ele descumprir a LGPD (art. 18, § 2º).',
    encarregado,
    'Se não ficar satisfeito, você pode reclamar à Agência Nacional de Proteção de Dados (ANPD), pelo site gov.br/anpd, ou a um órgão de defesa do consumidor, como o Procon (art. 18, §§ 1º e 8º, da LGPD).',
  ]);

  add('Mudanças nesta política', [
    `Podemos atualizar esta política quando mudarmos a forma de tratar dados ou quando a lei mudar. A versão em vigor fica sempre publicada ${site ? `em ${site}` : 'no nosso site'}. Se a mudança afetar algo que depende do seu consentimento, avisamos com destaque e você pode retirar o consentimento se não concordar (art. 8º, § 6º, e art. 9º, § 2º, da LGPD).`,
    `Última atualização: ${formatarData(input.data) || '[data]'}.`,
  ]);

  // Lista termina em ponto, não no ponto e vírgula do item que ficou por último.
  for (const s of sections) if (s.list?.length) s.list[s.list.length - 1] = s.list.at(-1).replace(/;$/, '.');

  // Avisos para o dono do negócio, mostrados ao lado da prévia. Não entram no texto.
  const avisos = [];
  if (o.saude) avisos.push('Dados de saúde são sensíveis (art. 11 da LGPD). Se você trata muitos desses dados, ou de um jeito que possa afetar muito os pacientes, a ANPD pode considerar o tratamento de alto risco (Resolução CD/ANPD nº 2/2022, art. 4º), e aí as facilidades de pequeno porte, como dispensar o encarregado, deixam de valer. Revise este texto com um advogado e peça consentimento específico e destacado quando ele for a base legal.');
  if (o.criancas) avisos.push('Dados de crianças exigem consentimento específico de pelo menos um dos pais ou do responsável (art. 14, § 1º) e podem tornar o tratamento de alto risco (Resolução CD/ANPD nº 2/2022, art. 4º). Revise este texto com um advogado antes de publicar.');
  if (o.analytics || o.meta) avisos.push('Com Google Analytics ou Meta Pixel, o site precisa de um aviso de cookies com botões "Aceitar" e "Rejeitar" com o mesmo destaque, e esses cookies devem ficar desligados até a pessoa aceitar (Guia de Cookies da ANPD, 2022). Esta política não instala esse aviso.');

  return { title: `Política de Privacidade — ${nome}`, sections, avisos };
}

export function toPlainText(policy) {
  const blocos = [policy.title];
  for (const s of policy.sections) {
    blocos.push([s.heading, ...s.paragraphs].join('\n\n') + (s.list ? '\n' + s.list.map((i) => `- ${i}`).join('\n') : ''));
  }
  return blocos.join('\n\n') + '\n';
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function toHtml(policy) {
  const corpo = policy.sections.map((s) => [
    '<section>',
    `<h2>${esc(s.heading)}</h2>`,
    ...s.paragraphs.map((p) => `<p>${esc(p)}</p>`),
    ...(s.list ? ['<ul>', ...s.list.map((i) => `<li>${esc(i)}</li>`), '</ul>'] : []),
    '</section>',
  ].join('\n')).join('\n');
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(policy.title)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;padding:16px;line-height:1.6;color:#111;background:#fff}</style>
</head>
<body>
<main>
<h1>${esc(policy.title)}</h1>
${corpo}
</main>
</body>
</html>
`;
}
