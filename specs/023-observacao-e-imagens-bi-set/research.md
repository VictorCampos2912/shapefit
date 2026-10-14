# Research: Observação por Exercício e Imagem para Exercício Composto (Bi-set)

**Feature**: `023-observacao-e-imagens-bi-set` | **Date**: 2026-10-08

Nenhum `NEEDS CLARIFICATION` pendente do `plan.md` — as decisões abaixo registram
escolhas técnicas dentro do comportamento já definido por `spec.md`, não
resolução de ambiguidade de requisito.

## Decisão 1 — Validação do campo `observacao`

- **Decision**: ausência do campo, `null`, string vazia e string composta só de
  espaços (após `trim()`) são tratadas de forma idêntica — sem observação
  (FR-002). Presente com um valor que não é `string` **nem `null`** é um erro
  de validação por exercício, reaproveitando o mesmo formato de mensagem já
  usado para `categoria` inválida: `` `Exercício ${indice}: campo "observacao"
  inválido` `` (mesmo padrão de `validarExercicio` em
  `treino-storage.ts:91-94`).
- **Rationale**: mantém compatibilidade total com todo arquivo já existente
  (FR-002, mesmo princípio do RF17) e reaproveita um formato de mensagem de erro
  já testado e validado pelo usuário em produção, sem inventar um texto novo.
  Tratar `null` como "ausente" (em vez de erro de tipo) evita descartar
  exercícios de geradores de JSON que preenchem campos opcionais sem valor
  como `null` em vez de omiti-los — um padrão comum e inofensivo, sem motivo
  para ser tratado como dado malformado.
