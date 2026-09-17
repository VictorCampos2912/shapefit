---

description: "Task list template for feature implementation"
---

# Tasks: Listar Treinos Importados/Salvos

**Input**: Design documents from `/specs/003-listar-treinos/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/tela-lista-treinos.md, quickstart.md

**Tests**: Não solicitados explicitamente na spec nem no plano; nenhuma tarefa de teste automatizado é gerada. Validação é manual, via quickstart.md, em Android e iOS (Princípio III da Constituição), mesma abordagem usada no RF10 e no RF01.

**Organization**: Tarefas agrupadas por user story (US1 a US5), na ordem de prioridade definida em spec.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência entre si)
- **[Story]**: A qual user story a tarefa pertence (US1, US2, US3, US4, US5)
- Caminhos de arquivo exatos incluídos em cada descrição

## Path Conventions

Projeto único mobile (Expo Router), conforme plan.md — mesma estrutura do RF10/RF01:
- `src/app/(tabs)/index.tsx` — rota reescrita (era o ponto de entrada temporário do RF01)
- `src/components/treino/` — novo componente de apresentação
- `src/services/treino-storage.ts` — já existente (RF01), reaproveitado **sem modificação**
- `src/hooks/use-perfil-ativo.tsx` — já existente (RF10), reaproveitado **sem modificação**

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Nenhuma dependência nova é necessária (research.md); apenas confirmar o ponto de partida antes de reescrever a tela

- [X] T001 Confirmar, por leitura de `src/services/treino-storage.ts` e `src/hooks/use-perfil-ativo.tsx`, que `listarTreinos(perfilId)`, `importarTreino(perfilId)`, `importarTreinoExemplo(perfilId)` e `usePerfilAtivo()` existem com as assinaturas descritas em contracts/tela-lista-treinos.md — nenhuma alteração é feita nesses arquivos (Decisão 1 do research.md)

**Checkpoint**: Confirmado que a base de RF10/RF01 está disponível e não será modificada; pronto para reescrever a tela.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Componente de apresentação do item de lista, com a regra de diferenciação por nome duplicado — infraestrutura obrigatória para todas as user stories de exibição

**⚠️ CRITICAL**: Nenhuma user story pode ser implementada antes desta fase estar completa

- [X] T002 Criar o componente `TreinoListItem` em `src/components/treino/treino-list-item.tsx`, recebendo como props um `Treino` (de `@/types/treino`) e um booleano `nomeDuplicado`; exibe sempre `treino.nome`; quando `nomeDuplicado` é `true`, exibe também `treino.importadoEm` formatado de forma legível (ex.: data e hora locais) junto ao nome, conforme data-model.md (seção "ItemDeListaTreino") — usa `ThemedText`/`ThemedView` já existentes, sem nova biblioteca de UI (Decisão 5 do research.md)
- [X] T003 Implementar, em `src/app/(tabs)/index.tsx` (ainda como função auxiliar antes da reescrita completa da tela), a função `calcularNomesDuplicados(treinos: Treino[]): Set<string>` que retorna o conjunto de valores de `nome` que aparecem mais de uma vez na lista recebida, usada para determinar `nomeDuplicado` de cada item (regra de cálculo exata descrita em data-model.md, seção "ItemDeListaTreino")

**Checkpoint**: Componente de item de lista e lógica de diferenciação por nome duplicado prontos — implementação das user stories de exibição pode começar.

---

## Phase 3: User Story 1 - Consultar a lista de treinos do perfil ativo (Priority: P1) 🎯 MVP

**Goal**: Reescrever `(tabs)/index.tsx` para exibir a lista de treinos do perfil ativo, identificados pelo nome, persistindo entre sessões do app (via `listarTreinos`, já implementada).

**Independent Test**: Importar dois ou mais treinos (via RF01) para o mesmo perfil, abrir a tela de treinos, e confirmar que todos aparecem na lista, identificados pelo nome do JSON de cada um; fechar e reabrir o app e confirmar que a lista persiste (ver quickstart.md, cenário 1).

### Implementation for User Story 1

- [X] T004 [US1] Reescrever `src/app/(tabs)/index.tsx`, removendo todo o conteúdo de boilerplate do Expo (`AnimatedIcon`, `HintRow`, `WebBadge`, textos "Welcome to Expo"/"get started") e criando o esqueleto da tela de lista de treinos: obtém `perfilAtivo` via `usePerfilAtivo()` (sem modificar o hook); mantém um estado local `treinos: Treino[]` e `carregando: boolean` — depende de T001
- [X] T005 [US1] Em `src/app/(tabs)/index.tsx`, implementar um efeito que chama `listarTreinos(perfilAtivo.id)` sempre que `perfilAtivo?.id` mudar (incluindo a primeira renderização), atualizando o estado `treinos` e `carregando` de acordo (Decisão 2 do research.md) — depende de T004
- [X] T006 [US1] Em `src/app/(tabs)/index.tsx`, renderizar a lista de treinos usando `FlatList` (ou `.map`, conforme padrão já usado em `src/app/perfil/selecionar.tsx`) com `TreinoListItem` (T002) para cada item, usando `calcularNomesDuplicados` (T003) para determinar a prop `nomeDuplicado` de cada item; usar `treino.id` como `key` de renderização (FR-001, FR-002, FR-006, data-model.md) — depende de T002, T003, T005

**Checkpoint**: Um usuário com treinos já importados consegue ver a lista completa, persistente entre sessões. User Story 1 funcional e testável de forma independente.

---

## Phase 4: User Story 2 - Lista filtrada e atualizada por perfil ativo (Priority: P1)

**Goal**: Garantir que a lista sempre reflita apenas os treinos do perfil ativo e se atualize imediatamente ao trocar de perfil, sem fechar/reabrir o app.

**Independent Test**: Importar um treino com o Perfil A ativo, abrir a tela de treinos (deve mostrar apenas o treino de A), trocar para o Perfil B sem sair da tela, e confirmar que a lista atualiza para mostrar apenas os treinos de B (ver quickstart.md, cenário 2).

### Implementation for User Story 2

- [X] T007 [US2] Confirmar, por inspeção do efeito implementado em T005, que a dependência do efeito é exatamente `perfilAtivo?.id` (não um objeto `perfilAtivo` inteiro nem uma referência instável), garantindo que a releitura ocorra a cada troca de perfil e não seja disparada por re-renders não relacionados à troca de perfil (FR-003, FR-004) — depende de T005
- [X] T008 [US2] Confirmar, por inspeção de `listarTreinos` em `src/services/treino-storage.ts` (sem alterá-la), que a função já filtra exclusivamente pelo `perfilId` recebido como parâmetro (chave `treinos:<perfilId>`), garantindo que nenhum treino de outro perfil apareça na lista em nenhuma circunstância (Princípio V, NON-NEGOTIABLE) — depende de T001

**Checkpoint**: A lista nunca mistura treinos de perfis diferentes e se atualiza imediatamente ao trocar de perfil. User Stories 1 e 2 funcionam de forma independente.

---

## Phase 5: User Story 3 - Diferenciar treinos com o mesmo nome (Priority: P2)

**Goal**: Quando dois ou mais treinos do mesmo perfil compartilham o mesmo nome, exibir a data/hora de importação de cada um para diferenciá-los.

**Independent Test**: Importar dois arquivos de treino com o mesmo campo `nome` para o mesmo perfil (em momentos diferentes) e confirmar que ambos aparecem na lista, cada um exibindo a data/hora de importação (ver quickstart.md, cenário 3).

### Implementation for User Story 3

- [X] T009 [US3] Confirmar, testando manualmente com dois treinos de mesmo nome (após T006 estar implementada), que `TreinoListItem` (T002) exibe a data/hora apenas nos itens cujo nome é duplicado, e que itens com nome único continuam exibindo apenas o nome — nenhuma alteração de código adicional é esperada se T002/T003/T006 foram implementadas corretamente; esta tarefa é de verificação, não de implementação nova — depende de T002, T003, T006

**Checkpoint**: Treinos com nomes duplicados permanecem diferenciáveis na lista. User Stories 1, 2 e 3 funcionam de forma independente.

---

## Phase 6: User Story 4 - Importar um novo treino a partir da tela de treinos (Priority: P2)

**Goal**: Mover a ação de importar treino (já implementada no RF01) para a tela de treinos, removendo-a de qualquer outro lugar do app.

**Independent Test**: Abrir a tela de treinos, acionar a ação de importar a partir dela, selecionar um arquivo de treino válido, e confirmar que o treino aparece na lista sem sair da tela; confirmar que a ação de importar não está mais acessível a partir de nenhuma outra tela (ver quickstart.md, cenário 4).

### Implementation for User Story 4

- [X] T010 [US4] Em `src/app/(tabs)/index.tsx`, adicionar as ações "Importar treino" e "Importar treino de exemplo", chamando `importarTreino(perfilAtivo.id)` / `importarTreinoExemplo(perfilAtivo.id)` (já existentes, sem modificação) e reaproveitando a mesma função `exibirResultadoImportacao` (mensagens de sucesso, sucesso parcial, e erro) já usada no ponto de entrada temporário do RF01 (FR-008) — depende de T004
- [X] T011 [US4] Em `src/app/(tabs)/index.tsx`, após uma importação bem-sucedida (`resultado?.treino !== null`), chamar novamente `listarTreinos(perfilAtivo.id)` para recarregar a lista e refletir o novo treino imediatamente, sem fechar/reabrir o app (FR-005, contracts/tela-lista-treinos.md) — depende de T005, T010
- [X] T012 [US4] Confirmar, por inspeção de todo o código-fonte em `src/app/`, que nenhuma tela além de `(tabs)/index.tsx` oferece uma ação de importar treino — como a tela antiga é completamente substituída por esta feature (nenhum arquivo novo de rota é criado), essa invariante já é garantida estruturalmente (FR-009) — depende de T010

**Checkpoint**: A ação de importar treino existe em um único lugar (a tela de treinos) e funciona exatamente como no RF01. User Stories 1 a 4 funcionam de forma independente.

---

## Phase 7: User Story 5 - Preparar a navegação para executar um treino (Priority: P3)

**Goal**: Reconhecer de forma inequívoca qual treino foi tocado na lista, como preparação para o RF03 (ainda não implementado).

**Independent Test**: Tocar em um item específico da lista e confirmar que o app reconhece de forma inequívoca qual treino foi selecionado (ver quickstart.md, cenário 5).

### Implementation for User Story 5

- [X] T013 [US5] Em `src/app/(tabs)/index.tsx`, adicionar um handler de toque (`onPress`) a cada `TreinoListItem` renderizado (T006), capturando o `treino.id` do item tocado (ex.: via `console.log` ou um retorno visual mínimo, como destacar o item tocado), sem implementar navegação para uma tela de execução, já que o RF03 está fora de escopo (FR-010) — depende de T006

**Checkpoint**: A seleção de um treino específico é reconhecida de forma inequívoca. Todas as cinco user stories funcionam de forma independente e em conjunto.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Ajustes finais que atravessam as cinco user stories, incluindo o estado vazio e a atenção visual mínima exigida pela spec

- [X] T014 [P] Em `src/app/(tabs)/index.tsx`, implementar o estado vazio: quando `!carregando && treinos.length === 0`, exibir uma indicação clara de que o perfil ativo ainda não tem treinos importados, mantendo a ação de importar visível e acessível (FR-011, data-model.md seção "Estados da tela") — depende de T005, T010
- [X] T015 [P] Revisar o layout de `src/app/(tabs)/index.tsx` (cabeçalho, espaçamento entre itens, ação de importar, estado vazio) usando `Spacing` e `Colors` de `@/constants/theme`, garantindo tipografia e espaçamento organizados, visualmente distintos do boilerplate padrão do Expo removido em T004 (FR-012, Decisão 5 do research.md) — depende de T004, T006, T010, T014
- [X] T016 [P] Rodar type-check (`npx tsc --noEmit`) confirmando ausência de `any` implícito em todo o código desta feature, conforme Princípio I da Constituição
- [X] T017 [P] Confirmar, por inspeção de código, que nenhuma leitura de treino nesta feature ocorre sem passar por `listarTreinos(perfilId)` com o `perfilId` do perfil ativo — nenhuma chave AsyncStorage é lida diretamente pela tela (Princípio V da Constituição)
- [X] T018 Executar manualmente todos os cenários de `quickstart.md` (1 a 5) no Redmi Note 12 (Android 12+) via Expo Go. Resultado: todos os cenários PASS (consultar lista do perfil ativo, isolamento/atualização por perfil, diferenciação de nomes duplicados, importar a partir da tela de treinos, seleção de treino reconhecida).
- [X] T019 Executar manualmente todos os cenários de `quickstart.md` (1 a 5) no iPhone 16 Plus (iOS 17+) via Expo Go. Resultado: todos os cenários PASS, confirmados pelo usuário em 2026-09-16 — lista do perfil ativo, atualização da lista ao trocar de perfil, diferenciação de treinos com nome duplicado por horário, e seleção de um treino navegando de fato para a tela de execução (RF03, já implementado nesta rodada, incluindo o estado "em andamento (pausado)" ao trocar de exercício)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: Depende da conclusão do Setup — BLOQUEIA todas as user stories
- **User Story 1 (Phase 3)**: Depende da conclusão do Foundational
- **User Story 2 (Phase 4)**: Depende da conclusão do Foundational; T007/T008 também dependem de T005 (User Story 1), pois verificam código já escrito nela
- **User Story 3 (Phase 5)**: Depende da conclusão do Foundational; T009 depende de T002/T003/T006 (User Story 1), pois verifica comportamento já implementado
- **User Story 4 (Phase 6)**: Depende da conclusão do Foundational; T010/T011/T012 dependem de T004/T005 (User Story 1), pois estendem a mesma tela
- **User Story 5 (Phase 7)**: Depende da conclusão do Foundational; T013 depende de T006 (User Story 1)
- **Polish (Phase 8)**: Depende da conclusão das User Stories 1 a 5

### User Story Dependencies

- **User Story 1 (P1)**: Implementa o núcleo da tela (leitura + exibição da lista) — implementar primeiro; as demais stories estendem essa mesma tela.
- **User Story 2 (P1)**: Reforça e verifica a garantia de isolamento por perfil já embutida no design (parâmetro `perfilId` explícito e dependência de efeito em `perfilAtivo.id`) — não introduz nova UI, apenas confirma o contrato já criado em US1.
- **User Story 3 (P2)**: Verifica um comportamento que já emerge da implementação de US1 + Foundational (T002/T003), sem código adicional na maioria dos casos.
- **User Story 4 (P2)**: Estende a tela de US1 com as ações de importação, reaproveitando comportamento já existente do RF01.
- **User Story 5 (P3)**: Estende a tela de US1 com reconhecimento de toque, sem navegação real (RF03 fora de escopo).

> Nota: assim como no RF10 e no RF01, todas as user stories compartilham a mesma tela
> (`(tabs)/index.tsx`), construída incrementalmente a partir da Fase 2 (componente de item) e
> da Fase 3/US1 (leitura e exibição da lista). A ordem de implementação recomendada é
> US1 → US2 → US3 → US4 → US5, mas os artefatos de cada fase (componente, cálculo de
> duplicidade) já existem desde a Fase 2.

### Parallel Opportunities

- T014, T015, T016 e T017 (Phase 8) podem rodar em paralelo — revisões/verificações independentes sobre artefatos já finalizados
- T007 e T008 (Phase 4) podem rodar em paralelo — verificações independentes (efeito vs. camada de serviço)

---

## Parallel Example: Polish

```bash
# Fase 8 — em paralelo:
Task: "Implementar estado vazio em src/app/(tabs)/index.tsx"
Task: "Revisar layout/tipografia/espaçamento em src/app/(tabs)/index.tsx"
Task: "Rodar type-check (npx tsc --noEmit)"
Task: "Confirmar que nenhuma leitura de treino ocorre sem passar por listarTreinos"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloqueia todas as user stories)
3. Completar Phase 3: User Story 1
4. **PARAR e VALIDAR**: testar a exibição da lista de treinos de forma independente (quickstart.md, cenário 1)
5. Este é o MVP mínimo que satisfaz FR-001, FR-002, FR-006

