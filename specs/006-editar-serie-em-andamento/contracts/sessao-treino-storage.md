# Contract: `sessao-treino-storage.ts` (extensão aditiva)

**Feature**: 006-editar-serie-em-andamento | **Date**: 2026-09-17

Este app não expõe API externa; o "contrato" relevante é a nova função adicionada ao
serviço já existente `src/services/sessao-treino-storage.ts` (RF04) e sua compatibilidade
obrigatória com as funções já existentes no mesmo arquivo. Ver
[data-model.md](../data-model.md) para os tipos referenciados.

## Nova interface do serviço

```ts
export async function atualizarSerieRealizada(params: {
  perfilId: string;
  treinoId: string;
  exercicioId: string;
  serie: number;
  novaCargaKg: number;
  novosReps: number;
}): Promise<SessaoTreino>
// Localiza a SessaoTreino (por treinoId), a ExecucaoExercicio (por exercicioId) e a
// SerieRealizada (por número `serie`) dentro de sessoes:${perfilId}. Substitui apenas
// cargaKg e reps do objeto encontrado pelos novos valores. MUST NOT alterar `serie`,
// `status` da execução, `finalizadaEm`/`iniciadaEm`/`treinoId` da sessão, nem a ordem ou
// quantidade de itens em `seriesRealizadas`/`execucoes`. Lança erro se a sessão, a
// execução ou a série não forem encontradas (mesma convenção de `marcarExercicioConcluido`
// — condição não esperada em uso normal, fora de escopo tratar como fluxo alternativo).
// Persiste o array inteiro de sessões do perfil de volta em sessoes:${perfilId}, via
// `setSessoes` já existente. Retorna a SessaoTreino atualizada.
```

## Compatibilidade com as funções já existentes (RF04)

`atualizarSerieRealizada` reaproveita as mesmas funções privadas do módulo
(`getSessoes`/`setSessoes`) já usadas por `obterSessao`, `registrarSerieConcluida` e
`marcarExercicioConcluido` — mesma chave (`sessoes:${perfilId}`), mesmo formato de array.
Nenhuma dessas funções existentes é modificada; a nova função é puramente aditiva ao
arquivo.

Diferente de `registrarSerieConcluida` (que sempre `push`a uma nova série e recalcula
`status`), `atualizarSerieRealizada`:
- **MUST NOT** inserir uma nova entrada em `seriesRealizadas` — apenas substitui uma já
  existente, localizada por `serie`.
- **MUST NOT** recalcular ou tocar em `status` da `ExecucaoExercicio`.
- **MUST NOT** alterar `finalizadaEm` da sessão — permanece exatamente como estava (sempre
  `null`, dado que RF07 ainda não existe).

## Comportamento observável

| Entrada | Resultado | FR relacionado |
|---------|-----------|-----------------|
| Editar `cargaKg` de uma série concluída do exercício em foco, com `reps` inalterado | `SerieRealizada.cargaKg` é substituído pelo novo valor; `reps` permanece o mesmo; `status` da execução inalterado | FR-003, FR-006, FR-008 |
| Editar `reps` de uma série concluída, com `cargaKg` inalterado | `SerieRealizada.reps` é substituído; `cargaKg` permanece o mesmo; `status` inalterado | FR-003, FR-006, FR-008 |
| Editar carga e reps simultaneamente | Ambos os campos são substituídos numa única chamada; `status` inalterado | FR-003, FR-006 |
| Editar uma série de um exercício com `status: 'concluido'` | `status` permanece `'concluido'` após a chamada — a função nunca lê nem escreve esse campo | FR-008, FR-009 |
| Editar uma série (qualquer exercício/status) | `finalizadaEm` da sessão permanece `null` — a função nunca lê nem escreve esse campo | FR-008 |
| Chamar com `treinoId`, `exercicioId` ou `serie` inexistentes | Lança erro (`Error`), sem persistir nada | Fora de escopo (ver spec.md, Edge Cases) |
| Após a edição, `obterSessao` é chamado novamente (ex.: ao reabrir o app) | Retorna a `SerieRealizada` já com o valor editado — mesma leitura já usada pelo RF04 para reconstruir `estadosPorExercicio` | FR-006, SC-004 |
| `existeSessaoEmAndamento` (RF10) é chamada após uma edição | Continua retornando o mesmo resultado de antes da edição — `finalizadaEm` não é tocado | Compatibilidade com o RF10 (herdada do RF04) |
