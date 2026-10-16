---

description: "Task list for spec 025 — Migração de Sessões, Histórico e Ciclo de Progresso para o Firestore"
---

# Tasks: Migração de Sessões, Histórico e Ciclo de Progresso para o Firestore

**Input**: Design documents from `/specs/025-migracao-sessoes-historico-ciclo/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/firestore-rules.md, contracts/sessao-treino-storage.md,
contracts/ciclo-treino-storage.md, contracts/lista-treinos-e-historico.md,
quickstart.md

**Tests**: Sem suíte de testes automatizados no projeto — validação manual
em Android (Constitution v2.0.0, Princípio III), seguindo os cenários de
`quickstart.md`. iOS permanece **pendente** em toda task de validação desta
lista por falta de conta Apple Developer paga (mesmo bloqueio já registrado
pelas specs 022-024) — nenhuma task de validação desta lista pode ser
marcada como confirmada em iOS.

**Organization**: 6 User Stories de `spec.md` (US1/US2/US3 Priority P1,
US4/US5 Priority P2, US6 Priority P3). Cinco notas de organização
importantes:

1. **Publicar `firestore.rules` é um gate manual do usuário (T002)**:
   nenhuma task de validação em aparelho ou no Rules Playground pode
   rodar antes dessa confirmação — mesmo princípio já usado nas specs
   anteriores para passos que só o usuário pode executar (fora do alcance
   de qualquer código deste repositório).
2. **`CicloTreino.perfilId` → `uid` (T021) só é renomeado na Fase 6, não
   na Fundação**: diferente de `SessaoRegistro` (T003, renomeado já na
   Fundação porque `sessao-treino-storage.ts` é inteiramente reescrito
   logo depois, nas mesmas tasks), `ciclo-treino-storage.ts` só é
   reescrito na Fase 6 (US4) — renomear o campo do tipo antes disso
   quebraria o type-check desse arquivo (ainda não tocado) no gate da
   Fundação (T010). O rename e a reescrita do serviço precisam ficar
   juntos, na mesma fase.
3. **Quase tudo é Fundação**: como 5 das 6 User Stories desta spec
   compartilham a mesma migração de base (tipos + `sessao-treino-storage.ts`
   inteiro + o ponto de criação da sessão em `[treinoId].tsx`/
   `exercicio-execucao.tsx`), a Fundação (T003-T012) cobre a maior parte do
   código novo. As fases de User Story que ainda têm código próprio são só
   US2 (`historico-evolucao.ts` + `index.tsx`) e US4
   (`src/types/ciclo-treino.ts` + `ciclo-treino-storage.ts`) — US1, US3,
   US5 e US6 são só validação do que a Fundação já entrega.
4. **`docs/criterios-aceite.md` nasce no fim da Fundação (T011)**, com
   todos os critérios das 6 User Stories como `[ ]` — cada task de
   validação (T013 em diante) marca `[X]` só o que confirmar de verdade,
   mesmo padrão já usado pela spec 024.
5. **RF24 na tabela da seção 6 do PRD só depois de toda a validação**
   (T031), e a troca de Status de `spec.md` de "Draft" para "Implemented"
   junto (T032) — mesma disciplina já seguida pelas specs 023/024.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Caminhos conforme `plan.md` (Project Structure): `firestore.rules`,
`src/types/perfil.ts`, `src/types/ciclo-treino.ts`,
`src/types/execucao-treino.ts`, `src/services/sessao-treino-storage.ts`,
`src/services/ciclo-treino-storage.ts`, `src/services/historico-evolucao.ts`,
`src/app/(tabs)/index.tsx`, `src/app/treino/[treinoId].tsx`,
`src/components/treino/exercicio-execucao.tsx`, `docs/criterios-aceite.md`,
`docs/PRD-app-treino.md`, `spec.md`.

---

## Phase 1: Setup

**Purpose**: regras do Firestore e o gate manual de publicação — nada de
código de app depende disso para compilar, mas toda validação em
aparelho/Console depende da publicação ter acontecido de verdade.

- [x] T001 [P] Em `firestore.rules`, adicionar dentro de `match /users/{uid}`:
      `match /sessoes/{sessaoId} { allow read, write: if request.auth != null && request.auth.uid == uid; }`
      e `match /ciclos/{cicloId} { allow read, write: if request.auth != null && request.auth.uid == uid; }`
      — réplica literal da regra já existente para `treinos`
      (`contracts/firestore-rules.md`). **Feito.**
- [x] T002 **Gate manual (usuário, fora de código)**: publicar o
      `firestore.rules` atualizado (T001) no Console do Firebase
      (Firestore Database → Regras) — mesmo passo manual já feito para a
      spec 022. **Nenhuma task de validação em aparelho ou no Rules
      Playground (T013 em diante) pode ser marcada `[X]` antes desta
      confirmação explícita do usuário.** **Confirmado pelo usuário em
      2026-10-15**: regras publicadas no Console do Firebase.

**Checkpoint**: regras prontas no repositório; validação em aparelho/Console
só pode começar depois de T002 confirmado pelo usuário.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: migração completa dos tipos de sessão e de
`sessao-treino-storage.ts` (AsyncStorage → Firestore) — toda User Story
depende de pelo menos uma parte desta fase; nenhuma pode começar antes
dela. **`CicloTreino`/`ciclo-treino-storage.ts` ficam de fora de propósito**
(nota de organização 2 acima) — migram juntos na Fase 6.

**⚠️ CRITICAL**: nenhuma task de User Story (T013 em diante) pode começar
antes de T010 (gate de type-check/lint) passar.

- [x] T003 [P] Em `src/types/perfil.ts`: renomear o campo `perfilId` de
      `SessaoRegistro` para `uid` (mesmo tipo `string`, mesmo valor —
      `research.md`, Decisão 6). Único tipo base de `SessaoTreino`
      (`SessaoTreino extends SessaoRegistro`, confirmado por grep: nenhum
      outro tipo usa `SessaoRegistro`; também confirmado por grep que não
      há hoje nenhum acesso `.perfilId` em `src/` fora da própria
      construção do objeto dentro dos serviços). **Qualquer outro
      consumidor de `SessaoRegistro.perfilId` que o `tsc` apontar depois
      desta mudança é corrigido dentro desta mesma task** — não deixar
      para uma task posterior. **Feito**: renomeado; o `tsc` (T010) também
      apontou dois consumidores de objeto `{ perfilId: uid, ... }` fora de
      `sessao-treino-storage.ts` que não estavam listados nas tasks
      originais — `src/app/treino/[treinoId].tsx` (`handleEditarSerie` →
      `atualizarSerieRealizada`, `handleConcluirExercicio` →
      `marcarExercicioConcluido`) e `src/app/(tabs)/explore.tsx`
      (`handleEditarRegistro` → `atualizarSerieDeSessaoFinalizada`, RF09b)
      — todos corrigidos para `uid` dentro deste bloco de implementação.
- [x] T004 Em `src/types/execucao-treino.ts` (`data-model.md`): adicionar a
      `SessaoTreino` os campos `treinoNomeSnapshot: string` e
      `exerciciosSnapshot: { id: string; nome: string; categoria:
      CategoriaExercicio }[]` (import de `CategoriaExercicio` de
      `@/types/treino`); adicionar a `SerieRealizada` o campo
      `registradaEm: string`. Depende de T003 (campo `uid` de
      `SessaoRegistro` já renomeado, já que `SessaoTreino` o estende).
      **Feito.**
- [x] T005 Em `src/services/sessao-treino-storage.ts`
      (`contracts/sessao-treino-storage.md`): remover todo o acesso a
      `AsyncStorage`; adicionar `sessoesCollection(uid)`,
      `setDocSessao(uid, sessao)` (sem `await`, `.catch` com
      `console.error` — `research.md` Decisão 4), `listarSessoes(uid)`
      (`getDocs` da coleção inteira, ordenada por `iniciadaEm` + `id` como
      desempate — `research.md` Decisão 2) e `sessaoEmAndamentoQuery(uid,
      treinoId)` (`query` com `where('treinoId','==',treinoId)`,
      `where('finalizadaEm','==',null)`, `limit(1)`); reescrever
      `obterSessao(uid, treinoId)` e `registrarSerieConcluida(params)`
      para usar `sessaoEmAndamentoQuery` (não `listarSessoes`) —
      `registrarSerieConcluida` ganha o parâmetro `treinoSnapshot: {
      nome: string; exercicios: { id: string; nome: string; categoria:
      CategoriaExercicio }[] }` (usado só ao criar a sessão) e define
      `registradaEm: new Date().toISOString()` em cada série registrada.
      Depende de T004.
      - **Comentário obrigatório no código, em `sessaoEmAndamentoQuery`**:
        explicar que, se existirem duas sessões em andamento do mesmo
        treino ao mesmo tempo (corrida entre aparelhos, `spec.md` Edge
        Cases — aceita como last-write-wins, confirmado pelo usuário em
        2026-10-15), `limit(1)` retorna uma delas sem nenhum critério de
        escolha (a ordem de uma query sem `orderBy` não é garantida) —
        comportamento aceito, não um bug.
      - **Verificar antes de escrever `undefined` em qualquer campo do
        documento** (`setDoc` nativo rejeita `undefined` e, com o padrão
        fire-and-forget desta spec, a falha ficaria só no `.catch`,
        silenciosa para o usuário): confirmado por leitura de
        `src/services/treino-storage.ts` (`listarTreinos`, linha ~45:
        `categoria: exercicio.categoria ?? 'peso'`) que `categoria` já
        chega sempre normalizada (nunca `undefined`) em `treino.exercicios`
        quando `[treinoId].tsx` monta `treinoSnapshot` — e `id`/`nome` são
        campos obrigatórios de `ExercicioPlanejado`, nunca `undefined`.
        Nenhum campo de `treinoSnapshot` precisa de normalização ou
        omissão condicional **nas condições de hoje** — mas **reconfirmar
        isso na implementação** (não só confiar nesta nota) antes de
        assumir que nenhum `?? 'peso'`/espalhamento condicional é
        necessário na montagem de `exerciciosSnapshot`, já que qualquer
        mudança futura em `listarTreinos` poderia invalidar essa garantia
        silenciosamente. **Reconfirmado na implementação**: lido
        `treino-storage.ts` de verdade (`validarEstruturaTreino` rejeita
        `nome` ausente/vazio; `validarExercicio` rejeita `id`/`nome`
        ausentes/vazios; `categoria` é sempre normalizada na leitura,
        `?? 'peso'`) — nenhum campo de `treinoSnapshot` pode chegar
        `undefined` hoje; comentário correspondente deixado no código
        (JSDoc do parâmetro `treinoSnapshot`), sem nenhuma normalização
        defensiva adicionada (não havia nada para normalizar). **Feito.**
- [x] T006 Em `src/services/sessao-treino-storage.ts`: reescrever
      `marcarSessaoRevisada(uid, sessaoId)`, `marcarExercicioConcluido(params)`,
      `finalizarSessao(uid, sessaoId)` e `atualizarSerieDeSessaoFinalizada(params)`
      para buscar o documento direto por id
      (`getDoc(doc(sessoesCollection(uid), sessaoId))`, em vez de
      `listarSessoes` + `.find`), mutar em memória e terminar com
      `setDocSessao(uid, sessao)` (sem `await`). Preservar a validação de
      `Number.isFinite` já existente em `atualizarSerieDeSessaoFinalizada`;
      nenhuma das quatro toca em `registradaEm` (FR-008). Depende de T005
      (mesmo arquivo, usa `sessoesCollection`/`setDocSessao`). **Feito.**
- [x] T007 Em `src/services/sessao-treino-storage.ts`: reescrever
      `obterUltimaSessaoConcluidaNaoRevisada(uid, treinoId, totalExercicios)`,
      `atualizarSerieRealizada(params)`, `contarSessoesFinalizadas(uid, treinoId)`,
      `obterDataUltimaSessaoFinalizada(uid, treinoId)` e
      `listarSessoesFinalizadas(uid)` para usar `listarSessoes(uid)` (busca
      a coleção inteira, filtra/`reduce` em memória com a mesma lógica de
      hoje) em vez do array local de AsyncStorage; `atualizarSerieRealizada`
      não toca em `registradaEm` (FR-008). Depende de T005/T006 (mesmo
      arquivo). **Feito.**
- [x] T008 [P] Em `src/components/treino/exercicio-execucao.tsx`: mudar o
      tipo da prop `onConcluirSerie` de `(serie: SerieRealizada) => void`
      para `(serie: Omit<SerieRealizada, 'registradaEm'>) => void` (linha
      22) — necessário porque `SerieRealizada` ganhou `registradaEm`
      (T004) e este componente monta o objeto `serie` sem esse campo
      (linha 118, `onConcluirSerie({ serie: estado.serieAtual, cargaKg,
      reps })`, inalterada). Depende de T004. **Feito — e um segundo ajuste
      de tipo não previsto na task original**: a prop `onEditarSerie`
      (linha 24, usada pela edição RF09a) também recebia `SerieRealizada`
      completo; o chamador (linha 85, `handleSalvarEdicaoSerie`) monta o
      objeto sem `registradaEm` (edição nunca mexe nesse campo, FR-008) —
      mudada para `Omit<SerieRealizada, 'registradaEm'>` também, só
      descoberta porque o `tsc` (T010) apontou o erro.
- [x] T009 Em `src/app/treino/[treinoId].tsx`, `handleConcluirSerie`:
      passar `treinoSnapshot: { nome: treino.nome, exercicios:
      treino.exercicios.map(({ id, nome, categoria }) => ({ id, nome,
      categoria })) }` na chamada a `registrarSerieConcluida` (`treino` já
      está carregado neste componente). Depende de T005 (nova assinatura
      de `registrarSerieConcluida`) e T008 (tipo compatível na origem do
      objeto `serie`). **Feito — mais dois ajustes de tipo não previstos**:
      o parâmetro `serie`/`serieEditada` de `handleConcluirSerie` e
      `handleEditarSerie` (que recebem o valor vindo de
      `onConcluirSerie`/`onEditarSerie`, T008) também precisaram virar
      `Omit<SerieRealizada, 'registradaEm'>`, pelo mesmo motivo — só
      apareceram no `tsc` (T010), não estavam descritos na task original.
- [x] T010 [P] Rodar `npx tsc --noEmit` (projeto inteiro — o comando
      sempre type-checa tudo, não só os arquivos desta fase — zero erros)
      e `npx eslint` nos arquivos tocados por esta fase
      (`src/types/perfil.ts`, `src/types/execucao-treino.ts`,
      `src/services/sessao-treino-storage.ts`,
      `src/components/treino/exercicio-execucao.tsx`,
      `src/app/treino/[treinoId].tsx`), confirmando ausência de erros de
      tipo e lint, conforme Princípio I da Constituição. Depende de
      T003-T009. **Feito**: `npx tsc --noEmit` (projeto inteiro) — 0 erros
      depois dos ajustes extras de T003/T008/T009; `npx eslint` nos 5
      arquivos acima **mais** `src/app/(tabs)/explore.tsx` (tocado pelo
      ajuste de T003) e `firestore.rules` (ignorado pelo eslint, sem
      configuração para `.rules` — não é um erro) — 0 erros, 0 avisos nos
      arquivos de código.
- [x] T011 Em `docs/criterios-aceite.md`: criar a entrada "RF24" (ao final
      do arquivo, mesmo separador `---` já usado entre entradas), com
      critérios de aceite agrupados pelas 6 User Stories desta spec, todos
      como `[ ]` — mesmo padrão já usado pela entrada RF23 (specs/024).
      Depende de T010. **Feito.**
- [x] T012 Em `spec.md` (Edge Cases): registrar que o comportamento
      last-write-wins entre aparelhos (sessão/série/ciclo) foi confirmado
      pelo usuário em 2026-10-15, ao revisar este `tasks.md` — sem
      transação nem mecanismo de resolução de conflito adicional pedido.
      **Feito**: nota adicionada ao bullet "A mesma conta, em dois
      aparelhos, registra uma série na mesma sessão ao mesmo tempo..." em
      `spec.md` (Edge Cases).

**Checkpoint**: tipos de sessão e `sessao-treino-storage.ts` migrados, sem
erros de tipo/lint — toda validação de User Story já pode começar (depende
também de T002).

---

## Phase 3: User Story 1 - Treinar normalmente, agora salvo na conta (Priority: P1) 🎯 MVP

**Goal**: criar, atualizar, finalizar e iniciar nova sessão de treino,
exatamente como hoje, agora no Firestore.

**Independent Test**: treinar um treino do início ao fim (quickstart.md,
Cenário 1) e confirmar que o comportamento é idêntico ao anterior a esta
migração.

- [x] T013 [US1] Validar `quickstart.md` Cenário 1 (passos 1-8) em Android.
      Marcar `[X]` em `docs/criterios-aceite.md` (T011) os critérios da
      "User Story 1" confirmados — só os confirmados de verdade. Depende
      de T010, T011, T002. **Confirmado pelo usuário em 2026-10-15**: treino
      sem erro no Metro, sessões por usuário visíveis no Firestore em tempo
      real, offline sem travar e sincronizando ao reconectar — 1º dos 5
      critérios da User Story 1 marcado `[X]` nesta rodada (criação da
      sessão). **Os outros 4 confirmados em 2026-10-16**: progresso
      persiste ao fechar/reabrir o app, "Finalizar treino" manual,
      finalização automática ao concluir todos os exercícios, e "Nova
      sessão de Treino" sem resquício da sessão anterior — todos os 5
      critérios da User Story 1 marcados `[X]`.

**Checkpoint**: User Story 1 validada de forma independente — MVP pronto.

---

## Phase 4: User Story 2 - Histórico e indicadores continuam mostrando os mesmos dados (Priority: P1)

**Goal**: histórico por exercício/data, contadores, "Finalizado em" e o
indicador de sessão em andamento continuam corretos, agora lendo do
Firestore.

**Independent Test**: com sessões finalizadas e uma em andamento, abrir
histórico e lista de treinos e confirmar que tudo aparece exatamente como
antes (quickstart.md, Cenário 2).

- [x] T014 [US2] Em `src/services/historico-evolucao.ts`
      (`contracts/lista-treinos-e-historico.md`): reescrever
      `construirRegistrosBrutos` para receber só `sessoesFinalizadas:
      SessaoTreino[]` (remover o parâmetro `treinos`), lendo
      `sessao.treinoNomeSnapshot` e `sessao.exerciciosSnapshot.find(...)`
      em vez de cruzar com `Treino`; ajustar as duas chamadas em
      `obterHistoricoPorPerfil` e `obterHistoricoPorData` para não passar
      `treinos` a essa função — `listarTreinos` continua chamado em
      ambas, só para semear o universo de exercícios nunca registrados
      (FR-011), inalterado. Depende de T007. **Feito — achado não previsto
      na task original**: `obterHistoricoPorData` (RF18, "Por data") nunca
      teve lógica de "universo de exercícios nunca registrados" (isso é
      exclusivo de `obterHistoricoPorPerfil`/RF08) — ali, `listarTreinos`
      só existia para alimentar `construirRegistrosBrutos`. Com o snapshot,
      ficou uma leitura morta (`eslint` acusou `treinos` não usado); removido
      o `listarTreinos`/`Promise.all` dessa função por completo — ganho
      colateral de 1 leitura a menos por chamada, fora do pedido original
      mas consequência direta da migração.
- [x] T015 [US2] Em `src/app/(tabs)/index.tsx`
      (`contracts/lista-treinos-e-historico.md`): substituir
      `carregarContagens`, `carregarDatasFinalizacao` e
      `carregarSessoesEmAndamento` por uma função só,
      `carregarDadosDeSessao(uid, lista)`, que chama `listarSessoes(uid)`
      uma única vez e deriva `contagensPorTreino`,
      `dataFinalizacaoPorTreino` e `emAndamentoPorTreino` em memória, com
      `try/catch` (log + `{}` em caso de falha — `plan.md`, Constraints);
      ajustar o import de `@/services/sessao-treino-storage` (só
      `listarSessoes`); ajustar as duas entradas de `Promise.all`
      (`recarregarTreinos` e o `useEffect` inicial) para chamar
      `carregarDadosDeSessao` em vez das três funções antigas. Depende de
      T007. **Feito.**
- [x] T016 Em `src/app/(tabs)/index.tsx`: envolver o corpo de
      `carregarCicloAtual` em `try/catch`, com `console.error` e
      `setCicloAtual(null)`/`setProgressoCiclo(null)` em caso de falha
      (`plan.md`, Constraints; `contracts/lista-treinos-e-historico.md`).
      Mesmo arquivo de T015, sem label de User Story (serve também US4) —
      depende de T015. **Feito.**
- [x] T017 [P] [US2] Rodar `npx tsc --noEmit` (projeto inteiro, zero
      erros) e `npx eslint` nos arquivos tocados por esta fase
      (`src/services/historico-evolucao.ts`, `src/app/(tabs)/index.tsx`).
      Depende de T014-T016. **Feito como parte de um gate único, cobrindo
      também T023 (US4)** — decisão explícita por não terem sido pedidas
      duas rodadas separadas; ver nota em T023. `tsc` 0 erros; `eslint` 0
      erros, 0 avisos (depois do ajuste de T014).
- [x] T018 [US2] Validar `quickstart.md` Cenário 2 (passos 1-6) em Android.
      Marcar `[X]` em `docs/criterios-aceite.md` (T011) os critérios da
      "User Story 2" confirmados. Depende de T017, T011, T013 (reaproveita
      as sessões do Cenário 1). **Confirmado pelo usuário em 2026-10-15**:
      histórico "Por exercício" correto; "Por data" mostra só os
      realizados agrupados por data; sessões finalizadas e em andamento
      coexistem em "Meus treinos", com o destaque de "em andamento"
      preservado — os 4 critérios da User Story 2 marcados `[X]`.

**Checkpoint**: histórico e indicadores validados — US1 e US2 completas.

---

## Phase 5: User Story 3 - Isolamento entre contas (Priority: P1)

**Goal**: sessão, histórico e ciclo de progresso de uma conta nunca
aparecem para outra; regras do Firestore cobrem os novos caminhos com a
mesma garantia já validada para treinos.

**Independent Test**: trocar de conta e confirmar que nada da conta
anterior aparece (quickstart.md, Cenário 6); repetir os 4 casos do Rules
Playground para `sessoes`/`ciclos`.

- [x] T019 [US3] Validar `quickstart.md` Cenário 6 (passos 1-4, troca de
      contas) em Android. Marcar `[X]` em `docs/criterios-aceite.md`
      (T011) os critérios correspondentes da "User Story 3". Depende de
      T011, T002, T013 (reaproveita as sessões do Cenário 1).
      **Confirmado pelo usuário em 2026-10-16**: troca de conta real no
      app, sem vazamento de sessão/histórico/ciclo entre as contas.
- [x] T020 [US3] Validar `quickstart.md` Cenário 6 (passos 5-6, Rules
      Playground — os 4 casos de `contracts/firestore-rules.md` repetidos
      para `sessoes` e `ciclos`, 8 verificações) no Firebase Console.
      Marcar `[X]` em `docs/criterios-aceite.md` (T011) o critério
      correspondente. Depende de T002. **Confirmado pelo usuário em
      2026-10-15**: 8/8 simulações no Laboratório de testes de regras com
      o resultado esperado (contas reais `oliveiracampos.victor`/
      `victim.bboy`) — os 2 critérios de Rules Playground da User Story 3
      marcados `[X]`.

**Checkpoint**: isolamento entre contas validado para os novos caminhos.

---

## Phase 6: User Story 4 - Ciclo de progresso sobrevive a limpar dados e a trocar de aparelho (Priority: P2)

**Goal**: ciclo de progresso (RF15) continua funcionando exatamente como
hoje, agora persistido na conta — sobrevive a limpar os dados do app ou
trocar de aparelho.

**Independent Test**: importar um lote de múltiplos treinos, treinar
algumas sessões, limpar os dados do app (ou trocar de aparelho) e confirmar
que o ciclo continua intacto (quickstart.md, Cenários 4 e 5).

- [x] T021 Em `src/types/ciclo-treino.ts`: renomear o campo `perfilId` de
      `CicloTreino` para `uid` (mesmo tipo, mesmo valor — `research.md`,
      Decisão 6). **Feito só agora, nesta fase** (não na Fundação): fica
      junto da reescrita de `ciclo-treino-storage.ts` (T022) de propósito
      — esse arquivo só é tocado aqui, então renomear o campo antes
      quebraria o type-check dele no gate da Fundação (T010). Qualquer
      outro consumidor de `CicloTreino.perfilId` que o `tsc` apontar é
      corrigido dentro desta mesma task. **Feito**: confirmado por grep que
      só `ciclo-treino-storage.ts` acessava `.perfilId`; `index.tsx` só usa
      o tipo `CicloTreino` para estado, nunca acessa o campo — nenhum outro
      consumidor para corrigir.
- [x] T022 [US4] Em `src/services/ciclo-treino-storage.ts`
      (`contracts/ciclo-treino-storage.md`): remover todo o acesso a
      `AsyncStorage`; adicionar `ciclosCollection(uid)`, `setDocCiclo(uid,
      ciclo)` (sem `await`, `.catch` com `console.error`),
      `listarCiclos(uid)` (`getDocs` da coleção inteira, ordenada por
      `criadoEm` + `id` como desempate); reescrever `criarCiclo`,
      `obterCicloAtual` (= último elemento de `listarCiclos`, mesma
      semântica de hoje) e `calcularProgressoCiclo` (chama
      `listarSessoes(uid)` de `@/services/sessao-treino-storage` **uma
      única vez**, conta em memória por `treinoId` — não mais um laço
      chamando `contarSessoesFinalizadas` por treino); `cotaComoFracao`
      inalterada. Depende de T021 (mesmo arquivo usa o campo `uid`) e de
      T007 (precisa de `listarSessoes` já exportada). **Feito**:
      `calcularProgressoCiclo` confirmado chamando `listarSessoes(uid)`
      exatamente uma vez (fora do laço `for` por `treinoId`), contagem em
      memória por `.filter(...).length` dentro do laço — sem nenhuma
      leitura adicional por treino do ciclo.
- [x] T023 [P] [US4] Rodar `npx tsc --noEmit` (projeto inteiro, zero
      erros) e `npx eslint` em `src/services/ciclo-treino-storage.ts`.
      Depende de T021, T022. **Feito como gate único, cobrindo também T017
      (US2)**: rodado `tsc --noEmit` (projeto inteiro, 1 vez) e `eslint`
      sobre os 4 arquivos tocados neste bloco (`historico-evolucao.ts`,
      `index.tsx`, `ciclo-treino.ts`, `ciclo-treino-storage.ts`) numa única
      chamada — decisão explícita por ser a mesma verificação, sem motivo
      para rodar duas vezes; `tsc` 0 erros, `eslint` 0 erros/0 avisos.
- [x] T024 [US4] Validar `quickstart.md` Cenário 4 (ciclo de progresso
      continua funcionando) em Android. Marcar `[X]` em
      `docs/criterios-aceite.md` (T011) os critérios correspondentes da
      "User Story 4". Depende de T023, T011, T016 (resiliência de
      `carregarCicloAtual`). **Confirmado pelo usuário em 2026-10-15** (3
      de 3 critérios): anel/cota corretos; bloqueio de nova importação com
      ciclo <40 funcionando; aviso "Hora de trocar o treino" confirmado ao
      completar 40 sessões reais, distribuídas de forma desigual entre os
      treinos do lote (8/9/7/...) — confirma que o aviso depende só do
      total agregado do ciclo, não de uma distribuição igual por treino
      (cenário real de "faltei em um treino, segui com os outros").
      Tentativa anterior no mesmo dia (editar `cotaPorTreinoId` no
      Console) não tinha demonstrado esse 3º critério — não era bug, só
      não exercitava `progressoCiclo.totalFinalizado`; nota corrigida em
      `quickstart.md`, Cenário 4.
- [x] T025 [US4] Validar `quickstart.md` Cenário 5 (ciclo e histórico
      sobrevivem a limpar dados/trocar de aparelho) em Android. Marcar
      `[X]` em `docs/criterios-aceite.md` (T011) o critério correspondente.
      Depende de T024. **Confirmado pelo usuário em 2026-10-15**: dados do
      app limpos, abertura a frio (partida do 0) com a mesma conta —
      ciclo de progresso e histórico preservados, lidos da conta no
      Firestore em vez de qualquer estado local.

**Checkpoint**: ciclo de progresso validado, inclusive sobrevivendo a
limpar dados — US4 completa.

---

## Phase 7: User Story 5 - Editar séries continua funcionando (Priority: P2)

**Goal**: editar carga/reps de uma série de uma sessão em andamento
(RF09a) e de uma sessão finalizada (RF09b) continuam funcionando.

**Independent Test**: editar uma série de cada tipo e confirmar que o novo
valor persiste corretamente (quickstart.md, Cenário 3).

- [x] T026 [US5] Validar `quickstart.md` Cenário 3 (passos 1-4) em
      Android. Marcar `[X]` em `docs/criterios-aceite.md` (T011) os
      critérios correspondentes da "User Story 5". Depende de T011, T013
      (reaproveita uma sessão em andamento do Cenário 1). **Confirmado
      pelo usuário em 2026-10-15**: edição testada na tela de execução do
      exercício (RF09a) e na tela de histórico (RF09b), mesmo resultado
      nas duas — os 2 critérios da User Story 5 marcados `[X]`
      (preservação de `registradaEm` garantida pelo código, não
      inspecionada diretamente no Firestore nesta rodada).

**Checkpoint**: edição de séries validada — US5 completa.

---

## Phase 8: User Story 6 - Histórico continua legível mesmo se o treino mudar depois (Priority: P3)

**Goal**: o snapshot de nome/exercícios guardado na sessão (FR-003) torna
o histórico independente do estado atual do treino de origem.

**Independent Test**: registrar uma sessão, editar manualmente o treino de
origem no Firebase Console, e confirmar que o histórico continua mostrando
os dados originais (quickstart.md, Cenário 7).

- [x] T027 [US6] Validar `quickstart.md` Cenário 7 (passos 1-6) via
      Firebase Console + app. Marcar `[X]` em `docs/criterios-aceite.md`
      (T011) o critério correspondente da "User Story 6". Depende de
      T018 (histórico já migrado, US2). **Confirmado pelo usuário em
      2026-10-15, com um bug real encontrado e corrigido no caminho**:
      renomear o exercício no Console produziu `TypeError: Cannot read
      property 'itens' of undefined` em `obterHistoricoPorPerfil` (captura
      de tela + `adb logcat` confirmaram) — corrigido criando o grupo na
      hora em vez de presumir que ele sempre existe (ver nota em
      `docs/criterios-aceite.md`). Depois da correção, o histórico passou
      a mostrar duas entradas separadas (nome original com o histórico
      antigo intacto; nome novo sem registros) — os 2 critérios da User
      Story 6 marcados `[X]`.

**Checkpoint**: todas as 6 User Stories validadas em Android.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: validação offline/cold start (cross-cutting, exercita todos
os fluxos já validados), confirmação de que o AsyncStorage antigo não é
mais lido, e fechamento da spec (resumo de validação, registro no PRD,
Status).

- [x] T028 [P] Validar `quickstart.md` Cenário 8 (offline e abertura a
      frio) em Android. Marcar `[X]` em `docs/criterios-aceite.md` (T011)
      o critério correspondente. Depende de T013, T018, T024, T026 (todos
      os fluxos que este cenário exercita em modo avião). Durante a
      validação, 4 bugs reais encontrados e já corrigidos no caminho —
      (1) `obterSessao`/`registrarSerieConcluida` usavam uma query composta
      (`where`+`where`+`limit`) que travava indefinidamente offline (sem
      erro, sem resolver/rejeitar); revertido para `listarSessoes(uid)` +
      filtro no cliente, removendo `query`/`where`/`limit` de
      `sessao-treino-storage.ts`;
      (2) `[treinoId].tsx` fazia leituras sequenciais redundantes de
      `listarSessoes` (até 2x) ao abrir um treino; consolidado em uma
      leitura só, reaproveitada via as funções puras
      `encontrarSessaoEmAndamento`/`encontrarUltimaSessaoConcluidaNaoRevisada`;
      (3) **corrida de toques duplicados em "Concluir série"**: offline, o
      registro de série ficou lento o suficiente para o usuário tocar
      várias vezes no botão sem ver nada mudar, disparando chamadas
      concorrentes que se sobrescreviam (última vence) e produziam um
      contador incorreto ("Série 6 de 4" com só 1 série de fato persistida)
      — corrigido com uma trava de envio em `[treinoId].tsx`
      (`exerciciosEnviandoSerie`, por `exercicioId`) que desabilita o botão
      e mostra "Salvando..." enquanto a chamada está em andamento;
      **confirmado pelo usuário em 2026-10-15 que o bug não ocorre mais**;
      (4) **`finalizarSessao`/`marcarSessaoRevisada`/
      `marcarExercicioConcluido`/`atualizarSerieDeSessaoFinalizada` travavam
      indefinidamente offline** (mesmo sintoma do bug 1, mas em `getDoc`
      de um único documento por id, não em query composta) — confirmado em
      2026-10-16 ao finalizar uma sessão offline (tela ficou estática) e ao
      editar uma série de uma sessão já finalizada no histórico offline
      (idem). Corrigido removendo `getDoc`/`doc` como leitura destas 4
      funções em `sessao-treino-storage.ts`, trocando todas para
      `listarSessoes(uid)` + busca em memória por `sessao.id`, o mesmo
      padrão das demais funções do arquivo — **confirmado pelo usuário em
      2026-10-16 que finalizar e editar offline funcionam normalmente
      depois da correção**.
      **Aceito pelo usuário em 2026-10-16**: a lentidão geral de leitura
      offline ao abrir a lista de exercícios de um treino permanece como
      está (não é um bug corrigível de forma simples — ver nota de
      implementação em `sessao-treino-storage.ts`; com rede, tudo é rápido)
      — não é mais bloqueio para fechar esta task.
      **Confirmado pelo usuário em 2026-10-16**: importação de um arquivo
      com múltiplos treinos offline funcionou (só demorou a aparecer na
      tela, mesma lentidão já aceita); ao reconectar, os treinos
      importados, a sessão finalizada e as séries editadas offline
      apareceram corretamente — Cenário 8 completo, critério
      correspondente marcado `[X]` em `docs/criterios-aceite.md`.
- [x] T029 Confirmar por `grep` em `src/` que nenhum arquivo ainda lê ou
      escreve as chaves antigas de AsyncStorage `sessoes:` ou `ciclos:`
      (FR-023, `research.md` Decisão 6) — esperado zero ocorrências fora
      de comentários/documentação. Depende de T007, T022. **Feito**: zero
      ocorrências de `sessoes:`/`ciclos:` e zero `import AsyncStorage` nos
      dois serviços migrados.
- [x] T030 Só depois de T019, T020, T025, T026, T027 e T028 todas
      concluídas: atualizar `docs/criterios-aceite.md` (T011), linha
      "Validado em Android", com o resumo real (quantos cenários
      confirmados, datas) — mesmo padrão já usado pelas entradas RF21/RF23.
      **Feito**: 8 de 8 cenários confirmados (2026-10-15 a 2026-10-16), 4
      bugs reais encontrados e corrigidos, lentidão offline aceita como
      está.
- [x] T031 Registrar o **RF24** na tabela da seção 6 do
      `docs/PRD-app-treino.md`, seção "Pós-MVP" (mesmo formato das linhas
      RF11-RF23: colunas ID, Requisito, Prioridade, Spec), com a descrição
      "Migra sessão de treino (RF04/RF07/RF12), edição de séries
      (RF09a/RF09b), histórico (RF08/RF18) e ciclo de progresso (RF15) de
      AsyncStorage para o Firestore, segregados por uid; sessão ganha
      snapshot de nome/exercícios e horário por série (estende
      RF02/RF04/RF07/RF08/RF09a/RF09b/RF12/RF15/RF16/RF18/RF23)" e `Spec:
      specs/025-migracao-sessoes-historico-ciclo/`. Depende de T030.
      **Feito**: RF24 registrado como última linha da tabela "Pós-MVP".
- [x] T032 Em `spec.md` (campo **Status**, hoje "Draft"), atualizar para
      "Implemented — validado em Android em `<data>` (Princípio III); iOS
      pendente por falta de conta Apple Developer (mesma situação das
      specs 022-024)", mesmo padrão já usado pelas specs 023/024. Depende
      de T030. Esta é a **última** task desta feature — nenhuma outra
      task depende dela. **Feito**.

**Checkpoint**: feature completa, RF24 validado em Android e registrado no
PRD. iOS permanece pendente (falta de conta Apple Developer), mesma
situação das specs 022-024 — não bloqueia o fechamento desta feature em
Android.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sem dependências de código — mas T002 (gate manual)
  bloqueia toda validação em aparelho/Console em qualquer fase posterior.
- **Fundação (Fase 2)**: depende da Fase 1 só para o gate de validação
  (T013 em diante), não para o código em si — T003-T012 podem rodar em
  paralelo com T001/T002. Bloqueia **todas** as User Stories.
- **User Stories 1, 3, 5, 6 (Fases 3, 5, 7, 8)**: são só validação — sem
  código próprio, dependem apenas da Fundação (e, no caso de US6, também
  de US2/T018).
- **User Story 2 (Fase 4)**: tem código próprio (`historico-evolucao.ts`,
  `index.tsx`) — depende da Fundação (T007).
- **User Story 4 (Fase 6)**: tem código próprio (`ciclo-treino.ts` +
  `ciclo-treino-storage.ts`, T021-T022) — depende da Fundação (T007);
  independente do código de US2 (arquivos diferentes), mas a validação do
  Cenário 4 (T024) depende de T016 (resiliência de `carregarCicloAtual`,
  feita dentro da Fase 4/US2 por estar no mesmo arquivo `index.tsx`).
- **Polish (Fase 9)**: T028 depende de várias validações já terem
  rodado; T029 depende das duas migrações de serviço (T007, T022); T030-T032
  são sequenciais entre si e dependem de toda a validação anterior.

### Parallel Opportunities

- T001 (Fase 1) é independente de qualquer coisa da Fase 2.
- T008 (Fase 2) toca um arquivo diferente de T005-T007 — paralelo a elas
  (ambas só dependem de T004).
- T010 é um gate — depende de T003-T009 todas prontas, mas pode rodar em
  paralelo com T001/T002 (arquivos diferentes).
- A Fase 4 (US2, `historico-evolucao.ts`/`index.tsx`) e a Fase 6 (US4,
  `ciclo-treino.ts`/`ciclo-treino-storage.ts`) tocam arquivos diferentes —
  podem ser feitas em paralelo, por pessoas diferentes, depois da Fundação.
- T019/T020 (US3) e T026 (US5) são só validação, sem código — podem rodar
  em paralelo com as Fases 4/6, já que dependem só da Fundação.

---

## Parallel Example: Fundação

```bash
# Depois de T004 (tipos de sessão prontos), estes dois blocos podem rodar em paralelo:

