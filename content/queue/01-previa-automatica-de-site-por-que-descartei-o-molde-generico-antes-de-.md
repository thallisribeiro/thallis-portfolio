---
title: Prévia automática de site: por que descartei o molde genérico antes de escrever uma linha de código
summary: Decidi que a prévia que o lead recebe vai usar template por categoria de negócio, não um molde único — e a decisão saiu de uma spec, não do código.
tema: Agência autônoma
---

Essa semana escrevi a spec de uma feature nova pra prospecção: gerar uma prévia automática de site pro lead antes mesmo do primeiro contato dar em algo. Dois cenários — o negócio que não tem site nenhum, e o que tem um site velho pedindo redesign. A ideia é simples: em vez de dizer "posso fazer um site pra você", mostrar o site já meio pronto, com o nome e a cara do negócio da pessoa.

Ainda não existe. É spec e plano de implementação, nada no ar. Mas uma decisão de design já foi tomada, e é sobre ela que quero falar.

## A primeira versão da spec estava errada

O rascunho inicial era um molde genérico: um template bonito, neutro, que serviria pra qualquer lead — troca a logo, troca o nome, pronto. É a versão mais barata de construir, e foi por isso que ela apareceu primeiro.

O problema é que "genérico" é exatamente o que a prévia não pode ser. Uma pousada, uma clínica e uma loja de material de construção não precisam das mesmas seções, do mesmo tom, da mesma estrutura de página. Se o dono da pousada abre a prévia e vê um layout que claramente serviria pra qualquer comércio, a mensagem que chega é "ele manda isso pra todo mundo". Que é verdade — mas a prévia inteira existe pra causar a impressão oposta: "alguém olhou pro meu negócio".

Então reescrevi a spec: template por categoria de negócio. Mais trabalho, porque cada categoria vira um molde que precisa ser desenhado e mantido. Menos escala no curto prazo. Mas a alternativa era escalar uma coisa que não funciona.

## O critério que usei

A pergunta que decidiu foi: o que o lead sente nos primeiros cinco segundos abrindo o link? Com molde único, a resposta honesta é "spam bem-acabado". Com molde por categoria, tem chance de ser "isso aqui foi pensado pra mim". A automação fica invisível — e automação que precisa parecer artesanal só funciona se a variação for real, não cosmética.

É o mesmo princípio que já uso na prospecção por mensagem: personalização falsa é pior que nenhuma, porque o lead percebe e o custo é a confiança, não só aquela venda.

## O que ainda não sei

Não sei quantas categorias vão bastar, nem quanto tempo cada template vai custar pra ficar bom. Também não sei se a prévia converte melhor que a abordagem atual — isso só o uso real vai responder, e ainda não tem uso real. Quando tiver, escrevo o resultado aqui, inclusive se for ruim.

Por enquanto, o registro é esse: a decisão mais importante da feature aconteceu antes do código, cortando a versão barata que teria saído mais rápido e convertido menos.
