// Gerador de termos de uso — lógica pura, sem DOM.
// Conferido em 10/10/2026 nos textos do planalto.gov.br: Código de Defesa do Consumidor (Lei 8.078/1990,
// compilada) arts. 18, 20, 25, 26, 30, 35, 39, 42, 46, 47, 49, 50, 51, 54 e 101; Decreto 7.962/2013
// arts. 2º, 4º e 5º; Marco Civil da Internet (Lei 12.965/2014) art. 7º, X; Código Civil arts. 3º e 4º;
// Lei 9.610/1998 arts. 7º, 29 e 46, III; Lei 15.211/2025 arts. 1º e 41-A. LGPD só por referência.
// Regra da casa: nada que o CDC anula (art. 51). Sem exclusão de responsabilidade, sem foro fixo,
// sem arbitragem, sem mudança unilateral de preço ou do contratado, sem cancelamento só de um lado.
// O art. 19 do Marco Civil (responsabilidade por conteúdo de terceiros) fica de fora de propósito:
// o gerador não escreve cláusula que limite responsabilidade.

import { validarDocumento, formatarData } from '../gerador-de-politica-de-privacidade/politica.mjs';
import { normalizePhone, formatPhone, ERROS } from '../gerador-de-link-whatsapp/whatsapp.mjs';