# Bloco A — serviço de sessão (mesmo arquivo, sequencial internamente)
Task: "T005 — sessao-treino-storage.ts: primitivas + obterSessao + registrarSerieConcluida"
Task: "T006 — sessao-treino-storage.ts: funções por sessaoId"
Task: "T007 — sessao-treino-storage.ts: funções agregadas via listarSessoes"

# Bloco B — efeito colateral de tipo (arquivo diferente)
Task: "T008 — exercicio-execucao.tsx: tipo de onConcluirSerie"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Fase 1 (Setup) — inclui o gate manual T002.
2. Completar Fase 2 (Fundação).
3. Completar Fase 3 (validar User Story 1).
4. **PARAR e VALIDAR**: treinar do início ao fim funcionando no Firestore
   já é o essencial desta migração.

### Incremental Delivery

1. Fase 1 + Fase 2 → mecanismo de sessão pronto no Firestore.
2. Fase 3 (US1) → valida o essencial (MVP).
3. Fase 4 (US2) → histórico e indicadores.
4. Fase 5 (US3) → isolamento entre contas (Constitution, Princípio V).
5. Fase 6 (US4) → ciclo de progresso (tipo + serviço juntos), inclusive
   sobrevivendo a limpar dados/trocar de aparelho — pode ser entregue em
   paralelo com a Fase 4, já que não compartilham arquivo.
