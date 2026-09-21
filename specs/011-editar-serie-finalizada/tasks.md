---

description: "Task list template for feature implementation"
---

# Tasks: Editar Registro de Série de uma Sessão Já Finalizada

**Input**: Design documents from `/specs/011-editar-serie-finalizada/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Nenhum framework de testes automatizados está configurado no projeto (ver
plan.md, Technical Context → Testing). A validação desta feature é manual, em Android e
iOS via **development build** (não Expo Go, migração já em vigor desde o RF06 e
reconfirmada no PRD v1.1), conforme Constituição Princípio III — nenhuma task de teste
automatizado é gerada.

**Organization**: Tasks agrupadas pelas duas user stories da spec (US1 = P1, US2 = P1
— ambas com a mesma prioridade, ver spec.md "Why this priority" de US2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de task incompleta)
- **[Story]**: A qual user story esta task pertence (US1 ou US2)
- Caminhos de arquivo exatos incluídos em cada descrição

## Path Conventions

Projeto único (Expo Router) — `src/` na raiz do repositório, conforme plan.md:
- `src/utils/sanitizar-serie.ts` (novo)
- `src/types/historico.ts`
- `src/services/historico-evolucao.ts`
- `src/services/sessao-treino-storage.ts`
- `src/components/treino/exercicio-execucao.tsx`
- `src/app/(tabs)/explore.tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Nenhuma dependência nova é introduzida por esta feature (plan.md,
"Primary Dependencies"). O development build necessário para validação (Android e
iOS) já está estabelecido desde o RF06/RF07/RF08 — não é preciso reconfirmá-lo aqui
(PRD v1.1, seção 9).

*(Fase intencionalmente vazia — nenhuma nova dependência, ambiente ou estrutura de
projeto é introduzida, conforme research.md e Constituição Princípio IV.)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Criar os blocos que a UI de edição (US1) depende para existir: o
utilitário de sanitização compartilhado, os três campos novos de `RegistroHistorico`
(e sua projeção em `historico-evolucao.ts`), e a nova função de gravação em
`sessao-treino-storage.ts`.

**⚠️ CRITICAL**: Nenhuma task de US1/US2 pode ser validada de ponta a ponta até esta
fase estar completa (a UI pode ser escrita em paralelo às tasks de serviço, mas não
testada sem elas).

- [X] T001 [P] Criar `src/utils/sanitizar-serie.ts`, movendo `sanitizarCarga` e `sanitizarReps` de `src/components/treino/exercicio-execucao.tsx` para lá, **exportadas**, sem nenhuma alteração de corpo/comportamento — conforme [contracts/editar-registro-finalizado.md](./contracts/editar-registro-finalizado.md) "Novo utilitário" (research.md, Decisão 7).
- [X] T002 Em `src/components/treino/exercicio-execucao.tsx`, remover as definições locais de `sanitizarCarga`/`sanitizarReps` e importá-las de `@/utils/sanitizar-serie` (T001) — sem nenhuma outra alteração no arquivo; comportamento do RF09a deve permanecer idêntico.
- [X] T003 [P] Em `src/types/historico.ts`, estender `RegistroHistorico` com `sessaoId: string`, `exercicioId: string` e `serie: number`, conforme [data-model.md](./data-model.md) "Entidade estendida" (research.md, Decisão 1). `EvolucaoExercicio`/`HistoricoPerfil` permanecem inalterados.
- [X] T004 Em `src/services/historico-evolucao.ts`, estender a estrutura de trabalho interna `ItemDeTrabalho` para também carregar `sessaoId` (de `sessao.id`), `exercicioId` (de `execucao.exercicioId`) e `serie` (de `serie.serie`) no ponto em que cada item já é empurrado durante a iteração das sessões; ao converter os itens ordenados para `RegistroHistorico[]` (mapeamento final que hoje produz `{ data, cargaKg, reps }`), passar a incluir também `{ sessaoId, exercicioId, serie }` — depende de T003; nenhuma mudança no algoritmo de agrupamento/resolução de nome/ordenação já validado pelo RF08 (data-model.md, "Fluxo de leitura"; research.md, Decisão 4).
- [X] T005 [P] Em `src/services/sessao-treino-storage.ts`, adicionar `atualizarSerieDeSessaoFinalizada(params: { perfilId: string; sessaoId: string; exercicioId: string; serie: number; novaCargaKg: number; novosReps: number }): Promise<SessaoTreino>`, seguindo exatamente [contracts/editar-registro-finalizado.md](./contracts/editar-registro-finalizado.md) "Nova função em sessao-treino-storage.ts": localiza a sessão por `sessoes.find((item) => item.id === sessaoId)` (lança `Error` "Nenhuma sessão encontrada com id ${sessaoId} para o perfil ${perfilId}" se não encontrar — mesmo padrão de `finalizarSessao`); valida `sessao.finalizadaEm !== null`, lançando `Error` imediatamente caso contrário, **sem gravar nada** (sugestão de robustez do usuário; research.md Decisão 3); localiza a `ExecucaoExercicio` por `exercicioId` (lança `Error` se não encontrar); localiza a `SerieRealizada` por `serie` (lança `Error` se não encontrar); grava **apenas** `cargaKg`/`reps` da série encontrada — MUST NOT alterar `finalizadaEm`, `serie`, `status`, `treinoId`, `iniciadaEm` ou `perfilId`; persiste via `setSessoes` já existente e retorna a `SessaoTreino` atualizada.

