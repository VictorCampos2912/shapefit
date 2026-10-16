# Contract: `src/services/ciclo-treino-storage.ts` (alterado)

**Feature**: `025-migracao-sessoes-historico-ciclo`

Migra de AsyncStorage (`ciclos:<uid>`, um array) para Firestore
(`users/{uid}/ciclos/{cicloId}`, um documento por ciclo). As 4 funções
exportadas **mantêm nome, assinatura e retorno de hoje** (research.md,
Decisão 1); `cotaComoFracao` (função pura, sem storage) não é tocada.

## Primitivas internas (novas)

```ts
function ciclosCollection(uid: string) {
  return collection(getFirestore(), 'users', uid, 'ciclos');
}

function setDocCiclo(uid: string, ciclo: CicloTreino): void {
  // sem await (research.md, Decisão 4)
  setDoc(doc(ciclosCollection(uid), ciclo.id), ciclo).catch((erro) => {
    console.error('[ciclo-treino-storage] Falha ao confirmar ciclo no servidor (já salvo no cache local):', erro);
  });
}

async function listarCiclos(uid: string): Promise<CicloTreino[]> {
  const snapshot = await getDocs(ciclosCollection(uid));
  const ciclos = snapshot.docs.map((d) => d.data() as CicloTreino);
  return ciclos.sort((a, b) => {
    if (a.criadoEm !== b.criadoEm) {
      return a.criadoEm < b.criadoEm ? -1 : 1;
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}
```

## `criarCiclo(uid, treinoIds)` — FR-014, sem mudança de assinatura

Mesma lógica de hoje (gera `id`, calcula `cotaPorTreinoId` via
`calcularCotaPorTreino`, já pura e inalterada); termina com
`setDocCiclo(uid, ciclo)` em vez de reescrever o array inteiro.

## `obterCicloAtual(uid)` — sem mudança de assinatura

```ts
export async function obterCicloAtual(uid: string): Promise<CicloTreino | null> {
  const ciclos = await listarCiclos(uid);
  return ciclos.length > 0 ? ciclos[ciclos.length - 1] : null;
}
```

Mesma semântica de hoje ("ciclo atual" = último criado, `criadoEm` mais
recente) — só troca `getCiclos` (AsyncStorage) por `listarCiclos`
(Firestore).

## `calcularProgressoCiclo(uid, ciclo)` — FR-014/FR-015, sem mudança de assinatura, implementação interna muda (research.md, Decisão 7)

```ts
export async function calcularProgressoCiclo(
  uid: string,
  ciclo: CicloTreino,
): Promise<{ totalFinalizado: number; porTreino: Record<string, number> }> {
  const sessoes = await listarSessoes(uid); // import de sessao-treino-storage.ts
  const porTreino: Record<string, number> = {};
  let totalFinalizado = 0;
  for (const treinoId of ciclo.treinoIds) {
    const contagem = sessoes.filter((s) => s.treinoId === treinoId && s.finalizadaEm !== null).length;
    porTreino[treinoId] = contagem;
    totalFinalizado += contagem;
  }
  return { totalFinalizado, porTreino };
}
```

- **Antes**: um `for` que chamava `contarSessoesFinalizadas(uid, treinoId)`
  — uma leitura Firestore por treino do ciclo (até 20+ num lote grande).
- **Depois**: uma única chamada a `listarSessoes(uid)`, contagem em memória
  por `treinoId` dentro do array já obtido — 1 leitura, independente do
  número de treinos no ciclo.
- **Import novo**: `listarSessoes` de `@/services/sessao-treino-storage` —
  já existia uma dependência de `ciclo-treino-storage.ts` em
  `sessao-treino-storage.ts` hoje (`contarSessoesFinalizadas`), então não é
  uma dependência nova entre módulos, só troca de qual função é importada.
- **Confirmado por `grep` (sem import circular)**: `sessao-treino-storage.ts`
  não importa nada de `ciclo-treino-storage.ts` hoje
  (`grep -n "ciclo-treino-storage" src/services/sessao-treino-storage.ts`
  não retorna nenhuma linha) e esta spec não adiciona nenhum import nesse
  sentido. A dependência entre os dois serviços é **só de uma via**:
  `ciclo-treino-storage.ts` → `sessao-treino-storage.ts` (via
  `contarSessoesFinalizadas` hoje, via `listarSessoes` depois desta spec) —
  nunca o contrário. Sem risco de import circular.

## Consumidores (sem mudança de código, só de comportamento interno)

- `src/services/treino-storage.ts` (`processarConteudoArray`): continua
  chamando `obterCicloAtual`/`calcularProgressoCiclo`/`criarCiclo`
  exatamente como hoje.
- `src/app/(tabs)/index.tsx` (`carregarCicloAtual`): continua chamando
  `obterCicloAtual`/`calcularProgressoCiclo` exatamente como hoje;
  `cotaComoFracao` não muda.
