---
title: "Outbid.lol: o site de 3 horas que faturou US$ 178 mil, e por que as 170 cópias não funcionaram"
date: 2026-08-30
summary: Um alemão construiu numa noite de quarta, cozinhando o jantar, um site que faz uma coisa só: você paga pra ficar em primeiro numa lista. Em 77 horas ele reportou 178 mil dólares. Apareceram mais de 170 cópias em semanas. Quase nenhuma repetiu o resultado, e o motivo não está no código.
tema: Produto e distribuição
---

Jonathan Wilke descreve assim o que ele fez:

> Um projetinho divertido que eu construí numa noite de quarta enquanto cozinhava o jantar.

E a expectativa dele, nas palavras dele:

> Eu não tinha expectativa nenhuma. Achei que se essa coisa fizesse algumas centenas de dólares no total, já seria legal.

Cinco dias depois, a High Signal abriu uma entrevista com ele dizendo que o número era 220 mil dólares.

Esse é o tipo de história que circula rápido e ensina errado. Ela vira "cara faz 200 mil dólares com site de 3 horas", 170 pessoas copiam o site, e quase nenhuma faz dinheiro. Vale a pena entender por quê — porque a resposta não é sorte, e não é o código.

## O que o site faz

O outbid.lol tem uma função única: uma lista pública onde você paga pra ficar em primeiro lugar.

Você põe seu produto na lista com um lance. Quem tem o maior lance fica no topo. Empate desempata pelo mais antigo, o que premia quem chegou cedo. E o ponto que sustenta tudo:

**o dinheiro não volta.**

Isso não é leilão. Num leilão, quem perde não paga. Aqui, quem foi ultrapassado já pagou e não recebe nada de volta. Você não comprou o primeiro lugar — comprou o *tempo* em que ficou nele, mais o direito de aparecer numa lista que muita gente está olhando naquele momento.

Guarde essa frase, porque ela é o motor da coisa toda.

## De onde veio a ideia

Wilke conta que conhecia o TrustMRR, onde as pessoas compartilham a receita dos seus produtos. O problema: *"eu não queria que ninguém compartilhasse chave de API do provedor de pagamento. Então escolhi a forma mais simples de ranquear. Paga e você está na lista."*

Isso é mais interessante do que parece. Ele não estava projetando um mecanismo de escalada psicológica. Estava fugindo de um problema chato de integração. A forma mais preguiçosa de ordenar uma lista — quem paga mais fica em cima — resolveu o problema técnico e, por acidente, criou o motor econômico.

Vale registrar o contexto que a própria High Signal traz: o negócio anterior de Wilke, o SupaStarter, vinha com **vendas em queda**. Ele não estava surfando uma onda. Isso importa pra história, e importa mais ainda pra lição — volto nisso no fim.

## O número, e como ler o número

Aqui eu preciso ser chato, porque é a parte que quase todo mundo repete errado.

**A cifra de 178 mil dólares em 77 horas é auto-declarada.** Foi dita pelo próprio autor, ao vivo, durante o lançamento. Não é balanço auditado. Não é extrato. Ninguém de fora abriu o painel de pagamentos dele.

E as fontes que cobriram o caso **não concordam entre si**. Compare:

- **Automatio, nas primeiras 24 horas:** 4.500 visitantes nas horas iniciais, 10 mil visitas na marca de 12 horas, maior lance "acima de US$ 1.000".
- **Super Frameworks, na marca das 77 horas:** US$ 178 mil, mais de 200 mil visitantes no primeiro dia, 897 produtos listados, primeiro lugar custando US$ 12.500.
- **Cobertura de imprensa, em 48 horas:** mais de 1 milhão de visitantes e US$ 120 mil em lances.
- **High Signal, em 5 dias:** US$ 220 mil.

Parte da divergência é só cronologia: cada um mediu num momento diferente de uma curva que estava subindo rápido. Mas não é só isso. O maior lance aparece como US$ 12.500 numa fonte e circulou como US$ 14.013 em outra. Os visitantes aparecem como 200 mil no primeiro dia numa apuração e mais de 1 milhão em 48 horas em outra — e a própria automatio registra que as ferramentas de analytics *"tiveram dificuldade de acompanhar o volume de eventos em tempo real"*.