**Checkpoint**: Utilitário de sanitização compartilhado, `RegistroHistorico` com
origem rastreável, e função de gravação para sessões finalizadas prontos — a UI de
edição (US1) já pode ser construída e testada de ponta a ponta.

---

## Phase 3: User Story 1 - Corrigir carga ou repetições de um registro de uma sessão já finalizada (Priority: P1) 🎯 MVP

**Goal**: A partir da tela de histórico (RF08), o usuário consegue tocar em qualquer
registro de uma sessão já finalizada, editar carga e/ou repetições, confirmar via
`Alert.alert`, e ver o novo valor refletido imediatamente na mesma tela.

**Independent Test**: Com pelo menos uma sessão já finalizada contendo um registro,
abrir o histórico, tocar nesse registro, tentar salvar com campo inválido (deve
bloquear), preencher valores válidos, confirmar no `Alert.alert`, e verificar que o
novo valor aparece imediatamente sem sair da aba — depois, cancelar uma segunda
tentativa de edição e confirmar que nada muda.

### Implementation for User Story 1

- [X] T006 [US1] Em `src/app/(tabs)/explore.tsx`, no componente `SecaoExercicio` (já existente, RF08), adicionar estado local de edição efêmero `useState<{ sessaoId: string; exercicioId: string; serie: number; cargaKg: string; reps: string } | null>(null)` — conforme [data-model.md](./data-model.md) "Estado de UI" (research.md, Decisão 5).
- [X] T007 [US1] Em `SecaoExercicio`, tornar cada linha de `registro` (dentro do `.map` já existente) tocável (`Pressable`); ao tocar, preencher o estado de T006 com `{ sessaoId: registro.sessaoId, exercicioId: registro.exercicioId, serie: registro.serie, cargaKg: String(registro.cargaKg), reps: String(registro.reps) }`.
- [X] T008 [US1] Em `SecaoExercicio`, quando o estado de edição (T006) não for nulo, renderizar campos `TextInput` de carga e repetições no lugar da linha de texto simples daquele registro, usando `sanitizarCarga`/`sanitizarReps` (`@/utils/sanitizar-serie`, T001) nos handlers `onChangeText` — mesmos atributos de teclado já usados pelo RF03/RF09a (`keyboardType="decimal-pad"`/`inputMode="decimal"` para carga; `keyboardType="number-pad"`/`inputMode="numeric"` para reps).
- [X] T009 [US1] Em `SecaoExercicio`, calcular `podeSalvarEdicao` (carga e reps do estado de edição ambos não vazios após `trim()` — mesma regra de `podeConcluirSerie`/`podeSalvarEdicao` do RF09a) e manter o botão "Salvar edição" desabilitado enquanto `podeSalvarEdicao` for falso, sem disparar `Alert.alert` nesse caso — conforme spec.md FR-004.
- [X] T010 [US1] Em `SecaoExercicio`, ao tocar em "Salvar edição" com `podeSalvarEdicao === true`, disparar `Alert.alert('Confirmar alteração', ...)` (mesmo padrão de texto/opções do RF09a) com "Cancelar" (fecha o alerta, estado de edição volta a `null`, nenhuma chamada de escrita) e "Salvar" (chama a prop `onEditarRegistro`, ver T011) — conforme spec.md FR-005, FR-009.
- [X] T011 [US1] Em `SecaoExercicio`, adicionar a prop `onEditarRegistro: (params: { sessaoId: string; exercicioId: string; serie: number; cargaKg: number; reps: number }) => Promise<void>`; ao confirmar no `Alert.alert` (T010), chamar `onEditarRegistro({ sessaoId, exercicioId, serie, cargaKg: Number(<carga sanitizada>), reps: Number(<reps sanitizado>) })` e, ao resolver, voltar o estado de edição (T006) para `null`.
- [X] T012 [US1] Em `HistoricoScreen` (mesmo arquivo, `explore.tsx`), importar `atualizarSerieDeSessaoFinalizada` de `@/services/sessao-treino-storage` e implementar `handleEditarRegistro`, seguindo exatamente o código em [contracts/editar-registro-finalizado.md](./contracts/editar-registro-finalizado.md) "Extensão de UI": chama a função de serviço com `perfilAtivo.id` e os parâmetros recebidos; a partir da `SessaoTreino` retornada, localiza a `SerieRealizada` atualizada (`exercicioId` + `serie`); atualiza o estado `historico` via patch pontual do registro correspondente (`sessaoId`+`exercicioId`+`serie`), sem chamar `recarregarHistorico()` novamente — conforme spec.md FR-010 (research.md, Decisão 6; alternativa aceitável documentada na mesma Decisão, caso o patch se mostre mais complexo na prática).
- [X] T013 [US1] Em `HistoricoScreen`, passar `onEditarRegistro={handleEditarRegistro}` (T012) para cada `<SecaoExercicio />` renderizado pelo `FlatList` (`renderItem`).

