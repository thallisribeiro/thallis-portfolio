---
title: Quanto tempo realmente demora criar um site com IA
date: 2026-08-30
summary: A resposta padrão de 'meses' para criar um site deixou de ser verdade quando a IA elimina o tempo morto entre etapas, sem pular segurança ou revisão.
tema: Site & copy
image: /assets/posts/quanto-tempo-realmente-demora-criar-um-site-com-ia.webp
---

Quanto tempo demora criar um site de verdade? A resposta que a maioria escuta é "meses", e isso custa cliente todo mês que passa esperando. Mas essa resposta parou de ser verdade do jeito que era há alguns anos, e vale entender exatamente o que mudou, e o que não mudou, antes de aceitar o prazo padrão como inevitável.

## Por que a resposta padrão sempre foi "meses"

Levantamento, aprovação, design, desenvolvimento, revisão: cinco etapas, cada uma esperando a anterior terminar. Esse encadeamento sequencial, não a dificuldade técnica em si, é o que normalmente estica um projeto de site por semanas ou meses. Cada etapa também costuma esperar disponibilidade de uma pessoa diferente: o designer que só entra depois que o levantamento fecha, o desenvolvedor que só começa depois que o design é aprovado. Multiplique isso pelo tempo de ida e volta de aprovação, que raramente acontece no mesmo dia, e o prazo de "alguns meses" deixa de ser exagero, vira consequência direta de como o processo é organizado.

## O que muda de verdade quando você usa um squad de IA bem estruturado

Não é mágica, é menos tempo morto entre uma etapa e a próxima. Com um squad de IA bem estruturado, o intervalo entre "aprovar a ideia" e "ver o resultado rodando" encolhe, porque várias etapas que antes esperavam em fila passam a acontecer em sequência rápida, sem os dias de espera entre uma entrega e outra. A diferença não está em pular etapa, está em eliminar o tempo morto entre elas: levantamento vira input estruturado processado na hora, design e desenvolvimento avançam em paralelo em vez de em fila, e revisão acontece a cada entrega em vez de só no fim do projeto inteiro.

## Como é, na prática, o dia a dia de um projeto assim

Descrever "menos tempo morto" em abstrato ajuda pouco, então vale detalhar o que muda na prática. Numa fila tradicional, o levantamento vira um documento que espera aprovação por e-mail, o design espera o levantamento fechar, o desenvolvimento espera o design ser aprovado, e cada uma dessas esperas soma dias, às vezes semanas, mesmo quando o trabalho em si (a parte de execução) levaria horas. Com um squad de IA bem estruturado, o levantamento vira input processado no mesmo fluxo, a primeira fatia funcional (não o site inteiro, uma fatia real e navegável) sobe rápido, e revisão de qualidade acontece a cada entrega, não guardada pro final. Isso não elimina o trabalho, só elimina a fila de espera entre uma etapa e a próxima.

## Caso real: do scaffold ao site no ar em uma tarde

Um site completo de imobiliária foi do zero a uma URL respondendo em produção numa única tarde. É o caso do Eunoimóvel: scaffold com Payload CMS e Next.js, estrutura de squad própria montada pro projeto, e nas horas seguintes a primeira fatia funcional já estava no ar, incluindo hierarquia de localização, cadastro de imóvel premium e página de imóvel, além da correção de duas falhas de segurança reais que o próprio processo de revisão encontrou no caminho (upload de mídia aberto pra qualquer um escrever, e uma brecha que deixava um usuário escalar o próprio nível de permissão sozinho no cadastro).

Bugs de infraestrutura apareceram um atrás do outro nesse mesmo dia, o que é normal pra qualquer projeto novo subindo pra produção pela primeira vez: painel administrativo que não carregava por um arquivo de mapeamento desatualizado, build de produção falhando por incompatibilidade de versão do `npm`, imagem Docker quebrando o servidor em tempo de execução por incompatibilidade de biblioteca, rede customizada não coberta pelas regras de firewall esperadas. Nenhum desses problemas foi pulado ou empurrado pra depois: cada um foi resolvido, um por um, ainda na mesma tarde, até o site responder de verdade num servidor real. Prazo real, verificado, não estimativa de marketing.

## O que não muda (e não deveria mudar mesmo com IA)

Isso não elimina o trabalho difícil. Segurança, performance e revisão de qualidade continuam acontecendo, nada disso é pulado, e vale desconfiar de qualquer processo que promete velocidade cortando exatamente essas três etapas. O que muda é o que você espera pra decidir: em vez de aprovar tudo no escuro por semanas e só ver o resultado no fim, você vê o site rodando desde cedo, mesmo que incompleto, e decide em cima de algo real, não de um mockup estático.

