# O que falta para o site ficar 100% igual ao briefing

Lista fechada, organizada por quem resolve. Nada aqui é opinião de design: são
itens que o PDF de briefing pede e que ainda não estão entregues.

---

## A. Depende da Dra. Brumna (6 itens)

| # | O que falta | Onde o briefing pede | Onde está bloqueando |
| --- | --- | --- | --- |
| A1 | **CRM/SC da Dra. Brumna** | Página 14 | Rodapé das 11 páginas, como `[CRM_DRA_BRUMNA]` |
| A2 | **CRM/SC e RQE do Dr. Thiago Nassif** | Página 14 | Rodapé das 11 páginas |
| A3 | **Confirmar o conflito de registro** — o PDF traz `CRM/SC XXX (RQE) yyy`; há também a menção a `CRM 32518 \| 223200`. Precisa dizer qual é o número, de qual conselho e em que formato exibir | Página 14 | Impede liberar A1 e A2 |
| A4 | **Aprovar as 46 respostas da FAQ** — todas estão marcadas como rascunho aguardando revisão médica | Páginas 10 e 11 | Página de dúvidas |
| A5 | **Fechar a frase da página Sobre** — o esboço do PDF termina em "Porque acredito em uma estética". O fecho usado veio de material posterior e precisa da confirmação dela | Página 9 | Página Sobre |
| A6 | **Autorizar as credenciais** — mestrado no Porto, IMCAS Paris, AMWC, speaker Fotona, docência, coordenação na Human Clinic, Instituto V La Vie. Estão publicadas com nota de validação | Páginas 5 e 9 | Home e página Sobre |

## B. Depende da clínica ou do João (7 itens)

| # | O que falta | Onde o briefing pede | Onde está bloqueando |
| --- | --- | --- | --- |
| B1 | **WhatsApp de Florianópolis** | Páginas 5 e 12 | Todos os CTAs, como `[WHATSAPP_FLORIANOPOLIS]` |
| B2 | **WhatsApp de São Paulo** | Página 12 | CTAs da unidade de SP |
| B3 | **Endereços do IMV e da Clínica Fakiani** | Página 12 | Home e Contato |
| B4 | **Acesso à pasta de fotos do Drive** — a conta usada aqui vê os metadados mas não lista o conteúdo | Página 15 | Todos os espaços reservados |
| B5 | **Foto de capa profissional** — a imagem atual foi extraída do próprio PDF e é de baixa resolução | Página 5 | Hero da home |
| B6 | **Foto da Clínica Fakiani** | Páginas 5 e 12 | Home e Contato |
| B7 | **Fotos da Dra. no palco da Fotona, ministrando curso e na Universidade do Porto** | Página 9 | Página Sobre |

## C. Depende de terceiros (3 itens)

| # | O que falta | Onde o briefing pede | Onde está bloqueando |
| --- | --- | --- | --- |
| C1 | **Perfil do Google para as avaliações** — o link ou o Place ID do perfil onde estão as avaliações reais | Página 5 | Seção de depoimentos |
| C2 | **Fotos dos aparelhos em fundo infinito** — o briefing manda pegar no site dos fabricantes. Antes de republicar, é preciso confirmar direito de uso com Fotona, Skintec e Entera | Página 7 | Página de tecnologias, 4 espaços |
| C3 | **Domínio final e hospedagem** — enquanto o site estiver em subpasta, o índice fica bloqueado de propósito | Página 14 | Metatags `robots`, `canonical`, `sitemap.xml` |

## D. Depende de decisão do Thallis (2 itens)

| # | O que falta | Onde o briefing pede | Situação |
| --- | --- | --- | --- |
| D1 | **Camada de edição do blog** — o briefing pede que a própria Dra. publique foto e texto sem programador. É a maior lacuna: nenhuma das três versões entrega. Listagem, categoria, post e busca já estão estruturados; falta escolher o CMS. Recomendação: Decap CMS, gratuito, baseado em git, roda no próprio GitHub Pages; exige um intermediário de OAuth. Estimativa: meio dia | Página 13 | Página de blog |
| D2 | **Completar as 100 perguntas** — o briefing lista 46 e pede 100. Faltam 54, que dependem de pesquisa de intenção e passam pela mesma aprovação médica de A4. A página não promete 100 enquanto não houver | Páginas 10 e 11 | Página de dúvidas |

---

## Já entregue e conferido

Para não confundir o que falta com o que está pronto, estes itens do briefing estão
fechados e verificados por medição:

- Menu com os 8 itens na ordem e com os nomes exatos da página 4
- Home com as 7 seções na ordem exata da página 5
- Os 20 tratamentos da página 6, na ordem de prioridade, cobertura completa
- As 4 tecnologias da página 7, com nome correto e a fonte técnica citada
- Página exclusiva de ninfoplastia, com o texto do briefing e destaque para a
  realização hospitalar com equipe especializada e cirurgião habilitado
- Página Sobre com o texto da página 9
- As 46 perguntas listadas nas páginas 10 e 11, com âncora própria
- Contato dividido em Florianópolis e São Paulo, com os títulos da página 12
- Diretor Técnico Dr. Thiago Nassif ao final das 11 páginas, na forma da página 14
- Paleta e tipografia da página 2, sem logotipo
- Foco de SEO em Florianópolis

---

## Resumo

**18 pendências.** Nenhuma é de construção: 16 são dados ou material que precisam
chegar, e 2 são decisões. Assim que A1 a A3 e B1 a B3 forem respondidos, o site sai
da prévia e vai para o ar no domínio definitivo — o resto pode entrar depois, sem
travar a publicação, com uma exceção: **D1, o blog editável, é requisito explícito
do briefing e continua em aberto.**
