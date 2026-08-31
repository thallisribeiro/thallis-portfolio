---
title: "Dia 2. Como a máquina publica sozinha no Instagram"
date: 2026-08-22
tema: Agência autônoma
summary: "A promessa do Dia 1 era publicar isso amanhã. Não esperei: o pipeline de publicação automática do Instagram ficou pronto ainda hoje, com 2 bugs reais achados e corrigidos ao vivo."
image: /assets/posts/dia-2-como-a-maquina-publica-sozinha.webp
---

O Dia 1 fechou com uma promessa: "amanhã, como a máquina publica sozinha". Não deu pra esperar até amanhã. O pipeline ficou pronto ainda hoje, e a aposta pede transparência em tempo real, não calendário arredondado. Então aqui está, no mesmo dia.

## O que faltava

Eu já tinha o publicador do Instagram escrito, mas com um buraco deliberado: o modo "revisão" (gera o post, espera eu aprovar) funcionava, o modo "auto" (publica sozinho, sem ninguém olhar antes) só existia como aviso recusando rodar. Documentado ≠ funcionando, e esse pedaço não funcionava.

## O que construí

Implementei o modo auto de verdade: ele varre o conteúdo já pronto (carrossel + legenda) em ordem, pega o próximo que ainda não foi ao ar, publica e marca como feito. Registrei uma tarefa no agendador do Windows rodando 3 vezes por dia, mesmo horário que já uso pro blog. Depois, testei com token e conta reais, sem fingir.

## Os 2 bugs que só apareceram testando de verdade

Documentar isso sem filtro significa admitir que "implementei" não é o mesmo que "funcionou de primeira".

Bug 1: o token novo que gerei fala com um endereço diferente do que o script assumia. Achei porque a chamada real voltou com erro de sessão inválida, não porque eu previ isso lendo documentação.

Bug 2: o tipo de conteúdo "carrossel" nessa versão da API do Instagram tem um nome diferente do que eu tinha escrito no código, herdado de uma versão mais antiga. A chamada real voltou dizendo "tipo de mídia desconhecido" — de novo, só apareceu rodando, não lendo.

Corrigi os dois, rodei de novo, e o container de publicação ficou pronto. Zero atalho: testei com imagem real, conta real, chave de acesso real, até o ponto exato antes de publicar de verdade.

## O que isso significa a partir de agora

Ninguém mais abre o painel do Instagram pra subir post um por um. A fila de conteúdo já pronta avança sozinha, no horário certo, sem toque nenhum meu. Se a fila secar, o sistema avisa. Se falhar, tenta de novo no próximo horário. Aprovar deixou de ser um passo, porque não existe mais aprovação: o critério de qualidade já foi aplicado antes, na hora de criar o conteúdo.

Amanhã: uma conta real de quanto cada peça de conteúdo custa pra existir, do texto ao render da imagem — e se isso é sustentável rodando todo dia por 30 dias.
