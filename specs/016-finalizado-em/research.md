# Phase 0 Research: "Finalizado em" na Lista de Treinos

**Feature**: `016-finalizado-em` | **Date**: 2026-09-23

Sem `[NEEDS CLARIFICATION]` pendente — todas as decisões de produto já foram tomadas
na spec (incluindo o critério de desempate de homônimos, FR-005/FR-006). Esta fase
cobre apenas decisões técnicas de implementação.

## Decisão 1: nova função de leitura em `sessao-treino-storage.ts`

**Decision**: adicionar `obterDataUltimaSessaoFinalizada(perfilId, treinoId): Promise<string | null>`,
retornando o `finalizadaEm` (ISO 8601) da sessão finalizada mais recente daquele
treino, ou `null` se não houver nenhuma.

**Rationale**: mesmo padrão já usado por `contarSessoesFinalizadas` e
`listarSessoesFinalizadas` (ambas em `sessao-treino-storage.ts`) — uma função de
leitura pura, filtrando por `treinoId` e `finalizadaEm !== null`, sem introduzir
nenhum novo local de armazenamento (Key Entities da spec já define isso como dado
derivado). Reaproveita a mesma lógica de "pegar o mais recente por `finalizadaEm`" já
implementada em `obterUltimaSessaoConcluidaNaoRevisada` (spec 013).

**Alternatives considered**:
- Calcular a data mais recente dentro do componente `index.tsx`, iterando sobre
  `listarSessoesFinalizadas` já existente — rejeitado: essa função retorna sessões de
  **todos** os treinos do perfil misturadas, exigindo filtrar e reduzir no componente
  para cada treino da lista (uma iteração aninhada por item renderizado); mais simples
  e mais consistente com o padrão já usado (uma função de serviço por necessidade de
  leitura) ter uma função dedicada.

## Decisão 2: onde calcular o critério de desempate (FR-005)

**Decision**: dentro de `src/app/(tabs)/index.tsx`, ao lado da função já existente
`calcularNomesDuplicados` — uma nova função pura `calcularChavesColidindo(treinos,
datasPorTreino)` que, para os treinos que já colidem por nome (reaproveita
`calcularNomesDuplicados`), verifica se o texto "Finalizado em `<data>`"/"Nunca
treinado" também colidiria entre eles; retorna o subconjunto de `treino.id` que deve
exibir a data de importação como desempate adicional (FR-005).

**Rationale**: `calcularNomesDuplicados` já resolve o primeiro filtro (mesmo nome);
FR-005 só precisa de um filtro adicional em cima desse subconjunto (mesmo texto de
"Finalizado em"), não uma lógica nova do zero — mesmo estilo de função pura e
sem-estado já usado no arquivo.

**Alternatives considered**:
- Mover toda a lógica de desempate para dentro de `TreinoListItem` (cada item decide
  sozinho se deve mostrar a data de importação) — rejeitado: um item isolado não tem
  acesso à lista completa de treinos para saber se colide com outro; a decisão
  **tem** que ser tomada no componente pai (`index.tsx`), que já é quem calcula
  `nomeDuplicado` hoje.

## Decisão 3: `TreinoListItem` ganha dois props novos — sem reaproveitar `nomeDuplicado`

**Decision**: o componente `TreinoListItem` passa a receber `dataFinalizacao: string |
null` (substitui o uso direto de `treino.importadoEm` no texto principal) e um prop
novo, **`exibirDataImportacao: boolean`**, que controla exclusivamente se a linha
secundária de desempate (`treino.importadoEm`) aparece (FR-005/FR-006). O prop
`nomeDuplicado` é **removido** do componente — não existe mais.

**Rationale**: `nomeDuplicado` como nome deixou de descrever o que o prop realmente
controla assim que passou a ser alimentado por `calcularChavesColidindo` (Decisão 2)
em vez de `calcularNomesDuplicados` — o valor recebido não é mais "este treino tem
nome duplicado", é "este treino deve mostrar a data de importação como desempate".
Manter o nome antigo com significado novo é uma armadilha para quem for ler o
componente depois sem o contexto desta spec (ex.: alguém poderia legitimamente supor
que `nomeDuplicado={true}` implica nome duplicado, quando na verdade também exige
colisão de `dataFinalizacao`). **Correção de 2026-09-23** (revisão pós-plan, antes da
implementação): a primeira versão desta decisão tentou reaproveitar `nomeDuplicado`
por "menor mudança na assinatura" — revertida porque o ganho de token é pequeno e o
custo de clareza é real, especialmente porque `specs/018-progresso-ciclo` também vai
alterar `TreinoListItem`/`index.tsx` em breve (adicionando um `ProgressRing` por
treino) — um prop mal nomeado nesse componente compartilhado aumenta o risco de
confusão entre as duas specs.

**Alternatives considered**:
- Manter `nomeDuplicado` e só reinterpretar seu significado (decisão original,
  revertida) — rejeitado após revisão: nome tecnicamente incorreto para o valor que
  passa a representar, sem nenhuma economia real (é a mesma quantidade de código
  trocar o nome do prop em todos os pontos que já seriam tocados de qualquer forma).
- Introduzir `exibirDataImportacao` como um prop **a mais**, mantendo `nomeDuplicado`
  também (os dois coexistindo) — rejeitado: `nomeDuplicado` sozinho nunca é
  suficiente para decidir a exibição (falta o desempate por `dataFinalizacao`), então
  mantê-lo como prop separado só criaria um campo morto/confuso no componente.

## Decisão 4: exibição de `importadoEm` na tela do treino (FR-004)

**Decision**: em `src/app/treino/[treinoId].tsx`, adicionar uma linha de texto
secundário (`ThemedText type="small" themeColor="textSecondary"`, mesmo padrão já
usado em `treino-list-item.tsx` para "Importado em") logo abaixo do título do treino
(`<ThemedText type="subtitle">{treino.nome}</ThemedText>`), antes da lista de
exercícios.

**Rationale**: mesmo componente e estilo de texto secundário já usados em todo o
projeto para informação de apoio (ex.: contador de sessões, data de importação atual);
"logo abaixo do título" é a posição mais direta para uma informação descrita na spec
como pertencente ao treino como um todo, não a um exercício específico.

**Alternatives considered**: nenhuma — posição é a única com precedente direto no
projeto (mesmo padrão do próprio `treino-list-item.tsx` antes desta feature).

## Decisão 5: testabilidade sem hardware nativo

**Decision**: esta feature não usa nenhuma API nativa (ao contrário de RF13/
vibração) — todos os cenários de `quickstart.md` são verificáveis via
`npx expo start` no navegador (web) e Playwright, como já feito para RF11/RF12/RF14,
com confirmação física nos dois aparelhos-alvo (Princípio III) antes de marcar como
concluída.

**Rationale**: reduz o ciclo de validação — não é necessário esperar por um build
EAS para confirmar a lógica antes da validação final em aparelho físico.

## Resumo das entidades técnicas afetadas

- `src/services/sessao-treino-storage.ts`: nova função
  `obterDataUltimaSessaoFinalizada` (Decisão 1).
- `src/app/(tabs)/index.tsx`: nova função `calcularChavesColidindo`; carrega
  `dataFinalizacao` por treino (paralelo ao já existente `carregarContagens`); passa
  novos props para `TreinoListItem` (Decisões 2 e 3).
- `src/components/treino/treino-list-item.tsx`: props novos `dataFinalizacao` e
  `exibirDataImportacao`; prop `nomeDuplicado` removido (Decisão 3).
- `src/app/treino/[treinoId].tsx`: nova linha de texto secundário com
  `treino.importadoEm` (Decisão 4).
