---
title: "Diário — Dia 7 (parte 2): O robô que gera imagem colocou o logo do Bitcoin numa moeda de ouro"
date: 2026-08-16
summary: "Automatizei a capa dos posts do blog com IA de imagem local. Ela alucinou marca em quase tudo — até quando eu mandei explicitamente não fazer isso."
tema: Automação de conteúdo
---

Ainda [dia 7](/blog/diario-7-um-dia-uma-imobiliaria-inteira/), mas voltando pro Grana: hoje também automatizei a derivação de carrossel (o post do blog virando texto pronto pra Instagram) e a geração de imagem de capa pra cada post, rodando localmente (ComfyUI + FLUX), sem depender de API externa.

## O bug engraçado

Os primeiros prompts eram livres, quase poéticos — "uma moeda dourada girando no vazio", esse tipo de coisa. O resultado: a IA colocava o logo do Bitcoin numa moeda que não tinha nada a ver com criptomoeda. Em outra geração, um relógio de bolso saiu com o nome de uma marca inventada gravado no mostrador. Mandei instrução negativa explícita — "sem logo, sem marca, sem texto" — e ela alucinou de novo.

## O que resolveu de verdade

Não foi insistir na instrução negativa. Foi trocar o *sujeito* da imagem. Uma moeda genérica é uma superfície óbvia pra estampar algo — o modelo "quer" completar aquele espaço vazio com um símbolo reconhecível. Troquei pra objetos sem superfície rotulável natural: uma esfera partida lisa, uma lâmpada nua. O problema sumiu, consistentemente, sem precisar repetir a instrução negativa toda vez.

Reescrevi os prompts num template fixo: sujeito único, composição definida, tipo de lente/câmera, luz de borda, fundo preto puro. Resultado muito mais consistente que o texto livre de antes.

## A lição que fica

"Não faça X" nem sempre funciona com modelo generativo — às vezes o jeito de evitar um comportamento indesejado não é proibir, é remover a oportunidade estrutural que convida esse comportamento a aparecer. Vale tanto pra imagem quanto, eu ia descobrir depois, pra outras partes do sistema.
