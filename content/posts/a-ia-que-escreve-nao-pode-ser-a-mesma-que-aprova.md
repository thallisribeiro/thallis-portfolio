---
title: A IA que escreve não pode ser a mesma que aprova
date: 2026-08-31
summary: Separei quem escreve de quem julga na minha máquina de conteúdo, e o publicador agora se recusa a postar qualquer coisa sem um APPROVED explícito.
tema: Agência autônoma
---

Minha máquina de conteúdo tinha um defeito de arquitetura que demorei pra enxergar porque ele não quebra nada: o mesmo agente que escrevia a peça era, na prática, quem decidia que ela estava boa. Existia uma etapa chamada de "triagem", mas ela funcionava como um passe-adiante. O texto entrava, a triagem carimbava, o texto seguia. Nunca vi essa etapa segurar nada de verdade.

O problema disso não é teórico. Já precisei voltar num carrossel sobre o outbid.lol pra corrigir uma afirmação que tinha passado pelo pipeline inteiro. Se o fluxo fosse "escreve e publica direto", aquela afirmação errada tinha ido pro ar com a minha cara em cima.

## O que mudou

Duas coisas, e a ordem importa.

Primeiro, criei uma camada de julgamento editorial separada de quem escreve. Não é o escritor relendo o próprio texto: é outro agente, com outro papel, cujo trabalho é reprovar. A distinção parece burocrática, mas é a mesma lógica de qualquer redação: quem escreve está comprometido com o texto que acabou de produzir. Quem edita não está. Pedir pro autor julgar a própria peça é pedir pra ele achar boa a peça que ele mesmo fez.

Segundo, e mais importante: o publicador do Instagram agora exige um arquivo `approval.json` com status APPROVED antes de postar qualquer coisa. Sem esse arquivo, ele não publica. Não é um aviso, não é um log, é uma recusa. Isso muda o comportamento padrão do sistema de "publica, a menos que alguém barre" pra "não publica, a menos que alguém aprove". Em sistema autônomo, o padrão é o que acontece quando ninguém está olhando, então o padrão tem que ser o lado seguro.

## O que isso não resolve

Vou ser honesto sobre o limite: continua sendo um modelo julgando outro modelo. A camada editorial pode deixar passar erro que ela mesma não sabe reconhecer, e não tenho como provar que ela pega tudo, porque o sistema é novo demais pra eu ter esse histórico. O que a separação resolve é um modo de falha específico e óbvio: o conflito de interesse de autor e juiz serem a mesma entidade. Só isso. Já é muito, mas é só isso.

Também não resolve gosto. Um texto pode ser factualmente correto, passar na barreira, e ainda assim ser um texto que eu não escreveria. Essa régua, por enquanto, continua sendo minha.

## Por que isso virou post

Porque a lição serve pra qualquer automação, não só conteúdo: quando você automatiza uma tarefa, a tentação é automatizar o fazer e esquecer que o julgar era uma etapa separada, que uma pessoa fazia sem perceber. Quando eu revisava tudo na mão, escritor e editor eram os dois papéis dentro da minha cabeça. Ao automatizar, eu tinha portado só o primeiro. O sistema não ficou pior que eu por escrever mal. Ficou pior por não ter ninguém no papel de dizer não.