- **Alternatives considered**: tratar string vazia como erro de validação
  (campo "presente mas vazio" sendo inválido) — rejeitado porque o pedido do
  usuário foi explícito ("ausente ou vazia... comportamento idêntico ao
  atual"); isso também evitaria descartar exercícios de um gerador externo de
  JSON que eventualmente emita `"observacao": ""` como valor padrão inofensivo.
  Tratar `null` como erro de tipo (mesmo caminho de número/booleano/lista) —
  rejeitado pelo mesmo motivo: `null` é a forma mais comum de um gerador de
  JSON expressar "sem valor" em um campo opcional, não um erro de dados.

## Decisão 2 — Ponto único de renderização da observação (FR-004)

- **Decision**: renderizar o texto da observação uma única vez dentro de
  `ExercicioExecucao`, fora dos blocos condicionais mutuamente exclusivos de
  estado (`!estado.iniciado`; `estado.iniciado && !estado.concluido &&
  !emDescanso`; `estado.iniciado && !estado.concluido && emDescanso`;
  `estado.concluido`) — logo após o resumo do exercício e a(s) imagem(ns) do
  catálogo (FR-004 original da spec 021, mais a extensão de bi-set desta spec),
  antes de qualquer um desses blocos.
- **Rationale**: como o elemento fica fora de todos os blocos de estado, ele
  aparece "antes de Iniciar exercício" (quando nenhum bloco de estado "iniciado"
  está montado) e "durante as séries" (quando o bloco de registro está montado),
  e também durante o descanso (US3, cenário 2) — sem duplicar JSX. Um único
  ponto de renderização é mais simples e elimina o risco de os dois lugares
  divergirem no futuro (Princípio II).
- **Alternatives considered**: duplicar o texto dentro do bloco
  `!estado.iniciado` e dentro do bloco de registro de série — rejeitado por
  duplicar JSX sem necessidade; o resultado visível seria idêntico ao de um
  único ponto de renderização fora dos blocos.

## Decisão 3 — Layout: campos de registro sempre alcançáveis (FR-007)

- **Decision**: envolver o conteúdo da tela de execução de um exercício (hoje
  renderizado direto dentro do `SafeAreaView`, sem rolagem, em
  `src/app/treino/[treinoId].tsx:384-406`) em um `ScrollView`, reaproveitando o
  padrão já usado em `src/app/conta/dados-fisicos.tsx:44-55`
  (`KeyboardAvoidingView` + `ScrollView contentContainerStyle={...}
  keyboardShouldPersistTaps="handled"`), com dois ajustes específicos a este
  caso (detalhados em `contracts/execucao-treino-screen.md`, item 3):
  `alwaysBounceVertical={false}` (evita o rubber-band do iOS quando o
  conteúdo cabe sem rolar) e `contentContainerStyle` SEM `flexGrow: 1` — ao
  contrário de `dados-fisicos.tsx`, a raiz de `ExercicioExecucao` não depende
  de `flex: 1`/margem automática (investigado diretamente no código), então
  `flexGrow: 1` não teria efeito e foi omitido.
- **Rationale**: inspeção direta do código confirmou que a tela de execução não
  importa `ScrollView` hoje — é uma `View` de altura fixa, então uma observação
  de texto longo (centenas de caracteres, caso real do PDF convertido) pode de
  fato empurrar os campos de registro e o botão "Concluir série" para fora da
  área visível em um aparelho de tela pequena. Reaproveitar um padrão que o
  projeto já usa para o mesmo tipo de problema (formulário que pode ultrapassar
  a altura da tela) resolve o FR-007 sem introduzir nenhum componente ou
  dependência nova (Princípio II/IV).
- **Alternatives considered**: truncar o texto da observação com um controle de
  "ver mais/ver menos" — rejeitado por adicionar um novo estado de interação
  (Princípio II) para resolver um problema que rolagem já resolve de forma mais
  simples, e por risco de esconder justamente a parte mais importante do texto
  (ex.: a instrução da última série de um bi-set, que pode vir no final de um
  texto longo); reduzir dinamicamente o tamanho da fonte da observação conforme
  o comprimento do texto — rejeitado por ser frágil (depende de medir texto em
  tempo de execução) e por quebrar a tipografia já padronizada do app (PRD,
  seção 14).

## Decisão 4 — Omissão real da chave `observacao` no documento Firestore (FR-008)

- **Decision**: construir o objeto `ExercicioPlanejado` (e, por extensão, o
  array `exercicios` dentro do `Treino` persistido) com espalhamento
  condicional — algo no formato de
  `{ ...exercicioBase, ...(observacaoValida ? { observacao: observacaoValida } : {}) }`
  — nunca atribuindo `observacao: undefined` explicitamente a um campo do
  objeto que será passado a `setDoc`/`writeBatch(...).set(...)`.
- **Rationale**: o valor `undefined` em um campo de documento é tratado de
  forma inconsistente entre SDKs e configurações do Firestore (o SDK Web lança
  erro por padrão ao encontrar `undefined`, a menos que
  `ignoreUndefinedProperties` esteja habilitada); o projeto usa o módulo nativo
  `@react-native-firebase/firestore` (não o SDK Web) e não tem essa opção
  habilitada hoje (confirmado por inspeção — nenhuma chamada a
  `initializeFirestore`/configuração de settings em `treino-storage.ts` ou
  `conta-storage.ts`, só `getFirestore()` com configuração padrão). Construir o
  objeto sem a chave presente, em vez de presente com valor `undefined`,
  elimina a ambiguidade na origem — a chave `observacao` só existe no objeto
  JavaScript quando há uma observação válida, então nunca chega a `setDoc`
  como `undefined`.
- **Alternatives considered**: habilitar `ignoreUndefinedProperties` na
  inicialização global do Firestore do app — rejeitado por ser uma mudança de
  comportamento do SDK que afetaria **todas** as escritas do app (ciclo de
  progresso, dados físicos da conta, etc.), não só este campo — escopo maior
  que o pedido, e um jeito mais frágil de garantir o mesmo resultado (depende
  de uma configuração global nunca ser removida/alterada por engano no futuro).

## Decisão 5 — Busca de partes de nome composto como nova função no serviço já existente (FR-010-014)

- **Decision**: adicionar `buscarPartesCompostoNoCatalogo(nomeExercicio:
  string): ExercicioCatalogo[]` ao mesmo arquivo de serviço já criado pela spec
  020 e estendido pela spec 021 (`src/services/catalogo-exercicios.ts`),
  reaproveitando `buscarNoCatalogo` (chamada uma vez por parte extraída) e
  `normalizarNomeExercicio` (RF08) — sem nenhuma lógica de normalização nova.
  Contrato completo em `contracts/catalogo-exercicios.md`.
- **Rationale**: mesma decisão arquitetural já tomada pela spec 021 (função
  nova dentro do serviço já existente, não um arquivo paralelo) — Princípio II;
  mantém toda a lógica de "o que é uma correspondência no catálogo" em um único
  lugar.
- **Alternatives considered**: implementar a remoção do sufixo "(Bi-set)" e a
  separação por " + " diretamente dentro do componente
  `exercicio-execucao.tsx` — rejeitado porque toda a lógica de busca no
  catálogo já vive no serviço (`catalogo-exercicios.ts`); espalhar parte dela
  no componente quebraria essa fronteira sem necessidade e dificultaria testar
  a função isoladamente no futuro, se um framework de testes for adotado.

## Decisão 6 — Legenda usa o nome do item do catálogo, não o texto da parte buscada

- **Decision**: a legenda de cada imagem de parte exibida usa `item.nome`
  (campo do catálogo, `ExercicioCatalogo`, spec 020) — nunca o texto
  normalizado usado como chave de busca, nem o texto literal da parte extraída
  do nome do exercício do treino importado.
- **Rationale**: mesma decisão já tomada pelo `accessibilityLabel` existente na
  spec 021 (usa `correspondencia.nome`, não `exercicio.nome`) — o nome no
  treino importado e o nome no catálogo podem diferir em espaçamento ou
  capitalização (a correspondência é por igualdade após normalização, não
  literal); usar o nome do catálogo mantém a legenda consistente com a fonte da
  própria imagem sendo descrita, e com o que já é feito para o caso de nome
  inteiro.
- **Alternatives considered**: usar o texto da parte como veio do nome do
  exercício do treino, antes de normalizar — rejeitado por poder exibir uma
  legenda com espaçamento/capitalização inconsistente entre exercícios
  diferentes que casam com o mesmo item do catálogo.
