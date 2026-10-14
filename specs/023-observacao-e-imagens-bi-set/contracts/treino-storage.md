# Contract: `src/services/treino-storage.ts` (alterado)

**Feature**: `023-observacao-e-imagens-bi-set`

Contrato interno (serviço de importação/persistência — não há API HTTP nesta
feature). Altera `validarExercicio` e a montagem do objeto em
`montarTreinoValido`, já existentes (RF01/RF11/RF17); **não** altera
`validarEstruturaTreino`, `processarConteudoArray`, `setDocTreino` nem
`listarTreinos` além do necessário para ler/escrever o campo novo.

## `validarExercicio` (alterado) — FR-001/FR-002/FR-003

Novo passo de validação, inserido junto aos campos já checados (depois do
bloco de `categoria`, linha ~95 de `treino-storage.ts`):

```ts
let observacao: string | undefined;
if (item.observacao !== undefined && item.observacao !== null) {
  if (typeof item.observacao !== 'string') {
    return { ok: false, motivo: `Exercício ${indice}: campo "observacao" inválido` };
  }
  const observacaoTrimada = item.observacao.trim();
  if (observacaoTrimada.length > 0) {
    observacao = observacaoTrimada;
  }
}
```

- **Pré-condição**: nenhuma — `observacao` é opcional, assim como `categoria`.
- **Pós-condição**: `observacao` (variável local) só recebe um valor quando o
  campo está presente, não é `null`, é uma `string`, e não é vazia/só espaços
  após `trim()`. Em qualquer outro caso de ausência/`null`/vazio, permanece
  `undefined` — **sem** retornar erro (FR-002, não é o mesmo caminho do
  `typeof !== 'string'`).
- **`null` (FR-002)**: a guarda `item.observacao !== undefined && item.observacao
  !== null` é o que garante que `null` nunca entra no `typeof !== 'string'` —
  sem essa guarda explícita, `null` cairia no mesmo caminho de erro do FR-003
  por engano (`typeof null === 'object'`), o que a spec proíbe
  explicitamente.
- **Erro (FR-003)**: presente, não-`string` e não-`null` (número, booleano,
  array, objeto) → `{ ok: false, motivo: 'Exercício {indice}: campo
  "observacao" inválido' }`, mesmo formato já usado para `categoria` (linha
  ~93) — o exercício é descartado individualmente (via
  `exerciciosIgnorados`), sem afetar os demais nem o treino como um todo
  (comportamento já garantido por `montarTreinoValido`, inalterado).

## Montagem do `ExercicioPlanejado` (alterada) — FR-001/FR-008

Dentro do `return { ok: true, exercicio: {...} }` de `validarExercicio` (ou
equivalente, se a validação de `observacao` for inlined ali):

```ts
return {
  ok: true,
  exercicio: {
    id: item.id,
    nome: item.nome,
    series: item.series,
    repsAlvo: item.reps_alvo,
    cargaSugeridaKg: item.carga_sugerida_kg,
    descansoSeg: item.descanso_seg,
    categoria: (item.categoria as CategoriaExercicio | undefined) ?? 'peso',
    ...(observacao !== undefined ? { observacao } : {}),
  },
};
```

- **Importante (research.md, Decisão 4)**: a chave `observacao` DEVE ser
  adicionada via espalhamento condicional (`...(observacao !== undefined ? {
  observacao } : {})`), nunca como `observacao: observacao` direto (isso
  deixaria a chave presente com valor `undefined` quando não há observação,
  violando FR-008 mais adiante, em `setDocTreino`/`writeBatch(...).set(...)`).
- **Efeito em cascata**: como `montarTreinoValido` apenas empilha o resultado
  de `validarExercicio` no array `exercicios` do `Treino` (sem recriar o
  objeto), a propriedade de omissão da chave se propaga automaticamente até o
  documento persistido — nenhuma mudança adicional é necessária em
  `processarConteudoObjeto`/`processarConteudoArray`/`setDocTreino` (FR-008).

## `listarTreinos` (sem alteração necessária, nota de compatibilidade)

Diferente de `categoria` (que tem um default aplicado na leitura, linha
44-47: `categoria: exercicio.categoria ?? 'peso'`), `observacao` **não** precisa
de nenhum tratamento equivalente na leitura — um `ExercicioPlanejado` sem a
chave `observacao` (documento antigo, ou exercício sem observação) já é um
valor válido do tipo `observacao?: string`; não há "default" a aplicar (o
default implícito de um campo opcional ausente já é "ausente"). Nenhuma
alteração em `listarTreinos` é necessária para esta feature.

## Mensagens de erro ao usuário (`src/app/acoes.tsx`, sem alteração de código)

`exibirResultadoImportacao`/`exibirResultadoImportacaoMultipla` já iteram
`exerciciosIgnorados`/`item.motivo` genericamente (bullet `•` + `motivo`) — a
nova mensagem `Exercício {indice}: campo "observacao" inválido` aparece
automaticamente no mesmo `Alert.alert`, sem nenhuma mudança nesses dois
arquivos.