export const TIPOS = ['institucional', 'loja', 'servicos', 'membros'];
export const OPCOES = ['contas', 'pagamentos', 'entregas', 'cancelamento', 'conteudo', 'propriedade', 'menores'];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE = /^(https?:\/\/)?[^\s/$.?#]+\.[^\s]+$/i;
const CDC = 'Código de Defesa do Consumidor';
const DEC = 'Decreto nº 7.962/2013';

const limpa = (s) => String(s ?? '').toUpperCase().replace(/[.\-/\s]/g, '');
const formatarDoc = (doc) => {
  const c = limpa(doc);
  return c.length === 11
    ? `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`
    : `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
};
// ['a', 'b', 'c'] → 'a, b ou c'
const junta = (xs, conj) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${conj} ${xs.at(-1)}`);

// Quem vende ou recebe pagamento pela internet entra no Decreto 7.962/2013 e no art. 49 do CDC.
function ler(input) {
  const tipo = TIPOS.includes(input.tipo) ? input.tipo : 'institucional';
  const o = Object.fromEntries(OPCOES.map((k) => [k, Boolean(input.opcoes?.[k])]));
  return { tipo, o, vende: tipo === 'loja' || o.pagamentos };
}

// Erros por campo, prontos para mostrar ao lado de cada um. Vazio = tudo certo.
export function validar(i = {}) {
  const t = (k) => String(i[k] ?? '').trim();
  const { vende } = ler(i);
  const e = {};
  if (!t('nome')) e.nome = 'Escreva o nome do seu negócio ou a razão social.';
  const doc = validarDocumento(i.documento);
  if (!doc.valido) e.documento = 'Esse CNPJ ou CPF tem dígito errado. Confira.';
  else if (vende && !doc.tipo) e.documento = `Quem vende pela internet precisa mostrar o CNPJ ou o CPF (${DEC}, art. 2º, I).`;
  if (vende && !t('endereco')) e.endereco = `Quem vende pela internet precisa mostrar o endereço físico (${DEC}, art. 2º, II).`;
  if (!EMAIL.test(t('email'))) e.email = 'Escreva um e-mail válido, como contato@seunegocio.com.br.';
  if (t('whatsapp')) {
    const w = normalizePhone(t('whatsapp'));
    if (!w.ok) e.whatsapp = ERROS[w.error];
  }
  if (t('site') && !SITE.test(t('site'))) e.site = 'Endereço inválido. Exemplo: seunegocio.com.br';
  if (!formatarData(i.data)) e.data = 'Escolha uma data válida.';
  return e;
}

export function buildTermos(input = {}) {
  const { tipo, o, vende } = ler(input);
  const t = (k) => String(input[k] ?? '').trim();
  const nome = t('nome') || '[nome do negócio]';
  const email = t('email') || '[e-mail de atendimento]';
  const site = t('site');
  const endereco = t('endereco');
  const doc = validarDocumento(input.documento);
  const zap = normalizePhone(t('whatsapp'));
  const whatsapp = t('whatsapp') && zap.ok ? formatPhone(zap.digits) : '';
  const canais = `pelo e-mail ${email}${whatsapp ? ` ou pelo WhatsApp ${whatsapp}` : ''}`;
  const servico = tipo === 'servicos' || tipo === 'membros';

  const sections = [];
  const add = (heading, paragraphs, list, destaque) =>
    sections.push({ heading, paragraphs, ...(list && { list }), ...(destaque && { destaque }) });

  add('Quem somos', [
    `Estes termos de uso explicam as regras para usar ${site ? `o site ${site}` : 'o nosso site'}${{
      institucional: '', loja: ' e comprar na nossa loja virtual', servicos: ' e contratar os nossos serviços',
      membros: ' e a nossa área de membros' }[tipo]}, mantido por ${nome}.`,
    vende ? `Nossos dados, como pede o ${DEC} (art. 2º), que regula o comércio eletrônico:` : 'Nossos dados:',
  ], [
    `Nome ou razão social: ${nome}`,
    doc.tipo && doc.valido ? `${doc.tipo.toUpperCase()}: ${formatarDoc(input.documento)}` : vende && 'CNPJ ou CPF: [CNPJ ou CPF]',
    endereco ? `Endereço: ${endereco}` : vende && 'Endereço: [endereço]',
    `E-mail: ${email}`,
    whatsapp && `WhatsApp: ${whatsapp}`,
    site && `Site: ${site}`,
  ].filter(Boolean));

  add('Aceitação destes termos', [
    `Leia estes termos antes de usar o site${vende ? ' ou fazer uma compra' : ''}. Ao ${junta(['usar o site', o.contas && 'criar uma conta', vende && 'concluir uma compra'].filter(Boolean), 'ou')}, você concorda com eles. Se não concordar, não use o site.`,
    `Estes termos ficam publicados no site, sempre disponíveis para consulta, e você pode salvá-los ou imprimi-los quando quiser${vende ? ` (${DEC}, art. 4º, IV)` : ''}.`,
    `Nada nestes termos tira os direitos que o ${CDC} (Lei nº 8.078/1990) garante a você. Se alguma regra daqui permitir mais de uma leitura, vale a mais favorável a você (art. 47 do ${CDC}).`,
  ]);

  if (tipo === 'institucional') add('Sobre o site', [
    `Este site apresenta ${nome} e os produtos e serviços que oferecemos. Procuramos manter as informações corretas e atualizadas; se você notar algum erro, avise ${canais}.`,
    `Ofertas e preços divulgados aqui de forma precisa obrigam a gente a cumprir o que foi anunciado (art. 30 do ${CDC}).`,
  ]);

  if (tipo === 'loja') add('Compras na loja virtual', [
    `Em cada produto mostramos as características principais, inclusive riscos à saúde e à segurança quando houver, o preço e a disponibilidade. Antes de você fechar o pedido, mostramos um resumo com o preço total, o frete e qualquer outra despesa separados, as formas de pagamento, o prazo de entrega e eventuais restrições da oferta (${DEC}, arts. 2º e 4º, I).`,
    `Antes de confirmar, você pode revisar e corrigir o pedido. Assim que recebemos o pedido, mandamos a confirmação, e o resumo da compra fica disponível para você guardar (${DEC}, art. 4º, II, III e IV).`,
    `O que anunciamos vale: a oferta obriga a loja e faz parte do contrato (art. 30 do ${CDC}). Se um produto que você comprou ficar indisponível, avisamos, e você escolhe entre exigir o cumprimento da oferta, levar outro produto equivalente ou cancelar a compra e receber de volta o que pagou, corrigido (art. 35).`,
  ]);

  if (tipo === 'servicos') add('Agendamentos e serviços', [
    `Antes de você contratar, informamos o que está incluído em cada serviço, o preço e as formas de pagamento. Quando o serviço depender de orçamento, ele é feito antes, e só começamos com a sua autorização (art. 39, VI, do ${CDC}).`,
    'Confirmamos cada agendamento por mensagem. Se precisarmos remarcar, avisamos o quanto antes, e você escolhe uma nova data ou recebe de volta o que já pagou.',
  ]);

  if (tipo === 'membros') add('Área de membros e assinatura', [
    'Antes da contratação, informamos o que cada plano inclui, o preço, a forma de cobrança e a duração. O acesso é pessoal e não pode ser compartilhado nem revendido.',
    `Podemos acrescentar melhorias ao serviço, mas o que você contratou não é reduzido nem piorado durante o período já pago, e o preço desse período não muda (art. 51, X e XIII, do ${CDC}).`,
    'Fazemos o possível para manter a área de membros no ar e avisamos com antecedência as manutenções programadas.',
  ], null, true);

  if (o.contas) add('Contas de usuário', [
    'Algumas funções do site pedem uma conta. Para criar a sua, informe dados verdadeiros e mantenha-os atualizados.',
    'A conta é pessoal. Guarde sua senha em segredo e avise a gente assim que suspeitar que outra pessoa usou a sua conta.',
    `Você pode encerrar a sua conta quando quiser, pedindo ${canais}. Podemos suspender ou encerrar uma conta usada para descumprir estes termos ou a lei, e avisamos o motivo. Se encerrarmos uma conta com serviço pago sem que você tenha descumprido estes termos, devolvemos o valor proporcional ao período que falta.`,
    'Se você pedir o encerramento, apagamos os seus dados pessoais, menos os que a lei manda guardar, como explica a nossa Política de Privacidade (art. 7º, X, do Marco Civil da Internet, Lei nº 12.965/2014).',
  ], null, true);

  if (o.pagamentos) add('Pagamentos', [
    `As formas de pagamento aceitas aparecem antes de você concluir a compra, e o pagamento é feito em ambiente seguro (${DEC}, art. 4º, VII).`,
    `O valor cobrado é o que aparece no resumo da compra. Não acrescentamos nenhum valor depois sem você concordar (art. 51, X, do ${CDC}).${tipo === 'membros' ? ' Na assinatura, a cobrança se repete a cada período informado na contratação, até você cancelar.' : ''}`,
    `Se cobrarmos um valor indevido, devolvemos em dobro o que você pagou a mais, com correção e juros, salvo engano justificável (art. 42, parágrafo único, do ${CDC}).`,
  ]);

  if (o.entregas) add('Entregas', [
    'O prazo e o valor da entrega aparecem antes de você fechar o pedido, separados do preço do produto. Entregamos no endereço que você informar; confira com cuidado, porque endereço errado ou incompleto atrasa a entrega.',
    `Se o pedido não chegar no prazo informado, você pode exigir a entrega, aceitar outro produto equivalente ou cancelar e receber de volta o que pagou, corrigido (art. 35 do ${CDC}).`,
    `Ao receber, confira o pedido. Se algo vier errado ou danificado, fale com a gente ${canais}.`,
  ]);

  if (vende) add('Direito de arrependimento', [
    `Comprou ou contratou pela internet? Você pode desistir em até 7 (sete) dias, contados da data da compra ou do recebimento do produto ou serviço, o que for mais tarde, sem precisar dizer o motivo (art. 49 do ${CDC}).`,
    `Para desistir, use a mesma ferramenta da compra ou fale com a gente ${canais} (${DEC}, art. 5º, § 1º). Confirmamos na hora que recebemos o seu pedido de desistência (art. 5º, § 4º).`,
    `Devolvemos de imediato tudo o que você pagou, a qualquer título, inclusive o frete, se houver, com correção monetária (art. 49, parágrafo único, do ${CDC}). Se você pagou com cartão, avisamos na hora a operadora para que a cobrança não seja lançada na fatura ou, se já foi, seja estornada (${DEC}, art. 5º, § 3º). A desistência também cancela, sem custo, contratos ligados à compra, como garantia estendida ou seguro (art. 5º, § 2º).${tipo === 'loja' ? ' Combinamos com você como o produto volta, sem custo para você.' : ''}`,
  ]);

  if (tipo === 'loja') add('Trocas, defeitos e garantia', [
    `Confira o produto ao receber. Se ele tiver defeito ou vier diferente do anunciado, você pode reclamar em até 30 dias, para produtos não duráveis (como alimentos), ou 90 dias, para produtos duráveis (como eletrônicos e móveis), contados da entrega. Se o defeito estiver escondido, o prazo começa quando ele aparecer (art. 26 do ${CDC}).`,
    'Se não resolvermos o problema em até 30 dias, você escolhe: trocar por outro produto igual em perfeito estado, receber de volta o valor pago, corrigido, ou ter um desconto proporcional no preço (art. 18, § 1º).',
    'Se oferecermos garantia própria, ela se soma à garantia da lei e não a substitui (art. 50).',
  ]);

  if (servico) add('Garantia dos serviços', [
    `Se um serviço tiver falha ou não sair como foi combinado, você pode reclamar em até 30 dias, para serviços não duráveis, ou 90 dias, para serviços duráveis, contados do fim do serviço. Se a falha estiver escondida, o prazo começa quando ela aparecer (art. 26 do ${CDC}).`,
    'Você escolhe: refazer o serviço sem custo, quando for possível, receber de volta o valor pago, corrigido, ou ter um desconto proporcional no preço (art. 20).',
  ]);

  if (o.cancelamento) add('Cancelamento e reembolso', [
    vende
      ? `Nos primeiros 7 (sete) dias de uma contratação pela internet, vale o direito de arrependimento explicado acima, com devolução de tudo o que foi pago (art. 49 do ${CDC}).`
      : `Se você contratou fora do nosso estabelecimento, como pela internet, por telefone ou pelo WhatsApp, pode desistir em até 7 (sete) dias, sem dizer o motivo, e devolvemos de imediato tudo o que você pagou, corrigido (art. 49 do ${CDC}).`,
    tipo === 'membros'
      ? `Depois desse prazo, você pode cancelar a assinatura quando quiser, pelo mesmo meio usado para contratar ou ${canais}. As próximas cobranças param, e o acesso continua até o fim do período já pago. Em planos pagos adiantado por mais de um mês, devolvemos o valor proporcional aos meses inteiros que faltam.`
      : `Depois desse prazo, você pode cancelar quando quiser, pedindo ${canais}.${tipo === 'servicos' ? ' Para remarcar ou cancelar um horário, avise com a maior antecedência possível.' : ''} Devolvemos o valor pago por serviços que ainda não foram prestados.`,
    'Se nós precisarmos cancelar, avisamos o quanto antes e devolvemos tudo o que você pagou pelo que não foi prestado. Você tem o mesmo direito de cancelar que nós (art. 51, XI, do Código de Defesa do Consumidor).',
  ], null, true);

  add('Regras de uso do site', [
    'Quem descumprir estas regras pode ter o acesso ao site bloqueado. Ao usar o site, você se compromete a:',
  ], [
    'dar informações verdadeiras quando preencher formulários ou fizer pedidos;',
    'não usar o site para nada ilegal ou que prejudique outras pessoas;',
    'não tentar invadir, derrubar ou sobrecarregar o site, nem enviar vírus ou programas maliciosos;',
    'não copiar o conteúdo do site em massa com robôs ou programas automáticos;',
    'não se passar por outra pessoa.',
  ], true);

  if (o.conteudo) add('Conteúdo enviado por você', [
    'Se você publicar avaliações, comentários, fotos ou outros conteúdos no site, você continua sendo o autor e responde pelo que publicar. Só publique o que é seu ou o que você tem autorização para usar.',
    'Ao publicar, você nos autoriza, sem pagamento, a mostrar esse conteúdo no site, no lugar onde foi publicado, enquanto ele estiver no ar. Você pode pedir a remoção quando quiser.',
    'Não é permitido publicar conteúdo ilegal, ofensivo, discriminatório, enganoso, com dados pessoais de outras pessoas sem autorização ou que viole direitos de alguém. Podemos remover o que descumprir estas regras e, quando removermos algo seu, explicamos o motivo. Não removemos avaliações só por serem negativas.',
    `Se algum conteúdo publicado aqui viola os seus direitos, avise ${canais}, dizendo onde ele está, e analisamos o pedido com rapidez.`,
  ], null, true);

  if (o.propriedade) add('Propriedade intelectual', [
    `Os textos, fotos, vídeos, ilustrações e demais conteúdos do site pertencem a ${nome} ou são usados com autorização dos autores, e são protegidos pela Lei de Direitos Autorais (Lei nº 9.610/1998, art. 7º).`,
    `Você pode compartilhar links das nossas páginas e citar trechos para estudo, crítica ou debate, indicando a fonte (art. 46, III). Para copiar, reproduzir ou usar o conteúdo de outra forma, peça autorização antes (art. 29).${tipo === 'membros' ? ' O conteúdo da área de membros é para uso pessoal de quem contratou e não pode ser redistribuído nem revendido.' : ''}`,
    `O nome ${nome}, o logotipo e os demais sinais que identificam o nosso negócio não podem ser usados por outras pessoas para identificar produtos, serviços ou negócios, nem para dar a entender que somos parceiros, sem a nossa autorização.`,
  ]);

  if (o.menores) add('Menores de idade', [
    'Pelo Código Civil, menores de 16 anos não podem fechar contratos sozinhos, e quem tem de 16 a 18 anos só pode com a assistência dos pais ou do responsável legal (arts. 3º e 4º do Código Civil).',
    `Por isso, menores de 18 anos só podem ${junta([vende && 'comprar', o.contas && 'criar conta', 'contratar'].filter(Boolean), 'ou')} pelo site com a autorização e o acompanhamento dos pais ou do responsável legal. Dados pessoais de crianças e adolescentes seguem as regras especiais descritas na nossa Política de Privacidade.`,
  ]);

  add('Privacidade e dados pessoais', [
    'Como coletamos, usamos e protegemos os seus dados pessoais está explicado na nossa Política de Privacidade, publicada no site, que segue a Lei Geral de Proteção de Dados Pessoais (LGPD, Lei nº 13.709/2018). Ela faz parte destes termos.',
  ]);

  add('Responsabilidades', [
    `Respondemos pelos produtos e serviços que oferecemos, como manda o ${CDC}. Nenhuma regra destes termos afasta ou diminui essa responsabilidade (arts. 25 e 51, I, do ${CDC}).`,
    'O site pode ficar fora do ar por alguns momentos para manutenção ou por problemas técnicos. Trabalhamos para resolver rápido e, quando a manutenção é programada, avisamos antes sempre que possível.',
    'O site pode ter links para sites de outras empresas, como redes sociais e mapas. Esses sites têm regras próprias, e vale a pena ler os termos de cada um.',
  ]);

  add('Atendimento', [
    vende
      ? `Fale com a gente ${canais} para tirar dúvidas, fazer reclamações ou pedir suspensão ou cancelamento. Confirmamos na hora que recebemos a sua mensagem, pelo mesmo meio que você usou, e respondemos em até 5 (cinco) dias (${DEC}, art. 4º, V e VI e parágrafo único).`
      : `Fale com a gente ${canais}. Respondemos o mais rápido possível.`,
    'Se não ficar satisfeito, você também pode procurar o Procon da sua cidade ou a plataforma consumidor.gov.br.',
  ]);

  add('Lei aplicável e foro', [
    'Estes termos seguem as leis do Brasil.',
    `Se você for consumidor, pode entrar com uma ação contra nós na Justiça da cidade onde mora (art. 101, I, do ${CDC}). Antes disso, se quiser, fale com a gente, porque muitas vezes dá para resolver mais rápido. Procurar a gente antes não é obrigatório (art. 51, XVII).`,
  ]);

  add('Mudanças nestes termos', [
    `Podemos atualizar estes termos quando o negócio ou a lei mudar. A versão em vigor fica sempre publicada ${site ? `em ${site}` : 'no nosso site'}, com a data da última atualização.`,
    `Mudanças não alteram compras ou contratações já feitas: para elas, valem os termos da data em que você contratou (art. 51, XIII, do ${CDC}).`,
    `Última atualização: ${formatarData(input.data) || '[data]'}.`,
  ]);

  // Avisos para o dono do negócio, mostrados ao lado da prévia. Não entram no texto.
  const avisos = [];
  if (vende) avisos.push(`Além destes termos, a lei pede que o nome, o CNPJ ou CPF, o endereço e os contatos fiquem em destaque no site, por exemplo no rodapé de todas as páginas (${DEC}, art. 2º). O site também precisa mostrar o resumo do pedido antes da compra, deixar corrigir erros, confirmar o pedido na hora e ter um jeito claro de pedir o arrependimento (arts. 4º e 5º). Estes termos prometem isso: confira se o seu site faz.`);
  if (o.cancelamento) avisos.push(`Se você quer cobrar taxa por cancelamento em cima da hora ou por falta, escreva a regra com um valor proporcional, informe antes da contratação e deixe em destaque. Taxa exagerada é nula (${CDC}, arts. 51, IV, e 54, § 4º).`);
  if (o.menores) avisos.push('Se o seu site ou app é feito para crianças e adolescentes ou tende a ser usado por eles, o Estatuto Digital da Criança e do Adolescente (Lei nº 15.211/2025), em vigor desde 17 de março de 2026, traz obrigações extras. Revise com um advogado antes de publicar.');
  const marcadas = sections.filter((s) => s.destaque).map((s) => `“${s.heading}”`);
  avisos.unshift(`Pela lei, regras que limitam direitos do consumidor devem aparecer em destaque, e o texto deve ter letra de tamanho 12 ou maior (${CDC}, art. 54, §§ 3º e 4º). O arquivo .html já sai assim. Se você colar o texto, deixe em negrito ${marcadas.length > 1 ? 'as seções' : 'a seção'} ${junta(marcadas, 'e')}.`);

  return { title: `Termos de Uso — ${nome}`, sections, avisos };
}

export function toPlainText(termos) {
  const blocos = [termos.title];
  for (const s of termos.sections) {
    blocos.push([s.heading, ...s.paragraphs].join('\n\n') + (s.list ? '\n' + s.list.map((i) => `- ${i}`).join('\n') : ''));
  }
  return blocos.join('\n\n') + '\n';
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// 16px = 12pt: o mínimo do art. 54, § 3º, do CDC para contrato de adesão.
export function toHtml(termos) {
  const corpo = termos.sections.map((s) => [
    s.destaque ? '<section class="destaque">' : '<section>',
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
<title>${esc(termos.title)}</title>
<style>body{font-family:system-ui,sans-serif;font-size:16px;max-width:720px;margin:0 auto;padding:16px;line-height:1.6;color:#111;background:#fff}.destaque{border-left:4px solid #111;padding-left:12px;font-weight:600}</style>
</head>
<body>
<main>
<h1>${esc(termos.title)}</h1>
${corpo}
</main>
</body>
</html>
`;
}
