# Data Model: Editar Registro de Série de uma Sessão Já Finalizada

## Entidades existentes (reaproveitadas, sem alteração de schema)

### `SessaoTreino` / `ExecucaoExercicio` / `SerieRealizada` (RF04/RF07 — sem alteração)

```ts
// src/types/execucao-treino.ts — inalterado
export interface SessaoTreino extends SessaoRegistro {
  id: string;
  treinoId: string;
  iniciadaEm: string;
  execucoes: ExecucaoExercicio[];
}

export type ExecucaoExercicio = {
  exercicioId: string;
  seriesRealizadas: SerieRealizada[];
  status: 'em_andamento' | 'concluido';
};

export type SerieRealizada = {
  serie: number;
  cargaKg: number;
  reps: number;
};
```

Esta feature grava diretamente dentro de `SessaoTreino.execucoes[].seriesRealizadas`,
localizando a `SerieRealizada` a editar por `serie` (número), dentro da
`ExecucaoExercicio` identificada por `exercicioId`, dentro da `SessaoTreino`
identificada por `id` — três níveis de busca, nenhum deles novo, todos já existentes
na estrutura de dados do RF04.

## Entidade estendida (alteração de campo)

### `RegistroHistorico` (RF08 — campos novos: `sessaoId`, `exercicioId`, `serie`)

```ts
// src/types/historico.ts
export type RegistroHistorico = {
  data: string;         // ISO 8601 — inalterado (finalizadaEm da sessão de origem)
  cargaKg: number;       // inalterado
  reps: number;          // inalterado
  sessaoId: string;      // NOVO — id da SessaoTreino de origem (SessaoTreino.id)
  exercicioId: string;   // NOVO — id do exercício dentro do treino de origem
                          // (ExecucaoExercicio.exercicioId)
  serie: number;          // NOVO — número da série dentro da execução
                          // (SerieRealizada.serie)
};
```

| Campo | Tipo | Descrição |
|---|---|---|
| `sessaoId` | `string` | **novo** — identifica a `SessaoTreino` de origem deste registro; usado por `atualizarSerieDeSessaoFinalizada` para localizar a sessão a editar (research.md, Decisão 2). |
| `exercicioId` | `string` | **novo** — identifica a `ExecucaoExercicio` dentro da sessão; junto com `sessaoId` e `serie`, localiza a `SerieRealizada` exata. |
| `serie` | `number` | **novo** — número da série dentro da execução (não confundir com a posição do registro na lista exibida — corresponde exatamente a `SerieRealizada.serie`). |

`EvolucaoExercicio` e `HistoricoPerfil` (RF08) permanecem inalterados — a mudança é
inteiramente contida em `RegistroHistorico`.

## Fluxo de leitura (alterado em relação ao RF08)

### `obterHistoricoPorPerfil(perfilId)` (comportamento estendido, não alterado)

O algoritmo de agrupamento/resolução de nome/ordenação já definido pelo RF08
(`specs/010-historico-evolucao-carga/data-model.md`, "Fluxo de leitura", passos 1-7)
permanece **inteiramente inalterado**. A única mudança é no passo que converte a lista
de trabalho ordenada (`itens`) para `RegistroHistorico[]` público: onde antes o
mapeamento descartava `nomeOriginal` e produzia apenas `{ data, cargaKg, reps }`, agora
também preserva `{ sessaoId, exercicioId, serie }`, já disponíveis na mesma estrutura
de trabalho interna (`ItemDeTrabalho`, que passa a incluir esses três campos desde o
momento em que cada item é empurrado durante a iteração das sessões — research.md,
Decisão 4).

## Fluxo de escrita (novo, esta feature)

### `atualizarSerieDeSessaoFinalizada(params)` (nova função em `sessao-treino-storage.ts`)

```ts
export async function atualizarSerieDeSessaoFinalizada(params: {
  perfilId: string;
  sessaoId: string;
  exercicioId: string;
  serie: number;
  novaCargaKg: number;
  novosReps: number;
}): Promise<SessaoTreino>
```

