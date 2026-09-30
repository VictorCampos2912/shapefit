# Contract: `src/services/treino-storage.ts` — migração de RF01/RF02 para Firestore

**Feature**: `022-autenticacao-google-firestore-treinos`

Este contrato cobre só a mudança de backend das funções já existentes de
importação (RF01) e listagem (RF02) — assinaturas e comportamento observável
MUST permanecer idênticos (FR-010); só a implementação interna troca
`AsyncStorage` por `@react-native-firebase/firestore`.

## `listarTreinos`

```ts
export async function listarTreinos(uid: string): Promise<Treino[]>
```

- **Antes**: lia `AsyncStorage.getItem('treinos:' + perfilId)`.
- **Depois**: lê a coleção `users/{uid}/treinos` do Firestore (`uid` no lugar do
  parâmetro `perfilId` — mesmo tipo, `string`, sem mudança de assinatura visível
  além do nome do parâmetro).
- **Offline (FR-011)**: usa a persistência offline nativa do SDK
  (`@react-native-firebase/firestore`, `research.md` Decisão 1) — uma leitura
  offline retorna os dados do último cache sincronizado, sem exigir rede; a
  normalização de `categoria` ausente (bug fix já existente do RF17, "trata como
  'peso'") continua aplicada do mesmo jeito, sobre os dados vindos do Firestore
  em vez de sobre os dados vindos do AsyncStorage.

## `importarTreino` / `importarTreinoExemplo`

```ts
export async function importarTreino(uid: string): Promise<ResultadoImportacao | ResultadoImportacaoMultipla>
export async function importarTreinoExemplo(uid: string): Promise<ResultadoImportacao | ResultadoImportacaoMultipla>
```

- **Antes**: validava o arquivo (sem mudança nesta feature) e persistia o
  resultado em `AsyncStorage`.
- **Depois**: mesma validação (RF01/RF05-RF11 de `002-importar-treino-json` e
  `012-importar-multiplos-treinos`, sem alteração), mas o(s) `Treino` válido(s)
  são escritos como documentos em `users/{uid}/treinos/{treinoId}` no Firestore.
- **Offline (FR-011)**: uma importação feita offline MUST ser aceita
  normalmente (mesma mensagem de sucesso) e sincronizada automaticamente quando a
  rede voltar — comportamento padrão da fila de escrita offline do SDK nativo do
  Firestore, sem código adicional do app para gerenciar a fila.
- **Mensagens (FR-010)**: `ResultadoImportacao`/`ResultadoImportacaoMultipla` e
  todas as mensagens derivadas deles (`src/app/acoes.tsx`,
  `exibirResultadoImportacao*`) permanecem sem alteração — este contrato não
  muda nada visível ao usuário, só onde o dado válido é persistido.

## Campo removido do tipo `Treino`

- `perfilId` (`src/types/treino.ts`) deixa de ser gravado/lido como campo do
  documento — a segregação por conta passa a ser o próprio caminho
  `users/{uid}/treinos/*` (ver `data-model.md`). Qualquer código que hoje lê
  `treino.perfilId` MUST ser ajustado para não depender mais desse campo
  (varredura confirmou: nenhum código em `src/` lê `.perfilId` via acesso a
  propriedade — só o tipo declara o campo e um único ponto o constrói, abaixo).

## Ponto de construção afetado: `montarTreinoValido` (função pura)

`src/services/treino-storage.ts:127-157` (`montarTreinoValido`) é o **único**
lugar do repositório que monta um literal `Treino` (confirmado via
`grep -rn "perfilId:" src/`) — hoje recebe `perfilId: string` como segundo
parâmetro só para gravá-lo no objeto (`const treino: Treino = { id, perfilId,
nome, exercicios, importadoEm }`, linha 151). Esta função é explicitamente
documentada como pura ("não lê nem escreve AsyncStorage") e não usa `perfilId`
para mais nada dentro do corpo. Ao remover o campo do tipo `Treino`, esta
função MUST perder o parâmetro `perfilId` inteiramente (não renomear para
`uid` — remover), já que não sobra nenhum uso para ele. Os chamadores
(`processarConteudoObjeto`, `processarConteudoArray`) continuam recebendo
`uid` normalmente, só não repassam mais esse valor para `montarTreinoValido`.

## Consumida por

- `src/app/acoes.tsx` (import), telas de listagem de treinos (RF02) — sem
  mudança de import/uso além de passar `uid` em vez de `perfilId` como
  argumento.
