# Contract: `src/services/ciclo-treino-storage.ts` (alterado)

**Feature**: `026-arquivamento-treinos-ciclo`

Ganha o campo `encerradoEm` em todo `CicloTreino` escrito, uma função nova
(`encerrarCiclo`), e uma mudança **interna** (não de assinatura) em
`obterCicloAtual`. `calcularProgressoCiclo`/`criarCiclo` não mudam de
comportamento (além de `criarCiclo` escrever o campo novo).

## `listarCiclos(uid)` — normalização de `encerradoEm` (função privada, sem mudança de assinatura)

```ts
async function listarCiclos(uid: string): Promise<CicloTreino[]> {
  const snapshot = await getDocs(ciclosCollection(uid));
  const ciclos = snapshot.docs.map((documento) => {
    const ciclo = documento.data() as CicloTreino;
    return { ...ciclo, encerradoEm: ciclo.encerradoEm ?? null }; // NOVO
  });
  return ciclos.sort(/* inalterado — criadoEm + id */);
}
```

## `criarCiclo(uid, treinoIds)` — escreve `encerradoEm: null` explicitamente (sem mudança de assinatura)

```ts
export async function criarCiclo(uid: string, treinoIds: string[]): Promise<CicloTreino> {
  const ciclo: CicloTreino = {
    id: Crypto.randomUUID(),
    uid,
    treinoIds,
    cotaPorTreinoId: calcularCotaPorTreino(treinoIds),
    criadoEm: new Date().toISOString(),
    encerradoEm: null, // NOVO — nunca omitido, nunca undefined
  };
  setDocCiclo(uid, ciclo);
  return ciclo;
}
```

## `obterCicloAtual(uid)` — redefinição interna, MESMA assinatura e retorno

```ts
export async function obterCicloAtual(uid: string): Promise<CicloTreino | null> {
  const ciclos = await listarCiclos(uid);
  if (ciclos.length === 0) {
    return null;
  }
  const ultimo = ciclos[ciclos.length - 1];
  return ultimo.encerradoEm === null ? ultimo : null;
}
```

- **Antes**: `ciclos.length > 0 ? ciclos[ciclos.length - 1] : null` (o
  último criado, sem considerar encerramento — conceito não existia).
- **Depois**: o último criado — **só se ele mesmo** não estiver
  encerrado; se estiver, retorna `null`, **nunca** cai para um ciclo
  anterior.
- **Correção de um bug no próprio desenho desta spec** (encontrado antes
  de implementar a US3, 2026-10-18): a versão anterior deste contrato
  filtrava **todos** os ciclos com `encerradoEm === null` e pegava o
  último **desses** — isso reabriria como "atual" um ciclo **antigo**
  que já tinha chegado a 40 sessões mas nunca foi marcado como encerrado
  (não existe encerramento automático ao bater 40 — "Encerrar ciclo" é
  sempre manual, FR-007), no momento em que o ciclo **mais novo** fosse
  encerrado manualmente. A versão corrigida nunca "pula" para um ciclo
  anterior — se o mais recente está encerrado, não há ciclo atual, ponto
  final; o próximo lote de múltiplos treinos importado cria um novo
  (`spec.md`, Edge Cases).
- Nenhum consumidor (`treino-storage.ts`, `index.tsx`, `acoes.tsx`)
  precisa saber dessa mudança — todos continuam chamando
  `obterCicloAtual(uid)` do mesmo jeito, e `null` passa a significar
  também "o ciclo mais recente foi encerrado", além do significado
  original "nenhum ciclo existe ainda" — os dois casos já eram tratados
  de forma idêntica por todo código consumidor (`if (cicloAtual) {...}` /
  `{cicloAtual && progressoCiclo && ...}`), então não há ambiguidade nova
  a resolver nos chamadores.

## `calcularProgressoCiclo(uid, ciclo)` — SEM mudança

Continua somando por `ciclo.treinoIds`, sem considerar se algum desses
treinos está arquivado — sessões de um treino arquivado continuam contando
no total de 40 (`spec.md`, Edge Cases; `research.md`, Decisão 1).

## `encerrarCiclo(uid, cicloId)` — NOVO, FR-007/FR-008/FR-009, SEM leitura

```ts
export function encerrarCiclo(uid: string, cicloId: string): void {
  updateDoc(doc(ciclosCollection(uid), cicloId), { encerradoEm: new Date().toISOString() }).catch((erro) => {
    console.error('[ciclo-treino-storage] Falha ao confirmar encerramento no servidor (já salvo no cache local):', erro);
  });
}
```

- **Sem leitura** (`research.md`, Decisão 4 revisada) — diferente das
  demais funções deste arquivo, que leem `listarCiclos` antes de
  escrever: `encerrarCiclo` recebe `cicloId` direto do chamador (que já
  tem `cicloAtual.id` em memória) e grava só o campo `encerradoEm` via
  `updateDoc`, sem precisar do objeto `CicloTreino` inteiro.
- **Função síncrona, não `async`, sem retorno** — enfileira a escrita no
  mesmo tick da chamada; `.catch` já está dentro da função, chamador não
  precisa (nem deve) encadear o seu próprio.
- **Chamador** (`src/app/acoes.tsx`, novo): busca `obterCicloAtual(uid)`
  ao montar a tela (mesma chamada que `index.tsx` já faz) para decidir se
  mostra/habilita a ação "Encerrar ciclo" (FR-007 — só aparece/fica
  habilitada quando há um ciclo ativo); ao confirmar, chama
  `encerrarCiclo(uid, cicloAtual.id)`.
- **Nenhuma sessão é tocada** por esta função — `encerrarCiclo` só escreve
  o documento do ciclo; histórico, contadores e sessões dos treinos que
  faziam parte dele continuam exatamente como estavam (FR-009).
