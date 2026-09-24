---

description: "Task list for spec 020 — Catálogo Interno de Exercícios"
---

# Tasks: Catálogo Interno de Exercícios

**Input**: Design documents from `/specs/020-catalogo-exercicios/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/catalogo-exercicios.md, contracts/tela-creditos.md, quickstart.md

**Tests**: Sem suíte de testes automatizados no projeto — validação manual em
Android e iOS (Princípio III), seguindo os cenários de `quickstart.md`; um único
script de verificação de integridade de dados é incluído (T005), por operar sobre
dado estático determinístico, não sobre comportamento de app.

**Organization**: Tarefas agrupadas pelas 2 User Stories de `spec.md`, mais uma
fase de Polish para o FR-007 (créditos/atribuição), que não tem User Story própria
na spec (adicionado depois, durante a pesquisa de licença em `/speckit.plan`).

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Caminhos conforme `plan.md` (Project Structure): `src/types/`, `src/assets/catalogo/`,
`src/services/`, `src/app/acoes.tsx`.

---

## Phase 1: Setup

- [ ] T001 [P] Criar a estrutura de diretórios `src/assets/catalogo/` e
      `src/assets/catalogo/imagens/`.
- [ ] T002 [P] Criar `src/types/catalogo-exercicios.ts` com `GrupoMuscular`
      (`'peito' | 'costas' | 'pernas' | 'ombros' | 'braços' | 'core'`) e
      `ExercicioCatalogo` (`{ id: string; nome: string; grupoMuscular:
      GrupoMuscular; midia: { tipo: 'imagem' | 'gif'; arquivo: string };
      fonteAtribuicao: string }`) — `data-model.md`. Independente de T001/T003
      (não depende do conteúdo curado, só do schema já definido).

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T003 Executar o processo de curadoria (`research.md`, Decisões 1 e 2):
      consultar a API pública do wger (`https://wger.de/api/v2/`, dados
      licenciados CC-BY-SA 3.0) e gerar `src/assets/catalogo/exercicios.json` +
      os arquivos de mídia correspondentes em `src/assets/catalogo/imagens/`,
      cobrindo os grupos musculares peito, costas, pernas, ombros, braços e core
      (`data-model.md`, SC-004). Cada entrada de `exercicios.json` DEVE ter `id`
      único dentro do catálogo, `nome`, `grupoMuscular`, `midia: { tipo, arquivo }`
      e `fonteAtribuicao` nunca vazio (invariantes de `data-model.md`); excluir da
      curadoria qualquer exercício sem mídia disponível na fonte (`spec.md`, Edge
      Cases). Depende de T001 (diretórios já existentes).

**Checkpoint**: dados curados e diretórios prontos — as duas User Stories podem
começar.

---

## Phase 3: User Story 1 - Ter uma base própria de exercícios com nome, grupo muscular e mídia (Priority: P1) 🎯 MVP

**Goal**: catálogo consultável por código, 100% offline, com os 3 atributos
completos por exercício.

**Independent Test**: `quickstart.md`, Cenário 1 — app em modo avião,
`listarCatalogo()` retorna os dados do catálogo sem nenhuma requisição de rede.

### Implementation for User Story 1

- [ ] T004 [US1] Criar `src/services/catalogo-exercicios.ts` com
      `listarCatalogo(): ExercicioCatalogo[]`, importando `exercicios.json` (T003)
      estaticamente e tipando o resultado como `ExercicioCatalogo[]` (T002) —
      função síncrona, sem I/O (`contracts/catalogo-exercicios.md`). Depende de
      T002, T003.
- [ ] T005 [P] [US1] Escrever um script de verificação de integridade dos dados
      curados (`contracts/catalogo-exercicios.md`): confirma que todo `id` de
      `exercicios.json` é único, todo `fonteAtribuicao` é não vazio, e todo
      `midia.arquivo` corresponde a um arquivo real em
      `src/assets/catalogo/imagens/` (SC-001). Depende de T003.
- [ ] T006 [US1] Validar manualmente em Android e iOS (Princípio III), com o
      aparelho em modo avião (`quickstart.md`, Cenário 1): confirmar que
      `listarCatalogo()` retorna nome, grupo muscular e mídia de qualquer
      exercício do catálogo, sem nenhuma tentativa de acesso à rede (SC-002).
      Depende de T004.

**Checkpoint**: User Story 1 completa e testável de forma independente.

---

## Phase 4: User Story 2 - Não interferir no fluxo de importação de treino já existente (Priority: P2)

