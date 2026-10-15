# Data Model: Indicador de Sessão em Andamento na Lista de Treinos e Remoção do Treino de Exemplo

**Feature**: `024-indicador-andamento-e-menu-acoes` | **Date**: 2026-10-14

Esta feature não cria, altera nem remove nenhum tipo persistido (`Treino`,
`ExercicioPlanejado`, `SessaoTreino`) — só consome dados já existentes para derivar
um estado visual transitório, e remove uma função/asset que não representava uma
entidade de domínio.

## Dado derivado, calculado em tempo de exibição (não persistido)

### "Treino tem sessão em andamento" (novo, só na tela de lista)

Para cada `Treino` (já existente, RF02/RF16) exibido em `(tabs)/index.tsx`:
`obterSessao(uid, treino.id)` (já existente, `sessao-treino-storage.ts:22-25`,
Decisão 2 do `research.md`) retorna a `SessaoTreino` com `finalizadaEm === null`
desse treino, ou `null`. O resultado alimenta um `Record<string, boolean>` em estado
de componente (`treino.id` → tem sessão em andamento), no mesmo formato já usado
pelos dois `Record`s irmãos já existentes (`contagensPorTreino`,
`dataFinalizacaoPorTreino`).

- **Fonte**: `SessaoTreino.finalizadaEm` (já existente, `src/types/execucao-treino.ts`
  via `SessaoRegistro`) — nenhum campo novo.
- **Ciclo de vida**: recalculado a cada `recarregarTreinos()` — no carregamento
  inicial e a cada vez que a lista ganha foco (`useFocusEffect` já existente,
  Decisão 3 do `research.md`). Nunca persistido, nunca cacheado entre exibições.
- **Cardinalidade**: zero ou mais treinos podem estar `true` ao mesmo tempo
  (FR-003) — não há limite nem exclusividade entre eles.
- **Chave de identificação**: `treino.id` (identificador interno), nunca
  `treino.nome` — preserva a distinção entre treinos homônimos já garantida por
  RF02/RF16 (FR-007).

### `TreinoListItem` — prop visual nova (não é dado persistido)

`src/components/treino/treino-list-item.tsx` ganha uma prop:

```ts
type TreinoListItemProps = {
  treino: Treino;
  dataFinalizacao: string | null;
  exibirDataImportacao?: boolean;
  qtdSessoesFinalizadas?: number;
  progressoCiclo?: number | null;
  emAndamento?: boolean; // NOVO
  onPress: () => void;
};
```

- **Efeito visual** (quando `true`): mesmo par `ThemedView type="warningBackground"`
  + `borderWidth`/`borderColor: theme.warning` já usado por `ExercicioListItem` para
  o estado `'pausado'` (Decisão 1 do `research.md`), mais um texto curto em destaque
  (Decisão 5) — nenhum estilo novo, nenhum componente novo.
- **Quando ausente/`false`** (default): comportamento idêntico ao de hoje — item sem
  nenhuma alteração visual (FR-002).
- **Coexistência**: não substitui nem oculta `ProgressRing` (RF15),
  `qtdSessoesFinalizadas` ou o texto "Finalizado em"/"Nunca treinado" (RF16) — todos
  continuam renderizados normalmente junto com o destaque (FR-006).

## Entidade removida (conceito de produto, não tipo de dado)

### Ação de menu "Importar treino de exemplo"

Não era um tipo de dado — era uma ação de UI (`Pressable` em `acoes.tsx`) que
chamava `importarTreinoExemplo(uid)`, que por sua vez chamava a mesma função de
persistência (`processarConteudo`) já usada por `importarTreino`, com o conteúdo do
asset `assets/exemplos/treino-exemplo.json` em vez do arquivo escolhido pelo
usuário. Removida a função e o asset (Decisão 4 do `research.md`), nenhuma entidade
de domínio (`Treino`, `ExercicioPlanejado`) muda — um treino importado por esta ação,
no passado, já ficou gravado como um `Treino` comum, indistinguível de um importado
pelo seletor de arquivo; esta feature não precisa (e não deve) alterar nenhum treino
já existente.

## Relação com entidades já existentes

- **`Treino`** (RF01/RF02/RF11, `src/types/treino.ts`): consumido sem mudança de
  schema — a feature só lê `treino.id` para a derivação acima.
- **`SessaoTreino`** (RF04/RF07, `src/types/execucao-treino.ts`): consumido
  somente em leitura, via a função já existente `obterSessao`; nenhum campo novo,
  nenhuma escrita nova.
