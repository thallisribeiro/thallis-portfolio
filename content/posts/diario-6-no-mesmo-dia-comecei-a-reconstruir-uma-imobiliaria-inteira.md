---
title: "Diário — Dia 6 (parte 2): No mesmo dia, comecei a reconstruir o site de uma imobiliária inteira"
date: 2026-08-15
summary: "Enquanto o blog do Grana estreava, eu abria um segundo projeto do zero: o Eunoimóvel, de scaffold a URL no ar em uma tarde."
tema: Eunoimóvel
---

Ainda [dia 6](/blog/diario-5-o-blog-foi-ao-ar-e-quase-saiu-bloqueado-por-uma-regra-que-nao-existia-mais/) — mas essa entrada é sobre o segundo projeto que nasceu na mesma data: a reconstrução do site da Eunoimóvel, uma imobiliária.

## Do zero ao ar, na mesma tarde

Comecei pelo scaffold — Payload CMS + Next.js, coleções de dados, estrutura de squad própria pra esse projeto. Nas horas seguintes: corrigi dois buracos reais de segurança que o próprio processo de revisão encontrou (upload de mídia aberto pra qualquer um escrever, e uma falha que deixava um usuário escalar o próprio nível de permissão sozinho no cadastro). Construí a primeira fatia funcional — hierarquia de localização, cadastro de imóvel premium, página de imóvel.

Bugs de infraestrutura apareceram um atrás do outro, típico de subir algo novo pra produção pela primeira vez: o painel administrativo não carregava por um arquivo de mapeamento desatualizado; o build de produção falhava porque a versão do `npm` no ambiente de deploy não batia com a que gerou o lockfile; a imagem Docker baseada em Alpine quebrava o servidor Next em tempo de execução por incompatibilidade de biblioteca (musl vs. glibc); a rede customizada do Docker Compose não era coberta pelas regras de firewall que eu esperava.

Resolvido um por um, o site foi ao ar ainda hoje, em `novo.eunoimovel.com.br` — sem HTTPS ainda, sem DNS público apontando pra ele, mas *no ar*, rodando num servidor de verdade.

## Por que isso importa

Nenhum desses bugs foi glamouroso. Foi trabalho de infraestrutura chato, do tipo que normalmente consome dias. Sair do zero pra uma URL respondendo, com autenticação e controle de acesso já auditado, no mesmo dia em que outro projeto completamente diferente também avançava — foi a primeira vez que senti, de verdade, o que "construir com IA" significava em velocidade, não só em teoria.
