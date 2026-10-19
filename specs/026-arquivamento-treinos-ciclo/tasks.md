---

description: "Task list template for feature implementation"
---

# Tasks: Arquivamento Lógico de Treinos, "Encerrar Ciclo" e Tratamento de Sessões Abandonadas

**Input**: Design documents from `/specs/026-arquivamento-treinos-ciclo/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (todos presentes)

**Tests**: sem framework de testes automatizados neste projeto (mesma
situação das specs 012-025) — toda validação é manual em aparelho real,
via `quickstart.md`. Nenhuma task de teste automatizado gerada.

**Organização**: tasks agrupadas por User Story (spec.md), na ordem de
prioridade (US1/US2 = P1, US3 = P2, US4 = P3), cada uma terminando com o
gate de `tsc`/`eslint` e as validações de `quickstart.md` correspondentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: a qual User Story esta task pertence (US1-US4)
- Caminhos de arquivo exatos em cada descrição

---

## Phase 1: Setup

**Purpose**: regras do Firestore atualizadas (código + publicação manual).

- [X] T001 [P] Em `firestore.rules`: trocar `allow read, write` por
      `allow read, create, update` (sem `delete`) nos três `match` dentro
      de `users/{uid}` — `treinos/{treinoId}`, `sessoes/{sessaoId}`,
      `ciclos/{cicloId}`. `match /users/{uid}` (documento de conta) **não
      muda**, continua `allow read, write`. Ver
      `contracts/firestore-rules.md` para o arquivo completo esperado.
- [X] T002 **Gate manual (usuário, fora de código)**: publicar o
      `firestore.rules` atualizado (T001) no Console do Firebase
      (Firestore Database → Regras). Depende de T001. **Confirmado pelo
      usuário em 2026-10-18: feito e publicado.**

**Checkpoint**: regras do servidor refletem a proibição de `delete` antes
de qualquer leitura/escrita de código cliente ser exercitada de verdade.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: os dois campos novos (`arquivadoEm`/`encerradoEm`), suas
normalizações de leitura, e o helper de escrita sem leitura que US1 e US4
reaproveitam.

**⚠️ CRITICAL**: nenhuma User Story pode começar antes desta fase estar
completa.

- [X] T003 [P] Em `src/types/treino.ts`: `Treino` ganha
      `arquivadoEm: string | null` — campo sempre presente (não opcional,
      `?:`), mesmo padrão de `SessaoTreino.finalizadaEm`. Ver
      `data-model.md`.
- [X] T004 [P] Em `src/types/ciclo-treino.ts`: `CicloTreino` ganha
      `encerradoEm: string | null` — mesmo padrão de T003. Ver
      `data-model.md`.
- [X] T005 Em `src/services/treino-storage.ts`: `listarTreinos` normaliza
      `arquivadoEm: treino.arquivadoEm ?? null` no mesmo `.map()` que já
      normaliza `categoria ?? 'peso'` — documentos existentes sem o campo
      (anteriores a esta spec) normalizam para `null` (ativo). Depende de
      T003. Ver `contracts/treino-storage.md`.
- [X] T006 Em `src/services/treino-storage.ts`: `montarTreinoValido`
      (único ponto de construção de `Treino`, reaproveitado por importação
      única e em lote) escreve `arquivadoEm: null` explicitamente — nunca
      omitido, nunca `undefined` (`setDoc` nativo rejeita `undefined`).
      Depende de T003. Mesmo arquivo de T005 — fazer em sequência, não em
      paralelo.
- [X] T007 Em `src/services/treino-storage.ts`: adicionar as funções puras
      exportadas `filtrarTreinosAtivos(treinos)` (`arquivadoEm === null`)
      e `filtrarTreinosArquivados(treinos)` (`arquivadoEm !== null`).
      Depende de T005. Ver `contracts/treino-storage.md`.
- [X] T008 Em `src/services/ciclo-treino-storage.ts`: `listarCiclos`
      normaliza `encerradoEm: ciclo.encerradoEm ?? null` (mesmo princípio
      de T005); `criarCiclo` escreve `encerradoEm: null` explicitamente
      (mesmo princípio de T006). Depende de T004. Ver
      `contracts/ciclo-treino-storage.md`.
- [X] T009 Em `src/services/ciclo-treino-storage.ts`: `obterCicloAtual`
      redefinido para retornar o **último** ciclo criado, e só esse, se
      ele próprio tiver `encerradoEm === null` — **mesma assinatura e
      retorno** (`Promise<CicloTreino | null>`), mudança só interna.
      Depende de T008. Ver `contracts/ciclo-treino-storage.md` (zero
      mudança necessária em `treino-storage.ts`/`index.tsx`, que já
      tratam `null` da mesma forma). **Corrigido em 2026-10-18, antes de
      implementar a US3**: a versão original filtrava todos os ciclos com
      `encerradoEm === null` e pegava o último desses — bug que reabriria
      um ciclo antigo (nunca encerrado, mesmo já tendo chegado a 40
      sessões) como "atual" assim que o ciclo mais novo fosse encerrado
      manualmente. Corrigido para olhar só o último criado, nunca cair
      para um anterior.
- [X] T010 [P] Em `src/services/sessao-treino-storage.ts`: implementar
      `finalizarSessaoPorId(uid, sessaoId, lote?: WriteBatch): void` —
      **sem leitura nenhuma** (`updateDoc`/`WriteBatch.update` de um
      único campo, `finalizadaEm`; inspeção de `finalizarSessao` já
      existente confirma que é o único campo tocado). Quando `lote` é
      passado, enfileira no batch do chamador (sem commitar); quando
      omitido, faz `updateDoc` e trata o próprio `.catch`. Reaproveitada
      pelo `writeBatch` de `arquivarTreino` (US1, T014) e pela ação de
      "finalizar sessão em andamento" (US4, T038). Ver
      `contracts/sessao-treino-storage.md`, `research.md` Decisão 4.
- [X] T011 [P] Em `docs/criterios-aceite.md`: criar a entrada "RF25" (ao
      final do arquivo, mesmo padrão da entrada RF24) com todos os
      critérios das 4 User Stories listados em `[ ]` — ainda sem nenhuma
      validação marcada.
- [X] T012 [P] Rodar `npx tsc --noEmit` (projeto inteiro) e `npx eslint`
      (arquivos tocados) — gate da Fase Foundational, zero erros antes de
      iniciar qualquer User Story. Depende de T003-T010.

**Checkpoint**: tipos, normalização de leitura e o helper de finalização
sem leitura prontos — User Stories podem começar.

---

## Phase 3: User Story 1 - Arquivar um treino sem perder histórico (Priority: P1) 🎯 MVP

**Goal**: o usuário consegue arquivar um treino (pela lista ou pela tela
do treino), ele some de "Meus treinos" e de qualquer execução, sem apagar
nenhuma sessão.

**Independent Test**: com um treino já com sessões finalizadas, arquivá-lo
e confirmar que ele some da lista/execução enquanto o histórico continua
mostrando as sessões antigas (`quickstart.md`, Cenários 1-3, 5, 12).

### Implementation for User Story 1

- [X] T013 [US1] Em `src/components/ui/icons.tsx`: criar `ArquivarIcon`
      (mesmo padrão `Svg`/`Path` de `react-native-svg`, traço 2px, sem
      preenchimento, `size`/`color`/`strokeWidth` configuráveis) —
      reaproveitado também pela User Story 2 (link "Treinos arquivados").
- [X] T014 [US1] Em `src/services/treino-storage.ts`: implementar
      `arquivarTreino(uid: string, treinoId: string, sessaoEmAndamentoId: string | null): void`
      — **sem leitura nenhuma**: usa `writeBatch(getFirestore())` para
      `batch.update` de `arquivadoEm` no treino e, se
      `sessaoEmAndamentoId` não for `null`, chama
      `finalizarSessaoPorId(uid, sessaoEmAndamentoId, lote)` (T010) **no
      mesmo lote** antes de `commit()` — garante que nunca existe, nem no
      cache offline, um estado com o treino já arquivado e a sessão ainda
      em andamento. Função síncrona (não `async`), sem retorno, `.catch`
      só dentro da função (log). Depende de T003, T010. Ver
      `contracts/treino-storage.md`, `research.md` Decisão 4.
- [X] T015 [US1] Em `src/app/treino/[treinoId].tsx`: novo state
      `treinoArquivado` + bloqueio no `useEffect` de carregamento inicial
      — ao achar o treino (sem usar `filtrarTreinosAtivos`, precisa vê-lo
      mesmo arquivado) com `arquivadoEm !== null`, não busca sessões, só
      sinaliza o bloqueio; renderização condicional nova mostra "Este
      treino foi arquivado" (mesmo padrão visual de "Treino não
      encontrado"). Depende de T005. Ver `contracts/treino-execucao.md`.
- [X] T016 [US1] Em `src/app/treino/[treinoId].tsx`: no `useEffect` do
      `AppState` já existente, ao voltar a `'active'` com um `treino` já
      carregado e ativo, rechecar `listarTreinos(uid)` e marcar
      `treinoArquivado` se o treino tiver sido arquivado nesse meio tempo
      — cobre o caminho real da notificação de fim de descanso (RF06),
      que hoje só traz o app de volta ao primeiro plano sem navegação
      programática (`research.md`, Decisão 6). **Com `.catch`** —
      leitura "melhor esforço", nunca deixar rejeição não tratada.
      Depende de T015.
- [X] T017 [US1] Em `src/app/treino/[treinoId].tsx`: adicionar
      `useFocusEffect` (`expo-router`) com a mesma checagem leve de T016,
      como reforço de baixo custo — investigação confirmou que
      `[treinoId]` não tem `_layout.tsx` próprio e o native-stack padrão
      desmonta a tela ao voltar, então este reforço cobre só caminhos de
      navegação futuros, não um bug conhecido hoje. **Com `.catch`**.
      Depende de T015. Ver `contracts/treino-execucao.md`.
- [X] T018 [US1] Em `src/app/treino/[treinoId].tsx`: link "Arquivar
      treino" (mesmo padrão visual de "Voltar para exercícios") +
      `handleArquivarTreino` (função síncrona) — `Alert.alert` de
      confirmação (texto condicional conforme `sessaoAtualId !== null`),
      ao confirmar chama `handleDescansoConcluido(false)` (mesma limpeza
      que `handleFinalizarTreino` já faz — cancela cronômetro/notificação
      agendada), `router.back()`, depois
      `arquivarTreino(uid, treino.id, sessaoAtualId)` — sem `.catch` no
      call site (a função já trata o próprio erro). Depende de T014.
- [X] T019 [US1] Em `src/app/(tabs)/index.tsx`: aplicar
      `filtrarTreinosAtivos` nas duas chamadas existentes de
      `listarTreinos(uid)` (`useEffect` inicial e `recarregarTreinos`) —
      zero leitura nova. Depende de T007.
- [X] T020 [US1] Em `src/app/(tabs)/index.tsx`: `carregarDadosDeSessao`
      ganha `sessaoEmAndamentoIdPorTreino: Record<string, string>`,
      populado no mesmo laço que já popula `emAndamentoPorTreino` sobre o
      `sessoes` já lido — **zero leitura nova**. Introduzido já nesta
      User Story (não só na US4) porque `arquivarTreino` (T014) exige
      esse id como argumento — `handleArquivarTreino` (T022) depende
      dele para funcionar, mesmo sem a US4 existir. Depende de T019. Ver
      `research.md`, adendo da Decisão 5.
- [X] T021 [US1] Em `src/components/treino/treino-list-item.tsx` e
      `src/app/(tabs)/index.tsx`: botão "mais opções" por item
      (reaproveita `AcoesIcon`, menor) abrindo `handleAbrirMenuDoTreino`
      — nesta fase, só a opção "Arquivar" (a opção condicional de
      finalizar sessão abandonada entra na US4, T038, reaproveitando o
      mesmo menu). Depende de T020.
- [X] T022 [US1] Em `src/app/(tabs)/index.tsx`: `handleArquivarTreino`
      (função síncrona) com **atualização otimista** — lê
      `sessaoEmAndamentoIdPorTreino[treino.id] ?? null` para montar o
      texto da confirmação **e** para passar como 3º argumento de
      `arquivarTreino`; `setTreinos` remove o item do estado local no
      mesmo toque de confirmação (síncrono), chama
      `arquivarTreino(uid, treino.id, sessaoEmAndamentoId)` (sem `.catch`
      no call site), seguido de `recarregarTreinos()` em segundo plano
      para reconciliar contadores/ciclo. Depende de T014, T020, T021.
      Ver `research.md`, adendo da Decisão 5.
- [X] T023 [US1] Em `src/services/historico-evolucao.ts`
      (`obterHistoricoPorPerfil`): aplicar `filtrarTreinosAtivos` sobre o
      `treinos` já lido, antes do laço que semeia `gruposPorChave`
      (universo de "exercícios nunca registrados", FR-005) — o restante
      da função (registros vindos de `listarSessoesFinalizadas` via
      snapshot) não muda, continua mostrando registros de treinos
      arquivados normalmente. `obterHistoricoPorData` não muda (não
      chama `listarTreinos` desde a spec 025). Depende de T007. Ver
      `contracts/lista-treinos-e-historico.md`.
- [X] T024 [US1] Rodar `npx tsc --noEmit` (projeto inteiro) e `npx eslint`
      (arquivos tocados) — gate da User Story 1, zero erros. Depende de
      T013-T023.
- [X] T025 [US1] Validar `quickstart.md` Cenários 1 (arquivar sem sessão
      em andamento), 2 (arquivar com sessão em andamento), 3 (bloqueio de
      execução, incluindo o retorno do segundo plano), 5 (universo do
      histórico "Por exercício" depois de arquivar, com e sem sessões) e
      12 (descanso ativo, sem notificação remanescente) em Android.
      Marcar `[X]` em `docs/criterios-aceite.md` (T011) os critérios
      correspondentes da "User Story 1" confirmados — só os confirmados
      de verdade. Depende de T024. **Confirmado pelo usuário em
      2026-10-18**: Cenários 1, 2, 5 e 12 confirmados sem ressalva.
      Cenário 3 confirmado só pelo "Plano B" (retorno do segundo plano,
      treino arquivado via edição direta no Console enquanto a tela
      estava em segundo plano) — o "Plano A" (abrir a execução de um
      treino já arquivado por navegação direta) se mostrou **não
      reproduzível pela UI normal**: como arquivar já remove o treino
      por completo da lista (Cenário 1), não sobra nenhum caminho dentro
      do app para "tentar entrar" nele de novo — o próprio Cenário 1 já
      demonstra essa garantia por outro ângulo. Não é uma lacuna, é o
      FR-003 funcionando (ver nota em `quickstart.md`, Cenário 3). O
      critério de "treino arquivado dentro de um ciclo ativo" (anel some,
      sessões continuam contando) não foi exercitado nesta rodada — nenhum
      dos 5 cenários testados envolvia um ciclo ativo; fica para uma
      rodada futura, não bloqueia o fechamento desta task.

**Checkpoint**: User Story 1 completa e testável de forma independente —
MVP pronto.

---

## Phase 4: User Story 2 - Ver e restaurar treinos arquivados (Priority: P1)

**Goal**: o usuário consegue ver a lista de treinos arquivados e restaurar
qualquer um deles, voltando a aparecer em "Meus treinos" com tudo intacto.

**Independent Test**: arquivar um treino (US1), abrir "Treinos
arquivados", restaurá-lo e confirmar que volta com histórico/contadores/
indicador de ciclo intactos (`quickstart.md`, Cenário 4).

### Implementation for User Story 2

- [X] T026 [US2] Em `src/services/treino-storage.ts`: implementar
      `restaurarTreino(uid: string, treinoId: string): void` — **sem
      leitura**, `updateDoc` de um único campo (`arquivadoEm: null`), sem
      `writeBatch` (restaurar nunca tem efeito colateral em sessão
      nenhuma). Função síncrona, sem retorno, `.catch` só dentro da
      função. Depende de T003.
- [X] T027 [US2] Criar `src/app/treinos-arquivados.tsx` (rota top-level
      nova, mesmo padrão de `/acoes`): lista
      `filtrarTreinosArquivados(await listarTreinos(uid))` (1 leitura
      própria desta tela); cada item mostra nome + data de arquivamento +
      botão "Restaurar" **sem confirmação adicional** (ação sem efeito
      colateral) e com **atualização otimista** (`setArquivados` remove o
      item do estado local antes de chamar
      `restaurarTreino(uid, treino.id)` — sem `.catch` no call site).
      Depende de T007, T026. Ver `contracts/lista-treinos-e-historico.md`.
- [X] T028 [US2] Em `src/app/acoes.tsx`: adicionar o link "Treinos
      arquivados" (ícone `ArquivarIcon` de T013 + `ThemedText
      type="link"`, mesmo padrão das linhas existentes) navegando para
      `/treinos-arquivados`. Depende de T013, T027.
- [X] T029 [US2] Rodar `npx tsc --noEmit` + `npx eslint` — gate da User
      Story 2, zero erros. Depende de T026-T028.
- [X] T030 [US2] Validar `quickstart.md` Cenário 4 (restaurar) em
      Android. Marcar `[X]` em `docs/criterios-aceite.md` (T011) o
      critério correspondente da "User Story 2". Depende de T029.
      **Confirmado pelo usuário em 2026-10-18**: treino restaurado volta a
      "Meus treinos" com histórico, contador e indicador de ciclo
      intactos.
- [X] T031 [US2] Validar `quickstart.md` Cenário 5 (universo do histórico
      "Por exercício" depois de arquivar, com e sem sessões — já
      implementado por T023, na US1) em Android, especificamente a partir
      da tela de "Treinos arquivados"/restauração desta User Story, se
      ainda não coberto por T025. Marcar `[X]` em `docs/criterios-aceite.md`
      (T011) o critério correspondente da "User Story 2". Depende de
      T023, T029. **Confirmado pelo usuário em 2026-10-18**: restaurar um
      treino traz de volta o exercício nunca-registrado ao histórico "Por
      exercício", incluindo a contagem correta — sem alteração de dados
      em nenhum dos dois sentidos (arquivar/restaurar).

**Checkpoint**: User Stories 1 e 2 funcionam de forma independente e
juntas.

---

## Phase 5: User Story 3 - Encerrar um ciclo de progresso manualmente (Priority: P2)

**Goal**: o usuário consegue encerrar manualmente o ciclo atual a
qualquer momento, liberando a importação de um novo lote, sem apagar
nenhuma sessão.

**Independent Test**: com um ciclo ativo (menos de 40 sessões), encerrá-lo
e confirmar que a importação de um novo lote passa a funcionar, com
histórico/contadores preservados (`quickstart.md`, Cenário 6).

### Implementation for User Story 3

- [X] T032 [US3] Em `src/components/ui/icons.tsx`: criar
      `EncerrarCicloIcon` (mesmo padrão de T013).
- [X] T033 [US3] Em `src/services/ciclo-treino-storage.ts`: implementar
      `encerrarCiclo(uid: string, cicloId: string): void` — **sem
      leitura**, `updateDoc` de um único campo
      (`encerradoEm: new Date().toISOString()`). Função síncrona, sem
      retorno, `.catch` só dentro da função. Depende de T004.
- [X] T034 [US3] Em `src/app/acoes.tsx`: buscar `obterCicloAtual(uid)` ao
      montar a tela; renderizar o link "Encerrar ciclo" **só quando há
      ciclo ativo** (FR-007); `handleEncerrarCiclo` (função síncrona) com
      `Alert.alert` de confirmação e **atualização otimista**
      (`setCicloAtual(null)` antes de chamar
      `encerrarCiclo(uid, cicloAtual.id)` — sem `.catch` no call site).
      Depende de T009, T032, T033. Ver
      `contracts/acoes-e-sessao-abandonada.md`.
- [X] T035 [US3] Em `src/services/treino-storage.ts`
      (`processarConteudoArray`): atualizar a mensagem de bloqueio de
      importação para
      `'Já existe um ciclo de treinos em andamento. Finalize as 40 sessões esperadas antes de importar um novo lote de múltiplos treinos. Para liberar agora, use Ações → Encerrar ciclo.'`
      — única linha alterada, condição de bloqueio **não muda**. Ver
      `contracts/treino-storage.md`.
- [X] T036 [US3] Rodar `npx tsc --noEmit` + `npx eslint` — gate da User
      Story 3, zero erros. Depende de T032-T035.
- [X] T037 [US3] Validar `quickstart.md` Cenário 6 (encerrar ciclo e
      importar novo lote), Cenário 7 ("Encerrar ciclo" não aparece sem
      ciclo ativo) e Cenário 14 (mensagem de bloqueio orienta "Encerrar
      ciclo") em Android. Marcar `[X]` em `docs/criterios-aceite.md`
      (T011) os critérios correspondentes da "User Story 3". Depende de
      T036. **Confirmado pelo usuário em 2026-10-18**: Cenário 6 completo,
      incluindo o caso de regressão (ciclo antigo da spec 025, nunca
      encerrado, não reabre ao encerrar o mais novo — sem resquício, sem
      anel, sem aviso, sem a opção "Encerrar ciclo"); Cenário 7 confirmado
      (opção não aparece sem ciclo ativo); Cenário 14 confirmado (mensagem
      de bloqueio com a orientação, importação negada).

**Checkpoint**: User Stories 1, 2 e 3 funcionam de forma independente e
juntas.

---

## Phase 6: User Story 4 - Tratar uma sessão iniciada e nunca finalizada (Priority: P3)

**Goal**: o usuário consegue finalizar uma sessão "Em andamento"
diretamente de "Meus treinos", sem abrir a tela de execução.

**Independent Test**: com uma sessão "Em andamento", finalizá-la pela nova
ação direta e confirmar que o destaque some, com as séries preservadas no
histórico (`quickstart.md`, Cenário 8).

**Nota**: `sessaoEmAndamentoIdPorTreino` e `finalizarSessaoPorId` (de que
esta User Story depende) já existem desde a US1 (T020) e a Foundational
(T010), respectivamente — esta fase só acrescenta a ação de UI.

### Implementation for User Story 4

- [X] T038 [US4] Em `src/app/(tabs)/index.tsx`: `handleAbrirMenuDoTreino`
      (T021) ganha a opção condicional "Finalizar sessão em andamento"
      (só quando `emAndamentoPorTreino[treino.id]`); novo
      `handleFinalizarSessaoAbandonada` (função síncrona) com
      `Alert.alert` de confirmação e **atualização otimista** — ao
      confirmar, `setEmAndamentoPorTreino` marca o treino como não mais
      em andamento no mesmo toque (antes de qualquer escrita), chama
      `finalizarSessaoPorId(uid, sessaoEmAndamentoIdPorTreino[treino.id])`
      (T010, sem `.catch` no call site) e só então `recarregarTreinos()`
      em segundo plano — a sessão finalizada por este caminho conta nos
      contadores (RF02/RF16) e no total do ciclo (RF15) exatamente como
      "Finalizar treino" manual, sem nenhum código especial (mesmo campo
      gravado). Depende de T010, T020, T021.
- [X] T039 [US4] Rodar `npx tsc --noEmit` + `npx eslint` — gate da User
      Story 4, zero erros. Depende de T038.
- [X] T040 [US4] Validar `quickstart.md` Cenário 8 (finalizar sessão
      abandonada direto de "Meus treinos") em Android. Marcar `[X]` em
      `docs/criterios-aceite.md` (T011) os critérios correspondentes da
      "User Story 4". Depende de T039. **Confirmado pelo usuário em
      2026-10-18**: Cenário 8 completo, comportamento conforme o esperado.

**Checkpoint**: todas as 4 User Stories validadas de forma independente.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: validação de isolamento entre contas, Rules Playground,
offline/abertura a frio (cross-cutting, exercita todos os fluxos já
validados — incluindo o formato de escrita `updateDoc`/`batch.update`
ainda não validado offline neste projeto), confirmação de que `delete`
nunca é usado, e fechamento da spec.

- [X] T041 [P] Validar `quickstart.md` Cenário 9 (isolamento entre
      contas — trocar de conta de verdade e repetir arquivar/restaurar/
      encerrar ciclo) em Android. Marcar `[X]` em `docs/criterios-aceite.md`
      (T011) o critério correspondente. Depende de T025, T030, T031,
      T037, T040. **Confirmado pelo usuário em 2026-10-18**: mudanças
      isoladas por conta — arquivar/restaurar/encerrar ciclo de uma conta
      não aparecem nem afetam a outra.
- [X] T042 [P] Validar `quickstart.md` Cenário 10 (Rules Playground — os
      4 casos já existentes, se o Console pedir, + o caso novo de
      `delete` negado, replicado para `treinos`/`sessoes`/`ciclos`, 3
      verificações) no Firebase Console. Marcar `[X]` em
      `docs/criterios-aceite.md` (T011) o critério correspondente.
      Depende de T002. **Confirmado pelo usuário em 2026-10-18**: as 3
      simulações de `delete` (`treinos`, `sessoes`, `ciclos`) negadas.
- [ ] T043 Validar `quickstart.md` Cenário 11 (arquivar, restaurar,
      encerrar ciclo e finalizar sessão abandonada, tudo em modo avião +
      Wi-Fi desligado, sincronizando ao reconectar — **cada ação seguida
      de remover o app dos recentes e reabrir ainda em modo avião, para
      provar que a escrita por `updateDoc`/`batch.update` foi persistida
      de verdade, já que este formato ainda não tinha sido validado
      offline neste projeto**) e Cenário 13 (arquivar offline sem demora
      perceptível, confirma a atualização otimista) em Android. Marcar
      `[X]` em `docs/criterios-aceite.md` (T011) o critério
      correspondente. Depende de T025, T030, T031, T037, T040.
- [X] T044 [P] Confirmar por `grep -rn "deleteDoc\|\.delete(\|batch\.delete\|lote\.delete" src/`
      que nenhum arquivo chama `delete` (função avulsa, método de
      documento ou de `WriteBatch`) em `treinos`, `sessoes` ou `ciclos`
      (reconfirmação pós-implementação da premissa de `research.md`
      Decisão 3 — esperado zero ocorrências, mesmo resultado de antes de
      implementar). **Confirmado em 2026-10-18**: zero ocorrências em todo
      `src/` — nenhuma chamada de `delete` de nenhum tipo (Firestore ou
      qualquer outra) existe no código do app.
- [ ] T045 Só depois de T041, T042 e T043 todas concluídas: atualizar
      `docs/criterios-aceite.md` (T011), linha "Validado em Android", com
      o resumo real (quantos cenários confirmados, datas, bugs reais
      encontrados se houver) — mesmo padrão já usado pelas entradas
      RF21/RF23/RF24.
- [ ] T046 Registrar o **RF25** na tabela da seção 6 do
      `docs/PRD-app-treino.md`, seção "Pós-MVP" (mesmo formato das linhas
      RF11-RF24: colunas ID, Requisito, Prioridade, Spec), com a
      descrição "Arquivamento lógico de treinos (campo `arquivadoEm`,
      nunca remoção), ação manual \"Encerrar ciclo\" (campo
      `encerradoEm`) e finalização direta de sessão abandonada a partir
      de \"Meus treinos\"; histórico nunca é apagável, inclusive no
      servidor (estende RF02/RF08/RF15/RF18/RF24)" e `Spec:
      specs/026-arquivamento-treinos-ciclo/`. Depende de T045.
- [ ] T047 Em `spec.md` (campo **Status**, hoje "Draft"), atualizar para
      "Implemented — validado em Android em `<data>` (Princípio III); iOS
      pendente por falta de conta Apple Developer (mesma situação das
      specs 022-025)", mesmo padrão já usado pelas specs 023-025. Depende
      de T045. Esta é a **última** task desta feature — nenhuma outra
      task depende dela.

**Checkpoint**: feature completa, RF25 validado em Android e registrado no
PRD. iOS permanece pendente (falta de conta Apple Developer), mesma
situação das specs 022-025 — não bloqueia o fechamento desta feature em
Android.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — T001 pode começar imediatamente;
  T002 é gate manual do usuário, depende de T001.
- **Foundational (Phase 2)**: depende do Setup (T002, regras publicadas,
  para qualquer escrita de verdade funcionar sem `permission-denied`) —
  **BLOQUEIA** todas as User Stories.
- **User Stories (Phase 3-6)**: todas dependem da Foundational completa.
  US2, US3 e US4 reaproveitam peças da US1 (US2 reaproveita `ArquivarIcon`
  de T013; US3 é independente na implementação; US4 reaproveita
  `sessaoEmAndamentoIdPorTreino`/o menu "mais opções" criados pela US1).
- **Polish (Phase 7)**: depende de todas as 4 User Stories completas.

### User Story Dependencies

- **User Story 1 (P1)**: depende só da Foundational. Nenhuma dependência
  de outra User Story.
- **User Story 2 (P1)**: depende da Foundational; `restaurarTreino`/
  `treinos-arquivados.tsx` são independentes de US1 na implementação
  (exceto o ícone `ArquivarIcon`, T013), mas o teste independente
  (Cenário 4) precisa de um treino já arquivado por US1.
- **User Story 3 (P2)**: depende só da Foundational. Independente de
  US1/US2.
- **User Story 4 (P3)**: depende da Foundational **e** de T020/T021 (US1)
  — reaproveita o mesmo state (`sessaoEmAndamentoIdPorTreino`) e o mesmo
  menu "mais opções" criados por US1, em vez de duplicar.

### Within Each User Story

- Serviço (escrita) antes da tela que o consome.
- Bloqueio/checagem de arquivamento antes do link que arquiva (US1).
- Gate `tsc`/`eslint` antes das validações manuais de `quickstart.md`.

### Parallel Opportunities

- T003/T004 (tipos) em paralelo — arquivos diferentes.
- T010 (`finalizarSessaoPorId`) em paralelo com T003-T009 — arquivo
  diferente, sem dependência de tipo.
- T011 (entrada RF25 em `criterios-aceite.md`) em paralelo com T003-T010.
- T013 (ícone) pode começar em paralelo com T014-T023 de US1 — arquivo
  diferente.
- T032 (ícone de US3) pode começar em paralelo com qualquer task de
  US1/US2.
- T041/T042/T044 (Polish) em paralelo entre si — validações/checagens
  independentes.

---

## Parallel Example: Foundational

```bash
# Tipos, em paralelo (arquivos diferentes):
Task: "Em src/types/treino.ts: Treino ganha arquivadoEm: string | null"
Task: "Em src/types/ciclo-treino.ts: CicloTreino ganha encerradoEm: string | null"

