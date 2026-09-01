# Site Dra. Brumna Valdivieso — versão inicial para validação

Prévia hospedada em `https://thallisribeiro.com.br/drabrumna/` enquanto a Dra. valida.
Construído a partir do briefing da reunião de 28/08/2026 (`BRIEFING PARA CRIAÇÃO SITE
DRA. BRUMNA VALDIVIESO.pdf`) e dos dois documentos de referências de sites e blog.

## O que já está de pé

HTML estático puro, sem build e sem dependências. Oito páginas na ordem exata do menu
definido no briefing:

| Arquivo | Página |
| --- | --- |
| `index.html` | Home |
| `tratamentos.html` | Tratamentos |
| `tecnologias.html` | Tecnologias |
| `ninfoplastia.html` | Ninfoplastia |
| `sobre.html` | Sobre a Doutora |
| `duvidas.html` | 100 Dúvidas Frequentes |
| `blog.html` | Blog |
| `contato.html` | Contato |

A home segue a ordem de seções do briefing: hero, especialidades/tratamentos,
tecnologias, por que Dra. Brumna, autoridade, locais de atendimento, depoimentos e CTA
final.

Identidade visual conforme a página 2 do briefing: Playfair Display nos títulos,
Montserrat no corpo, paleta Marsala `#7C1E2D`, Dourado `#D4AF37`, Taupe `#B8A496`,
Bege Claro `#F2EDE7` e Off White `#FAF8F5`. Sem logotipo, por decisão da reunião.

## Pendências que dependem da Dra. ou do João

1. **CRM/SC da Dra. Brumna.** Está como `CRM/SC 00000` no rodapé de todas as páginas.
2. **CRM/SC e RQE do Dr. Thiago Nassif**, diretor técnico. Mesmo lugar, mesma marcação.
3. **WhatsApp de Florianópolis.** Todos os botões apontam para o número provisório
   `5548000000000`. Trocar com um `find`/`replace` em toda a pasta.
4. **WhatsApp de São Paulo.** Provisório `5511000000000`, mesma coisa.
5. **Endereços completos** do IMV (Florianópolis) e da Clínica Fakiani (São Paulo).
6. **Fotos.** A pasta do Drive compartilhada no briefing não estava acessível na conta
   usada aqui. As duas imagens em `assets/` foram extraídas do próprio PDF: a foto da
   Dra. e a recepção do IMV. Ainda faltam a foto de capa (ou o vídeo), a fachada da
   Fakiani, as fotos no palco da Fotona / ministrando curso / na Universidade do Porto,
   e as fotos dos aparelhos em fundo removido para a página de tecnologias. Todos os
   espaços estão marcados na página com o bloco tracejado "slot".
7. **Widget de avaliações do Google** na seção de depoimentos da home.
8. **Fecho do texto da página Sobre.** O esboço do briefing termina em "Porque acredito
   em uma estética" e a frase não foi concluída.
9. **Respostas do FAQ.** As 39 respostas escritas são rascunho e precisam de validação
   médica da Dra. antes de ir ao ar. O briefing prevê 100 perguntas e parte das
   respostas em vídeo — as restantes entram na mesma estrutura de `<details>`.
10. **Camada de edição do blog.** O briefing pede que a Dra. publique texto e foto
    sozinha. Isso exige um CMS, e a escolha (painel no próprio repositório, CMS externo
    ou WordPress) ainda não foi feita.

## Ao publicar no domínio definitivo

- Remover a `<meta name="robots" content="noindex, nofollow">` do topo das oito páginas.
  Ela existe só para a prévia não ser indexada dentro de thallisribeiro.com.br.
- Remover o bloco `<div class="previa">` de cada página.
- Atualizar as tags `<link rel="canonical">` e `og:url` para o domínio novo.
- Gerar `sitemap.xml` e `robots.txt` próprios. O foco de SEO definido no briefing é
  Florianópolis.

## Verificações feitas

- As oito páginas e os três arquivos de mídia respondem 200 em servidor local.
- Sem estouro horizontal em 390px de largura (medido com `scrollWidth` via CDP).
- Menu hamburguer abre e fecha, e o aviso de prévia é dispensável.
- `node lint-rapido.js` na raiz do repositório passa.
