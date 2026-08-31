---
title: Testei gerar capa com FLUX local. Um commit depois, voltei pro banco.
summary: Três commits em sequência contam a história: capa gerada junto com o post, depois um esquema híbrido, depois uma fonte só. O híbrido durou menos que um dia.
tema: Automação de conteúdo
---

Tem uma sequência de três commits no repositório do site que, lida de trás pra frente, parece indecisão. Lida na ordem certa, é o custo normal de descobrir uma coisa na prática em vez de na teoria.

O primeiro: **"capa de post vira foto de verdade, gerada com o post"**. A ideia era boa — em vez de capa genérica escolhida depois, a imagem nasce junto com o texto, no mesmo fluxo de publicação. Capa e post saem do mesmo lugar, com o mesmo contexto.

O segundo: **"FLUX local no post novo, banco Magnific no acervo"**. Aqui eu já tinha dois mundos. Os posts antigos usavam imagens do meu banco tratado no Magnific. O post novo saía do FLUX rodando local. Parecia um meio-termo razoável: o acervo fica como está, o pipeline novo cuida do que vem daqui pra frente.

O terceiro, no dia seguinte: **"capa: uma fonte só, o banco"**. Fim do experimento.

## Por que o híbrido morreu tão rápido

Porque capa de post não vive sozinha. Ela vive na listagem do blog, uma do lado da outra. E duas fontes de imagem diferentes significam duas identidades visuais na mesma página — mesmo que cada capa, isolada, esteja boa. O esquema híbrido não era o melhor dos dois mundos; era os dois padrões brigando no mesmo grid.

Aí a conta ficou simples. Manter o FLUX como fonte única significava regerar ou aceitar inconsistência com todo o acervo antigo. Manter o banco como fonte única significava só continuar o que já funcionava. Escolhi a segunda.

## O que eu não estou dizendo

Não estou dizendo que geração local de imagem não presta. Não gastei tempo suficiente ajustando prompt e estilo pra afirmar isso — é bem possível que com mais calibração o FLUX entregasse capas consistentes entre si. O problema não era a qualidade de uma imagem; era ter duas linhas de produção pro mesmo trabalho.

Também não estou dizendo que "gerar a capa junto com o post" foi ideia ruim. Essa parte fica. O que mudou foi de onde a imagem vem, não quando ela entra no fluxo.

## A lição, se é que tem uma

Quando eu penso em automatizar uma etapa, a pergunta que eu fazia era "essa ferramenta entrega resultado bom?". A pergunta que eu deveria fazer é "essa ferramenta entrega resultado consistente com tudo que já existe?". São perguntas diferentes, e a segunda é a que decide se a automação sobrevive ao segundo dia.

O híbrido durou um commit. Podia ter durado semanas se eu tivesse insistido por orgulho da ideia. Reverter rápido é mais barato que defender a decisão errada — e o histórico do git fica aí como lembrete de que eu tentei, vi, e voltei.
