# Data Model: Imagem/GIF do Exercício na Execução

**Feature**: `021-imagens-exercicios` | **Date**: 2026-09-23

Nenhuma entidade nova, nenhum campo novo, nenhuma persistência nova. Esta feature
consome integralmente `ExercicioCatalogo` já definida pela spec 020 (não repetida
aqui — ver `specs/020-catalogo-exercicios/data-model.md`, fonte única de verdade
para o schema do catálogo).

## Dado derivado, calculado em tempo de exibição (não persistido)

### Correspondência exercício-treino ↔ exercício-catálogo

Para um `ExercicioPlanejado` (treino importado, RF01) sendo exibido na execução:
`buscarNoCatalogo(exercicio.nome)` (spec 021, `research.md` Decisão 1) retorna o
`ExercicioCatalogo` (spec 020) cujo nome, após `normalizarNomeExercicio` (RF08),
seja idêntico — ou `null`. Nunca persistido; recalculado a cada exibição do
exercício (mesma decisão já tomada pela spec, Assumptions: "sem cache/persistência
do resultado da correspondência").

### Imagem resolvida

Dado um `ExercicioCatalogo` encontrado: `IMAGENS_CATALOGO[correspondencia.midia.arquivo]`
(`research.md`, Decisão 2) — o `ImageSourcePropType` já resolvido em build-time
pelo Metro, pronto para ser passado a `<Image source={...} />`. Também derivado,
nunca persistido.

## Relação com entidades já existentes

- **`ExercicioCatalogo`/`GrupoMuscular`** (spec 020, `src/types/catalogo-exercicios.ts`):
  consumidas exatamente como definidas — nenhum campo novo, nenhuma reinterpretação.
- **`ExercicioPlanejado`** (RF01, `src/types/treino.ts`): fonte do `nome` usado
  como entrada de `buscarNoCatalogo` — sem nenhuma mudança de schema.
