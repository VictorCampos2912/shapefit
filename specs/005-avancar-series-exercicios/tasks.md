---

description: "Task list for Avançar Entre Séries e Exercícios (RF04)"
---

# Tasks: Avançar Entre Séries e Exercícios

**Input**: Design documents from `/specs/005-avancar-series-exercicios/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/sessao-treino-storage.md](./contracts/sessao-treino-storage.md), [contracts/tela-execucao-conclusao.md](./contracts/tela-execucao-conclusao.md), [quickstart.md](./quickstart.md)

**Tests**: Não solicitados na spec nem no plano — nenhum framework de testes automatizados está configurado no projeto (ver plan.md, Technical Context). Validação é manual, via quickstart.md, conforme Princípio III da Constituição.

**Organization**: Tarefas agrupadas por user story (spec.md), na ordem de prioridade (P1 → P2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: A qual user story a tarefa pertence (US1–US4)
- Caminhos de arquivo exatos incluídos em cada descrição

## Path Conventions

Projeto único (Expo Router): `src/app/`, `src/components/`, `src/services/`, `src/types/` — conforme "Project Structure" do [plan.md](./plan.md).

---

## Phase 1: Setup

**Purpose**: Preparar o compartilhamento do tipo `SessaoRegistro` (RF10) antes de qualquer lógica nova depender dele

- [X] T001 Mover o tipo `SessaoRegistro` (`{ perfilId: string; finalizadaEm: string | null }`), hoje declarado como `type` privado dentro de `src/services/perfil-storage.ts`, para `src/types/perfil.ts`, exportando-o como `export type SessaoRegistro = { perfilId: string; finalizadaEm: string | null }`, conforme [data-model.md](./data-model.md) "SessaoRegistro (já existente e usado pelo RF10 — movido, não modificado em substância)". Nenhuma mudança de campos, nomes ou comportamento
- [X] T002 Em `src/services/perfil-storage.ts`, remover a declaração local de `SessaoRegistro` e substituí-la por `import type { SessaoRegistro } from '@/types/perfil'`; confirmar que `existeSessaoEmAndamento` permanece com o mesmo comportamento (depende de T001)

**Checkpoint**: `SessaoRegistro` está disponível para import em `src/types/`, sem nenhuma mudança de comportamento no RF10 — pronto para ser estendido pelo novo tipo `SessaoTreino`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tipos e serviço de persistência que TODAS as user stories precisam — nenhuma delas pode concluir série/exercício sem esta base

**⚠️ CRITICAL**: Nenhuma user story pode ser implementada/testada de ponta a ponta antes desta fase estar completa

- [X] T003 Em `src/types/execucao-treino.ts`, definir os tipos `SerieRealizada` (`{ serie: number; cargaKg: number; reps: number }`), `ExecucaoExercicio` (`{ exercicioId: string; seriesRealizadas: SerieRealizada[]; status: 'em_andamento' | 'concluido' }`) e `SessaoTreino` como `export interface SessaoTreino extends SessaoRegistro { treinoId: string; iniciadaEm: string; execucoes: ExecucaoExercicio[] }`, importando `SessaoRegistro` de `@/types/perfil`, conforme [data-model.md](./data-model.md) "Novas entidades (persistidas em AsyncStorage)" (depende de T001)
- [X] T004 Em `src/types/execucao-treino.ts`, estender `EstadoExecucaoExercicio` com os campos `seriesConcluidas: SerieRealizada[]` e `concluido: boolean`, e atualizar `criarEstadoExecucaoInicial` para inicializá-los como `[]` e `false`, conforme [data-model.md](./data-model.md) "EstadoExecucaoExercicio (estendido)" (depende de T003)
- [X] T005 Criar `src/services/sessao-treino-storage.ts` com `obterSessao(perfilId, treinoId): Promise<SessaoTreino | null>`, que lê `sessoes:${perfilId}` (mesma chave usada por `existeSessaoEmAndamento`), faz `JSON.parse` como `SessaoTreino[]` e retorna a entrada cujo `treinoId` corresponde, ou `null` se a chave não existir ou nenhuma sessão corresponder, conforme [contracts/sessao-treino-storage.md](./contracts/sessao-treino-storage.md) "Interface do serviço" (depende de T003)
- [X] T006 Em `src/services/sessao-treino-storage.ts`, implementar `registrarSerieConcluida(params: { perfilId, treinoId, exercicioId, serie: SerieRealizada, totalSeriesDoExercicio: number }): Promise<SessaoTreino>`: lê o array de sessões do perfil (ou `[]` se ausente); localiza a sessão do `treinoId` ou cria uma nova (`iniciadaEm` = `new Date().toISOString()`, `finalizadaEm: null`, `execucoes: []`, conforme research.md Decisão 3 — a sessão só é criada na primeira série concluída); localiza a `ExecucaoExercicio` do `exercicioId` ou cria uma nova (`seriesRealizadas: []`, `status: 'em_andamento'`); anexa `serie` ao final de `seriesRealizadas`; recalcula `status` como `'concluido'` quando `seriesRealizadas.length === totalSeriesDoExercicio`, senão `'em_andamento'`; persiste o array inteiro de volta em `sessoes:${perfilId}` via `AsyncStorage.setItem`; retorna a sessão atualizada (depende de T005)
- [X] T007 Em `src/services/sessao-treino-storage.ts`, implementar `marcarExercicioConcluido(params: { perfilId, treinoId, exercicioId }): Promise<SessaoTreino>`: localiza a sessão e a execução correspondentes (ambas já devem existir — lançar erro se não existirem, já que só é chamada após `registrarSerieConcluida` ter marcado a última série), garante `status: 'concluido'` (idempotente) sem alterar `finalizadaEm` da sessão (permanece `null`), persiste de volta em `sessoes:${perfilId}` (depende de T006)

**Checkpoint**: O serviço de persistência de sessão está completo e testável isoladamente (chamadas diretas) — as user stories podem começar

---

## Phase 3: User Story 1 - Concluir uma série e avançar automaticamente para a próxima (Priority: P1) 🎯 MVP

**Goal**: Habilitar "Concluir série" apenas com carga+reps preenchidos; ao tocar, registrar a série (memória + persistência) e avançar para a próxima série do exercício

**Independent Test**: Iniciar um exercício com múltiplas séries, preencher carga e reps da série 1, tocar em "Concluir série", e confirmar que o indicador avança para "Série 2 de N", que os dados da série 1 ficam registrados, e que a carga da série 2 vem pré-preenchida com o valor usado na série 1

### Implementation for User Story 1

- [X] T008 [US1] Em `src/components/treino/exercicio-execucao.tsx`, adicionar a validação de habilitação do botão "Concluir série": desabilitado quando `estado.cargaKg` ou `estado.repsFeitas` estiverem vazios (string vazia), habilitado quando ambos estiverem preenchidos, conforme FR-001/FR-002
- [X] T009 [US1] Em `src/components/treino/exercicio-execucao.tsx`, adicionar o botão "Concluir série" (visível apenas quando `estado.iniciado === true` e `estado.concluido === false`) com handler que: converte `cargaKg`/`repsFeitas` de string para `number`; monta um `SerieRealizada` com `serie: estado.serieAtual`; chama `onConcluirSerie(serie)` (novo callback via props, análogo a `onAtualizarEstado`), delegando ao componente pai a persistência e o cálculo de avanço de série, conforme [research.md](./research.md) Decisão 2 (depende de T008)
- [X] T010 [US1] Em `src/app/treino/[treinoId].tsx`, implementar o handler `handleConcluirSerie(exercicioId, serie: SerieRealizada)`: chama `registrarSerieConcluida({ perfilId: perfilAtivo.id, treinoId, exercicioId, serie, totalSeriesDoExercicio: exercicio.series })` (`@/services/sessao-treino-storage`); com o resultado, atualiza `estadosPorExercicio[exercicioId]` em memória — anexa `serie` a `seriesConcluidas`; se `seriesConcluidas.length < exercicio.series`, incrementa `serieAtual`, copia `serie.cargaKg` (convertido para string) para o novo `cargaKg`, e limpa `repsFeitas` (FR-004); se atingiu o total, marca `concluido: true` sem alterar `serieAtual` (depende de T006, T009)
- [X] T011 [US1] Em `src/app/treino/[treinoId].tsx`, passar `onConcluirSerie={handleConcluirSerie}` para `ExercicioExecucao`, junto dos props já existentes (depende de T010)
- [X] T012 [US1] Em `src/components/treino/exercicio-execucao.tsx`, ao concluir uma série (dentro do handler de T009, após persistir), disparar um evento/log de "início do descanso" sem UI própria — por exemplo, uma chamada a uma função `onIniciarDescanso?: () => void` (prop opcional, sem implementação de UI nesta feature) ou um comentário explícito indicando o ponto de extensão para o RF05/RF06, conforme FR-005 e a Assumption de que o cronômetro em si é escopo futuro (depende de T009)

**Checkpoint**: Concluir uma série registra os dados, persiste em `AsyncStorage`, e avança corretamente o indicador de série com a carga pré-preenchida — US1 é funcional e testável isoladamente

---

## Phase 4: User Story 2 - Concluir um exercício ao terminar todas as suas séries (Priority: P1)

**Goal**: Habilitar "Concluir exercício" na última série; ao tocar, persistir a conclusão e voltar para a lista com o exercício marcado como concluído

**Independent Test**: Concluir todas as séries planejadas de um exercício (via US1, repetida N vezes), confirmar que "Concluir exercício" fica habilitado, tocar nele e confirmar que a lista volta a ser exibida com aquele item marcado como concluído (✓)

### Implementation for User Story 2

- [X] T013 [US2] Em `src/components/treino/exercicio-execucao.tsx`, adicionar o botão "Concluir exercício", visível/habilitado apenas quando `estado.concluido === true`, com handler que chama `onConcluirExercicio()` (novo callback via props), conforme FR-006/FR-007
- [X] T014 [US2] Em `src/app/treino/[treinoId].tsx`, implementar `handleConcluirExercicio(exercicioId)`: chama `marcarExercicioConcluido({ perfilId: perfilAtivo.id, treinoId, exercicioId })` (`@/services/sessao-treino-storage`); ao concluir, limpa `exercicioSelecionadoId` (retorno à lista, reaproveitando `handleVoltarParaLista` ou equivalente), conforme FR-008 (depende de T007, T013)
- [X] T015 [US2] Em `src/app/treino/[treinoId].tsx`, passar `onConcluirExercicio={() => handleConcluirExercicio(exercicioSelecionado.id)}` para `ExercicioExecucao` (depende de T014)
- [X] T016 [US2] Em `src/components/treino/exercicio-list-item.tsx`, no tipo `EstadoVisualExercicio` (hoje `'naoIniciado' | 'pausado' | 'concluido'`, conforme já definido no RF03), confirmar que o valor `'concluido'` já está implementado com estilo visual distinto (ex.: indicador ✓) — se necessário, ajustar o texto/indicador para refletir claramente "concluído" (verificar se o RF03 já cobre isso adequadamente; caso positivo, esta tarefa se resume a validação sem código novo), conforme FR-009
- [X] T017 [US2] Em `src/app/treino/[treinoId].tsx`, na função que deriva `EstadoVisualExercicio` para cada item da lista, adicionar a checagem: se `estadosPorExercicio[exercicioId]?.concluido === true`, retornar `'concluido'` (tem precedência sobre `'pausado'`); caso contrário, manter a lógica já existente (`'pausado'` se iniciado, `'naoIniciado'` caso contrário), conforme FR-009 (depende de T004, T016)

**Checkpoint**: Concluir um exercício persiste a conclusão e atualiza a lista corretamente — US1 e US2 funcionam juntas e isoladamente

---

## Phase 5: User Story 3 - Escolher livremente qual exercício fazer a seguir (Priority: P1)

**Goal**: Garantir que a navegação livre entre exercícios (já existente no RF03) continua funcionando após a introdução de exercícios concluídos/pausados com persistência

**Independent Test**: Com um exercício concluído e outro pausado, tocar no pausado (não no "próximo da lista") e confirmar que retoma corretamente da série seguinte; tocar em um não iniciado pulando outro disponível e confirmar que abre normalmente

### Implementation for User Story 3

- [X] T018 [US3] Em `src/app/treino/[treinoId].tsx`, confirmar (e ajustar se necessário) que `handleSelecionarExercicio` continua permitindo tocar em qualquer exercício da lista — incluindo os já `'concluido'` ou `'pausado'` — sem nenhuma checagem de ordem ou bloqueio, reaproveitando a lógica já existente do RF03 (FR-010); nenhuma mudança de comportamento é esperada aqui além de garantir que a nova dimensão de estado (`concluido`) não introduziu nenhum bloqueio acidental
- [X] T019 [US3] Em `src/app/treino/[treinoId].tsx`, ao selecionar um exercício com execução já existente em `estadosPorExercicio` (seja pausado ou recém-criado a partir de uma sessão persistida — ver US4/T021), confirmar que `exercicioSelecionadoId` é definido normalmente e que `ExercicioExecucao` recebe o estado correto (`seriesConcluidas`, `serieAtual`, `concluido`) para retomar exatamente de onde parou, sem resetar nada (depende de T004, T010)

**Checkpoint**: A navegação livre entre exercícios (concluídos, pausados ou não iniciados) funciona sem restrição de ordem — US1, US2 e US3 funcionam juntas e isoladamente

---

## Phase 6: User Story 4 - Retomar o progresso após sair da tela ou fechar o app (Priority: P2)

**Goal**: Ao montar a rota, reconstruir `estadosPorExercicio` a partir da sessão persistida em `AsyncStorage`, para que o progresso sobreviva a fechamentos completos do app

**Independent Test**: Concluir 1+ séries de um exercício (sem concluí-lo), fechar o app completamente, reabri-lo e navegar de volta ao mesmo treino; confirmar que o exercício aparece pausado com a série seguinte correta e os dados da série concluída preservados

### Implementation for User Story 4

- [X] T020 [US4] Em `src/app/treino/[treinoId].tsx`, no `useEffect` que carrega o treino, adicionar a chamada a `obterSessao(perfilAtivo.id, treinoId)` (`@/services/sessao-treino-storage`) logo após `listarTreinos` resolver, conforme [contracts/tela-execucao-conclusao.md](./contracts/tela-execucao-conclusao.md) "Consumo de sessao-treino-storage.ts" (depende de T005)
- [X] T021 [US4] Em `src/app/treino/[treinoId].tsx`, a partir da `SessaoTreino` obtida em T020 (se não for `null`), construir o `estadosPorExercicio` inicial: para cada `ExecucaoExercicio` em `sessao.execucoes`, criar um `EstadoExecucaoExercicio` com `iniciado: true`, `seriesConcluidas` = `execucao.seriesRealizadas`, `serieAtual` = `execucao.seriesRealizadas.length + 1` (ou o próprio total de séries se `status === 'concluido'`), `concluido` = `execucao.status === 'concluido'`, e `cargaKg` pré-preenchido com `String(ultimaSerie.cargaKg)` da última entrada de `seriesRealizadas` (ou vazio se `concluido`), conforme [data-model.md](./data-model.md) "Fluxo de carregamento" (depende de T004, T020)
- [X] T022 [US4] Em `src/app/treino/[treinoId].tsx`, garantir que ao montar a rota (com ou sem sessão existente) a tela sempre exibe primeiro a lista de exercícios, nunca abre diretamente dentro de um exercício específico — confirmando o comportamento já natural da estrutura existente (`exercicioSelecionadoId` inicia `null`), conforme FR-014 (nenhuma mudança de código esperada além de um comentário/asserção explícita se necessário)

**Checkpoint**: Fechar e reabrir o app preserva integralmente o progresso de séries e exercícios concluídos — todas as user stories (US1–US4) funcionam de ponta a ponta

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validação final e conformidade com a Constituição do projeto

- [ ] T023 Executar os cenários 1 a 6 do [quickstart.md](./quickstart.md) manualmente em um dispositivo Android (Redmi Note 12) e em um dispositivo iOS (iPhone 16 Plus) via Expo Go, com atenção especial ao Cenário 6 (bloqueio de troca de perfil via RF10, que depende da escrita correta desta feature na chave `sessoes:<perfilId>`) e ao Cenário 5 (múltiplas sessões simultâneas), documentando qualquer divergência entre plataformas (Princípio III da Constituição) — **PARCIAL**: validado no Redmi Note 12 (Android) em 2026-09-18, todos os cenários OK, incluindo os ajustes pós-implementação (cores verde/amarelo, mensagem "já foi feito", "parabéns pelo treino", correção do bug de campos editáveis após a última série). **PENDENTE**: validação equivalente no iPhone 16 Plus (iOS) ainda não realizada — feature não pode ser considerada totalmente concluída até essa segunda validação (Princípio III, não-negociável quanto aos dois aparelhos-alvo)
- [X] T024 [P] Rodar type-check (`npx tsc --noEmit`) confirmando ausência de `any` implícito em todo o código desta feature, conforme Princípio I da Constituição
- [X] T025 [P] Confirmar, por inspeção de código, que toda leitura/escrita de sessão nesta feature passa exclusivamente por `sessao-treino-storage.ts` usando `perfilAtivo.id`, e que nenhuma chave `sessoes:<perfilId>` é lida/escrita fora do padrão esperado por `existeSessaoEmAndamento` (RF10), conforme Princípio V da Constituição e [contracts/sessao-treino-storage.md](./contracts/sessao-treino-storage.md)
- [X] T026 [P] Confirmar, por inspeção de código, que nenhuma dependência nova foi introduzida (apenas `@react-native-async-storage/async-storage` e `expo-crypto`, já aprovadas), conforme Princípio IV da Constituição

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: Depende da conclusão do Setup (T001) — BLOQUEIA todas as user stories
- **User Stories (Phase 3–6)**: Todas dependem da conclusão da Fase Foundational
  - US1 (P1) → US2 (P1): sequência natural — "Concluir exercício" só existe depois que "Concluir série" já marca `concluido: true` na última série
  - US3 (P1) depende de US1/US2 apenas para ter exercícios em diferentes estados para testar; a lógica de navegação livre em si já é herdada do RF03 sem mudança estrutural
  - US4 (P2) depende de US1/US2 para haver dados persistidos a recarregar, mas sua implementação (T020–T022) é tecnicamente independente e poderia ser feita em paralelo a US2/US3 caso a equipe tenha capacidade
- **Polish (Phase 7)**: Depende de todas as user stories desejadas estarem completas

### User Story Dependencies

- **US1 (P1)**: Depende da Fase Foundational (T001–T007)
- **US2 (P1)**: Depende de US1 (o estado `concluido: true`, produzido por `registrarSerieConcluida`/T010, é pré-requisito para habilitar "Concluir exercício")
- **US3 (P1)**: Depende de US1 e US2 para ter cenários de teste completos (exercício concluído + pausado), mas não introduz nenhuma lógica nova própria — é majoritariamente validação
- **US4 (P2)**: Depende da Fase Foundational (usa `obterSessao`, T005) e conceitualmente de US1/US2 para haver progresso a restaurar; implementação (T020–T022) não depende de código de US2/US3

> Nota: assim como no RF03, esta feature tem uma única tela com fluxo de estado sequencial; US1→US2 têm dependência natural de dados (não apenas de prioridade). Ainda assim, cada Checkpoint é validável isoladamente antes de avançar.

### Parallel Opportunities

- T001 (Setup) não tem paralelo nesta fase pequena; T002 depende de T001
- Dentro da Foundational, T003 deve vir antes de T004–T007 (todos dependem dos tipos); T005→T006→T007 são sequenciais (mesmo arquivo, funções que se apoiam)
- T024, T025, T026 (Polish) podem rodar em paralelo entre si — arquivos/inspeções independentes
- T023 (validação manual) pode rodar em paralelo com T024–T026 (execução automatizada vs. manual)

---

## Parallel Example: Polish

```bash
# Fase 7, em paralelo:
Task: "Rodar npx tsc --noEmit"
Task: "Inspecionar uso exclusivo de sessao-treino-storage.ts para leitura/escrita de sessão"
Task: "Confirmar ausência de dependências novas"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Fase 1: Setup (mover `SessaoRegistro`)
2. Completar Fase 2: Foundational (tipos + `sessao-treino-storage.ts`) — CRÍTICO
3. Completar Fase 3: US1 (concluir série, avançar, persistir)
4. **PARAR e VALIDAR**: rodar o Cenário 1 do quickstart.md em Android e iOS
5. Este já é um incremento funcional: séries são registradas e persistidas corretamente

