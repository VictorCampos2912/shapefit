# Contract: `src/services/treino-storage.ts` (`processarConteudoArray` alterado)

**Feature**: `018-progresso-ciclo`

Contrato interno (função de serviço já existente, alterada — não há API HTTP nesta
feature).

## `processarConteudoArray` — comportamento novo

```ts
async function processarConteudoArray(bruto: unknown[], perfilId: string): Promise<ResultadoImportacaoMultipla> {
  if (bruto.length === 0) {
    return { treinos: [], treinosIgnorados: [], erro: 'O arquivo não contém nenhum treino.' };
  }

  // NOVO (FR-007): bloqueio por ciclo em andamento, antes de qualquer validação.
  if (bruto.length >= 2) {
    const cicloAtual = await obterCicloAtual(perfilId);
    if (cicloAtual) {
      const { totalFinalizado } = await calcularProgressoCiclo(perfilId, cicloAtual);
      if (totalFinalizado < 40) {
        return {
          treinos: [],
          treinosIgnorados: [],
          erro: 'Já existe um ciclo de treinos em andamento. Finalize as 40 sessões esperadas antes de importar um novo lote de múltiplos treinos.',
        };
      }
    }
  }

  // ... validação/persistência de treinos, sem mudança (código já existente) ...

  // NOVO (FR-001, condicionado à Decisão 5): criar o ciclo só se 2+ treinos validaram.
  if (treinos.length >= 2) {
    await criarCiclo(perfilId, treinos.map((item) => item.treino.id));
  }

  return { treinos, treinosIgnorados, erro: null };
}
```

- **Pré-condição do bloqueio**: `bruto.length >= 2` (tamanho bruto do array, antes de
  validar) — ver `research.md`, Decisão 6, para o porquê de não esperar a validação.
- **Pós-condição do bloqueio**: quando bloqueado, `treinos: []` e
  `treinosIgnorados: []` — nenhum treino do arquivo é persistido, mesmo os que
  seriam válidos (tudo ou nada).
- **Pós-condição da criação de ciclo**: só ocorre depois que os treinos já foram
  persistidos com sucesso (`setTreinosState` já chamado); usa os `id`s dos treinos
  recém-criados, na mesma ordem em que aparecem no array validado.
- **Sem mudança de assinatura**: `processarConteudoArray` continua retornando
  `ResultadoImportacaoMultipla` — nenhum campo novo no tipo de retorno; o bloqueio é
  comunicado através do campo `erro` já existente.
- **`processarConteudoObjeto`** (caminho de treino único, RF01): **sem nenhuma
  mudança** — nunca interage com ciclos (FR-004).
- **Novos imports** em `treino-storage.ts`: `obterCicloAtual`, `calcularProgressoCiclo`,
  `criarCiclo` de `@/services/ciclo-treino-storage`.
