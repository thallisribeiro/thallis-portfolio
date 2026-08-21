#!/usr/bin/env node
// Busca 1 foto real no Unsplash por palavra-chave, pra usar como imagem de destaque
// nos posts do blog. Segue as regras da API: hotlink direto na URL retornada (nunca
// baixa/re-hospeda), dispara o endpoint de "download" sempre que a imagem é
// efetivamente usada (não só pré-visualizada) — obrigatório pelas diretrizes da API,
// não é opcional.
//
// Uso: node buscar-imagem.js "<palavra-chave de busca>"
// Saída (stdout): JSON { url, credit_html, fotografo, url_unsplash } ou null se não achou.

const fs = require('fs');
const path = require('path');
// Node 18+ tem fetch nativo global — sem dependência nova neste repo (que não tem
// package.json/node_modules de propósito, é só scripts planos).

function carregarEnv() {
  const envPath = path.join(__dirname, '.env');
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  for (const linha of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const l = linha.trim();
    if (!l || l.startsWith('#')) continue;
    const i = l.indexOf('=');
    if (i === -1) continue;
    env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  }
  return env;
}

const APP_NAME = 'thallisribeiro-blog';

async function buscarImagem(query) {
  const env = carregarEnv();
  const accessKey = env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.error('[buscar-imagem] UNSPLASH_ACCESS_KEY ausente no .env — pulando imagem pra este post.');
    return null;
  }

  const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&content_filter=high`;
  const searchRes = await fetch(searchUrl, { headers: { Authorization: `Client-ID ${accessKey}` } });
  if (!searchRes.ok) {
    console.error(`[buscar-imagem] busca falhou: ${searchRes.status} ${await searchRes.text()}`);
    return null;
  }
  const searchData = await searchRes.json();
  const foto = searchData.results && searchData.results[0];
  if (!foto) {
    console.error(`[buscar-imagem] nenhuma foto encontrada pra "${query}"`);
    return null;
  }

  // Obrigatório pelas diretrizes da API: disparar o endpoint de download sempre que a
  // foto é de fato usada (não só buscada/pré-visualizada).
  try {
    await fetch(`${foto.links.download_location}&client_id=${accessKey}`);
  } catch (e) {
    console.error(`[buscar-imagem] aviso: trigger de download falhou (não bloqueia): ${e.message}`);
  }

  const utm = `utm_source=${APP_NAME}&utm_medium=referral`;
  const perfilFotografo = `${foto.user.links.html}?${utm}`;
  const linkUnsplash = `https://unsplash.com/?${utm}`;

  return {
    url: foto.urls.regular,
    fotografo: foto.user.name,
    url_unsplash: foto.links.html,
    credit_html: `Foto por <a href="${perfilFotografo}" target="_blank" rel="noopener">${foto.user.name}</a> no <a href="${linkUnsplash}" target="_blank" rel="noopener">Unsplash</a>`,
  };
}

async function main() {
  const query = process.argv.slice(2).join(' ');
  if (!query) {
    console.error('Uso: node buscar-imagem.js "<palavra-chave>"');
    process.exit(1);
  }
  const resultado = await buscarImagem(query);
  console.log(JSON.stringify(resultado));
}

if (require.main === module) {
  main();
}

module.exports = { buscarImagem };