6. Fase 7 (US5) → edição de séries.
7. Fase 8 (US6) → histórico resiliente a treino alterado depois.
8. Fase 9 (Polish) → offline/cold start, limpeza de referências antigas,
   fechamento (critérios de aceite, PRD, Status da spec).

## Notes

- [P] tasks = arquivos diferentes, sem dependência entre si.
- [Story] label mapeia a task para a User Story correspondente; tasks sem
  label são Setup, Fundação ou Polish.
- Nenhuma task deve ser marcada `[X]` sem a validação correspondente ter
  rodado de fato em Android (ou no Firebase Console, para os casos de
  regras) — inclusive em `docs/criterios-aceite.md` (T011), cujos
  critérios nascem todos `[ ]`.
- Nenhuma task de validação em aparelho/Console pode ser marcada `[X]`
  antes de T002 (publicação manual das regras) estar explicitamente
  confirmada pelo usuário.
- iOS fica pendente em toda esta feature (falta de conta Apple Developer)
  — nenhuma task de validação pode citar iOS como confirmado.
- Evitar: marcar T031 (registro no PRD) ou T032 (Status da spec) antes de
  T030 (resumo real de validação) estar pronto — mesma disciplina já
  pedida pelo usuário para a spec 024.
- `npx tsc --noEmit` é sempre um comando de projeto inteiro — "nos
  arquivos tocados por esta fase" (T017, T023) refere-se só ao `eslint`;
  o `tsc` de qualquer gate desta lista type-checa o projeto todo, mesmo
  quando a frase da task menciona arquivos específicos para o `eslint`.
