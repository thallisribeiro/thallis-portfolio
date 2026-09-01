# Checklist de aceite — item por item

Status possíveis: `atendido`, `parcial`, `bloqueado`, `não atendido`.
Nada foi marcado como atendido se depende de informação ainda não fornecida.

| Requisito | Página/Componente | Status | Evidência |
| --- | --- | --- | --- |
| Oito páginas principais na ordem exata do menu | Painel de menu | atendido | Lista numerada 01–08 em `painelMenu()`; ordem Home, Tratamentos, Tecnologias, Ninfoplastia, Sobre, 100 Dúvidas, Blog, Contato |
| Home com as sete seções na ordem definida | `/` | atendido | Comentários `6.1` a `6.7` no `index.html`, na sequência hero → especialidades → mini bio → autoridade → locais → depoimentos → CTA |
| URLs em diretório conforme a estrutura pedida | Todas | atendido | `/tratamentos/`, `/tecnologias/`, `/ninfoplastia/`, `/sobre-a-dra-brumna/`, `/duvidas-frequentes/`, `/blog/`, `/contato/` |
| Playfair Display nos títulos, Montserrat no corpo | `estilo.css` | atendido | Tokens `--serif` e `--sans`; H1 `clamp(30px,4.4vw,48px)`, corpo 16px |
| Paleta exatamente a aprovada | `estilo.css` | atendido | Os cinco valores no `:root`, sem roxo, rosa vivo, azul médico, verde ou gradiente genérico |
| Contraste acessível, com verificação do dourado | Todas | atendido | Dourado vivo restrito a decoração e a texto sobre marsala; `--dourado-texto #7F6921` para fundo claro. Teste mede todo texto renderizado da Home contra o fundo real, zero falhas |
| Sem logotipo inventado | Cabeçalho, painel, rodapé | atendido | Apenas composição tipográfica do nome. O favicon é um losango da própria régua ornamental, não um monograma |
| Rejuvenescimento íntimo com prioridade clara | Home, Tratamentos | atendido | Cartão destacado na Home; bloco `01` na página de tratamentos, com 8 itens |
| Tecnologias com equipamento em fundo limpo | `/tecnologias/` | parcial | Layout editorial alternado e fundo radial pronto; as fotos recortadas não chegaram e o espaço está reservado e identificado |
| Ninfoplastia com página própria e realização hospitalar clara | `/ninfoplastia/` | atendido | Cartão destacado no topo com ambiente hospitalar, equipe especializada e médico cirurgião habilitado; texto do briefing em seis seções |
| Página Sobre com a trajetória fornecida | `/sobre-a-dra-brumna/` | atendido | Texto integral incluindo o fecho e a assinatura; cinco notas de validação ancoradas |
| Fatos pendentes sinalizados na página Sobre | `/sobre-a-dra-brumna/` | atendido | Notas 1 a 5 no fim da página, com marca sobrescrita no ponto exato do texto |
| “Dermatologista” nunca qualifica a Dra. Brumna | Todas | atendido | Única ocorrência do radical está na nota 5, que explica a substituição de “atendimento em dermatologia” por “atendimento em procedimentos estéticos” |
| “Referência” não usada como autodenominação | Todas | atendido | Ocorrências restantes: “referências internacionais” no texto aprovado da médica e “referência de origem da informação” nos Termos |
| Nome sempre “Brumna” | Todas | atendido | Nenhuma ocorrência de “Bruna” |
| Nenhum superlativo não comprovado | Todas | atendido | Sem “a melhor”, “líder”, “número 1”, “renomada” ou “resultados garantidos” |
| Sem promessa de resultado, ausência de risco ou procedimento indolor | Todas | atendido | FAQ diz que a sensação varia; Ninfoplastia mantém o parágrafo de riscos; tecnologias trazem ressalva contra equivalência a cirurgia |
| Conteúdo clínico marcado como sujeito a revisão médica | Tratamentos, Tecnologias, Ninfoplastia, FAQ | atendido | Selo `estado-revisao` em cada uma; as 46 respostas trazem “Rascunho — aguarda revisão médica” |
| Depoimentos apenas reais, do Google | Home | bloqueado | Nenhum depoimento escrito. Bloco no estado alternativo aguardando `[URL_GOOGLE_REVIEWS_OU_PLACE_ID]`; a alternativa também é o fallback de falha do widget |
| Disclaimer regulatório em todas as páginas | Rodapé | atendido | Teste confirma médica, CRM/SC, diretor técnico e RQE nas 11 páginas, fora de modal |
| CRM e RQE não inventados | Rodapé | bloqueado | Campos exibem `[CRM_DRA_BRUMNA]`, `[CRM_DR_THIAGO_NASSIF]`, `[RQE_DR_THIAGO_NASSIF]` com marcação visual. Conflito do briefing registrado, sem escolha por conta própria |
| Menu hambúrguer como controle principal | Cabeçalho | atendido | Botão `Menu` em todas as larguras; painel overlay em tela cheia |
| Menu acessível por teclado | Painel | atendido | Enter abre, Tab circula preso, Escape fecha, foco volta ao botão, `aria-expanded`, `aria-modal`, `aria-current`; nove verificações no teste |
| Rolagem do fundo bloqueada com o menu aberto | Painel | atendido | Classe `trava-rolagem` no `<html>`; teste confirma aplicação e remoção |
| CTA de agendamento discreto, sem competir com o menu | Cabeçalho | atendido | Botão vazado pequeno ao lado do menu |
| CTAs gerais da Home vão para Florianópolis | Home | atendido | Hero e CTA final usam `data-wpp="florianopolis"` |
| Contato separa as duas unidades | `/contato/` | atendido | “Agendar em Florianópolis” (IMV) e “Agendar em São Paulo” (Fakiani) em blocos equivalentes |
| WhatsApp com mensagem inicial curta, sem dado sensível | `dados.js`, `site.js` | atendido | Mensagem por unidade em `mensagemInicial`; a página de contato avisa para não enviar sintomas, exames ou fotos |
| Números não inventados | Todas | bloqueado | CTAs desativados com `aria-disabled`, sem `href`, e aviso nomeando o placeholder. Teste confirma que nenhum aponta para `wa.me/<dígitos>` |
| Evento de analytics no clique, sem dado pessoal | `site.js` | atendido | `dataLayer.push({event:'clique_whatsapp', unidade})`, só depois do consentimento e só com a unidade |
| Consentimento compatível com LGPD | Todas | atendido | Faixa na primeira visita, escolha em `localStorage`, analytics travado antes do aceite; três verificações no teste |
| Política de Privacidade, Cookies e Termos | Três páginas | parcial | Minutas escritas e linkadas no rodapé; precisam de revisão jurídica, avisada no topo de cada uma |
| Aviso de conteúdo educativo | Rodapé | atendido | Parágrafo `.rodape-aviso` nas 11 páginas |
| Hero preparado para vídeo, sem player vazio | Home | atendido | `<img>` dentro de `.hero-figura`; o CSS dimensiona por `object-fit` e aceita `<video>` no mesmo lugar. Sem carrossel |
| Tratamentos na ordem de prioridade, sem retirar itens | `/tratamentos/` | atendido | Blocos 01/02/03 com os 8, 4 e 5 itens do briefing, ortografia padronizada |
| Componente consistente por tratamento | `/tratamentos/` | atendido | Nome, resumo, áreas possíveis, aviso de avaliação individual e ação |
| Sem indicação definitiva, duração, sessões ou preço | `/tratamentos/` | atendido | Nenhum item traz esses campos; aviso explícito no topo da página |
| Quatro tecnologias obrigatórias com fonte técnica | `/tecnologias/` | atendido | Fotona StarWalker MaQX, Morpheus8, Ignite RF e Liftera 2, cada uma com link `nofollow` para a fonte do briefing |
| Morpheus8 sem afirmar substituição de cirurgia | `/tecnologias/` | atendido | Ressalva: “pode ser considerado em determinados casos, após avaliação médica” |
| Ignite RF sem “sem cicatriz” ou “sem risco” | `/tecnologias/` | atendido | Ressalva registra que a redação depende de revisão médica |
| Estrutura pronta para página por tecnologia | `/tecnologias/` | parcial | Cada bloco tem `id` e âncora estável; as páginas filhas estão propostas no LEIA-ME e aguardam aprovação |
| FAQ com índice, busca, filtro e âncoras | `/duvidas-frequentes/` | atendido | Índice por tema, busca sem acento, filtro, contagem em `role="status"`, estado vazio, âncora estável por pergunta e botão de copiar link |
| FAQ não promete 100 perguntas concluídas | `/duvidas-frequentes/` | atendido | H1 “Dúvidas Frequentes”; cartão declara 46 de uma meta de 100. Item do menu preservado conforme o briefing |
| Respostas com status de revisão | `/duvidas-frequentes/` | atendido | Todas as 46 marcadas como rascunho aguardando revisão médica |
| Pergunta sobre “dermatologista” reescrita de forma neutra | `/duvidas-frequentes/` | atendido | Virou “Estética íntima é feita apenas por ginecologista ou médica de outra área também pode atuar?” |
| Vídeos com transcrição | `/duvidas-frequentes/` | não atendido | Nenhum vídeo foi fornecido. O aviso registra que as respostas em vídeo terão transcrição |
| Blog editável pela médica | `/blog/` | bloqueado | Listagem, capa, categoria e resumo estruturados; camada de edição depende da escolha do CMS (bloqueio 11). Nenhum post fictício publicado como real |
| SEO: uma intenção por página, H1/H2/H3, title e description únicos | Todas | atendido | Teste confirma H1 único, title único, description única nas 11 páginas |
| Canonical, Open Graph, sitemap e robots | Todas | parcial | Canonical e OG em todas; `sitemap.xml` e `robots.txt` gerados com `[DOMINIO_FINAL]` e bloqueio proposital enquanto for prévia |
| Breadcrumbs nas internas | Internas | atendido | `.trilha` visível e `BreadcrumbList` em JSON-LD nas 10 internas |
| Links internos entre tratamentos, tecnologias, FAQ e contato | Todas | atendido | Cada tratamento com tecnologia relacionada aponta para a âncora; cada tecnologia aponta de volta para tratamentos e FAQ |
| Imagens otimizadas, com dimensões e alt | Todas | atendido | WebP com `width`/`height` declarados, `loading="lazy"` fora da primeira dobra, `fetchpriority="high"` no hero; teste confirma zero imagens sem alt |
| Dados estruturados adequados | FAQ, internas | parcial | `FAQPage` sobre conteúdo visível e `BreadcrumbList` nas internas. `Physician`/`MedicalBusiness` retido de propósito até CRM e RQE confirmados |
| NAP consistente | Home, Contato | bloqueado | Nome e clínica consistentes; endereço e telefone dependem de confirmação |
| Search Console e analytics com consentimento | Todas | parcial | Camada de consentimento pronta e `dataLayer` preparado; nenhuma ferramenta plugada até haver domínio e propriedade |
| Foco local em Florianópolis | Home, FAQ, Contato | atendido | Title e description da Home citam Florianópolis; FAQ tem pergunta de intenção local; CTAs gerais vão para a unidade de Florianópolis |
| Responsivo em mobile, tablet e desktop | Todas | atendido | 33 verificações de estouro horizontal, em 390px, 768px e 1440px |
| Navegação por teclado e foco visível | Todas | atendido | Link de pular para o conteúdo, `:focus-visible` com contorno marsala, painel com foco preso |
| `prefers-reduced-motion` respeitado | `estilo.css` | atendido | Bloco final zera animações, transições e rolagem suave |
| Sem autoplay com som | Todas | atendido | Não há mídia com reprodução automática |
| Estados de carregamento, erro e vazio | Avaliações, FAQ, blog | atendido | Alternativa do widget, estado vazio da busca, espaços reservados identificados |
| Sem biblioteca pesada só para efeito visual | Todas | atendido | Zero dependências de terceiros além das fontes; JS próprio de 7 blocos |
| Resultado não parece template genérico | Todas | atendido | Sem grade de cartões idênticos em tudo, sem ícones aleatórios, sem sombra pesada, sem arredondamento geral (`--raio: 2px`), sem gradiente de fundo |
| Não copiar layout ou conteúdo das referências | Todas | atendido | Nenhum texto, imagem ou código de terceiros. As referências entraram como princípio: primeira dobra, respiro, bloco de credenciais, equipamento em fundo limpo e arquitetura indexável |

## Resumo

| Status | Quantidade |
| --- | --- |
| atendido | 46 |
| parcial | 6 |
| bloqueado | 5 |
| não atendido | 1 |
