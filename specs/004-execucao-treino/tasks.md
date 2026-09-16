---

description: "Task list for Tela de Execução do Treino (RF03)"
---

# Tasks: Tela de Execução do Treino

**Input**: Design documents from `/specs/004-execucao-treino/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/tela-execucao-treino.md](./contracts/tela-execucao-treino.md), [quickstart.md](./quickstart.md)

**Tests**: Não solicitados na spec nem no plano — nenhum framework de testes automatizados está configurado no projeto (ver plan.md, Technical Context). Validação é manual, via quickstart.md, conforme Princípio III da Constituição.

**Organization**: Tarefas agrupadas por user story (spec.md), na ordem de prioridade (P1 → P2 → P3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: A qual user story a tarefa pertence (US1–US6)
- Caminhos de arquivo exatos incluídos em cada descrição

## Path Conventions

Projeto único (Expo Router): `src/app/`, `src/components/`, `src/hooks/`, `src/services/`, `src/types/` — conforme "Project Structure" do [plan.md](./plan.md).

---

## Phase 1: Setup

**Purpose**: Preparar os arquivos e a pasta da nova rota antes de qualquer lógica

- [X] T001 Criar a pasta `src/app/treino/` e o arquivo de rota vazio `src/app/treino/[treinoId].tsx` (export default de um componente placeholder), conforme a estrutura definida em [plan.md](./plan.md) "Project Structure"
- [X] T002 [P] Criar os arquivos de componente vazios `src/components/treino/exercicio-list-item.tsx` e `src/components/treino/exercicio-execucao.tsx` (export placeholder), conforme [plan.md](./plan.md) "Project Structure"

**Nota**: Nenhuma dependência nova é instalada nesta fase — `npm install` já cobre tudo que esta feature precisa (ver research.md).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestrutura mínima que TODAS as user stories precisam — carregamento do treino selecionado e navegação real a partir da lista (RF02)

**⚠️ CRITICAL**: Nenhuma user story pode ser implementada/testada de ponta a ponta antes desta fase estar completa, pois todas dependem de estar dentro da tela de execução com o treino já carregado

- [X] T003 Definir os tipos `EstadoExecucaoExercicio` (`exercicioId: string`, `iniciado: boolean`, `serieAtual: number`, `cargaKg: string`, `repsFeitas: string`) e `EstadoTelaExecucao` (`treino: Treino | null`, `exercicioSelecionadoId: string | null`, `estadosPorExercicio: Record<string, EstadoExecucaoExercicio>`) em `src/types/execucao-treino.ts`, conforme [data-model.md](./data-model.md) "Novas estruturas (estado local de UI, não persistido)" — `estadosPorExercicio` é a fonte de verdade única do progresso de cada exercício durante a sessão da tela, não apenas do exercício em foco
- [X] T004 Implementar em `src/app/treino/[treinoId].tsx` a leitura do parâmetro de rota `treinoId` via `useLocalSearchParams` do `expo-router`, a obtenção de `perfilAtivo` via `usePerfilAtivo()` (`@/hooks/use-perfil-ativo`, RF10, sem modificação) e a chamada a `listarTreinos(perfilAtivo.id)` (`@/services/treino-storage`, RF01, sem modificação) para localizar o `Treino` cujo `id === treinoId`; tratar os estados de carregamento e de "treino não encontrado", conforme [research.md](./research.md) Decisão 1 e [contracts/tela-execucao-treino.md](./contracts/tela-execucao-treino.md)
- [X] T005 Em `src/app/(tabs)/index.tsx`, substituir o corpo de `handleSelecionarTreino` (hoje `Alert.alert('Treino selecionado', treino.nome)`) por `router.push(\`/treino/${treino.id}\`)`, usando o `router` do `expo-router` já importado no arquivo, conforme [research.md](./research.md) Decisão 2

**Checkpoint**: A partir daqui, tocar em um treino na lista (RF02) navega de fato para `src/app/treino/[treinoId].tsx`, que já carrega o `Treino` correto do perfil ativo — as user stories podem começar

---

## Phase 3: User Story 1 - Visualizar os exercícios planejados do treino selecionado (Priority: P1) 🎯 MVP

**Goal**: Exibir, na tela de execução, a lista completa de exercícios do treino selecionado com seus dados planejados (séries, reps_alvo, carga_sugerida_kg, descanso_seg)

**Independent Test**: Selecionar na lista (RF02) um treino com múltiplos exercícios e confirmar que a tela de execução exibe todos os exercícios, cada um com os quatro dados planejados batendo exatamente com o JSON importado

### Implementation for User Story 1

- [X] T006 [P] [US1] Implementar `ExercicioListItem` em `src/components/treino/exercicio-list-item.tsx`: recebe um `ExercicioPlanejado` via props e exibe `nome`, `series`, `repsAlvo`, `cargaSugeridaKg` e `descansoSeg`, usando `ThemedText`/`ThemedView`/`Spacing` (`@/constants/theme`) no mesmo padrão visual de `treino-list-item.tsx` (RF02)
- [X] T007 [US1] Em `src/app/treino/[treinoId].tsx`, renderizar `treino.exercicios` em uma `FlatList` de `ExercicioListItem` (um item por exercício), exibindo o `nome` do treino como título da tela via `ThemedText` (depende de T004, T006)

**Checkpoint**: Ao entrar na tela de execução, a lista completa de exercícios planejados já é visível — US1 é funcional e testável isoladamente

---

## Phase 4: User Story 2 - Selecionar livremente qual exercício iniciar (Priority: P1)

**Goal**: Permitir que o usuário toque em qualquer exercício da lista para abri-lo, em qualquer ordem, sem exigir sequência

**Independent Test**: Em um treino com 3+ exercícios, tocar no segundo ou terceiro antes do primeiro e confirmar que o app permite abri-lo normalmente, sem bloqueio ou aviso de ordem

### Implementation for User Story 2

- [X] T008 [US2] Em `src/app/treino/[treinoId].tsx`, adicionar os estados `exercicioSelecionadoId` e `estadosPorExercicio` (do tipo `EstadoTelaExecucao`, T003) e o handler `onPress` em cada `ExercicioListItem`: ao tocar, definir `exercicioSelecionadoId` com o `id` do exercício tocado e, se `estadosPorExercicio[id]` ainda não existir, criar a instância inicial `{ exercicioId: id, iniciado: false, serieAtual: 1, cargaKg: '', repsFeitas: '' }` (Transição 1 do data-model.md); sem nenhuma checagem de ordem/posição na lista (FR-004, FR-005) (depende de T007)
- [X] T009 [US2] Em `src/app/treino/[treinoId].tsx`, alternar a renderização entre a lista de exercícios (quando `exercicioSelecionadoId === null`) e a área de detalhe/execução do exercício selecionado (quando preenchido), lendo a instância correspondente em `estadosPorExercicio[exercicioSelecionadoId]` para repassar a `ExercicioExecucao`, incluindo uma ação para voltar à lista (limpar apenas `exercicioSelecionadoId`, preservando `estadosPorExercicio` intacto para reabertura futura — Transição 4 do data-model.md) (depende de T008)

**Checkpoint**: Qualquer exercício da lista pode ser aberto, em qualquer ordem — US1 e US2 funcionam juntas e isoladamente

---

## Phase 5: User Story 3 - Iniciar um exercício selecionado (Priority: P1)

**Goal**: Ao abrir um exercício, exibir o botão "Iniciar exercício"; ao tocar nele, liberar os campos de registro da primeira série

**Independent Test**: Tocar em um exercício ainda não iniciado, confirmar que o botão "Iniciar exercício" aparece, tocar nele e confirmar que os campos de carga/reps da série 1 são exibidos

### Implementation for User Story 3

- [X] T010 [P] [US3] Implementar `ExercicioExecucao` em `src/components/treino/exercicio-execucao.tsx`: recebe via props o `ExercicioPlanejado` selecionado, a instância `EstadoExecucaoExercicio` correspondente (lida de `estadosPorExercicio` pelo componente pai) e um callback `onAtualizarEstado(novoEstado: EstadoExecucaoExercicio)`; NÃO mantém estado próprio de progresso — apenas repassa mudanças para o pai, conforme a "Nota de propriedade do estado" em [data-model.md](./data-model.md) (o estado vive em `src/app/treino/[treinoId].tsx`, dentro de `estadosPorExercicio`, para que a lista de exercícios também reflita o progresso — FR-014)
- [X] T011 [US3] Em `ExercicioExecucao` (`src/components/treino/exercicio-execucao.tsx`), renderizar o botão "Iniciar exercício" quando a instância recebida tem `iniciado === false`; ao tocar, chamar `onAtualizarEstado` com `{ ...estado, iniciado: true, serieAtual: 1, cargaKg: String(exercicio.cargaSugeridaKg), repsFeitas: '' }`, conforme a Transição 2 descrita em [data-model.md](./data-model.md) (FR-006, FR-007, FR-008) (depende de T010)
- [X] T012 [US3] Em `src/app/treino/[treinoId].tsx`, renderizar `ExercicioExecucao` na área de detalhe (quando `exercicioSelecionadoId` está preenchido), passando o `ExercicioPlanejado` correspondente de `treino.exercicios`, a instância `estadosPorExercicio[exercicioSelecionadoId]` e um callback que atualiza **apenas essa entrada** do mapa `estadosPorExercicio` (mantendo as demais instâncias intactas), conforme Transição 3 do [data-model.md](./data-model.md) (depende de T009, T011)

**Checkpoint**: O fluxo abrir exercício → "Iniciar exercício" → campos da série 1 liberados já funciona de ponta a ponta — US1, US2 e US3 funcionam juntas e isoladamente

---

## Phase 6: User Story 4 - Registrar carga e repetições da série atual (Priority: P1)

**Goal**: Exibir campos de carga (kg, decimal, pré-preenchido e editável) e repetições feitas para a série atual

**Independent Test**: Iniciar um exercício, confirmar que o campo de carga vem pré-preenchido com `carga_sugerida_kg`, editar para um valor decimal diferente (ex.: 42.5), confirmar rejeição de entrada não numérica, e preencher repetições feitas

### Implementation for User Story 4

- [X] T013 [US4] Em `ExercicioExecucao` (`src/components/treino/exercicio-execucao.tsx`), adicionar um `TextInput` para `cargaKg`, exibido apenas quando a instância recebida tem `iniciado === true`, com `keyboardType` numérico com suporte a decimal e filtragem de entrada que aceita apenas dígitos e um separador decimal (ex.: `42.5`), rejeitando qualquer outro caractere; a cada edição válida, chamar `onAtualizarEstado({ ...estado, cargaKg: novoValor })` (FR-007, FR-009, FR-010); o valor inicial já vem pré-preenchido por T011 com `cargaSugeridaKg` (FR-008) (depende de T011, T012)
- [X] T014 [US4] Em `ExercicioExecucao` (`src/components/treino/exercicio-execucao.tsx`), adicionar um `TextInput` para `repsFeitas`, exibido junto ao campo de carga, aceitando apenas números inteiros não negativos (per [data-model.md](./data-model.md) "Regras de validação"); a cada edição válida, chamar `onAtualizarEstado({ ...estado, repsFeitas: novoValor })`, atualizando somente a entrada deste exercício em `estadosPorExercicio` (FR-007) (depende de T011, T012)

**Checkpoint**: O registro de carga e reps da série atual funciona com pré-preenchimento e validação — US1 a US4 (todas P1) já cobrem o fluxo essencial do RF03

---

## Phase 7: User Story 5 - Identificar visualmente qual série está em andamento (Priority: P2)

**Goal**: Exibir um indicador textual "Série X de Y" durante a execução do exercício

**Independent Test**: Iniciar um exercício com `series = 4` e confirmar que o indicador exibe "Série 1 de 4" ao iniciar

### Implementation for User Story 5

- [X] T015 [US5] Em `ExercicioExecucao` (`src/components/treino/exercicio-execucao.tsx`), renderizar um `ThemedText` com o texto `"Série {estado.serieAtual} de {exercicio.series}"`, visível apenas quando a instância recebida via props tem `iniciado === true`, atualizando automaticamente sempre que `estadosPorExercicio[exercicioSelecionadoId].serieAtual` mudar no componente pai (FR-011, FR-012) (depende de T011, T012)

**Checkpoint**: O usuário sempre sabe em qual série está — US1 a US5 funcionam juntas e isoladamente

---

## Phase 8: User Story 6 - Hierarquia visual entre foco e secundário (Priority: P3)

**Goal**: Diferenciar visualmente exercícios não iniciados/em andamento/concluídos na lista, e destacar os elementos da série em foco sobre os secundários, reaproveitando os tokens visuais do RF02

**Independent Test**: Com exercícios em estados diferentes, confirmar diferenciação visual clara na lista; comparar a tela de execução com a lista de treinos (RF02) e confirmar mesma tipografia/espaçamento/paleta

### Implementation for User Story 6

- [X] T016 [P] [US6] Em `ExercicioListItem` (`src/components/treino/exercicio-list-item.tsx`), adicionar uma prop de estado visual (ex.: `estado: 'naoIniciado' | 'emAndamento' | 'concluido'`) e aplicar estilos distintos (ex.: variantes de `ThemedView`/`Colors.backgroundElement` vs. `Colors.backgroundSelected`) para cada estado, reaproveitando os tokens já usados no RF02 (FR-014); em `src/app/treino/[treinoId].tsx`, ao renderizar cada item da lista, derivar esse `estado` a partir de `estadosPorExercicio[exercicio.id]` (ausente no mapa → `'naoIniciado'`; presente com `iniciado === true` → `'emAndamento'`), já que é esse mapa — não um estado interno do item — que preserva o progresso de cada exercício ao navegar entre eles (data-model.md, `EstadoTelaExecucao.estadosPorExercicio`)
- [X] T017 [US6] Em `ExercicioExecucao` (`src/components/treino/exercicio-execucao.tsx`) e em `src/app/treino/[treinoId].tsx`, revisar e ajustar hierarquia visual (tipografia, espaçamento via `Spacing`, cor via `Colors`) para que o indicador de série, os campos de registro e o botão de ação (elementos em foco) se destaquem claramente dos exercícios secundários na lista, sem introduzir nenhum componente, paleta ou biblioteca visual nova (FR-013, FR-014) (depende de T007, T015, T016)

**Checkpoint**: Todas as user stories (US1–US6) estão implementadas e a tela é visualmente consistente com o RF02

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Validação final e conformidade com a Constituição do projeto

- [X] T018 Executar os cenários do [quickstart.md](./quickstart.md) manualmente em um dispositivo Android (Redmi Note 12) e em um dispositivo iOS (iPhone 16 Plus) via Expo Go, documentando qualquer divergência entre plataformas (Princípio III da Constituição) — validado pelo usuário em ambos os aparelhos, incluindo o ajuste de contraste e o novo estado visual "pausado" (ver "Ajuste pós-implementação" abaixo); nenhuma divergência entre plataformas reportada
- [X] T019 [P] Revisar `src/app/treino/[treinoId].tsx`, `src/components/treino/exercicio-list-item.tsx`, `src/components/treino/exercicio-execucao.tsx` e `src/types/execucao-treino.ts` quanto a tipagem estrita (sem `any` implícito) e ausência de novas dependências não listadas no PRD (Princípios I e IV da Constituição)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: Depende da conclusão do Setup — BLOQUEIA todas as user stories
- **User Stories (Phase 3–8)**: Todas dependem da conclusão da Fase Foundational
  - US1 (P1) → US2 (P1) → US3 (P1) → US4 (P1): sequência natural, pois cada uma constrói sobre o estado/UI da anterior dentro da mesma tela (lista → seleção → botão iniciar → campos de registro)
  - US5 (P2) e US6 (P3) dependem de US3 (elemento "iniciado") e US1 (lista), respectivamente, mas são incrementos visuais que não bloqueiam a funcionalidade essencial já entregue por US1–US4
- **Polish (Phase 9)**: Depende de todas as user stories desejadas estarem completas

### User Story Dependencies

- **US1 (P1)**: Depende apenas da Fase Foundational
- **US2 (P1)**: Depende de US1 (a lista precisa existir para ser tocada)
- **US3 (P1)**: Depende de US2 (precisa haver um exercício selecionado para abrir sua execução)
- **US4 (P1)**: Depende de US3 (os campos só aparecem após "Iniciar exercício")
- **US5 (P2)**: Depende de US3 (o indicador de série só faz sentido com o exercício iniciado)
- **US6 (P3)**: Depende de US1 (estilizar itens da lista) e de US5/US3 (destacar elementos em foco já existentes)

> Nota: diferente do padrão usual de user stories totalmente independentes, esta feature tem uma única tela com um fluxo de estado sequencial (ver [data-model.md](./data-model.md)); por isso US1→US4 têm dependência natural entre si, mesmo sendo todas P1. Ainda assim, cada Checkpoint acima é validável de forma independente antes de avançar.

### Parallel Opportunities

- T001 e T002 (Setup) podem rodar em paralelo — arquivos diferentes
- T006 (US1) e T010 (US3) podem ser implementados em paralelo — arquivos de componente diferentes, ambos consumidos depois em `src/app/treino/[treinoId].tsx`
- T016 (US6) pode rodar em paralelo com T013/T014 (US4) e T015 (US5) — arquivo `exercicio-list-item.tsx` isolado dos demais
- T019 (Polish) pode rodar em paralelo com T018 (arquivos de revisão vs. validação manual)

---

## Parallel Example: Setup + primeiros componentes

```bash
# Fase 1, em paralelo:
Task: "Criar a pasta src/app/treino/ e o arquivo de rota vazio src/app/treino/[treinoId].tsx"
Task: "Criar os arquivos de componente vazios exercicio-list-item.tsx e exercicio-execucao.tsx"

# Após Foundational, componentes de US1 e US3 em paralelo:
Task: "Implementar ExercicioListItem em src/components/treino/exercicio-list-item.tsx"
Task: "Implementar ExercicioExecucao (skeleton) em src/components/treino/exercicio-execucao.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1–4, todas P1)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (CRÍTICO — bloqueia todas as stories)
3. Completar Fases 3–6: US1 → US2 → US3 → US4, em sequência (dependência natural de fluxo)
4. **PARAR e VALIDAR**: rodar os cenários 1–4 do quickstart.md em Android e iOS
5. Este é o MVP funcional do RF03 — exibição, seleção livre, início e registro de carga/reps

### Incremental Delivery

1. Setup + Foundational → navegação real da lista (RF02) para a tela de execução funcionando
2. US1 → lista de exercícios planejados visível → validar
3. US2 → seleção livre de qualquer exercício → validar
4. US3 → botão "Iniciar exercício" e liberação dos campos → validar
5. US4 → registro de carga (pré-preenchida, decimal, validada) e reps → validar (**MVP completo aqui**)
6. US5 → indicador "Série X de Y" → validar
7. US6 → hierarquia visual e consistência com RF02 → validar
8. Polish → validação cruzada Android/iOS e revisão de tipagem/dependências

---

## Notes

- [P] tarefas = arquivos diferentes, sem dependência entre si
- [Story] identifica a qual user story a tarefa pertence, para rastreabilidade
- Nenhuma tarefa desta feature persiste dados em `AsyncStorage` — o estado de série vive apenas em memória local do componente (research.md, Decisão 3; escopo de persistência é RF04/RF07)
- `treino-storage.ts` (RF01) e `use-perfil-ativo.tsx` (RF10) são consumidos sem nenhuma modificação em todas as tarefas
- Avançar entre séries, concluir exercício, cronômetro de descanso e persistência de sessão são explicitamente fora do escopo desta feature (RF04/RF05/RF06/RF07) — nenhuma tarefa acima deve antecipar esse comportamento

### Ajuste pós-implementação (revisão de US6/FR-014)

Durante a revisão manual da User Story 6, identificou-se que o app não executa exercícios
"conjugados"/simultâneos, e que o estado visual "em andamento" na lista de exercícios não
deveria ser alcançável para mais de um item ao mesmo tempo (a tela só mantém um exercício
selecionado por vez). Correção aplicada:
- `EstadoVisualExercicio` (`exercicio-list-item.tsx`) passou a ter apenas `'naoIniciado' |
  'pausado' | 'concluido'` — removido o estado `'emAndamento'` da lista, já que ele nunca
  seria exibido nela (a lista só aparece quando nenhum exercício está selecionado).
- Um exercício com `iniciado: true` que não é o `exercicioSelecionadoId` atual é exibido
  como "pausado" (borda de destaque + rótulo "⏸ Em andamento (pausado)"), preservando seu
  progresso em `estadosPorExercicio` sem resetar (nenhuma mudança na estrutura do estado,
  apenas na derivação do estado visual em `src/app/treino/[treinoId].tsx`).
- Contraste aumentado nos elementos em foco: botão "Iniciar exercício" com fundo sólido
  (`theme.text`) e texto invertido (`theme.background`); área da série atual e campos de
  carga/reps com borda de 2px em `theme.text` em vez de `theme.textSecondary`.
- `spec.md` (FR-014, FR-015 novo, US6 cenário 1, Edge Cases) e `data-model.md` (Transição 6
  de `EstadoExecucaoExercicio`) atualizados para documentar essa regra de negócio.
- `tsc --noEmit` e `eslint` confirmados limpos após o ajuste.
