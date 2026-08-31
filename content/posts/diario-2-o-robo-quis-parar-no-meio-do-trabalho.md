---
title: "Diário — Dia 2-3: O robô quis parar no meio do trabalho pra perguntar se podia continuar"
date: 2026-08-12
summary: "Os primeiros dias de squad rodando de verdade trouxeram um problema chato: o agente parava sozinho no meio da tarefa."
tema: Agência autônoma
image: /assets/posts/diario-2-o-robo-quis-parar-no-meio-do-trabalho.webp
---

Segunda entrada do diário — dois dias depois do [primeiro squad](/blog/diario-1-contratei-meu-primeiro-funcionario-e-ele-e-um-robo/), a primeira lição chata apareceu.

## O problema

O agente encarregado de escrever o post chegava numa etapa intermediária do trabalho e parava — esperando eu confirmar se podia seguir pra próxima parte, mesmo quando eu já tinha deixado claro, na configuração do squad, que ele podia continuar sozinho até o fim. Isso quebra o ponto inteiro de ter um "funcionário": se eu preciso ficar checando cada passo, não economizei tempo nenhum, só troquei "escrever eu mesmo" por "ficar de babá".

A correção foi direta: reforcei, na definição do squad, que ele não deveria parar em checkpoints intermediários sem necessidade real — só em decisões que exigem julgamento humano de verdade (aprovar um valor, por exemplo), não em "posso seguir pra etapa 2?".

## O segundo problema, no dia seguinte

Um dia depois, outro tipo de falha: eu tinha corrigido um comportamento num arquivo do squad, mas um arquivo irmão — que descrevia a mesma regra de outro jeito — ficou com a versão antiga. O squad seguiu a regra errada porque encontrou a instrução desatualizada primeiro.

A lição aqui não foi sobre o agente, foi sobre mim: quando eu mudo uma regra rápido, num sistema com vários arquivos que se referenciam, preciso varrer os arquivos vizinhos atrás de afirmações que ficaram desatualizadas — não só corrigir onde eu vi o problema primeiro.

Nenhuma das duas coisas parece grande sozinha. Juntas, definiram como eu ia trabalhar com squad dali pra frente: menos "corrigi e resolvido", mais "corrigi, e agora preciso conferir quem mais dependia disso".
