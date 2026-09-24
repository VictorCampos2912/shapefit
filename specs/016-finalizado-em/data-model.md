# Data Model: "Finalizado em" na Lista de Treinos

**Feature**: `016-finalizado-em` | **Date**: 2026-09-23

Nenhuma entidade nova nem campo novo persistido — a spec já define isso em Key
Entities. Esta feature apenas lê dados já existentes de formas novas.

## Dados já existentes, reutilizados

### `Treino` (`src/types/treino.ts`, sem mudança)

| Campo | Uso nesta feature |
|-------|--------------------|
| `importadoEm` | Deixa de ser exibido na lista "Meus Treinos" (FR-003); passa a ser exibido na tela do treino específico (FR-004); usado como critério de desempate de homônimos quando necessário (FR-005). |
| `nome` | Usado para detectar treinos homônimos (já existente, `calcularNomesDuplicados`). |

### `SessaoTreino` (`src/types/execucao-treino.ts`, sem mudança)

| Campo | Uso nesta feature |
|-------|--------------------|
| `finalizadaEm` | Fonte da nova data "Finalizado em" — a sessão com `finalizadaEm` mais recente, por `treinoId`, dentre as sessões com `finalizadaEm !== null`. |
| `treinoId` | Usado para filtrar as sessões de um treino específico. |

## Dado derivado, calculado em tempo de exibição (não persistido)

### Data de finalização mais recente por treino

Para um `treinoId` e `perfilId` dados: a maior `finalizadaEm` (ordenação lexicográfica
de string ISO 8601, equivalente à ordenação cronológica) entre as sessões desse
treino com `finalizadaEm !== null`; `null` se não houver nenhuma (exibido como "Nunca
treinado", FR-002). Calculado por `obterDataUltimaSessaoFinalizada` (ver
`research.md`, Decisão 1) — mesmo padrão de derivação já usado por
`obterUltimaSessaoConcluidaNaoRevisada` (spec 013) e `contarSessoesFinalizadas` (RF11).

### Conjunto de treinos em colisão de exibição (FR-005)

Para a lista de treinos de um perfil: o subconjunto de `treino.id` que (a) têm nome
duplicado com pelo menos outro treino da lista **e** (b) o texto "Finalizado em
`<data>`"/"Nunca treinado" desse treino é idêntico ao de pelo menos outro treino do
mesmo grupo de nome duplicado. Calculado por `calcularChavesColidindo` (ver
`research.md`, Decisão 2), a partir do já existente `calcularNomesDuplicados` mais o
dado derivado acima.
