# Contract: `src/services/treino-storage.ts` (`validarExercicio` alterado)

**Feature**: `017-categorias-exercicio`

Contrato interno (validação de importação — não há API HTTP nesta feature).

## `validarExercicio` — validação nova (campo opcional)

```ts
const CATEGORIAS_VALIDAS: CategoriaExercicio[] = ['peso', 'tempo', 'distancia', 'repeticoes'];

// Depois de todas as validações já existentes (id, nome, series, reps_alvo,
// carga_sugerida_kg, descanso_seg) — a única DIFERENÇA é que este campo é opcional:
if (item.categoria !== undefined) {
  if (typeof item.categoria !== 'string' || !CATEGORIAS_VALIDAS.includes(item.categoria as CategoriaExercicio)) {
    return { ok: false, motivo: `Exercício ${indice}: campo "categoria" inválido` };
  }
}

return {
  ok: true,
  exercicio: {
    id: item.id,
    nome: item.nome,
    series: item.series,
    repsAlvo: item.reps_alvo,
    cargaSugeridaKg: item.carga_sugerida_kg,
    descansoSeg: item.descanso_seg,
    categoria: (item.categoria as CategoriaExercicio | undefined) ?? 'peso', // NOVO
  },
};
```

- **Campo JSON de entrada**: `categoria` (mesmo nome, sem conversão de
  snake_case→camelCase — já é uma palavra só, mesmo padrão de `nome`).
- **Pós-condição (presente e válido)**: `exercicio.categoria` é o valor informado.
- **Pós-condição (ausente)**: `exercicio.categoria` é `'peso'` (FR-002) — nunca
  `undefined` no objeto `ExercicioPlanejado` resultante.
- **Pós-condição (presente e inválido)**: função retorna `{ ok: false, motivo }`,
  mesmo padrão de erro já usado pelos outros campos — o exercício inteiro é
  descartado pelo chamador (`montarTreinoValido`), sem afetar os demais exercícios
  do mesmo treino (FR-003, já garantido pelo laço `forEach` existente em
  `montarTreinoValido`, sem mudança necessária ali).
- **`validarEstruturaTreino`, `montarTreinoValido`, `processarConteudoObjeto`,
  `processarConteudoArray`, `processarConteudo`, `importarTreino`,
  `importarTreinoExemplo`**: nenhuma mudança — a alteração fica inteiramente dentro
  de `validarExercicio`.
- **Compatibilidade** (FR-002/SC-003): qualquer arquivo JSON existente antes desta
  feature (sem `categoria` em nenhum exercício) continua validando exatamente como
  antes, com todo exercício resultando em `categoria: 'peso'`.