Tentei conferir na fonte primária, as regras publicadas no próprio outbid.lol. O site devolveu erro de excesso de requisições nas duas tentativas. Por isso não afirmo aqui o valor exato do lance mínimo: as fontes secundárias divergem entre US$ 2 e US$ 5, e eu não consegui ver a regra na origem.

Nada disso derruba a história. A ordem de grandeza é consistente em todas as apurações, e o fenômeno é real e verificável de fora — o tamanho da lista, o volume de tráfego, a quantidade de cópias. **Só não dá pra tratar "178 mil" como um fato auditado, e a maior parte do que circulou por aí trata.**

Faço questão desse trecho por um motivo simples: se você vai levar essa história pra uma reunião, é melhor levar o número certo com a ressalva certa do que o número redondo sem nenhuma.

## Esse mecanismo tem nome

O que o outbid.lol faz não é uma invenção de 2026. Em economia, existe uma família de leilões chamada **all-pay auction**: todo mundo paga o lance, só um leva o prêmio.

O exemplo clássico é o *dollar auction*, desenhado por Martin Shubik em 1971. Leiloa-se uma nota de um dólar. Regra: o maior lance leva a nota, e o segundo colocado paga o lance dele e não leva nada. O resultado experimental é sistematicamente absurdo — pessoas pagam vários dólares por uma nota de um, porque a partir de certo ponto ninguém está mais comprando a nota. Está tentando não perder o que já pôs.

É exatamente essa a estrutura de incentivo do outbid.lol. Quando você é ultrapassado, o dinheiro que você já pagou não vira reembolso: vira motivo pra pagar de novo. A perda é real, ela é pública, e a saída dela custa mais um lance.

Não estou dizendo que Wilke desenhou um dollar auction de propósito — pelo relato dele, ele estava só evitando pedir chave de API. Estou dizendo que a estrutura que ele criou por atalho é uma estrutura estudada há cinquenta anos, e que ela funciona com uma confiabilidade um pouco desconfortável.

E tem um segundo ingrediente que o dollar auction clássico não tem: **o placar é público**. Você não está só perdendo dinheiro; está perdendo posição na frente de todo mundo que estava olhando. O gasto é visível, e a visibilidade do gasto é parte do que você comprou.

## Aí vieram as cópias

A escalada foi documentada e é o melhor dado da história inteira:

- **3 cópias** já no primeiro dia
- depois **10**
- depois **85** catalogadas
- depois **mais de 170** placares rastreados, entre vivos e mortos

Algumas nem copiaram direito — mudaram a mecânica. O billbored.lol, por exemplo, trocou o leilão por preço fixo: 10 dólares por vaga, exatas 100 vagas, e quem entra por último vai pro topo. É um produto diferente com a mesma aparência. Sem escalada, sem perda, sem motivo pra pagar duas vezes.

Quase nenhuma cópia repetiu o resultado.

## Copiaram o código. O código levou uma noite.

Se o valor estivesse no código, 170 pessoas teriam feito 178 mil dólares cada uma.

Não foi o que aconteceu, porque o código nunca foi o ativo. Ele levou uma noite de quarta-feira, com o cara cozinhando ao mesmo tempo, e hoje qualquer IA escreve isso mais rápido do que ele escreveu.

O que fez dinheiro foi o mecanismo, e o mecanismo tem quatro partes. Só uma delas cabe num arquivo:

**1. O gasto é público.** Quem paga não compra só a posição; compra o fato visível de ter pagado. Isso é publicidade que se exibe como competição.

**2. O pagamento não volta.** Transforma cada lance em compromisso e transforma ser ultrapassado em perda real. Perda real gera lance novo. Sem essa regra, o site é uma tabela de preços.