**Goal**: confirmar que a importação de treino via JSON (RF01) continua
funcionando exatamente como antes, independente do catálogo.

**Independent Test**: `quickstart.md`, Cenário 3 — importar um treino com
exercício fora do catálogo, confirmar comportamento idêntico ao já validado antes
desta feature.

### Implementation for User Story 2

- [ ] T007 [US2] Validar manualmente em Android e iOS (Princípio III)
      (`quickstart.md`, Cenário 3): importar um treino (RF01) cujo(s)
      exercício(s) não correspondem a nenhum item de `exercicios.json` (T003) e
      confirmar que a importação funciona sem nenhuma mudança de comportamento,
      erro ou aviso relacionado ao catálogo (SC-003, FR-004). **Nenhuma alteração
      de código é esperada** — esta é uma tarefa de verificação de não regressão.
      Depende de T003.

**Checkpoint**: User Stories 1 e 2 completas.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: FR-007 (atribuição/créditos, exigência da licença CC-BY-SA 3.0
escolhida — sem User Story própria em `spec.md`, adicionado depois da pesquisa de
licença) mais fechamento de qualidade e documentação.

- [ ] T008 [P] Adicionar um item "Créditos do catálogo de exercícios" em
      `src/app/acoes.tsx`, exibindo atribuição ao wger project e à licença
      CC-BY-SA 3.0 (FR-007, `contracts/tela-creditos.md`) — mesmo padrão visual
      (`Pressable` + ícone + `ThemedText type="link"`) já usado pelos itens
      existentes dessa tela.
- [ ] T009 Validar manualmente em Android e iOS (`quickstart.md`, Cenário 4):
      abrir o item de créditos em "Ações" e confirmar que o texto de atribuição
      (wger project + CC-BY-SA 3.0) aparece. Depende de T008.
- [ ] T010 [P] Rodar `npx tsc --noEmit` e `npx eslint` sobre os arquivos
      novos/alterados (`src/types/catalogo-exercicios.ts`,
      `src/services/catalogo-exercicios.ts`, `src/app/acoes.tsx`) — zero erros
      novos.
- [ ] T011 Atualizar `docs/PRD-app-treino.md` (seção 6) registrando RF19
      (catálogo interno de exercícios) e a fonte de dados escolhida (wger
      project, CC-BY-SA 3.0).
- [ ] T012 Atualizar `docs/criterios-aceite.md` (seção "Melhorias
      pós-desenvolvimento") com os critérios de aceite do RF19, e o cabeçalho
      **Status** de `specs/020-catalogo-exercicios/spec.md` para "Implemented"
      após T006/T007/T009 confirmarem validação nos dois aparelhos.

---

## Dependencies & Execution Order

- **Setup (T001, T002)**: sem dependências entre si — podem rodar em paralelo.
- **Foundational (T003)**: depende de T001; bloqueia todo o resto (US1 e US2
  dependem dos dados curados).
- **User Story 1 (T004-T006)**: depende de T002 e T003. T004 e T005 podem rodar
  em paralelo entre si (arquivos diferentes); T006 depende de T004.
- **User Story 2 (T007)**: depende só de T003 — independente de US1 (pode rodar
  em paralelo com a Phase 3, já que não compartilha nenhum arquivo).
- **Polish (T008-T012)**: T008/T010 podem começar a qualquer momento (não
  dependem de US1/US2); T009 depende de T008; T012 depende da validação manual
  de T006, T007 e T009 estar concluída.

## Parallel Example: Setup + User Story 1

```bash
# Setup (podem rodar juntos):
Task: "Criar src/assets/catalogo/ e src/assets/catalogo/imagens/ (T001)"
Task: "Criar src/types/catalogo-exercicios.ts (T002)"

# Dentro da User Story 1, depois de T002+T003 prontos:
Task: "Criar src/services/catalogo-exercicios.ts (T004)"
Task: "Escrever script de verificação de integridade (T005)"
```

## Implementation Strategy

1. Setup (T001-T002) + Foundational (T003, a curadoria em si — o passo que mais
   consome tempo desta feature) → dados prontos.
2. User Story 1 (T004-T006) → catálogo consultável por código, é o MVP desta
   feature (spec.md marca US1 como 🎯 MVP).
3. User Story 2 (T007) → confirmação de não regressão, pode rodar em paralelo à
   US1 já que não depende dela.
4. Polish (T008-T012) → créditos (exigência de licença, não opcional apesar de
   estar na fase de Polish), lint/type-check, documentação.