**Checkpoint**: Nesta altura, User Story 1 deve estar completamente funcional e
testável independentemente — editar qualquer registro de uma sessão finalizada, com
confirmação, validação e reflexo imediato na tela.

---

## Phase 4: User Story 2 - A sessão finalizada continua finalizada depois da edição (Priority: P1)

**Goal**: Confirmar que a edição implementada em US1 nunca reabre a sessão editada
como "em andamento" — garantia satisfeita por construção pela validação/escopo de
`atualizarSerieDeSessaoFinalizada` (T005), não por código adicional.

**Independent Test**: Editar um registro de uma sessão finalizada e verificar que: (a)
o contador de sessões finalizadas do treino (RF02/RF07) não muda; (b) a troca de
perfil ativo (RF10) continua permitida exatamente como antes da edição.

### Implementation for User Story 2

- [X] T014 [US2] Confirmar, por inspeção do código de `atualizarSerieDeSessaoFinalizada` (T005), que a função nunca lê nem grava `finalizadaEm` além de validá-lo como pré-condição, e que nenhum outro campo além de `cargaKg`/`reps` da série-alvo é alterado — conforme [data-model.md](./data-model.md) "Invariantes" (spec.md FR-007, FR-008). Nenhuma alteração de código é esperada nesta task; caso a inspeção revele um desvio, corrigir T005 antes de prosseguir.
- [ ] T015 [US2] Validar manualmente, em pelo menos um dos aparelhos-alvo, que: editar um registro de uma sessão finalizada **não** altera o contador de sessões finalizadas daquele treino na lista de treinos (RF02/RF07); e que a troca de perfil ativo (RF10), quando não há nenhuma sessão em andamento, continua permitida logo após a edição — conforme quickstart.md, Cenário 2.