**3. Atenção massiva no lançamento.** Centenas de milhares de pessoas nos primeiros dias. E aqui uma correção que eu mesmo tive que fazer numa versão anterior deste texto: **não dá pra afirmar que ele já tivesse essa plateia formada antes.** O que os fatos sustentam é que ele *conseguiu* essa distribuição no lançamento. O negócio anterior dele estava com vendas em queda. A distribuição foi conquistada naquele momento, não herdada — e isso é bem mais difícil de copiar do que uma audiência pré-existente, porque nem o autor sabia reproduzir.

**4. Dinheiro real já em disputa na tela.** Um placar com doze mil dólares em cima do primeiro lugar é prova pública de que o jogo é sério. Isso não existe no dia zero de cópia nenhuma. E não dá pra escrever no código: é estado acumulado, não funcionalidade.

O item 4 é a armadilha. Ele é *consequência* do sucesso e ao mesmo tempo *causa* da continuidade dele. Quem copia recebe o item 1 e o 2 de graça — são regras. Não recebe o 3 nem o 4, que são as duas partes que fazem o dinheiro entrar. As cópias rodaram a mecânica no vazio, e placar sem atenção é uma tabela em branco.

Tem ainda um quinto elemento, que é o mais cruel: **prazo de validade**. Parte do que fazia as pessoas pagarem era estar no lugar do momento. O lugar do momento só existe uma vez. A cópia número 12 não estava competindo em desvantagem — estava competindo num jogo que já tinha acabado.

## O que eu tiro disso

Quando eu olho um produto que está faturando, a pergunta preguiçosa é *"como eu construo isso?"*.

Hoje essa pergunta quase sempre tem a mesma resposta: rápido, e com IA. Ela virou uma pergunta sem informação. Se todo mundo consegue construir, construir não é a vantagem.

A pergunta que vale é outra: **qual parte disso é o que faz a pessoa pagar?**

No outbid.lol, a resposta não é a lista. É a combinação de gasto visível com pagamento irreversível, rodando na frente de um público que se importa com o resultado, num momento em que aquele era o lugar pra se estar.

Três dessas quatro coisas não são software.

E é por isso que eu separo, no meu próprio trabalho, quatro etapas que costumam virar uma só:

**Pesquisar** o que aconteceu. **Especificar** qual é o menor sistema que reproduz o valor econômico — não o menor sistema que reproduz a tela. **Construir**. E **auditar** com alguém que não seja quem construiu, porque quem constrói não é bom juiz do que construiu.

As 170 cópias pularam da etapa 1 direto pra 3. Viram uma tela, reproduziram a tela. A etapa 2 é onde teria aparecido a pergunta que salvaria o esforço delas: *"eu tenho o público e a prova social acumulada que fazem isso funcionar, ou eu só tenho a lista?"*

Quem copiou a lista construiu uma lista. Quem entendeu o mecanismo entendeu que precisava de plateia antes de precisar de código.

Complexidade técnica não é o que separa esses dois grupos. Nunca foi — e agora que a construção ficou barata, é o que menos separa.

---

### Fontes

- [Outbid.lol Made $178K in 77 Hours. Then the Internet Started Copying It.](https://superframeworks.com/articles/outbid-lol-viral-launch) — Super Frameworks
- [$220k in 5 days — the outbid.lol interview](https://www.highsignal.io/220k-in-5-days-the-outbid-lol-interview/) — High Signal (entrevista com Jonathan Wilke; todas as citações diretas vêm daqui)
- [Inside outbid.lol: the pay to rank board taking over tech](https://automatio.ai/articles/dev-tools/inside-outbid-lol-the-pay-to-rank-board-taking-over-tech) — Automatio
- [Outbid.lol: Why the Pay-to-Rank Board Went Viral](https://www.explainx.ai/blog/outbid-lol-pay-to-rank-leaderboard-viral-august-2026) — ExplainX
- [outbid.lol](https://outbid.lol/about) — o próprio produto (não acessível no momento da escrita: HTTP 429)

*Os valores de receita citados neste texto são auto-declarados pelo autor do produto e não foram auditados de forma independente. Onde as fontes divergem, a divergência está registrada acima em vez de resolvida por escolha do número maior.*
