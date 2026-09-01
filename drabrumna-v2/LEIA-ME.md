# Site Dra. Brumna Valdivieso — v2

Entrega construída a partir do briefing da reunião de 28/08/2026 e da especificação
de aceite recebida. Prévia em `https://thallisribeiro.com.br/drabrumna-v2/`.

Site estático, sem build e sem dependências de terceiros além das fontes do Google.

---

## 1. Inventário de materiais

### Recebido

| Material | Situação |
| --- | --- |
| `BRIEFING PARA CRIAÇÃO SITE DRA. BRUMNA VALDIVIESO.pdf` | 15 páginas lidas integralmente, incluindo a prancha visual da página 2 |
| Briefing de referências de site e blog (2 documentos) | Lidos |
| Paleta e tipografia | Extraídas da imagem da página 2: Marsala `#7C1E2D`, Dourado `#D4AF37`, Taupe `#B8A496`, Bege `#F2EDE7`, Off-white `#FAF8F5`; Playfair Display + Montserrat |
| Foto da Dra. Brumna | Extraída do PDF (página 12). Baixa resolução, serve como prova de layout |
| Foto da recepção do IMV | Extraída do PDF (página 12), recortada da captura de tela de um vídeo |

### Ausente

| Material | Impacto |
| --- | --- |
| Pasta de fotos do Drive (`1zwF44M5DnZmYs7bhAf2RF9eJq3khqjTw`) | Não acessível pela conta usada. Metadados visíveis (dono `guilgerjoaofotografia@gmail.com`), conteúdo não. Faltam foto de capa, fachada da Fakiani, palco da Fotona, aula, Universidade do Porto |
| Fotos dos equipamentos em fundo infinito | Seção de tecnologias fica com espaço reservado. Não republicamos imagem de fabricante sem verificar direito de uso |
| Registros profissionais confirmados | Ver conflito abaixo |
| Números de WhatsApp, endereços e horários | CTAs ficam desativados com aviso |
| Perfil do Google para avaliações | Bloco de prova social fica no estado alternativo |

### Conflitos e hipóteses

1. **Registro profissional.** A página 14 do PDF traz `CRM/SC XXX (RQE) yyy`, e a especificação
   menciona `CRM 32518 | 223200` vindo da biografia. Não escolhemos nenhum: jurisdição e
   formato precisam de confirmação documental. Todos os campos ficam como placeholder.
2. **“Atendimento em dermatologia”.** O texto da página Sobre, no briefing original, traz essa
   expressão, mas a especificação proíbe apresentar a Dra. Brumna como dermatologista.
   Substituímos provisoriamente por “atendimento em procedimentos estéticos” e marcamos com
   nota de validação visível na própria página (nota 5).
3. **“100 dúvidas”.** O briefing fornece 46 perguntas e nenhuma resposta aprovada. O item do
   menu permanece com o nome definido no briefing; o título da página é “Dúvidas Frequentes”,
   com aviso visível de 46 de 100. Nenhuma resposta foi apresentada como aprovada.
4. **BodyTite.** Aparece em três perguntas da FAQ mas não consta da lista de tecnologias. As
   respostas tratam o assunto de forma informativa e não afirmam que a Dra. Brumna oferece o
   procedimento.
5. **Fecho do texto Sobre.** O PDF terminava em “Porque acredito em uma estética”. A
   especificação forneceu o fecho e a assinatura, que foram usados na íntegra.

---

## 2. Mapa do site

```
/                              Home
├── /tratamentos/              Tratamentos
├── /tecnologias/              Tecnologias
├── /ninfoplastia/             Ninfoplastia
├── /sobre-a-dra-brumna/       Sobre a Doutora
├── /duvidas-frequentes/       100 Dúvidas Frequentes (FAQ)
├── /blog/                     Blog
├── /contato/                  Contato
├── /politica-de-privacidade/  (rodapé)
├── /politica-de-cookies/      (rodapé)
└── /termos-de-uso/            (rodapé)
```

### Subpáginas indexáveis propostas — aguardando aprovação, não publicadas

A arquitetura já suporta páginas filhas. Nenhuma foi criada porque exigem texto original
aprovado. Proposta para aprovação:

- `/tratamentos/clareamento-intimo/`
- `/tratamentos/preenchimento-intimo/`
- `/tratamentos/bioestimulador-vulvar/`
- `/tratamentos/flacidez-intima/`
- `/tratamentos/rejuvenescimento-intimo-pos-emagrecimento/`
- `/tratamentos/protocolo-bumbum-v/`
- `/tecnologias/fotona-starwalker-maqx/`
- `/tecnologias/morpheus8/`
- `/tecnologias/ignite-rf/`
- `/tecnologias/liftera-2/`

Cada uma precisará de título e descrição próprios, URL curta, breadcrumb, links internos e
CTA, sem duplicar conteúdo.

---

## 3. Matriz de conteúdo por página

