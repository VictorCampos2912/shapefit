---

description: "Task list for spec 016 — \"Finalizado em\" na Lista de Treinos"
---

# Tasks: "Finalizado em" na Lista de Treinos

**Input**: Design documents from `/specs/016-finalizado-em/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/sessao-treino-storage.md, contracts/treino-list-item.md, quickstart.md

**Tests**: Sem suíte de testes automatizados no projeto — validação manual em
Android e iOS (Princípio III), seguindo os cenários de `quickstart.md`; feature
testável via web/Playwright antes da confirmação física (sem API nativa envolvida).

**Organization**: Tarefas agrupadas pelas 3 User Stories de `spec.md`, em ordem de
prioridade (US1 e US3 são P1, US2 é P2) — não na ordem em que aparecem no
documento. US1 vem antes de US3 porque US3 (desempate) depende do dado que US1
calcula (`dataFinalizacao`); não há fase de Setup/Foundational separada porque não
há dependência nova nem infraestrutura compartilhada por todas as stories (a única
função de serviço nova, usada por US1 e US3 mas não por US2, fica dentro da fase de
US1, a mais prioritária que a exige).

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Caminhos conforme `plan.md` (Project Structure): `src/services/`,
`src/app/(tabs)/index.tsx`, `src/components/treino/treino-list-item.tsx`,
`src/app/treino/[treinoId].tsx`.

---

## Phase 1: User Story 1 - Saber quando cada treino foi feito pela última vez (Priority: P1) 🎯 MVP

**Goal**: a lista "Meus Treinos" mostra "Finalizado em `<data>`"/"Nunca treinado"
no lugar de "Importado em `<data>`".

**Independent Test**: `quickstart.md`, Cenários 1 e 2 — "Nunca treinado" antes da
primeira sessão finalizada; "Finalizado em" após, atualizando para a sessão mais
recente.

### Implementation for User Story 1

- [X] T001 [P] [US1] Adicionar `obterDataUltimaSessaoFinalizada(perfilId, treinoId):
      Promise<string | null>` em `src/services/sessao-treino-storage.ts`,
      retornando o `finalizadaEm` (ISO 8601) da sessão finalizada mais recente do
      treino (dentre as com `finalizadaEm !== null`), ou `null` se não houver
      nenhuma (`contracts/sessao-treino-storage.md`; `research.md`, Decisão 1).
- [X] T002 [US1] Em `src/app/(tabs)/index.tsx`, carregar `dataFinalizacao` por
      treino em paralelo ao já existente `carregarContagens` (mesmo padrão
      `Promise.all` sobre `listarTreinos`, chamando `obterDataUltimaSessaoFinalizada`
      por treino — `research.md`, Resumo). Depende de T001.
- [X] T003 [US1] Em `src/components/treino/treino-list-item.tsx`, adicionar o
      prop `dataFinalizacao: string | null` e trocar o texto principal do item de
      `"Importado em " + formatarDataHora(treino.importadoEm)` para
      `"Finalizado em " + formatarDataHora(dataFinalizacao)` quando `dataFinalizacao`
      não for `null`, ou `"Nunca treinado"` quando for `null` (FR-001, FR-002;
      `contracts/treino-list-item.md`). Depende de T002.
- [X] T004 [US1] Validar manualmente em Android e iOS (Princípio III)
      (`quickstart.md`, Cenários 1 e 2): confirmar "Nunca treinado" antes da
      primeira sessão finalizada de um treino, "Finalizado em `<data>`" logo
      após, e que a data exibida acompanha a sessão mais recente ao finalizar uma
      segunda sessão do mesmo treino. Depende de T003.

**Checkpoint**: User Story 1 completa e testável de forma independente.

---

## Phase 2: User Story 3 - Diferenciar treinos com o mesmo nome sem mostrar a data de importação (Priority: P1)

**Goal**: quando dois ou mais treinos homônimos exibiriam o mesmo texto de
"Finalizado em"/"Nunca treinado", a data de importação volta a aparecer como
desempate — preservando a garantia do RF02 (SC-004) de que homônimos nunca ficam
indistinguíveis.

**Independent Test**: `quickstart.md`, Cenários 4 e 5 — homônimos com "Finalizado
em" diferentes não mostram data de importação; homônimos com o mesmo texto (ex.:
ambos "Nunca treinado") mostram.

### Implementation for User Story 3

- [X] T005 [US3] Em `src/app/(tabs)/index.tsx`, criar a função pura
      `calcularChavesColidindo(treinos: Treino[], dataFinalizacaoPorTreino:
      Record<string, string | null>): Set<string>` — reaproveita a já existente
      `calcularNomesDuplicados` para o primeiro filtro (mesmo nome), depois
      verifica se o texto "Finalizado em `<data>`"/"Nunca treinado" também
      colidiria entre os treinos desse grupo; retorna o conjunto de `treino.id`
      que devem exibir `treino.importadoEm` como desempate (FR-005;
      `research.md`, Decisão 2; `contracts/treino-list-item.md`). Depende de T002
      (precisa de `dataFinalizacaoPorTreino` já carregado).
- [X] T006 [US3] Em `src/components/treino/treino-list-item.tsx`, adicionar o
      prop `exibirDataImportacao?: boolean` (default `false`) — **substitui o
      prop `nomeDuplicado`, que é removido** (não mais usado por este
      componente) — controlando exclusivamente a exibição da linha secundária
      `"Importado em " + formatarDataHora(treino.importadoEm)` (FR-005, FR-006;
      `research.md`, Decisão 3; `contracts/treino-list-item.md`). Depende de
      T003.
- [X] T007 [US3] Em `src/app/(tabs)/index.tsx`, atualizar o render de
      `TreinoListItem` para passar `exibirDataImportacao={colidindo.has(item.id)}`
      no lugar do antigo `nomeDuplicado={nomesDuplicados.has(item.nome)}`
      (`contracts/treino-list-item.md`). Depende de T005, T006.
- [X] T008 [US3] Validar manualmente em Android e iOS (Princípio III)
      (`quickstart.md`, Cenários 4 e 5): confirmar que treinos homônimos com
      "Finalizado em"/"Nunca treinado" diferentes entre si NÃO mostram a data de
      importação (FR-006), e que treinos homônimos com o mesmo texto (ex.: os
      dois "Nunca treinado") mostram `treino.importadoEm` como segunda linha,
      com valores diferentes entre si (FR-005). Depende de T007.

**Checkpoint**: User Stories 1 e 3 completas — nenhuma ambiguidade entre treinos
homônimos, mesma garantia já validada pelo RF02.

---

## Phase 3: User Story 2 - Ver quando o treino foi importado, dentro da tela do treino (Priority: P2)

**Goal**: a data de importação (`treino.importadoEm`) passa a aparecer dentro da
tela do treino específico, como informação secundária.

**Independent Test**: `quickstart.md`, Cenário 3 — data de importação visível na
tela do treino; lista "Meus Treinos" não mostra mais "Importado em" como texto
principal de nenhum item.

### Implementation for User Story 2

- [X] T009 [P] [US2] Em `src/app/treino/[treinoId].tsx`, adicionar uma linha de
      texto secundário (`ThemedText type="small" themeColor="textSecondary"`,
      mesmo padrão já usado em `treino-list-item.tsx` para "Importado em") com
      `"Importado em " + formatarDataHora(treino.importadoEm)`, logo abaixo do
      título do treino (`<ThemedText type="subtitle">{treino.nome}</ThemedText>`),
      antes da lista de exercícios (FR-004; `research.md`, Decisão 4).
      Independente de US1/US3 — arquivo diferente, sem dependência de nenhum
      dado calculado por elas; pode ser feita em paralelo à Phase 1/2.
- [X] T010 [US2] Validar manualmente em Android e iOS (Princípio III)
      (`quickstart.md`, Cenário 3): confirmar que a data de importação aparece
      como texto secundário na tela do treino específico, e que nenhum item da
      lista "Meus Treinos" mostra mais "Importado em" como texto principal
      (substituído por "Finalizado em"/"Nunca treinado", US1). Depende de T003
      e T009.

**Checkpoint**: as 3 User Stories completas.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [X] T011 [P] Rodar `npx tsc --noEmit` e `npx eslint` sobre os arquivos
      alterados (`src/services/sessao-treino-storage.ts`,
      `src/app/(tabs)/index.tsx`, `src/components/treino/treino-list-item.tsx`,
      `src/app/treino/[treinoId].tsx`) — zero erros novos.
- [X] T012 Atualizar `docs/criterios-aceite.md` (seção "Melhorias
      pós-desenvolvimento") com os critérios de aceite do RF15, e o cabeçalho
      **Status** de `specs/016-finalizado-em/spec.md` para "Implemented" após
      T004, T008 e T010 confirmarem validação nos dois aparelhos.

---

## Dependencies & Execution Order

- **User Story 1 (T001-T004)**: sem dependência de outra story — pode começar
  imediatamente. T001 é a única tarefa sem dependência (função de serviço pura).
- **User Story 3 (T005-T008)**: depende de T002 (US1) para ter
  `dataFinalizacaoPorTreino` disponível, e de T003 (US1) para o componente já
  aceitar `dataFinalizacao` — por isso vem depois de US1, apesar de ambas serem
  P1.
- **User Story 2 (T009-T010)**: T009 é totalmente independente (arquivo
  diferente, `[treinoId].tsx`) e pode rodar em paralelo a US1/US3 desde o
  início; só a validação final (T010) depende de T003 (US1) já estar pronta,
  para confirmar que a lista não mostra mais "Importado em".
- **Polish (T011-T012)**: T011 pode rodar a qualquer momento depois que os
  arquivos relevantes existirem; T012 depende da validação manual de T004, T008
  e T010 estar concluída.

## Parallel Example: Início do trabalho

```bash
# Podem começar juntos, em arquivos diferentes:
Task: "Adicionar obterDataUltimaSessaoFinalizada em sessao-treino-storage.ts (T001)"
Task: "Adicionar linha de importadoEm em [treinoId].tsx (T009)"
```

## Implementation Strategy

1. User Story 1 (T001-T004) → MVP desta feature (spec.md marca US1 como 🎯 MVP):
   lista já mostra "Finalizado em"/"Nunca treinado".
2. User Story 3 (T005-T008) → garante que a mudança de US1 não quebra a
   diferenciação de homônimos já validada pelo RF02 — prioridade igual a US1
   (P1), implementada logo em seguida por depender dela.
3. User Story 2 (T009-T010) → data de importação movida para a tela do treino;
   pode ser feita em paralelo às duas primeiras (T009), com validação final
   (T010) no fim.
4. Polish (T011-T012) → lint/type-check e atualização de documentação.
