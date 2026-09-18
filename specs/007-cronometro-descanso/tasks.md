---

description: "Task list template for feature implementation"
---

# Tasks: Cronômetro de Descanso

**Input**: Design documents from `/specs/007-cronometro-descanso/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cronometro-descanso.md, quickstart.md

**Tests**: Não solicitados explicitamente na spec nem pelo usuário — o projeto não tem
framework de testes automatizados configurado (Constituição, Princípio III: validação é
manual em Android/iOS). Nenhuma task de teste automatizado é gerada; a validação final usa
quickstart.md.

**Organization**: Tasks agrupadas por user story (spec.md) para permitir implementação e
teste independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência entre si)
- **[Story]**: A qual user story esta task pertence (US1, US2, US3)
- Caminhos de arquivo exatos nas descrições

## Path Conventions

Projeto único (Expo Router) — `src/app`, `src/components`, `src/utils`, `src/types` na
raiz do repositório, conforme plan.md.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Nenhuma inicialização de projeto é necessária — reaproveita a estrutura já
existente do RF01-RF04 (nenhuma dependência nova, ver research.md). Fase reduzida a
garantir que os tipos e a função utilitária de base existam antes de qualquer story.

- [X] T001 Adicionar o tipo `DescansoAtivo` em `src/types/execucao-treino.ts`, conforme
      data-model.md: `export type DescansoAtivo = { exercicioId: string; fimEm: number } | null;`
- [X] T002 [P] Criar `src/utils/cronometro-descanso.ts` com as três funções puras definidas
      em data-model.md: `calcularSegundosRestantes(fimEm: number, agora: number = Date.now()): number`
      (retorna `Math.max(0, Math.ceil((fimEm - agora) / 1000))`), `ajustarFimEm(fimEm: number, deltaSegundos: number): number`
      (retorna `fimEm + deltaSegundos * 1000`), e `formatarTempo(segundos: number): string`
      (formato `mm:ss`, ex.: 90 → "01:30")

**Checkpoint**: Tipos e função de cálculo prontos — nenhuma user story depende de mais nada
além disso para começar.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Nenhuma infraestrutura bloqueante adicional é necessária além da Phase 1 —
não há banco de dados, autenticação ou roteamento novo a configurar (feature é puramente
em memória, sem persistência, conforme Assumptions da spec e Technical Context do plan.md).
Esta fase é intencionalmente vazia; a Phase 1 já cobre o que seria "foundational" aqui.

**Checkpoint**: Nenhum bloqueio adicional — a implementação das user stories pode começar
assim que a Phase 1 estiver concluída.

---

## Phase 3: User Story 1 - Cronômetro inicia automaticamente e conta corretamente (Priority: P1) 🎯 MVP

**Goal**: Ao concluir uma série, o cronômetro aparece e conta corretamente a partir do
`descansoSeg` do exercício, até chegar a zero e disparar o evento de conclusão.

**Independent Test**: Concluir uma série em qualquer exercício e observar que o cronômetro
aparece contando a partir do tempo de descanso configurado no treino, decrescendo segundo a
segundo até chegar a zero e parar (spec.md, US1).

### Implementation for User Story 1

- [X] T003 [US1] Em `src/components/treino/exercicio-execucao.tsx`, alterar a assinatura da
      prop `onIniciarDescanso?: () => void` para `onIniciarDescanso?: (info: { exercicioId: string; descansoSeg: number }) => void`
      (contracts/cronometro-descanso.md), sem mudar sua posição de declaração no `type
      ExercicioExecucaoProps`
- [X] T004 [US1] Em `src/components/treino/exercicio-execucao.tsx`, dentro de
      `handleConcluirSerie`, alterar a chamada `onIniciarDescanso?.()` para
      `onIniciarDescanso?.({ exercicioId: exercicio.id, descansoSeg: exercicio.descansoSeg })`
      — único ponto alterado no fluxo já existente do RF04; não mover nem duplicar a chamada
      (depende de T003)
- [X] T005 [P] [US1] Criar `src/components/treino/cronometro-descanso.tsx`: componente
      controlado, sem estado próprio, com props `{ segundosRestantes: number; onMais15: () => void; onMenos15: () => void }`
      (contracts/cronometro-descanso.md); renderiza o tempo formatado via
      `formatarTempo(segundosRestantes)` (T002) e dois controles/botões "+15s" e "-15s" que
      chamam `onMais15`/`onMenos15` (depende de T002)
- [X] T006 [US1] Em `src/app/treino/[treinoId].tsx`, adicionar o estado
      `const [descansoAtivo, setDescansoAtivo] = useState<DescansoAtivo>(null)` (import do
      tipo de T001), como um `useState` irmão de `estadosPorExercicio` (research.md, Decisão 2)
      (depende de T001)
- [X] T007 [US1] Em `src/app/treino/[treinoId].tsx`, implementar
      `handleIniciarDescanso({ exercicioId, descansoSeg })`: se `descansoSeg` for ausente,
      `0` ou não numérico, chamar `handleDescansoConcluido()` (T009) imediatamente sem criar
      `descansoAtivo` (FR-010); caso contrário, definir
      `setDescansoAtivo({ exercicioId, fimEm: Date.now() + descansoSeg * 1000 })`,
      substituindo integralmente qualquer `descansoAtivo` anterior ainda ativo (FR-011,
      data-model.md regra de transição 2) (depende de T006)
- [X] T008 [US1] Em `src/app/treino/[treinoId].tsx`, passar
      `onIniciarDescanso={handleIniciarDescanso}` para `<ExercicioExecucao>`, substituindo
      qualquer passagem anterior da prop (depende de T004, T007)
- [X] T009 [US1] Em `src/app/treino/[treinoId].tsx`, implementar
      `handleDescansoConcluido()`: define `setDescansoAtivo(null)` — nesta feature, sem
      nenhum efeito adicional além de limpar o estado (o callback `onDescansoConcluido`
      externo, se necessário para o RF06, é apenas invocado aqui sem lógica própria; ver
      T013) (depende de T006)
- [X] T010 [US1] Em `src/app/treino/[treinoId].tsx`, adicionar um `useEffect` que, enquanto
      `descansoAtivo !== null`, registra um `setInterval` de 1000ms cuja única
      responsabilidade é forçar re-render (ex.: `setTick((t) => t + 1)` em um `useState`
      auxiliar `tick`) — nunca decrementar um contador de tempo diretamente (research.md,
      Decisão 3); limpar o interval no cleanup do efeito e quando `descansoAtivo` voltar a
      `null` (depende de T006)
- [X] T011 [US1] Em `src/app/treino/[treinoId].tsx`, calcular
      `segundosRestantes = descansoAtivo ? calcularSegundosRestantes(descansoAtivo.fimEm) : 0`
      no corpo da função do componente (puro, sem `setState`, a cada render), usando a
      função de T002. A checagem `segundosRestantes === 0 → handleDescansoConcluido()`
      (T009) MUST viver em um `useEffect` separado, com `[descansoAtivo, tick]` (o mesmo
      `tick` de T010) como array de dependências — NUNCA inline no corpo da função do
      componente durante o render. Dentro desse efeito, reconfirmar
      `descansoAtivo !== null && segundosRestantes === 0` antes de chamar
      `handleDescansoConcluido()`, para não disparar após o próprio efeito já ter limpado
      `descansoAtivo` na execução anterior. Motivo: chamar `setState` (via
      `handleDescansoConcluido` → `setDescansoAtivo(null)`) diretamente no corpo do
      componente durante o render é uma violação das regras do React (efeito colateral
      durante a fase de render) e não garante execução exatamente uma vez por transição —
      o `useEffect` com essas dependências é o que garante que a chamada só aconteça quando
      `segundosRestantes` de fato cruza para 0 em relação ao render anterior, satisfazendo
      FR-009/SC-004 (depende de
      T002, T009, T010)
- [X] T012 [US1] Em `src/app/treino/[treinoId].tsx`, renderizar
      `<CronometroDescanso segundosRestantes={segundosRestantes} onMais15={...} onMenos15={...} />`
      (T005) condicionado a `descansoAtivo !== null`, na área da tela de execução (fora do
      JSX de `ExercicioExecucao`, conforme research.md Decisão 5 e contracts/cronometro-descanso.md)
      (depende de T005, T011)

**Checkpoint**: Neste ponto, concluir uma série já dispara um cronômetro visível que conta
corretamente até zero — User Story 1 completa e testável de forma independente
(quickstart.md, Cenário 1).

---

## Phase 4: User Story 2 - Ajuste manual do tempo restante (Priority: P2)

**Goal**: Permitir ao usuário adicionar/remover 15 segundos do tempo restante a qualquer
momento durante a contagem, quantas vezes quiser.

**Independent Test**: Com o cronômetro em contagem, tocar no controle de "+15s" várias vezes
seguidas e verificar que o tempo restante aumenta 15 segundos a cada toque; tocar em "-15s"
e verificar a redução equivalente (spec.md, US2).

### Implementation for User Story 2

- [X] T013 [US2] Em `src/app/treino/[treinoId].tsx`, implementar `handleAjustarDescanso(deltaSegundos: number)`:
      se `descansoAtivo === null`, não faz nada; caso contrário, calcula
      `novoFimEm = ajustarFimEm(descansoAtivo.fimEm, deltaSegundos)` (T002) e atualiza
      `setDescansoAtivo({ ...descansoAtivo, fimEm: novoFimEm })` — sem limite máximo superior
      para incrementos positivos (FR-004); para decrementos, se
      `calcularSegundosRestantes(novoFimEm) <= 0`, chamar `handleDescansoConcluido()` (T009)
      em vez de manter `descansoAtivo` com `fimEm` no passado (FR-005, data-model.md regra de
      transição 4) (depende de T002, T009, T011)
- [X] T014 [US2] Em `src/app/treino/[treinoId].tsx`, conectar os callbacks
      `onMais15={() => handleAjustarDescanso(15)}` e `onMenos15={() => handleAjustarDescanso(-15)}`
      na renderização de `<CronometroDescanso>` (T012), substituindo os placeholders `...`
      (depende de T012, T013)

**Checkpoint**: Neste ponto, User Stories 1 E 2 funcionam de forma independente — o usuário
consegue ajustar o tempo restante em qualquer momento (quickstart.md, Cenário 2).

---

## Phase 5: User Story 3 - Cronômetro sobrevive a navegação e a segundo plano (Priority: P1)

**Goal**: O tempo restante exibido reflete corretamente o tempo real decorrido após navegar
para a lista de exercícios da mesma rota e após o app ser minimizado/reaberto — nunca fica
"parado" no valor de antes.

**Independent Test**: Iniciar o cronômetro, navegar para a lista de exercícios (dentro da
mesma rota `[treinoId]`), esperar um intervalo conhecido, voltar e conferir que o tempo
restante caiu o valor decorrido; repetir minimizando o app em vez de navegar internamente
(spec.md, US3; quickstart.md, Cenários 3 e 4).

> **Nota de escopo**: o Acceptance Scenario 1 da US3 ("navegar para a tela de histórico")
> não é implementável nesta feature — depende de uma decisão de arquitetura de navegação
> ainda não tomada (ver spec.md Assumptions, research.md Decisão 2, quickstart.md Cenário
> 3b). As tasks abaixo cobrem apenas o que é estruturalmente possível hoje: navegação
> lista↔exercício dentro da própria rota, e background/foreground do app.

### Implementation for User Story 3

- [X] T015 [US3] Confirmar que a task T010 (tick de `setInterval` na rota `[treinoId].tsx`,
      não em `ExercicioExecucao`) e a task T006 (estado `descansoAtivo` na rota) já
      garantem, por si só, a sobrevivência do cronômetro à navegação entre a lista de
      exercícios e um exercício selecionado dentro da mesma rota (`exercicioSelecionadoId`
      alternando entre um id e `null` não desmonta `[treinoId].tsx`, logo não afeta
      `descansoAtivo`) — nenhum código novo é necessário para este sub-requisito; esta task
      é apenas o ponto de validação manual correspondente (quickstart.md, Cenário 3), a ser
      executado após T001-T012 (depende de T006, T010)
- [X] T016 [US3] Em `src/app/treino/[treinoId].tsx`, importar `AppState` de `react-native` e
      adicionar um segundo `useEffect` (independente do tick de T010) que assina
      `AppState.addEventListener('change', handler)`; o `handler` verifica se o novo estado
      é `'active'` e o estado anterior era `'background'` ou `'inactive'`, e nesse caso força
      imediatamente o mesmo recálculo de `segundosRestantes` usado pelo tick (por exemplo,
      incrementando o mesmo `tick` auxiliar de T010, ou chamando a mesma função de
      recálculo) — sem esperar o próximo intervalo de 1s (research.md, Decisão 3); remover o
      listener no cleanup do efeito (depende de T006, T010, T011)
- [X] T017 [US3] Verificar que, ao reabrir o app após um tempo em segundo plano maior que o
      `descansoAtivo.fimEm` restante, o recálculo de T016 já produz `segundosRestantes === 0`
      corretamente (via `calcularSegundosRestantes`, T002, que usa `Math.max(0, ...)`) e que
      o mesmo caminho de conclusão de T011 (`handleDescansoConcluido`, T009) é acionado sem
      exigir lógica adicional — task de validação/ajuste fino caso o teste manual
      (quickstart.md, Cenário 4, passo 4) revele que o evento de conclusão não dispara
      exatamente uma vez nesse caso limite (depende de T009, T011, T016)

**Checkpoint**: Todas as user stories agora funcionam de forma independente, dentro do que é
estruturalmente possível na arquitetura de rotas atual (ver Nota de escopo acima).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final e checagem de aderência à Constituição.

- [X] T018 Rodar `npm run start` (ou `npm run android` / `npm run ios`) e executar
      manualmente todos os cenários de `specs/007-cronometro-descanso/quickstart.md` em um
      dispositivo Android e um dispositivo iOS (Constituição, Princípio III), incluindo o
      Cenário 3b (confirmar que ele permanece corretamente marcado como não testável, sem
      tentar contorná-lo)
- [X] T019 [P] Revisar `src/app/treino/[treinoId].tsx` e `src/components/treino/exercicio-execucao.tsx`
      confirmando ausência de `any` implícito e type-check limpo (`npx tsc --noEmit` ou
      equivalente do projeto), conforme Constituição Princípio I
- [X] T020 [P] Confirmar que nenhuma dependência nova foi adicionada a `package.json` nesta
      feature (Constituição Princípio IV) — `AppState` é nativo do React Native já em uso
- [X] T021 [US1] Adicionado após feedback de uso (mesmo dia da validação manual, FR-014):
      em `src/components/treino/exercicio-execucao.tsx`, nova prop `emDescanso?: boolean`
      (default `false`); quando `true`, oculta a área de carga/repetições e o botão
      "Concluir série" da próxima série, exibindo em seu lugar um indicativo textual
      ("Próxima: série X de Y — aguarde o fim do descanso") e as séries já concluídas. Em
      `src/app/treino/[treinoId].tsx`, conectar
      `emDescanso={descansoAtivo?.exercicioId === exercicioSelecionado.id}` na renderização
      de `<ExercicioExecucao>` — sem introduzir um botão separado de "pular descanso" (o
      ajuste "-15s" já existente continua sendo o único caminho para isso)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: Vazia nesta feature — nenhum bloqueio adicional além do Setup
- **User Story 1 (Phase 3)**: Depende da Phase 1 (T001, T002)
- **User Story 2 (Phase 4)**: Depende da Phase 3 completa (reutiliza `descansoAtivo`,
  `handleDescansoConcluido` e a renderização de `<CronometroDescanso>` já conectados em T012)
- **User Story 3 (Phase 5)**: Depende da Phase 3 completa (T006, T009, T010, T011 já
  existentes); independente da Phase 4 (não usa `handleAjustarDescanso`)
- **Polish (Phase 6)**: Depende de todas as user stories desejadas estarem completas

### User Story Dependencies

- **User Story 1 (P1)**: Nenhuma dependência de outra story — é o MVP
- **User Story 2 (P2)**: Depende tecnicamente de US1 estar implementada (o botão +/-15s só
  faz sentido com o cronômetro já existindo), mas é uma extensão aditiva sobre os mesmos
  arquivos — não introduz novos arquivos
- **User Story 3 (P1)**: Depende tecnicamente de US1 (o mesmo estado `descansoAtivo` e tick);
  não depende de US2

### Within Each User Story

- Tipos/utilitários (T001, T002) antes de qualquer uso
- Alteração de assinatura/chamada em `exercicio-execucao.tsx` (T003, T004) antes de a rota
  passar o novo callback (T008)
- Estado na rota (T006) antes de qualquer handler que o utilize (T007, T009, T010, T013)
- Handlers da rota antes da renderização condicional que os consome (T012, T014)

### Parallel Opportunities

- T001 e T002 podem rodar em paralelo (arquivos diferentes: `types/execucao-treino.ts` vs.
  `utils/cronometro-descanso.ts`)
- T005 pode rodar em paralelo a T003/T004/T006 (arquivo novo, `cronometro-descanso.tsx`,
  sem dependência de estado da rota até ser conectado em T012)
- T019 e T020 (Polish) podem rodar em paralelo entre si

---

## Parallel Example: User Story 1

```bash
# Após Phase 1 (T001, T002) concluída, em paralelo:
Task: "Criar src/components/treino/cronometro-descanso.tsx (T005)"
Task: "Alterar assinatura de onIniciarDescanso em exercicio-execucao.tsx (T003)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup (T001, T002)
2. Phase 2: Foundational — vazia, sem ação
3. Completar Phase 3: User Story 1 (T003-T012)
4. **PARAR e VALIDAR**: testar o cronômetro contando corretamente (quickstart.md, Cenário 1)
5. Esse já é um incremento demonstrável: cronômetro automático, sem ajuste manual ainda

### Incremental Delivery

1. Setup → Foundational (vazia) → Fundação pronta
2. Adicionar User Story 1 → testar independentemente → MVP
3. Adicionar User Story 2 (ajuste +/-15s) → testar independentemente
4. Adicionar User Story 3 (sobrevivência a navegação/background) → testar independentemente,
   respeitando a Nota de escopo do Cenário 3b
5. Cada story adiciona valor sem quebrar as anteriores

---

## Notes

- [P] tasks = arquivos diferentes, sem dependência entre si
- [Story] mapeia a task à user story correspondente, para rastreabilidade
- Nenhuma task de teste automatizado foi incluída — não solicitado e sem framework
  configurado no projeto (ver seção "Tests" acima)
- Validar cada checkpoint antes de prosseguir para a próxima fase
- O Cenário 3b do quickstart.md (troca de aba) é intencionalmente não coberto por nenhuma
  task de implementação — é uma limitação estrutural reconhecida, não um item pendente de
  código
