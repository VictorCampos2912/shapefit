#!/usr/bin/env node

/**
 * Verifica as invariantes de assets/catalogo/exercicios.json (data-model.md,
 * spec 020): id único, fonteAtribuicao não vazio, midia.arquivo apontando para um
 * arquivo real em assets/catalogo/imagens/. Roda em dev-time, não em runtime.
 */

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const catalogoPath = path.join(root, "assets/catalogo/exercicios.json");
const imagensDir = path.join(root, "assets/catalogo/imagens");

const GRUPOS_VALIDOS = ["peito", "costas", "pernas", "ombros", "braços", "core"];

const catalogo = JSON.parse(fs.readFileSync(catalogoPath, "utf8"));

const erros = [];
const idsVistos = new Set();

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
  }

  if (!GRUPOS_VALIDOS.includes(item.grupoMuscular)) {
    erros.push(`${rotulo}: grupoMuscular inválido ("${item.grupoMuscular}")`);
  }

  if (!item.midia || !item.midia.arquivo) {
    erros.push(`${rotulo}: midia.arquivo ausente`);
  } else if (!fs.existsSync(path.join(imagensDir, item.midia.arquivo))) {
    erros.push(`${rotulo}: midia.arquivo "${item.midia.arquivo}" não existe em assets/catalogo/imagens/`);
  }

  if (!item.fonteAtribuicao || !item.fonteAtribuicao.trim()) {
    erros.push(`${rotulo}: fonteAtribuicao vazio`);
  }
}

if (erros.length > 0) {
  console.error(`Verificação do catálogo falhou (${erros.length} problema(s)):`);
  for (const erro of erros) {
    console.error(`  - ${erro}`);
  }
  process.exit(1);
}

console.log(`Catálogo OK: ${catalogo.length} exercícios, todas as invariantes satisfeitas.`);
