# Contract: `src/services/historico-evolucao.ts` (refatorado + função nova)

**Feature**: `019-historico-por-data`

Contrato interno (funções de serviço — não há API HTTP nesta feature).

## `construirRegistrosBrutos` (novo, interno — não exportado)

```ts
type RegistroBruto = {
  data: string;
  sessaoId: string;
  treinoId: string;
  treinoNome: string;
  exercicioId: string;
  exercicioNome: string;
  serie: number;
  cargaKg: number;
  reps: number;
};

function construirRegistrosBrutos(
  treinos: Treino[],
  sessoesFinalizadas: SessaoTreino[],
): RegistroBruto[] {
  // Mesmo laço e mesmo tratamento defensivo (console.warn + omissão silenciosa na
  // interface) já existentes dentro de obterHistoricoPorPerfil hoje — sem agrupar
  // por nome de exercício aqui, só retornar a lista plana já resolvida.
}
```

- **Pré-condição**: `sessoesFinalizadas` já filtradas por perfil e por
  `finalizadaEm !== null` (mesmo contrato de `listarSessoesFinalizadas` já
  existente); `treinos` já filtrados por perfil (mesmo contrato de `listarTreinos`).
- **Pós-condição**: um item por série registrada em qualquer sessão finalizada,
  com nome do exercício e nome do treino já resolvidos.
- **Tratamento defensivo (RF08, FR-013/FR-014, reaproveitado por FR-008 da spec
  019)**: quando o treino ou o exercício de origem de uma execução não é
  encontrado, esse registro específico é omitido da lista retornada, com um
  `console.warn` — comportamento idêntico ao já existente, só centralizado aqui em
  vez de duplicado.

## `obterHistoricoPorPerfil` (já existe, RF08 — refatorada internamente)

```ts
export async function obterHistoricoPorPerfil(perfilId: string): Promise<HistoricoPerfil> {
  const [treinos, sessoesFinalizadas] = await Promise.all([...]); // sem mudança
  if (sessoesFinalizadas.length === 0) return { temSessoesFinalizadas: false }; // sem mudança

  const registrosBrutos = construirRegistrosBrutos(treinos, sessoesFinalizadas); // NOVO
  // ... agrupamento por normalizarNomeExercicio(exercicioNome), exatamente como hoje,
  //     só consumindo `registrosBrutos` em vez do laço inline original ...
}
```

- **Sem mudança de assinatura nem de formato de retorno** (`HistoricoPerfil`) —
  garantia de não-regressão (`research.md`, Decisão 1); `quickstart.md` inclui um
  cenário de regressão explícito.

## `obterHistoricoPorData` (novo, exportado)

```ts
export async function obterHistoricoPorData(perfilId: string): Promise<HistoricoPorData> {
  const [treinos, sessoesFinalizadas] = await Promise.all([
    listarTreinos(perfilId),
    listarSessoesFinalizadas(perfilId),
  ]);
  if (sessoesFinalizadas.length === 0) return { temSessoesFinalizadas: false };

  const registrosBrutos = construirRegistrosBrutos(treinos, sessoesFinalizadas);

  // Agrupa por sessaoId -> BlocoSessao (exercícios por exercicioId, série ordenada);
  // agrupa BlocoSessao por chaveDia (local, YYYY-MM-DD, research.md Decisão 2);
  // ordena blocos dentro do dia por `data` desc; ordena dias por `chaveDia` desc.

  return { temSessoesFinalizadas: true, dias };
}
```

- **Pós-condição**: `dias` ordenados do mais recente para o mais antigo (FR-003);
  dentro de cada dia, `blocos` (um por sessão) ordenados do mais recente para o
  mais antigo (FR-004); um `BlocoSessao` nunca mescla registros de duas sessões
  diferentes, mesmo do mesmo treino no mesmo dia.
- **Isolamento por perfil (Princípio V)**: mesmo `perfilId` usado para
  `listarTreinos`/`listarSessoesFinalizadas`, já filtrados internamente — nenhuma
  leitura cross-perfil.
- **Consumida por**: `src/app/(tabs)/explore.tsx`, quando `visao === 'data'`.
