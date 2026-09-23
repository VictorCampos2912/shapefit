---

description: "Task list for spec 013 — Conclusão Explícita de Sessão de Treino"
---

# Tasks: Conclusão Explícita de Sessão de Treino

**Input**: Design documents from `/specs/013-nova-sessao-treino/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/treinoId-screen.md, quickstart.md

**Tests**: Sem suíte de testes automatizados neste projeto — validação manual em
Android e iOS (Princípio III da constituição).

**Organization**: Tarefas agrupadas por User Story (spec.md).

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Projeto mobile único (Expo Router) — toda a mudança fica em um único arquivo,
`src/app/treino/[treinoId].tsx`.

---

## Phase 1: Setup

- [X] T001 Ler o estado atual de `src/app/treino/[treinoId].tsx` (função
      `ExecucaoTreinoScreen`, o `useEffect` de auto-finalização e o bloco de botões da
      lista de exercícios) antes de alterar — sem dependência nova, sem estrutura de
      projeto nova.

**Checkpoint**: nenhuma ação de setup adicional necessária.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Estado que as três User Stories dependem.

- [X] T002 Adicionar `const [sessaoFinalizadaAutomaticamente, setSessaoFinalizadaAutomaticamente] = useState(false);`
      em `src/app/treino/[treinoId].tsx` (`data-model.md`).

**Checkpoint**: estado novo disponível para as User Stories.

---

## Phase 3: User Story 1 - Ver a conquista de concluir todos os exercícios (Priority: P1) 🎯 MVP

**Goal**: A lista de exercícios permanece estável, toda marcada como concluída, após
o último exercício ser concluído — sem resetar sozinha.

**Independent Test**: quickstart.md, Cenário 1.

### Implementation for User Story 1

- [X] T003 [US1] Reescrever o `useEffect` de auto-finalização em
      `src/app/treino/[treinoId].tsx`: quando `todosConcluidos && sessaoAtualId !==
      null && !sessaoFinalizadaAutomaticamente && perfilAtivo`, marcar
      `setSessaoFinalizadaAutomaticamente(true)` e chamar
      `finalizarSessao(perfilAtivo.id, sessaoAtualId)` — **sem** resetar
      `estadosPorExercicio`, `sessaoAtualId` nem `exercicioSelecionadoId`
      (`research.md` Decisão 1 e 2; `contracts/treinoId-screen.md`). Depende de T002.
- [X] T004 [US1] Extrair a expressão `treino.exercicios.every((item) =>
      estadosPorExercicio[item.id]?.concluido)` (hoje inline no JSX) para uma
      constante `todosConcluidos` no corpo do componente, reaproveitada pelo efeito
      (T003) e pelas condições de renderização; ajustar a condição do botão
      "Finalizar treino" existente para `sessaoAtualId && !todosConcluidos`
      (`research.md` Decisão 3). Depende de T003.
- [X] T004b [US1] Corrigir `marcarExercicioConcluido`
      (`src/services/sessao-treino-storage.ts`) para localizar a sessão por
      `sessaoId` (parâmetro novo, no lugar de `treinoId` + "sessão em andamento") —
      bug encontrado ao testar T003: com a tela não resetando mais sozinha, apertar
      "Concluir exercício" do **último** exercício de uma sessão acontece depois da
      sessão já ter sido finalizada automaticamente, e a busca antiga (exigia
      `finalizadaEm === null`) não encontrava mais a sessão (`research.md`, Decisão
      5; `contracts/treinoId-screen.md`). Ajustar o chamador
      (`handleConcluirExercicio`) para passar `sessaoAtualId`. Depende de T003.

**Checkpoint**: User Story 1 completa — validada via web (Playwright, proxy):
concluir o último exercício de um treino de 2 exercícios/1 série mantém a lista toda
verde, banner de parabéns visível, "Finalizar treino" some, e "Concluir exercício" do
último exercício não quebra mais (bug T004b confirmado corrigido, sem PAGEERROR).
**Falta validação real em Android e iOS** (T009).

---

## Phase 4: User Story 2 - Decidir quando começar uma nova sessão do mesmo treino (Priority: P1)

**Goal**: Um botão explícito "Nova sessão de Treino" reseta a tela, só quando o
usuário pedir.

**Independent Test**: quickstart.md, Cenário 2.

### Implementation for User Story 2

- [X] T005 [US2] Implementar `handleNovaSessaoDeTreino` em
      `src/app/treino/[treinoId].tsx`: reseta `sessaoAtualId`,
      `estadosPorExercicio`, `exercicioSelecionadoId` e
      `sessaoFinalizadaAutomaticamente` (`contracts/treinoId-screen.md`). Depende de
      T002.
- [X] T006 [US2] Renderizar o botão "Nova sessão de Treino" (componente `Button`,
      `src/components/ui/button.tsx`, variante `primary` — mesmo padrão visual do
      "Iniciar exercício") com condição `sessaoAtualId && todosConcluidos`, chamando
      `handleNovaSessaoDeTreino` ao ser pressionado. Depende de T004 (constante
      `todosConcluidos`) e T005.

**Checkpoint**: User Story 2 completa — validada via web: com a lista toda verde,
clicar em "Nova sessão de Treino" volta a tela para o estado inicial (nenhum
exercício concluído, banner e botões somem), sem nada acontecer sozinho antes do
clique. **Falta validação real em Android e iOS** (T009).

---

## Phase 5: User Story 3 - Contagem de sessões finalizadas continua correta (Priority: P1)

**Goal**: Confirmar que o contador (RF07) e o histórico (RF08) não dependem do botão
"Nova sessão de Treino".

**Independent Test**: quickstart.md, Cenário 3.

### Implementation for User Story 3

- [ ] T007 [US3] Validar manualmente, em Android e iOS, que o contador de sessões
      finalizadas e o histórico de evolução (RF08) atualizam corretamente assim que o
      último exercício é concluído — mesmo sem o usuário apertar "Nova sessão de
      Treino" em seguida. Comportamento já garantido por T003 (finalização continua
      automática); esta tarefa é de verificação, não de código novo (FR-001, SC-002).
      Depende de T003. **Pré-validado via web**: contador foi de 0 para 1 assim que o
      último exercício foi concluído, sem apertar o botão — falta confirmar em
      Android e iOS.

**Checkpoint**: todas as três User Stories completas e validadas.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T008 [P] Rodar `npx tsc --noEmit` e `npx eslint` sobre
      `src/app/treino/[treinoId].tsx` — zero erros novos. Confirmado: também rodado
      sobre `src/services/sessao-treino-storage.ts` (T004b), ambos limpos.
- [ ] T009 Rodar os 4 cenários de `quickstart.md` em Android (Redmi Note 12) e iOS
      (iPhone 16 Plus) — Princípio III da constituição.
- [ ] T010 Atualizar `docs/criterios-aceite.md`, seção "Melhorias pós-desenvolvimento",
      marcando esta feature como implementada e validada.
- [ ] T011 Atualizar o cabeçalho de `specs/013-nova-sessao-treino/spec.md`
      (**Status**) para "Implemented" após T009 confirmar a validação nos dois
      aparelhos.

---

## Fase 7: Correção pós-teste (2026-09-23)

**Purpose**: Bug real reportado pelo usuário após testar RF12 em Android e iOS —
sair da tela de execução e voltar resetava a sessão sozinha, mesmo sem apertar
"Nova sessão de Treino" (violava FR-002/FR-007). Ver `research.md`, Decisão 6.

- [X] T012 Adicionar `revisadaPeloUsuario: boolean` a `SessaoTreino`
      (`src/types/execucao-treino.ts`); `registrarSerieConcluida` passa a criar
      sessões com `revisadaPeloUsuario: false` (`data-model.md`).
- [X] T013 Implementar `obterUltimaSessaoConcluidaNaoRevisada` e
      `marcarSessaoRevisada` em `src/services/sessao-treino-storage.ts`
      (`contracts/treinoId-screen.md`). Depende de T012.
- [X] T014 Ajustar o efeito de montagem em `src/app/treino/[treinoId].tsx` para
      consultar `obterUltimaSessaoConcluidaNaoRevisada` quando não houver sessão em
      andamento, hidratando a tela como concluída se encontrar uma. Depende de T013.
- [X] T015 Chamar `marcarSessaoRevisada` em `handleNovaSessaoDeTreino` e
      `handleFinalizarTreino`, antes de resetar o estado local. Depende de T013.
- [X] T016 [P] Rodar `npx tsc --noEmit` e `npx eslint` sobre os arquivos alterados
      — zero erros novos. Confirmado.
- [X] T017 Validar via web (Playwright): concluir um treino, navegar para outra aba
      e voltar (deve continuar tudo verde), depois apertar "Nova sessão de Treino"
      e navegar/voltar de novo (deve continuar resetado). **Confirmado exatamente
      como reportado pelo usuário** — falta reconfirmar em Android/iOS (junto com
      T009).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sem dependências.
- **Foundational (Fase 2)**: depende da Fase 1 — bloqueia as User Stories.
- **US1 (Fase 3)**: depende só da Fase 2.
- **US2 (Fase 4)**: depende da Fase 2 (T002) e de T004 (constante `todosConcluidos`,
  extraída em US1) — não é totalmente paralela a US1 desta vez, já que ambas mexem no
  mesmo bloco de condições de renderização.
- **US3 (Fase 5)**: depende de T003 (US1) — precisa da finalização automática já
  reescrita para ter o que validar.
- **Polish (Fase 6)**: depende de todas as User Stories completas.

### Parallel Opportunities

- Nenhuma — todas as tarefas de código tocam o mesmo arquivo
  (`src/app/treino/[treinoId].tsx`) e têm dependências sequenciais entre si. T008
  (type-check/lint) pode rodar em paralelo com T009 (validação manual).

---

## Implementation Strategy

### MVP First (User Story 1)

1. Fase 1 → Fase 2 → Fase 3 (US1).
2. **Parar e validar**: quickstart.md Cenário 1 — a lista já fica estável e verde,
   mesmo sem o botão "Nova sessão de Treino" ainda existir (o usuário ficaria "preso"
   nesse estado, mas o comportamento problemático original já estaria corrigido).

### Entrega Incremental

1. Setup + Foundational → base pronta.
2. US1 → lista estável (correção do bug relatado).
3. US2 → botão de reset explícito (completa o fluxo).
4. US3 → validação de não-regressão do contador/histórico.
5. Polish → type-check/lint, validação nos dois aparelhos, documentação.
