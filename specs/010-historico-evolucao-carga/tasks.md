---

description: "Task list template for feature implementation"
---

# Tasks: Histórico de Evolução de Carga por Exercício

**Input**: Design documents from `/specs/010-historico-evolucao-carga/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/historico-evolucao.md, quickstart.md

**Tests**: Não solicitados na spec nem no plano — o projeto não tem framework de
testes automatizados configurado (mesma decisão já registrada pelo RF04–RF07);
validação é manual em dispositivo real via development build (Android e iOS),
conforme Constituição Princípio III. Nenhuma task de teste automatizado é gerada.

**Organization**: Tasks agrupadas por user story (spec.md) para permitir
implementação e teste independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tasks incompletas)
- **[Story]**: A qual user story esta task pertence (US1, US2, US3, US4)
- Caminhos de arquivo exatos incluídos em cada descrição

## Path Conventions

Projeto único (Expo Router) — `src/app/`, `src/services/`, `src/types/`,
`src/utils/` na raiz do repositório, conforme `plan.md` → "Project Structure".

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Nenhuma dependência nova é introduzida por esta feature (plan.md,
"Primary Dependencies") — a única preparação necessária é confirmar o ambiente de
validação já em uso pelo RF07.

- [ ] T001 Confirmar que o development build usado para validar o RF07 continua instalado e funcional nos dois aparelhos-alvo (Redmi Note 12 e iPhone 16 Plus) — esta feature não introduz nenhum módulo nativo novo, mas continua exigindo o mesmo build (não Expo Go), pelo motivo já registrado em plan.md, "Testing" (import incondicional de `expo-notifications` em `src/app/_layout.tsx` desde o RF06). **Android: ✅ confirmado pelo usuário** — novo development build gerado via `eas build --profile development --platform android` (máquina reinstalada nesta sessão), instalado e conectado com sucesso via `npx expo start --dev-client` no Redmi Note 12. **iOS: pendente** — build ainda não gerado para o iPhone 16 Plus.

**Checkpoint**: Ambiente de validação pronto.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Criar os tipos, a função pura de normalização e a nova função de
leitura de sessões finalizadas — blocos usados por **todas** as user stories desta
feature, já que todas dependem do mesmo serviço central (`obterHistoricoPorPerfil`)
e dos mesmos tipos de dados.

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase estar completa.

- [X] T002 [P] Criar `src/types/historico.ts` com os tipos `RegistroHistorico` (`{ data: string; cargaKg: number; reps: number }`), `EvolucaoExercicio` (`{ nomeExibido: string; registros: RegistroHistorico[] }`) e `HistoricoPerfil` (união discriminada `{ temSessoesFinalizadas: false } | { temSessoesFinalizadas: true; evolucoes: EvolucaoExercicio[] }`), conforme [data-model.md](./data-model.md) "Entidades novas" e [contracts/historico-evolucao.md](./contracts/historico-evolucao.md) "Novos tipos".
- [X] T003 [P] Criar `src/utils/normalizar-nome-exercicio.ts` exportando a função pura `normalizarNomeExercicio(nome: string): string`, implementada como `nome.trim().replace(/\s+/g, ' ').toLowerCase()` — sem normalizar acentuação ou pontuação (spec.md FR-006; research.md, Decisões 3 e 4). Sem dependência de storage, tipos de domínio ou React.
- [X] T004 [P] Em `src/services/sessao-treino-storage.ts`, adicionar `listarSessoesFinalizadas(perfilId: string): Promise<SessaoTreino[]>`, reaproveitando o `getSessoes` já existente no arquivo e retornando `sessoes.filter((s) => s.finalizadaEm !== null)` — sem nenhum outro filtro, sem lançar erro em nenhum caso, conforme [contracts/historico-evolucao.md](./contracts/historico-evolucao.md) "Nova função em sessao-treino-storage.ts" (research.md, Decisão 2).

**Checkpoint**: Tipos, normalização e leitura de sessões finalizadas prontos — o novo serviço de agregação (US1) já pode ser implementado.

---

## Phase 3: User Story 1 - Consultar a evolução de carga de um exercício (Priority: P1) 🎯 MVP

**Goal**: Ao abrir a aba "Explore", o usuário vê, para cada exercício que já tem pelo
menos um registro, a lista completa de séries de todas as sessões finalizadas em que
ele aparece — incluindo quando vêm de treinos diferentes com o mesmo nome de
exercício, já que a normalização/agrupamento (FR-005/FR-006) é parte inseparável de
produzir esse resultado corretamente desde o primeiro registro exibido — ordenada da
mais recente para a mais antiga, com data, carga (kg) e reps de cada série.

**Independent Test**: Finalizar duas sessões (de um ou dois treinos com o mesmo
exercício, grafias levemente diferentes) registrando séries de um mesmo exercício;
abrir a aba "Explore" e confirmar que todas as séries aparecem juntas, corretamente
ordenadas, com data/carga/reps (quickstart.md, Cenários 1 e 2).

### Implementation for User Story 1

- [X] T005 [US1] Criar `src/services/historico-evolucao.ts` exportando `obterHistoricoPorPerfil(perfilId: string): Promise<HistoricoPerfil>`: chamar `listarTreinos(perfilId)` (`@/services/treino-storage`) e `listarSessoesFinalizadas(perfilId)` (`@/services/sessao-treino-storage`, T004) em paralelo via `Promise.all`; se as sessões finalizadas estiverem vazias, retornar `{ temSessoesFinalizadas: false }` imediatamente; caso contrário, montar um mapa `treinoId -> Treino`, e para cada sessão → cada `ExecucaoExercicio` → cada `SerieRealizada`, resolver o `Treino` pelo `treinoId` da sessão e o `ExercicioPlanejado` pelo `exercicioId` dentro dele; se qualquer um dos dois não for encontrado, chamar `console.warn` identificando `perfilId`, `treinoId`, `exercicioId` e `sessaoId`, e pular essa série (FR-013/FR-014); caso contrário, calcular `chave = normalizarNomeExercicio(exercicio.nome)` (T003) e acumular `{ data: sessao.finalizadaEm, cargaKg: serie.cargaKg, reps: serie.reps, nomeOriginal: exercicio.nome }` em uma lista de trabalho interna por `chave`. Ao final: para cada grupo, ordenar por `data` decrescente, definir `nomeExibido` a partir do `nomeOriginal` do primeiro item já ordenado, e converter os itens para `RegistroHistorico[]` (descartando `nomeOriginal`); ordenar os grupos alfabeticamente por `nomeExibido` (`localeCompare` com `pt-BR`) e retornar `{ temSessoesFinalizadas: true, evolucoes }` — conforme [data-model.md](./data-model.md) "Fluxo de leitura" passos 1-3, 5-7 (research.md, Decisões 1, 7, 8, 9, 12). **Nota**: nesta task, o universo de grupos vem apenas das sessões (ainda não do passo 4 do data-model.md, que exige também os exercícios de treinos sem nenhum registro — isso é escopo de US3, T010).
- [X] T006 [US1] Reescrever `src/app/(tabs)/explore.tsx`: remover todo o conteúdo boilerplate do template Expo (textos de exemplo, `ExternalLink`s de documentação, `Image`s de tutorial), mantendo apenas os imports que continuam necessários (`Collapsible` de `@/components/ui/collapsible`, `ThemedText`, `ThemedView`, `Spacing`/`MaxContentWidth`/`BottomTabInset` de `@/constants/theme`, mesma estrutura de `ScrollView`/`SafeAreaView` já usada nas demais telas do app). Importar `usePerfilAtivo` (`@/hooks/use-perfil-ativo`) e `obterHistoricoPorPerfil` (T005). Adicionar `const [historico, setHistorico] = useState<HistoricoPerfil | null>(null)` (`null` = carregando) e uma função `recarregarHistorico` que chama `obterHistoricoPorPerfil(perfilAtivo.id)` quando `perfilAtivo` existir. Chamar `recarregarHistorico` em um `useEffect` dependente de `perfilAtivo?.id`, mesmo padrão de `src/app/(tabs)/index.tsx` (RF02). Renderizar "Carregando..." enquanto `historico === null` — conforme [contracts/historico-evolucao.md](./contracts/historico-evolucao.md) "Reescrita de explore.tsx". **Ajuste durante a implementação**: eslint acusou `react-hooks/set-state-in-effect` no `useEffect` de carregamento (mesmo lint já suprimido no RF07); suprimido com `eslint-disable-next-line` no ponto exato da chamada.
- [X] T007 [US1] Em `src/app/(tabs)/explore.tsx`, quando `historico?.temSessoesFinalizadas === true`, renderizar `historico.evolucoes.map(...)`, um `Collapsible` por item (`title={evolucao.nomeExibido}`), contendo dentro dele uma linha por `registro` de `evolucao.registros` mostrando `new Date(registro.data).toLocaleString()`, `${registro.cargaKg}kg` e `${registro.reps} reps` (mesmo padrão de formatação de data já usado por `formatarDataHora` em `src/components/treino/treino-list-item.tsx`). Quando `historico?.temSessoesFinalizadas === false`, renderizar uma mensagem simples de estado vazio (`ThemedView type="backgroundElement"` + `ThemedText`, mesmo padrão visual de "Nenhum treino importado ainda" em `(tabs)/index.tsx`) indicando que ainda não há nenhum registro — conforme FR-010; spec.md, User Story 3, Acceptance Scenario 1. **Nota**: a mensagem por exercício sem registros (`registros.length === 0`, FR-009) ainda não se aplica nesta task, pois nenhum grupo pode existir sem registros até T010 (US3) introduzir o universo de exercícios vindo dos treinos.

**Checkpoint**: A aba "Explore" exibe corretamente a evolução de qualquer exercício já registrado em pelo menos uma sessão finalizada, já unificando treinos diferentes com o mesmo nome — User Story 1 completa e testável de forma independente.

---

## Phase 4: User Story 2 - Unificar o mesmo exercício vindo de treinos diferentes (Priority: P1)

**Goal**: Confirmar que a normalização/agrupamento já implementada em US1 (T005)
satisfaz integralmente esta user story — execuções do mesmo exercício em treinos
diferentes (com pequenas variações de grafia) aparecem juntas, e exercícios com
nomes genuinamente diferentes nunca são unificados.

**Independent Test**: Importar dois treinos com um exercício de mesmo nome (grafias
levemente diferentes), finalizar uma sessão de cada, e confirmar no histórico que
aparecem como uma única evolução; confirmar que exercícios com nomes diferentes
(ex.: "Rosca direta" vs. "Rosca direta com barra") permanecem separados
(quickstart.md, Cenário 2).

### Implementation for User Story 2

- [X] T008 [US2] Confirmar, por inspeção do código de `obterHistoricoPorPerfil` (T005) e de `normalizarNomeExercicio` (T003), que a chave de agrupamento é calculada a partir do nome resolvido de cada exercício (nunca do `exercicioId`), e que dois nomes só caem na mesma chave quando diferem exclusivamente por espaços (início/fim/múltiplos internos) ou por caixa — nunca por acentuação, pontuação ou palavras adicionais — conforme spec.md, User Story 2, Acceptance Scenarios 1-3 e FR-005/FR-006. Nenhuma alteração de código é esperada nesta task; caso a inspeção revele um desvio da regra, corrigir T005/T003 antes de prosseguir. Confirmado — `chave = normalizarNomeExercicio(exercicio.nome)`, nunca `exercicioId`.
- [ ] T009 [US2] Validar manualmente, nos dois aparelhos-alvo (Redmi Note 12 e iPhone 16 Plus), o cenário 2 completo de [quickstart.md](./quickstart.md): dois treinos com o mesmo exercício em grafias diferentes unificados em uma única seção; um par de exercícios com nomes parecidos mas diferentes permanecendo em seções separadas. **Pendente do usuário nos aparelhos reais.** Evidência substituta via `expo start --web` + Chromium headless nesta sessão, em duas rodadas: (1) treino de exemplo importado duas vezes (dois `Treino.id`, mesmo exercício "Supino reto (barra)") — unificado corretamente; (2) usando os fixtures reais em `docs/exemplos/` (`treino-historico-a.json` com "Supino Reto", `treino-historico-b.json` com "supino  reto"), importados via o fluxo real de "Importar treino" (seletor de arquivo do navegador, não o botão de exemplo) — unificados em uma única seção rotulada `"supino  reto"` (grafia do registro mais recente, confirmando research.md Decisão 8 na prática), com os dois registros (40kg×10 e 45kg×8) presentes; `"Rosca direta"` (Treino A) e `"Rosca direta com barra"` (Treino B) confirmados como seções **separadas**. Screenshots em `/tmp/pw-shapefit/fixtures-2-supino-expandido.png` (não versionado). **Android: ✅ confirmado pelo usuário** em dispositivo real (Redmi Note 12), usando os mesmos fixtures de `docs/exemplos/`. **iOS: pendente.**

**Checkpoint**: A unificação entre treinos diferentes está confirmada nos dois aparelhos — User Stories 1 e 2 funcionam juntas e de forma independente.

---

## Phase 5: User Story 3 - Indicação clara quando um exercício nunca foi registrado (Priority: P2)

**Goal**: Todo exercício que existe em algum treino do perfil aparece na aba
"Explore" — mesmo sem nenhum registro ainda —, mostrando uma mensagem explícita de
"sem registros" nesse caso, distinta da mensagem de tela inteira já implementada em
US1 para quando o perfil não tem nenhuma sessão finalizada.

**Independent Test**: Com sessões finalizadas de alguns exercícios mas não de um
específico (existente em algum treino do perfil), abrir a aba "Explore" e confirmar
que esse exercício aparece na lista com uma mensagem clara de "sem registros"
(quickstart.md, Cenário 4); com um perfil sem nenhuma sessão finalizada, confirmar a
mensagem de tela inteira (quickstart.md, Cenário 3).

### Implementation for User Story 3

- [X] T010 [US3] Em `src/services/historico-evolucao.ts`, estender `obterHistoricoPorPerfil` (T005) para também construir o universo de grupos a partir de **todos** os exercícios de **todos** os treinos do perfil (`listarTreinos`, já chamado em T005): para cada `Treino` → cada `ExercicioPlanejado`, calcular `chave = normalizarNomeExercicio(exercicio.nome)` e garantir uma entrada no mapa de grupos com `nomeFallback: exercicio.nome` mesmo que nenhuma sessão tenha registrado esse exercício ainda. Ao montar `EvolucaoExercicio[]` no passo final, usar `nomeFallback` como `nomeExibido` para qualquer grupo cujos `registros` continuem vazios após processar as sessões — conforme [data-model.md](./data-model.md) "Fluxo de leitura" passo 4 (research.md, Decisões 5 e 8).
- [X] T011 [US3] Em `src/app/(tabs)/explore.tsx`, dentro de cada `Collapsible` (T007), quando `evolucao.registros.length === 0`, renderizar uma mensagem explícita ("Nenhum registro para este exercício ainda", ou texto equivalente) em vez de uma lista vazia sem contexto — conforme FR-009; spec.md, User Story 3, Acceptance Scenario 2. Revisar também a mensagem de tela inteira já implementada em T007 (`temSessoesFinalizadas: false`), confirmando que seu texto deixa claro que a ausência é de sessões finalizadas (não de exercícios/treinos), distinguindo-a da mensagem por exercício desta task. Já implementado como parte de T006/T007 (as duas mensagens foram escritas juntas desde o início); confirmado por revisão que os textos são distintos e claros.
- [ ] T012 [US3] Validar manualmente, nos dois aparelhos-alvo, os Cenários 3 e 4 de [quickstart.md](./quickstart.md): perfil sem nenhuma sessão finalizada mostrando a mensagem de tela inteira; exercício existente em um treino mas nunca executado aparecendo com sua própria mensagem de "sem registros", junto aos demais exercícios que já têm histórico. **Pendente do usuário nos aparelhos reais.** Evidência substituta via web nesta sessão: (Cenário 4) exercício "Crucifixo na máquina" nunca executado mostrou "Nenhum registro para este exercício ainda." ao lado de "Supino reto (barra)" com registros reais (`/tmp/pw-shapefit/rf08-3-exercicio-sem-registro.png`); (Cenário 3) perfil novo sem nenhuma sessão finalizada mostrou a mensagem de tela inteira "Nenhum registro de treino finalizado ainda" (`/tmp/pw-shapefit/rf08-5-perfil2-vazio.png`) — nenhum arquivo versionado. **Android: ✅ confirmado pelo usuário** em dispositivo real (Redmi Note 12): perfil novo sem histórico e exercícios novos sem histórico, ambos coerentes. **iOS: pendente.**

**Checkpoint**: Todo exercício do perfil é visível na aba "Explore", com ou sem histórico, cada estado vazio comunicado claramente — User Stories 1-3 funcionam em conjunto e de forma independente.

---

## Phase 6: User Story 4 - Histórico restrito e atualizado pelo perfil ativo (Priority: P2)

**Goal**: O histórico exibido reflete exclusivamente o perfil ativo, e se atualiza
imediatamente ao trocar de perfil ou ao voltar para a aba após finalizar uma sessão
em outra tela — sem exigir fechar/reabrir o app.

**Independent Test**: Com dois perfis distintos, cada um com sessões finalizadas do
mesmo exercício, confirmar que a aba "Explore" mostra apenas os dados do perfil ativo
e que trocar de perfil atualiza a tela imediatamente (quickstart.md, Cenário 5).

### Implementation for User Story 4

- [X] T013 [US4] Em `src/app/(tabs)/explore.tsx`, adicionar `useFocusEffect(useCallback(() => { recarregarHistorico(); }, [perfilAtivo?.id]))` (importado de `expo-router`/`react`, mesmo padrão já usado em `src/app/(tabs)/index.tsx` para recarregar treinos/contagens ao ganhar foco), garantindo que o histórico seja atualizado tanto ao trocar de perfil ativo (RF10) quanto ao voltar de finalizar uma sessão em `[treinoId].tsx`, sem exigir fechar/reabrir o app — conforme research.md, Decisão 11; FR-012.
- [ ] T014 [US4] Validar manualmente, nos dois aparelhos-alvo, o Cenário 5 de [quickstart.md](./quickstart.md): histórico exibido restrito ao perfil ativo; ao trocar de perfil (RF10), a aba "Explore" passa a refletir imediatamente apenas os dados do novo perfil ativo, sem nenhum registro residual do perfil anterior. **Pendente do usuário nos aparelhos reais.** Evidência substituta via web nesta sessão: Perfil 1 com histórico de "Supino reto (barra)"; criado e ativado Perfil 2 (sem sessões) — Explore mostrou a mensagem de tela inteira, **sem nenhum vestígio do Perfil 1** ("Supino reto" ausente do texto da página); voltando ao Perfil 1, o histórico reapareceu imediatamente, sem fechar/reabrir o app. **Android: ✅ confirmado pelo usuário** em dispositivo real (Redmi Note 12): troca de perfis sem misturar os treinos/históricos importados para teste. **iOS: pendente.**

**Checkpoint**: Todas as quatro user stories funcionam de forma independente e em conjunto — RF08 funcionalmente completo.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validação final cobrindo o edge case defensivo (FR-013/FR-014) e as
verificações de qualidade que atravessam toda a feature.

- [X] T015 [P] Validar manualmente (ou por inspeção, se não houver ferramenta de debug para adulterar o `AsyncStorage` disponível) o edge case de registro não resolvível (spec.md, Edge Cases; quickstart.md, Cenário 6): confirmar que um registro cujo `treinoId`/`exercicioId` não resolve é omitido da UI sem quebrar a exibição dos demais, e que um `console.warn` identificando `perfilId`/`treinoId`/`exercicioId`/`sessaoId` aparece no console de desenvolvimento (FR-013/FR-014, implementado em T005). Validado via web: `treinoId` de uma sessão finalizada adulterado diretamente no `localStorage`; app recarregado — os demais 4 exercícios do treino continuaram exibidos normalmente (`Supino reto (barra)` voltou a aparecer sem registros, já que sua única série estava na sessão adulterada), nenhum erro de página, e o console emitiu `[historico-evolucao] Treino não encontrado ao montar histórico — perfilId=... treinoId=treino-inexistente-adulterado sessaoId=...`, identificando corretamente os três IDs pedidos por FR-014.
- [X] T016 [P] Rodar `npx tsc --noEmit` confirmando ausência de erros de tipo em todos os arquivos tocados por esta feature (`historico-evolucao.ts`, `historico.ts`, `normalizar-nome-exercicio.ts`, `sessao-treino-storage.ts`, `explore.tsx`), conforme Princípio I da Constituição. Executado — sem erros.
- [X] T017 [P] Rodar `npx eslint` nos mesmos arquivos tocados por esta feature, confirmando ausência de erros de lint. Executado (arquivos da feature + `npx eslint .` completo) — sem erros nos arquivos tocados; os 2 achados remanescentes (`use-color-scheme.web.ts`, `.expo/types/router.d.ts`) são pré-existentes, não relacionados a esta feature.
- [X] T018 [P] Confirmar, por inspeção de código, que `obterHistoricoPorPerfil` e `listarSessoesFinalizadas` recebem `perfilId` explicitamente e só leem `treinos:${perfilId}`/`sessoes:${perfilId}` desse perfil, sem nenhuma consulta cruzando `perfilId` diferentes, conforme Princípio V da Constituição (NON-NEGOTIABLE). Confirmado por leitura do código final; reforçado empiricamente por T014 (troca de perfil sem vazamento de dados).
- [ ] T019 Rodar a validação completa de [quickstart.md](./quickstart.md) nos dois aparelhos-alvo (Redmi Note 12/Android e iPhone 16 Plus/iOS), conforme Constituição Princípio III, cobrindo todos os 6 cenários de ponta a ponta antes de considerar o RF08 concluído. **Android: ✅ concluído** — usuário confirmou os cenários 1, 2, 3, 4 e 5 (perfil novo sem histórico, exercícios novos sem histórico, troca de perfis sem misturar treinos importados para o teste) em dispositivo real, coerente com o esperado. **iOS: pendente** — falta gerar o development build para o iPhone 16 Plus (`eas build --profile development --platform ios`) e repetir a mesma bateria de cenários.

---

## Phase 8: Ajuste de UX pós-validação manual (não solicitado no plano original — feedback do usuário ao validar em dispositivo real)

**Purpose**: Ao validar o RF08 já funcionando no Android (T009/T012/T014), o usuário
questionou por que a aba do histórico continuava rotulada "Explore" — nome de
boilerplate do template Expo, sem relação com a funcionalidade. Investigação revelou
que a suposição original desta spec (manter "Explore", citando o RF02 como
precedente para não renomear "Home") estava malfundamentada — ver
[research.md](./research.md), Decisão 13.

- [X] T020 Em `src/components/app-tabs.tsx` (`NativeTabs.Trigger.Label`, nativo) e `src/components/app-tabs.web.tsx` (texto dentro de `TabButton`, web), renomear o rótulo da primeira aba de "Home" para "Treinos" e o da segunda de "Explore" para "Histórico", conforme [research.md](./research.md) "Decisão 13". Confirmado, por busca em todo `src/`, que nenhuma outra referência a "Home"/"Explore" precisava de ajuste.
- [X] T021 [P] Rodar `npx tsc --noEmit` e `npx eslint` nos dois arquivos tocados por esta fase, confirmando ausência de erros — mudança é só de texto, sem lógica nova. Executado — sem erros.
- [ ] T022 Validar manualmente, no Redmi Note 12 (e depois no iPhone 16 Plus, quando o build iOS existir), que a barra de abas agora exibe "Treinos" e "Histórico" corretamente, em ambos os temas claro/escuro. **Pendente do usuário.**

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências de código — pode começar imediatamente.
- **Foundational (Phase 2)**: Depende da conclusão do Setup — BLOQUEIA todas as user stories (tipos, normalização e `listarSessoesFinalizadas` são usados por `obterHistoricoPorPerfil`, que toda user story depende).
- **User Stories (Phase 3+)**: Todas dependem da conclusão da Fase Foundational.
  - US1 (P1) não depende de US2, US3 ou US4.
  - US2 (P1) não introduz código novo — depende de US1 (T005) já estar implementado corretamente.
  - US3 (P2) estende o mesmo serviço e a mesma tela de US1 (T005-T007) — deve ser feita depois de US1 estar funcional.
  - US4 (P2) estende a mesma tela de US1 (T006) — deve ser feita depois de US1 estar funcional; independente de US2/US3.
- **Polish (Phase 7)**: Depende de todas as user stories desejadas estarem completas.

### User Story Dependencies

- **User Story 1 (P1)**: Pode começar após a Fase Foundational (Phase 2). Sem dependência de outras stories.
- **User Story 2 (P1)**: Depende de US1 (T005) já implementado — nenhuma task de implementação própria, apenas confirmação e validação manual.
- **User Story 3 (P2)**: Depende de US1 (T005-T007) já implementado — estende o mesmo serviço (universo de exercícios) e a mesma tela (mensagens de estado vazio).
- **User Story 4 (P2)**: Depende de US1 (T006, estrutura da tela) já implementado — adiciona apenas o recarregamento por foco; independente de US2/US3.

### Dentro de cada User Story

- Serviço (`historico-evolucao.ts`) antes de conectar a tela (`explore.tsx`).
- Estrutura básica da tela (carregamento, renderização de `evolucoes`) antes de refinamentos (estados vazios, recarregamento por foco).
- Story completa (implementação + validação) antes de avançar para a próxima prioridade.

### Parallel Opportunities

- T002, T003 e T004 (Foundational) tocam três arquivos diferentes, sem dependência entre si — podem ser feitas em paralelo.
- T008 (US2, inspeção de código) pode ocorrer em paralelo a T009 (US2, validação manual), desde que T008 termine primeiro para confirmar que não há correção pendente antes de validar em dispositivo.
- Na Phase 7, T015-T018 são independentes entre si e podem ser executadas em paralelo; T019 (validação completa) roda por último, como consolidação.

---

## Parallel Example: Foundational

```bash
# T002, T003 e T004 podem ocorrer em paralelo (arquivos diferentes):
Task: "Criar tipos RegistroHistorico/EvolucaoExercicio/HistoricoPerfil em src/types/historico.ts"
Task: "Criar normalizarNomeExercicio em src/utils/normalizar-nome-exercicio.ts"
Task: "Criar listarSessoesFinalizadas em src/services/sessao-treino-storage.ts"
```

## Parallel Example: Polish

```bash
# T016-T018 (verificações independentes) podem ocorrer em paralelo:
Task: "Rodar npx tsc --noEmit"
Task: "Rodar npx eslint"
Task: "Confirmar isolamento por perfilId por inspeção de código"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup (T001).
2. Completar Phase 2: Foundational (T002-T004) — CRÍTICO, bloqueia todas as stories.
3. Completar Phase 3: User Story 1 (T005-T007).
4. **PARAR e VALIDAR**: testar User Story 1 de forma independente (quickstart.md, Cenários 1 e 2) — já entrega o valor central do requisito, incluindo a unificação entre treinos (US2 é, na prática, uma confirmação deste mesmo trabalho).
5. Só então avançar para User Story 3 (estados vazios completos) e User Story 4 (segregação/atualização por perfil).

