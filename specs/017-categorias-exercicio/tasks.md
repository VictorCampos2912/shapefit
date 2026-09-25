---

description: "Task list for spec 017 — Categorias de Unidade por Exercício"
---

# Tasks: Categorias de Unidade por Exercício

**Input**: Design documents from `/specs/017-categorias-exercicio/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/treino-storage.md, contracts/categoria-exercicio-util.md,
contracts/execucao-treino-screen.md, contracts/historico-e-edicao.md,
quickstart.md

**Tests**: Sem suíte de testes automatizados no projeto — validação manual em
Android e iOS (Princípio III), seguindo os cenários de `quickstart.md`; feature
testável via web/Playwright antes da confirmação física (sem API nativa envolvida).

**Organization**: Tarefas agrupadas pelas 3 User Stories de `spec.md` (US1 e US2 são
P1, US3 é P2). A validação de "categoria inválida" (Edge Case, FR-003) não tem User
Story própria na spec — colocada dentro de US2, por estar diretamente ligada à mesma
validação de importação (FR-001/002/003 formam um único cluster de comportamento de
schema) e usar o mesmo código já entregue por T002; não é grande o suficiente para
justificar uma fase de Polish à parte, diferente do padrão usado em specs 018/020
para FRs realmente desacopladas de qualquer User Story.

**Confirmado antes de gerar estas tasks**: `specs/019-historico-por-data` ainda NÃO
está implementada (nenhum `tasks.md` nem código correspondente no repositório) — a
"Nota de integração futura" já registrada no `research.md` desta spec (017) cobre
essa responsabilidade para quando a 019 for implementada depois; nenhuma task extra
é necessária aqui por causa disso.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Caminhos conforme `plan.md` (Project Structure): `src/types/`, `src/utils/`,
`src/services/`, `src/components/treino/exercicio-execucao.tsx`,
`src/app/(tabs)/explore.tsx`.

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: infraestrutura exigida por todas as User Stories — nenhuma delas tem
algo real para mostrar/testar sem o campo `categoria` existir e ser resolvido na
importação.

**⚠️ CRITICAL**: nenhuma User Story pode começar antes desta fase.

- [X] T001 Em `src/types/treino.ts`, adicionar `CategoriaExercicio` (união de 4
      literais: `'peso' | 'tempo' | 'distancia' | 'repeticoes'`) e o campo
      `categoria: CategoriaExercicio` em `ExercicioPlanejado` — sempre resolvido,
      nunca `undefined` em runtime (`data-model.md`).
- [X] T002 Em `src/services/treino-storage.ts`, alterar `validarExercicio`
      (`contracts/treino-storage.md`; `research.md`, Decisão 4): quando
      `item.categoria !== undefined`, validar que é uma string dentre `['peso',
      'tempo', 'distancia', 'repeticoes']` — caso contrário, exercício inválido
      (`{ ok: false, motivo: 'Exercício N: campo "categoria" inválido' }`); ao
      montar o exercício válido, `categoria: (item.categoria as CategoriaExercicio |
      undefined) ?? 'peso'` (FR-001, FR-002, FR-003). Depende de T001.

**Checkpoint**: todo `ExercicioPlanejado` importado a partir daqui carrega uma
`categoria` resolvida — as 3 User Stories podem começar.

---

## Phase 2: User Story 1 - Registrar um exercício de cardio sem um campo de carga sem sentido (Priority: P1) 🎯 MVP

**Goal**: a tela de execução (RF03/04) adapta o campo de registro e o valor
sugerido à categoria do exercício — sem campo de carga(kg) para tempo/distância/
repetições.

**Independent Test**: `quickstart.md`, Cenários 1 e 2 — abrir exercícios de cada uma
das 4 categorias na execução e confirmar o campo/rótulo/valor sugerido corretos.

### Implementation for User Story 1

- [X] T003 [P] [US1] Criar `src/utils/categoria-exercicio.ts`
      (`contracts/categoria-exercicio-util.md`; `research.md`, Decisão 3) com
      `ROTULO_CAMPO_PRINCIPAL: Record<CategoriaExercicio, string | null>` (`peso`:
      "Carga (kg)", `tempo`: "Tempo (min)", `distancia`: "Distância (km)",
      `repeticoes`: `null`), `SUFIXO_VALOR: Record<CategoriaExercicio, string>`
      (`peso`: "kg", `tempo`: "min", `distancia`: "km", `repeticoes`: `""`), e
      `exibeCampoPrincipal(categoria): boolean` (`false` só para `'repeticoes'`).
      Depende de T001.
- [X] T004 [US1] Em `src/components/treino/exercicio-execucao.tsx`
      (`contracts/execucao-treino-screen.md`, itens 1-3 e 5): (a) na linha de
      resumo do exercício, usar `SUFIXO_VALOR[exercicio.categoria]` no lugar de
      "kg" fixo, omitindo o trecho de valor sugerido quando
      `!exibeCampoPrincipal(exercicio.categoria)`; (b) no bloco da série atual,
      renderizar o campo principal condicionalmente
      (`exibeCampoPrincipal(exercicio.categoria)`) com
      `ROTULO_CAMPO_PRINCIPAL[exercicio.categoria]` no lugar do texto fixo "Carga
      (kg)"; (c) `podeConcluirSerie` passa a exigir o campo principal preenchido
      só quando `exibeCampoPrincipal(exercicio.categoria)` for `true`; (d) na
      exibição (somente leitura) de uma série já concluída dentro do exercício em
      andamento, usar `SUFIXO_VALOR[categoria]` (ou omitir o valor, para
      `repeticoes`) no lugar de "kg" fixo. Depende de T001, T003.
- [X] T005 [US1] Validar manualmente em Android e iOS (Princípio III)
      (`quickstart.md`, Cenários 1 e 2): confirmar os 4 campos/rótulos corretos
      (peso, tempo, distância, repetições) e o valor sugerido na unidade certa —
      requer importar um arquivo com exercícios já marcados com `categoria`, o que
      só funciona corretamente depois de T002 implementada. Depende de T002, T004.

**Checkpoint**: User Story 1 completa e testável de forma independente — MVP desta
feature.

---

## Phase 3: User Story 2 - Importar um treino sem informar categoria (compatibilidade) (Priority: P1)

**Goal**: nenhum arquivo/exemplo já existente deixa de funcionar por causa desta
feature; um valor de `categoria` inválido descarta só o exercício.

**Independent Test**: `quickstart.md`, Cenários 3 e 4 — importar um arquivo sem
`categoria` (funciona como antes) e um arquivo com `categoria` inválida em um
exercício (só esse é descartado).

### Implementation for User Story 2

- [X] T006 [US2] Validar manualmente em Android e iOS (Princípio III)
      (`quickstart.md`, Cenário 3): importar `docs/exemplos/treino-exemplo.json`
      (ou qualquer exemplo já existente, sem `categoria`) e confirmar importação e
      execução idênticas ao comportamento anterior a esta feature (FR-002, SC-003).
      **Nenhuma alteração de código é esperada** — comportamento já garantido por
      T002. Depende de T002.
- [X] T007 [US2] Validar manualmente em Android e iOS (Princípio III)
      (`quickstart.md`, Cenário 4): importar um arquivo com `"categoria":
      "invalida"` em um exercício e confirmar que só esse exercício é descartado
      (com motivo indicado), os demais do mesmo treino importam normalmente
      (FR-003). **Nenhuma alteração de código é esperada** — comportamento já
      garantido por T002. Depende de T002.

**Checkpoint**: User Stories 1 e 2 completas — feature funciona para categorias
novas e continua 100% compatível com arquivos já existentes.

---

## Phase 4: User Story 3 - Ver o histórico e editar registros com a unidade correta (Priority: P2)

**Goal**: o histórico (RF08) e as duas telas de edição (RF09a, sessão em andamento;
RF09b, sessão finalizada) exibem e editam cada registro na unidade da categoria do
exercício ao qual pertence.

**Independent Test**: `quickstart.md`, Cenário 5 — registrar séries das 4
categorias, finalizar a sessão, e confirmar histórico + as duas edições com a
unidade correta.

### Implementation for User Story 3

- [X] T008 [P] [US3] Em `src/types/historico.ts`, adicionar o campo
      `categoria: CategoriaExercicio` a `RegistroHistorico` (`data-model.md`).
      Depende de T001.
- [X] T009 [US3] Em `src/services/historico-evolucao.ts`, dentro de
      `obterHistoricoPorPerfil`, copiar `exercicio.categoria` para
      `RegistroHistorico.categoria` no mesmo ponto onde o nome do exercício já é
      resolvido (cruzamento sessão→treino→exercício já existente, RF08 FR-004) —
      sem nenhuma mudança na lógica de agrupamento/normalização de nome
      (`contracts/historico-e-edicao.md`; `research.md`, Decisão 5). Depende de
      T001, T008.
- [X] T010 [US3] Em `src/components/treino/exercicio-execucao.tsx`, dentro de
      `renderSeriesConcluidas` (edição de série já feita da sessão em andamento,
      RF09a — `contracts/execucao-treino-screen.md`, itens 4 e 7): rótulo dinâmico
      (`ROTULO_CAMPO_PRINCIPAL`) e campo principal condicional
      (`exibeCampoPrincipal`) no formulário de edição, mesmo padrão de T004; para
      `categoria === 'repeticoes'`, ao salvar, enviar `cargaKg:
      serieRealizada.cargaKg` (valor já existente, não editado) em vez do valor do
      formulário (`research.md`, Decisão 6). Depende de T001, T003, T004 (mesmo
      arquivo — aplicar depois).
- [X] T011 [US3] Em `src/app/(tabs)/explore.tsx`, na exibição de cada registro do
      histórico (RF08, dentro de `SecaoExercicio`): usar
      `SUFIXO_VALOR[registro.categoria]` no lugar de "kg" fixo, omitindo o valor
      quando `!exibeCampoPrincipal(registro.categoria)`
      (`contracts/historico-e-edicao.md`). Depende de T009, T003.
- [X] T012 [US3] Em `src/app/(tabs)/explore.tsx`, no formulário de edição de
      registro de sessão finalizada (RF09b, dentro de `SecaoExercicio`): mesmo
      tratamento de T010 — rótulo dinâmico, campo condicional, e para
      `categoria === 'repeticoes'` enviar `cargaKg: registro.cargaKg` (valor já
      existente) para `atualizarSerieDeSessaoFinalizada`
      (`contracts/historico-e-edicao.md`; `research.md`, Decisão 6). Depende de
      T009, T003, T011 (mesmo arquivo — aplicar depois).
- [X] T013 [US3] Validar manualmente em Android e iOS (Princípio III)
      (`quickstart.md`, Cenário 5): registrar séries das 4 categorias, finalizar a
      sessão, e confirmar que o histórico (RF08) e as duas telas de edição (RF09a
      e RF09b) mostram/editam cada registro na unidade correta, incluindo o caso
      "repetições" (só reps, sem campo de carga/tempo/distância em nenhuma das
      três telas). Depende de T010, T011, T012.

**Checkpoint**: as 3 User Stories completas.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T014 [P] Rodar `npx tsc --noEmit` e `npx eslint` sobre os arquivos
      novos/alterados (`src/types/treino.ts`, `src/types/historico.ts`,
      `src/utils/categoria-exercicio.ts`, `src/services/treino-storage.ts`,
      `src/services/historico-evolucao.ts`,
      `src/components/treino/exercicio-execucao.tsx`, `src/app/(tabs)/explore.tsx`)
      — zero erros novos.
- [X] T015 [P] Atualizar `docs/PRD-app-treino.md` (seção 6, "Requisitos
      funcionais") registrando o RF desta feature — confirmar o próximo número
      livre real da tabela no momento de aplicar esta tarefa (a spec cita "RF16"
      provisoriamente, mas já foi ocupado por `specs/016-finalizado-em`; o número
      real só se confirma na tabela do PRD, não no texto da spec — mesmo cuidado
      já tomado nas specs 015/016/018).
- [X] T016 Atualizar `docs/criterios-aceite.md` (seção "Melhorias
      pós-desenvolvimento") com os critérios de aceite do RF desta feature (mesma
      numeração confirmada em T015), e o cabeçalho **Status** de
      `specs/017-categorias-exercicio/spec.md` para "Implemented" após T005, T006,
      T007 e T013 confirmarem validação nos dois aparelhos. Depende de T005, T006,
      T007, T013, T015.

---

## Dependencies & Execution Order

- **Foundational (T001-T002)**: T002 depende de T001; bloqueia todas as User
  Stories.
- **User Story 1 (T003-T005)**: T003 depende só de T001 (independente de T002).
  T004 depende de T001 e T003. T005 depende de T004 **e de T002** (o cenário de
  validação importa um arquivo com `categoria` explícita, que só é reconhecida
  corretamente depois de T002).
- **User Story 2 (T006-T007)**: dependem só de T002 — nenhuma dependência de US1;
  podem rodar em paralelo à Phase 2 inteira.
- **User Story 3 (T008-T013)**: T008 depende de T001 (independente de T002/US1/
  US2). T009 depende de T001 e T008. T010 depende de T001, T003 e **T004** (mesmo
  arquivo de US1 — não pode rodar em paralelo com ele). T011 depende de T009 e
  T003. T012 depende de T009, T003 e **T011** (mesmo arquivo). T013 depende de
  T010, T011, T012.
- **Polish (T014-T016)**: T014 e T015 podem rodar a qualquer momento depois que os
  arquivos relevantes existirem. T016 depende da validação manual de T005, T006,
  T007 e T013 estar concluída, e de T015 (numeração confirmada).

## Parallel Example: Foundational pronta

```bash
# Depois de T001+T002 prontos, podem começar juntos:
Task: "Criar src/utils/categoria-exercicio.ts (T003, US1)"
Task: "Criar src/types/historico.ts categoria (T008, US3)"
Task: "Validar compatibilidade sem categoria (T006, US2)"
Task: "Validar categoria inválida (T007, US2)"
```

## Implementation Strategy

1. Foundational (T001-T002) → tipo e validação de importação prontos, nenhuma
   User Story funciona sem isso.
2. User Story 1 (T003-T005) → MVP desta feature (spec.md marca US1 como 🎯 MVP):
   execução adapta campos por categoria.
3. User Story 2 (T006-T007) → confirma que nada quebrou para arquivos/categorias
   já existentes ou inválidas; sem código novo, pode rodar em paralelo à US1.
4. User Story 3 (T008-T013) → histórico e as duas telas de edição refletem a
   categoria; depende de US1 já ter alterado `exercicio-execucao.tsx` (T004) por
   tocarem no mesmo arquivo (T010).
5. Polish (T014-T016) → lint/type-check, registro no PRD, fechamento de
   documentação.