# Helper isolado, em paralelo com qualquer coisa acima:
Task: "Em src/services/sessao-treino-storage.ts: implementar finalizarSessaoPorId sem leitura"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Fase 1: Setup (regras do Firestore).
2. Completar Fase 2: Foundational (tipos + normalização + helper de
   finalização sem leitura — bloqueia tudo).
3. Completar Fase 3: User Story 1 (arquivar).
4. **PARAR e VALIDAR**: testar User Story 1 de forma independente
   (`quickstart.md`, Cenários 1-3, 5, 12).
5. Demonstrar se for o caso — já resolve o problema mais citado pelo
   usuário ("não tem como tirar treinos da lista").

### Incremental Delivery

1. Setup + Foundational → base pronta.
2. US1 (arquivar) → testar independente → esse já é o "MVP" desta spec.
3. US2 (restaurar) → testar independente → fecha o "não é uma armadilha".
4. US3 (encerrar ciclo) → testar independente → resolve o bloqueio de
   importação.
5. US4 (sessão abandonada) → testar independente → resolve a última
   limitação aceita das specs 024/025.
6. Polish (offline — incluindo validar `updateDoc`/`batch.update` offline
   pela primeira vez neste projeto —, Rules Playground, isolamento,
   fechamento).

---

## Notes

- [P] tasks = arquivos diferentes, sem dependência.
- [Story] mapeia cada task à User Story correspondente, pra rastreio.
- Nenhuma task de teste automatizado (sem framework no projeto).
- Rodar o gate (`tsc`/`eslint`) ao final de cada fase antes de validar
  manualmente.
- Nenhuma função de escrita desta spec (`arquivarTreino`,
  `restaurarTreino`, `encerrarCiclo`, `finalizarSessaoPorId`) lê nada
  antes de gravar — todas recebem do chamador os ids que ele já tem em
  memória, e gravam só o(s) campo(s) alterado(s) via `updateDoc`/
  `batch.update`, de forma síncrona.
- Só marcar `[X]` critérios de `docs/criterios-aceite.md` genuinamente
  confirmados pelo usuário em aparelho real — nunca por inferência.
- Evitar: marcar T046/T047 antes de T045 estar pronta; marcar T002 sem
  confirmação explícita do usuário.
