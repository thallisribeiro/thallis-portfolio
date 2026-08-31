# thallisribeiro.com.br — instruções do projeto

Site estático, sem build system e sem `package.json`. Só scripts Node planos. Push na
`main` publica no GitHub Pages, e o cache é de 10 minutos e não é configurável.

## Antes de qualquer coisa

```bash
node C:\Users\thall\Documents\Squads100\estado.js
```

Mostra decisão de negócio com prazo antes do estado da máquina. Se houver item vencendo,
isso vai na primeira resposta da sessão, antes da tarefa que foi pedida.

## Antes de commitar

```bash
node lint-rapido.js                              # ~2s
C:\Users\thall\Documents\Squads100\testes.cmd   # os 10 suites
```

Pega os três defeitos que já custaram tempo aqui: caractere de controle no código,
arquivo gerado fora do `.gerados.json`, e sintaxe quebrada por patch aplicado via script.

## Como o conteúdo entra

Nada aqui escreve post. O blog publica o que a **esteira editorial** do Squads100 apurou:

```
06:00  esteira produz 3 peças (uma varredura de scout para as três)
07:00  peça A  →  Instagram + o artigo irmão no blog, mesmo minuto
12:00  peça B  →  idem
18:00  peça C  →  idem
```

O `ensure-queue.js` só **transporta**: pega o artigo irmão de um carrossel que já foi ao
ar e enfileira. Até 31/08 ele também escrevia, lendo o git log e virando commits em post
— toda sessão de trabalho virava publicação. Saiu inteiro. Se um horário não tem artigo
pareado, ele passa sem post: post errado custa mais que post nenhum.

## Regras que já custaram caro

- **Capa de post vem do banco de imagem** (`capa-do-post.js`), gravada no frontmatter na
  geração. Nunca gerar capa tipográfica a partir do título: o índice ficava com o título
  escrito duas vezes, lado a lado consigo mesmo.
- **Nunca publicar foto de pessoa real identificável** ao lado de um artigo que não fala
  dela. O Openverse foi testado e rejeitado por isso em 31/08.
- **URL nunca muda.** Slug publicado é permanente; se precisar mudar, redirecionar.
- **`generate-blog.js` escreve fora de `blog/`** — home, página da Máquina, página da
  ficha, `trabalhe-comigo`. Quem publica lê o `.gerados.json`, nunca uma lista à mão.
  Manter lista à mão já deixou três páginas subirem velhas, uma de cada vez.
- **Verificar é rodar.** Servir local, tirar screenshot e olhar. Contraste, foco e alvo de
  toque medidos por script mentem quando não compõem alpha sobre o pai ou quando leem
  posição antes do scroll assentar — as duas coisas já geraram falso positivo aqui.
- **Nunca matar navegador por nome de imagem.** `taskkill /IM chrome.exe` fecha o Chrome
  do Thallis. Fechar pelo driver, ou por PID.

## Onde as coisas estão

```
generate-blog.js    gera blog/, feed, sitemap e injeta nas páginas estáticas
capa-do-post.js     garante a foto de capa (banco Magnific) e grava image: no frontmatter
ensure-queue.js     transporta o artigo irmão da esteira pra fila
publish-next.js     publica o que está na fila e commita pelo manifesto
lint-rapido.js      os três defeitos recorrentes, em 2 segundos
404.html            escrita à mão; slug truncado torna link quebrado rotina
```
