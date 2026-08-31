---
title: Tirei a autorização manual do bot do Telegram: agora ele só avisa
date: 2026-08-22
summary: Troquei "posso fazer isso?" por "fiz isso" na ponte de automação da agência, e isso expõe o real teste da palavra "autônoma".
tema: Agência autônoma
image: /assets/posts/tirei-a-autorizacao-manual-do-bot-do-telegram-agora-ele-so-avisa.webp
---

Tenho um bot no Telegram que serve de ponte entre mim e os squads de agentes que rodam a agência. Até pouco tempo, o fluxo era: o agente decidia uma ação, mandava mensagem perguntando se podia executar, eu respondia sim ou não. Mudei isso. Agora ele executa e manda relatório do que fez — não pedido do que vai fazer.

## Por que isso importa mais do que parece

Chamo o negócio de "agência 99% IA". Mas uma agência onde todo passo espera minha aprovação não é autônoma — é um funcionário que me manda mensagem antes de cada clique. O gargalo nunca foi a IA, era eu no meio do fluxo, respondendo sim/não pro Telegram enquanto fazia outra coisa.

Tirar essa trava é a diferença entre "IA que propõe" e "IA que roda". E é exatamente o tipo de decisão que dá desconforto: você perde o botão de veto no momento exato da ação. Fica só o relatório, depois.

## O que eu não tenho é dado

Não vou fingir que sei medir o impacto disso em número — não rodei o suficiente pra ter uma estatística real de quantas decisões o bot tomou sozinho, nem quantas eu teria vetado se tivesse visto antes. O que eu tenho é a mudança de arquitetura e o motivo dela. Se um dia tiver dado real de erro evitado ou erro que passou, escrevo um post separado com isso.

## O trade-off que assumi

Aprovação manual existia porque eu não confiava o suficiente pro agente agir sozinho. Trocar isso por relatório é admitir uma de duas coisas: ou a confiança aumentou o bastante pra eu aceitar o risco, ou eu decidi que o custo de ficar no meio do fluxo é maior que o custo do erro ocasional. Foi a segunda. Prefiro corrigir depois de errado do que travar toda decisão esperando minha resposta.

Isso não é "sem supervisão" — é supervisão depois do fato em vez de antes. Pra quem terceiriza decisão pra agente, essa é a pergunta que ninguém faz alto o bastante: você quer aprovar cada ação, ou quer auditar o que já aconteceu? São dois produtos diferentes, com dois níveis de risco diferentes, e eu escolhi o segundo pra minha própria operação antes de vender pra qualquer cliente.

## O que fica pra depois

Não tenho, nesse momento, detalhe pra publicar sobre quais guarda-corpos ficaram no lugar da aprovação manual — isso vira post quando eu tiver algo concreto pra mostrar, não uma promessa vaga de "tem segurança sim". Por enquanto, o que é real é isso: tirei um pedido e coloquei um relatório no lugar, e é um tipo de aposta diferente da que eu tinha antes.
