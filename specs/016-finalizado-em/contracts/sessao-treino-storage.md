# Contract: `src/services/sessao-treino-storage.ts`

**Feature**: `016-finalizado-em`

Contrato interno (função de serviço — não há API HTTP nesta feature).

## Nova função: `obterDataUltimaSessaoFinalizada`

```ts
export async function obterDataUltimaSessaoFinalizada(
  perfilId: string,
  treinoId: string,
): Promise<string | null> {
  const sessoes = await getSessoes(perfilId);
  const finalizadas = sessoes.filter(
    (sessao) => sessao.treinoId === treinoId && sessao.finalizadaEm !== null,
  );
  if (finalizadas.length === 0) {
    return null;
  }
  return finalizadas.reduce((maisRecente, atual) =>
    atual.finalizadaEm! > maisRecente.finalizadaEm! ? atual : maisRecente,
  ).finalizadaEm;
}
```

- **Pré-condição**: nenhuma — funciona mesmo se o treino nunca teve sessão nenhuma
  (retorna `null`).
- **Pós-condição**: retorna o `finalizadaEm` (ISO 8601) da sessão finalizada mais
  recente do treino informado, dentre as do `perfilId` informado; `null` se nenhuma
  sessão finalizada existir para esse treino.
- **Isolamento por perfil (Princípio V)**: filtra exclusivamente sobre
  `getSessoes(perfilId)`, mesma função interna já usada por toda leitura de sessão
  neste arquivo — nenhuma leitura cross-perfil possível.
- **Consumida por**: `src/app/(tabs)/index.tsx` (FR-001/FR-002), uma vez por treino
  exibido na lista.
- **Sem mudança de assinatura** em nenhuma função já exportada deste arquivo.
