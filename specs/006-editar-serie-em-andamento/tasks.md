---

description: "Task list template for feature implementation"
---

# Tasks: Editar Registro de Série Já Feito (Sessão em Andamento)

**Input**: Design documents from `/specs/006-editar-serie-em-andamento/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Nenhum framework de testes automatizados está configurado no projeto (ver
plan.md, Technical Context → Testing). A validação desta feature é manual, em Android e
iOS via Expo Go (Constituição, Princípio III), conforme roteiro em quickstart.md — nenhuma
tarefa de teste automatizado é gerada.

**Organization**: Tarefas agrupadas pelas duas user stories da spec (US1 = P1, US2 = P2).
Toda a feature é uma extensão aditiva de 3 arquivos já existentes do RF04
(`sessao-treino-storage.ts`, `exercicio-execucao.tsx`, `[treinoId].tsx`) — não há novos
tipos, rotas ou dependências (ver plan.md, Project Structure).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: A qual user story esta tarefa pertence (US1 ou US2)
- Caminhos de arquivo exatos estão incluídos em cada descrição

## Path Conventions

Projeto único (Expo Router) — `src/` na raiz do repositório, conforme plan.md:
- `src/services/sessao-treino-storage.ts`
- `src/components/treino/exercicio-execucao.tsx`
- `src/app/treino/[treinoId].tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Nenhuma inicialização de projeto é necessária — todas as dependências
(Expo SDK 57, React Native 0.86, `@react-native-async-storage/async-storage`) já estão
instaladas e em uso desde RF01/RF04 (ver plan.md, Primary Dependencies). Não há tarefa de
setup para esta feature.

*(Fase intencionalmente vazia — nenhuma nova dependência ou estrutura de projeto é
introduzida, conforme research.md e Constituição Princípio IV.)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Criar a função de persistência compartilhada que ambas as user stories (US1 e
US2) usam para gravar uma edição de série. Esta é a única peça verdadeiramente bloqueante —
nenhuma UI de edição tem o que chamar sem ela.

**⚠️ CRITICAL**: Nenhuma tarefa de US1/US2 pode ser validada de ponta a ponta até T001 estar
completa (a UI pode ser construída em paralelo, mas não pode ser testada sem o serviço).

- [X] T001 Adicionar `atualizarSerieRealizada` em `src/services/sessao-treino-storage.ts`:
  função `atualizarSerieRealizada(params: { perfilId: string; treinoId: string;
  exercicioId: string; serie: number; novaCargaKg: number; novosReps: number }):
  Promise<SessaoTreino>`, seguindo exatamente o contrato em
  [contracts/sessao-treino-storage.md](./contracts/sessao-treino-storage.md): localiza a
  `SessaoTreino` por `treinoId` (lança `Error` se não encontrada), a `ExecucaoExercicio`
  por `exercicioId` (lança `Error` se não encontrada), a `SerieRealizada` por `serie`
  dentro de `seriesRealizadas` (lança `Error` se não encontrada), substitui **apenas**
  `cargaKg` e `reps` do objeto encontrado pelos novos valores — MUST NOT alterar `serie`,
  `status` da execução, `finalizadaEm`/`iniciadaEm`/`treinoId` da sessão, nem a ordem ou
  quantidade de itens em `seriesRealizadas`/`execucoes`; persiste via `setSessoes` (já
  existente/privada no arquivo) e retorna a `SessaoTreino` atualizada, reaproveitando
  `getSessoes`/`setSessoes` já existentes no mesmo padrão de `registrarSerieConcluida` e
  `marcarExercicioConcluido`.

**Checkpoint**: Serviço de persistência pronto — US1 e US2 podem agora ser implementadas
(a UI de ambas depende apenas desta função).

---

## Phase 3: User Story 1 - Corrigir carga ou repetições de uma série já concluída, no mesmo exercício (Priority: P1) 🎯 MVP

