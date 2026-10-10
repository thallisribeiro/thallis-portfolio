// pSEO: páginas geradas a partir de dados, ligadas às ferramentas grátis.
//
// Cada família é um módulo em pseo/<familia>.js que exporta `paginas()` (arquivos com
// "_" na frente, como _layout.js, são ajudantes e não famílias), uma lista de
// { rel, html, loc, lastmod? }:
//   rel     caminho do arquivo a escrever, relativo à raiz ("modelo-de-orcamento/eletricista/index.html")
//   html    a página inteira
//   loc     caminho público com barra final ("/modelo-de-orcamento/eletricista/")
//   lastmod "AAAA-MM-DD" da última mudança real do conteúdo (opcional; sem ele o sitemap usa o mtime)
//
// As mesmas duas regras de paginas-locais.js valem aqui, e por um motivo maior: página
// gerada em lote é exatamente o que o Google chama de "scaled content" quando é fina.
//   1. Toda página resolve a busca sozinha: traz um modelo de verdade, que abre preenchido
//      na ferramenta, e texto específico daquele caso. Nome trocado não é página.
//   2. Nada inventado: nenhum preço, número ou regra sem fonte. Preço o dono preenche.
//
// generate-blog.js chama `paginasPseo()` uma vez: escreve as páginas, põe no manifesto e no
// sitemap. Nada aqui escreve arquivo.

const fs = require('fs');
const path = require('path');

function modulos() {
  return fs.readdirSync(__dirname)
    .filter((f) => f.endsWith('.js') && f !== 'index.js' && !f.startsWith('_') && !f.endsWith('.test.js'))
    .sort()
    .map((f) => ({ nome: f.replace(/\.js$/, ''), mod: require(path.join(__dirname, f)) }));
}

/** Todas as páginas de todas as famílias, validadas (caminho único, forma certa). */
function paginasPseo() {
  const todas = [];
  const vistos = new Set();
  for (const { nome, mod } of modulos()) {
    if (typeof mod.paginas !== 'function') throw new Error(`pseo/${nome}.js não exporta paginas()`);
    for (const p of mod.paginas()) {
      if (!/^[a-z0-9-]+(\/[a-z0-9-]+)*\/index\.html$/.test(p.rel)) throw new Error(`pseo/${nome}: rel inválido "${p.rel}"`);
      if (p.loc !== `/${p.rel.replace(/index\.html$/, '')}`) throw new Error(`pseo/${nome}: loc "${p.loc}" não bate com "${p.rel}"`);
      if (vistos.has(p.rel)) throw new Error(`pseo/${nome}: página repetida "${p.rel}"`);
      if (typeof p.html !== 'string' || !p.html.startsWith('<!doctype html>')) throw new Error(`pseo/${nome}: html inválido em "${p.rel}"`);
      if (p.lastmod && !/^\d{4}-\d{2}-\d{2}$/.test(p.lastmod)) throw new Error(`pseo/${nome}: lastmod inválido em "${p.rel}"`);
      vistos.add(p.rel);
      todas.push(p);
    }
  }
  return todas;
}

module.exports = { paginasPseo };
