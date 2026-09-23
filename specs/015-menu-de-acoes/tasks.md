---

description: "Task list for spec 015 — Tela Separada para Ações de Perfil e Importação"
---

# Tasks: Tela Separada para Ações de Perfil e Importação

**Input**: Design documents from `/specs/015-menu-de-acoes/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/navegacao.md, quickstart.md

**Tests**: Sem suíte de testes automatizados — validação manual em Android/iOS,
verificável também via Expo web.

**Organization**: Tarefas agrupadas por User Story (spec.md).

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Projeto mobile único (Expo Router).

---

## Phase 1: Setup

- [X] T001 Confirmar o padrão visual já usado para telas empilhadas com "Voltar"
      próprio (`src/app/treino/[treinoId].tsx`, linhas do link "Voltar para
      exercícios") — referência para a nova tela `acoes.tsx`. Sem dependência nova.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Criar a nova tela e o botão de acesso a ela **antes** de remover os
atalhos de `index.tsx` — evita um estado intermediário onde as ações ficam
inacessíveis.

- [X] T002 [P] Adicionar `AcoesIcon` (três pontos horizontais) em
      `src/components/ui/icons.tsx`, seguindo o padrão dos demais ícones
      (`research.md`, Decisão 4).
- [X] T003 Criar `src/components/ui/botao-acoes.tsx`: componente sem props, navega
      para `/acoes` via `router.push`, usa `AcoesIcon` com `theme.text`
      (`contracts/navegacao.md`). Depende de T002.
- [X] T004 Criar `src/app/acoes.tsx`: tela nova com link "Voltar" (`VoltarIcon` +
      `router.back()`, mesmo padrão de `treino/[treinoId].tsx`) e as três ações —
      migrar `ehResultadoMultiplo`, `exibirResultadoImportacaoMultipla`,
      `exibirResultadoImportacao`, `handleImportarTreino`,
      `handleImportarTreinoExemplo` de `(tabs)/index.tsx` **sem alteração de lógica**
      (`research.md`, Decisão 3; `contracts/navegacao.md`). `importouAlgumTreino`
      **não** é migrada — só existia para decidir quando chamar
      `recarregarTreinos()`, função que continua em `index.tsx` (a lista se
      atualiza sozinha por `useFocusEffect` ao voltar pra aba, não por uma chamada
      direta feita daqui). Depende de T001.

**Checkpoint**: tela `/acoes` existe e funciona de forma independente (ainda não
alcançável pela UI, já que nenhum botão aponta para ela ainda).

---

## Phase 3: User Story 1 - Tela "Treinos" focada só nos treinos (Priority: P1) 🎯 MVP

**Goal**: Remover os atalhos de `(tabs)/index.tsx`, deixando só título + ícone de
ações + lista de treinos.

**Independent Test**: quickstart.md, Cenários 1 e 4.

### Implementation for User Story 1

- [X] T005 [US1] Em `(tabs)/index.tsx`: remover o bloco de atalhos (linha "Perfil
      ativo... (trocar)" e o `ThemedView` com "Importar treino"/"Importar treino de
      exemplo"), e as funções/estado que só existiam para isso
      (`ehResultadoMultiplo`, `exibirResultadoImportacaoMultipla`,
      `exibirResultadoImportacao`, `importouAlgumTreino`, `handleImportarTreino`,
      `handleImportarTreinoExemplo`, estado `importando`) e os imports associados
      (`contracts/navegacao.md`, seção "(tabs)/index.tsx — mudanças de contrato").
      Depende de T004 (a lógica já precisa existir em `acoes.tsx` antes de sair
      daqui).
- [X] T006 [US1] Em `(tabs)/index.tsx`: colocar `<BotaoAcoes />` na linha de título
      ("Meus treinos"), lado a lado via `flexDirection: 'row'` +
      `justifyContent: 'space-between'`. Depende de T003, T005.
- [X] T007 [US1] Em `(tabs)/index.tsx`: atualizar a mensagem de estado vazio
      ("Nenhum treino importado ainda") para apontar para o ícone de ações em vez de
      "acima" (FR-005). Depende de T005.

**Checkpoint**: User Story 1 completa — validado via web (Playwright): tela
"Treinos" só mostra título, ícone de ações e lista/estado vazio; nenhum texto de
"Perfil ativo"/"Importar treino" restante. **Falta validação real em Android e
iOS** (T011).

---

## Phase 4: User Story 2 - Acessar as ações a partir de um ícone (Priority: P1)

**Goal**: O ícone de ações funciona a partir de qualquer aba, e as três ações
continuam se comportando exatamente como antes.

**Independent Test**: quickstart.md, Cenários 2 e 3.

### Implementation for User Story 2

- [X] T008 [US2] Em `(tabs)/explore.tsx`: colocar `<BotaoAcoes />` na linha de
      título ("Histórico de evolução"), mesma posição relativa de `index.tsx`
      (`contracts/navegacao.md`). Depende de T003.
- [X] T008b [US2] Corrigir `app-tabs.web.tsx` (`TabSlot`, `paddingTop:
      TAB_BAR_HEIGHT_WEB`) — bug encontrado ao testar T006/T008: a barra de abas
      flutuante da web sempre cobriu o topo do conteúdo; com `BotaoAcoes` agora
      nessa área, o botão ficava inacessível por trás dela (`research.md`, Decisão
      5). Depende de T006, T008.
- [X] T009 [US2] Validar manualmente (ou via web) que as três ações, a partir da
      tela `/acoes`, produzem exatamente o mesmo resultado observável de antes
      (mesmas mensagens de importação, mesma navegação de troca de perfil) — sem
      código novo, apenas confirmação de que a migração de T004 preservou o
      comportamento (FR-004). Depende de T004, T006, T008. **Validado via web**:
      "Importar treino de exemplo" a partir de `/acoes` funcionou, mesma mensagem
      de sucesso, e o treino apareceu na lista de "Treinos" ao voltar — falta
      confirmar em Android e iOS (T011).

**Checkpoint**: as duas User Stories completas — validado via web (Playwright):
ícone de ações acessível e no mesmo lugar em Treinos e Histórico, ambos clicáveis
(bug T008b confirmado corrigido), as três ações produzindo o mesmo resultado de
antes. **Falta validação real em Android e iOS** (T011).

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T010 [P] Rodar `npx tsc --noEmit` e `npx eslint` sobre
      `src/app/acoes.tsx`, `src/app/(tabs)/index.tsx`,
      `src/app/(tabs)/explore.tsx`, `src/components/ui/botao-acoes.tsx` e
      `src/components/ui/icons.tsx` — zero erros novos.
- [ ] T011 Rodar os 4 cenários de `quickstart.md` em Android (Redmi Note 12) e iOS
      (iPhone 16 Plus) — Princípio III da constituição.
- [ ] T012 Atualizar `docs/criterios-aceite.md`, seção "Melhorias
      pós-desenvolvimento", marcando esta feature como implementada e validada.
- [ ] T013 Atualizar o cabeçalho de `specs/015-menu-de-acoes/spec.md` (**Status**)
      para "Implemented" após T011 confirmar a validação nos dois aparelhos.

---

## Dependencies & Execution Order

- **Setup → Foundational → US1 → US2 → Polish**. US1 e US2 não são totalmente
  paralelas desta vez: US2 (T008) depende só de T003 (paralelo a US1), mas T009
  (validação funcional) depende de US1 já estar pronta (T006), já que precisa do
  ícone acessível a partir da aba Treinos também.

### Parallel Opportunities

- T002 e T003 podem ser feitas em sequência rápida (T003 depende de T002).
- T008 (US2, `explore.tsx`) pode rodar em paralelo com T005–T007 (US1,
  `index.tsx`) — arquivos diferentes.
- T010 (type-check/lint) pode rodar em paralelo com T011 (validação manual).

---

## Implementation Strategy

1. Setup + Foundational → tela `/acoes` pronta, ainda inacessível pela UI.
2. US1 → `index.tsx` limpo, com o ícone já levando para `/acoes`.
3. US2 → `explore.tsx` também ganha o ícone; confirma que as ações continuam
   idênticas.
4. Polish → type-check/lint, validação nos dois aparelhos, documentação.