1. Lê o array de sessões do perfil (`sessoes:${perfilId}`).
2. Localiza a sessão por `sessoes.find((item) => item.id === sessaoId)` — **não** por
   `treinoId` (research.md, Decisão 2). Se não encontrar, lança erro (`Nenhuma sessão
   encontrada com id ${sessaoId} para o perfil ${perfilId}` — mesmo padrão de mensagem
   já usado por `finalizarSessao`).
3. Valida `sessao.finalizadaEm !== null`. Se a sessão encontrada ainda estiver em
   andamento (`finalizadaEm === null`), lança erro imediatamente, sem gravar nada
   (research.md, Decisão 3 — sugestão de robustez do usuário).
4. Localiza a execução por `sessao.execucoes.find((item) => item.exercicioId ===
   exercicioId)`. Se não encontrar, lança erro (mesmo padrão de
   `atualizarSerieRealizada`, RF09a).
5. Localiza a série por `execucao.seriesRealizadas.find((item) => item.serie ===
   serie)`. Se não encontrar, lança erro (mesmo padrão de `atualizarSerieRealizada`).
6. Grava `serieRealizada.cargaKg = novaCargaKg` e `serieRealizada.reps = novosReps` —
   nenhum outro campo da série, da execução ou da sessão é alterado (em particular,
   `finalizadaEm` permanece exatamente como estava, FR-007).
7. Persiste o array de volta em `sessoes:${perfilId}` e retorna a `SessaoTreino`
   atualizada.

## Estado de UI (novo, em `src/app/(tabs)/explore.tsx`)

| Estado | Tipo | Onde vive | Descrição |
|---|---|---|---|
| `edicaoAtiva` | `{ sessaoId: string; exercicioId: string; serie: number; cargaKg: string; reps: string } \| null` | Dentro de cada componente `SecaoExercicio` (research.md, Decisão 5) | Registro atualmente em edição dentro daquela seção específica; `null` quando nenhum registro daquela seção está sendo editado. Campos `cargaKg`/`reps` como `string` (mesmo padrão do RF09a, permitindo campo vazio/inválido durante a digitação, sanitizados via `sanitizarCarga`/`sanitizarReps`). |

**Transições**:
- Usuário toca em um registro → `edicaoAtiva` é preenchido com os três identificadores
  daquele registro (`sessaoId`, `exercicioId`, `serie`) e os valores atuais de
  `cargaKg`/`reps` (convertidos para `string`).
- Usuário altera os campos de carga/reps → `edicaoAtiva.cargaKg`/`edicaoAtiva.reps` são
  atualizados via `sanitizarCarga`/`sanitizarReps` (research.md, Decisão 7).
- Usuário toca em "Salvar edição" com valores válidos → `Alert.alert` de confirmação é
  exibido; `edicaoAtiva` permanece preenchido até a resposta do usuário.
- Usuário confirma no `Alert.alert` → `handleEditarRegistro` (na tela pai) é chamado
  com os três identificadores e os novos valores numéricos; após a chamada bem-sucedida
  a `atualizarSerieDeSessaoFinalizada`, `edicaoAtiva` volta a `null` e o registro
  correspondente em `historico` (estado da tela pai) é atualizado via patch pontual
  (research.md, Decisão 6).
- Usuário cancela no `Alert.alert`, ou sai da edição sem confirmar → `edicaoAtiva`
  volta a `null` sem nenhuma chamada de escrita — o valor exibido continua o original.

## Invariantes

1. **Nenhuma nova chave de storage**: esta feature grava exclusivamente em
   `sessoes:${perfilId}`, já existente — nenhuma nova chave é introduzida.
2. **`finalizadaEm` é imutável por esta feature**: `atualizarSerieDeSessaoFinalizada`
   nunca lê nem grava `finalizadaEm` além de validá-lo como pré-condição (passo 3) —
   nenhum caminho desta função altera esse campo.
3. **Isolamento por perfil**: `atualizarSerieDeSessaoFinalizada` só opera sobre
   `sessoes:${perfilId}` do `perfilId` recebido explicitamente (Constituição
   Princípio V).
4. **Agrupamento do RF08 permanece estável**: como esta feature nunca altera `data`
   (`finalizadaEm` da sessão) nem o nome do exercício, a posição de um registro dentro
   do seu grupo (ordenação por data) e o `nomeExibido` do grupo nunca mudam como
   consequência de uma edição desta feature.