## Quando "rápido" é sinal de alerta, não de eficiência

Nem todo prazo curto é sinal de processo eficiente. Vale distinguir os dois casos. Prazo curto por eliminação de tempo morto olha assim: você vê algo rodando cedo, os bugs que aparecem (e sempre aparecem, infraestrutura nova sempre esbarra em algo) são resolvidos um por um às claras, e segurança é parte do processo, não uma etapa que fica de fora pra ganhar tempo. Prazo curto por corte de canto olha diferente: você só vê o resultado no fim, ninguém te mostra o que foi testado, e perguntas sobre segurança recebem resposta genérica. A diferença não está no número de dias, está em quanto do processo você consegue ver acontecendo.

## Perguntas que valem mais que "quanto tempo demora"

Antes de perguntar só o prazo, vale perguntar:

- **O que fica pronto primeiro, e eu vejo funcionando ou só uma promessa de cronograma?** Um processo rápido de verdade te mostra algo rodando cedo, não só um cronograma bonito.
- **Quem revisa segurança e performance, e quando?** Se a resposta for "no final", o prazo curto pode estar escondendo corte de canto, não eficiência real.
- **O que acontece se eu pedir uma mudança no meio do caminho?** Processo com etapas em fila trata mudança como retrabalho caro. Processo com entregas contínuas trata como ajuste normal.
- **Esse prazo é a média ou o melhor caso?** Vale perguntar direto, e comparar com um caso real verificável, não só com a promessa.

## Como comparar duas propostas de site

Se você está comparando duas propostas com prazos diferentes, olhar só o número final de semanas engana. Vale comparar:

- **O que você vê rodando na primeira semana.** Uma proposta que só entrega algo visível no fim do prazo é uma fila disfarçada de processo rápido.
- **Como mudança de escopo no meio do caminho é tratada.** Se qualquer ajuste seu vira uma nova rodada de orçamento e prazo, o processo por trás é sequencial, mesmo que o prazo total pareça curto no papel.
- **Quem, especificamente, revisa segurança.** Uma resposta vaga ("a gente revisa tudo") vale menos que uma resposta específica sobre quando e como isso acontece.
- **Se existe um caso real e verificável pra comparar**, não só uma estimativa. Prazo estimado é fácil de prometer, prazo já cumprido é o que vale checar.

## Checklist: sinais de que seu projeto está parado por motivo errado

- Você aprovou o escopo há semanas e ainda não viu nada rodando, só documento e mockup.
- Cada atualização que você recebe é sobre "o que falta", nunca sobre "o que já está no ar".
- Ninguém consegue te dizer, especificamente, o que impede a próxima entrega hoje.
- O prazo só aumenta a cada conversa, nunca diminui mesmo quando você aprova rápido.
- Você não sabe quem, na prática, está revisando segurança antes do lançamento.

Se dois ou mais desses itens forem verdade pro seu projeto atual, o problema provavelmente não é a complexidade do site, é o processo por trás dele.

## Perguntas frequentes

**Um site mais rápido é necessariamente mais barato?**
Não necessariamente, e não deveria ser vendido assim. O ganho real é você decidir em cima de algo rodando, e evitar retrabalho tardio, não um desconto por urgência. Prazo curto sem revisão de qualidade é risco, não economia.

**Dá pra aplicar isso em qualquer tipo de site?**
O caso do Eunoimóvel foi um site de imobiliária com autenticação, busca e cadastro, ou seja, não foi um site simples de uma página. O que determina o prazo real não é a categoria do negócio, é quanto o processo por trás elimina tempo morto entre etapas.

**Se meu site já está em desenvolvimento há meses, isso significa que algo está errado?**
Não automaticamente, alguns projetos têm complexidade real que justifica prazo maior. O sinal de alerta não é o tempo em si, é não conseguir apontar o que, especificamente, está sendo feito agora e o que impede a próxima entrega.

**Preciso entender de tecnologia pra acompanhar um projeto assim?**
Não. O ponto de um processo com entregas contínuas é justamente esse: você acompanha vendo o resultado rodando, não lendo relatório técnico. Se a única forma de saber como o projeto está indo é confiar na palavra de quem está fazendo, sem nada pra ver, isso já é um sinal de alerta por si só.

Se seu site ainda está preso na fila de "vou começar mês que vem", vale perguntar quanto tempo ele já está esperando pra existir. O relato completo do dia em que o Eunoimóvel saiu do zero pro ar está no [diário do dia 6](/blog/diario-6-no-mesmo-dia-comecei-a-reconstruir-uma-imobiliaria-inteira/). [Ver como funciona →](https://thallisribeiro.com.br)
