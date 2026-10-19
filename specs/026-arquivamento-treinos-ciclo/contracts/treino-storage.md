# Contract: `src/services/treino-storage.ts` (alterado)

**Feature**: `026-arquivamento-treinos-ciclo`

Ganha o campo `arquivadoEm` em todo `Treino` escrito, duas funções puras
novas de filtragem, e duas funções novas de escrita (`arquivarTreino`/
`restaurarTreino`). `listarTreinos` **não muda de assinatura nem de
comportamento de retorno** — continua retornando todos os treinos (ativos
+ arquivados); quem precisa de uma visão filtrada aplica uma das novas
funções puras sobre o resultado (`research.md`, Decisão 1).

## `listarTreinos(uid)` — normalização de `arquivadoEm` (sem mudança de assinatura)

```ts
export async function listarTreinos(uid: string): Promise<Treino[]> {
  const snapshot = await getDocs(treinosCollection(uid));
  const treinos = snapshot.docs.map((documento) => {
    const treino = documento.data() as Treino;
    return {
      ...treino,
      arquivadoEm: treino.arquivadoEm ?? null, // NOVO — mesmo padrão de categoria ?? 'peso' abaixo
      exercicios: treino.exercicios.map((exercicio) => ({
        ...exercicio,
        categoria: exercicio.categoria ?? 'peso',
      })),
    };
  });
  return treinos.sort(/* inalterado — importadoEm + id */);
}
```

## Funções puras novas (filtram em memória, sem leitura nova)

```ts
export function filtrarTreinosAtivos(treinos: Treino[]): Treino[] {
  return treinos.filter((treino) => treino.arquivadoEm === null);
}

export function filtrarTreinosArquivados(treinos: Treino[]): Treino[] {
  return treinos.filter((treino) => treino.arquivadoEm !== null);
}
```

- **`src/app/(tabs)/index.tsx`**: `const lista = filtrarTreinosAtivos(await listarTreinos(uid));`
  nas duas chamadas existentes (`useEffect` inicial e `recarregarTreinos`)
  — única mudança nesse arquivo relacionada a `listarTreinos`.
- **`src/services/historico-evolucao.ts`** (`obterHistoricoPorPerfil`):
  `const treinosAtivos = filtrarTreinosAtivos(treinos);` antes do laço que
  semeia `gruposPorChave` (universo de "exercícios nunca registrados",
  FR-005) — o restante da função (registros vindos de
  `listarSessoesFinalizadas` via snapshot) não muda, continua mostrando
  registros de treinos arquivados normalmente.
- **`src/app/treino/[treinoId].tsx`**: **não usa nenhuma das duas** — essa
  tela precisa do treino mesmo arquivado, para diferenciar "arquivado" de
  "não existe" (ver `contracts/treino-execucao.md`).
- **Nova tela `src/app/treinos-arquivados.tsx`**: usa
  `filtrarTreinosArquivados(await listarTreinos(uid))` — 1 leitura própria
  dessa tela (não está no caminho quente de `index.tsx`/item 8 do plano).

## `montarTreinoValido` (alterado) — escreve `arquivadoEm: null` explicitamente

```ts
const treino: Treino = {
  id: Crypto.randomUUID(),
  nome: estrutura.nome,
  exercicios,
  importadoEm: new Date().toISOString(),
  arquivadoEm: null, // NOVO — nunca omitido, nunca undefined (setDoc nativo rejeita)
};
```

Único ponto de construção de `Treino` (reaproveitado tanto pela
importação única quanto pela em lote, spec 012) — nenhuma outra mudança
necessária em `processarConteudoObjeto`/`processarConteudoArray` por causa
deste campo.

## `arquivarTreino(uid, treinoId, sessaoEmAndamentoId)` — NOVO, FR-001/FR-002/FR-010, SEM leitura

```ts
export function arquivarTreino(uid: string, treinoId: string, sessaoEmAndamentoId: string | null): void {
  const lote = writeBatch(getFirestore());
  lote.update(doc(treinosCollection(uid), treinoId), { arquivadoEm: new Date().toISOString() });
  if (sessaoEmAndamentoId) {
    finalizarSessaoPorId(uid, sessaoEmAndamentoId, lote); // mesmo lote — commit atômico
  }
  lote.commit().catch((erro) => {
    console.error('[treino-storage] Falha ao confirmar arquivamento no servidor (já salvo no cache local):', erro);
  });
}
```

