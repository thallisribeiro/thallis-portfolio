// Monta pseo/dados/ddd.json (família pseo/ddd.js) a partir dos dados abertos oficiais.
//
//   node pseo/dados/build-ddd.mjs <Codigos_Nacionais.csv> [populacao-ibge.json]
//
// 1. Anatel, Plano Geral de Códigos Nacionais: baixe e descompacte
//    https://www.anatel.gov.br/dadosabertos/paineis_de_dados/areastarifarias/pgcn.zip
//    ("dados abertos" do painel https://informacoes.anatel.gov.br/paineis/areas-tarifarias/codigos-nacionais).
//    A data do arquivo dentro do zip (o unzip preserva) vai para o JSON como data do arquivo da Anatel.
// 2. Opcional, para ordenar as cidades da maior para a menor: IBGE, Estimativas da População,
//    tabela 6579 do SIDRA, todos os municípios, num ano só:
//    https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/<ano>/variaveis/9324?localidades=N6[all]
//    Sem esse arquivo, as cidades saem em ordem alfabética.
// Rode logo depois de baixar: a data de hoje vai para o JSON como "baixado em".

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [csvPath, ibgePath] = process.argv.slice(2);
if (!csvPath) {
  console.error('uso: node pseo/dados/build-ddd.mjs <Codigos_Nacionais.csv> [populacao-ibge.json]');
  process.exit(1);
}

const hoje = (d = new Date()) => d.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }); // AAAA-MM-DD
const iso = (br) => br.split('/').reverse().join('-'); // 13/06/2001 -> 2001-06-13
const nomeUf = (s) => s.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, a, b) => a + b.toUpperCase()).replace(/ (Do|Da|De) /g, (m) => m.toLowerCase());

