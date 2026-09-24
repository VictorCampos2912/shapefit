# Data Model: Progresso do Ciclo de Treinos (Múltiplos Treinos)

**Feature**: `018-progresso-ciclo` | **Date**: 2026-09-23

## Entidade nova: `CicloTreino` (persistida)

| Campo | Tipo | Obrigatório | Regras |
|-------|------|-------------|--------|
| `id` | `string` | sim (gerado pelo sistema) | Único; gerado na criação do ciclo (mesmo padrão `Crypto.randomUUID()` já usado por `Treino`/`SessaoTreino`) |
| `perfilId` | `string` | sim | Igual ao perfil ativo no momento da importação que criou o ciclo; nunca editável (Princípio V) |
| `treinoIds` | `string[]` | sim | Ids dos treinos do lote, na ordem em que apareceram no arquivo importado (RF11); mínimo 2 itens (Decisão 5 do `research.md`) |
| `cotaPorTreinoId` | `Record<string, number>` | sim | Uma entrada por item de `treinoIds`; soma de todos os valores é sempre 40 (FR-002/FR-003); calculado uma vez, na criação do ciclo — nunca recalculado depois |
| `criadoEm` | `string` (ISO 8601) | sim (gerado pelo sistema) | Timestamp da importação que criou o ciclo |

**Invariantes**:
- `treinoIds.length >= 2` sempre (Decisão 5) — nunca existe um `CicloTreino` para um
  único treino.
- `Object.keys(cotaPorTreinoId)` é sempre exatamente igual a `treinoIds` (mesmo
  conjunto, sem entradas extras ou faltantes).
- `Object.values(cotaPorTreinoId).reduce((a, b) => a + b, 0) === 40` sempre.
- Imutável após criado: nenhuma operação desta feature edita um `CicloTreino` já
  existente — um novo ciclo é sempre um novo registro (FR-009), nunca uma edição do
  anterior.

## Convenção de chave AsyncStorage (nova)

| Chave | Escopo | Conteúdo |
|-------|--------|----------|
| `ciclos:<perfilId>` | Por perfil | `CicloTreino[]` serializado em JSON — array append-only (`research.md`, Decisão 2); `[]` se o perfil nunca importou um lote de múltiplos treinos |

## Dado derivado, calculado em tempo de leitura (não persistido)

### Ciclo atual de um perfil

O último elemento de `ciclos:<perfilId>` (o mais recentemente criado), ou nenhum se o
array estiver vazio. Nunca há mais de um "ciclo atual" — os demais elementos do array
são apenas histórico preservado (não consultado por nenhum requisito desta feature).

### Progresso do ciclo atual

Para o ciclo atual: `totalFinalizado` = soma de `contarSessoesFinalizadas(perfilId,
treinoId)` (já existente, RF11) para cada `treinoId` em `treinoIds`; `porTreino` = o
mesmo valor individual por `treinoId`, sem dividir por `cotaPorTreinoId` (a divisão
para obter uma fração 0-1, usada pelo `ProgressRing`, acontece no componente de UI,
não neste cálculo).

### Estado do ciclo ("em andamento" / "concluído")

`totalFinalizado < 40` → "em andamento" (bloqueia novas importações de múltiplos
treinos, FR-007); `totalFinalizado >= 40` → "concluído" (não bloqueia mais, FR-009;
passa a exibir o aviso de FR-008). Nunca persistido — recalculado a cada leitura a
partir de `totalFinalizado`.

## Relação com entidades já existentes

- **`Treino`** (`src/types/treino.ts`): sem nenhuma mudança de schema; `CicloTreino`
  referencia treinos existentes só por `id` (`treinoIds`), sem relação bidirecional —
  um `Treino` não sabe a qual ciclo pertence; a busca é sempre "dado um ciclo, quais
  são seus treinos", nunca o inverso.
- **`SessaoTreino`** (`src/types/execucao-treino.ts`): sem nenhuma mudança de schema;
  consumida apenas indiretamente, via `contarSessoesFinalizadas` já existente.
