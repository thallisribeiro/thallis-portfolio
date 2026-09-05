---
title: O curl acabou com o bug bounty: o que aconteceu com o programa que pagou mais de 100 mil dólares
date: 2026-09-04
summary: Menos de um relatório de falha em vinte era real, e o curl encerrou o programa que pagava por eles. O mantenedor Daniel Stenberg citou lixo gerado por IA, humanos reportando pior do que nunca e o desgaste mental da equipe. Meses depois, o volume de relatórios continuou chegando.
tema: Mercado
peca: 2026-09-04/2026-09-04-a
image: /assets/posts/o-curl-acabou-com-o-bug-bounty-o-que-aconteceu-com-o-programa-que-pago.webp
---

O projeto curl encerrou seu programa de bug bounty em 31 de janeiro de 2026, e desde então não paga mais nenhuma recompensa em dinheiro por relatório de vulnerabilidade, "não importa a gravidade". O anúncio saiu cinco dias antes, em 26 de janeiro, num post do mantenedor do projeto, Daniel Stenberg, no blog daniel.haxx.se.

A notícia chegou à imprensa técnica antes do post oficial. Segundo o próprio Stenberg, que lista a cobertura no anúncio, veículos como The Register (21 de janeiro) e BleepingComputer (22 de janeiro) partiram do pull request que ele abriu em 14 de janeiro removendo o bug bounty da documentação.

## Quanto o programa pagou enquanto existiu

O primeiro bug bounty real do curl começou em abril de 2019, em parceria com a plataforma HackerOne. Pelo balanço publicado por Stenberg no post de encerramento, o programa rendeu 87 vulnerabilidades confirmadas e mais de 100.000 dólares pagos em recompensas a pesquisadores ao longo de quase sete anos.

O programa funcionava. O que mudou foi o que passou a chegar por ele.

## O que mudou nos relatórios recebidos

Nos anos anteriores a 2025, a taxa de submissões que viravam vulnerabilidade confirmada ficava, nas palavras de Stenberg, "em algum lugar acima de 15%". A partir de 2025 ela desabou para abaixo de 5%. "Nem uma em vinte era real", escreveu ele.

Vale a ressalva: esses percentuais são o balanço do próprio mantenedor, não auditoria de terceiro. O curl publicou um gráfico fornecido pelo HackerOne mostrando que o volume de relatórios do projeto subiu forte nos últimos quatro trimestres, enquanto Ruby, Node e Rails ficaram estáveis ou caíram levemente, mas o gráfico saiu sem os números do eixo. O volume absoluto de relatórios que o curl recebe nunca foi publicado.

## Sete relatórios em dezesseis horas

O exemplo mais concreto está no relatório semanal que Stenberg publica na lista pública daniel@haxx.se. Na sexta-feira, 16 de janeiro de 2026, ele escreveu que a semana tinha começado com sete issues do HackerOne recebidas numa janela de dezesseis horas. Alguns descreviam bugs de verdade, mas a conclusão da equipe foi que nenhum daqueles sete identificava uma vulnerabilidade.

No mesmo texto, Stenberg contou vinte submissões já recebidas em 2026 até ali, ou seja, nos primeiros dezesseis dias do ano. Ele não afirma que as vinte eram falsas: a conclusão sobre não haver vulnerabilidade é sobre os sete da janela de dezesseis horas. Sobre as treze restantes não há declaração pública.

## Por que Stenberg encerrou o programa

O motivo declarado não é apenas a IA. No post de 26 de janeiro, Stenberg lista três tendências combinadas: o lixo gerado por IA, humanos reportando pior do que nunca e a vontade aparente de procurar furos em vez de ajudar.

E o custo que ele descreve não é só de tempo. "A enxurrada interminável de lixo cobra um sério preço mental para administrar, e às vezes leva muito tempo para desmentir", escreveu. "Tempo e energia completamente desperdiçados, enquanto prejudica nossa vontade de viver."

A política de resposta do projeto continua a mesma de antes: quem envia relatório gerado por IA é banido imediatamente e ridicularizado em público.

O curl não está sozinho nisso, embora a comparação venha de terreno menos firme. Num comentário público no próprio post de Stenberg, Piotr P. Karwasz, participante do projeto Apache Log4j, relatou 67 submissões revisadas desde julho de 2024, metade delas concentrada nos dois meses anteriores, e disse haver consenso no PMC para fechar o programa até o fim de fevereiro caso o ajuste não funcionasse. É declaração de participante em comentário de blog, não anúncio oficial do Apache nem apuração de veículo.

## O que aconteceu depois do fim do bounty

Junto com o fim das recompensas, o curl também tinha decidido sair do HackerOne. Essa parte durou um mês. Em 25 de fevereiro, Stenberg publicou que a saída "acabou sendo um erro" e que o projeto voltaria a receber e tratar relatórios de vulnerabilidade na plataforma a partir de 1º de março de 2026.

O dinheiro não voltou. A política oficial de divulgação de vulnerabilidades do curl, em curl.se/docs/bugbounty.html, diz hoje que não existe bug bounty e que o projeto nunca oferece recompensa por vulnerabilidade reportada, com o reporte feito pelo HackerOne.

## Tirar o dinheiro fez o volume cair?

Não. Em 15 de junho de 2026, quatro meses e meio depois do fim do bounty, o projeto anunciou o que chamou de "curl summer of bliss": de 1º de julho a 3 de agosto, o curl não aceitou nenhum relatório de vulnerabilidade, e o lançamento da versão 8.22.0 foi adiado em duas semanas.

A justificativa publicada foi direta: a equipe estava sob pressão enorme havia uns quatro meses e precisava descansar. "Não esperamos que essa enxurrada acabe."

## O que a fonte não respondeu

Três lacunas ficam de pé, e as três estão reconhecidas nos próprios textos do projeto.

- **Quantos relatórios eram comprovadamente gerados por IA.** Stenberg fala em explosão de "AI slop" e suspeita que mesmo os menos óbvios foram induzidos por IA com o fato melhor escondido, mas isso é impressão declarada, não medição. O projeto nem tinha sistema de etiqueta para separar esses casos.
- **Por que o curl sofre mais que projetos comparáveis.** O próprio mantenedor registra que a razão exata segue sendo objeto de especulação e pesquisa.
- **O tamanho real do problema em números absolutos.** Sem os valores do eixo do gráfico do HackerOne, dá para ver a curva, não a escala.

Duas correções valem para quem for citar este caso. Os números que circulam em resumos secundários, 78 vulnerabilidades e 86.000 dólares, contradizem a fonte primária: o balanço do blog fala em 87 e mais de 100.000 dólares. E a expressão "intact mental health", que aparece em manchete da Ars Technica, não é palavra de Stenberg. As dele são "sério preço mental" e "prejudica nossa vontade de viver".
