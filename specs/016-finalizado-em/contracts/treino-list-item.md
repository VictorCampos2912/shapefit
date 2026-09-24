# Contract: `src/components/treino/treino-list-item.tsx` e `src/app/(tabs)/index.tsx`

**Feature**: `016-finalizado-em`

Contrato interno (props de componente — não há API HTTP nesta feature).

## `TreinoListItem` — props alteradas

```ts
type TreinoListItemProps = {
  treino: Treino;
  dataFinalizacao: string | null;      // NOVO — substitui o uso direto de treino.importadoEm no texto principal
  exibirDataImportacao?: boolean;      // NOVO — substitui nomeDuplicado (removido, ver research.md Decisão 3)
  qtdSessoesFinalizadas?: number;      // sem mudança
  onPress: () => void;
};
```

- **`dataFinalizacao`** (novo): `string | null` (ISO 8601 ou `null`). Quando
  presente, o item exibe `"Finalizado em " + formatarDataHora(dataFinalizacao)`;
  quando `null`, exibe `"Nunca treinado"` (FR-001/FR-002). Substitui o antigo texto
  principal `"Importado em " + formatarDataHora(treino.importadoEm)`.
- **`exibirDataImportacao`** (novo, `boolean`, default `false`): controla
  exclusivamente a exibição da linha secundária
  `"Importado em " + formatarDataHora(treino.importadoEm)` (FR-005/FR-006) — `true`
  apenas quando o treino faz parte do conjunto de colisão calculado por
  `calcularChavesColidindo` (`research.md`, Decisão 2/3; `data-model.md`), ou seja,
  mesmo nome **e** mesmo texto de `dataFinalizacao`/"Nunca treinado" que outro
  treino da lista. **Substitui `nomeDuplicado`, que é removido do componente** —
  nome antigo descrevia um cálculo anterior (`calcularNomesDuplicados`, só
  comparação de nome) que deixou de ser o que este prop representa; manter o nome
  antigo com um significado novo seria uma fonte de confusão para quem for ler ou
  alterar este componente depois, especialmente relevante porque
  `specs/018-progresso-ciclo` também altera `TreinoListItem`/`index.tsx` em breve.

## `src/app/(tabs)/index.tsx` — nova função pura

```ts
function calcularChavesColidindo(
  treinos: Treino[],
  dataFinalizacaoPorTreino: Record<string, string | null>,
): Set<string> {
  const nomesDuplicados = calcularNomesDuplicados(treinos); // já existente
  const grupos = new Map<string, string[]>(); // chave: nome|dataFinalizacao -> ids
  for (const treino of treinos) {
    if (!nomesDuplicados.has(treino.nome)) continue;
    const chave = `${treino.nome}|${dataFinalizacaoPorTreino[treino.id] ?? 'nunca'}`;
    grupos.set(chave, [...(grupos.get(chave) ?? []), treino.id]);
  }
  const colidindo = new Set<string>();
  for (const ids of grupos.values()) {
    if (ids.length > 1) ids.forEach((id) => colidindo.add(id));
  }
  return colidindo;
}
```

- **Pós-condição**: retorna o conjunto de `treino.id` que devem exibir
  `treino.importadoEm` como desempate adicional (FR-005) — apenas quando, dentro do
  mesmo grupo de nome duplicado, dois ou mais treinos também têm a mesma
  `dataFinalizacaoPorTreino` (incluindo o caso de todos serem `null`/"nunca").
- **Consumida por**: o render de `TreinoListItem`, passando
  `exibirDataImportacao={colidindo.has(item.id)}` (era
  `nomeDuplicado={nomesDuplicados.has(item.nome)}` antes desta feature — prop
  renomeado, não só reatribuído, ver `research.md` Decisão 3).
- **`dataFinalizacaoPorTreino`**: carregado em paralelo a `contagensPorTreino` já
  existente (mesmo padrão de `Promise.all` sobre `listarTreinos`, chamando
  `obterDataUltimaSessaoFinalizada` por treino — ver contrato de
  `sessao-treino-storage.md`).
