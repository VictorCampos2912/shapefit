# Contract: `src/services/sessao-treino-storage.ts` (alterado — ganha um helper sem leitura)

**Feature**: `026-arquivamento-treinos-ciclo`

Nenhuma função existente muda de assinatura ou de comportamento.
**Única mudança**: um helper novo, `finalizarSessaoPorId`, que finaliza
uma sessão **sem ler nada antes** — reaproveitado pelo `writeBatch` de
`arquivarTreino` (`contracts/treino-storage.md`) e pela ação de
"finalizar sessão em andamento" (`contracts/lista-treinos-e-historico.md`,
FR-011). `sessoesCollection` **continua módulo-privada** — não precisa ser
exportada (correção em relação a uma versão anterior deste contrato;
`finalizarSessaoPorId` é o único ponto deste arquivo que outros módulos
precisam, não o path-builder em si).

## `finalizarSessaoPorId(uid, sessaoId, lote?)` — NOVO, sem leitura

```ts
export function finalizarSessaoPorId(uid: string, sessaoId: string, lote?: WriteBatch): void {
  const dados = { finalizadaEm: new Date().toISOString() };
  const referencia = doc(sessoesCollection(uid), sessaoId);
  if (lote) {
    lote.update(referencia, dados);
    return;
  }
  updateDoc(referencia, dados).catch((erro) => {
    console.error('[sessao-treino-storage] Falha ao confirmar finalização no servidor (já salva no cache local):', erro);
  });
}
```

- **Por que é seguro escrever só `finalizadaEm`**: inspeção de
  `finalizarSessao` (já existente, spec 025) confirma que ela só muta
  esse campo (`sessao.finalizadaEm = new Date().toISOString()`) antes de
  regravar a sessão inteira via `setDocSessao` — nenhum outro campo é
  tocado. `finalizarSessaoPorId` grava exatamente o mesmo efeito, só sem
  precisar ler a sessão inteira primeiro.
- **`updateDoc`/`WriteBatch.update` confirmados na versão instalada do
  SDK** (`node_modules/@react-native-firebase/firestore/dist/typescript/
  lib/modular.d.ts`, `.../lib/FirestoreWriteBatch.d.ts`) — gravam só os
  campos passados, sem ler o documento antes.
- **Parâmetro `lote` opcional**: quando passado (de dentro de
  `arquivarTreino`), a operação é **enfileirada no batch do chamador**,
  não comitada aqui — o `commit()` e o `.catch` de erro ficam por conta
  de quem criou o `writeBatch` (`treino-storage.ts`). Quando omitido
  (chamada avulsa, ex.: "finalizar sessão em andamento" em `index.tsx`),
  a própria função faz `updateDoc` e cuida do `.catch`.
- **Sem guarda de idempotência** (não checa se `finalizadaEm` já estava
  preenchido antes de sobrescrever) — aceitável: os dois chamadores só
  invocam esta função quando já sabem, pelo próprio estado local
  (`sessaoAtualId` em `[treinoId].tsx`, `sessaoEmAndamentoIdPorTreino` em
  `index.tsx`), que a sessão está em andamento; não é um ponto de entrada
  genérico que outro código possa chamar "só por garantia".
- **`finalizarSessao` (spec 025) não muda** — continua existindo, ainda
  usada pelo fluxo manual de "Finalizar treino" em `[treinoId].tsx`
  (`handleFinalizarTreino`), que não foi tocado por esta spec.