**Goal**: A partir da tela de execução (RF04), com o exercício ainda em andamento (não
concluído), o usuário consegue visualizar as séries já concluídas daquele exercício
(incluindo séries anteriores à atual) e editar carga e/ou repetições de qualquer uma delas,
com confirmação obrigatória via `Alert.alert` antes de salvar.

**Independent Test**: Concluir pelo menos duas séries de um exercício (via RF04, deixando a
série 3+ como atual, ainda não concluída); tocar na ação de editar da série 1 (não a atual);
alterar carga e/ou reps; tentar salvar com campo inválido (deve bloquear); preencher valores
válidos e confirmar no `Alert.alert`; verificar que o novo valor aparece imediatamente e
sobrevive a sair/voltar da tela e a fechar/reabrir o app completamente.

### Implementation for User Story 1

- [X] T002 [US1] Em `src/components/treino/exercicio-execucao.tsx`, adicionar estado local
  de edição efêmero (ex.: `useState<{ serie: number; cargaKg: string; reps: string } |
  null>(null)`) para representar qual série concluída está sendo editada e seus valores em
  edição — não persistido em `EstadoExecucaoExercicio` nem em `SessaoTreino` (ver
  data-model.md, "Estado de UI (novo, local ao componente de edição)").

- [X] T003 [US1] Em `src/components/treino/exercicio-execucao.tsx`, no ramo de
  renderização `estado.iniciado && !estado.concluido` (área da série atual), adicionar,
  abaixo dessa área, a lista de séries já concluídas (`estado.seriesConcluidas`, quando
  `.length > 0`) — cada item exibindo o número da série (`serie`), a carga (`cargaKg`) e as
  repetições (`reps`), com um controle (toque no item ou botão "Editar") que inicia a
  edição daquela série específica preenchendo o estado local de T002 com os valores atuais
  — conforme [contracts/ui-edicao-serie.md](./contracts/ui-edicao-serie.md), tabela "Regras
  de exibição", linha `estado.iniciado && !estado.concluido`.

- [X] T004 [US1] Em `src/components/treino/exercicio-execucao.tsx`, ao editar uma série
  (estado local de T002 não nulo), renderizar os campos de edição de carga e repetições
  reaproveitando exatamente `sanitizarCarga`/`sanitizarReps` (já definidas no arquivo, sem
  modificação) nos handlers `onChangeText`, com os mesmos atributos de teclado já usados
  nos campos da série atual (`keyboardType="decimal-pad"`/`inputMode="decimal"` para carga;
  `keyboardType="number-pad"`/`inputMode="numeric"` para reps) — conforme data-model.md,
  passo 2 do "Fluxo de edição".

- [X] T005 [US1] Em `src/components/treino/exercicio-execucao.tsx`, calcular
  `podeSalvarEdicao` (mesma regra de `podeConcluirSerie`: carga e reps do estado de edição
  ambos não vazios após `trim()`) e manter o botão "Salvar edição" desabilitado enquanto
  `podeSalvarEdicao` for falso — nenhum `Alert.alert` deve ser disparado nesse caso,
  conforme [contracts/ui-edicao-serie.md](./contracts/ui-edicao-serie.md), passo 3 do
  "Fluxo de interação", e spec.md FR-004.

- [X] T006 [US1] Em `src/components/treino/exercicio-execucao.tsx`, ao tocar em "Salvar
  edição" com `podeSalvarEdicao === true`, disparar `Alert.alert` (importado de
  `react-native`) com duas opções — cancelar (fecha o alerta, nenhuma chamada de callback,
  estado de edição local permanece ou é descartado sem persistir nada) e confirmar (chama
  `onEditarSerie({ serie: <serie em edição>, cargaKg: Number(<carga sanitizada>), reps:
  Number(<reps sanitizado>) })` e, ao resolver a Promise, fecha o modo de edição local) —
  conforme [contracts/ui-edicao-serie.md](./contracts/ui-edicao-serie.md), passos 4-5 do
  "Fluxo de interação", e spec.md FR-005, FR-007.

