# Site Dra. Brumna Valdivieso

No ar em `https://thallisribeiro.com.br/drabrumna/` — versão única. As pastas
`drabrumna-v2` e `drabrumna` foram removidas em 01/09/2026.

Site estático, sem build. Fontes auto-hospedadas: nenhuma requisição a terceiro.

---

## O que mudou em relação à v2

| Mudança | Motivo |
| --- | --- |
| H1 de 48px para **56px** | A v1 usava 58px, no meio da faixa de 48–64px da página 2 do briefing. A v2 tinha ficado no piso da faixa |
| **Schema `Physician`** de volta na home | O briefing quer aparecer no Google e em mecanismos de IA, e marcação de entidade ajuda nisso. Vem sem nenhum campo de registro profissional, e **sem `medicalSpecialty`** — a v1 declarava `"Dermatology"`, o que contraria a regra de nunca apresentar a Dra. Brumna como dermatologista |
| **Botão flutuante de agendamento** | Atalho de conversão que existia na v1. Some quando o painel de menu abre; o corpo ganha respiro extra embaixo para não cobrir conteúdo |
| **Prévia da mensagem de WhatsApp** | Resolve o impasse entre as duas versões: a v1 tinha botão clicável mas com número falso, a v2 tinha botão honesto mas inerte. Aqui o botão abre uma prévia com a unidade, o token pendente e a mensagem exata que será enviada. A conversa pode ser validada antes de o número existir |
| **Paleta reduzida às 5 cores aprovadas** | A v2 tinha criado `#7F6921`, `#6A4B0F` e `#F3D98A` para resolver contraste. Todos saíram: rótulos e microtexto agora usam **marsala** (9,5:1), que já é da paleta. O dourado ficou 100% decorativo, mais o texto sobre marsala (4,80:1) |
| **Rodapé na forma exata da página 14** | `Dra. Brumna Valdivieso / Médica / CRM/SC [..] / Diretor Técnico: Dr. Thiago Nassif / CRM/SC [..] (RQE) [..]`, com o RQE na mesma linha do CRM, como o briefing escreveu |

## O que veio da v2 e continua

URLs em diretório, painel de menu acessível por teclado, disclaimer regulatório nas
11 páginas, 46 perguntas na FAQ com busca e âncora por pergunta, páginas legais,
consentimento LGPD, sitemap, robots, breadcrumbs, e todos os dados pendentes como
placeholder em `dados.js`.

## Como publicar

Preencher `dados.js`. Depois: remover a metatag `robots` e o bloco `.previa` das 11
páginas, trocar o domínio em `canonical`, `og:url`, `robots.txt` e `sitemap.xml`, e
mover `robots.txt` e `sitemap.xml` para a raiz do domínio.

## Testes

93 verificações automatizadas, todas passando: 78 da bateria geral (estouro
horizontal em 3 larguras, menu por teclado, disclaimer, FAQ, consentimento,
metadados, links) e 15 específicas da v3 (H1 na faixa, schema sem registro nem
especialidade, botão flutuante, prévia de WhatsApp, cores de texto restritas ao
conjunto aprovado). Contraste medido com composição de alpha: **0 falhas**.
