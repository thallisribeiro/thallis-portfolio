---
title: O que causou a queda do GitHub em 17 de agosto de 2026, e por que o Copilot voltou quase 4h30 depois
date: 2026-09-03
summary: Uma política de autoescala que observava a peça errada deixou o GitHub degradado por 7 horas e 47 minutos. Na recuperação, um bug latente de retry no Visual Studio Code multiplicou por cerca de 10 o tráfego que chegava ao serviço de token do Copilot, e esse serviço só se restabeleceu quase 4 horas e 30 minutos depois dos demais.
tema: Engenharia reversa de produto
peca: 2026-09-03/2026-09-03-a
image: /assets/posts/o-que-causou-a-queda-do-github-em-17-de-agosto-de-2026-e-por-que-o-cop.webp
---

Em 17 de agosto de 2026, das 13:28 às 21:15 UTC, o GitHub operou degradado por 7 horas e 47 minutos. Não foi indisponibilidade total: no pico, cerca de 20% das requisições de web e de API falhavam, e cerca de 50% dos downloads de arquivo compactado e de conteúdo bruto (raw). Issues, Pull Requests, APIs, Actions e Copilot entraram na lista de serviços com erros elevados, junto com a autenticação SAML/OIDC, o SCIM e o Team Sync.

O detalhe técnico do caso está na página oficial do incidente no GitHub Status, publicada pela própria empresa. É a parte descrevendo o próprio incidente, não apuração independente. A duração de 7h47min foi confirmada também pelo The Register em 19 de agosto de 2026 e pelo StatusCake na mesma data.

## Onde a falha começou

Segundo a página do incidente, um novo pico de tráfego saturou a rede dos balanceadores de carga do data center Central US. Nesse ambiente, cada serviço roda ao lado de um pod sidecar do Istio, a peça que cuida do tráfego entre os serviços. Um desses sidecars ultrapassou o próprio limite de concorrência e não autoescalou.

A falha não parou ali. Ela cascateou até quatro nós de HAProxy esgotarem seus limites de fluxo, degradando o caminho de autenticação do gateway. Foi por isso que entrar na conta virou erro para quem usa login corporativo: latência e falhas de autenticação generalizadas.

## Por que a autoescala não subiu a peça que estava no limite

A explicação do GitHub é específica: o sidecar não escalou "por causa de uma política mal configurada que observava o serviço hospedeiro, mas não os limites do sidecar".

Ou seja, a autoescala não estava desligada. Ela estava ligada e medindo outra coisa. Enquanto a peça ao lado batia no teto de concorrência, o número que a política acompanhava seguia dentro do normal.

## Quando cada serviço voltou

A recuperação foi escalonada. A maioria dos serviços voltou às 16:36 UTC, cerca de 3 horas e 8 minutos depois do começo. O Actions voltou às 18:03 UTC. O Copilot Token Service, o serviço que emite os tokens usados pelo Copilot, só se restabeleceu às 21:02 UTC. O incidente foi encerrado às 21:15 UTC.

Essa diferença é a parte mais importante do caso. As quase 8 horas de janela não descrevem o tempo em que o GitHub inteiro esteve degradado: o grosso da plataforma voltou em pouco mais de três horas. O que arrastou o número foi uma peça só.

## Por que o serviço de token do Copilot demorou quase 4h30 a mais

Nas palavras do GitHub: "respostas atrasadas de um único endpoint interno dispararam um bug latente de retry no VS Code que amplificou o tráfego em aproximadamente 10x". O bug estava no Visual Studio Code, o editor instalado na máquina de quem programa, e nunca havia aparecido antes.

Os números publicados: o tráfego ao Copilot Token Service saiu de 7.000 a 9.000 requisições por segundo, o normal, para 70.000 a 100.000 requisições por segundo. Uma requisição de token que falhava podia disparar várias novas, que também falhavam. O laço se alimentava sozinho, e quanto mais o serviço falhava, mais pedido chegava nele.

Havia um segundo mecanismo de retry no meio, e ele não é o mesmo. O do Visual Studio Code fica no lado do cliente. O outro é o retry do gateway interno do GitHub, cuja lógica a empresa reduziu durante o incidente por mudança de código. A leitura de que a lógica de retry "otimista" entre serviços internos piorou o quadro ao sobrecarregar os balanceadores é da Computing.co.uk, em agosto de 2026.

## Como o GitHub saiu do buraco

Os engenheiros pausaram o HAProxy nos nós problemáticos, reduziram temporariamente a lógica de retry do gateway por um pull request, configuraram os balanceadores para rejeitar com HTTP 403 as requisições de entrada do Copilot Token Service e só então retomaram o tráfego gradualmente, site a site.

Vale reler a terceira parte disso: para o serviço de token voltar a respirar, o GitHub teve que barrar na porta o tráfego do próprio Copilot.

## O que o CTO escreveu três dias depois

Em 20 de agosto de 2026, Vladimir Fedorov, CTO do GitHub, publicou no blog oficial da empresa o post "The August 17 outage, and the work ahead". Nele: "Neither outage was caused by a code or configuration change. Both incidents were capacity failures." As duas falhas citadas são a de 17 de agosto e uma falha do Actions em 6 de agosto de 2026. E também: "If you were trying to ship software that day, we let you down."

O post do CTO não cita Istio, sidecar nem autoescala. Ele fala em "um componente crítico de infraestrutura no data center Central US que falhou em escalar". O detalhe técnico está na página de status, não no post.

O que o post traz de novo é a escala da carga. "Since April, monthly commits have grown from 1.4 billion to 2.9 billion. That growth explains the pressure on our systems, but it does not excuse these outages." Os commits mensais no GitHub foram de 1,4 bilhão em abril de 2026 para 2,9 bilhões em agosto, o dobro em cerca de quatro meses.

Entre os compromissos anunciados: aplicar limites de retry, orçamentos de retry e timeouts variáveis nas interações entre serviços, e revisar alertas de CPU e memória de baixa prioridade para identificar componentes que possam falhar em picos súbitos de tráfego. A página do incidente lista ainda corrigir as políticas de autoescala para considerar a concorrência do sidecar, auditar limites de requisição e escala do Istio nos serviços afetados, revisar retry e backoff em gateways e clientes, corrigir o comportamento do Visual Studio Code que amplificou o tráfego de token e melhorar o monitoramento de capacidade dos balanceadores.

## O que ainda não dá pra afirmar

Nenhuma fonte publica o valor numérico do limite de concorrência do sidecar. O GitHub também não nomeia qual era o "único endpoint interno" cujas respostas atrasadas dispararam o bug do editor. Não foi localizada release note confirmando que a correção do retry do Visual Studio Code já saiu em alguma versão, nem confirmação pública de que as demais ações anunciadas foram concluídas. São compromissos, não entregas.

E há uma ligação que circulou bastante e não está em lugar nenhum das fontes primárias: a de que o pico de tráfego veio de agentes de IA. O GitHub diz que os commits mensais dobraram desde abril e que isso explica a pressão nos sistemas. A empresa não atribui esse crescimento a agentes. Toda ponte entre uma coisa e outra é leitura de terceiros.
