---

description: "Task list for spec 021 — Imagem/GIF do Exercício na Execução"
---

# Tasks: Imagem/GIF do Exercício na Execução

**Input**: Design documents from `/specs/021-imagens-exercicios/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/catalogo-exercicios.md, contracts/execucao-treino-screen.md, quickstart.md

**Tests**: Sem suíte de testes automatizados no projeto — validação manual em
Android e iOS (Princípio III), seguindo os cenários de `quickstart.md`; inclui uma
validação técnica específica (Cenário 4) de resolução de asset nos 3 bundlers
(web/Android/iOS), não só teste unitário da função de busca.

**Organization**: Tarefas agrupadas pelas 2 User Stories de `spec.md` (ambas P1).
US1 (mostrar imagem quando há correspondência) e US2 (não mostrar nada quando não
há) são implementadas pelo **mesmo bloco de código** — um único condicional em
`exercicio-execucao.tsx` que cobre FR-004 (US1) e FR-005 (US2) ao mesmo tempo; não
é possível nem faz sentido dividir essa implementação em duas tasks. Por isso a
implementação (T002) fica sob US1 (a prioridade "principal" segundo o "Why this
priority" da spec — sem ela o catálogo não tem consumidor visível), e US2 tem
**só uma task de validação** (T004), que depende de T002 já estar pronta — mesmo
padrão de consolidação já usado em `specs/019-historico-por-data/tasks.md`
("Option A") quando duas stories compartilham a mesma UI/implementação.

O Cenário 3 do `quickstart.md` (normalização sem aproximação) testa as duas
pontas — correspondência via normalização (US1) e ausência de correspondência por
nome só parecido, não idêntico (US2) — e fica na fase de US2 (T005), por ser
especificamente sobre a garantia de "nunca aproximar" que é o núcleo de US2
(FR-003).

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Caminhos conforme `plan.md` (Project Structure): `src/services/catalogo-exercicios.ts`,
`src/components/treino/exercicio-execucao.tsx`. `assets/catalogo/imagens-index.ts`
já existe (gerado pela curadoria da spec 020, já implementada) — nenhuma task de
geração de asset aqui.

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: a função de busca no catálogo é compartilhada pelas duas User
Stories — US1 precisa dela para encontrar a correspondência, US2 precisa dela
para confirmar a ausência de correspondência.

**⚠️ CRITICAL**: nenhuma User Story pode começar antes desta fase.

- [X] T001 Em `src/services/catalogo-exercicios.ts` (arquivo já existente da spec
      020, hoje só exporta `listarCatalogo`), adicionar e exportar
      `buscarNoCatalogo(nomeExercicio: string): ExercicioCatalogo | null`
      (`contracts/catalogo-exercicios.md`; `research.md`, Decisão 1): normaliza
      `nomeExercicio` via `normalizarNomeExercicio` (RF08,
      `@/utils/normalizar-nome-exercicio`, reaproveitada sem alteração — FR-002),
      busca em `listarCatalogo()` o primeiro item cujo `nome`, após a mesma
      normalização, seja **idêntico** (nunca aproximado — FR-003), retorna esse
      item ou `null`. Sem tocar em `ExercicioCatalogo`, `GrupoMuscular` ou
      `listarCatalogo` (permanecem exatamente como definidos pela spec 020).

**Checkpoint**: função de busca pronta e testável isoladamente por código — as
duas User Stories podem começar.

---

## Phase 2: User Story 1 - Ver a imagem do exercício ao executá-lo (Priority: P1) 🎯 MVP

**Goal**: ao abrir, na execução, um exercício cujo nome corresponde (após
normalização) a um exercício do catálogo, a imagem/GIF correspondente aparece.

**Independent Test**: `quickstart.md`, Cenário 1 — treino importado com um
exercício cujo nome corresponde exatamente a um item do catálogo; abrir esse
exercício na execução e confirmar que a imagem aparece, sem interferir no fluxo
de registro de série (SC-003).

### Implementation for User Story 1

- [X] T002 [US1] Em `src/components/treino/exercicio-execucao.tsx`
      (`contracts/execucao-treino-screen.md`; `research.md`, Decisão 3):
      importar `buscarNoCatalogo` (T001) e `IMAGENS_CATALOGO` (de
      `@/assets/catalogo/imagens-index`, já gerado pela spec 020) e `Image` (de
      `react-native`); calcular `const correspondencia = useMemo(() =>
      buscarNoCatalogo(exercicio.nome), [exercicio.nome])` — sem prop nova em
      `ExercicioExecucaoProps`; renderizar, logo após a linha de resumo do
      exercício (`"{series}x {repsAlvo} · sugestão ... · {descansoSeg}s
      descanso"`) e antes do botão "Iniciar exercício":
      `{correspondencia && <Image source={IMAGENS_CATALOGO[correspondencia.midia.arquivo]} style={styles.imagemExercicio} accessibilityLabel={\`Demonstração do exercício ${correspondencia.nome}\`} />}`
      — quando `correspondencia` é `null`, nada é renderizado nesse ponto (sem
      placeholder, sem espaço reservado — cobre FR-005/US2 na mesma implementação,
      ver nota "Organization"). Adicionar `imagemExercicio` ao `StyleSheet.create`
      já existente no arquivo. Depende de T001.
- [ ] T003 [US1] Validar manualmente em Android e iOS (Princípio III)
      (`quickstart.md`, Cenário 1): abrir, na execução, o exercício com nome
      correspondente ao catálogo; confirmar que a imagem aparece acima da área de
      registro de série, e que os campos de carga/reps e o botão "Concluir série"
      continuam funcionando normalmente (SC-003 — a imagem não bloqueia nem
      atrasa o fluxo). Depende de T002.