**Checkpoint**: Ambas as user stories funcionam de forma independente e em conjunto —
RF09b funcionalmente completo.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verificações de qualidade que atravessam toda a feature e a validação
manual final nos dois aparelhos-alvo, conforme Constituição Princípio III.

- [X] T016 [P] Rodar `npx tsc --noEmit` confirmando ausência de erros de tipo em todos os arquivos tocados por esta feature (`sanitizar-serie.ts`, `exercicio-execucao.tsx`, `historico.ts`, `historico-evolucao.ts`, `sessao-treino-storage.ts`, `explore.tsx`), conforme Princípio I da Constituição.
- [X] T017 [P] Rodar `npx eslint` nos mesmos arquivos tocados por esta feature, confirmando ausência de erros de lint.
- [X] T018 [P] Confirmar, por inspeção de código, que `atualizarSerieDeSessaoFinalizada` recebe `perfilId` explicitamente e só opera sobre `sessoes:${perfilId}` desse perfil, sem nenhuma consulta cruzando `perfilId` diferentes, conforme Princípio V da Constituição (NON-NEGOTIABLE).
- [ ] T019 Rodar a validação completa de [quickstart.md](./quickstart.md) (Cenários 1-3) no Redmi Note 12 (Android), via development build.
- [ ] T020 Rodar a validação completa de [quickstart.md](./quickstart.md) (Cenários 1-3) no iPhone 16 Plus (iOS), via development build ou Expo Go — conforme esclarecido pelo usuário, o acesso via iOS está funcionando sem necessidade de development build específico para esta verificação; confirmar em qual modo o teste foi feito ao marcar esta task.
- [X] T021 [P] Ajustes pós-`/code-review`: em `src/app/(tabs)/explore.tsx`, `podeSalvarEdicao` passou a validar `Number.isFinite(Number(cargaKg/reps))`, não apenas string não-vazia — corrige o caso de digitar só "." no campo de carga (`sanitizarCarga('.')` retorna `'.'`, que passava na checagem antiga e gravava `NaN` permanentemente); o `onPress` de "Salvar" no `Alert.alert` passou a ter `try/catch`, exibindo um `Alert.alert` de erro e mantendo `edicaoAtiva` preenchido (sem perder os valores digitados) se `atualizarSerieDeSessaoFinalizada` rejeitar. Em `src/services/sessao-treino-storage.ts`, `atualizarSerieDeSessaoFinalizada` ganhou uma validação defensiva equivalente (`Number.isFinite` de `novaCargaKg`/`novosReps`, lançando erro antes de qualquer leitura/escrita) — proteção adicional no próprio serviço, não só na UI, mitigando o risco de duplicação com `atualizarSerieRealizada` apontado pelo review. `tsc`/`eslint` confirmados limpos.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Vazia — nenhuma dependência, nenhuma task.
- **Foundational (Phase 2)**: T001, T003 e T005 não dependem de nada — podem começar
  imediatamente. T002 depende de T001; T004 depende de T003. BLOQUEIA toda validação
  de ponta a ponta de US1/US2 (a UI pode ser escrita em paralelo às tasks de serviço,
  mas não testada sem elas).
- **User Stories (Phase 3-4)**: Dependem da Fase Foundational completa. US1 (T006-T013)
  não depende de US2. US2 (T014-T015) depende de US1 já estar implementada, pois
  valida um comportamento que só existe depois que a UI de edição (US1) chama
  `atualizarSerieDeSessaoFinalizada` de verdade.
- **Polish (Phase 5)**: Depende de US1 e US2 completas.

