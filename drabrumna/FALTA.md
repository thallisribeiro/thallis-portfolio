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
| B3b | **WhatsApp de Florianópolis** — chegou no PDF de ajustes (48 99972-0826) e está cadastrado no painel; falta só o de São Paulo (B2) | — | Fechado em 04/09/2026 |
| B4 | ~~Acesso à pasta de fotos do Drive~~ — **RESOLVIDO em 04/09/2026**: pasta pública lida por completo (85 itens); vídeo do hero, fotos das áreas, dos 4 aparelhos, da jornada, de atendimento e da Clínica Fakiani já estão no painel e no site | Página 15 | Fechado |
| B5 | ~~Foto de capa profissional~~ — **substituída pelo vídeo do hero** (3:4 no celular, horizontal no desktop), vindo do Drive | Página 5 | Fechado em 04/09/2026 |
| B6 | ~~Foto da Clínica Fakiani~~ — entrou (fachada, do Drive) | Páginas 5 e 12 | Fechado em 04/09/2026 |
| B8 | **@ do Instagram da Dra.** — o site não tem nenhum link de rede social; para este público o Instagram é a checagem de confiança antes do WhatsApp | — | Rodapé, página Sobre e schema |
| B7 | ~~Fotos da Dra. no palco da Fotona, ministrando curso e na Universidade do Porto~~ — viraram o carrossel da trajetória na home (5 fotos) | Página 9 | Fechado em 04/09/2026 |

## C. Depende de terceiros (3 itens)

| # | O que falta | Onde o briefing pede | Onde está bloqueando |
| --- | --- | --- | --- |
| C1 | **Chave da Google Places API** — o perfil já foi identificado (kgmid /g/11xlzk9c2w, "Dra Brumna Valdivieso"); a integração está pronta no gerador e hoje mostra o link "Ver avaliações no Google". Com a chave no servidor (`GOOGLE_PLACES_KEY`), nota e avaliações reais entram sozinhas | Página 5 | Seção de avaliações |
| C2 | ~~Fotos dos aparelhos em fundo infinito~~ — as 4 vieram do Drive da cliente (Fotona, Morpheus8, Ignite RF, Liftera 2) | Página 7 | Fechado em 04/09/2026 |
| C3 | **Domínio final e hospedagem** — enquanto o site estiver em subpasta, o índice fica bloqueado de propósito | Página 14 | Metatags `robots`, `canonical`, `sitemap.xml` |

## D. Depende de decisão do Thallis (2 itens)

| # | O que falta | Onde o briefing pede | Situação |
| --- | --- | --- | --- |
| D1 | ~~Camada de edição do blog~~ — **ENTREGUE**: painel Payload no ar no VPS (login e senha próprios da Dra., blog e FAQ editáveis, site estático regerado a cada publicação). Falta só o subdomínio/DNS do item C3 para acessar o /admin | Página 13 | Fechado em 01/09/2026 |
| D2 | **Completar as 100 perguntas** — o briefing lista 46 e pede 100. Faltam 54, que dependem de pesquisa de intenção e passam pela mesma aprovação médica de A4. A página não promete 100 enquanto não houver | Páginas 10 e 11 | Página de dúvidas |
| D3 | **Ativar a medição de cliques** — os eventos (clique no WhatsApp, por unidade) e o consentimento LGPD já estão prontos no site; falta o coletor. Bloqueado até existir domínio com TLS (coletor self-host sem https é barrado pelo navegador). Opções: GTM+GA4 (conta Google) ou Umami no próprio VPS | — | Ligar na virada do domínio |
| D4 | **Destino do backup fora do VPS** — o backup diário funciona, mas mora no mesmo disco do site; falta decidir para onde espelhar (Drive? esta máquina?) | — | Decisão sua |

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

**19 pendências, 8 fechadas em 04/09/2026 (B4–B7, C2, D1, WhatsApp de Florianópolis e vídeo do hero).** Nenhuma é de construção: 16 são dados ou material que precisam chegar, e 3 são decisões (D2, D3, D4). O blog editável — requisito explícito do briefing — está ENTREGUE via painel Payload; falta só o subdomínio/DNS (C3) para a Dra. acessar. Assim que A1 a A3 e B1 a B3 forem respondidos, o site sai da prévia e vai para o ar no domínio definitivo.