- [X] T007 [US1] Em `src/components/treino/exercicio-execucao.tsx`, adicionar
  `onEditarSerie: (serieEditada: SerieRealizada) => Promise<void>` a `ExercicioExecucaoProps`
  (import de `SerieRealizada` já existente no arquivo, de `@/types/execucao-treino`) —
  conforme [contracts/ui-edicao-serie.md](./contracts/ui-edicao-serie.md), seção "Extensão
  de props de `ExercicioExecucao`".

- [X] T008 [US1] Em `src/app/treino/[treinoId].tsx`, importar `atualizarSerieRealizada` de
  `@/services/sessao-treino-storage` (ao lado de `marcarExercicioConcluido`, `obterSessao`,
  `registrarSerieConcluida` já importados) e implementar `handleEditarSerie(exercicioId:
  string, serieEditada: SerieRealizada)`: chama `atualizarSerieRealizada` com `perfilId:
  perfilAtivo.id`, `treinoId: treino.id`, `exercicioId`, `serie: serieEditada.serie`,
  `novaCargaKg: serieEditada.cargaKg`, `novosReps: serieEditada.reps`; ao resolver, localiza
  a `execucao` correspondente na `SessaoTreino` retornada e atualiza
  `estadosPorExercicio[exercicioId].seriesConcluidas` com `execucao.seriesRealizadas` (sem
  alterar `concluido`, `serieAtual`, `cargaKg`/`repsFeitas` da série atual) — código exato
  em [contracts/ui-edicao-serie.md](./contracts/ui-edicao-serie.md), seção "Extensão de
  handler em `[treinoId].tsx`".

- [X] T009 [US1] Em `src/app/treino/[treinoId].tsx`, passar `onEditarSerie={(serie) =>
  handleEditarSerie(exercicioSelecionado.id, serie)}` como prop para `<ExercicioExecucao
  .../>`, ao lado das props já passadas (`onConcluirSerie`, `onConcluirExercicio`, etc.).

**Checkpoint**: Nesta altura, User Story 1 deve estar completamente funcional e testável
independentemente — editar qualquer série concluída de um exercício ainda em andamento,
com confirmação, validação e persistência.

---

## Phase 4: User Story 2 - Editar uma série de um exercício já concluído, sem reabri-lo (Priority: P2)

**Goal**: Reabrir, a partir da lista de exercícios, um exercício já marcado como concluído
(`estado.concluido && jaEstavaConcluidoAoAbrir === true`) para visualizar e editar suas
séries, sem que isso reverta o status de conclusão nem exiba novamente qualquer botão de
conclusão.

