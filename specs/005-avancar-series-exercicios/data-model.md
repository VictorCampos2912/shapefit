# Data Model: Avançar Entre Séries e Exercícios

## Entidades existentes (reaproveitadas, sem alteração)

### Treino / ExercicioPlanejado
Já definidas em `src/types/treino.ts` (RF01). Consumidas apenas para leitura nesta feature
(mesmo uso já descrito no data-model.md do RF03) — nenhum campo novo é adicionado a elas.

### Perfil
Já definido em `src/types/perfil.ts` (RF10). Consumido apenas via `perfilAtivo.id`
(`usePerfilAtivo()`, sem modificação).

### `SessaoRegistro` (já existente e usado pelo RF10 — **movido**, não modificado em substância)

```ts
// src/types/perfil.ts — movido de dentro de perfil-storage.ts (era um `type` privado, não
// exportado) para o arquivo de tipos de domínio já existente, seguindo o padrão do projeto
// (Constituição, Princípio I: tipos de domínio compartilhados vivem em src/types/).
// perfil-storage.ts (RF10) passa a importar este tipo em vez de declará-lo localmente —
// mudança puramente estrutural, sem alteração de campos, nomes ou comportamento.
export type SessaoRegistro = {
  perfilId: string;
  finalizadaEm: string | null;
};
```

Este tipo já é usado por `existeSessaoEmAndamento(perfilId)` (RF10), que lê
`sessoes:${perfilId}` esperando um array desse formato e verifica
`.some(s => s.finalizadaEm === null)`. Em vez de apenas documentar a compatibilidade
estrutural, `SessaoTreino` (abaixo) **estende `SessaoRegistro` via TypeScript** (`extends`),
garantindo checagem em tempo de compilação: se `SessaoRegistro` ganhar ou renomear um campo
no futuro (por exemplo, ao evoluir o RF10), `SessaoTreino` deixa de compilar até ser
ajustado, em vez de divergir silenciosamente.

## Novas entidades (persistidas em `AsyncStorage`)

### `SessaoTreino` (persistida)

Estrutura gravada em `sessoes:${perfilId}` (um array de `SessaoTreino`, uma entrada por
`treinoId` que já teve pelo menos uma série concluída por aquele perfil).

| Campo | Tipo | Descrição |
|---|---|---|
| `perfilId` | `string` | herdado de `SessaoRegistro` — dono da sessão |
| `finalizadaEm` | `string \| null` | herdado de `SessaoRegistro`; **esta feature MUST sempre gravar `null`** aqui — preenchê-lo é escopo exclusivo do RF07 |
| `treinoId` | `string` | identifica o treino ao qual esta sessão pertence |
| `iniciadaEm` | `string` (ISO 8601) | data/hora em que a sessão foi criada (primeira série concluída do treino) |
| `execucoes` | `ExecucaoExercicio[]` | uma entrada por exercício que já teve ao menos uma série concluída (exercícios nunca iniciados não aparecem aqui) |

```ts
// src/types/execucao-treino.ts
import type { SessaoRegistro } from '@/types/perfil';

export interface SessaoTreino extends SessaoRegistro {
  treinoId: string;
  iniciadaEm: string;
  execucoes: ExecucaoExercicio[];
  // finalizadaEm: string | null — herdado de SessaoRegistro; esta feature sempre grava null
}
```

### `ExecucaoExercicio` (dentro de `SessaoTreino.execucoes`)

| Campo | Tipo | Descrição |
|---|---|---|
| `exercicioId` | `string` | identifica o `ExercicioPlanejado` dentro do treino |
| `seriesRealizadas` | `SerieRealizada[]` | séries já concluídas daquele exercício, na ordem em que foram concluídas |
| `status` | `'em_andamento' \| 'concluido'` | `'concluido'` quando `seriesRealizadas.length === exercicio.series`; caso contrário `'em_andamento'` |

```ts
type ExecucaoExercicio = {
  exercicioId: string;
  seriesRealizadas: SerieRealizada[];
  status: 'em_andamento' | 'concluido';
};
```

### `SerieRealizada`

| Campo | Tipo | Descrição |
|---|---|---|
| `serie` | `number` | número da série (1-indexado) |
| `cargaKg` | `number` | carga registrada, em kg, com casas decimais |
| `reps` | `number` | repetições feitas, inteiro não negativo |

```ts
type SerieRealizada = {
  serie: number;
  cargaKg: number;
  reps: number;
};
```