| Página | Intenção principal | H1 | Conversão | Estado do conteúdo |
| --- | --- | --- | --- | --- |
| Home | Quem é, o que trata, como agendar | Rejuvenescimento íntimo e corporal, avaliado caso a caso | WhatsApp Florianópolis | Aprovado, exceto credenciais a conferir |
| Tratamentos | Portfólio por área, com prioridade íntima | Tratamentos | Agendar avaliação | Rascunho em revisão médica |
| Tecnologias | O que cada equipamento faz | Tecnologias | Agendar avaliação | Rascunho em revisão médica |
| Ninfoplastia | Entender o procedimento | Ninfoplastia | Agendar avaliação | Texto do briefing, só ajuste de legibilidade |
| Sobre a Dra. Brumna | Trajetória e autoridade | Sobre a Dra. Brumna | Agendar avaliação | Texto do briefing + 5 notas de validação |
| Dúvidas Frequentes | Busca informacional local | Dúvidas Frequentes | Agendar avaliação | 46 respostas em rascunho |
| Blog | Conteúdo editorial | Blog | Agendar avaliação | Estrutura pronta, CMS pendente |
| Contato | Agendamento por unidade | Contato | WhatsApp por cidade | Endereços pendentes |
| Páginas legais | Conformidade | Título de cada uma | — | Minuta, precisa de revisão jurídica |

---

## 4. Wireframe textual

### Home — desktop

```
[ faixa de prévia ]
[ cabeçalho sticky: nome tipográfico | Agendar consulta · Menu ]
┌─────────────────────────┬───────────────────────────┐
│ olho: Florianópolis·SP  │                           │
│ H1 (Playfair 48px)      │   foto (object-fit cover) │
│ régua dourada           │                           │
│ chamada                 │                           │
│ [Agendar] [Tratamentos] │  [ credencial em marsala ] │
└─────────────────────────┴───────────────────────────┘
  2. Áreas de cuidado — 3 cartões (íntimo destacado em dourado)
  2b. Tecnologias — faixa bege, 4 cartões + botão
  3. Por que Dra. Brumna — foto | texto, link para Sobre
  4. Autoridade — faixa marsala, 6 blocos em grade 3×2
  5. Locais — 2 cartões equivalentes, Florianópolis primeiro
  6. Depoimentos — faixa bege, área do widget ou alternativa
  7. CTA final — faixa marsala, centralizado
[ rodapé: navegação | informações | identificação médica | aviso ]
[ faixa de consentimento (primeira visita) ]
```

### Home — mobile (≤900px)

```
[ prévia ] [ cabeçalho: nome | Agendar · Menu ]
[ foto 4:3 em largura total ]      ← imagem sobe para cima do texto
[ olho / H1 / régua / chamada / CTA empilhados ]
[ cartões 1 coluna ]  [ tecnologias 1 coluna ]
[ foto acima, texto abaixo ]  [ autoridade 1 coluna ]
[ unidades 1 coluna ]  [ avaliações ]  [ CTA ]
[ rodapé em 1 coluna ]
```

### Painel de menu (todas as larguras)

```
overlay marsala, tela cheia
  topo: nome tipográfico              [ Fechar ]
  lista numerada 01–08, Playfair grande, item atual em dourado com •
  rodapé: [ Agendar consulta ]
teclado: Enter/Espaço abre · Tab circula preso dentro · Escape fecha
          foco volta ao botão · rolagem do fundo travada
```

### Páginas internas

```
[ topo bege: trilha · olho · H1 · régua · chamada ]
[ conteúdo em coluna de leitura de 780px, ou grade quando aplicável ]
[ CTA final em faixa marsala ]
[ rodapé com disclaimer ]
```

---

## 5. Design system

Arquivo único: `estilo.css`, com tokens no `:root`.

### Cor

| Token | Valor | Uso |
| --- | --- | --- |
| `--marsala` | `#7C1E2D` | Títulos, botões principais, foco |
| `--marsala-fundo` | `#6A1926` | Faixas amplas e rodapé |
| `--dourado` | `#D4AF37` | Somente decorativo e texto sobre marsala |
| `--dourado-texto` | `#7F6921` | Texto dourado sobre fundo claro |
| `--taupe` | `#B8A496` | Bordas e preenchimentos, nunca texto |
| `--bege` | `#F2EDE7` | Seções alternadas |
| `--offwhite` | `#FAF8F5` | Fundo predominante |
| `--tinta` | `#2B2320` | Texto principal |
| `--tinta-suave` | `#6B605A` | Texto auxiliar |

**Por que existe o `--dourado-texto`.** O dourado aprovado atinge 1,98:1 sobre off-white e
1,81:1 sobre bege — reprova WCAG AA para texto, e a especificação pede verificação explícita
dessa combinação. O `#7F6921` é o mesmo dourado escurecido, com 5,02:1 sobre off-white e
4,57:1 sobre bege. O dourado original continua em linhas, losangos e texto sobre marsala
(4,80:1). O taupe, com 2,25:1, ficou restrito a bordas e preenchimentos.

### Tipografia

| Papel | Fonte | Tamanho |
| --- | --- | --- |
| H1 | Playfair Display Bold | `clamp(30px, 4.4vw, 48px)` |
| H2 | Playfair Display Medium | `clamp(24px, 2.9vw, 30px)` |
| H3 | Playfair Display SemiBold | `clamp(18px, 1.8vw, 21px)` |
| Corpo | Montserrat Regular | 16px, entrelinha 1.75, largura 68ch |
| Botões e rótulos | Montserrat SemiBold | 14px, `letter-spacing .1em` |

