---
title: "Clonar um SaaS com IA ficou fácil. O difícil é saber o que não clonar"
date: 2026-08-28
tema: Engenharia reversa de produto
summary: "Existe um método pra mandar uma IA copiar um produto que já fatura. Ele funciona, mas otimiza a coisa errada. O que eu mudaria: a pergunta que o agente responde, e quem tem a palavra final sobre o que foi construído."
---

Achei hoje um produto que só faz uma coisa: uma lista onde você paga pra ficar em primeiro lugar. Pagou mais que quem está no topo, você assume o topo. Não tem mais nenhuma função.

Segundo o autor, esse produto faturou 182 mil dólares em menos de 97 horas. Um brasileiro copiou a ideia, lançou uma versão em português e fez cerca de R$ 10 mil. Eu não verifiquei nenhum dos dois números: são alegações públicas de terceiros, e eu não tenho acesso ao painel de pagamento de ninguém. Mas a ordem de grandeza importa menos que o mecanismo.

E existe hoje um método razoavelmente bem descrito pra reproduzir um produto desses com IA fazendo quase tudo.

## O método, resumido

São três fases:

1. **Análise do alvo.** Um agente com acesso a navegador usa o produto original como se fosse um cliente e escreve um relatório de como ele funciona.
2. **Especificação técnica.** Esse relatório vira um documento de spec, com critérios de aceite explícitos.
3. **Loop de construção.** Um agente implementa a spec e roda em loop até fechar todos os critérios de aceite.

A parte que me interessou de verdade é a fase 1. Não porque é nova, mas porque preenche uma lacuna que eu tinha e não tinha nomeado.

## A lacuna: eu analisava produto de fora

Quando eu avaliava um produto, eu olhava o que dá pra olhar de fora: receita declarada, tabela de preços, proposta da landing page, avaliações de usuário. Tudo isso é a versão que a empresa escolheu contar.

Um agente que navega no produto responde outra classe de pergunta:

- Qual é o primeiro valor que ele entrega?
- Quantos passos até chegar nesse valor?
- Em que momento exato ele pede pagamento?
- O que exige cadastro, e o que acontece depois do cadastro?
- Que partes parecem complexas mas são dispensáveis?
- Qual é o menor fluxo que reproduz o resultado?

Isso é usar o produto, não ler sobre ele. É uma camada de informação que não estava disponível antes sem eu sentar e fazer manualmente, produto por produto.

## Onde o método otimiza a coisa errada

O objetivo declarado do processo é "clonar o produto X". E aí está o erro clássico de agente: você mostra 37 funções e ele constrói as 37.

Você gasta uma semana pra descobrir uma coisa que dava pra descobrir em um dia — e pior, gasta essa semana antes de saber se existe dinheiro ali.

Então eu trocaria a pergunta do relatório. Em vez de:

> Como eu clono o SaaS X?

para:

> Qual é o menor sistema que reproduz a proposta de valor econômica do SaaS X?

Não é a mesma pergunta. A primeira produz um clone. A segunda produz um teste. O que eu quero descobrir não é se consigo construir — hoje isso quase sempre é sim. É se existe dinheiro ali, pelo menor custo possível.

## A regra que eu levaria pra qualquer projeto

Tem uma separação nesse processo que vale mais que a ferramenta de navegador, e é a seguinte:

**pesquisa ≠ especificação ≠ construção ≠ auditoria.**

Quatro papéis, quatro agentes, e explicitamente:

> O agente que constrói não dá a palavra final sobre o que construiu.

Na prática isso significa um agente que entra depois, sem ter participado da construção, sem carregar as premissas de quem escreveu o código, e cujo trabalho é tentar derrubar. Já me achou exatamente o tipo de problema que eu quero achar: sistema tecnicamente funcionando, e semanticamente errado. Passa em todo teste, faz a coisa errada direitinho.

E tem um fechamento elegante que eu tirei desse método: **o mesmo navegador que pesquisou o produto original valida o seu depois.** Ele roda os mesmos casos nos dois e compara. Não compara pixel — compara resultado.

## O que eu não copiaria

O método vem com uma pilha de ferramentas padrão embutida: provedor de pagamento, hospedagem paga, banco gerenciado. Faz sentido pra quem já decidiu lançar.

Não faz sentido pra quem ainda está descobrindo se tem dinheiro ali. Minha regra continua sendo outra: **grátis, local ou plano gratuito primeiro; gasto novo só depois da validação.**

- Se um banco local resolve, não preciso de banco gerenciado.
- Se deploy gratuito resolve, não preciso pagar infraestrutura.
- Se não preciso de checkout pra medir disposição de compra, pagamento manual primeiro.

Complexidade técnica não mata uma ideia. Custo obrigatório antes da validação, sim.

## O fluxo que fica

Juntando as duas coisas:

1. Agente navega no produto original como usuário e escreve o relatório.
2. Outro agente lê o relatório e responde: que parte disso justifica o preço?
3. Isso vira uma spec do valor mínimo, não do produto inteiro.
4. Um agente implementa só aquilo, na pilha mais barata que funcione.
5. Um agente que não participou audita.
6. O mesmo navegador roda os mesmos casos no original e no nosso.
7. Compara resultado. Mata ou continua.

O que me interessa aqui não é a fábrica de clones. É que esse fluxo aproxima bastante de uma coisa que eu queria: um sistema que procura oportunidade, desmonta a economia dela, dá uma nota, e só as melhores viram código.

A diferença entre isso e "vamos clonar um SaaS" é a mesma diferença entre construir uma empresa e construir uma cópia.