### Incremental Delivery

1. Setup + Foundational → serviço de sessão pronto e compatível com o RF10
2. US1 → concluir série, avançar, persistir → validar (Cenário 1)
3. US2 → concluir exercício, voltar à lista marcado como concluído → validar (Cenário 2)
4. US3 → confirmar navegação livre com estados variados → validar (Cenário 3)
5. US4 → retomar progresso após fechar o app → validar (Cenário 4) — **RF04 completo aqui**
6. Polish → Cenários 5 (múltiplas sessões) e 6 (bloqueio de troca de perfil via RF10) +
   validação cruzada Android/iOS + revisão de tipagem/dependências/isolamento por perfil

---

## Notes

- [P] tarefas = arquivos diferentes (ou inspeções independentes), sem dependência entre si
- [Story] identifica a qual user story a tarefa pertence, para rastreabilidade
- A chave `sessoes:<perfilId>` já existe e já é lida pelo RF10 (`existeSessaoEmAndamento`) —
  T001/T002 são uma mudança mínima e aditiva no RF10 para permitir `SessaoTreino extends
  SessaoRegistro`, garantindo em tempo de compilação que esta feature nunca diverge do
  contrato já consumido pelo RF10 (research.md, Decisão 1)
- Nenhuma tarefa desta feature preenche `finalizadaEm` (permanece sempre `null`) — isso é
  escopo exclusivo do RF07
- Nenhuma tarefa desta feature permite editar séries já concluídas (RF09) nem indica sessão
  em andamento na lista de treinos do RF02 (decisão adiada) — ambos fora de escopo (spec.md,
  Assumptions)
- Avançar automaticamente para o próximo exercício ao concluir um (em vez de voltar à lista)
  não é o comportamento desta feature — o retorno à lista após "Concluir exercício" é
  intencional (FR-008), preservando a escolha livre do usuário (US3)
