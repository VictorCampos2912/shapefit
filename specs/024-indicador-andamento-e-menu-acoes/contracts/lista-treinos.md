# Contract: Lista de treinos — indicador de sessão em andamento

**Feature**: `024-indicador-andamento-e-menu-acoes`

Contrato interno (tela + componente de item — não há API HTTP nesta feature).
Altera `src/app/(tabs)/index.tsx` e `src/components/treino/treino-list-item.tsx`;
**não** altera `src/services/sessao-treino-storage.ts` (reaproveita `obterSessao`
já existente, sem assinatura nova).

## `src/app/(tabs)/index.tsx` (alterado) — FR-001/FR-003/FR-004/FR-005

Novo estado, no mesmo formato dos dois já existentes (`contagensPorTreino`,
`dataFinalizacaoPorTreino`):

```ts
const [emAndamentoPorTreino, setEmAndamentoPorTreino] = useState<Record<string, boolean>>({});
```

Nova função irmã de `carregarContagens`/`carregarDatasFinalizacao`
(`index.tsx:70-84`), chamada dentro dos mesmos dois `Promise.all` já existentes
(`recarregarTreinos`, linhas 92-101; `useEffect` inicial, linhas 103-122):

```ts
async function carregarSessoesEmAndamento(uid: string, lista: Treino[]) {
  const entradas = await Promise.all(
    lista.map(async (treino) => [treino.id, (await obterSessao(uid, treino.id)) !== null] as const),
  );
  setEmAndamentoPorTreino(Object.fromEntries(entradas));
}
```

- **Import novo**: `obterSessao` adicionado ao import já existente de
  `@/services/sessao-treino-storage` (hoje só importa `contarSessoesFinalizadas`,
  `obterDataUltimaSessaoFinalizada`).
- **Quando roda**: nos dois mesmos pontos que já recarregam `contagensPorTreino`/
  `dataFinalizacaoPorTreino` hoje — carregamento inicial (`useEffect`) e toda vez que
  a tab ganha foco (`useFocusEffect` já existente, linhas 124-129, sem alteração
  nele) — satisfaz FR-004 sem nenhuma mudança de navegação (research.md, Decisão 3).
- **Passagem para o item da lista** (dentro do `renderItem` do `FlatList`,
  linhas 172-185):

```tsx
<TreinoListItem
  treino={item}
  dataFinalizacao={dataFinalizacaoPorTreino[item.id] ?? null}
  exibirDataImportacao={colidindo.has(item.id)}
  qtdSessoesFinalizadas={contagensPorTreino[item.id] ?? 0}
  progressoCiclo={/* inalterado */}
  emAndamento={emAndamentoPorTreino[item.id] ?? false}
  onPress={() => handleSelecionarTreino(item)}
/>
```

## `src/components/treino/treino-list-item.tsx` (alterado) — FR-001/FR-002/FR-006

- **Prop nova**: `emAndamento?: boolean` (default `false` via `?? false` no uso, ou
  `= false` na desestruturação dos parâmetros — mesma convenção já usada por
  `exibirDataImportacao`/`qtdSessoesFinalizadas`/`progressoCiclo` neste mesmo
  componente).
- **Estilo condicional**, no mesmo `ThemedView` que já envolve o item (hoje fixo em
  `type="backgroundElement"`):

```tsx
<ThemedView
  type={emAndamento ? 'warningBackground' : 'backgroundElement'}
  style={[styles.container, emAndamento && { borderWidth: 2, borderColor: theme.warning }]}
>
```

  (requer obter `theme` via `useTheme()` no topo do componente — hoje não é
  chamado aqui; `ExercicioListItem` já faz exatamente isso.)
- **Texto novo** (research.md, Decisão 5), dentro do mesmo `ThemedView`, antes ou
  depois do texto "Finalizado em"/"Nunca treinado" (ordem exata é detalhe de
  implementação — `tasks.md` decide, sem impacto funcional):

```tsx
{emAndamento && (
  <ThemedText type="smallBold" themeColor="warning">
    Em andamento
  </ThemedText>
)}
```

- **Sem `emAndamento` ou `false`**: nenhuma das duas mudanças acima se aplica — a
  árvore renderizada é byte-a-byte idêntica à anterior a esta feature (FR-002).
- **Coexistência** (FR-006): nenhuma mudança em `ProgressRing`, no texto de
  contagem de sessões, nem no texto "Finalizado em"/"Nunca treinado" — todos
  continuam renderizados exatamente como hoje, ao lado do destaque novo.