**Regras de validação** (na conversão do estado de UI para persistência):
- `cargaKg` e `reps` MUST ser convertidos para `number` a partir dos campos de texto
  (`estado.cargaKg`/`estado.repsFeitas`, já validados como numéricos pelo RF03) apenas no
  momento de "Concluir série" — nunca persistidos como string.
- `serie` MUST corresponder exatamente ao `serieAtual` do estado de UI no momento da
  conclusão.

## Estado de UI (em memória, estendendo o já existente do RF03)

### `EstadoExecucaoExercicio` (estendido)

O tipo já existente em `src/types/execucao-treino.ts` (RF03) ganha dois novos campos:

| Campo | Tipo | Novo/existente | Descrição |
|---|---|---|---|
| `exercicioId` | `string` | existente | sem mudança |
| `iniciado` | `boolean` | existente | sem mudança |
| `serieAtual` | `number` | existente | ao concluir uma série que não é a última, incrementa em 1 |
| `cargaKg` | `string` | existente | ao avançar de série, passa a ser pré-preenchido com a carga da série recém-concluída (research.md, Decisão 4), não mais `cargaSugeridaKg` |
| `repsFeitas` | `string` | existente | limpo (`''`) a cada nova série |
| `seriesConcluidas` | `SerieRealizada[]` | **novo** | espelha, em memória, o que já foi persistido em `ExecucaoExercicio.seriesRealizadas` para este exercício nesta sessão — permite renderizar corretamente ao retomar um exercício pausado (ex.: saber que a série 1 já foi concluída e a atual é a 2) |
| `concluido` | `boolean` | **novo** | `true` quando `seriesConcluidas.length === exercicio.series`; controla a exibição do botão "Concluir exercício" e, após tocado, o retorno à lista |

**Transições de estado** (novas, em adição às já descritas no RF03):
1. Usuário toca em "Concluir série" com `cargaKg`/`repsFeitas` preenchidos → o sistema
   grava uma nova `SerieRealizada` em `seriesConcluidas` (em memória) e em
   `ExecucaoExercicio.seriesRealizadas` (persistido); se `seriesConcluidas.length` ainda for
   menor que `exercicio.series`, incrementa `serieAtual`, copia o `cargaKg` atual para o
   próximo (não reseta), e limpa `repsFeitas`; se atingir `exercicio.series`, marca
   `concluido: true` (o botão "Concluir exercício" passa a ficar habilitado, mas o
   exercício em si só é considerado concluído na sessão — `status: 'concluido'` — quando o
   usuário efetivamente tocar em "Concluir exercício").
2. Usuário toca em "Concluir exercício" (só possível quando `concluido === true`) → o
   sistema atualiza `ExecucaoExercicio.status` para `'concluido'` na sessão persistida, e a
   rota volta para a lista de exercícios, exibindo esse item com o estado visual
   `'concluido'` (reintroduzido em `ExercicioListItem`, ver Contract).

### `EstadoTelaExecucao` (sem mudança estrutural)

Continua com `treino`, `exercicioSelecionadoId`, `estadosPorExercicio` — nenhum campo novo
neste nível; a novidade fica inteiramente dentro de `EstadoExecucaoExercicio` (por
exercício) e na leitura/escrita da sessão persistida ao montar a rota e a cada conclusão.

## Fluxo de carregamento (ao montar `[treinoId].tsx`)

1. Ler `perfilAtivo.id` (já disponível) e `treino.id` (já carregado via `listarTreinos`).
2. Buscar, via `sessao-treino-storage.ts`, a `SessaoTreino` existente para esse
   `perfilId` + `treinoId` (se houver).
3. Para cada `ExecucaoExercicio` encontrado, inicializar o `EstadoExecucaoExercicio`
   correspondente com `iniciado: true`, `seriesConcluidas` copiado de `seriesRealizadas`,
   `serieAtual` = `seriesRealizadas.length + 1` (ou igual a `exercicio.series` se já
   `concluido`), `concluido` = `status === 'concluido'`, e `cargaKg` pré-preenchido com a
   carga da última série concluída (ou `cargaSugeridaKg` se nenhuma série foi concluída
   ainda, mas o exercício foi iniciado sem persistência — caso limite não coberto por esta
   feature, ver Assumption da spec sobre séries não concluídas não sobreviverem ao
   fechamento do app).
4. Exercícios sem entrada em `execucoes` permanecem como estavam no RF03 (estado implícito
   "não iniciado", criado ao serem tocados pela primeira vez).
