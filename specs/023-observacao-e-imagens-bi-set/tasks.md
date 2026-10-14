---

description: "Task list for spec 023 — Observação por Exercício e Imagem para Exercício Composto (Bi-set)"
---

# Tasks: Observação por Exercício e Imagem para Exercício Composto (Bi-set)

**Input**: Design documents from `/specs/023-observacao-e-imagens-bi-set/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/treino-storage.md, contracts/catalogo-exercicios.md,
contracts/execucao-treino-screen.md, quickstart.md

**Tests**: Sem suíte de testes automatizados no projeto — validação manual em
Android e iOS (Constitution v2.0.0, Princípio III), seguindo os cenários de
`quickstart.md`. iOS permanece **pendente** em toda task de validação desta
lista por falta de conta Apple Developer paga (mesmo bloqueio já registrado
pela spec 022) — nenhuma task de validação desta lista pode ser marcada como
confirmada em iOS.

**Organization**: 5 User Stories de `spec.md` (US1/US2 Priority P1, US3/US4
Priority P2, US5 Priority P3). Quatro notas de organização importantes:

1. **Preparação antes de qualquer código (T000-T001)**: capturas de tela de
   referência da versão anterior a esta feature, e os arquivos de teste
   (fixtures) usados por quase todas as validações — ambas não dependem de
   nenhum código desta feature, então vêm antes até da Fundação.
2. **Sequenciamento cross-story pedido explicitamente**: a lógica de
   fundação (T002, T003) bloqueia toda a UI; dentro da UI,
   `exercicio-execucao.tsx` recebe dois blocos de código independentes mas no
   mesmo arquivo (observação, serve US1; imagens de bi-set, serve US4) —
   por serem o mesmo arquivo, são sequenciais entre si (T004 antes de T005),
   nunca `[P]` um com o outro. `[treinoId].tsx` (T006, serve US3) é um
   arquivo diferente, então roda em paralelo (`[P]`) com o par
   T004/T005. **Nenhuma task de validação em aparelho (de nenhuma User
   Story) pode começar antes de T004, T005 e T006 estarem todas prontas, E
   antes de T007 (type-check/lint) passar** — mesmo uma validação de US1
   isolada já abre a tela de execução, que depende das três mudanças de UI
   estarem no lugar para o comportamento ser o final (não um estado
   intermediário), e não vale a pena gastar tempo de aparelho em código que
   nem compila/lint limpo.
3. **`docs/criterios-aceite.md` é criado em duas etapas**: a entrada desta
   feature é criada cedo (T008, logo após a UI existir), **sem** número de
   RF (ainda não confirmado) e com todos os critérios como `[ ]` — cada task
   de validação (T009-T015) marca `[X]` os itens que confirma, à medida que
   roda. Só depois de toda a validação terminar e o RF ser registrado no PRD
   (T017) é que o **título** dessa entrada (já existente desde T008) recebe
   o número de RF confirmado (T018) — T018 não recria a entrada, só atualiza
   o título.
4. **A emenda ao FR-003 da spec 021 já está registrada** (nota de emenda
   completa, adicionada durante o planejamento desta spec) — **não há task
   aqui para escrever ou reescrever esse conteúdo**. A única task relacionada
   (T019) troca apenas a palavra de status ("Draft" → "Implemented") dentro
   dessa nota já existente, depois que o comportamento que ela descreve for
   validado — não é uma task de "editar a spec 021", é uma task de atualizar
   um marcador de status em uma frase já escrita.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Caminhos conforme `plan.md` (Project Structure): `src/types/treino.ts`,
`src/services/treino-storage.ts`, `src/services/catalogo-exercicios.ts`,
`src/components/treino/exercicio-execucao.tsx`, `src/app/treino/[treinoId].tsx`,
`docs/exemplos/`.

---

## Phase 0: Preparação (antes de qualquer mudança de código)

**Purpose**: material que as validações vão precisar depois, e que precisa
ser produzido **antes** do código mudar (referência "como era antes") ou que
simplesmente não depende de nenhum código novo (fixtures).

- [X] T000 [P] Em um aparelho **Android**, com a versão do app **anterior**
      a esta feature, usando um treino **já importado antes desta feature**
      (documento no Firestore sem a chave `observacao`), capturar telas de
      referência (`quickstart.md`, Cenário 7): (a) um exercício comum na
      execução, **antes** de tocar em "Iniciar exercício"; (b) o mesmo
      exercício **durante** o registro de uma série; (c) a lista de
      exercícios do treino; (d) a tela de histórico de evolução (RF08) com
      pelo menos um registro desse exercício. Guardar as 4 capturas **fora
      do repositório** (ex.: pasta local de evidências de teste, não
      versionada) — são material de comparação visual para T015, não um
      artefato de produto. **Feito em 2026-10-09** (via `adb screencap`,
      aparelho conectado por USB): as 4 capturas pedidas, mais uma 5ª extra
      — o cronômetro de descanso em andamento — útil para o Cenário 4, passo
      4 (observação não deve sobrepor/esconder o cronômetro).
- [X] T001 [P] Criar os arquivos de teste em `docs/exemplos/` (nenhum nome de
      pessoa, mesmo cuidado já tomado para todo exemplo existente nessa
      pasta):
      - `treino-observacao-bi-set.json` — o arquivo principal do
        `quickstart.md` (Pré-requisitos): `nome` "Treino de teste —
        observação e bi-set", 4 exercícios (`supino-reto` com `observacao`;
        `rosca-direta` sem o campo; `biset-peito`, nome composto "Supino
        reto (barra) + Crucifixo no cabo (Bi-set)", com `observacao`;
        `biset-repetido`, nome composto com as duas partes iguais, sem
        `observacao`) — conteúdo exato já especificado em `quickstart.md`.
      - `treino-observacao-invalida.json` — 1 exercício, `"observacao": 123`,
        `nome` do treino terminando em "— observação 123" (Cenário 3).
      - `treino-observacao-null.json` — 1 exercício, `"observacao": null`,
        `nome` terminando em "— observação null" (Cenário 3).
      - `treino-observacao-vazia.json` — 1 exercício, `"observacao": ""`,
        `nome` terminando em "— observação vazia" (Cenário 3).
      - `treino-observacao-espacos.json` — 1 exercício, `"observacao": "   "`
        (só espaços), `nome` terminando em "— observação espaços" (Cenário
        3).
      - `treino-observacao-longa.json` — 1 exercício, `observacao` de
        aproximadamente 600 caracteres, `nome` terminando em "— observação
        longa" (Cenário 4).
      Cada arquivo tem um `nome` de treino **distinto** dos demais (incluindo
      do arquivo principal), para ser identificável na lista de treinos
      depois de importado. Todos usam nomes de exercício já presentes no
      catálogo real (`assets/catalogo/exercicios.json`), mesma conferência já
      feita no `quickstart.md`, Pré-requisitos.

**Checkpoint**: material de referência e fixtures prontos — a Fundação pode
começar.

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: as duas mudanças de lógica/dados que toda a UI desta feature
consome — nenhuma User Story pode ter sua UI implementada antes desta fase.

**⚠️ CRITICAL**: nenhuma task de UI (T004-T006) pode começar antes desta fase.

- [X] T002 [P] Em `src/types/treino.ts`, adicionar `observacao?: string` a
      `ExercicioPlanejado` (data-model.md). Em
      `src/services/treino-storage.ts`, alterar `validarExercicio`
      (`contracts/treino-storage.md`): quando `item.observacao` for `undefined`
      **ou `null`**, tratar como sem observação (FR-002); quando for uma
      `string`, aplicar `trim()` — se o resultado for vazio, também tratar
      como sem observação (FR-002); quando **presente e não for `string` nem
      `null`** (número, booleano, lista, objeto), retornar
      ``{ ok: false, motivo: `Exercício ${indice}: campo "observacao" inválido` }``
      (FR-003, mesmo formato já usado para `categoria`). Na montagem do
      `ExercicioPlanejado` retornado, adicionar a chave só por espalhamento
      condicional (`...(observacao !== undefined ? { observacao } : {})`) —
      **nunca** `observacao: observacao` direto, para a chave nunca existir
      com valor `undefined` (FR-008, `research.md` Decisão 4). Serve US1,
      US2, US3.
- [X] T003 [P] Em `src/services/catalogo-exercicios.ts`, adicionar e exportar
      `buscarPartesCompostoNoCatalogo(nomeExercicio: string):
      ExercicioCatalogo[]` (`contracts/catalogo-exercicios.md`): se
      `nomeExercicio` não contiver `" + "`, retornar `[]` (FR-013); senão,
      remover um sufixo `" (Bi-set)"` do final (depois de `trimEnd()`,
      case-insensitive — FR-010a), separar o restante por `" + "`, chamar
      `buscarNoCatalogo` (spec 021, inalterada) para cada parte (FR-010b-d,
      sem nenhuma normalização nova), filtrar os `null`, e retornar **no
      máximo os 2 primeiros resultados, na ordem em que as partes aparecem no
      nome** — mesmo quando há mais de 2 partes, todas são buscadas, só a
      exibição é limitada a 2 (FR-011). Partes duplicadas que casam com o
      mesmo item do catálogo NÃO são deduplicadas (edge case,
      `spec.md`). Serve US4, US5.

**Checkpoint**: lógica de observação e de busca por partes prontas e
testáveis isoladamente por código — a UI pode começar.

---

## Phase 2: Implementação de UI (pós-fundação, pedida como bloco único antes de qualquer validação)

**Purpose**: as 3 mudanças de UI que, juntas, toda task de validação em
aparelho desta lista pressupõe já estarem prontas (ver nota "Organization" #2).

- [X] T004 [US1] Em `src/components/treino/exercicio-execucao.tsx`
      (`contracts/execucao-treino-screen.md`, item 1; `research.md` Decisão
      2): renderizar `{!!exercicio.observacao && (<ThemedText type="small"
      themeColor="textSecondary">{exercicio.observacao}</ThemedText>)}` — a
      condição usa `!!exercicio.observacao`, **nunca**
      `exercicio.observacao && (...)` direto (evita o problema de React de
      renderizar o próprio valor quando falsy-mas-não-booleano). Posicionar
      **fora** de qualquer bloco condicional de estado (`!estado.iniciado`,
      bloco de registro de série, bloco de descanso, bloco concluído) — logo
      após o resumo do exercício e a imagem de nome inteiro (spec 021),
      **antes** do botão "Iniciar exercício" — para aparecer tanto antes de
      iniciar quanto durante o registro de série e durante o descanso
      (FR-004), e nunca na lista de exercícios nem no histórico (FR-006, que
      não leem este arquivo). Depende de T002.
- [X] T005 [US4] No mesmo `src/components/treino/exercicio-execucao.tsx`
      (`contracts/execucao-treino-screen.md`, item 2; `research.md` Decisão
      5/6): calcular `partesComposto` via `useMemo` chamando
      `buscarPartesCompostoNoCatalogo(exercicio.nome)` só quando
      `correspondencia` (busca por nome inteiro, spec 021) for `null`
      (FR-010); renderizar, quando `!correspondencia && partesComposto.length
      > 0`, até 2 imagens lado a lado (`partesComposto.map`), cada uma com
      ``key={`${item.id}-${indice}`}`` (índice da posição em
      `partesComposto`, necessário porque duas partes podem casar com o mesmo
      item do catálogo — key só por `item.id` colidiria) e legenda
      `<ThemedText>{item.nome}</ThemedText>` usando **o nome do item do
      catálogo**, nunca o texto da parte extraída do nome do treino (FR-011).
      Quando nenhuma parte casar, ou o nome não contiver `" + "`, nenhum dos
      dois blocos (nome inteiro ou partes) renderiza nada (FR-013). Adicionar
      os estilos novos (`linhaImagensComposto`, `imagemCompostaItem`,
      `imagemExercicioComposto`) ao `StyleSheet.create` já existente no
      arquivo. Depende de T003 e de T004 (mesmo arquivo — sequencial, não
      paralelo).
- [X] T006 [P] [US3] Em `src/app/treino/[treinoId].tsx`
      (`contracts/execucao-treino-screen.md`, item 3; `research.md` Decisão
      3): envolver o branch `exercicioSelecionado` truthy em
      `KeyboardAvoidingView` (`style={styles.flex}`, `behavior={Platform.OS
      === 'ios' ? 'padding' : undefined}`) + `ScrollView`
      (`contentContainerStyle={styles.scrollContent}`,
      `keyboardShouldPersistTaps="handled"` — **obrigatório**, sem ele o
      primeiro toque em "Concluir série" com o teclado aberto só fecharia o
      teclado —, `alwaysBounceVertical={false}` — evita o rubber-band do iOS
      quando o conteúdo cabe sem rolar). `styles.scrollContent` DEVE incluir
      `gap: Spacing.three` (reproduz o espaçamento que vinha do `gap` de
      `styles.safeArea`, que deixa de valer entre "Voltar para exercícios" e
      `ExercicioExecucao` quando eles deixam de ser filhos diretos do
      `SafeAreaView`); **NÃO** adicionar `flexGrow: 1` a
      `scrollContent` — a raiz de `ExercicioExecucao` não depende de `flex:
      1`/margem automática (confirmado por inspeção do código), então não
      teria efeito. Branch sem exercício selecionado (lista de exercícios,
      `FlatList`) permanece sem alteração — já é um branch mutuamente
      exclusivo, sem risco de aninhar containers roláveis; `CronometroDescanso`
      já é renderizado fora de todo o ternário, permanece fora do novo
      `ScrollView`. Depende só da Fase 1 (Foundational) — roda em paralelo
      (`[P]`) com T004/T005 (arquivo diferente).

**Checkpoint**: as 3 mudanças de UI completas.

---

## Phase 2.5: Gate de qualidade (antes de qualquer validação em aparelho)

- [X] T007 Rodar `npx tsc --noEmit` e `npx eslint` sobre todos os arquivos
      novos/alterados por esta feature (`src/types/treino.ts`,
      `src/services/treino-storage.ts`, `src/services/catalogo-exercicios.ts`,
      `src/components/treino/exercicio-execucao.tsx`,
      `src/app/treino/[treinoId].tsx`) — zero erros novos. **Portão
      obrigatório**: nenhuma task de validação em aparelho (T009 em diante)
      roda antes deste type-check/lint passar — não vale gastar tempo de
      aparelho em código que ainda não compila ou tem lint quebrado. Depende
      de T002, T003, T004, T005, T006 (todo o código desta feature já
      escrito).

**Checkpoint**: código tipado e lintado — validação em aparelho pode
começar.

---

## Phase 2.6: Registro inicial em `docs/criterios-aceite.md`

- [X] T008 Em `docs/criterios-aceite.md` (seção "Melhorias
      pós-desenvolvimento"), criar a entrada desta feature **sem número de
      RF** (ainda não confirmado — ver nota "Organization" #3) com um título
      provisório (ex.: "Observação por Exercício e Imagem para Exercício
      Composto (Bi-set)") e **todos os critérios de aceite como `[ ]`** —
      um item por cenário relevante de `quickstart.md` (Cenários 1-7),
      espelhando as Acceptance Scenarios de `spec.md` — e a linha de status
      **"Status da spec: em validação."** (mesmo padrão já usado pela
      entrada da spec 022). Esta é a única task que cria a entrada; T009-T015
      só marcam `[X]` os itens correspondentes à medida que validam, e T018
      só atualiza o título depois (não recria a entrada). Pode ser escrita a
      qualquer momento a partir do conteúdo de `spec.md` — posicionada aqui
      para já existir antes da primeira validação em aparelho.

---

## Phase 3: User Story 1 - Ver a dica de execução do exercício (Priority: P1) 🎯 MVP

**Goal**: a observação de um exercício aparece em destaque secundário na
execução, antes de "Iniciar exercício" e durante o registro das séries;
nunca na lista de exercícios nem no histórico.

**Independent Test**: `quickstart.md`, Cenário 1 — importar
`treino-observacao-bi-set.json`, confirmar que o texto aparece nos dois
momentos (FR-004) e não aparece na lista/histórico (FR-006).

### Validation for User Story 1

- [X] T009 [US1] Validar manualmente em **Android** (iOS pendente — sem
      conta Apple Developer) (`quickstart.md`, Cenário 1 completo, 6 passos):
      observação visível antes de "Iniciar exercício" e durante a série
      (FR-004); ausente da lista de exercícios e do histórico (FR-006).
      Marcar `[X]` os itens correspondentes em `docs/criterios-aceite.md`
      (T008). Depende de T007 (gate de qualidade) e T001 (fixture).

**Checkpoint**: User Story 1 completa e validável de forma independente
(MVP desta feature).

---

## Phase 4: User Story 2 - Importar treino sem observação, sem nenhuma mudança (Priority: P1)

**Goal**: ausência/`null`/string vazia de `observacao` não alteram nada
(compatibilidade total); valor inválido descarta só aquele exercício;
persistência de `observacao` (presente e ausente) sobrevive a reabrir o app
**e** é confirmável diretamente no Firestore (não só no cache local).

**Independent Test**: `quickstart.md`, Cenários 2 e 3 — importar com/sem
`observacao`, reabrir o app, inspecionar o documento no Firebase Console, e
confirmar que `null`/`""`/só-espaços nunca descartam o exercício enquanto um
tipo inválido sempre descarta.

### Validation for User Story 2

Nenhuma implementação nova — comportamento já cobre por T002 (validação/
montagem) e T004 (ausência de render quando não há observação). Ver nota
"Organization" #2 sobre a dependência do gate de qualidade.

- [X] T010 [US2] Validar manualmente em **Android** (iOS pendente)
      (`quickstart.md`, Cenário 2, passos 1-4; Cenário 3 completo, usando os
      4 arquivos de `docs/exemplos/` criados em T001): exercício sem
      `observacao` comporta-se de forma idêntica à anterior a esta feature
      (FR-005); treino com e sem observação aparece na lista logo após
      importar e continua lá após fechar/reabrir o app (FR-009);
      `treino-observacao-invalida.json` descarta só esse exercício com o
      motivo `Exercício {indice}: campo "observacao" inválido` (FR-003);
      `treino-observacao-null.json`, `-vazia.json` e `-espacos.json`
      **não** descartam o exercício e **não** aparecem como erro no alerta —
      importam normalmente, sem observação (FR-002). Marcar `[X]` os itens
      correspondentes em `docs/criterios-aceite.md` (T008). Depende de T001,
      T007.
- [X] T011 [US2] Verificação no Firebase Console (FR-008) — `quickstart.md`,
      Cenário 2, passo 5: abrir Firebase Console → Firestore Database →
      `users/{uid}/treinos/{id-do-treino-de-teste}`, inspecionar o array
      `exercicios` diretamente no documento do servidor (não só o que o app
      mostra, que pode vir do cache local offline antes de o `setDoc`
      confirmar — ver `research.md` Decisão 4): o exercício sem observação
      não tem a chave `observacao` (nem com valor `null`/`""` — a chave
      inteira ausente); os exercícios com observação têm a chave com a
      string exata importada. Marcar `[X]` o item correspondente em
      `docs/criterios-aceite.md` (T008). Depende de T010 (precisa do treino
      de teste já importado).

**Checkpoint**: User Stories 1 e 2 completas e validadas — observação exibida
corretamente e nunca corrompe/quebra a importação ou a persistência.

---

## Phase 5: User Story 3 - Observação longa não esconde o registro da série (Priority: P2)

**Goal**: mesmo com uma observação de texto longo, os campos de registro da
série e o botão "Concluir série" continuam alcançáveis (por rolagem).

**Independent Test**: `quickstart.md`, Cenário 4 — importar
`treino-observacao-longa.json` (~600 caracteres), fonte do sistema no
máximo, tela pequena: campos e botão continuam acessíveis; um único toque em
"Concluir série" conclui a série mesmo com o teclado aberto.

### Validation for User Story 3

Nenhuma implementação nova além de T006. Ver nota "Organization" #2.

- [X] T012 [US3] Validar manualmente em **Android** (iOS pendente)
      (`quickstart.md`, Cenário 4 completo, 6 passos, usando
      `treino-observacao-longa.json` de T001): com a fonte do sistema no
      tamanho máximo de acessibilidade, os campos de registro e "Concluir
      série" continuam alcançáveis por rolagem (FR-007); o cronômetro de
      descanso (RF05/RF06) aparece normalmente sem ser sobreposto pela
      observação; digitar reps com o teclado aberto e tocar direto em
      "Concluir série" conclui a série em um único toque
      (`keyboardShouldPersistTaps="handled"`, T006), tanto no exercício com
      observação longa quanto em um exercício-controle sem observação.
      Marcar `[X]` os itens correspondentes em `docs/criterios-aceite.md`
      (T008). Depende de T001, T007.

**Checkpoint**: User Stories 1, 2 e 3 completas e validadas.

---

## Phase 6: User Story 4 - Ver a imagem de um exercício composto (bi-set) (Priority: P2)

**Goal**: exercício com nome "A + B (Bi-set)" sem correspondência de nome
inteiro, mas com as duas partes encontradas no catálogo, exibe as duas
imagens lado a lado, cada uma legendada com o nome do item do catálogo.

**Independent Test**: `quickstart.md`, Cenário 5, passos 1-3 — nome composto
com as duas partes encontradas (com e sem o sufixo "(Bi-set)").

### Validation for User Story 4

- [X] T013 [US4] Validar manualmente em **Android** (iOS pendente)
      (`quickstart.md`, Cenário 5, passos 1-3, usando `biset-peito` de
      `treino-observacao-bi-set.json`): nome "A + B (Bi-set)" sem
      correspondência de nome inteiro, mas com as duas partes encontradas no
      catálogo, exibe as duas imagens, cada uma legendada com o nome do item
      do catálogo (FR-011); mesmo resultado sem o sufixo "(Bi-set)" (FR-010,
      sufixo opcional). Marcar `[X]` os itens correspondentes em
      `docs/criterios-aceite.md` (T008). Depende de T001, T007.

**Checkpoint**: User Stories 1-4 completas e validadas.

---

## Phase 7: User Story 5 - Nome composto sem nenhuma correspondência continua sem imagem (Priority: P3)

**Goal**: os caminhos de "sem correspondência" (uma parte só, nenhuma parte,
nome sem `" + "`) e o caso de partes repetidas continuam se comportando como
a spec 021 já define, sem efeito colateral introduzido por esta extensão.

**Independent Test**: `quickstart.md`, Cenário 5, passos 4-6, e Cenário 6.

### Validation for User Story 5

- [X] T014 [US5] Validar manualmente em **Android** (iOS pendente)
      (`quickstart.md`, Cenário 5, passos 4-6; Cenário 6 completo, usando
      `biset-repetido` de `treino-observacao-bi-set.json`): só uma parte
      encontrada → só essa imagem aparece (FR-012); nenhuma parte encontrada
      → nenhuma imagem, tela idêntica à de "sem correspondência" (FR-013);
      nome sem `" + "` → nenhuma tentativa de separação, sem mudança de
      comportamento; as duas partes de um nome composto repetidas → mesma
      imagem exibida duas vezes, cada uma com sua legenda, **sem** erro de
      chave duplicada na lista renderizada (``key={`${item.id}-${indice}`}``,
      T005). Marcar `[X]` os itens correspondentes em
      `docs/criterios-aceite.md` (T008). Depende de T001, T007.

**Checkpoint**: todas as 5 User Stories completas e validadas em Android.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T015 [P] Validar manualmente em **Android** (iOS pendente)
      (`quickstart.md`, Cenário 7 — paridade visual): comparar as 4 capturas
      de referência de T000 (feitas **antes** de qualquer mudança de código,
      com um treino importado antes desta feature, documento sem a chave
      `observacao`) com as mesmas 4 telas depois desta feature — mesmo
      espaçamento entre "Voltar para exercícios" e o conteúdo (gap movido
      para `contentContainerStyle`, T006), nenhuma barra de rolagem visível,
      nenhum rubber-band ao arrastar sem conteúdo pra rolar, mesmo número de
      toques para concluir uma série (RNF03), lista de exercícios e
      histórico idênticos. Marcar `[X]` o item correspondente em
      `docs/criterios-aceite.md` (T008). Depende de T000, T007. **Reaberta
      em 2026-10-14**: a confirmação anterior (2026-10-09) foi dada sem
      reabrir de fato as capturas de T000 para comparar — usuário vai
      refazer a comparação com as imagens de `t000-referencia/` antes de
      marcar esta task como concluída.
- [X] T016 [P] Rodar `head -1 specs/023-observacao-e-imagens-bi-set/contracts/*.md`
      e `md5sum specs/023-observacao-e-imagens-bi-set/contracts/*.md | sort |
      uniq -w32 -d` — confirmar que os 3 arquivos de contrato têm títulos
      distintos e nenhum hash duplicado (detecta um arquivo de contrato
      sobrescrito por engano por outro, como já ocorreu uma vez durante o
      planejamento desta spec).
- [X] T017 Atualizar `docs/PRD-app-treino.md` (seção 6, "Requisitos
      funcionais"): registrar o RF desta feature, **conferindo contra a
      tabela o próximo número livre no momento exato de aplicar esta task —
      sem presumir agora**, já que a spec `022-autenticacao-google-firestore-treinos`
      ainda não tinha registrado o número dela quando esta spec foi escrita
      (mesma disciplina já usada pelas specs 011-021: nunca presumir o
      número antes de fechar). Depende de T009, T010, T011, T012, T013,
      T014, T015 (toda a validação em Android concluída). **Exceção
      registrada em 2026-10-14**: T015 foi reaberta (paridade visual ainda
      não reverificada contra as capturas de T000) depois de T017 já ter
      sido aplicada — usuário decidiu explicitamente manter o registro do
      RF21 no PRD mesmo assim, em vez de desfazê-lo, dado que o item em
      aberto é um check de regressão visual, não uma correção de
      comportamento.
- [X] T018 Atualizar **só o título** da entrada já criada em T008, em
      `docs/criterios-aceite.md`, inserindo o número de RF agora confirmado
      (T017) — os itens `[X]`/`[ ]` já foram marcados incrementalmente pelas
      tasks de validação (T009-T015), esta task não recria nem reavalia
      nenhum item, só o cabeçalho. Depende de T017.
- [X] T019 Em `specs/021-imagens-exercicios/spec.md`, na nota de emenda já
      registrada no FR-003 (linha com "**Emenda (spec
      `023-observacao-e-imagens-bi-set`, Draft):**"): trocar **só** a palavra
      "Draft" por "Implemented" — não alterar mais nenhuma palavra do
      restante da nota, que já está completa (ver nota "Organization" #4).
      Só aplicar depois que o comportamento de bi-set (US4/US5) estiver
      validado em Android. Depende de T013, T014.

---

## Dependencies & Execution Order

- **Preparação (T000, T001)**: sem dependências entre si — podem rodar em
  paralelo, inclusive antes da Fundação.
- **Foundational (T002, T003)**: sem dependências entre si — podem rodar em
  paralelo. Bloqueiam toda a Fase 2 (UI).
- **UI (T004, T005, T006)**: T004 depende de T002. T005 depende de T003 e de
  T004 (mesmo arquivo, sequencial). T006 depende só da Fase 1, roda em
  paralelo com o par T004/T005 (arquivo diferente).
- **Gate de qualidade (T007)**: depende de T002-T006. Bloqueia toda
  validação em aparelho (T009 em diante).
- **Registro inicial em criterios-aceite.md (T008)**: sem dependência
  técnica — posicionado aqui no fluxo, pode ser escrito a partir de
  `spec.md` em paralelo com T002-T007.
- **User Story 1 (T009)**: depende de T001, T007.
- **User Story 2 (T010, T011)**: T010 depende de T001, T007. T011 depende de
  T010.
- **User Story 3 (T012)**: depende de T001, T007.
- **User Story 4 (T013)**: depende de T001, T007.
- **User Story 5 (T014)**: depende de T001, T007.
- **Polish (T015-T019)**: T015 depende de T000, T007. T016 pode rodar a
  qualquer momento depois que os arquivos de contrato existirem (inclusive
  em paralelo com as validações). T017 depende de toda a validação
  (T009-T015). T018 depende de T017. T019 depende de T013, T014.

## Parallel Example: Preparação, Foundational e UI

```bash
# Fase 0 — podem rodar juntas, antes de qualquer código:
Task: "T000 — capturas de referência (Android, versão anterior)"
Task: "T001 — fixtures em docs/exemplos/"

# Fase 1 — depois da Fase 0 (ou em paralelo com ela, já que não dependem):
Task: "T002 — observacao em treino-storage.ts/treino.ts"
Task: "T003 — buscarPartesCompostoNoCatalogo em catalogo-exercicios.ts"

# Fase 2 — depois da Fase 1: T006 em paralelo com o par T004→T005 (mesmo arquivo, sequencial entre si)
Task: "T006 — ScrollView em [treinoId].tsx"
# (T004 então T005, em sequência, em exercicio-execucao.tsx)
```

## Parallel Example: Validações independentes (depois de T007 — gate de qualidade — passar)

```bash
Task: "T009 — Cenário 1 (US1)"
Task: "T012 — Cenário 4 (US3)"
Task: "T013 — Cenário 5, passos 1-3 (US4)"
Task: "T014 — Cenário 5, passos 4-6 + Cenário 6 (US5)"
# T010/T011 (US2) e T015 (paridade visual) podem rodar junto também
```

## Implementation Strategy

1. Preparação (T000-T001) → capturas de referência e fixtures prontos antes
   de qualquer código mudar.
2. Foundational (T002-T003) → tipo/validação de `observacao` e busca de
   partes de bi-set prontas e testáveis isoladamente por código.
3. UI (T004-T006) → as 3 mudanças de tela, na ordem/paralelismo descrito.
4. Gate de qualidade (T007) → type-check/lint limpos antes de qualquer
   validação em aparelho.
5. Registro inicial em `criterios-aceite.md` (T008) → checklist existe,
   tudo `[ ]`, status "em validação".
6. User Story 1 (T009) → MVP desta feature (🎯, spec.md): observação visível
   na execução.
7. User Story 2 (T010-T011) → garante que nada quebra para quem não usa o
   campo, e que a persistência é real (Firebase Console), não só aparência
   local.
8. User Story 3 (T012) → garante que o caso de observação longa (motivador
   real desta spec) não compromete o registro de série.
9. User Story 4 (T013) → imagens de bi-set aparecem quando as partes batem.
10. User Story 5 (T014) → nenhum efeito colateral nos caminhos sem
    correspondência ou com partes repetidas.
11. Polish (T015-T019) → paridade visual contra as capturas de T000,
    integridade dos contratos, registro no PRD, atualização do título em
    `criterios-aceite.md`, e o fechamento da emenda à spec 021.