### Espaçamento

Escala de 4px (`--e1` a `--e9`) e `--respiro: clamp(64px, 8vw, 112px)` entre seções.

### Componentes

Botão (sólido, vazado, dourado, pequeno), link com seta, cartão, cartão destacado,
espaço reservado, selo, estado de revisão, régua ornamental, trilha, unidade de
atendimento, item de tratamento, bloco de tecnologia, pergunta em `<details>`,
ferramentas da FAQ, notas de validação, faixa de consentimento, painel de menu, rodapé.

Estados cobertos: repouso, hover, foco visível (`outline` marsala de 2px), desativado
(CTA com dado pendente), vazio (busca da FAQ sem resultado), alternativa (avaliações do
Google sem fonte), `prefers-reduced-motion`.

---

## 6. Como editar os dados pendentes

Ponto único: `dados.js`. Enquanto o valor continuar entre colchetes, o site trata o dado
como pendente — o CTA fica desativado com aviso e o campo aparece marcado no texto. Ao
substituir por um número real, o botão vira link `wa.me` com a mensagem inicial e passa a
disparar o evento de analytics. Nenhum outro arquivo precisa mudar.

---

## 7. CMS do blog e da FAQ — decisão pendente

O briefing pede que a Dra. Brumna publique texto e foto sem depender de programador, e que a
FAQ tenha status `rascunho` / `em revisão médica` / `aprovada`. Um site estático não entrega
isso sozinho. A listagem, a categoria, o post individual e a busca já estão estruturados;
falta escolher a camada de edição. A escolha muda prazo e custo e está listada como bloqueio
de publicação nº 11.

---

## 8. Bloqueios de publicação

| # | Bloqueio | Situação |
| --- | --- | --- |
| 1 | CRM da Dra. Brumna | Pendente |
| 2 | CRM e RQE do Dr. Thiago Nassif | Pendente |
| 3 | Confirmação de que Dr. Thiago Nassif é o Diretor Técnico e da forma de exibição | Pendente |
| 4 | Conflito entre “CRM 32518 \| 223200” e os placeholders do briefing | Pendente |
| 5 | Números de WhatsApp das duas unidades | Pendente |
| 6 | Endereços e horários | Pendente |
| 7 | Origem aprovada das avaliações do Google | Pendente |
| 8 | Direito de uso das fotos da médica, clínicas, eventos e equipamentos | Pendente |
| 9 | Revisão médica de todo o conteúdo clínico | Pendente |
| 10 | Revisão regulatória da apresentação profissional e dos disclaimers | Pendente |
| 11 | Definição do CMS e acesso da Dra. Brumna ao blog | Pendente |
| 12 | Conteúdo para completar as 100 perguntas | Contornado: página renomeada e contagem real exibida |
| 13 | Política de Privacidade, Cookies, Termos e consentimento | Minuta pronta, falta revisão jurídica |
| 14 | Domínio, hospedagem, segurança, backup e responsável técnico | Pendente |

---

## 9. Testes executados

Bateria automatizada com 79 verificações, via CDP em Edge headless. Todas passaram.

| Grupo | Cobertura |
| --- | --- |
| Estouro horizontal | 11 páginas × 390px, 768px e 1440px |
| Painel de menu | Abre com Enter, `aria-expanded`, trava de rolagem, foco entra no painel, foco preso, `aria-current`, Escape fecha, rolagem liberada, foco volta ao botão |
| Contraste | Todo texto renderizado da Home medido contra o fundo real; nenhum abaixo do mínimo AA |
| CTAs de WhatsApp | Nenhum aponta para número inventado, todos marcados como desativados, todos com aviso |
| Campos pendentes | Todos exibidos entre colchetes e com marcação visual |
| Disclaimer | Presente nas 11 páginas, com médica, CRM/SC, diretor técnico e RQE |
| FAQ | 46 perguntas, busca, filtro por tema, estado vazio, âncora abre a pergunta, âncoras únicas |
| Consentimento | Aviso na primeira visita, analytics desligado antes do aceite, recusa registrada |
| Metadados | H1 único, title único, description única, canonical, Open Graph, trilha, link de pular, nenhuma imagem sem alt |
| Links internos | Nenhum quebrado |

---

## 10. Ao publicar no domínio definitivo

1. Preencher `dados.js`.
2. Remover a metatag `robots` de cada `index.html` (11 arquivos).
3. Remover o bloco `<div class="previa">` de cada página.
4. Trocar o domínio em `canonical`, `og:url`, `robots.txt` e `sitemap.xml`.
5. Mover `robots.txt` e `sitemap.xml` para a raiz do domínio e inverter o `Disallow`.
6. Liberar os dados estruturados `Physician`/`MedicalBusiness`, que ficaram retidos até a
   confirmação de CRM e RQE.
7. Conectar o widget de avaliações do Google e a ferramenta de analytics.
