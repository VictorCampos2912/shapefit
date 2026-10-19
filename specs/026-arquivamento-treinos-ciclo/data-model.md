# Data Model: Arquivamento Lógico de Treinos, "Encerrar Ciclo" e Tratamento de Sessões Abandonadas

**Feature**: `026-arquivamento-treinos-ciclo`

Dois tipos alterados, ambos em `src/types/treino.ts` e
`src/types/ciclo-treino.ts`. Nenhum tipo novo, nenhuma coleção nova no
Firestore — `users/{uid}/treinos/*` e `users/{uid}/ciclos/*` (specs 022/025)
continuam sendo os mesmos documentos, só com um campo a mais cada.

## `Treino` (alterado — `src/types/treino.ts`)

```ts
export type Treino = {
  id: string;
  nome: string;
  exercicios: ExercicioPlanejado[];
  importadoEm: string;
  arquivadoEm: string | null; // NOVO — ISO 8601 quando arquivado, null enquanto ativo
};
```

- **`arquivadoEm`**: `null` enquanto o treino está ativo (visível em "Meus
  treinos", executável); string ISO 8601 (mesmo formato de
  `importadoEm`/`finalizadaEm`) com o momento em que o usuário arquivou.
  Campo **sempre presente** no tipo (não opcional) — documentos
  existentes antes desta spec não têm o campo persistido e são
  normalizados para `null` na leitura (`listarTreinos`, ver
  `research.md` Decisão 2). Toda escrita nova (importação única ou em
  lote) grava `arquivadoEm: null` explicitamente — nunca `undefined`,
  nunca omitido.
- **Validação**: nenhuma regra de formato além de ser uma string ISO 8601
  válida quando não-nula (mesmo padrão já usado para `importadoEm`, sem
  validação de formato em tempo de execução hoje).
- **Transição de estado**: `null` → string (arquivar, `FR-001`/`FR-002`);
  string → `null` (restaurar, `FR-006`). Nenhuma outra transição — não há
  "arquivado duas vezes" nem histórico de quando foi arquivado antes (uma
  restauração simplesmente limpa o campo, perdendo a data do arquivamento
  anterior; aceitável, não é um dado que o app expõe em lugar nenhum).

## `CicloTreino` (alterado — `src/types/ciclo-treino.ts`)

```ts
export type CicloTreino = {
  id: string;
  uid: string;
  treinoIds: string[];
  cotaPorTreinoId: Record<string, number>;
  criadoEm: string;
  encerradoEm: string | null; // NOVO — ISO 8601 quando encerrado manualmente, null enquanto ativo
};
```

- **`encerradoEm`**: `null` enquanto o ciclo está ativo (pode ser o "ciclo
  atual", bloqueia importação de novo lote enquanto não atingir 40
  sessões); string ISO 8601 com o momento em que o usuário encerrou
  manualmente (`FR-007`/`FR-008`). Mesmo tratamento de presença/
  normalização de `Treino.arquivadoEm` acima — ciclos existentes antes
  desta spec normalizam para `null` na leitura (`listarCiclos`); todo
  ciclo novo (`criarCiclo`) grava `encerradoEm: null` explicitamente.
- **Validação**: mesma observação de `arquivadoEm` — string ISO 8601
  quando não-nula, sem validação de formato em runtime.
- **Transição de estado**: `null` → string (encerrar, `FR-007`/`FR-008`).
  **Sem transição de volta** — não existe "reabrir um ciclo encerrado"
  nesta spec (não foi pedido; um novo lote de múltiplos treinos sempre
  cria um ciclo novo, nunca reabre um antigo — ver `spec.md`, Edge Cases).
- **Redefinição de "ciclo atual"**: antes desta spec, `obterCicloAtual`
  retornava o último ciclo criado (`ciclos[ciclos.length - 1]`). Depois,
  retorna **esse mesmo último ciclo, só se ele próprio** tiver
  `encerradoEm === null` — nunca um ciclo anterior, mesmo que algum
  ciclo mais antigo também esteja com `encerradoEm === null` (ex.: um
  ciclo que já chegou a 40 sessões mas nunca foi encerrado manualmente)
  — ver `research.md`, Decisão 7, e `contracts/ciclo-treino-storage.md`.

## `SessaoTreino` / `SerieRealizada` — sem mudança de schema

Nenhum campo novo. Esta spec só adiciona uma forma mais direta de chamar a
finalização já existente (`finalizarSessao`, spec 025) a partir de "Meus
treinos" (`FR-011`) e, como efeito colateral de arquivar um treino com
sessão em andamento, a mesma finalização dentro do `writeBatch` de
`arquivarTreino` (`FR-010`, ver `research.md` Decisão 4). Em ambos os
casos, o resultado é indistinguível de uma sessão finalizada manualmente
por "Finalizar treino" — mesmo campo (`finalizadaEm`), mesmo efeito nos
contadores (RF02/RF16) e no total do ciclo (RF15).

## Relação entre entidades (sem mudança de relação, só de visibilidade)

```
users/{uid}/treinos/{treinoId}   — arquivadoEm: string | null (NOVO)
users/{uid}/sessoes/{sessaoId}   — treinoId aponta para o treino acima (sem mudança);
                                     sessão de um treino arquivado continua existindo e
                                     aparecendo no histórico via snapshot (RF24), independente
                                     do estado de arquivamento do treino de origem
users/{uid}/ciclos/{cicloId}     — encerradoEm: string | null (NOVO);
                                     treinoIds pode incluir treinos arquivados (nenhuma
                                     limpeza/remoção de treinoIds ao arquivar — a cota
                                     desse treino simplesmente não é mais alcançável
                                     por novas sessões, ver spec.md Edge Cases)
```

Nenhuma referência (treino → sessão, ciclo → treino) é alterada, removida
ou invalidada por arquivamento/encerramento — são só marcadores de
visibilidade/bloqueio, nunca de integridade referencial.
