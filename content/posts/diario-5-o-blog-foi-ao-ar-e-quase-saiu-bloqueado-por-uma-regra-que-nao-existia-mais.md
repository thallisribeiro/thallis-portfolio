---
title: "Diário — Dia 6: O blog foi ao ar e quase saiu bloqueado por uma regra que não existia mais"
date: 2026-08-15
summary: "O blog do Grana estreou hoje. No mesmo dia, quase travei todos os posts atrás de uma exigência de SEO que o Google já tinha matado meses antes."
tema: Automação de conteúdo
---

Quinta entrada. Hoje foi o dia em que o blog do Grana saiu do papel — e o primeiro dia em que uma pesquisa rápida me salvou de um erro caro.

## O blog foi ao ar

Primeira versão do blog publicada, GA4 ativado, e um workflow automático rodando: todo dia, um agente escreve um post sobre alguma notícia financeira do dia (uma "atualidade"), via GitHub Action. Também criei um script de auditoria — a "Barra de Publicação" — pra checar mecanicamente se cada post cumpria um conjunto de critérios antes de poder ser publicado: número com fonte real, cálculo mostrado, tabela comparativa, FAQ.

## O quase-erro

Rodei a auditoria contra os posts existentes. **100% reprovaram.** Quase todos pelo mesmo motivo: FAQ ausente ou fora do formato.

Antes de reescrever tudo, parei pra checar uma coisa: FAQ em post de blog só importa pra SEO por causa de um recurso do Google chamado "rich results" — aquele trecho de perguntas e respostas que aparecia direto na busca. Pesquisei, e confirmei: **o Google encerrou esse recurso em 7 de maio de 2026.** Eu ia gastar um dia inteiro reforçando 61 posts atrás de uma regra que já não valia nada há três meses.

Corrigi na hora: FAQ virou item desejável, não bloqueante. Reauditei — a reprovação caiu, mas continuou alta, agora por motivo real: cálculo mostrado ausente, a falha mais comum de verdade.

## A lição

Duas coisas ficam desse dia. A primeira: antes de reforçar qualquer regra em massa, vale a pena gastar cinco minutos checando se a regra ainda é verdadeira — regra de SEO copiada de um post desatualizado de 2024 quase me custou um dia de trabalho. A segunda, menor mas real: o motivo de exigir que cada pergunta de FAQ fosse formatada como `## Pergunta` nunca foi regra do Google — era só como meu próprio script de geração reconhecia o bloco. Fácil confundir "convenção minha" com "exigência externa" quando as duas parecem a mesma coisa de fora.
