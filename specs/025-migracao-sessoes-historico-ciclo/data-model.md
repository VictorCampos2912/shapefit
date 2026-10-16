# Data Model: Migração de Sessões, Histórico e Ciclo de Progresso para o Firestore

**Feature**: `025-migracao-sessoes-historico-ciclo` | **Date**: 2026-10-15

## `SessaoTreino` (alterado) — migra para `users/{uid}/sessoes/{sessaoId}`

```ts
export interface SessaoTreino {
  id: string;
  uid: string;                    // RENOMEADO de perfilId (research.md, Decisão 6) — valor inalterado
  treinoId: string;
  iniciadaEm: string;              // já existe hoje — preservado sem mudança
  finalizadaEm: string | null;
  execucoes: ExecucaoExercicio[];
  revisadaPeloUsuario: boolean;

  // NOVOS nesta spec (FR-003) — snapshot tirado no momento da criação da sessão
  treinoNomeSnapshot: string;
  exerciciosSnapshot: {
    id: string;
    nome: string;
    categoria: CategoriaExercicio;
  }[];
}
```

- **Caminho Firestore**: `users/{uid}/sessoes/{sessaoId}` — um documento por
  sessão (`data-model` 1:1 com o tipo acima); `sessaoId` é o mesmo `id`
  gerado hoje por `Crypto.randomUUID()`.
- **`treinoNomeSnapshot`/`exerciciosSnapshot`**: escritos **uma única vez**,
  no momento em que a sessão é criada (primeira série concluída, FR-002);
  nunca atualizados depois, mesmo que o treino de origem mude (FR-003, US6
  do `spec.md`). `exerciciosSnapshot` cobre **todos** os exercícios
  planejados do treino no momento da criação (não só os já registrados) —
  mesmo universo que `exerciciosPlanejados` do treino de origem tinha
  naquele momento.
- **Compatibilidade**: como os dados antigos em AsyncStorage são
  descartados (não migrados, `spec.md`), não existe nenhuma `SessaoTreino`
  no Firestore sem esses dois campos — ambos são obrigatórios no tipo
  (sem `?`), diferente do padrão usado para campos opcionais migrados
  gradualmente (ex.: `observacao`, spec 023), porque não há dado legado
  para ser compatível com.

## `ExecucaoExercicio` / `SerieRealizada` (alterado)

```ts
export type SerieRealizada = {
  serie: number;
  cargaKg: number;
  reps: number;
  registradaEm: string; // NOVO (FR-004) — ISO 8601, no momento da conclusão da série
};

export type ExecucaoExercicio = {
  exercicioId: string;
  seriesRealizadas: SerieRealizada[];
  status: 'em_andamento' | 'concluido';
};
```

- **`registradaEm`**: definido dentro de `registrarSerieConcluida` no
  momento da conclusão da série (`new Date().toISOString()`), nunca
  recebido como parâmetro do chamador. **Imutável por edição** (FR-008):
  `atualizarSerieRealizada`/`atualizarSerieDeSessaoFinalizada` alteram só
  `cargaKg`/`reps` de uma `SerieRealizada` já existente, nunca
  `registradaEm`.

## `CicloTreino` (alterado) — migra para `users/{uid}/ciclos/{cicloId}`

```ts
export type CicloTreino = {
  id: string;
  uid: string; // RENOMEADO de perfilId (research.md, Decisão 6) — valor inalterado
  treinoIds: string[];
  cotaPorTreinoId: Record<string, number>;
  criadoEm: string;
};
```

- **Caminho Firestore**: `users/{uid}/ciclos/{cicloId}` — um documento por
  ciclo (hoje já é conceitualmente um item de array; só migra a forma de
  armazenamento, sem mudança de campo além do rename de `perfilId`).
- Nenhum campo novo — `calcularProgressoCiclo` continua **derivado** em
  tempo de leitura a partir das sessões (nunca cacheado no próprio
  documento do ciclo), exatamente como hoje.

## Entrada nova (função, não tipo): `listarSessoes`

```ts
export async function listarSessoes(uid: string): Promise<SessaoTreino[]>
```

- Lê `users/{uid}/sessoes/*` por completo e ordena por `iniciadaEm`
  crescente, com `id` como desempate (research.md, Decisão 2) — mesmo
  padrão de `listarTreinos` (spec 022).
- Único ponto de leitura da coleção `sessoes`, reaproveitado por
  `obterSessao`, `obterUltimaSessaoConcluidaNaoRevisada`,
  `contarSessoesFinalizadas`, `obterDataUltimaSessaoFinalizada`,
  `listarSessoesFinalizadas` e por `calcularProgressoCiclo` (em
  `ciclo-treino-storage.ts`) — todas essas funções **mantêm** sua própria
  assinatura e retorno de hoje (research.md, Decisão 1).

## Relação com entidades já existentes

- **`Treino`/`ExercicioPlanejado`** (RF01/RF02/RF11/RF17, Firestore desde a
  spec 022): fonte do snapshot no momento da criação da sessão (FR-003);
  depois disso, a sessão não depende mais do treino de origem para exibir
  nome/categoria no histórico (US6). A lista de treinos atual continua
  sendo a fonte do "universo de exercícios nunca registrados" do RF08
  (FR-011) — essa parte do histórico não lê o snapshot de nenhuma sessão.
- **Histórico de evolução (RF08/RF18)**: não persistido, continua derivado
  em tempo de leitura; `construirRegistrosBrutos` (em
  `historico-evolucao.ts`) passa a ler `treinoNomeSnapshot`/
  `exerciciosSnapshot` da própria `SessaoTreino`, em vez de cruzar com
  `Treino` via `listarTreinos`, para os dados de registros já feitos
  (nome do treino, nome e categoria do exercício).
