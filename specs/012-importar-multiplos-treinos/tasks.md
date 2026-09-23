---

description: "Task list for spec 012 — Importar Múltiplos Treinos de um Único Arquivo"
---

# Tasks: Importar Múltiplos Treinos de um Único Arquivo

**Input**: Design documents from `/specs/012-importar-multiplos-treinos/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/treino-storage.md, quickstart.md

**Tests**: Sem suíte de testes automatizados neste projeto (validação manual em Android
e iOS, Princípio III da constituição) — nenhuma tarefa de teste automatizado é gerada,
consistente com todas as specs anteriores do projeto.

**Organization**: Tarefas agrupadas por User Story (spec.md), permitindo implementação
e teste independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa
  incompleta)
- **[Story]**: A qual User Story esta tarefa pertence (US1, US2, US3)

## Path Conventions

Projeto mobile único (Expo Router) — `src/` na raiz do repositório, sem separação
frontend/backend (ver `plan.md`, Project Structure).

---

## Phase 1: Setup

**Purpose**: Confirmar pré-requisitos antes de alterar código.

- [X] T001 Confirmar que o fixture `docs/exemplos/treinos_multiplos.json` (array com 2
      treinos válidos) existe e é JSON válido — usado pelos Cenários 1 e 3 do
      `quickstart.md`. Sem dependência nova a instalar e sem estrutura de projeto nova
      a criar (`plan.md`, Technical Context).

**Checkpoint**: nenhuma ação de setup adicional é necessária — a feature reaproveita
100% da estrutura e dependências já existentes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extrair a camada de validação compartilhada entre o caminho de treino
único (já existente) e o caminho de múltiplos treinos (novo), sem duplicar lógica —
pré-requisito de ambos os caminhos.

**⚠️ CRITICAL**: Nenhuma User Story pode começar antes desta fase estar completa.

- [X] T002 [P] Adicionar os tipos `TreinoIgnorado`, `TreinoImportadoComPendencias` e
      `ResultadoImportacaoMultipla` em `src/types/treino.ts`, exatamente como
      definidos em `data-model.md` (sem alterar `Treino`, `ExercicioIgnorado` ou
      `ResultadoImportacao` já existentes).
- [X] T003 Em `src/services/treino-storage.ts`, extrair a função pura
      `montarTreinoValido(bruto: unknown, perfilId: string)` reaproveitando
      `validarEstruturaTreino` e `validarExercicio` **sem alterar suas assinaturas**
      (`research.md`, Decisão 1; `contracts/treino-storage.md`) — monta o `Treino`
      final (`id` via `Crypto.randomUUID()`, `importadoEm` via
      `new Date().toISOString()`) e a lista de `ExercicioIgnorado[]`, mas não lê nem
      escreve `AsyncStorage`. Depende de T002 (usa os tipos novos no retorno de erro
      quando aplicável).
- [X] T004 Refatorar `processarConteudo` em `src/services/treino-storage.ts` para que
      o caminho de objeto único (raiz não-array) passe a usar `montarTreinoValido`
      internamente, preservando **exatamente** o retorno `ResultadoImportacao` e o
      comportamento já existente (FR-002/FR-008) — nenhuma mudança perceptível pela
      UI. Depende de T003.

**Checkpoint**: tipos novos disponíveis, validação compartilhada extraída e já em uso
no caminho existente sem alterar seu comportamento — base pronta para as User Stories.

---

## Phase 3: User Story 1 - Importar o plano completo de treinos em um único arquivo (Priority: P1) 🎯 MVP

**Goal**: Reconhecer um arquivo cujo elemento raiz é um array e importar todos os
treinos válidos contidos nele, associados ao perfil ativo.

**Independent Test**: quickstart.md, Cenário 1 — selecionar
`docs/exemplos/treinos_multiplos.json` via "Importar treino" e confirmar que ambos os
treinos aparecem na lista do perfil ativo, cada um com seus próprios exercícios.

### Implementation for User Story 1

- [X] T005 [US1] Em `processarConteudo`, adicionar o branch `Array.isArray(bruto)`:
      quando verdadeiro, iterar cada elemento do array chamando `montarTreinoValido`
      (T003), separando o resultado em treinos válidos e `TreinoIgnorado[]` (FR-001,
      FR-003, FR-004). Depende de T004.
- [X] T006 [US1] Persistir todos os treinos válidos do array numa única leitura
      (`getTreinosState`) + escrita (`setTreinosState`) de `treinos:<perfilId>`
      (FR-005; `research.md`, Decisão 4 — nunca uma leitura/escrita por treino do
      array). Depende de T005.
- [X] T007 [US1] Tratar array vazio (`[]`) como arquivo inválido: retornar
      `ResultadoImportacaoMultipla` com `erro` preenchido e nenhum treino persistido
      (FR-007). Depende de T005.
- [X] T008 [US1] Montar o retorno `ResultadoImportacaoMultipla` do caminho de array
      (`treinos: TreinoImportadoComPendencias[]`, `treinosIgnorados: TreinoIgnorado[]`,
      `erro: string | null`), incluindo o motivo de cada treino e de cada exercício
      ignorado (FR-003, FR-004, FR-006). Depende de T006, T007.
- [X] T009 [US1] Em `src/app/(tabs)/index.tsx`, adicionar o type guard
      `ehResultadoMultiplo` (`contracts/treino-storage.md`) e um branch em
      `exibirResultadoImportacao` para o caminho de múltiplos treinos: uma única
      mensagem (`Alert.alert`) resumindo quantos treinos foram importados e, se
      houver, quais treinos/exercícios foram ignorados e o motivo (FR-006). Depende
      de T008.

**Checkpoint**: User Story 1 completa. Validada via web (Playwright, proxy para os
aparelhos reais) — Cenários 1, 3 e 4 do `quickstart.md` confirmados: múltiplos
treinos válidos importados corretamente, treino inválido no meio do array não
derruba os demais, array vazio não importa nada, exercícios de cada treino não se
misturam entre si. Cenário 5 não testado isoladamente (mesma função
`validarExercicio` do RF01, sem alteração). **Falta validação real em Android e iOS**
(T013).

---

## Phase 4: User Story 2 - Continuar importando arquivos de um único treino exatamente como antes (Priority: P1)

**Goal**: Garantir que nenhum arquivo de treino único (objeto na raiz) muda de
comportamento.

**Independent Test**: quickstart.md, Cenário 2.

### Implementation for User Story 2

- [ ] T010 [US2] Validar manualmente, em Android e iOS, que "Importar treino" (arquivo
      externo, objeto na raiz) e "Importar treino de exemplo" continuam com
      comportamento idêntico ao existente antes desta feature (FR-002, FR-008) —
      comportamento já garantido pela refatoração de T004; esta tarefa é de
      verificação (Princípio III da constituição), não de código novo. Depende de
      T004 (pode rodar em paralelo com a Fase 3, já que não depende dela).
      **Pré-validado via web** (Cenário 2 do quickstart, "Importar treino de exemplo"
      importou o treino único normalmente após as demais importações) — falta a
      validação real em Android e iOS para fechar esta tarefa.

**Checkpoint**: User Stories 1 e 2 funcionando lado a lado, sem regressão no caminho
de treino único (confirmado via web; pendente confirmação nos aparelhos reais).

---

## Phase 5: User Story 3 - Saber quantos treinos foram importados de uma vez (Priority: P2)

**Goal**: Confirmar que a mensagem de confirmação após importar múltiplos treinos é
sempre única — nunca uma por treino do array.

**Independent Test**: quickstart.md, Cenário 3 (3 treinos, 1 ignorado).

### Implementation for User Story 3

- [ ] T011 [US3] Validar manualmente que importar um arquivo com 3+ treinos produz
      exatamente **uma** mensagem de confirmação, nunca uma por treino — comportamento
      já implementado em T009; esta tarefa confirma contra o Cenário 3 do
      `quickstart.md` (FR-006, SC-001). Depende de T009.
      **Não verificável via web**: `Alert.alert` do React Native não tem
      implementação no `react-native-web` — nenhum diálogo aparece no navegador (nem
      nativo nem overlay), então o texto exato da mensagem só pode ser confirmado nos
      aparelhos reais. A lógica de dados por trás da mensagem (contagem de
      treinos/exercícios ignorados) foi verificada indiretamente pelo estado final da
      lista de treinos nos Cenários 1/3/4.

**Checkpoint**: User Stories 1 e 2 validadas via web; User Story 3 (conteúdo exato da
mensagem) só pode ser confirmada nos aparelhos reais.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Checks finais antes de considerar a feature pronta.

- [X] T012 [P] Rodar `npx tsc --noEmit` e `npx eslint` sobre os arquivos alterados
      (`src/services/treino-storage.ts`, `src/types/treino.ts`,
      `src/app/(tabs)/index.tsx`) — zero erros novos (Princípio I da constituição).
      Confirmado: `tsc --noEmit` e `eslint` sem erros/warnings nos 3 arquivos.
- [ ] T013 Rodar os 5 cenários de `quickstart.md` em Android (Redmi Note 12) e iOS
      (iPhone 16 Plus) — Princípio III da constituição (NON-NEGOTIABLE: nenhuma etapa
      concluída sem validação nos dois aparelhos).
- [ ] T014 Atualizar `docs/criterios-aceite.md`, seção "Melhorias pós-desenvolvimento",
      marcando esta feature como implementada e validada, no mesmo padrão já usado
      para RF01–RF10.
- [ ] T015 Atualizar o cabeçalho de `specs/012-importar-multiplos-treinos/spec.md`
      (**Status**) de "Clarified" para "Implemented" após T013 confirmar a validação
      nos dois aparelhos.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sem dependências — pode começar imediatamente.
- **Foundational (Fase 2)**: depende da Fase 1 — **bloqueia** todas as User Stories.
- **User Story 1 (Fase 3)**: depende só da Fase 2.
- **User Story 2 (Fase 4)**: depende só da Fase 2 — independente da Fase 3, pode rodar
  em paralelo com ela.
- **User Story 3 (Fase 5)**: depende da Fase 3 (T009) — precisa do branch de
  múltiplos treinos já implementado para ter o que validar.
- **Polish (Fase 6)**: depende de todas as User Stories desejadas estarem completas.

### Parallel Opportunities

- T002 (tipos) pode rodar em paralelo com T001 (confirmação de fixture).
- Fase 4 (US2, T010) pode rodar em paralelo com a Fase 3 (US1) — ambas dependem só da
  Fase 2, não uma da outra.
- T012 (type-check/lint) pode rodar em paralelo com T013 (validação manual nos
  aparelhos).

---

## Parallel Example: Foundational + User Story 2

```bash
# Após completar T001, em paralelo:
Task: "Adicionar tipos novos em src/types/treino.ts (T002)"

# Após T004 (fim da Fase 2), em paralelo:
Task: "Implementar branch de array em processarConteudo (T005, US1)"
Task: "Validar manualmente treino único sem regressão (T010, US2)"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Fase 1 (Setup) → Fase 2 (Foundational, bloqueante) → Fase 3 (US1).
2. **Parar e validar**: rodar quickstart.md Cenários 1, 3, 4 e 5 antes de seguir.
3. US1 sozinha já entrega o valor central da feature (importar plano completo de um
   personal trainer em um único arquivo).

### Entrega Incremental

1. Setup + Foundational → base pronta.
2. US1 → testar independentemente → é o MVP desta feature.
3. US2 → validação de não-regressão (pode ser feita em paralelo com US1).
4. US3 → validação da mensagem única (depende de US1 já implementada).
5. Polish → type-check/lint, validação nos dois aparelhos, atualização de
   `criterios-aceite.md` e status da spec.