**Independent Test**: Concluir um exercício inteiro (todas as séries + "Concluir
exercício"); a partir da lista de exercícios, reabri-lo; verificar que a lista de séries
concluídas aparece com opção de editar, sem botão "Concluir exercício"; editar uma série e
confirmar; voltar para a lista e verificar que o exercício continua marcado como concluído
(✓); fechar e reabrir o app e confirmar que o valor editado persiste e o exercício continua
concluído.

### Implementation for User Story 2

- [X] T010 [US2] Em `src/components/treino/exercicio-execucao.tsx`, no ramo de
  renderização `estado.concluido && jaEstavaConcluidoAoAbrir` (hoje exibe apenas a mensagem
  estática "Este já foi feito, volte no próximo treino"), adicionar a mesma lista de séries
  concluídas com ação de editar já usada em T003 (reaproveitando o mesmo estado local de
  edição de T002 e os mesmos campos/handlers de T004-T006) — sem alterar a mensagem
  estática existente, sem adicionar nenhum botão de conclusão nesse ramo — conforme
  [contracts/ui-edicao-serie.md](./contracts/ui-edicao-serie.md), tabela "Regras de
  exibição", linha `estado.concluido && jaEstavaConcluidoAoAbrir`, e spec.md FR-009.

- [X] T011 [US2] Em `src/components/treino/exercicio-execucao.tsx`, no ramo de
  renderização `estado.concluido && !jaEstavaConcluidoAoAbrir` (mensagem "Todas as séries
  concluídas!" + botão "Concluir exercício", exibido logo após a conclusão da última série
  na mesma visita à tela), adicionar a mesma lista de séries concluídas com ação de editar,
  sem alterar o botão "Concluir exercício" existente nesse ramo — conforme
  [contracts/ui-edicao-serie.md](./contracts/ui-edicao-serie.md), tabela "Regras de
  exibição", linha `estado.concluido && !jaEstavaConcluidoAoAbrir`.

- [X] T012 [US2] Verificar (leitura de código, sem alteração) que
  `handleSelecionarExercicio` em `src/app/treino/[treinoId].tsx` já define
  `reaberturaJaConcluida` a partir de `estadosPorExercicio[exercicioId]?.concluido` antes de
  abrir a tela de execução do exercício selecionado, e que nenhum caminho de código nos
  ramos tocados por T010/T011 chama `marcarExercicioConcluido` ou `registrarSerieConcluida`
  — confirmando que a edição de série é estruturalmente incapaz de alterar `status` do
  exercício ou `finalizadaEm` da sessão, conforme research.md Decisão 3 e spec.md FR-008.

**Checkpoint**: Todas as user stories devem agora estar funcionais independentemente —
edição de série tanto durante a execução ativa (US1) quanto em um exercício já concluído,
reaberto apenas para visualização/edição (US2).

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validação manual completa nos dois aparelhos-alvo, conforme Constituição
Princípio III — não há refatoração, documentação ou otimização adicional prevista para
esta feature (escopo pequeno, aditivo).

- [X] T013 Executar o roteiro completo de [quickstart.md](./quickstart.md) (cenários 1, 2 e
  3) manualmente no Android (Redmi Note 12, ou emulador equivalente) via Expo Go.

- [X] T014 Executar o roteiro completo de [quickstart.md](./quickstart.md) (cenários 1, 2 e
  3) manualmente no iOS (iPhone 16 Plus, ou simulador equivalente) via Expo Go, com atenção
  especial ao comportamento do `Alert.alert` nativo (apresentação diferente de Android) e
  aos campos de `TextInput` numérico/decimal, área com histórico de divergência entre
  plataformas (ver plan.md, Constitution Check, Princípio III) — validado no iPhone 16 Plus,
  todos os cenários OK.

- [X] T015 [P] Rodar o type-check do projeto (`npx tsc --noEmit` ou script equivalente já
  configurado) e confirmar ausência de erros de tipo em todos os arquivos tocados por esta
  feature (`sessao-treino-storage.ts`, `exercicio-execucao.tsx`, `[treinoId].tsx`),
  conforme Constituição Princípio I e Development Workflow & Quality Gates.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Vazia — nenhuma dependência, nenhuma tarefa.
- **Foundational (Phase 2)**: T001 não depende de nada — pode começar imediatamente.
  BLOQUEIA toda validação de ponta a ponta de US1 e US2 (a UI pode ser escrita em paralelo,
  mas não testada sem o serviço).
- **User Stories (Phase 3-4)**: Dependem de T001 (Foundational) para serem testadas de
  ponta a ponta. US1 (T002-T009) e US2 (T010-T012) podem ser desenvolvidas em paralelo por
  pessoas diferentes, já que tocam ramos de renderização distintos dentro do mesmo arquivo
  (`exercicio-execucao.tsx`) — mas como é o mesmo arquivo, colisões de merge são esperadas
  se feitas literalmente em paralelo por duas pessoas; a ordem sequencial (US1 → US2) é
  recomendada para um único desenvolvedor.
- **Polish (Phase 5)**: Depende de US1 e US2 completas (T013/T014 validam ambos os
  cenários).

### User Story Dependencies

- **User Story 1 (P1)**: Depende apenas de T001 (Foundational). Sem dependência de US2.
- **User Story 2 (P2)**: Depende de T001 (Foundational) e reaproveita o estado de edição e
  os campos criados em T002/T004-T006 (US1) — portanto, na prática, **US2 deve ser
  implementada depois de US1** neste projeto (mesmo componente, mesmo mecanismo de edição
  reaproveitado), embora seja uma user story de valor independente e testável isoladamente
  uma vez que a base de T002-T006 já exista.

### Within Each User Story

- T002 (estado local) antes de T003 (usa o estado); T003 antes de T004 (renderiza dentro da
  lista); T004 antes de T005 (calcula a partir dos campos); T005 antes de T006 (só dispara
  `Alert.alert` se puder salvar); T007 (prop) pode ser feita em paralelo a T002-T006 (é só a
  assinatura de tipo), mas precisa estar pronta antes de T009 (uso da prop). T008 depende de
  T001 (chama o serviço) e pode ser feita em paralelo a T002-T007 (arquivos diferentes). T009
  depende de T007 e T008.
- T010/T011 (US2) dependem de T002-T006 (US1) já existirem no componente, pois reaproveitam
  o mesmo estado/campos de edição.

### Parallel Opportunities

- T001 (Foundational) pode ser feita em paralelo a T002-T007 (arquivos diferentes:
  `sessao-treino-storage.ts` vs. `exercicio-execucao.tsx`), mas T008/T009 dependem de T001
  estar concluída para funcionar de fato.
- T015 (type-check) é `[P]` e pode ser executada a qualquer momento após as tarefas de
  código estarem completas, em paralelo a T013/T014 (validação manual, que não depende do
  type-check).

---

## Parallel Example: Foundational + User Story 1 (UI)

```bash
# Podem ser feitas em paralelo, por pessoas diferentes, pois tocam arquivos distintos:
Task: "T001 Adicionar atualizarSerieRealizada em src/services/sessao-treino-storage.ts"
Task: "T002 Adicionar estado local de edição em src/components/treino/exercicio-execucao.tsx"

# T008 e T009 só podem ser finalizadas (testadas) depois que T001 e T007 estiverem prontas.
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 2: Foundational (T001).
2. Completar Phase 3: User Story 1 (T002-T009).
3. **PARAR e VALIDAR**: Rodar os cenários 1 e 3 do quickstart.md (edição durante execução
   ativa + validação de entrada) em ao menos um dos dois aparelhos.
4. Isso já entrega o valor central do RF09a (corrigir um erro de digitação numa série,
   lacuna deixada pelo RF04).

### Incremental Delivery

1. Foundational (T001) → base pronta.
2. User Story 1 (T002-T009) → testar independentemente (cenário 1 e 3 do quickstart) →
   já é um incremento de valor completo (MVP do RF09a).
3. User Story 2 (T010-T012) → testar independentemente (cenário 2 do quickstart) →
   estende a mesma capacidade a exercícios já concluídos.
4. Polish (T013-T015) → validação completa em Android + iOS + type-check.

---

## Notes

- Nenhuma tarefa introduz uma nova dependência, tipo de dado ou rota — toda a feature é
  aditiva sobre os três arquivos já existentes do RF04, conforme plan.md e Constituição
  Princípio II.
- [P] aplicado apenas a T015 (type-check, independente de dispositivo) e à relação entre
  T001 e T002-T007 (arquivos diferentes); as demais tarefas de UI (T003-T011) têm
  dependência sequencial explícita dentro do mesmo arquivo, listada acima.
- Nenhuma tarefa de teste automatizado foi gerada — o projeto não tem framework de testes
  configurado (ver plan.md, Technical Context → Testing) e a spec não solicitou TDD.
- Validar que T001, ao lançar erro para sessão/execução/série não encontrada, não introduz
  nenhum tratamento de fallback silencioso — condição fora de escopo desta feature (spec.md,
  Edge Cases), consistente com o mesmo padrão de erro já usado por `marcarExercicioConcluido`.
