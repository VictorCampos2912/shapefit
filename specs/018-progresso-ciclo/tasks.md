---

description: "Task list for spec 018 — Progresso do Ciclo de Treinos (Múltiplos Treinos)"
---

# Tasks: Progresso do Ciclo de Treinos (Múltiplos Treinos)

**Input**: Design documents from `/specs/018-progresso-ciclo/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/ciclo-treino-storage.md, contracts/treino-storage.md,
contracts/index-screen.md, quickstart.md

**Tests**: Sem suíte de testes automatizados no projeto — validação manual em
Android e iOS (Princípio III), seguindo os cenários de `quickstart.md`; feature
testável via web/Playwright antes da confirmação física (sem API nativa envolvida).

**Organization**: Tarefas agrupadas pelas 2 User Stories de `spec.md` (US1 e US2,
P1 e P2), mais uma fase de Polish para FR-007/FR-008/FR-009 (bloqueio de nova
importação e aviso de "hora de trocar o treino"), que não têm User Story própria
na spec — mesmo padrão já usado em `specs/020-catalogo-exercicios/tasks.md` para
FR-007 daquela feature (FR adicionada depois das 2 User Stories nomeadas, sem
mapear para nenhuma delas). `CicloTreino` (tipo) e `ciclo-treino-storage.ts`
(serviço, incluindo `calcularCotaPorTreino`, o algoritmo de distribuição que é o
foco de US2) servem as duas stories; seguindo a regra "se uma entidade serve
múltiplas stories, colocar na story mais antiga" (não há infraestrutura
necessária por TODAS as stories que já não seja exigida pela mais prioritária,
então não há fase Foundational separada — só um Setup mínimo para o tipo), todo o
serviço é implementado dentro da fase de US1 (P1, precisa dele para existir o
ciclo que a UI exibe). A fase de US2 fica então só com a validação manual do
cenário de distribuição (`quickstart.md`, Cenário 2) — o código da distribuição
já foi escrito em US1 — mesmo padrão já usado em
`specs/020-catalogo-exercicios/tasks.md` para sua User Story 2 (fase sem nenhuma
tarefa de código, só verificação).

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Caminhos conforme `plan.md` (Project Structure): `src/types/`, `src/services/`,
`src/app/(tabs)/index.tsx`, `src/components/treino/treino-list-item.tsx`.

---

## Phase 1: Setup

- [X] T001 Criar `src/types/ciclo-treino.ts` com o tipo `CicloTreino`: `id: string`
      (único, gerado com `Crypto.randomUUID()`), `perfilId: string`, `treinoIds:
      string[]` (mínimo 2 itens sempre — nunca existe um `CicloTreino` para um
      único treino, `data-model.md`), `cotaPorTreinoId: Record<string, number>`
      (uma entrada por item de `treinoIds`, mesmo conjunto de chaves, soma de
      todos os valores sempre igual a 40), `criadoEm: string` (ISO 8601). Tipo
      imutável após criado — nenhuma operação desta feature edita um
      `CicloTreino` já existente (`data-model.md`).

---

## Phase 2: User Story 1 - Ver o progresso do ciclo atual de treinos (Priority: P1) 🎯 MVP

**Goal**: ao importar um arquivo com 2+ treinos, um `CicloTreino` é criado
automaticamente (sem confirmação do usuário) e a lista "Meus Treinos" passa a
exibir um `ProgressRing` por treino do lote, mostrando o progresso individual
daquele treino rumo à sua cota dentro do ciclo (FR-006). Um treino importado
sozinho nunca cria nem exibe ciclo (FR-004).

**Independent Test**: `quickstart.md`, Cenários 1 e 5 — importar um arquivo com 5
treinos válidos, confirmar que nenhuma confirmação é pedida e que cada um dos 5
treinos mostra um `ProgressRing` (0%) ao lado do contador de sessões; importar um
treino único e confirmar que ele nunca mostra `ProgressRing`, mesmo após
finalizar sessões dele.

### Implementation for User Story 1

- [X] T002 [US1] Criar `src/services/ciclo-treino-storage.ts`
      (`contracts/ciclo-treino-storage.md`) com:
      - `calcularCotaPorTreino(treinoIds: string[]): Record<string, number>` —
        helper interno: `base = Math.floor(40 / treinoIds.length)`,
        `resto = 40 % treinoIds.length`; os primeiros `resto` treinos (na ordem
        de `treinoIds`) recebem `base + 1`, os demais recebem `base`
        (`research.md`, Decisão 4).
      - `criarCiclo(perfilId: string, treinoIds: string[]): Promise<CicloTreino>`
        — pré-condição `treinoIds.length >= 2`; monta o `CicloTreino` (`id` via
        `Crypto.randomUUID()`, `cotaPorTreinoId` via `calcularCotaPorTreino`,
        `criadoEm` via `new Date().toISOString()`) e o acrescenta (append-only,
        nunca sobrescreve) ao array já existente em `ciclos:<perfilId>`.
      - `obterCicloAtual(perfilId: string): Promise<CicloTreino | null>` —
        retorna o último elemento de `ciclos:<perfilId>`, ou `null` se o array
        estiver vazio.
      - `calcularProgressoCiclo(perfilId: string, ciclo: CicloTreino): Promise<{
        totalFinalizado: number; porTreino: Record<string, number> }>` — para
        cada `treinoId` de `ciclo.treinoIds`, soma o resultado de
        `contarSessoesFinalizadas(perfilId, treinoId)` (já existente em
        `sessao-treino-storage.ts`, RF11); `totalFinalizado` é a soma de todos
        — sem cache, recalculado a cada chamada.
      - `cotaComoFracao(sessoesFinalizadas: number, cota: number): number` —
        `cota <= 0 ? 0 : Math.min(1, sessoesFinalizadas / cota)` (satura em 1
        quando o treino já ultrapassou sua cota individual).
      Depende de T001.
- [X] T003 [US1] Em `src/services/treino-storage.ts`, alterar
      `processarConteudoArray` (`contracts/treino-storage.md`): depois que os
      treinos do array já foram validados e persistidos com sucesso, quando
      `treinos.length >= 2` (contagem pós-validação, não o tamanho bruto do
      array — `research.md`, Decisão 5), chamar `criarCiclo(perfilId,
      treinos.map((item) => item.treino.id))`, na mesma ordem em que aparecem no
      array validado (FR-001). Um array com exatamente 1 treino válido não cria
      ciclo (FR-004), mesmo vindo do caminho de múltiplos treinos. Importar
      `criarCiclo` de `@/services/ciclo-treino-storage`. Sem mudança de
      assinatura — `processarConteudoArray` continua retornando
      `ResultadoImportacaoMultipla`. `processarConteudoObjeto` (treino único,
      RF01) permanece sem nenhuma alteração. Depende de T002.
- [X] T004 [US1] Em `src/app/(tabs)/index.tsx`, adicionar estado `cicloAtual:
      CicloTreino | null` e `progressoCiclo: { totalFinalizado: number;
      porTreino: Record<string, number> } | null` (`contracts/index-screen.md`);
      carregar via `obterCicloAtual(perfilId)` e, se não for `null`,
      `calcularProgressoCiclo(perfilId, ciclo)`, em paralelo às chamadas já
      existentes `carregarContagens`/`carregarDatasFinalizacao` dentro de
      `recarregarTreinos` e do `useEffect` inicial (mesmo padrão `Promise.all`).
      Importar `obterCicloAtual`, `calcularProgressoCiclo` e o tipo `CicloTreino`
      de `@/services/ciclo-treino-storage` e `@/types/ciclo-treino`. Depende de
      T002.
- [X] T005 [P] [US1] Em `src/components/treino/treino-list-item.tsx`, adicionar
      o prop opcional `progressoCiclo?: number | null` (fração 0-1, já calculada
      por `cotaComoFracao` — decisão de implementação livre deixada por
      `contracts/index-screen.md`, seguindo o mesmo padrão dos demais props
      opcionais do componente como `qtdSessoesFinalizadas`); quando
      `progressoCiclo != null`, renderizar `<ProgressRing
      progress={progressoCiclo} size={24} strokeWidth={3} />` na
      `linhaTitulo`, ao lado do contador de sessões já existente (não no lugar
      dele). Importar `ProgressRing` de `@/components/ui/progress-ring`.
      Independente de T004 (arquivo diferente).
- [X] T006 [US1] Em `src/app/(tabs)/index.tsx`, no `renderItem` da `FlatList`,
      passar `progressoCiclo={cicloAtual?.treinoIds.includes(item.id) ?
      cotaComoFracao(progressoCiclo?.porTreino[item.id] ?? 0,
      cicloAtual.cotaPorTreinoId[item.id]) : null}` para `TreinoListItem`
      (`contracts/index-screen.md`) — treinos que não pertencem a
      `cicloAtual.treinoIds` (fora de um lote, ou de um ciclo já superado por um
      mais novo) não recebem `ProgressRing` (mesmo comportamento visual de hoje).
      Importar `cotaComoFracao` de `@/services/ciclo-treino-storage`. Depende de
      T004, T005.
- [X] T007 [US1] Validar manualmente em Android e iOS (Princípio III)
      (`quickstart.md`, Cenários 1 e 5): confirmar que importar um arquivo com 5
      treinos válidos não pede nenhuma confirmação adicional e que, em "Meus
      Treinos", cada um dos 5 treinos mostra um `ProgressRing` a 0% ao lado do
      contador de sessões (FR-001, FR-006); confirmar que importar um treino
      único (objeto, não array) nunca mostra `ProgressRing` para ele, mesmo após
      finalizar sessões (FR-004). Depende de T006.

**Checkpoint**: User Story 1 completa e testável de forma independente — MVP
desta feature.

---

## Phase 3: User Story 2 - Distribuir a expectativa de execuções entre os treinos do lote (Priority: P2)

**Goal**: confirmar que a cota de 40 sessões esperadas é distribuída entre os N
treinos do lote da forma mais equilibrada possível (nenhum treino recebendo mais
de 1 execução esperada a mais que outro), usando o algoritmo já implementado em
`calcularCotaPorTreino` (T002).

**Independent Test**: `quickstart.md`, Cenário 2 — importar um arquivo com 3
treinos válidos, confirmar que a cota calculada é 14/13/13 (soma 40, diferença
máxima de 1 entre treinos) e que o `ProgressRing` de um treino "de 13" atinge
100% exatamente na 13ª sessão finalizada.

### Implementation for User Story 2

- [X] T008 [US2] Validar manualmente em Android e iOS (Princípio III)
      (`quickstart.md`, Cenário 2): importar um arquivo com 3 treinos válidos
      (nenhum ciclo ativo antes) e confirmar, por inspeção do estado/console
      durante o desenvolvimento (a cota individual não é exibida diretamente na
      UI, só a fração visual do anel), que `cotaPorTreinoId` resultante é
      14/13/13 ou equivalente — soma sempre 40, diferença máxima de 1 entre
      treinos (FR-003, SC-002). Finalizar sessões de um dos treinos "de 13" até
      13 sessões e confirmar que o `ProgressRing` desse treino mostra 100%
      (13/13). **Nenhuma alteração de código é esperada** — o algoritmo de
      distribuição já foi implementado em T002; esta é uma tarefa de
      verificação. Depende de T006.

**Checkpoint**: User Stories 1 e 2 completas — progresso do ciclo visível e
distribuição de cota confirmada como equilibrada.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: FR-007/FR-008/FR-009 (bloqueio de nova importação enquanto o ciclo
atual estiver "em andamento", e o aviso de "hora de trocar o treino" ao atingir
40 sessões) — sem User Story própria em `spec.md`, resolvidas como edge cases da
spec, análogas a FR-007 (créditos) em
`specs/020-catalogo-exercicios/tasks.md` — mais fechamento de qualidade e
documentação.

- [X] T009 Em `src/services/treino-storage.ts`, alterar `processarConteudoArray`
      (`contracts/treino-storage.md`, `research.md` Decisão 6) — **mesma
      função alterada por T003; aplicar depois, como primeiro passo da função,
      antes de qualquer validação de treino/exercício do array**: quando
      `bruto.length >= 2` (tamanho bruto, antes de validar — intencionalmente
      diferente da contagem pós-validação usada por T003/Decisão 5), chamar
      `obterCicloAtual(perfilId)` e, se existir e seu `totalFinalizado`
      (via `calcularProgressoCiclo`) for `< 40`, retornar imediatamente
      `{ treinos: [], treinosIgnorados: [], erro: 'Já existe um ciclo de
      treinos em andamento. Finalize as 40 sessões esperadas antes de importar
      um novo lote de múltiplos treinos.' }`, sem processar o restante do
      arquivo — tudo ou nada, nenhum treino é persistido mesmo os que seriam
      válidos (FR-007). Reaproveita o campo `erro` já existente em
      `ResultadoImportacaoMultipla`. Depende de T003.
- [X] T010 [P] Em `src/app/(tabs)/index.tsx`, adicionar um banner de aviso
      (`contracts/index-screen.md`) visível quando `cicloAtual && progressoCiclo
      && progressoCiclo.totalFinalizado >= 40`: `<ThemedView
      type="warningBackground"><ThemedText type="smallBold"
      themeColor="warning">Hora de trocar o treino — {progressoCiclo
      .totalFinalizado} sessões já realizadas</ThemedText></ThemedView>`,
      posicionado no topo da tela "Meus Treinos", acima da `FlatList` (FR-008).
      Continua visível em toda visita à tela enquanto `cicloAtual` for o mesmo;
      desaparece somente quando um novo ciclo é criado (FR-009). Depende de
      T004.
- [X] T011 Validar manualmente em Android e iOS (Princípio III)
      (`quickstart.md`, Cenário 3): com um ciclo em andamento, finalizar sessões
      até somar 40 no total do ciclo e confirmar que aparece o banner "Hora de
      trocar o treino — 40 sessões já realizadas" (FR-008); finalizar mais 1
      sessão (41ª) de qualquer treino do lote e confirmar que ela é registrada
      normalmente (RF07, sem bloqueio) e que o banner atualiza para "... 41
      sessões já realizadas". Depende de T009, T010.
- [X] T012 Validar manualmente em Android e iOS (Princípio III)
      (`quickstart.md`, Cenário 4): com um ciclo em andamento (< 40 sessões no
      total), tentar importar um novo arquivo de múltiplos treinos e confirmar
      que a importação é rejeitada com uma mensagem informando que já existe um
      ciclo em andamento (FR-007), sem nenhum treino do novo arquivo adicionado
      a "Meus Treinos"; continuar finalizando sessões do ciclo atual até atingir
      40 no total; tentar importar o mesmo arquivo novamente e confirmar que
      funciona normalmente desta vez (FR-009) — os novos treinos aparecem em
      "Meus Treinos", cada um com seu próprio `ProgressRing` zerado do novo
      ciclo, e os treinos do ciclo anterior (já concluído) não mostram mais
      nenhum `ProgressRing`. Depende de T009, T006.
- [X] T013 [P] Rodar `npx tsc --noEmit` e `npx eslint` sobre os arquivos
      novos/alterados (`src/types/ciclo-treino.ts`,
      `src/services/ciclo-treino-storage.ts`, `src/services/treino-storage.ts`,
      `src/app/(tabs)/index.tsx`, `src/components/treino/treino-list-item.tsx`)
      — zero erros novos.
- [X] T014 [P] Atualizar `docs/PRD-app-treino.md` (seção 6, "Requisitos
      funcionais") registrando o RF desta feature (spec.md indica RF17,
      "numeração a confirmar ao registrar no PRD" — confirmar o próximo número
      livre da seção 6 no momento de aplicar esta tarefa) — ciclo de progresso
      automático ao importar múltiplos treinos, 40 sessões esperadas
      distribuídas entre os treinos do lote, bloqueio de nova importação
      enquanto o ciclo estiver em andamento e aviso ao atingir 40 sessões.
- [X] T015 Atualizar `docs/criterios-aceite.md` (seção "Melhorias
      pós-desenvolvimento") com os critérios de aceite do RF desta feature
      (mesma numeração confirmada em T014), e o cabeçalho **Status** de
      `specs/018-progresso-ciclo/spec.md` para "Implemented" após T007, T008,
      T011 e T012 confirmarem validação nos dois aparelhos. Depende de T007,
      T008, T011, T012, T014.

---

## Dependencies & Execution Order

- **Setup (T001)**: sem dependências — pode começar imediatamente.
- **User Story 1 (T002-T007)**: T002 depende de T001. T003 depende de T002. T004
  depende de T002. T005 é independente (arquivo diferente, `treino-list-item.tsx`)
  e pode rodar em paralelo a T003/T004. T006 depende de T004 e T005. T007 depende
  de T006.
- **User Story 2 (T008)**: depende de T006 (US1 completa) — nenhuma alteração de
  código, só validação do algoritmo já implementado em T002.
- **Polish (T009-T015)**: T009 depende de T003 (mesma função, `treino-storage.ts`
  — aplicar depois para evitar edição conflitante). T010 depende de T004 e pode
  rodar em paralelo a T009 (arquivos diferentes). T011 depende de T009 e T010.
  T012 depende de T009 e T006. T013 e T014 podem rodar a qualquer momento depois
  que os arquivos relevantes existirem. T015 depende da validação manual de T007,
  T008, T011 e T012 estar concluída, e de T014 (numeração do RF confirmada).

## Parallel Example: User Story 1

```bash
# Depois de T002 (serviço ciclo-treino-storage.ts) pronto:
Task: "Alterar processarConteudoArray para criar ciclo em treino-storage.ts (T003)"
Task: "Adicionar prop progressoCiclo em treino-list-item.tsx (T005)"
```

## Implementation Strategy

1. Setup (T001) → tipo `CicloTreino` pronto.
2. User Story 1 (T002-T007) → MVP desta feature (spec.md marca US1 como 🎯 MVP):
   ciclo criado automaticamente ao importar, progresso por treino visível em
   "Meus Treinos".
3. User Story 2 (T008) → confirma que a distribuição de cota (já implementada em
   T002) é equilibrada; sem código novo, prioridade menor que US1 por ser um
   detalhe de cálculo, não a funcionalidade visível principal.
4. Polish (T009-T015) → bloqueio de nova importação e aviso de troca de treino
   (FR-007/FR-008/FR-009, sem User Story própria), lint/type-check, documentação.