### Incremental Delivery

1. Setup + Foundational → base pronta (componente de item + cálculo de duplicidade)
2. User Story 1 → validar independentemente → lista de treinos exibida e persistente (MVP)
3. User Story 2 → validar independentemente → isolamento e atualização por perfil confirmados
4. User Story 3 → validar independentemente → nomes duplicados diferenciáveis
5. User Story 4 → validar independentemente → importação movida para a tela de treinos
6. User Story 5 → validar independentemente → seleção de treino reconhecida
7. Polish → estado vazio, atenção visual mínima, validação manual completa em Android e iOS

---

## Notes

- [P] tasks = arquivos diferentes ou verificações independentes, sem dependência entre si
- [Story] label mapeia a tarefa à user story correspondente para rastreabilidade
- Nenhuma tarefa de teste automatizado foi gerada — não solicitado na spec; validação é manual via quickstart.md (Princípio III da Constituição), mesmo padrão do RF10/RF01
- `treino-storage.ts` (RF01) e `use-perfil-ativo.tsx` (RF10) NÃO são modificados por nenhuma tarefa desta feature — todas as tarefas que os mencionam são de consumo ou verificação, conforme instrução explícita do usuário e Decisão 1 do research.md
- A regra de diferenciação por nome duplicado (data-model.md, "ItemDeListaTreino") é citada literalmente em T002/T003 para não deixar a implementação a critério da IA
- O ponto de entrada de UI em `src/app/(tabs)/index.tsx` deixa de ser temporário nesta feature — não há mais tarefa de "mover" pendente para uma feature futura, ao contrário do que ocorria no RF01