### Incremental Delivery

1. Setup + Foundational → base pronta (tipos, normalização, leitura de sessões finalizadas).
2. User Story 1 → validar independentemente → histórico funcional e corretamente agrupado para exercícios já registrados.
3. User Story 2 → validar independentemente → unificação entre treinos confirmada (sem código novo).
4. User Story 3 → validar independentemente → todo exercício do perfil visível, com estados vazios claros.
5. User Story 4 → validar independentemente → segregação e atualização por perfil confirmadas.
6. Polish → edge case defensivo validado, type-check e lint limpos, isolamento por perfil confirmado, RF08 pronto para ser considerado concluído.

## Notes

- [P] tasks = arquivos diferentes ou validações independentes, sem dependência entre si.
- Nenhuma task introduz uma nova chave de `AsyncStorage` — toda a feature é somente leitura sobre `treinos:${perfilId}` e `sessoes:${perfilId}`, já existentes desde o RF01 e o RF04/RF07.
- A normalização/agrupamento (núcleo de US2) é implementada inteiramente dentro de T005 (US1) — não existe uma versão "sem agrupamento" de US1 que US2 viria a corrigir depois; por isso a Phase 4 (US2) contém apenas confirmação e validação, seguindo o mesmo padrão já usado por uma user story equivalente no RF07 (specs/009-salvar-sessao-treino/tasks.md, Phase 5).
- T010 (US3) e T013 (US4) modificam, respectivamente, `historico-evolucao.ts` e `explore.tsx` já criados/escritos em US1 — não são arquivos novos, então não são marcados `[P]` em relação às tasks de US1.
