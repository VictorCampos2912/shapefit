---

description: "Task list for spec 024 — Indicador de Sessão em Andamento na Lista de Treinos e Remoção do Treino de Exemplo"
---

# Tasks: Indicador de Sessão em Andamento na Lista de Treinos e Remoção do Treino de Exemplo

**Input**: Design documents from `/specs/024-indicador-andamento-e-menu-acoes/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/lista-treinos.md, contracts/menu-acoes.md, quickstart.md

**Tests**: Sem suíte de testes automatizados no projeto — validação manual em
Android (Constitution v2.0.0, Princípio III), seguindo os cenários de
`quickstart.md`. iOS permanece **pendente** em toda task de validação desta
lista por falta de conta Apple Developer paga (mesmo bloqueio já registrado
pelas specs 022/023) — nenhuma task de validação desta lista pode ser marcada
como confirmada em iOS.

**Organization**: 4 User Stories de `spec.md` (US1/US2 Priority P1, US3/US4
Priority P2). Cinco notas de organização importantes:

1. **Preparação antes de qualquer código (T000-T001)**: capturas de tela de
   referência da versão anterior a esta feature, e a verificação explícita no
   código de quando a `SessaoTreino` passa a existir — pedida pelo usuário
   antes da geração destas tasks, feita durante o próprio `/speckit-tasks` e
   já refletida em `research.md` (Decisão 7) e no edge case corrigido de
   `spec.md`. Nenhuma das duas depende de código novo desta feature.
2. **Duas metades independentes, sem sobreposição de arquivos**: a Fundação
   (T002-T005, indicador na lista) e a User Story 4 (T006-T009, remoção do
   menu de exemplo) não compartilham nenhum arquivo — podem ser feitas em
   paralelo, por pessoas diferentes ou em qualquer ordem entre si. As demais
   User Stories (US1-US3) **dependem** da Fundação (reaproveitam o mesmo
   mecanismo, só variam o cenário de validação), nunca de código adicional.
3. **`docs/criterios-aceite.md` é criado em uma única task (T010), depois das
   duas metades de código**: a entrada RF23 nasce com todos os critérios como
   `[ ]`, e cada task de validação (T011-T015) marca `[X]` só os itens que de
   fato confirma, à medida que roda — nenhuma validação pode "adiantar" o
   `[X]` de um critério que ainda não rodou.
4. **O RF23 já é usado como número desde a spec (`spec.md`, campo
   "Requisito") e confirmado pelo usuário antes destas tasks** — diferente da
   spec 023 (onde o número só foi confirmado depois da validação), aqui não
   há necessidade de uma task de "atualizar o título depois". Ainda assim, a
   **tabela da seção 6 do `docs/PRD-app-treino.md`** só é atualizada na
   **última task (T019)**, depois de toda a validação em Android — pedido
   explícito do usuário para este `/speckit-tasks`.
5. **Edge cases (coexistência com RF15, isolamento entre contas, homônimos)**
   são tratados como validação cross-cutting na Fase de Polish (T016-T018),
   não dentro de uma User Story específica — nenhum deles introduz código
   novo além do que a Fundação (T002-T005) já implementa.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Caminhos conforme `plan.md` (Project Structure): `src/app/(tabs)/index.tsx`,
`src/components/treino/treino-list-item.tsx`, `src/app/acoes.tsx`,
`src/services/treino-storage.ts`, `assets/exemplos/treino-exemplo.json`,
`docs/criterios-aceite.md`, `docs/PRD-app-treino.md`.

---

## Phase 0: Preparação (antes de qualquer mudança de código)

**Purpose**: material que as validações vão precisar depois, e uma
verificação de premissa explicitamente pedida antes de gerar as tasks de
implementação.

- [X] T000 [P] Em um aparelho **Android**, com a versão do app **anterior** a
      esta feature, capturar telas de referência (`quickstart.md`,
      Pré-requisitos): (a) a lista "Meus treinos" sem nenhum treino com
      sessão em andamento; (b) o menu de Ações como está hoje, com "Importar
      treino de exemplo" ainda presente. Guardar as 2 capturas **fora do
      repositório** — material de comparação visual para T011 e T014, não um
      artefato de produto. **Feito pelo usuário manualmente, confirmado em
      2026-10-15**: capturas comparadas contra a lista/menu atuais (T011,
      T014).
- [X] T001 [P] Verificar no código **quando** uma `SessaoTreino` passa a
      existir (`finalizadaEm: null`) — antes ou depois da primeira série
      concluída. **Feito durante o `/speckit-tasks`**: inspeção de
      `src/services/sessao-treino-storage.ts:64-98`
      (`registrarSerieConcluida`, única função que cria o registro) e
      `src/app/treino/[treinoId].tsx:205-220` (`handleConcluirSerie`, único
      chamador) confirma que a sessão só é criada ao concluir a **primeira
      série** — tocar em "Iniciar exercício" é só estado local de UI
      (`iniciado: true`, linha 85), nunca grava nada. **Resultado**: o edge
      case de `spec.md` que dizia "sessão em andamento sem nenhuma série
      registrada" estava incorreto (esse caso é impossível no código atual)
      — já corrigido em `spec.md` (Edge Cases) e registrado em `research.md`
      (Decisão 7). Nenhum FR ou Acceptance Scenario precisou de ajuste (já
      exigiam "completar ao menos uma série").

**Checkpoint**: material de referência pronto, premissa de criação de sessão
confirmada — a Fundação e a User Story 4 podem começar, em paralelo.

---

## Phase 1: Foundational (Blocking Prerequisites) — Indicador de sessão em andamento

**Purpose**: o mecanismo compartilhado que US1, US2 e US3 exercitam (mesmo
código, cenários de validação diferentes) — nenhuma dessas três User Stories
tem código próprio além deste.

**⚠️ CRITICAL**: nenhuma validação de US1/US2/US3 (T011-T013) pode começar
antes de T005 (gate de type-check/lint) passar.

- [X] T002 [P] Em `src/app/(tabs)/index.tsx`: adicionar `obterSessao` ao
      import já existente de `@/services/sessao-treino-storage` (hoje só
      importa `contarSessoesFinalizadas`, `obterDataUltimaSessaoFinalizada`);
      adicionar `const [emAndamentoPorTreino, setEmAndamentoPorTreino] =
      useState<Record<string, boolean>>({})`; adicionar a função
      `carregarSessoesEmAndamento(uid: string, lista: Treino[])`, no mesmo
      formato de `carregarContagens`/`carregarDatasFinalizacao` (linhas
      70-84), chamando `obterSessao(uid, treino.id)` por treino via
      `Promise.all` e populando `emAndamentoPorTreino` com `(await
      obterSessao(...)) !== null` (`contracts/lista-treinos.md`, FR-001/
      FR-003/FR-005). Serve US1, US2, US3.
- [X] T003 [P] Em `src/components/treino/treino-list-item.tsx`: adicionar
      `emAndamento?: boolean` a `TreinoListItemProps`; chamar `useTheme()` no
      topo do componente (ainda não é chamado aqui); tornar o `type` do
      `ThemedView` condicional (`emAndamento ? 'warningBackground' :
      'backgroundElement'`) e adicionar `borderWidth: 2, borderColor:
      theme.warning` ao `style` quando `emAndamento` for `true`; adicionar um
      `ThemedText type="smallBold" themeColor="warning"` com o texto "Em
      andamento", renderizado só quando `emAndamento` for `true`
      (`contracts/lista-treinos.md`, FR-001/FR-002/FR-006; `research.md`,
      Decisões 1 e 5). Sem `emAndamento`/`false`: nenhuma mudança na árvore
      renderizada (FR-002). Serve US1, US2, US3.
- [X] T004 Em `src/app/(tabs)/index.tsx`: chamar `carregarSessoesEmAndamento`
      dentro dos dois `Promise.all` já existentes (`recarregarTreinos`,
      linhas 92-101; `useEffect` inicial, linhas 103-122) junto com
      `carregarContagens`/`carregarDatasFinalizacao` — sem alterar o
      `useFocusEffect` já existente (linhas 124-129, continua chamando só
      `recarregarTreinos()`); passar `emAndamento={emAndamentoPorTreino[item.id]
      ?? false}` ao `TreinoListItem` dentro do `renderItem` do `FlatList`
      (`contracts/lista-treinos.md`). Depende de T002, T003.
- [X] T005 [P] Rodar `npx tsc --noEmit` e `npx eslint` nos arquivos tocados
      por esta fase (`src/app/(tabs)/index.tsx`,
      `src/components/treino/treino-list-item.tsx`), confirmando ausência de
      erros de tipo e lint, conforme Princípio I da Constituição. Depende de
      T004. Pode rodar em paralelo com T006-T009 (Fase 2, arquivos
      diferentes).

**Checkpoint**: indicador de sessão em andamento funcional e sem erros de
tipo/lint — US1, US2 e US3 já podem ser validadas (depende também de T010).

---

## Phase 2: User Story 4 - Menu de Ações sem a ação de treino de exemplo (Priority: P2)

**Goal**: remover a ação "Importar treino de exemplo" do menu de Ações,
junto com o código e o asset que ficarem sem uso, sem tocar nas outras três
ações nem em `docs/exemplos/`.

**Independent Test**: abrir o menu de Ações e confirmar que só restam três
ações; confirmar que nenhuma referência a `importarTreinoExemplo` ou ao asset
embutido sobra no código; confirmar que `docs/exemplos/` não foi tocado.

### Implementation for User Story 4

- [X] T006 [P] [US4] Em `src/app/acoes.tsx`: remover a função
      `handleImportarTreinoExemplo` (linhas 114-123), o `Pressable`
      correspondente "Importar treino de exemplo" (linhas 146-149), e
      `importarTreinoExemplo` do import de `@/services/treino-storage`
      (linha 12) — `importarTreino` permanece importada e usada
      (`contracts/menu-acoes.md`, FR-008/FR-009). Nenhuma outra linha deste
      arquivo é alterada.
- [X] T007 [P] [US4] Em `src/services/treino-storage.ts`: remover a função
      exportada `importarTreinoExemplo` (linhas 310-315) e o import
      `import treinoExemplo from '@/assets/exemplos/treino-exemplo.json';`
      (linha 5) — `processarConteudo` (reaproveitada por `importarTreino`)
      permanece sem alteração (`contracts/menu-acoes.md`, FR-008/FR-010).
- [X] T008 [US4] Apagar `assets/exemplos/treino-exemplo.json` — confirmar
      antes (busca textual em `src/`) que, depois de T006 e T007, nenhum
      arquivo do app ainda importa esse caminho (`research.md`, Decisão 4;
      `contracts/menu-acoes.md`, FR-010). **Não apagar nenhum arquivo em**
      `docs/exemplos/` (FR-011) — são fixtures de teste manual, arquivos
      distintos deste asset. Depende de T006, T007.
- [X] T009 [P] [US4] Rodar `npx tsc --noEmit` e `npx eslint` nos arquivos
      tocados por esta fase (`src/app/acoes.tsx`,
      `src/services/treino-storage.ts`), confirmando ausência de erros de
      tipo e lint. Depende de T008. Pode rodar em paralelo com T005 (Fase 1,
      arquivos diferentes).

**Checkpoint**: menu de Ações sem a ação de exemplo, código/asset órfãos
removidos, sem erros de tipo/lint — US4 já pode ser validada (depende também
de T010).

---

## Phase 3: Documentação de critérios de aceite (RF23)

**Purpose**: registrar, em `docs/criterios-aceite.md`, a entrada do RF23
(com todos os critérios como `[ ]`) e as emendas ao RF01/RF14 — pré-requisito
de todas as tasks de validação (T011-T018), que marcam `[X]` os itens aqui
criados. Depende das duas metades de código (T005, T009) já estarem prontas.

- [X] T010 Em `docs/criterios-aceite.md`:
      1. Ao final do arquivo (depois da entrada do RF21, mesmo separador
         `---` já usado entre entradas), adicionar uma nova entrada:

         ```markdown
         ### RF23 — Indicador de Sessão em Andamento na Lista de Treinos e Remoção do Treino de Exemplo

         **Spec**: `specs/024-indicador-andamento-e-menu-acoes/` · Parte 1
         estende RF02/RF04; Parte 2 estende RF14/RF01. Número confirmado em
         2026-10-14 ao registrar no PRD (disciplina já usada pelo RF11-RF21
         — nunca presumir o número antes de fechar).

         **Critérios de aceite:**

         Treino em andamento aparece destacado (User Story 1):
         - [ ] Ao iniciar uma sessão (completar ao menos uma série) e voltar
               para a lista, o treino aparece com o mesmo destaque visual de
               cor/borda de aviso já usado para "exercício em andamento",
               mais o texto "Em andamento"
         - [ ] O destaque persiste após fechar e reabrir o app
         - [ ] O destaque é legível em tema claro e escuro
         - [ ] Um treino sem sessão em andamento aparece exatamente como
               antes desta feature (comparação com a captura de referência
               de T000)

         Múltiplos treinos em andamento ao mesmo tempo (User Story 2):
         - [ ] Dois ou mais treinos com sessão em andamento aparecem
               destacados simultaneamente
         - [ ] Finalizar a sessão de um deles remove só o destaque desse
               treino, sem afetar os demais

         Destaque some ao finalizar, volta ao iniciar nova sessão (User Story 3):
         - [ ] Finalizar a sessão remove o destaque na próxima vez que a
               lista ganha foco
         - [ ] Iniciar uma nova sessão do mesmo treino faz o destaque
               reaparecer

         Menu de Ações sem "Importar treino de exemplo" (User Story 4):
         - [ ] O menu de Ações passa a ter exatamente três ações (sair da
               conta, importar treino, créditos), sem nenhum traço da ação
               removida
         - [ ] As três ações restantes continuam funcionando exatamente como
               antes
         - [ ] Nenhum arquivo de `docs/exemplos/` foi alterado ou removido
               por esta feature

         Edge cases:
         - [ ] Coexistência com o anel de progresso de ciclo (RF15): os dois
               indicadores aparecem juntos, sem um esconder o outro
         - [ ] Isolamento entre contas (Constitution, Princípio V): o
               destaque de uma conta nunca aparece para outra conta no mesmo
               aparelho
         - [ ] Treinos homônimos (RF02/RF16): só o treino com sessão em
               andamento de fato (por identificador interno) é destacado

         **Validado em Android**: [preencher em T019, ao final da validação].
         **Nenhuma validação em iOS** (Constitution v2.0.0, Princípio III;
         iOS bloqueado pela falta de conta Apple Developer paga, mesma
         situação das specs 022/023).
         ```
      2. Na entrada do **RF01** (seção "## RF01"), junto à decisão "App
         inclui um arquivo de exemplo pré-carregado para testes" e ao
         critério "O arquivo de exemplo pré-carregado no app importa sem
         erros, servindo como referência de teste", adicionar: `**Nota (spec
         024, RF23, 2026-10-14):** removido — a ação "Importar treino de
         exemplo" não existe mais no app; ver RF23. O texto acima permanece
         como registro histórico da decisão e validação originais do RF01.`
         (FR-012) — sem apagar nem reescrever o texto original.
      3. Na entrada do **RF14** (seção "### RF14"), junto ao critério "As
         três ações, a partir dessa tela, se comportam exatamente como
         antes", adicionar: `**Nota (spec 024, RF23, 2026-10-14):** uma das
         três ações originais, "Importar treino de exemplo", foi removida
         por esta feature — a tela de Ações passou a ter duas ações de
         ponto de entrada (sair da conta, importar treino) mais os créditos
         (RF19/RF20). O texto abaixo permanece como registro histórico da
         validação original do RF14.` (FR-012) — sem apagar nem reescrever o
         texto original.
      Depende de T005, T009.

**Checkpoint**: entrada RF23 criada (todos os critérios `[ ]`), RF01/RF14
emendados — toda validação (T011-T018) já pode começar.

---

## Phase 4: User Story 1 - Reconhecer de volta qual treino estava em andamento (Priority: P1) 🎯 MVP

**Goal**: o usuário volta para a lista depois de iniciar um treino e
reconhece de imediato qual treino estava em andamento.

**Independent Test**: iniciar uma sessão (completar ao menos uma série, sem
finalizar), voltar para a lista e confirmar o destaque; fechar/reabrir o app
e confirmar que persiste.

- [X] T011 [US1] Validar `quickstart.md` Cenário 1 (passos 1-8) em Android:
      destaque aparece ao voltar da execução (sem nenhuma chamada explícita
      de navegação — `research.md`, Decisão 3), persiste após reiniciar o
      app, legível em tema claro e escuro, e o treino sem sessão em andamento
      é visualmente idêntico à captura de referência de T000. Marcar `[X]`
      em `docs/criterios-aceite.md` (T010) os 4 critérios da "User Story 1"
      que forem confirmados — só os confirmados de verdade. Depende de T005,
      T010. **Confirmado em Android** (4 de 4 critérios): o destaque aparece
      ao voltar da execução, com a mesma cor do "exercício em andamento"
      (2026-10-14); o destaque persiste ao sair e voltar/fechar e reabrir o
      app (2026-10-15); legível em tema claro e escuro, em todos os treinos
      que aparecem destacados (2026-10-15); treino sem sessão em andamento
      permanece idêntico a antes da feature (2026-10-15).

**Checkpoint**: User Story 1 validada de forma independente — MVP pronto.

---

## Phase 5: User Story 2 - Vários treinos em andamento ao mesmo tempo (Priority: P1)

**Goal**: dois ou mais treinos em andamento aparecem destacados ao mesmo
tempo, e finalizar um não afeta o destaque do outro.

**Independent Test**: iniciar sessões em dois treinos diferentes, sem
finalizar nenhuma, e confirmar que os dois aparecem destacados ao mesmo
tempo.

- [X] T012 [US2] Validar `quickstart.md` Cenário 2 (passos 1-5) em Android,
      reaproveitando o "Treino A" em andamento do Cenário 1 (T011): iniciar
      também o "Treino B" e confirmar os dois destacados simultaneamente;
      finalizar só o "Treino A" e confirmar que só ele perde o destaque.
      Marcar `[X]` em `docs/criterios-aceite.md` (T010) os 2 critérios da
      "User Story 2" confirmados. Depende de T011. **Confirmado em Android**
      (2 de 2 critérios): dois treinos em execução aparecem destacados ao
      mesmo tempo (2026-10-14); finalizar só um dos dois remove o destaque
      apenas dele, sem afetar o outro (2026-10-15).

**Checkpoint**: User Stories 1 e 2 validadas — indicador funciona com
múltiplos treinos.

---

## Phase 6: User Story 3 - O destaque some ao finalizar a sessão (Priority: P2)

**Goal**: finalizar uma sessão remove o destaque; iniciar uma nova sessão do
mesmo treino faz o destaque reaparecer.

**Independent Test**: finalizar uma sessão em andamento e confirmar que o
destaque desaparece ao voltar para a lista; iniciar uma nova sessão do mesmo
treino e confirmar que o destaque reaparece.

- [X] T013 [US3] Validar `quickstart.md` Cenário 3 (passos 1-6) em Android,
      reaproveitando o "Treino B" do Cenário 2 (T012, já sem destaque depois
      de finalizado): confirmar que "Finalizado em `<data/hora>`" (RF16)
      também atualizou; iniciar uma nova sessão do "Treino B" e confirmar
      que o destaque reaparece. Marcar `[X]` em `docs/criterios-aceite.md`
      (T010) os 2 critérios da "User Story 3" confirmados. Depende de T012.
      **Confirmado em Android** (2 de 2 critérios): ao concluir o treino as
      cores voltam ao normal, com o horário ("Finalizado em") correto
      (2026-10-14); iniciar uma nova sessão do mesmo treino faz o destaque
      reaparecer, como esperado (2026-10-15).

**Checkpoint**: todas as User Stories do indicador (US1-US3) validadas.

---

## Phase 7: User Story 4 (validação) - Menu de Ações sem a ação de treino de exemplo

- [X] T014 [US4] Validar `quickstart.md` Cenário 5 (passos 1-7) em Android:
      exatamente três ações no menu; "Importar treino" continua funcionando;
      "Sair da conta"/login novamente funciona (spec 022); créditos
      (RF19/RF20) sem alteração; comparação com a captura de referência de
      T000 (só a ausência da ação removida como diferença). Marcar `[X]` em
      `docs/criterios-aceite.md` (T010) os 2 primeiros critérios da "User
      Story 4" confirmados. Depende de T009, T010. **Confirmado em Android**
      (2 de 2 critérios): "Importar treino de exemplo" não aparece mais no
      menu, "Importar treino" e "Créditos do catálogo de exercícios"
      funcionando (2026-10-14); "Sair da conta" continua existindo e
      funcionando (2026-10-15).
- [X] T015 [US4] Validar `quickstart.md` Cenário 6 (`git status`/`git diff`
      desta feature): confirmar que nenhum arquivo dentro de
      `docs/exemplos/` aparece como alterado, adicionado ou removido, e que
      só `assets/exemplos/treino-exemplo.json` foi removido. Marcar `[X]` em
      `docs/criterios-aceite.md` (T010) o 3º critério da "User Story 4"
      (`docs/exemplos/` intocado). Depende de T008. **Confirmado em
      2026-10-14** por `git status`/`git diff` (verificação de código, não
      depende de aparelho): zero arquivos sob `docs/exemplos/` alterados;
      só `assets/exemplos/treino-exemplo.json` removido.

**Checkpoint**: todas as 4 User Stories validadas em Android.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: validação dos edge cases (cross-cutting, sem código próprio
além da Fundação) e registro final do RF23 no PRD.

- [X] T016 [P] Validar `quickstart.md` Cenário 4 (coexistência com anel de
      progresso de ciclo, RF15) em Android — só aplicável se houver um ciclo
      em andamento no momento do teste; senão, pular e registrar "N/A" em
      vez de `[X]`. Marcar `[X]` em `docs/criterios-aceite.md` (T010) o
      critério de "Edge cases" correspondente, se validado. Depende de T011
      (em andamento — ver nota do T011; a dependência foi só sobre o
      mecanismo já existir e ser testável, não sobre o Cenário 1 estar
      100% fechado). **Confirmado em Android, 2026-10-14**: o anel de
      progresso e o destaque de "em andamento" coexistem no mesmo item, sem
      um esconder o outro — inclusive com o anel em 0% (ciclo recém-iniciado,
      nenhuma sessão finalizada ainda).
- [X] T017 [P] Validar `quickstart.md` Cenário 7 (isolamento entre contas,
      Constitution Princípio V) em Android, com uma segunda conta de teste:
      sessão em andamento da Conta A não aparece destacada para a Conta B, e
      sobrevive à troca de volta para a Conta A. Marcar `[X]` em
      `docs/criterios-aceite.md` (T010) o critério de "Edge cases"
      correspondente. Depende de T011 (mesma nota do T016). **Confirmado em
      Android, 2026-10-14**: isolamento entre contas sem interferência.
- [X] T018 [P] Validar `quickstart.md` Cenário 8 (treinos homônimos, FR-007)
      em Android: dois treinos com o mesmo nome, sessão em andamento em só
      um deles, confirmar que só esse item é destacado (por `treino.id`, não
      pelo nome). Marcar `[X]` em `docs/criterios-aceite.md` (T010) o
      critério de "Edge cases" correspondente. Depende de T011 (mesma nota
      do T016). **Confirmado em Android, 2026-10-14**: treinos com o mesmo
      nome continuam distinguíveis — só o que tem sessão em andamento de
      fato é destacado.
- [X] T019 Só depois de T011-T018 todas concluídas (ou explicitamente
      marcadas "N/A", caso do T016): (a) atualizar `docs/criterios-aceite.md`
      (T010), linha "**Validado em Android**: [preencher em T019...]",
      substituindo pelo resumo real (quantos cenários confirmados, datas, e
      a mesma nota de "Nenhuma validação em iOS" já presente); (b) registrar
      o **RF23** na tabela da seção 6 do `docs/PRD-app-treino.md`, na seção
      "Pós-MVP" (mesmo formato das linhas RF11-RF22: colunas ID, Requisito,
      Prioridade, Spec), com a descrição "Indicador visual de sessão em
      andamento na lista de treinos (estende RF02/RF04) e remoção da ação
      'Importar treino de exemplo' do menu de Ações (estende RF14/RF01)" e
      `Spec: specs/024-indicador-andamento-e-menu-acoes/`; (c) em `spec.md`
      (campo **Status**, hoje "Draft"), atualizar para "Implemented —
      validado em Android em `<data>` (Princípio III); iOS pendente por
      falta de conta Apple Developer (mesma situação das specs 022/023)",
      mesmo padrão de redação já usado pelo campo **Status** da spec
      `023-observacao-e-imagens-bi-set/spec.md`. Esta é a **última** task
      desta feature — nenhuma outra task depende dela. **Feito em
      2026-10-15**: (a) resumo "8 de 8 cenários do `quickstart.md`
      confirmados (2026-10-14 a 2026-10-15)" registrado em
      `docs/criterios-aceite.md`; (b) RF23 adicionado à tabela da seção 6 do
      `docs/PRD-app-treino.md` (Prioridade Média, após o RF22); (c) `spec.md`
      com Status "Implemented — validado em Android em 2026-10-15".

**Checkpoint**: feature completa, RF23 validado em Android e registrado no
PRD. iOS permanece pendente (falta de conta Apple Developer), mesma situação
das specs 022/023 — não bloqueia o fechamento desta feature em Android.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Preparação (Fase 0)**: sem dependências — pode começar imediatamente.
- **Fundação (Fase 1, indicador)** e **User Story 4 (Fase 2, menu)**: sem
  dependência entre si — podem rodar em paralelo, cada uma depende só da
  Fase 0 ter terminado (T001 confirma a premissa que T002-T004 usam).
- **Documentação RF23 (Fase 3)**: depende da Fase 1 (T005) **e** da Fase 2
  (T009) — bloqueia toda validação (Fases 4-8).
- **User Stories 1-3 (Fases 4-6)**: sequenciais entre si (cada uma reaproveita
  o estado de treino deixado pela anterior, conforme `quickstart.md`), todas
  depois da Fase 3.
- **User Story 4 - validação (Fase 7)**: depois da Fase 3; independente das
  Fases 4-6 (pode rodar em paralelo com elas, se houver mais de um aparelho/
  testador).
- **Polish (Fase 8)**: os edge cases (T016-T018) dependem de T011 (Fase 4);
  o registro final (T019) depende de **todas** as validações (T011-T018).

### Parallel Opportunities

- T000 e T001 (Fase 0) são independentes entre si.
- T002 e T003 (Fase 1) tocam arquivos diferentes — paralelos.
- T005 (Fase 1) e T006-T009 (Fase 2) tocam arquivos diferentes — toda a Fase
  2 pode rodar em paralelo com a Fase 1.
- T016, T017 e T018 (Fase 8) são validações independentes entre si — podem
  rodar em paralelo (ou em qualquer ordem) depois de T011.

---

## Parallel Example: Fundação + User Story 4

```bash
# Depois de T000/T001, os dois blocos abaixo podem rodar ao mesmo tempo:

# Bloco A — indicador (Fase 1)
Task: "T002 — index.tsx: carregarSessoesEmAndamento"
Task: "T003 — treino-list-item.tsx: prop emAndamento"
# (T004 depende dos dois acima; T005 depende de T004)

# Bloco B — remoção do menu de exemplo (Fase 2)
Task: "T006 — acoes.tsx: remover ação de exemplo"
Task: "T007 — treino-storage.ts: remover importarTreinoExemplo"
# (T008 depende dos dois acima; T009 depende de T008)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Fase 0 (Preparação).
2. Completar Fase 1 (Fundação — indicador).
3. Completar Fase 3 (Documentação RF23) — depende também da Fase 2 estar
   pronta, já que a mesma entrada cobre as duas metades; se a Fase 2 ainda
   não estiver pronta, adiar T010 ou criar a entrada só com os critérios de
   US1-US3 preenchidos e os de US4 como `[ ]` até a Fase 2 terminar.
4. Completar Fase 4 (validar User Story 1).
5. **PARAR e VALIDAR**: User Story 1 funcionando de forma independente —
   já é o indicador funcionando para o caso mais simples (um treino em
   andamento).

### Incremental Delivery

1. Fase 0 + Fase 1 (ou Fase 2, em paralelo) → mecanismo pronto.
2. Fase 3 (doc) → Fase 4 (US1) → valida o essencial do indicador (MVP).
3. Fase 5 (US2) → múltiplos treinos.
4. Fase 6 (US3) → destaque some ao finalizar.
5. Fase 7 (US4) → menu sem a ação de exemplo (pode ser entregue antes ou
   depois das Fases 4-6, já que é independente).
6. Fase 8 (Polish) → edge cases + registro final no PRD.

## Notes

- [P] tasks = arquivos diferentes, sem dependência entre si.
- [Story] label mapeia a task para a User Story correspondente, para
  rastreabilidade.
- Nenhuma task deve ser marcada `[X]` sem a validação correspondente ter
  rodado de fato em Android — inclusive em `docs/criterios-aceite.md` (T010),
  cujos critérios nascem todos `[ ]`.
- iOS fica pendente em toda esta feature (falta de conta Apple Developer) —
  nenhuma task de validação pode citar iOS como confirmado.
- Evitar: marcar T019 (registro no PRD) antes de T011-T018 estarem
  realmente concluídas — pedido explícito do usuário para este
  `/speckit-tasks`.
