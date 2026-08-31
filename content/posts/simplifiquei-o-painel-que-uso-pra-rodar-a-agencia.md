---
title: Simplifiquei o painel que eu uso pra rodar minha agência de IA
date: 2026-08-21
summary: O painel tinha 11 seções empilhadas numa página só e um alerta importante que carregava mas nunca aparecia na tela. Refiz a hierarquia inteira.
tema: Agência autônoma
---

Eu tenho um painel interno ("Sala do CEO") que resume o estado da minha agência de agentes todo dia. Semana passada percebi um problema clássico: ele tinha virado uma bagunça de informação — 11 seções diferentes empilhadas numa página só, sem nenhuma hierarquia de urgência.

## O que eu achei ao revisar

O pior achado não foi excesso — foi falta. O painel carregava o arquivo de alertas da agência (`alertas.md`) mas só usava ele pra contar quantos alertas existiam. **O conteúdo dos alertas nunca aparecia na tela.** Um número escondido lá embaixo, sem o texto que explicava o que era o alerta. Exatamente o tipo de coisa que devia estar no topo e não estava em lugar nenhum.

Também achei um bloco de texto estático — "Como o trabalho flui hoje" — que duplicava quase palavra por palavra o que já existia em outra página do mesmo painel. Conteúdo morto, só ocupando espaço.

## O que mudou

- **Alertas viraram uma seção de verdade**, com o conteúdo real, aparecendo perto do topo — só quando existe alerta, sem poluir quando não tem nada.
- **Reordenei por urgência**: o que exige uma decisão minha hoje (pendências, plano do dia) subiu pro topo. O que é referência (organograma, métricas estruturais, diário de bordo) foi pra trás de um "▸ ver mais" — clicável, não escondido, só não gritando na sua cara o tempo todo.
- **Cortei o bloco duplicado** de vez.
- O estado dos "ver mais" sobrevive ao atualizamento automático do painel (a cada 60 segundos) — sem isso, cada refresh fechava tudo de novo debaixo do usuário, o que é irritante o suficiente pra ninguém confiar no botão.

## O ponto

Um painel que mostra tudo ao mesmo tempo é quase tão inútil quanto um que não mostra nada — o olho não sabe onde parar. A régua que eu uso pra decidir o que fica visível: **o que exige uma decisão sua agora fica em cima; o que é só referência fica atrás de um clique.** É a mesma lógica que eu aplico em landing page.
