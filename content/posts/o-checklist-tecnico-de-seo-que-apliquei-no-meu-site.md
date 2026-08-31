---
title: "O checklist técnico de SEO que apliquei no meu próprio site"
date: 2026-08-21
tema: Site & copy
summary: Depois de auditar a copy, fiz a mesma coisa com o SEO técnico. Descobri que a home não tinha nenhum Open Graph configurado.
image: /assets/posts/o-checklist-tecnico-de-seo-que-apliquei-no-meu-site.webp
---

Depois de [auditar a copy do meu site](/blog/raio-x-da-copy-do-meu-site/), fiz a mesma coisa com a parte técnica de SEO. A régua: pesquisar prática atual, comparar com o que o blog do Grana já faz, aplicar o que estava faltando aqui.

## O que faltava

A home não tinha nenhum Open Graph configurado — nenhum `og:image`, nenhum `og:title`. Quer dizer que, até esse dia, qualquer link do meu site compartilhado no WhatsApp ou LinkedIn aparecia sem preview nenhum. A imagem principal da home (a que aparece primeiro, antes de qualquer scroll) estava marcada como `loading="lazy"` — exatamente o oposto do que deveria ser: a primeira imagem que o visitante vê nunca deveria esperar pra carregar. Nenhum dado estruturado (JSON-LD) em lugar nenhum — o Google não tinha nenhuma forma de saber, de forma explícita, quem eu sou ou o que o site é.

## O que entrou

Open Graph completo (imagem, título, descrição) em toda página, com `twitter:card` junto. A imagem principal trocou de `lazy` pra `preload`, com `width`/`height` explícitos pra não pular o layout enquanto carrega. JSON-LD com `Person` (eu, com formação real — UFV, FGV) e `WebSite` na home; `Article` e `BreadcrumbList` em cada post do blog. `robots.txt` permitindo explicitamente os crawlers de IA (faz sentido — o site é sobre construir com IA). `sitemap.xml` gerado automaticamente toda vez que o blog é atualizado, nunca à mão.

## A comparação com o Grana

O blog do Grana já tinha boa parte disso (Article, Person, sitemap, robots) — mas também estava sem `BreadcrumbList` e sem um `WebSite`/`Person` de nível de site, só por artigo. As mesmas duas peças que faltavam aqui, faltavam lá. Fica pendente replicar lá também.

## O que deixei de fora, por enquanto

Na hora dessa auditoria, o blog tinha só 2 posts — página de categoria e link entre posts relacionados não valiam a pena ainda, teria mais categoria vazia do que categoria útil. Registrei pra revisitar quando o volume crescesse. Cresceu rápido: se você está lendo isso pela barra lateral de temas, é porque esse dia chegou antes do que eu esperava.
