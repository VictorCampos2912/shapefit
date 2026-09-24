# Data Model: Histórico por Data

**Feature**: `019-historico-por-data` | **Date**: 2026-09-23

Nenhuma entidade persistida nova — tudo é derivado, em tempo de leitura, das
mesmas sessões finalizadas (RF07) e treinos importados (RF01) já usados pelo RF08.

## Tipos novos (apenas para exibição — não persistidos)

### `RegistroExercicioNoDia`

| Campo | Tipo | Descrição |
|-------|------|------------|
| `exercicioNome` | `string` | Nome do exercício, resolvido do treino de origem (mesmo cruzamento já usado pelo RF08) |
| `registros` | `{ serie: number; cargaKg: number; reps: number }[]` | Séries daquele exercício, dentro da mesma sessão — nunca agregadas (mesma regra do RF08, FR-008) |

### `BlocoSessao`

| Campo | Tipo | Descrição |
|-------|------|------------|
| `sessaoId` | `string` | Id da `SessaoTreino` de origem |
| `treinoNome` | `string` | Nome do treino executado nessa sessão |
| `dataReferencia` | `string` (ISO 8601) | `finalizadaEm` da sessão — usado pela UI para formatar a data/hora exibida (nunca a `chaveDia` do dia pai, ver `research.md` Decisão 2) |
| `exercicios` | `RegistroExercicioNoDia[]` | Exercícios executados nessa sessão, com registro de série |

### `DiaHistorico`

| Campo | Tipo | Descrição |
|-------|------|------------|
| `chaveDia` | `string` (`"YYYY-MM-DD"`, local) | Chave de agrupamento/ordenação — nunca usada para formatar exibição diretamente |
| `dataReferencia` | `string` (ISO 8601) | Instante de uma das sessões do dia — usado para formatar o cabeçalho do dia |
| `blocos` | `BlocoSessao[]` | Um por sessão finalizada naquele dia, ordenados do mais recente para o mais antigo (FR-004) |

### `HistoricoPorData`

```ts
type HistoricoPorData =
  | { temSessoesFinalizadas: false }
  | { temSessoesFinalizadas: true; dias: DiaHistorico[] }; // dias ordenados do mais recente
```

Mesmo padrão de união discriminada já usado por `HistoricoPerfil` (RF08).

## Relação com entidades já existentes

- **`SessaoTreino`** (`src/types/execucao-treino.ts`): fonte de `finalizadaEm`
  (→ `dataReferencia`/`chaveDia`), `execucoes` (→ `RegistroExercicioNoDia`) — sem
  nenhuma mudança de schema.
- **`Treino`** (`src/types/treino.ts`): fonte de `nome` (→ `treinoNome`) e dos
  nomes de exercício (→ `exercicioNome`, via `exercicioId`) — sem nenhuma mudança
  de schema.
- **Tipo intermediário `RegistroBruto`** (interno a `historico-evolucao.ts`, não
  exportado — `research.md`, Decisão 1): compartilhado entre `obterHistoricoPorPerfil`
  (RF08, agrupa por exercício) e `obterHistoricoPorData` (esta feature, agrupa por
  dia+sessão) — elimina a duplicação do cruzamento sessão→treino→exercício entre as
  duas visões.
