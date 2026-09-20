# Data Model: Histórico de Evolução de Carga por Exercício

## Entidades existentes (reaproveitadas, sem alteração)

### `Treino` / `ExercicioPlanejado` (sem alteração)

```ts
// src/types/treino.ts — inalterado
export type ExercicioPlanejado = {
  id: string;
  nome: string;
  series: number;
  repsAlvo: string;
  cargaSugeridaKg: number;
  descansoSeg: number;
};

export type Treino = {
  id: string;
  perfilId: string;
  nome: string;
  exercicios: ExercicioPlanejado[];
  importadoEm: string;
};
```

Fonte do nome original de cada exercício (`ExercicioPlanejado.nome`), usado pela
resolução de nome (FR-004). Lido via `listarTreinos(perfilId)` (RF01), já existente —
nenhuma mudança.

### `SessaoTreino` / `ExecucaoExercicio` / `SerieRealizada` (sem alteração)

```ts
// src/types/execucao-treino.ts — inalterado
export interface SessaoTreino extends SessaoRegistro {
  id: string;
  treinoId: string;
  iniciadaEm: string;
  execucoes: ExecucaoExercicio[];
  // finalizadaEm: string | null — herdado de SessaoRegistro (RF10)
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

Fonte dos registros de série já executados. Lido via nova `listarSessoesFinalizadas`
(ver "Entidades novas" abaixo) — filtro adicional sobre o array já persistido em
`sessoes:${perfilId}`, sem nenhuma mudança de schema.

## Entidades novas (introduzidas por esta feature)

Todas vivem em `src/types/historico.ts`. Nenhuma delas é persistida — são
inteiramente derivadas, em memória, a partir de `Treino`/`SessaoTreino` já existentes,
recalculadas a cada chamada de `obterHistoricoPorPerfil`.

### `RegistroHistorico`

```ts
export type RegistroHistorico = {
  data: string;     // ISO 8601 — SessaoTreino.finalizadaEm da sessão de origem
  cargaKg: number;  // SerieRealizada.cargaKg
  reps: number;     // SerieRealizada.reps
};
```

| Campo | Tipo | Descrição |
|---|---|---|
| `data` | `string` (ISO 8601) | `finalizadaEm` da sessão à qual esta série pertence (research.md, Decisão 7). Nunca `null` — apenas sessões finalizadas geram registros. |
| `cargaKg` | `number` | Carga registrada naquela série específica, sem arredondamento ou agregação. |
| `reps` | `number` | Repetições registradas naquela série específica. |

Não inclui `exercicioId`, `treinoId` ou `sessaoId` — esses identificadores só importam
durante a resolução/agrupamento (dentro de `historico-evolucao.ts`); uma vez que um
registro está posicionado dentro de um `EvolucaoExercicio`, ele não precisa mais
apontar de volta para sua origem para satisfazer a spec (que não pede navegação de
volta a uma sessão específica — isso é escopo do RF09b, fora desta feature).

### `EvolucaoExercicio`

```ts
export type EvolucaoExercicio = {
  nomeExibido: string;
  registros: RegistroHistorico[]; // ordenados do mais recente para o mais antigo
};
```

| Campo | Tipo | Descrição |
|---|---|---|
| `nomeExibido` | `string` | Grafia original a exibir como título do grupo — grafia do registro mais recente, se houver algum; caso contrário, grafia do exercício no primeiro treino do perfil que o contém (research.md, Decisão 8). |
| `registros` | `RegistroHistorico[]` | Pode ser um array vazio (exercício existente em algum treino, mas nunca registrado — FR-009). Quando não vazio, ordenado por `data` decrescente (FR-007). |

A chave de agrupamento (`normalizarNomeExercicio(nomeOriginal)`) não é exposta neste
tipo — é um detalhe interno de como `historico-evolucao.ts` decide quais registros
pertencem a qual `EvolucaoExercicio`, não algo que a UI precisa conhecer.

### `HistoricoPerfil`

```ts
export type HistoricoPerfil =
  | { temSessoesFinalizadas: false }
  | { temSessoesFinalizadas: true; evolucoes: EvolucaoExercicio[] };