### User Story Dependencies

- **User Story 1 (P1)**: Depende apenas da Fase Foundational. Sem dependência de US2.
- **User Story 2 (P1)**: Depende da Fase Foundational **e** de US1 já implementada —
  não introduz código novo, apenas confirma (por inspeção e validação manual) uma
  garantia que a implementação de T005 (Foundational) e a UI de T006-T013 (US1) já
  satisfazem por construção.

### Within Each User Story

- T006 (estado local) antes de T007 (usa o estado); T007 antes de T008 (renderiza
  campos quando há edição ativa); T008 antes de T009 (calcula a partir dos campos);
  T009 antes de T010 (só dispara `Alert.alert` se puder salvar); T011 (prop) depende
  de T010 (chamada no `onPress` de "Salvar"); T012 pode ser feita em paralelo a
  T006-T011 (mesmo arquivo, mas funções/handlers independentes até T013 conectar os
  dois); T013 depende de T011 e T012.
- T014/T015 (US2) dependem de T005 (Foundational) e de US1 (T006-T013) já existirem —
  não há o que inspecionar/validar sem a UI de edição funcionando de ponta a ponta.

### Parallel Opportunities

- T001, T003 e T005 (Foundational) tocam três arquivos diferentes, sem dependência
  entre si — podem ser feitas em paralelo.
- Na Phase 5, T016-T018 são independentes entre si e podem ser executadas em
  paralelo; T019/T020 (validação manual por aparelho) podem ocorrer em paralelo entre
  si, mas dependem de T016-T018 já terem passado.

---

## Parallel Example: Foundational

```bash
# T001, T003 e T005 podem ocorrer em paralelo (arquivos diferentes):
Task: "Extrair sanitizarCarga/sanitizarReps para src/utils/sanitizar-serie.ts"
Task: "Estender RegistroHistorico em src/types/historico.ts"
Task: "Adicionar atualizarSerieDeSessaoFinalizada em src/services/sessao-treino-storage.ts"
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

1. Completar Phase 2: Foundational (T001-T005) — CRÍTICO, bloqueia todas as stories.
2. Completar Phase 3: User Story 1 (T006-T013).
3. **PARAR e VALIDAR**: testar User Story 1 de forma independente (quickstart.md,
   Cenário 1) — já entrega o valor central do requisito (corrigir um erro de
   digitação em um registro do passado, lacuna deixada pelo RF09a).
4. Só então avançar para User Story 2 (confirmação da garantia de não-reabertura).

### Incremental Delivery

1. Foundational (T001-T005) → base pronta (utilitário compartilhado, tipo estendido,
   função de gravação).
2. User Story 1 (T006-T013) → validar independentemente → edição funcional, refletida
   imediatamente na tela.
3. User Story 2 (T014-T015) → validar independentemente → garantia de não-reabertura
   confirmada.
4. Polish (T016-T020) → type-check e lint limpos, isolamento por perfil confirmado,
   validação completa em Android + iOS, RF09b pronto para ser considerado concluído.

## Notes

- [P] tasks = arquivos diferentes, sem dependência entre si.
- Nenhuma task introduz uma nova chave de `AsyncStorage`, um novo tipo de dado
  independente, ou uma nova rota — toda a feature estende arquivos e tipos já
  existentes do RF04/RF07/RF08/RF09a (plan.md, Constituição Princípio II).
- T005 lançar erro para sessão/execução/série não encontrada — ou para sessão ainda
  em andamento — não deve receber nenhum tratamento de fallback silencioso; esse é o
  comportamento pretendido (research.md, Decisão 3), consistente com o mesmo padrão
  de erro já usado por `marcarExercicioConcluido`/`atualizarSerieRealizada`.
- T020 registra explicitamente a observação do usuário de que o acesso via iOS está
  funcionando sem depender de um novo development build específico para esta feature
  — diferente do Android, onde o development build já é obrigatório desde o RF06.
