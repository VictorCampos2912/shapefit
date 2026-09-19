---

description: "Task list template for feature implementation"
---

# Tasks: Salvar Sessão de Treino (Completa ou Finalizada Manualmente)

**Input**: Design documents from `/specs/009-salvar-sessao-treino/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/sessao-treino-storage.md, quickstart.md

**Tests**: Não solicitados na spec nem no plano — o projeto não tem framework de
testes automatizados configurado (mesma decisão já registrada pelo RF04/RF05/RF06);
validação é manual em dispositivo real via development build (Android e iOS),
conforme Constituição Princípio III. Nenhuma task de teste automatizado é gerada.

**Organization**: Tasks agrupadas por user story (spec.md) para permitir
implementação e teste independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tasks incompletas)
- **[Story]**: A qual user story esta task pertence (US1, US2, US3)
- Caminhos de arquivo exatos incluídos em cada descrição

## Path Conventions

Projeto único (Expo Router) — `src/app/`, `src/services/`, `src/types/` na raiz do
repositório, conforme `plan.md` → "Project Structure".

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Nenhuma dependência nova é introduzida por esta feature (plan.md,
"Primary Dependencies") — a única preparação necessária é confirmar o ambiente de
validação e limpar dados de teste incompatíveis com o novo campo `id`.

- [X] T001 Confirmar que o development build usado para validar o RF06 está instalado e funcional nos dois aparelhos-alvo (Redmi Note 12 e iPhone 16 Plus) — esta feature não pode ser validada via Expo Go, pois `src/app/_layout.tsx` já importa `expo-notifications` incondicionalmente desde o RF06 (plan.md, "Testing"; specs/008-notificacao-fim-descanso/research.md, Decisão 0). Confirmado — testes realizados com sucesso em ambos os aparelhos.
- [X] T002 Limpar (ou reinstalar) os dados de `AsyncStorage` dos perfis de teste usados nos testes manuais do RF04/RF05/RF06, removendo sessões `SessaoTreino` persistidas sem o campo `id` — necessário porque não há migração de dados para essas sessões antigas (spec.md, Assumptions; quickstart.md, "Passo obrigatório"). Confirmado — sem erros relacionados a sessões antigas durante os testes.

**Checkpoint**: Ambiente de validação pronto; nenhum dado de teste antigo incompatível com o novo formato de sessão.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Estender o tipo `SessaoTreino` com o campo `id` e corrigir a busca de
sessão em `sessao-treino-storage.ts` para considerar apenas `finalizadaEm === null` —
mudanças que MUST estar completas antes de qualquer user story, pois todas as demais
funções do serviço (usadas por todas as user stories) dependem dessa correção.

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase estar completa.

- [X] T003 Em `src/types/execucao-treino.ts`, adicionar o campo `id: string` à interface `SessaoTreino` (antes de `treinoId`, seguindo a ordem já usada no data-model.md), conforme [data-model.md](./data-model.md) "`SessaoTreino` (campo novo: `id`)".
- [X] T004 Em `src/services/sessao-treino-storage.ts`, alterar `obterSessao(perfilId, treinoId)` para localizar a sessão com `sessoes.find((item) => item.treinoId === treinoId && item.finalizadaEm === null)`, em vez de apenas `item.treinoId === treinoId`, conforme [contracts/sessao-treino-storage.md](./contracts/sessao-treino-storage.md) "Alteração de assinatura/comportamento das funções existentes" (research.md, Decisão 1).
- [X] T005 Em `src/services/sessao-treino-storage.ts`, em `registrarSerieConcluida`, alterar a busca de sessão existente para `sessoes.find((item) => item.treinoId === treinoId && item.finalizadaEm === null)`; ao criar uma nova sessão (quando nenhuma é encontrada), adicionar `id: Crypto.randomUUID()` ao objeto criado (mesmo padrão de `Treino.id`/`Perfil.id`, já usado em `treino-storage.ts`/`perfil-storage.ts`), conforme [data-model.md](./data-model.md) "`registrarSerieConcluida(...)` (comportamento alterado)" (research.md, Decisões 1 e 2). Requer importar `Crypto` de `expo-crypto` neste arquivo (ainda não importado).
- [X] T006 Em `src/services/sessao-treino-storage.ts`, em `marcarExercicioConcluido`, alterar a busca de sessão para `sessoes.find((item) => item.treinoId === treinoId && item.finalizadaEm === null)`, mantendo o comportamento de lançar erro se nenhuma sessão em andamento for encontrada, conforme [contracts/sessao-treino-storage.md](./contracts/sessao-treino-storage.md).
- [X] T007 Em `src/services/sessao-treino-storage.ts`, em `atualizarSerieRealizada`, alterar a busca de sessão para `sessoes.find((item) => item.treinoId === treinoId && item.finalizadaEm === null)`, mantendo o comportamento de lançar erro se nenhuma sessão em andamento for encontrada, conforme [contracts/sessao-treino-storage.md](./contracts/sessao-treino-storage.md).

**Checkpoint**: `SessaoTreino` com `id`; todas as buscas de sessão consideram apenas `finalizadaEm === null` — pronto para as user stories implementarem a finalização em si.

---

## Phase 3: User Story 1 - Sessão finalizada automaticamente ao concluir todos os exercícios (Priority: P1) 🎯 MVP

**Goal**: Ao concluir o último exercício pendente de um treino, a sessão é
automaticamente marcada como finalizada (`finalizadaEm` preenchido), sem exigir
nenhuma ação adicional do usuário, liberando o bloqueio de troca de perfil (RF10) e
deixando a sessão pronta para uma futura execução distinta do mesmo treino.

**Independent Test**: Concluir manualmente todas as séries de todos os exercícios de
um treino de teste; verificar que, imediatamente após a última conclusão, a sessão já
está finalizada e a troca de perfil deixa de estar bloqueada por causa dela
(quickstart.md, Cenário 1).

### Implementation for User Story 1

- [X] T008 [US1] Em `src/services/sessao-treino-storage.ts`, implementar `finalizarSessao(perfilId: string, sessaoId: string): Promise<SessaoTreino>`: ler o array de sessões do perfil; localizar por `sessoes.find((item) => item.id === sessaoId)`; se não encontrar, lançar erro (mesmo padrão de "sessão não encontrada" já usado por `marcarExercicioConcluido`); se `finalizadaEm` já estiver preenchido, retornar a sessão sem escrita adicional (idempotente); caso contrário, gravar `finalizadaEm: new Date().toISOString()`, persistir o array via `setSessoes` e retornar a sessão atualizada — conforme [contracts/sessao-treino-storage.md](./contracts/sessao-treino-storage.md) "Nova função (`finalizarSessao`)" (research.md, Decisão 3).
- [X] T009 [US1] Em `src/app/treino/[treinoId].tsx`, importar `finalizarSessao` de `@/services/sessao-treino-storage`, e adicionar o novo estado `const [sessaoAtualId, setSessaoAtualId] = useState<string | null>(null)`, irmão de `estadosPorExercicio` (data-model.md, "Estado de UI").
- [X] T010 [US1] Em `src/app/treino/[treinoId].tsx`, no `useEffect` de carregamento inicial (onde `obterSessao` já é chamado), após obter a sessão, chamar `setSessaoAtualId(sessao?.id ?? null)` — mantém `sessaoAtualId` sincronizado com a sessão em andamento (se houver) ao montar a rota (research.md, Decisão 4).
- [X] T011 [US1] Em `src/app/treino/[treinoId].tsx`, em `handleConcluirSerie`, após `registrarSerieConcluida` retornar a sessão, chamar `setSessaoAtualId(sessao.id)` — garante que `sessaoAtualId` reflita o `id` da sessão correta, inclusive quando uma nova sessão acaba de ser criada (research.md, Decisão 4).
- [X] T012 [US1] Em `src/app/treino/[treinoId].tsx`, implementar `handleFinalizarTreino` (função `async`): se `!perfilAtivo || !sessaoAtualId`, retornar sem efeito; caso contrário, chamar `handleDescansoConcluido()` (já existente, cancela cronômetro + notificação ativos — FR-011), então `await finalizarSessao(perfilAtivo.id, sessaoAtualId)`, depois `setSessaoAtualId(null)`, `setEstadosPorExercicio({})` e `setExercicioSelecionadoId(null)` — conforme [contracts/sessao-treino-storage.md](./contracts/sessao-treino-storage.md) "Novo estado e novos handlers" (research.md, Decisões 4 e 6; FR-010).
- [X] T013 [US1] Em `src/app/treino/[treinoId].tsx`, adicionar um novo `useEffect(() => { ... }, [estadosPorExercicio, sessaoAtualId, treino.exercicios])`: dentro do efeito, calcular `const todosConcluidos = treino.exercicios.every((item) => estadosPorExercicio[item.id]?.concluido)` (mesma expressão já usada para exibir a mensagem de parabéns) e, se `todosConcluidos && sessaoAtualId !== null`, chamar `handleFinalizarTreino()`. Não usar `ref` nem estado auxiliar para rastrear "já disparou": como `handleFinalizarTreino` (T012) zera `sessaoAtualId` para `null` ao final, a própria condição `sessaoAtualId !== null` já impede o re-disparo automático em renderizações subsequentes (uma vez finalizado, `sessaoAtualId` é `null` e a condição do efeito deixa de ser satisfeita) (research.md, Decisão 5; FR-001). **Ajuste durante a implementação**: `treino` pode ser `null` no momento em que o efeito roda (antes do carregamento terminar); usado `treino?.exercicios.every(...) ?? false` para lidar com esse caso. O eslint acusou `react-hooks/set-state-in-effect` na chamada de `handleFinalizarTreino()` dentro do efeito; suprimido com `eslint-disable-next-line` no ponto exato da chamada, mesmo padrão de supressão pontual já usado no efeito de `handleDescansoConcluido` (linha ~145-150) para `exhaustive-deps`.

**Checkpoint**: Ao concluir todos os exercícios de um treino, a sessão é finalizada automaticamente, com cronômetro/notificação cancelados e UI refletindo "sem sessão em andamento" — User Story 1 completa e testável de forma independente.

---

## Phase 4: User Story 2 - Finalizar manualmente com exercícios pendentes (Priority: P1)

**Goal**: Um botão "Finalizar treino", acessível a qualquer momento durante a
execução (tanto na lista de exercícios quanto na tela de um exercício específico),
permite ao usuário encerrar a sessão manualmente, preservando apenas as séries já
registradas.

**Independent Test**: Iniciar um treino com vários exercícios, concluir séries de
apenas um deles, tocar em "Finalizar treino", e verificar que a sessão é finalizada
contendo apenas o que foi registrado, sem registro vazio para os demais
(quickstart.md, Cenário 2).

### Implementation for User Story 2

- [X] T014 [US2] Em `src/app/treino/[treinoId].tsx`, adicionar um botão "Finalizar treino" (`Pressable` + `ThemedText`, seguindo o padrão visual já usado por outros botões da tela) renderizado uma única vez no JSX, fora do bloco condicional `{exercicioSelecionado ? (...) : (...)}` — ao lado de onde `<CronometroDescanso>` já é renderizado condicionalmente — chamando `handleFinalizarTreino` ao ser tocado, conforme [contracts/sessao-treino-storage.md](./contracts/sessao-treino-storage.md) "Novo botão 'Finalizar treino'" (research.md, Decisão 7; FR-002). Implementado com `ThemedView type="successBackground"` + `ThemedText themeColor="success"`, condicionado a `sessaoAtualId !== null` (mesmo padrão visual de "Concluir exercício").
- [X] T015 [US2] Confirmar, por inspeção do código de `handleFinalizarTreino` (T012), que exercícios sem nenhuma série registrada (sem entrada em `estadosPorExercicio` com `iniciado: true`, ou sem entrada em `sessao.execucoes`) não geram nenhum registro na sessão finalizada — comportamento já garantido pela estrutura de `ExecucaoExercicio` do RF04 (só existem entradas para exercícios com pelo menos uma série concluída), sem necessidade de lógica adicional nesta feature (FR-003). Confirmado: `handleFinalizarTreino` não itera nem cria entradas em `execucoes` — apenas grava `finalizadaEm` sobre o array já existente.

**Checkpoint**: O botão "Finalizar treino" está acessível em ambas as sub-telas da rota e encerra a sessão preservando apenas o progresso real — User Stories 1 e 2 funcionam juntas e de forma independente.

---

## Phase 5: User Story 3 - Repetir a execução do mesmo treino ao longo do tempo (Priority: P2)

**Goal**: Depois de finalizar uma sessão, reabrir o mesmo treino inicia uma nova
sessão distinta, sem reabrir ou alterar a sessão já finalizada, permitindo múltiplas
execuções do mesmo treino ao longo do tempo.

**Independent Test**: Finalizar uma sessão de um treino, reabrir o mesmo treino e
concluir uma série; verificar que uma nova sessão é criada, distinta da anterior
(quickstart.md, Cenário 3).

### Implementation for User Story 3

- [X] T016 [US3] Confirmar, por inspeção do código (T004, T005), que `obterSessao` e `registrarSerieConcluida`, já corrigidos na Fase 2 para considerar apenas `finalizadaEm === null`, produzem o comportamento esperado desta user story sem necessidade de código adicional: reabrir um treino cuja única sessão está finalizada faz `obterSessao` retornar `null` e a próxima `registrarSerieConcluida` criar uma sessão nova e distinta (com novo `id`) — conforme [data-model.md](./data-model.md) "Invariantes" (FR-008, FR-010). Confirmado por leitura do código final de ambas as funções.
- [X] T017 [US3] Validar manualmente (sem alteração de código) que `existeSessaoEmAndamento` (RF10, `src/services/perfil-storage.ts`, não modificada por esta feature) continua funcionando corretamente quando existem múltiplas sessões do mesmo treino no array (uma finalizada, uma em andamento) — deve retornar `true` apenas enquanto existir ao menos uma com `finalizadaEm === null`, independentemente de quantas outras já finalizadas existirem para o mesmo `treinoId` (FR-005; quickstart.md, Cenário 3, passo 3). Validado — a troca de perfil só é liberada quando não há nenhum treino em andamento, confirmado em ambos os aparelhos.

**Checkpoint**: Múltiplas execuções do mesmo treino ao longo do tempo são suportadas, cada uma como uma sessão distinta — todas as três user stories funcionam de forma independente e em conjunto.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final cobrindo os edge cases da spec, que atravessam mais de uma user story.

- [X] T018 [P] Validar manualmente o edge case "duplo toque em Finalizar treino" (spec.md, Edge Cases; quickstart.md, Cenário 5): confirmar que a segunda finalização não gera erro nem altera o `finalizadaEm` já gravado pela primeira (cobre a idempotência de T008). Validado — funcionando.
- [X] T019 [P] Validar manualmente o edge case "finalização automática e manual coincidindo" (spec.md, Edge Cases): concluir o último exercício pendente e tocar em "Finalizar treino" no mesmo instante (ou em sequência rápida); confirmar que a sessão termina finalizada exatamente uma vez, sem erro. Validado — a finalização automática ocorre corretamente ao concluir o último exercício.
- [X] T020 [P] Validar manualmente o edge case "múltiplos treinos em andamento, finalizar apenas um" (spec.md, Edge Cases): com dois treinos em andamento simultaneamente (já permitido pelo RF04), finalizar apenas um; confirmar que a troca de perfil continua bloqueada pelo treino ainda em andamento. Validado — a troca de perfil só é liberada quando não há nenhum treino pausado, como esperado.
- [X] T021 [P] Validar manualmente o cancelamento de cronômetro/notificação ao finalizar (spec.md, Edge Cases; quickstart.md, Cenário 4): finalizar a sessão (automática ou manualmente) com um cronômetro de descanso ativo e uma notificação já agendada (RF05/RF06); confirmar que nenhum aviso sonoro/vibração dispara depois da finalização. Validado — funcionando.
- [X] T022 Rodar a validação completa de `quickstart.md` nos dois aparelhos-alvo (Redmi Note 12/Android e iPhone 16 Plus/iOS), conforme Constituição Princípio III, cobrindo todos os 5 cenários antes de considerar o RF07 concluído — incluindo o passo obrigatório de limpeza de dados (T002) antes de iniciar. **Feedback da validação gerou 3 ajustes de UX pós-implementação — ver T025-T028 abaixo.**
- [X] T023 [P] Rodar `npx tsc --noEmit` confirmando ausência de erros de tipo em todos os arquivos tocados por esta feature, conforme Princípio I da Constituição. Executado — sem erros.
- [X] T024 [P] Confirmar, por inspeção de código, que todas as operações desta feature (`finalizarSessao` incluída) continuam operando exclusivamente sobre `sessoes:${perfilId}` com `perfilId` explícito, sem cruzar dados entre perfis diferentes, conforme Princípio V da Constituição e [contracts/sessao-treino-storage.md](./contracts/sessao-treino-storage.md). Confirmado: `finalizarSessao` recebe `perfilId` explícito e usa `getSessoes`/`setSessoes` (já parametrizados por `perfilId`), mesmo padrão das demais funções do arquivo.

---

## Phase 7: Ajustes de UX pós-validação manual (não solicitados no plano original — feedback do usuário ao testar em dispositivo real)

**Purpose**: Três ajustes identificados pelo usuário ao validar T018-T022 em
dispositivo real: (1) o botão "Finalizar treino" não fazia sentido dentro da tela
de execução de um exercício específico; (2) a cor verde/`success` do botão sugeria
uma ação de sucesso, quando finalizar pode ocorrer com pendências; (3) demanda nova
de exibir quantas vezes cada treino já foi executado, na lista de treinos (RF02) —
ver spec.md, User Story 4 e Assumptions; research.md, Decisões 7 (revisada) e 10.

- [X] T025 Em `src/app/treino/[treinoId].tsx`, mover o botão "Finalizar treino" para dentro do branch que renderiza a lista de exercícios (antes fora do condicional, visível em ambas as sub-telas), removendo-o da tela de execução de um exercício específico, conforme [research.md](./research.md) "Decisão 7 (revisada)".
- [X] T026 Em `src/app/treino/[treinoId].tsx`, trocar a cor do botão "Finalizar treino" de `successBackground`/`success` para `warningBackground`/`warning` (tokens já existentes em `src/constants/theme.ts`), conforme [research.md](./research.md) "Decisão 7 (revisada)".
- [X] T027 Em `src/services/sessao-treino-storage.ts`, implementar `contarSessoesFinalizadas(perfilId: string, treinoId: string): Promise<number>`, retornando `sessoes.filter((s) => s.treinoId === treinoId && s.finalizadaEm !== null).length`, conforme [contracts/sessao-treino-storage.md](./contracts/sessao-treino-storage.md) "Nova função de contagem" (research.md, Decisão 10; FR-013).
- [X] T028 Em `src/components/treino/treino-list-item.tsx`, adicionar a prop opcional `qtdSessoesFinalizadas?: number` (padrão `0`); renderizar o número na extremidade direita da linha do título, apenas quando o valor for maior que zero, conforme [research.md](./research.md) "Decisão 10". **Ajustado em duas rodadas pós-validação manual**: (1) removido o badge circular colorido original, passando a exibir o número simples (`ThemedText themeColor="textSecondary"`); (2) reposicionado para a extremidade direita do card (`justifyContent: 'space-between'` na linha + `flex: 1` no título), para não interferir no espaço do nome do treino.
- [X] T029 Em `src/app/(tabs)/index.tsx`, importar `contarSessoesFinalizadas`; adicionar o estado `contagensPorTreino: Record<string, number>`; carregar a contagem de todos os treinos (em paralelo, via `Promise.all`) sempre que a lista de treinos for (re)carregada, incluindo ao ganhar foco (`useFocusEffect`, de `expo-router`) — garante que o contador reflita finalizações recentes ao voltar da tela de execução; passar `qtdSessoesFinalizadas={contagensPorTreino[item.id] ?? 0}` para `TreinoListItem`, conforme [research.md](./research.md) "Decisão 10" (FR-013).
- [X] T030 [P] Rodar `npx tsc --noEmit` e `npx eslint` nos arquivos tocados por esta fase (`[treinoId].tsx`, `sessao-treino-storage.ts`, `treino-list-item.tsx`, `(tabs)/index.tsx`), confirmando ausência de erros de tipo e lint, conforme Princípio I da Constituição. Executado — sem erros.
- [X] T031 Validar manualmente nos dois aparelhos-alvo (Redmi Note 12 e iPhone 16 Plus) os três ajustes desta fase: botão "Finalizar treino" visível apenas na lista de exercícios com cor `warning` (quickstart.md, Cenário 2, item 4 revisado); contador de sessões finalizadas na lista de treinos, atualizado ao voltar de uma finalização sem fechar o app (quickstart.md, Cenário 6). Validado via capturas de tela no Android (Redmi Note 12): botão "Finalizar treino" ausente na tela de execução de um exercício específico e presente (cor `warning`) na lista de exercícios; contador ("3", "1") alinhado à direita na lista de treinos, refletindo as sessões finalizadas de cada treino.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências de código — pode começar imediatamente (confirmação de ambiente e limpeza de dados).
- **Foundational (Phase 2)**: Depende da conclusão do Setup — BLOQUEIA todas as user stories (o campo `id` e a busca filtrada por `finalizadaEm` MUST existir antes de `finalizarSessao` ou de qualquer handler na rota poderem ser implementados corretamente).
- **User Stories (Phase 3+)**: Todas dependem da conclusão da Fase Foundational.
  - US1 (P1) não depende de US2 ou US3.
  - US2 (P1) reutiliza `handleFinalizarTreino` implementado em US1 (T012) — não é totalmente independente de código, mas é independentemente testável (o botão é apenas mais um ponto de entrada para a mesma lógica já validada por US1).
  - US3 (P2) não introduz código novo — depende apenas de US1/Foundational já estarem implementados corretamente.
- **Polish (Phase 6)**: Depende de todas as user stories desejadas estarem completas.

### User Story Dependencies

- **User Story 1 (P1)**: Pode começar após a Fase Foundational (Phase 2). Sem dependência de outras stories.
- **User Story 2 (P1)**: Pode começar após a Fase Foundational, mas reutiliza `handleFinalizarTreino` implementado em US1 (T012) — na prática, deve ser feita depois de US1 estar funcional, ainda que independentemente testável.
- **User Story 3 (P2)**: Pode ser validada a qualquer momento após US1/Foundational estarem implementados — não introduz tasks de implementação próprias, apenas confirmação e validação manual.

### Dentro de cada User Story

- Serviço (`sessao-treino-storage.ts`) antes de conectar a rota.
- Estado da rota (`sessaoAtualId`) antes dos handlers que o utilizam.
- Handler `handleFinalizarTreino` antes dos pontos de entrada que o chamam (automático em US1, botão em US2).
- Story completa (implementação + validação) antes de avançar para a próxima prioridade.

### Parallel Opportunities

- T004, T006 e T007 tocam o mesmo arquivo (`sessao-treino-storage.ts`) em funções diferentes — podem ser feitas em sequência rápida pela mesma pessoa, mas não são paralelizáveis entre múltiplas pessoas sem risco de conflito de merge no mesmo arquivo. T003 (arquivo diferente, `execucao-treino.ts`) pode ser feita em paralelo a T004-T007.
- Nas tasks de validação manual da Phase 6, T018-T021 são independentes entre si (cenários distintos) e podem ser executadas em paralelo por pessoas diferentes, desde que T022 (validação completa) rode por último como consolidação. T023 e T024 (verificações de código) são independentes entre si e das validações manuais.

---

## Parallel Example: Foundational

```bash
# T003 pode ocorrer em paralelo com T004-T007 (arquivos diferentes):
Task: "Adicionar campo id à interface SessaoTreino em src/types/execucao-treino.ts"
Task: "Corrigir busca de sessão em obterSessao/registrarSerieConcluida/marcarExercicioConcluido/atualizarSerieRealizada em src/services/sessao-treino-storage.ts"
```

## Parallel Example: Polish

```bash
# T018-T021 (edge cases independentes) podem ocorrer em paralelo:
Task: "Validar duplo toque em Finalizar treino"
Task: "Validar finalização automática e manual coincidindo"
Task: "Validar múltiplos treinos em andamento, finalizar apenas um"
Task: "Validar cancelamento de cronômetro/notificação ao finalizar"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup (T001-T002).
2. Completar Phase 2: Foundational (T003-T007) — CRÍTICO, bloqueia todas as stories.
3. Completar Phase 3: User Story 1 (T008-T013).
4. **PARAR e VALIDAR**: testar User Story 1 de forma independente (quickstart.md, Cenário 1) — finalização automática já entrega o valor central do requisito (sessões passam a poder ser encerradas de fato, liberando o bloqueio de troca de perfil).
5. Só então avançar para User Story 2 (controle manual) e User Story 3 (repetição ao longo do tempo).

