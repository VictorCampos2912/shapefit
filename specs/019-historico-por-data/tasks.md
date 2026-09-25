---

description: "Task list for spec 019 — Histórico por Data"
---

# Tasks: Histórico por Data

**Input**: Design documents from `/specs/019-historico-por-data/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/historico-evolucao.md, contracts/explore-screen.md, quickstart.md

**Tests**: Sem suíte de testes automatizados no projeto — validação manual em
Android e iOS (Princípio III), seguindo os cenários de `quickstart.md`; feature
testável via web/Playwright antes da confirmação física (sem API nativa envolvida).

**Organization**: Tarefas agrupadas pelas 2 User Stories de `spec.md` (ambas P1).
US1 (ver o histórico por dia) e US2 (alternar entre as visões) têm uma dependência
de UI genuína: o sub-componente de US1 (`SecaoDia`) só fica alcançável na tela
depois que o toggle de US2 existir — todos os cenários de `quickstart.md` para US1
(1, 2, 3, 5) começam com "abrir a visão 'por data'", que depende do toggle. Por
isso **US1 não tem uma task de validação funcional própria**: implementá-la
(T004-T005) sem uma validação via `quickstart.md` que só poderia ser simulada ou
adiada seria uma validação de fachada. A validação funcional dos Cenários 1, 2, 3 e
5 (US1) foi consolidada dentro de T007 (US2), junto com o Cenário 4 (US2) — o
primeiro momento em que "dado correto" e "UI alcançável" podem de fato ser testados
juntos, numa única passada real pelos dois aparelhos.

A refatoração de `historico-evolucao.ts` (extrair `construirRegistrosBrutos`) é
compartilhada pelas duas stories mas não depende de nenhuma delas — fica na fase
Foundational, com uma tarefa de validação de não-regressão própria (a visão "Por
exercício", RF08, já validada em produção, não pode mudar de comportamento).

A integração com RF17 (categorias de exercício, já implementada) faz parte do
escopo desta spec desde o início das tasks — não é um item de Polish à parte; está
embutida em T001 (`RegistroExercicioNoDia.categoria`), T002 (`RegistroBruto.categoria`)
e T005 (`SecaoDia` usa `src/utils/categoria-exercicio.ts`).

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Caminhos conforme `plan.md` (Project Structure): `src/types/historico.ts`,
`src/services/historico-evolucao.ts`, `src/app/(tabs)/explore.tsx`.

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: tipos novos e o refactor compartilhado do cruzamento
sessão→treino→exercício — nenhuma User Story tem como funcionar sem isso, e o
refactor não pode alterar o comportamento já validado da visão "Por exercício"
(RF08).

**⚠️ CRITICAL**: nenhuma User Story pode começar antes desta fase.

- [ ] T001 [P] Em `src/types/historico.ts`, adicionar os tipos `RegistroExercicioNoDia`
      (`{ exercicioNome: string; categoria: CategoriaExercicio; registros: {
      serie: number; cargaKg: number; reps: number }[] }`), `BlocoSessao` (`{
      sessaoId: string; treinoNome: string; dataReferencia: string; exercicios:
      RegistroExercicioNoDia[] }`), `DiaHistorico` (`{ chaveDia: string;
      dataReferencia: string; blocos: BlocoSessao[] }`) e `HistoricoPorData`
      (união discriminada por `temSessoesFinalizadas`, mesmo padrão de
      `HistoricoPerfil`) — `data-model.md`; `research.md`, Decisões 2 e 3.
      Independente de T002 (arquivo diferente).
- [ ] T002 [P] Em `src/services/historico-evolucao.ts`, extrair de
      `obterHistoricoPorPerfil` a função interna (não exportada)
      `construirRegistrosBrutos(treinos, sessoesFinalizadas): RegistroBruto[]`
      (tipo `RegistroBruto` com `categoria: CategoriaExercicio`, copiada de
      `exercicio.categoria` no mesmo ponto onde `exercicioNome` já é resolvido —
      RF17, já implementada) — mesmo laço e mesmo tratamento defensivo
      (`console.warn` + omissão do registro, RF08 FR-013/FR-014) já existentes,
      só sem agrupar por nome ainda; `obterHistoricoPorPerfil` passa a consumir
      essa função, **sem nenhuma mudança de assinatura nem de formato de
      retorno** (`HistoricoPerfil`) — `contracts/historico-evolucao.md`;
      `research.md`, Decisão 1. Independente de T001 (arquivo diferente).
- [ ] T003 Validar manualmente em Android e iOS (Princípio III) (`quickstart.md`,
      Cenário 0): confirmar que a visão "Por exercício" (RF08) continua com
      comportamento e dados idênticos aos já validados antes desta feature — mesmos
      grupos por exercício, mesma ordenação, edição (RF09b) continua funcionando.
      Depende de T002.

**Checkpoint**: refactor validado sem regressão — as duas User Stories podem
começar.

---

## Phase 2: User Story 1 - Saber o que foi treinado em cada dia (Priority: P1) 🎯 MVP

**Goal**: a visão "Por data" agrupa as sessões finalizadas por dia civil e, dentro
de cada dia, por sessão (treino + exercícios com séries, na unidade correta da
categoria de cada exercício).

**Independent Test**: não aplicável isoladamente nesta fase — todos os cenários de
`quickstart.md` para esta story pressupõem o toggle de US2 para serem alcançados na
UI. Validação funcional consolidada em T007 (ver nota "Organization").

### Implementation for User Story 1

- [ ] T004 [US1] Em `src/services/historico-evolucao.ts`, criar e exportar
      `obterHistoricoPorData(perfilId): Promise<HistoricoPorData>`
      (`contracts/historico-evolucao.md`): consome `construirRegistrosBrutos`
      (T002); agrupa por `sessaoId` → `BlocoSessao` (exercícios por
      `exercicioId`, série ordenada, `categoria` copiada sem transformação);
      agrupa `BlocoSessao` por `chaveDia` (componentes de data **locais** —
      `getFullYear()`/`getMonth()`/`getDate()`, nunca `getUTC*` — formatada
      `"YYYY-MM-DD"`, `research.md` Decisão 2) → `DiaHistorico`; ordena blocos
      dentro do dia por `data` desc e dias por `chaveDia` desc (FR-003, FR-004).
      Depende de T001, T002.
- [ ] T005 [US1] Em `src/app/(tabs)/explore.tsx`, criar o sub-componente inline
      `SecaoDia({ dia }: { dia: DiaHistorico })` (mesmo nível que `SecaoExercicio`
      já existente no arquivo — `research.md`, Decisão 5): renderiza
      `formatarData(dia.dataReferencia)` (nunca `dia.chaveDia`, evita o problema
      de fuso horário da Decisão 2) como cabeçalho do dia, e para cada bloco/
      exercício, os registros de série formatados via
      `ROTULO_CAMPO_PRINCIPAL`/`SUFIXO_VALOR`/`exibeCampoPrincipal` (de
      `@/utils/categoria-exercicio`, RF17) — sem agregar séries (FR-005); para
      `categoria === 'repeticoes'`, mostra só `"{reps} reps"`, sem valor de
      carga/tempo/distância. Somente leitura, sem `Pressable`/edição
      (`contracts/explore-screen.md`). Depende de T001.

**Checkpoint**: código de User Story 1 completo — ainda não alcançável via UI real
(nenhuma validação funcional própria nesta fase, ver nota "Organization"); segue
para User Story 2 antes de qualquer validação em aparelho.

---

## Phase 3: User Story 2 - Alternar entre as duas formas de consultar o histórico (Priority: P1)

**Goal**: um controle na própria tela de Histórico alterna entre "Por exercício" e
"Por data", sem navegar para outra rota, sem perder contexto ao trocar de perfil.

**Independent Test**: `quickstart.md`, Cenário 4 — controle visível, troca de
conteúdo sem navegação, atualização correta ao trocar de perfil. Testado em
conjunto com os Cenários 1, 2, 3 e 5 (US1) em T007, primeiro momento em que ambos
são alcançáveis na UI real.

### Implementation for User Story 2

- [ ] T006 [US2] Em `src/app/(tabs)/explore.tsx` (`contracts/explore-screen.md`):
      adicionar estado `visao: 'exercicio' | 'data'` (default `'exercicio'`) e
      `historicoPorData: HistoricoPorData | null`; `recarregarHistorico` passa a
      chamar `obterHistoricoPorPerfil` e `obterHistoricoPorData` em paralelo
      (`Promise.all`), sem mudar os gatilhos já existentes (`useEffect`/
      `useFocusEffect`); adicionar o controle de alternância (dois `Pressable`
      com `ThemedText type={ativo ? 'linkPrimary' : 'link'}`, "Por exercício" |
      "Por data") logo abaixo do título "Histórico de evolução"; renderização
      condicional — `FlatList` de `historico.evolucoes` quando
      `visao === 'exercicio'` (já existente, sem mudança), `FlatList` de
      `historicoPorData.dias` com `SecaoDia` quando `visao === 'data'`, mensagem
      de "sem registros" quando `!historicoPorData.temSessoesFinalizadas`
      (FR-001, FR-006). Depende de T004, T005.
- [ ] T007 [US2] Validar manualmente em Android e iOS (Princípio III) — validação
      funcional consolidada de US1 e US2 (`quickstart.md`, Cenários 1, 2, 3, 4 e
      5): controle de alternância visível; trocar entre as duas visões não navega
      para outra rota; dias agrupados do mais recente ao mais antigo; mensagem de
      "sem registros" quando o perfil não tem sessão finalizada; duas sessões do
      mesmo dia aparecem como blocos distintos, nunca mesclados; as 4 categorias
      (RF17) aparecem na unidade correta, consistente com a visão "Por
      exercício"; trocar de perfil ativo (RF10) enquanto na visão "Por data"
      atualiza imediatamente para os dados do novo perfil, sem registros
      residuais do perfil anterior. Depende de T006.

**Checkpoint**: as 2 User Stories completas e validadas juntas — visão "Por data"
alcançável e funcional na UI real.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [ ] T008 [P] Rodar `npx tsc --noEmit` e `npx eslint` sobre os arquivos
      novos/alterados (`src/types/historico.ts`,
      `src/services/historico-evolucao.ts`, `src/app/(tabs)/explore.tsx`) —
      zero erros novos.
- [ ] T009 [P] Atualizar `docs/PRD-app-treino.md` (seção 6, "Requisitos
      funcionais") registrando o RF desta feature — confirmar o próximo número
      livre real da tabela no momento de aplicar esta tarefa (a spec cita "RF18"
      provisoriamente; confirmar contra a tabela do PRD, não presumir — mesmo
      cuidado já tomado nas specs 016/017/018).
- [ ] T010 Atualizar `docs/criterios-aceite.md` (seção "Melhorias
      pós-desenvolvimento") com os critérios de aceite do RF desta feature (mesma
      numeração confirmada em T009), e o cabeçalho **Status** de
      `specs/019-historico-por-data/spec.md` para "Implemented" após T003 e T007
      confirmarem validação nos dois aparelhos. Depende de T003, T007, T009.

---

## Dependencies & Execution Order

- **Foundational (T001-T003)**: T001 e T002 são independentes entre si (arquivos
  diferentes) e podem rodar em paralelo. T003 depende de T002. Bloqueia as duas
  User Stories.
- **User Story 1 (T004-T005)**: T004 depende de T001 e T002. T005 depende de T001
  (independente de T004 — arquivos diferentes, mas ambos precisam do refactor da
  Foundational). Sem task de validação própria (ver nota "Organization").
- **User Story 2 (T006-T007)**: T006 depende de T004 e T005 (US1 completa) — a
  dependência entre stories é intencional e documentada na nota de "Organization"
  acima. T007 depende de T006 e cobre a validação funcional de US1 e US2 juntas.
- **Polish (T008-T010)**: T008 e T009 podem rodar a qualquer momento depois que os
  arquivos relevantes existirem. T010 depende da validação manual de T003 e T007
  estar concluída, e de T009 (numeração confirmada).

## Parallel Example: Foundational

```bash
# Podem rodar juntos (arquivos diferentes, sem dependência entre si):
Task: "Adicionar tipos novos em src/types/historico.ts (T001)"
Task: "Extrair construirRegistrosBrutos em historico-evolucao.ts (T002)"
```

## Implementation Strategy

1. Foundational (T001-T003) → tipos prontos, refactor sem regressão confirmado.
2. User Story 1 (T004-T005) → código do dado agrupado por dia, incluindo unidade
   por categoria (RF17); ainda não alcançável pela UI real, sem validação própria
   ainda.
3. User Story 2 (T006-T007) → toggle que torna US1 visível/usável de fato na tela
   de Histórico, com a validação funcional real de ambas as stories consolidada em
   T007 — spec.md marca as duas como P1, sem MVP menor que as duas juntas.
4. Polish (T008-T010) → lint/type-check, registro no PRD, fechamento de
   documentação.
