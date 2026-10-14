#!/usr/bin/env node

/**
 * Verifica as invariantes de assets/catalogo/exercicios.json (data-model.md,
 * spec 020): id único, fonteAtribuicao não vazio, midia.arquivo apontando para um
 * arquivo real em assets/catalogo/imagens/, nome normalizado único, e
 * consistência com imagens-index.ts (ampliação de 2026-10-14). Roda em
 * dev-time, não em runtime.
 */

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const catalogoPath = path.join(root, "assets/catalogo/exercicios.json");
const imagensDir = path.join(root, "assets/catalogo/imagens");
const indexPath = path.join(root, "assets/catalogo/imagens-index.ts");

const GRUPOS_VALIDOS = ["peito", "costas", "pernas", "ombros", "braços", "core", "cardio"];

function normalizar(nome) {
  return nome.trim().replace(/\s+/g, " ").toLowerCase();
}

const catalogo = JSON.parse(fs.readFileSync(catalogoPath, "utf8"));

const erros = [];
const idsVistos = new Set();
const nomesNormalizadosVistos = new Map();
const arquivosDoCatalogo = new Set();

for (const [indice, item] of catalogo.entries()) {
  const rotulo = `item ${indice} (id=${item.id ?? "?"})`;

  if (!item.id || typeof item.id !== "string") {
    erros.push(`${rotulo}: id ausente ou inválido`);
  } else if (idsVistos.has(item.id)) {
    erros.push(`${rotulo}: id duplicado`);
  } else {
    idsVistos.add(item.id);
  }

  if (!item.nome || typeof item.nome !== "string") {
    erros.push(`${rotulo}: nome ausente ou inválido`);
  } else {
    const nomeNormalizado = normalizar(item.nome);
    if (nomesNormalizadosVistos.has(nomeNormalizado)) {
      erros.push(
        `${rotulo}: nome normalizado duplicado ("${item.nome}" == "${nomesNormalizadosVistos.get(nomeNormalizado)}")`,
      );
    } else {
      nomesNormalizadosVistos.set(nomeNormalizado, item.nome);
    }
  }

  if (!GRUPOS_VALIDOS.includes(item.grupoMuscular)) {
    erros.push(`${rotulo}: grupoMuscular inválido ("${item.grupoMuscular}")`);
  }

  if (!item.midia || !item.midia.arquivo) {
    erros.push(`${rotulo}: midia.arquivo ausente`);
  } else {
    arquivosDoCatalogo.add(item.midia.arquivo);
    if (!fs.existsSync(path.join(imagensDir, item.midia.arquivo))) {
      erros.push(`${rotulo}: midia.arquivo "${item.midia.arquivo}" não existe em assets/catalogo/imagens/`);
    }
  }

  if (!item.fonteAtribuicao || !item.fonteAtribuicao.trim()) {
    erros.push(`${rotulo}: fonteAtribuicao vazio`);
  }
}

// Consistência com imagens-index.ts (spec 023, ampliação de 2026-10-14): toda
// midia.arquivo do catálogo precisa ter uma chave em IMAGENS_CATALOGO, e
// vice-versa — nenhuma chave órfã (arquivo listado no índice mas não usado
// por nenhum item do catálogo).
const indexSource = fs.readFileSync(indexPath, "utf8");
const chavesDoIndex = new Set();
for (const match of indexSource.matchAll(/^\s*'([^']+)':\s*require\(/gm)) {
  chavesDoIndex.add(match[1]);
}

for (const arquivo of arquivosDoCatalogo) {
  if (!chavesDoIndex.has(arquivo)) {
    erros.push(`imagens-index.ts: falta a chave "${arquivo}" (usada em exercicios.json, sem require() correspondente)`);
  }
}
for (const chave of chavesDoIndex) {
  if (!arquivosDoCatalogo.has(chave)) {
    erros.push(`imagens-index.ts: chave órfã "${chave}" (sem nenhum item de exercicios.json usando esse arquivo)`);
  }
}

if (erros.length > 0) {
  console.error(`Verificação do catálogo falhou (${erros.length} problema(s)):`);
  for (const erro of erros) {
    console.error(`  - ${erro}`);
  }
  process.exit(1);
}

console.log(
  `Catálogo OK: ${catalogo.length} exercícios, ${chavesDoIndex.size} imagens indexadas, todas as invariantes satisfeitas.`,
);