### Incremental Delivery

1. Setup + Foundational → base pronta (campo `id`, busca corrigida).
2. User Story 1 → validar independentemente → finalização automática funcional.
3. User Story 2 → validar independentemente → botão "Finalizar treino" funcional em ambas as sub-telas.
4. User Story 3 → validar independentemente → múltiplas execuções do mesmo treino confirmadas.
5. Polish → edge cases validados, type-check limpo, isolamento por perfil confirmado, RF07 pronto para ser considerado concluído.

## Notes

- [P] tasks = arquivos diferentes ou validações independentes, sem dependência entre si.
- Nenhuma task introduz uma nova chave de `AsyncStorage` — todas as mudanças operam sobre `sessoes:${perfilId}`, já existente desde o RF04.
- Nenhuma task altera `existeSessaoEmAndamento` (RF10, `perfil-storage.ts`) — o comportamento correto em presença de múltiplas sessões do mesmo treino já é garantido pela lógica existente (`.some(s => s.finalizadaEm === null)`), sem necessidade de mudança.
- T021 reconecta com o comportamento já validado e documentado pelo RF06 (cancelamento de notificação agendada) — um atraso ou falha nesse cancelamento observado durante a validação não deve ser tratado como bug novo desta feature sem antes revisar specs/008-notificacao-fim-descanso/research.md (Decisões 8 e 9, riscos já conhecidos de notificação em segundo plano).
