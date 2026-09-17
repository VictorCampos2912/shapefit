# Data Model: Editar Registro de Série Já Feito (Sessão em Andamento)

**Feature**: 006-editar-serie-em-andamento

## Entidades existentes (reaproveitadas, sem alteração de campos)

Todas as entidades relevantes já foram criadas pelo RF04 em
`src/types/execucao-treino.ts`. Esta feature não adiciona, remove nem renomeia campos —
apenas passa a permitir uma nova forma de **mutar** um campo já existente
(`SerieRealizada.cargaKg` / `SerieRealizada.reps`) fora do fluxo de "Concluir série".

### `SerieRealizada` (sem alteração)

```ts
export type SerieRealizada = {
  serie: number;   // 1-indexado; identidade natural dentro de seriesRealizadas
  cargaKg: number; // editável por esta feature
  reps: number;    // editável por esta feature
};
```

- `serie` é usado por esta feature como chave de localização (não é alterado por uma
  edição — apenas `cargaKg`/`reps` mudam de valor).

### `ExecucaoExercicio` (sem alteração)

```ts
export type ExecucaoExercicio = {
  exercicioId: string;
  seriesRealizadas: SerieRealizada[];
  status: 'em_andamento' | 'concluido'; // MUST NOT ser alterado por esta feature
};
```

### `SessaoTreino` (sem alteração)

```ts
export interface SessaoTreino extends SessaoRegistro {
  treinoId: string;
  iniciadaEm: string;
  execucoes: ExecucaoExercicio[];
  // finalizadaEm (herdado de SessaoRegistro) — MUST permanecer null, não tocado por esta feature
}
```

### `EstadoExecucaoExercicio` (sem alteração de campos)

```ts
export type EstadoExecucaoExercicio = {
  exercicioId: string;
  iniciado: boolean;
  serieAtual: number;
  cargaKg: string;
  repsFeitas: string;
  seriesConcluidas: SerieRealizada[]; // atualizado em memória após uma edição confirmada
  concluido: boolean;                 // MUST NOT ser alterado por esta feature
};
```

- `seriesConcluidas` já é a lista, em memória, que espelha
  `ExecucaoExercicio.seriesRealizadas` (ver data-model.md do RF04). Após uma edição
  confirmada, esta feature substitui a entrada correspondente (mesmo `serie`) dentro desse
  array, mantendo referência ao mesmo padrão de sincronização já usado por
  `handleConcluirSerie` em `[treinoId].tsx`.

## Nova operação (sem nova entidade)

### `atualizarSerieRealizada` (função de serviço, não uma entidade de dados)

Assinatura proposta em `src/services/sessao-treino-storage.ts`:

```ts
export async function atualizarSerieRealizada(params: {
  perfilId: string;
  treinoId: string;
  exercicioId: string;
  serie: number;               // identifica a SerieRealizada a editar (campo `serie`)
  novaCargaKg: number;
  novosReps: number;
}): Promise<SessaoTreino>
```

**Comportamento**:
1. Carrega as sessões do perfil (`getSessoes`, já existente/privada no módulo).
2. Localiza a `SessaoTreino` por `treinoId`. Se não existir, lança erro (mesma convenção de
   `marcarExercicioConcluido` — condição de erro fora de escopo desta feature, ver spec,
   Edge Cases).
3. Localiza a `ExecucaoExercicio` por `exercicioId` dentro de `execucoes`. Se não existir,
   lança erro (mesma convenção).
4. Localiza a `SerieRealizada` por `serie` dentro de `seriesRealizadas`. Se não existir,
   lança erro (condição não esperada em uso normal — a UI só oferece edição de séries já
   listadas em `seriesConcluidas`).
5. Substitui **apenas** `cargaKg` e `reps` do objeto encontrado pelos novos valores
   (`novaCargaKg`, `novosReps`). **MUST NOT** alterar `serie`, `status` da execução,
   `finalizadaEm` da sessão, nem qualquer outro campo.
6. Persiste via `setSessoes` (já existente/privada no módulo) e retorna a `SessaoTreino`
   atualizada — mesmo padrão de retorno de `registrarSerieConcluida`/
   `marcarExercicioConcluido`.

**Regras de validação** (aplicadas na camada de UI antes de chamar esta função, mesmo padrão
de `handleConcluirSerie` em `exercicio-execucao.tsx`):
- `novaCargaKg` e `novosReps` MUST ser convertidos para `number` a partir dos campos de
  texto de edição, já sanitizados por `sanitizarCarga`/`sanitizarReps` (RF03/RF04) —
  reaproveitados sem modificação.
- A confirmação (`Alert.alert`) MUST ocorrer antes desta função ser chamada; a função em si
  não implementa nenhuma lógica de confirmação (responsabilidade da UI).

## Estado de UI (novo, local ao componente de edição)

Não é necessário nenhum novo campo em `EstadoExecucaoExercicio` — o estado de "qual série
está sendo editada agora" e "quais valores estão sendo digitados na edição" são estados
efêmeros, internos ao componente `ExercicioExecucao` (ex.: `useState<{ serie: number;
cargaKg: string; reps: string } | null>` para a série em edição), descartados ao cancelar ou
após confirmar com sucesso. Isso é consistente com o padrão já usado no RF03/RF04 para os
campos da série atual (`cargaKg`/`repsFeitas` em `EstadoExecucaoExercicio` são o único
estado "oficial" que sobrevive entre re-renders relevantes ao domínio; estado de edição
transitória de UI não precisa ser elevado a esse nível).

## Fluxo de edição (sequência completa)

1. Usuário visualiza a lista de séries concluídas do exercício em foco (dentro de
   `ExercicioExecucao`, tanto no ramo "em andamento" quanto no ramo "já concluído,
   reaberto").
2. Usuário toca em "editar" numa série específica → componente entra em modo de edição
   local para aquela série, pré-preenchendo os campos com os valores atuais (`cargaKg`,
   `reps`), usando os mesmos `TextInput` com sanitização já existentes.
3. Usuário altera carga e/ou reps e toca em "Salvar edição".
4. Validação: se algum campo estiver vazio/inválido, a ação de salvar fica bloqueada (mesmo
   padrão de `podeConcluirSerie` em `exercicio-execucao.tsx`) — nenhuma chamada a
   `Alert.alert` ocorre.
5. Se válido, o componente dispara `Alert.alert` pedindo confirmação ("Confirmar alteração
   da série X?" / Cancelar / Salvar).
6. Se o usuário cancelar → nada é persistido; estado de edição local é descartado ou mantido
   aberto para nova tentativa (decisão de implementação, sem impacto no contrato de dados).
7. Se o usuário confirmar → chama `atualizarSerieRealizada` (serviço); ao resolver, atualiza
   `estadosPorExercicio` em `[treinoId].tsx` substituindo a série correspondente dentro de
   `seriesConcluidas` do exercício em memória, e fecha o modo de edição.
