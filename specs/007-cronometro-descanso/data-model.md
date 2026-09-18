# Data Model: Cronômetro de Descanso

## Entidades existentes (reaproveitadas, sem alteração)

### `ExercicioPlanejado`
Já definido em `src/types/treino.ts` (RF01). O campo `descansoSeg: number` já
existe e passa a ser efetivamente consumido por esta feature como duração inicial
do cronômetro (hoje só é exibido como texto "Xs descanso").

### `EstadoExecucaoExercicio`
Já definido em `src/types/execucao-treino.ts` (RF04). Não é modificado por esta
feature — o estado do cronômetro é independente do estado de execução por
exercício (ver `DescansoAtivo` abaixo).

## Novas entidades (em memória, transitórias — não persistidas)

### `DescansoAtivo`

Representa o cronômetro de descanso em andamento (ou `null` quando nenhum
descanso está ativo). Vive como estado da rota `src/app/treino/[treinoId].tsx`
(ver research.md, Decisão 2) — nunca gravado em `AsyncStorage`.

| Campo | Tipo | Descrição |
|---|---|---|
| `exercicioId` | `string` | identifica de qual exercício este descanso se originou (a série concluída que disparou `onIniciarDescanso`) |
| `fimEm` | `number` | timestamp absoluto (epoch ms, `Date.now()`-compatível) em que o descanso termina; recalculado a cada ajuste de +/-15s (research.md, Decisão 1) |

```ts
// src/types/execucao-treino.ts
export type DescansoAtivo = {
  exercicioId: string;
  fimEm: number;
} | null;
```

**Regras de transição**:
1. `onIniciarDescanso({ exercicioId, descansoSeg })` chamado (RF04, ponto de
   extensão) apenas quando a série concluída **não** é a última planejada do
   exercício (FR-012 — se for a última, `ExercicioExecucao` não chama
   `onIniciarDescanso`, e nenhuma das transições abaixo se aplica). Quando
   chamado: se `descansoSeg` for ausente, `0` ou não numérico (FR-010), nenhum
   `DescansoAtivo` é criado e `onDescansoConcluido` é chamado imediatamente; caso
   contrário, `DescansoAtivo = { exercicioId, fimEm: Date.now() + descansoSeg * 1000 }`.
2. Se já existir um `DescansoAtivo` quando um novo `onIniciarDescanso` é
   recebido (nova série concluída antes do descanso anterior zerar) → o anterior é
   substituído integralmente pelo novo (FR-011), sem acumular ou mesclar tempos.
3. Ajuste "+15s" → `fimEm = fimEm + 15_000` (sem limite superior, FR-004).
4. Ajuste "-15s" → `fimEm = fimEm - 15_000`; se o tempo restante resultante
   (`fimEm - Date.now()`) for `<= 0`, o descanso é imediatamente tratado como
   concluído (transição 5), não fica com `fimEm` no passado indefinidamente
   (FR-005).
5. Tempo restante calculado como `<= 0` (detectado em um tick ou no recálculo ao
   voltar de background) → `DescansoAtivo` volta a `null`; `onDescansoConcluido`
   é chamado exatamente uma vez para esta transição (FR-009, SC-004).

### Função pura de cálculo (`src/utils/cronometro-descanso.ts`)

Não é uma entidade de dados, mas define o contrato de cálculo usado tanto pelo
tick quanto pelo recálculo de `AppState`:

```ts
export function calcularSegundosRestantes(fimEm: number, agora: number = Date.now()): number {
  return Math.max(0, Math.ceil((fimEm - agora) / 1000));
}

export function ajustarFimEm(fimEm: number, deltaSegundos: number): number {
  return fimEm + deltaSegundos * 1000;
}

export function formatarTempo(segundos: number): string {
  // mm:ss, ex.: 90 -> "01:30"
}
```

`agora` como parâmetro (em vez de sempre `Date.now()` interno) existe para tornar
a função testável de forma determinística, sem mocks de tempo global.

## Novo ponto de extensão (prop, não entidade de dados)

`ExercicioExecucao` (RF04) passa a chamar `onIniciarDescanso` com argumento (antes
era `() => void` sem parâmetros):

```ts
// src/components/treino/exercicio-execucao.tsx
onIniciarDescanso?: (info: { exercicioId: string; descansoSeg: number }) => void;
```

`ExercicioExecucao` também recebe uma nova prop `emDescanso?: boolean` (calculada
pela rota como `descansoAtivo?.exercicioId === exercicioSelecionado.id`, FR-014,
ajuste pós-validação manual): enquanto `true`, a área de carga/repetições da
próxima série e o botão "Concluir série" ficam ocultos (substituídos por um
indicativo textual de qual será a próxima série), evitando que o usuário
preencha e conclua a próxima série antes do fim do descanso.

```ts
// src/components/treino/exercicio-execucao.tsx
emDescanso?: boolean; // default false
```

A rota expõe, para consumo futuro do RF06 (não implementado nesta feature):

```ts
// src/app/treino/[treinoId].tsx — conceitual, não é um tipo compartilhado exportado
onDescansoConcluido?: () => void;
```

## Fluxo de dados (ao concluir uma série)

1. Usuário toca em "Concluir série" dentro de `ExercicioExecucao` →
   `handleConcluirSerie` (já existente, RF04) fecha o teclado virtual
   (`Keyboard.dismiss()`, FR-013), registra a série normalmente e, ao final,
   verifica se a série concluída era a última planejada do exercício
   (`estado.serieAtual >= exercicio.series`, FR-012). Se **não** era a última,
   chama `onIniciarDescanso({ exercicioId: exercicio.id, descansoSeg: exercicio.descansoSeg })`
   — se **era** a última, o callback não é chamado e nenhum cronômetro é
   iniciado (o fluxo segue diretamente para a exibição de "Concluir
   exercício", já existente no RF04).
2. A rota recebe a chamada e cria/substitui `descansoAtivo` conforme as regras de
   transição acima.
3. A rota renderiza `<CronometroDescanso segundosRestantes={...} onMais15={...} onMenos15={...} />`
   sempre que `descansoAtivo !== null`, com `segundosRestantes` recalculado a cada
   tick/recálculo de `AppState` via `calcularSegundosRestantes(descansoAtivo.fimEm)`.
4. Ao chegar a zero, a rota limpa `descansoAtivo` e chama
   `onDescansoConcluido?.()` (sem efeito nesta feature — RF06 consome depois).
