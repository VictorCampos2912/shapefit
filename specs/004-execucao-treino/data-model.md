# Data Model: Tela de Execução do Treino

Esta feature não introduz nenhuma nova entidade persistida nem altera o schema existente
de `Treino`/`ExercicioPlanejado` (definidos em `src/types/treino.ts`, RF01). As entidades
abaixo descrevem apenas o modelo de **estado em memória** desta tela, usado unicamente
durante a navegação dentro dela — nada aqui é gravado em `AsyncStorage` por esta feature.

## Entidades existentes (reaproveitadas, sem alteração)

### Treino
Já definida em `src/types/treino.ts`. Consumida apenas para leitura nesta feature.

| Campo | Tipo | Uso nesta feature |
|---|---|---|
| `id` | `string` | usado como `treinoId` na rota |
| `perfilId` | `string` | não lido diretamente aqui; o filtro por perfil já ocorreu em `listarTreinos` |
| `nome` | `string` | exibido como título da tela |
| `exercicios` | `ExercicioPlanejado[]` | fonte da lista de exercícios exibida |
| `importadoEm` | `string` | não usado nesta tela |

### ExercicioPlanejado
Já definida em `src/types/treino.ts`. Consumida apenas para leitura/exibição e
pré-preenchimento.

| Campo | Tipo | Uso nesta feature |
|---|---|---|
| `id` | `string` | identifica o exercício selecionado |
| `nome` | `string` | exibido na lista e no cabeçalho da execução |
| `series` | `number` | total de séries — usado no indicador "Série X de `series`" |
| `repsAlvo` | `string` | exibido como dado planejado (não valida o campo de reps digitado) |
| `cargaSugeridaKg` | `number` | usado para pré-preencher o campo de carga da série atual |
| `descansoSeg` | `number` | exibido como dado planejado (não aciona cronômetro nesta feature) |

## Novas estruturas (estado local de UI, não persistido)

### EstadoExecucaoExercicio

Representa o progresso de **um** exercício do treino. Existe uma instância por exercício
que já foi aberto ao menos uma vez nesta sessão de tela — não apenas para o exercício
atualmente em foco. Isso é necessário porque a navegação entre exercícios não é sequencial
(US2): o usuário pode iniciar o exercício A, voltar para a lista, abrir o exercício B, e
depois voltar para A — nesse momento A MUST continuar exibindo seu progresso (iniciado,
série atual, campos preenchidos), e não reiniciar do zero. Todas as instâncias vivem em
memória, dentro de `EstadoTelaExecucao` (ver abaixo); nenhuma é persistida em
`AsyncStorage` nesta feature (research.md, Decisão 3) — fechar a rota/tela descarta tudo.

| Campo | Tipo | Descrição |
|---|---|---|
| `exercicioId` | `string` | id do `ExercicioPlanejado` a que esta instância pertence |
| `iniciado` | `boolean` | `false` até o usuário tocar em "Iniciar exercício"; controla a exibição do botão vs. dos campos de registro. Na lista de exercícios (fora da tela de detalhe), `iniciado === true` é exibido como "pausado" (FR-014) — o app não executa dois exercícios simultaneamente; apenas o exercício atualmente aberto (`exercicioSelecionadoId`) está de fato "em andamento" |
| `serieAtual` | `number` | 1-indexado; começa em `1` ao iniciar o exercício; usado no indicador "Série X de Y" |
| `cargaKg` | `string \| number` | valor do campo de carga da série atual; inicializado com `cargaSugeridaKg` do exercício ao iniciar/avançar de série; aceita apenas dígitos e um separador decimal |
| `repsFeitas` | `string \| number` | valor do campo de repetições feitas da série atual; inicializado vazio |

**Regras de validação** (aplicadas na UI, não no storage):
- `cargaKg` MUST aceitar apenas valores numéricos com casas decimais (ex: `42.5`);
  entradas não numéricas são rejeitadas na digitação (FR-010).
- `repsFeitas` MUST aceitar apenas números inteiros não negativos (ver Assumption da spec).
- `serieAtual` MUST estar sempre no intervalo `[1, series]` do `ExercicioPlanejado`
  correspondente.

**Transições de estado** (dentro do escopo desta feature — avançar de série/concluir
exercício é RF04, fora de escopo):
1. Exercício sem instância em `estadosPorExercicio` (nunca aberto) → usuário toca no item
   na lista → cria-se a instância implícita `{ exercicioId, iniciado: false, serieAtual: 1,
   cargaKg: '', repsFeitas: '' }` (ou equivalente), exibindo o botão "Iniciar exercício".
2. Instância com `iniciado: false` → usuário toca em "Iniciar exercício" → atualiza-se
   **essa mesma instância** (por `exercicioId`) dentro de `estadosPorExercicio` para
   `iniciado = true`, `serieAtual = 1`, `cargaKg = cargaSugeridaKg`, `repsFeitas = ''`.
3. Usuário edita `cargaKg` e/ou `repsFeitas` livremente enquanto a série 1 está em
   andamento → atualiza-se apenas a instância do exercício atualmente selecionado dentro de
   `estadosPorExercicio` (sem afetar as instâncias de outros exercícios).
4. Usuário volta para a lista e reabre um exercício com instância existente → a instância
   já registrada é reutilizada tal como estava (nenhum campo é resetado), preservando
   `iniciado`, `serieAtual`, `cargaKg` e `repsFeitas`.
5. Usuário volta para a lista com um exercício `iniciado` e abre outro exercício (com ou
   sem instância prévia) → o app **não** trata isso como dois exercícios em execução
   simultânea: o exercício anteriormente aberto passa a ser exibido como "pausado" na lista
   (sua instância permanece com `iniciado: true`, apenas deixa de ser
   `exercicioSelecionadoId`), e o novo exercício selecionado é o único considerado "em
   andamento" a qualquer momento. Retomar o exercício pausado (Transição 4) o traz de volta
   ao estado "em andamento", sem perda de progresso.
6. Qualquer transição para além da série 1 (concluir série, avançar, concluir exercício) é
   fora de escopo desta feature (RF04).

### EstadoTelaExecucao (nível da rota)

| Campo | Tipo | Descrição |
|---|---|---|
| `treino` | `Treino \| null` | carregado ao montar a rota via `listarTreinos` + busca por `id`; `null` durante o carregamento |
| `exercicioSelecionadoId` | `string \| null` | `null` quando a lista de exercícios está sendo exibida; preenchido ao tocar em um exercício, revelando a instância de `EstadoExecucaoExercicio` correspondente em `estadosPorExercicio` |
| `estadosPorExercicio` | `Record<string, EstadoExecucaoExercicio>` | mapa de `exercicioId` → progresso daquele exercício; uma entrada é criada na primeira vez que o exercício é aberto (ver Transição 1) e atualizada nas transições seguintes; **é a fonte de verdade única do progresso de cada exercício durante a sessão da tela**, permitindo que `ExercicioListItem` (US6/FR-014) e a reabertura de um exercício já iniciado (US2) reflitam o estado correto mesmo após o usuário navegar para outro exercício e voltar |

**Nota de propriedade do estado**: por depender de mais de um exercício simultaneamente
(a lista inteira, para fins de estado visual — FR-014), `estadosPorExercicio` MUST viver no
componente da rota (`src/app/treino/[treinoId].tsx`), não isolado dentro de
`ExercicioExecucao`. `ExercicioExecucao` recebe a instância do exercício selecionado (e um
callback de atualização) via props, em vez de manter seu próprio estado interno
desacoplado do restante da tela.

Nenhuma outra entidade é necessária para esta feature.
