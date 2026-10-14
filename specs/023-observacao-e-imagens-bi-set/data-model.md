# Data Model: Observação por Exercício e Imagem para Exercício Composto (Bi-set)

**Feature**: `023-observacao-e-imagens-bi-set` | **Date**: 2026-10-08

## Campo novo em entidade já existente

### `ExercicioPlanejado.observacao` (novo, opcional)

`src/types/treino.ts` — `ExercicioPlanejado` ganha um atributo:

```ts
export type ExercicioPlanejado = {
  id: string;
  nome: string;
  series: number;
  repsAlvo: string;
  cargaSugeridaKg: number;
  descansoSeg: number;
  categoria: CategoriaExercicio;
  observacao?: string; // NOVO — presente só quando há uma observação válida
};
```

- **Presença**: a chave `observacao` só existe no objeto quando o exercício
  importado tinha um valor `string` não vazio (após `trim()`) nesse campo
  (FR-001/FR-002). Em todo outro caso (ausente no JSON, `null`, vazio, só
  espaços), a chave é estruturalmente omitida — nunca `observacao: undefined`.
- **Validação**: presente, não-`string` e não-`null` (número, booleano, lista,
  objeto) → exercício descartado na importação (FR-003), mesmo mecanismo de
  `ExercicioIgnorado` já usado para `categoria` inválida (RF17). `null` é
  tratado como ausente, nunca como erro de tipo (FR-002).
- **Compatibilidade**: todo `ExercicioPlanejado` já existente (importado antes
  desta feature, no Firestore sem a chave `observacao`) continua válido — o
  tipo opcional (`?:`) não exige migração nem leitura defensiva adicional além
  do que o próprio TypeScript já garante para campos opcionais.

### `Treino` persistido (Firestore, `users/{uid}/treinos`)

Sem mudança de schema na raiz — `Treino.exercicios` já é `ExercicioPlanejado[]`,
então o campo novo se propaga automaticamente para o documento persistido
(spec 022). Cada item de `exercicios` segue a mesma regra de presença descrita
acima: a chave `observacao` só existe no documento Firestore quando o
exercício tem uma observação válida (FR-008, `contracts/treino-storage.md`).

## Dado derivado, calculado em tempo de exibição (não persistido)

### Partes de um nome de exercício composto (bi-set)

Para um `ExercicioPlanejado` sendo exibido na execução, quando
`buscarNoCatalogo(exercicio.nome)` (spec 021) retorna `null` **e**
`exercicio.nome` contém o separador `" + "`:
`buscarPartesCompostoNoCatalogo(exercicio.nome)` (esta spec,
`contracts/catalogo-exercicios.md`) retorna uma lista de 0 a 2
`ExercicioCatalogo` (spec 020) — uma entrada por parte do nome que encontrou
correspondência exata, na ordem em que as partes aparecem no nome, limitada a 2
mesmo que o nome tenha mais de duas partes (FR-011). Nunca persistido;
recalculado a cada exibição do exercício, mesmo princípio já adotado pela
correspondência de nome inteiro (spec 021, Key Entities) e reafirmado pelas Key
Entities desta spec.

## Relação com entidades já existentes

- **`ExercicioCatalogo`/`GrupoMuscular`** (spec 020,
  `src/types/catalogo-exercicios.ts`): consumidas exatamente como definidas —
  nenhum campo novo, nenhuma reinterpretação. A legenda de cada parte usa
  `item.nome` deste tipo (`research.md`, Decisão 6).
- **`ExercicioIgnorado`** (RF01, `src/types/treino.ts`): reaproveitado sem
  mudança de schema — só um novo `motivo` possível (`campo "observacao"
  inválido"`), mesmo formato já usado para `categoria`.