- **Sem leitura nenhuma** (mudança em relação ao desenho original —
  `research.md`, Decisão 4 revisada): nem `listarTreinos` nem
  `listarSessoes` são chamados aqui. O chamador já passa tudo que a
  função precisa — `sessaoEmAndamentoId` é o id da sessão em andamento
  desse treino (ou `null`, se não houver), que `[treinoId].tsx` já tem em
  `sessaoAtualId` e `index.tsx` já tem em
  `sessaoEmAndamentoIdPorTreino[treino.id] ?? null`
  (`contracts/lista-treinos-e-historico.md`).
- **`batch.update` de um único campo** (`arquivadoEm`), não `batch.set`
  do objeto inteiro — não precisa do treino completo em memória para
  gravar.
- **`writeBatch` atômico continua** (não duas chamadas em sequência) —
  garante que nunca existe um estado observável (nem no cache offline)
  com o treino já arquivado e a sessão ainda em andamento, ou vice-versa.
- **Função síncrona, não `async`** — enfileira o `writeBatch` e chama
  `commit()` sem `await` no mesmo tick da chamada; não há nenhuma Promise
  no caminho antes da escrita ser enfileirada.
- **Sem retorno** — `{ sessaoFinalizada }` não existe mais; o chamador já
  sabia se havia sessão em andamento **antes** de chamar esta função
  (usou isso para montar o texto da confirmação), então não há nada que
  o retorno revelaria de novo.
- **`.catch` só dentro da função** — chamadores não precisam (nem devem)
  encadear `.catch` na chamada, mesmo padrão de `setDocTreino`/
  `setDocSessao`/`setDocCiclo`.
- **Novo import**: `finalizarSessaoPorId` (NOVO,
  `contracts/sessao-treino-storage.md`) de
  `@/services/sessao-treino-storage` — `encontrarSessaoEmAndamento` e
  `listarSessoes` **não são mais importados aqui** (não há mais leitura).

## `restaurarTreino(uid, treinoId)` — NOVO, FR-006, SEM leitura

```ts
export function restaurarTreino(uid: string, treinoId: string): void {
  updateDoc(doc(treinosCollection(uid), treinoId), { arquivadoEm: null }).catch((erro) => {
    console.error('[treino-storage] Falha ao confirmar restauração no servidor (já salva no cache local):', erro);
  });
}
```

- **Sem leitura, sem `writeBatch`** — restaurar nunca tem efeito
  colateral em nenhuma sessão (diferente de arquivar); `updateDoc` de um
  único campo (`arquivadoEm: null`) via `treinoId`, que o chamador já
  tem (o item da lista de arquivados que o usuário tocou). Função
  síncrona, mesmo espírito de `arquivarTreino` acima.

## `processarConteudoArray` — bloqueio de importação (condição inalterada, mensagem alterada, FR-009)

A condição `if (cicloAtual) { ... bloqueia ... }` (RF15, FR-007 original)
**não muda uma linha** — `obterCicloAtual` passa a retornar `null` quando
o único ciclo "atual" foi encerrado (`research.md`, Decisão 7,
`contracts/ciclo-treino-storage.md`), então o bloqueio para de disparar
automaticamente depois de "Encerrar ciclo", sem nenhum ajuste à condição
em si.

**Mensagem de bloqueio alterada** (FR-009) — passa a orientar o caminho de
saída que esta spec introduz, em vez de só explicar a regra:

```diff
- 'Já existe um ciclo de treinos em andamento. Finalize as 40 sessões esperadas antes de importar um novo lote de múltiplos treinos.',
+ 'Já existe um ciclo de treinos em andamento. Finalize as 40 sessões esperadas antes de importar um novo lote de múltiplos treinos. Para liberar agora, use Ações → Encerrar ciclo.',
```

Única linha alterada em `processarConteudoArray` — nenhuma mudança de
lógica, só de texto.