// CSV da Anatel: ";" como separador, aspas só quando o nome tem apóstrofo, BOM e CRLF.
const campos = (linha) => [...linha.matchAll(/(?:^|;)(?:"((?:[^"]|"")*)"|([^;]*))/g)].map((m) => (m[1] ?? m[2]).replace(/""/g, '"').trim());
const [cab, ...linhas] = fs.readFileSync(csvPath, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
const col = Object.fromEntries(campos(cab).map((c, i) => [c, i]));
for (const c of ['CO_MUNICIPIO', 'SG_UF', 'NO_UF', 'NO_MUNICIPIO', 'CN', 'DT_INICIO_VIGENCIA', 'DT_FIM_VIGENCIA', 'DE_ALTERACAO_REGULAMENTAR', 'VIGENTE']) {
  if (!(c in col)) throw new Error(`coluna ${c} não está no CSV — a Anatel mudou o formato?`);
}
const regs = linhas.map(campos).map((r) => ({
  ibge: r[col.CO_MUNICIPIO], uf: r[col.SG_UF], estado: nomeUf(r[col.NO_UF]), nome: r[col.NO_MUNICIPIO], cn: r[col.CN],
  inicio: r[col.DT_INICIO_VIGENCIA], fim: r[col.DT_FIM_VIGENCIA], ato: r[col.DE_ALTERACAO_REGULAMENTAR], vigente: r[col.VIGENTE] === 'Sim',
}));
for (const r of regs) {
  if (!/^\d{7}$/.test(r.ibge) || !/^[1-9]\d$/.test(r.cn) || !/^[A-Z]{2}$/.test(r.uf) || !/^\d\d\/\d\d\/\d{4}$/.test(r.inicio) || !r.nome) {
    throw new Error(`linha fora do formato: ${JSON.stringify(r)}`);
  }
}

// População (opcional)
let pop = null, ibgeFonte = null;
if (ibgePath) {
  const j = JSON.parse(fs.readFileSync(ibgePath, 'utf8'));
  const series = j[0].resultados[0].series;
  const ano = Object.keys(series[0].serie)[0];
  pop = new Map(series.map((s) => [s.localidade.id, { n: /^\d+$/.test(s.serie[ano]) ? Number(s.serie[ano]) : null, nome: s.localidade.nome.replace(/ - [A-Z]{2}$/, '') }]));
  ibgeFonte = {
    nome: 'IBGE, Estimativas da População, tabela 6579 (População residente estimada)',
    url: 'https://sidra.ibge.gov.br/tabela/6579',
    api: `https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/${ano}/variaveis/9324?localidades=N6[all]`,
    ano, baixadoEm: hoje(),
  };
}

const vigentes = regs.filter((r) => r.vigente);
const estados = {};
const ddds = {};
for (const r of vigentes) {
  estados[r.uf] = r.estado;
  const d = (ddds[r.cn] ||= { ufs: [], municipios: [] });
  if (!d.ufs.includes(r.uf)) d.ufs.push(r.uf);
  const p = pop?.get(r.ibge);
  const m = { nome: r.nome, ibge: r.ibge, uf: r.uf };
  if (pop) m.pop = p?.n ?? null;
  if (p && p.nome !== r.nome) m.nomeIbge = p.nome; // Açu/Assú: a busca acha pelos dois
  d.municipios.push(m);
}
const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR');
for (const d of Object.values(ddds)) {
  d.ufs.sort();
  d.municipios.sort(pop ? (a, b) => (b.pop ?? -1) - (a.pop ?? -1) || porNome(a, b) : porNome);
}

// Mudanças que a própria Anatel registra: município que trocou de DDD, ou que entrou no plano
// depois da data inicial (a menor data de início do arquivo).
const inicial = vigentes.map((r) => iso(r.inicio)).sort()[0];
const mudancas = [];
for (const r of vigentes) {
  const antes = regs.filter((x) => !x.vigente && x.ibge === r.ibge && x.cn !== r.cn);
  if (!antes.length && iso(r.inicio) === inicial) continue;
  const de = antes.sort((a, b) => iso(b.fim).localeCompare(iso(a.fim)))[0]?.cn ?? null;
  mudancas.push({ nome: r.nome, ibge: r.ibge, uf: r.uf, de, para: r.cn, desde: iso(r.inicio), ato: r.ato });
}
mudancas.sort((a, b) => a.desde.localeCompare(b.desde) || a.nome.localeCompare(b.nome, 'pt-BR'));

// Quem está em dois DDDs ao mesmo tempo: não deveria existir; se aparecer, é para relatar.
const contagem = new Map();
for (const r of vigentes) contagem.set(r.ibge, [...(contagem.get(r.ibge) || []), r.cn]);
const duplicados = [...contagem].filter(([, c]) => c.length > 1);

const saida = {
  fonte: {
    anatel: {
      nome: 'Anatel, Plano Geral de Códigos Nacionais (PGCN), dados abertos do painel de Códigos Nacionais',
      arquivo: path.basename(csvPath),
      url: 'https://www.anatel.gov.br/dadosabertos/paineis_de_dados/areastarifarias/pgcn.zip',
      painel: 'https://informacoes.anatel.gov.br/paineis/areas-tarifarias/codigos-nacionais',
      conjunto: 'https://dados.gov.br/dados/conjuntos-dados/codigos-nacionais-cn',
      dataArquivo: hoje(fs.statSync(csvPath).mtime),
      baixadoEm: hoje(),
      inicioPlano: inicial,
      atoInicial: vigentes.find((r) => iso(r.inicio) === inicial).ato,
    },
    ibge: ibgeFonte,
  },
  estados: Object.fromEntries(Object.entries(estados).sort()),
  mudancas,
  ddds: Object.fromEntries(Object.entries(ddds).sort()),
};

// Um município por linha: o diff de uma atualização da Anatel fica legível.
const json = JSON.stringify(saida, null, 2).replace(/\{\n\s+"nome": [^{}]*?"ibge"[^{}]*?\n\s+\}/g, (m) => m.replace(/\n\s+/g, ' '));
const destino = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ddd.json');
fs.writeFileSync(destino, json + '\n', 'utf8');

console.log(`${destino}: ${Object.keys(ddds).length} DDDs, ${vigentes.length} municípios, ${mudancas.length} mudança(s) registrada(s)`);
console.log(`arquivo da Anatel de ${saida.fonte.anatel.dataArquivo}; população: ${ibgeFonte ? `IBGE ${ibgeFonte.ano}` : 'sem (ordem alfabética)'}`);
if (pop) {
  const sem = vigentes.filter((r) => pop.get(r.ibge)?.n == null);
  if (sem.length) console.warn(`AVISO: ${sem.length} município(s) sem população no IBGE: ${sem.map((r) => r.nome).join(', ')}`);
}
if (duplicados.length) console.warn(`AVISO: município em mais de um DDD (relatar): ${duplicados.map(([i, c]) => `${i} → ${c.join(', ')}`).join('; ')}`);
