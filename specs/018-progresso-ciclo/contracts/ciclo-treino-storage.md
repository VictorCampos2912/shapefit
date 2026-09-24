# Contract: `src/services/ciclo-treino-storage.ts` (novo)

**Feature**: `018-progresso-ciclo`

Contrato interno (serviço novo — não há API HTTP nesta feature).

## `obterCicloAtual`

```ts
export async function obterCicloAtual(perfilId: string): Promise<CicloTreino | null> {
  const ciclos = await getCiclos(perfilId); // lê `ciclos:<perfilId>`
  return ciclos.length > 0 ? ciclos[ciclos.length - 1] : null;
}
```

- **Pós-condição**: retorna o último `CicloTreino` criado para o perfil, ou `null`
  se o perfil nunca importou um lote de múltiplos treinos.

## `calcularProgressoCiclo`

```ts
export async function calcularProgressoCiclo(
  perfilId: string,
  ciclo: CicloTreino,
): Promise<{ totalFinalizado: number; porTreino: Record<string, number> }> {
  const porTreino: Record<string, number> = {};
  let totalFinalizado = 0;
  for (const treinoId of ciclo.treinoIds) {
    const contagem = await contarSessoesFinalizadas(perfilId, treinoId); // já existe, RF11
    porTreino[treinoId] = contagem;
    totalFinalizado += contagem;
  }
  return { totalFinalizado, porTreino };
}
```

- **Pré-condição**: `ciclo.perfilId === perfilId` (chamador é responsável por passar
  o ciclo do perfil correto — mesma disciplina já usada pelas demais funções destes
  serviços, que não revalidam `perfilId` internamente).
- **Pós-condição**: `totalFinalizado` é a soma de sessões finalizadas de todos os
  treinos do lote (pode ultrapassar 40, FR-008); `porTreino` tem uma entrada por
  `treinoId` do ciclo.
- **Sem cache**: recalculado a cada chamada, a partir de `sessoes:<perfilId>` —
  mesmo padrão de `contarSessoesFinalizadas`/`listarSessoesFinalizadas` já existentes.

## `criarCiclo`

```ts
export async function criarCiclo(perfilId: string, treinoIds: string[]): Promise<CicloTreino> {
  const ciclo: CicloTreino = {
    id: Crypto.randomUUID(),
    perfilId,
    treinoIds,
    cotaPorTreinoId: calcularCotaPorTreino(treinoIds), // research.md, Decisão 4
    criadoEm: new Date().toISOString(),
  };
  const ciclos = await getCiclos(perfilId);
  await setCiclos(perfilId, [...ciclos, ciclo]); // append-only, research.md Decisão 2
  return ciclo;
}
```

- **Pré-condição**: `treinoIds.length >= 2` (chamador — `treino-storage.ts` — só
  chama esta função quando a Decisão 5 do `research.md` já determinou que um ciclo
  deve ser criado).
- **Pós-condição**: novo `CicloTreino` criado e persistido como o novo último
  elemento de `ciclos:<perfilId>` — torna-se o "ciclo atual" (FR-001/FR-009).
- **Isolamento por perfil (Princípio V)**: opera exclusivamente sobre
  `ciclos:<perfilId>` do `perfilId` informado.

## `cotaComoFracao` (helper de UI, não persistido)

```ts
export function cotaComoFracao(sessoesFinalizadas: number, cota: number): number {
  if (cota <= 0) return 0;
  return Math.min(1, sessoesFinalizadas / cota);
}
```

- Converte a contagem individual de um treino (de `porTreino`) e sua
  `cotaPorTreinoId` em uma fração 0-1 para o prop `progress` do `ProgressRing` —
  satura em 1 quando o treino já ultrapassou sua cota individual (Edge Case da spec:
  execuções extras continuam contando para o total do ciclo, mas o anel daquele
  treino específico não passa de 100% visualmente).