```

Tipo discriminado por `temSessoesFinalizadas`, distinguindo o estado vazio de tela
inteira (FR-010, nenhuma sessão finalizada em nenhum treino do perfil) do estado com
dados (FR-009 tratado individualmente, por item de `evolucoes` com `registros.length
=== 0`) — ver research.md, Decisão 6.

## Fluxo de leitura (novo, esta feature)

### `listarSessoesFinalizadas(perfilId)` (nova função em `sessao-treino-storage.ts`)

```ts
export async function listarSessoesFinalizadas(perfilId: string): Promise<SessaoTreino[]>
```

Lê `sessoes:${perfilId}` (mesma chave já usada por todas as demais funções deste
serviço) e retorna `sessoes.filter((s) => s.finalizadaEm !== null)` — todas as sessões
finalizadas do perfil, de todos os treinos, sem nenhum outro filtro. Não lança erro em
nenhum caso; retorna array vazio se não houver nenhuma sessão finalizada (ou nenhuma
sessão registrada ainda).

### `obterHistoricoPorPerfil(perfilId)` (novo serviço `historico-evolucao.ts`)

```ts
export async function obterHistoricoPorPerfil(perfilId: string): Promise<HistoricoPerfil>
```

1. Chama `listarTreinos(perfilId)` e `listarSessoesFinalizadas(perfilId)` (em
   paralelo, via `Promise.all`, sem dependência entre as duas chamadas).
2. Se o array de sessões finalizadas estiver vazio, retorna
   `{ temSessoesFinalizadas: false }` imediatamente (research.md, Decisão 6) — não
   percorre os treinos.
3. Caso contrário, constrói um mapa `treinoId -> Treino` a partir do array de treinos,
   para resolução O(1) por sessão.
4. Constrói o universo de grupos a partir de **todos** os exercícios de **todos** os
   treinos (research.md, Decisão 5): para cada `Treino`, para cada
   `ExercicioPlanejado`, calcula `chave = normalizarNomeExercicio(exercicio.nome)` e
   garante uma entrada em um mapa interno `chave -> { nomeFallback: exercicio.nome,
   itens: [] }`, onde `nomeFallback` é a grafia a usar caso este grupo acabe sem
   nenhum registro (research.md, Decisão 8) e `itens` é uma lista de trabalho
   temporária — `{ data, cargaKg, reps, nomeOriginal }[]` — mais rica que o
   `RegistroHistorico` público final, pois carrega também a grafia original de cada
   ocorrência até o momento em que `nomeExibido` do grupo é decidido (passo 6).
5. Para cada sessão finalizada, para cada `ExecucaoExercicio` dentro dela, para cada
   `SerieRealizada`:
   - Localiza o `Treino` pelo `treinoId` da sessão no mapa do passo 3. Se não existir,
     emite `console.warn` (FR-014) e pula esta série (FR-013).
   - Localiza o `ExercicioPlanejado` pelo `exercicioId` dentro dos exercícios desse
     treino. Se não existir, emite `console.warn` (FR-014) e pula esta série
     (FR-013).
   - Calcula `chave = normalizarNomeExercicio(exercicio.nome)`, localiza o grupo
     correspondente no mapa do passo 4 (sempre existe, pois foi construído a partir dos
     mesmos treinos) e empurra `{ data: sessao.finalizadaEm, cargaKg: serie.cargaKg,
     reps: serie.reps, nomeOriginal: exercicio.nome }` em `itens`.
6. Após processar todas as sessões, para cada grupo: ordena `itens` por `data`
   decrescente (FR-007). Se `itens.length > 0`, `nomeExibido` do grupo é
   `itens[0].nomeOriginal` (a grafia do registro mais recente, após a ordenação —
   research.md, Decisão 8); caso contrário, `nomeExibido` é o `nomeFallback` do
   passo 4. `registros` (o `RegistroHistorico[]` público) é `itens` mapeado para
   `{ data, cargaKg, reps }`, descartando `nomeOriginal` (que não faz parte do tipo
   público — já resolvido em `nomeExibido`).
7. Converte o mapa de grupos em `EvolucaoExercicio[]`, ordenado alfabeticamente por
   `nomeExibido` (research.md, Decisão 9), e retorna
   `{ temSessoesFinalizadas: true, evolucoes }`.

## Invariantes

1. **Nenhuma escrita**: esta feature é somente leitura — nenhuma função introduzida
   grava em `AsyncStorage`. `historico-evolucao.ts` não exporta nenhuma função de
   escrita.
2. **Isolamento por perfil**: `obterHistoricoPorPerfil` só lê `treinos:${perfilId}` e
   `sessoes:${perfilId}` para o `perfilId` recebido explicitamente — nunca itera sobre
   outros perfis (Constituição Princípio V).
3. **Agrupamento estável**: a chave de agrupamento (`normalizarNomeExercicio`) é pura
   e determinística — o mesmo nome de exercício sempre produz a mesma chave,
   independentemente de quantas vezes `obterHistoricoPorPerfil` é chamada.
4. **`registros` nunca contém sessão em andamento**: garantido transitivamente por
   `listarSessoesFinalizadas` já filtrar `finalizadaEm !== null` antes de qualquer
   outro processamento.