**Checkpoint**: User Story 1 completa e testável de forma independente — MVP
desta feature.

---

## Phase 3: User Story 2 - Não mostrar nada quando não há correspondência (Priority: P1)

**Goal**: ao abrir, na execução, um exercício sem correspondência no catálogo, a
tela se comporta exatamente como antes desta feature — nenhuma imagem, nenhum
espaço vazio, nenhuma UI relacionada ao catálogo.

**Independent Test**: `quickstart.md`, Cenário 2 — abrir, na execução, um
exercício cujo nome normalizado não corresponde a nenhum item do catálogo, e
confirmar que a tela é idêntica à versão anterior a esta feature.

### Implementation for User Story 2

Nenhuma — o mesmo condicional de T002 já cobre o caso `correspondencia === null`
(FR-005). Ver nota "Organization" no topo deste arquivo.

- [ ] T004 [US2] Validar manualmente em Android e iOS (Princípio III)
      (`quickstart.md`, Cenário 2): abrir, na execução, o exercício sem
      correspondência no catálogo; confirmar que nenhuma imagem, espaço vazio ou
      UI relacionada ao catálogo aparece — tela idêntica à versão anterior a esta
      feature (FR-005, SC-002). Depende de T002.
- [ ] T005 [US2] Validar manualmente em Android e iOS (Princípio III)
      (`quickstart.md`, Cenário 3 — normalização sem aproximação, US1/US2):
      (a) exercício no treino com nome variando só em espaço/maiúsculas em
      relação ao catálogo (ex.: treino "supino  reto", catálogo "Supino Reto") —
      confirmar que a imagem aparece normalmente (FR-002); (b) exercício com nome
      parecido mas não idêntico após normalização (ex.: "Rosca direta" no treino
      vs. "Rosca direta com barra" no catálogo) — confirmar que **nenhuma**
      imagem aparece (FR-003, núcleo desta story: nunca aproximar). Depende de
      T002.

**Checkpoint**: as 2 User Stories completas e validadas — comportamento correto
tanto com quanto sem correspondência, incluindo o limite de normalização.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [ ] T006 [P] Validar manualmente em Android e iOS, e também via
      `npx expo start` (web) (Princípio III) (`quickstart.md`, Cenário 4 —
      validação técnica): confirmar que a imagem do Cenário 1 carrega sem erro
      de import/404 nos 3 bundlers (web, Android, iOS) — confirma que
      `imagens-index.ts` (mapa estático de `require()`, spec 020) resolve
      corretamente em todos, não só no ambiente de desenvolvimento web. Depende
      de T002.
- [X] T007 [P] Rodar `npx tsc --noEmit` e `npx eslint` sobre os arquivos
      novos/alterados (`src/services/catalogo-exercicios.ts`,
      `src/components/treino/exercicio-execucao.tsx`) — zero erros novos.
- [ ] T008 [P] Atualizar `docs/PRD-app-treino.md` (seção 6, "Requisitos
      funcionais") registrando o RF desta feature — confirmar o próximo número
      livre real da tabela no momento de aplicar esta tarefa (a spec cita "RF20"
      provisoriamente; confirmar contra a tabela do PRD, não presumir — mesmo
      cuidado já tomado nas specs 016-020).
- [ ] T009 Atualizar `docs/criterios-aceite.md` (seção "Melhorias
      pós-desenvolvimento") com os critérios de aceite do RF desta feature (mesma
      numeração confirmada em T008), e o cabeçalho **Status** de
      `specs/021-imagens-exercicios/spec.md` para "Implemented" após T003, T004,
      T005 e T006 confirmarem validação nos dois aparelhos. Depende de T003, T004,
      T005, T006, T008.

---

## Dependencies & Execution Order

- **Foundational (T001)**: sem dependências — bloqueia as duas User Stories.
- **User Story 1 (T002-T003)**: T002 depende de T001. T003 depende de T002.
- **User Story 2 (T004-T005)**: sem implementação própria — T004 e T005 dependem
  só de T002 (o mesmo código de US1). Podem rodar em paralelo com T003 (validações
  diferentes, sem compartilhar estado entre si), mas todas dependem de T002
  primeiro existir.
- **Polish (T006-T009)**: T006 depende de T002. T007 e T008 podem rodar a
  qualquer momento depois que os arquivos relevantes existirem. T009 depende da
  validação manual de T003, T004, T005 e T006 estar concluída, e de T008
  (numeração confirmada).

## Parallel Example: User Stories 1 e 2 (validação, depois de T002 pronto)

```bash
# Podem rodar juntos (validações independentes, mesmo código-base T002):
Task: "Validar Cenário 1 — imagem aparece com correspondência (T003, US1)"
Task: "Validar Cenário 2 — nenhuma imagem sem correspondência (T004, US2)"
Task: "Validar Cenário 3 — normalização sem aproximação (T005, US2)"
```

## Implementation Strategy

1. Foundational (T001) → `buscarNoCatalogo` pronta e testável por código.
2. User Story 1 (T002-T003) → imagem aparece quando há correspondência; T002 já
   implementa o comportamento completo (US1 + US2 no mesmo condicional) — é o
   MVP desta feature (spec.md marca US1 como 🎯 MVP).
3. User Story 2 (T004-T005) → validação de que a ausência de correspondência (e
   o limite de "nunca aproximar") se comporta corretamente — sem código novo,
   só confirmação nos dois aparelhos.
4. Polish (T006-T009) → validação técnica de bundler, lint/type-check, registro
   no PRD, fechamento de documentação.
