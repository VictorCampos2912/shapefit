---

description: "Task list for spec 014 — Vibração Diferenciada ao Fim do Descanso"
---

# Tasks: Vibração Diferenciada ao Fim do Descanso

**Input**: Design documents from `/specs/014-vibracao-fim-descanso/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/treinoId-screen.md, quickstart.md

**Tests**: Sem suíte de testes automatizados — validação manual em Android e iOS
(única forma de verificar vibração; não há proxy via web/emulador).

**Organization**: Tarefas agrupadas por User Story (spec.md).

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Toda a mudança fica em `src/app/treino/[treinoId].tsx`.

---

## Phase 1: Setup

- [X] T001 Confirmar que `Vibration` está disponível via `import { Vibration } from
      'react-native';` — sem dependência nova a instalar.

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T002 Adicionar `const PADRAO_VIBRACAO_FIM_DESCANSO = [0, 500, 200, 500, 200,
      500];` como constante de módulo em `src/app/treino/[treinoId].tsx`
      (`contracts/treinoId-screen.md`). Depende de T001.

**Checkpoint**: constante pronta para uso pela User Story 1.

---

## Phase 3: User Story 1 - Sentir claramente que o descanso acabou, com o app aberto (Priority: P1) 🎯 MVP

**Goal**: Vibração perceptível dispara no momento exato em que o descanso termina.

**Independent Test**: quickstart.md, Cenários 1 e 2.

### Implementation for User Story 1

- [X] T003 [US1] Em `handleDescansoConcluido` (`src/app/treino/[treinoId].tsx`),
      adicionar `Vibration.vibrate(PADRAO_VIBRACAO_FIM_DESCANSO);` (FR-001, FR-002;
      `contracts/treinoId-screen.md`). Depende de T002.

**Checkpoint**: User Story 1 implementada — vibração dispara tanto na contagem normal
chegando a zero quanto no ajuste manual (-15s) que zera o tempo (mesma função,
Decisão 3 do `research.md`). **Não verificável sem aparelho físico** (falta T006).

---

## Phase 4: User Story 2 - Não duplicar vibração em segundo plano (Priority: P2)

**Goal**: Confirmar que o comportamento em segundo plano não muda.

**Independent Test**: quickstart.md, Cenário 3.

### Implementation for User Story 2

- [ ] T004 [US2] Validar manualmente, em Android e iOS, que colocar o app em segundo
      plano antes do descanso terminar continua produzindo só a vibração já existente
      da notificação — nenhuma mudança de código necessária (garantido pela
      arquitetura, `research.md` Decisão 4); tarefa de verificação. Depende de T003.

**Checkpoint**: as duas User Stories completas e validadas.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T005 [P] Rodar `npx tsc --noEmit` e `npx eslint` sobre
      `src/app/treino/[treinoId].tsx` — zero erros novos. Confirmado.
- [ ] T006 Rodar os 4 cenários de `quickstart.md` em Android (Redmi Note 12) e iOS
      (iPhone 16 Plus), com vibração ativada nas configurações do aparelho —
      Princípio III da constituição. **Único caminho de validação** — não há proxy
      via web/Playwright para vibração.
- [ ] T007 Atualizar `docs/criterios-aceite.md`, seção "Melhorias
      pós-desenvolvimento", marcando esta feature como implementada e validada.
- [ ] T008 Atualizar o cabeçalho de `specs/014-vibracao-fim-descanso/spec.md`
      (**Status**) para "Implemented" após T006 confirmar a validação nos dois
      aparelhos.

---

## Dependencies & Execution Order

- **Setup → Foundational → US1 → US2 → Polish**, estritamente sequencial — feature
  pequena demais para paralelismo real entre fases de código (T005 pode rodar em
  paralelo com T006).

---

## Implementation Strategy

1. Setup + Foundational → constante pronta.
2. US1 → vibração dispara (é o MVP desta feature).
3. US2 → validação de não-regressão em segundo plano.
4. Polish → type-check/lint, validação obrigatória nos dois aparelhos físicos,
   documentação.

---

## Fase 6: Correção pós-teste (2026-09-23)

**Purpose**: Bug real reportado pelo usuário ao testar T004/T006 no iPhone —
vibração forte disparava de novo ao reabrir o app depois do descanso ter zerado em
segundo plano (violava US2/FR-003). Ver `research.md`, Decisão 5.

- [X] T009 Adicionar `useRef` (`voltouDeSegundoPlanoRef`) e o parâmetro
      `deveVibrar` em `handleDescansoConcluido`, suprimindo a vibração quando a
      detecção do zero vem de uma retomada de segundo plano
      (`contracts/treinoId-screen.md`).
- [X] T010 Corrigir `handleFinalizarTreino` para chamar
      `handleDescansoConcluido(false)` — efeito colateral encontrado durante T009
      (finalizar o treino manualmente também disparava a vibração por engano).
- [X] T011 [P] Rodar `npx tsc --noEmit` e `npx eslint` sobre
      `src/app/treino/[treinoId].tsx` — zero erros novos. Confirmado.
- [X] T012 Reconfirmar T004/T006 nos dois aparelhos após a correção (Cenário 3 e 5
      do `quickstart.md` atualizado). **Confirmado pelo usuário**: sem vibração
      dupla ao reabrir do segundo plano ou desbloquear.

---

## Fase 7: Unificar padrão de vibração entre app aberto e notificação (2026-09-23)

**Purpose**: Pedido do usuário após comparar as duas vibrações lado a lado durante o
teste — a da notificação (segundo plano) ainda usava o padrão simples antigo,
diferente do padrão forte usado com o app aberto. Ver `research.md`, Decisão 6.

- [X] T013 Criar `src/constants/vibracao.ts` com `PADRAO_VIBRACAO_FIM_DESCANSO`
      compartilhado; remover a constante duplicada de
      `src/app/treino/[treinoId].tsx`, importando da nova constante
      (`contracts/treinoId-screen.md`).
- [X] T014 Atualizar `src/services/notificacao-descanso.ts`: canal de notificação
      passa a usar `PADRAO_VIBRACAO_FIM_DESCANSO`; id do canal muda de
      `descanso-v3` para `descanso-v4` (canais Android não atualizam
      `vibrationPattern` in-place — `contracts/notificacao-descanso.md`).
- [X] T015 [P] Rodar `npx tsc --noEmit` e `npx eslint` sobre os arquivos alterados
      — zero erros novos. Confirmado.
- [ ] T016 Validar nos dois aparelhos: vibração em segundo plano (notificação) e em
      primeiro plano devem sentir-se idênticas agora (Cenário 1 e 3 atualizados do
      `quickstart.md`).
