---

description: "Task list template for feature implementation"
---

# Tasks: Notificação de Fim do Descanso

**Input**: Design documents from `/specs/008-notificacao-fim-descanso/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/notificacao-descanso.md, quickstart.md

**Tests**: Não solicitados na spec nem no plano — o projeto não tem framework de
testes automatizados configurado (mesma decisão já registrada pelo RF05); validação
é manual em dispositivo real (Android + iOS via Expo Go), conforme Constituição
Princípio III. Nenhuma task de teste automatizado é gerada.

**Organization**: Tasks agrupadas por user story (spec.md) para permitir
implementação e teste independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tasks incompletas)
- **[Story]**: A qual user story esta task pertence (US1, US2, US3)
- Caminhos de arquivo exatos incluídos em cada descrição

## Path Conventions

Projeto único (Expo Router) — `src/app/`, `src/services/`, `src/utils/` na raiz do
repositório, conforme `plan.md` → "Project Structure".

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Adicionar a dependência necessária e preparar o terreno antes de
qualquer lógica de agendamento.

- [X] T001 Adicionar `expo-notifications` ao `package.json` (`npx expo install expo-notifications`, garantindo a versão compatível com Expo SDK 57) e rodar `npm install`. Justificativa da nova dependência já registrada em `plan.md` → "Complexity Tracking" (Princípio IV).
- [X] T002 Confirmar manualmente, antes de codificar, a forma exata do objeto retornado por `Notifications.setNotificationHandler` na documentação fixada de `https://docs.expo.dev/versions/v57.0.0/sdk/notifications/` (campos `shouldShowBanner`/`shouldShowList`/`shouldPlaySound`/`shouldSetBadge`), conforme o item de acompanhamento registrado em `research.md`. Ajustar T005 se a versão v57.0.0 divergir do assumido. **Confirmado diretamente nos `.d.ts` do pacote instalado (`expo-notifications@~57.0.19`)**: `NotificationBehavior` tem `shouldShowBanner`, `shouldShowList`, `shouldPlaySound`, `shouldSetBadge` — `shouldShowAlert` está marcado `@deprecated` no próprio tipo. Também confirmado: `DateTriggerInput` = `{ type: SchedulableTriggerInputTypes.DATE, date: Date | number, channelId?: string }` — `channelId` pertence ao **trigger**, não ao `content` (ajuste em relação à suposição original do plano/contrato, aplicado em T007).

**Checkpoint**: Dependência instalada; nomes de API confirmados antes de escrever código de agendamento.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestrutura de notificação que MUST existir antes de qualquer
user story poder ser implementada — configuração do handler de primeiro plano e do
canal Android, que devem existir antes do primeiro agendamento (research.md,
Decisões 4 e 6).

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase estar completa.

- [X] T003 Criar `src/services/notificacao-descanso.ts` com a assinatura das três funções do contrato (`contracts/notificacao-descanso.md`): `configurarNotificacoesDescanso(): void`, `agendarNotificacaoDescanso(fimEm: number): Promise<string | null>`, `cancelarNotificacaoDescanso(identificador: string): Promise<void>` — apenas as assinaturas e imports de `expo-notifications` nesta task; implementação nas tasks seguintes.
- [X] T004 Em `src/services/notificacao-descanso.ts`, implementar `configurarNotificacoesDescanso()`: chamar `Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) })` (nomes de campo confirmados em T002; **não** usar `shouldShowAlert`, depreciado — research.md, Decisão 4).
- [X] T005 Em `src/services/notificacao-descanso.ts`, dentro de `configurarNotificacoesDescanso()`, adicionar a configuração do canal Android (`if (Platform.OS === 'android')`): `Notifications.setNotificationChannelAsync('descanso', { name: 'Fim do descanso', importance: Notifications.AndroidImportance.MAX, vibrationPattern: [0, 250, 250, 250], sound: 'default', lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC })` — MUST ocorrer antes de qualquer chamada a `agendarNotificacaoDescanso` (research.md, Decisão 6).
- [X] T006 Em `src/app/_layout.tsx`, importar `configurarNotificacoesDescanso` de `@/services/notificacao-descanso` e chamá-la dentro de um `useEffect(() => { configurarNotificacoesDescanso(); }, [])` no componente `RootLayout`, antes de qualquer treino poder ser iniciado (contracts/notificacao-descanso.md → "Configuração de inicialização").

**Checkpoint**: Handler de notificação e canal Android configurados na inicialização do app — pronto para as user stories agendarem notificações.

---

## Phase 3: User Story 1 - Aviso sonoro e por vibração com app em primeiro plano (Priority: P1) 🎯 MVP

**Goal**: Ao cronômetro de descanso (RF05) chegar a zero com o app aberto, o
celular emite som e vibração simultaneamente, e a UI já existente do RF05
(`emDescanso`) reflete "descanso concluído".

**Independent Test**: Concluir uma série com descanso curto (ex.: 15s), manter o
app aberto e observar que o som e a vibração ocorrem no exato momento em que o
cronômetro chega a zero (quickstart.md, Cenário 1).

### Implementation for User Story 1

- [X] T007 [US1] Em `src/services/notificacao-descanso.ts`, implementar `agendarNotificacaoDescanso(fimEm: number)`: chamar `Notifications.getPermissionsAsync()`; se não concedida, chamar `Notifications.requestPermissionsAsync()`; se ainda assim não concedida, retornar `null` sem agendar (FR-009, degradação graciosa). Se concedida, chamar `Notifications.scheduleNotificationAsync(...)` e retornar o identificador (research.md, Decisão 1). **Ajuste em relação à descrição original da task**: `channelId: 'descanso'` foi colocado dentro do objeto `trigger` (não em `content`) — confirmado em T002 que `channelId` pertence a `DateTriggerInput`, não a `NotificationContentInput`.
- [X] T008 [US1] Em `src/services/notificacao-descanso.ts`, implementar `cancelarNotificacaoDescanso(identificador: string)`: chamar `Notifications.cancelScheduledNotificationAsync(identificador)`, sem lançar erro se o identificador já não existir (idempotente, conforme contrato e conforme a própria documentação do método, confirmada em T002).
- [X] T009 [US1] Em `src/app/treino/[treinoId].tsx`, importar `agendarNotificacaoDescanso` e `cancelarNotificacaoDescanso` de `@/services/notificacao-descanso`, e adicionar o novo estado `const [notificacaoAgendada, setNotificacaoAgendada] = useState<{ identificador: string; fimEm: number } | null>(null)`, irmão de `descansoAtivo` (data-model.md, contracts/notificacao-descanso.md).
- [X] T010 [US1] Em `src/app/treino/[treinoId].tsx`, na função `handleIniciarDescanso` (linha onde `setDescansoAtivo({ exercicioId, fimEm })` é chamado com `descansoSeg` válido), depois de definir `descansoAtivo`: cancelar `notificacaoAgendada` anterior (se houver, via `cancelarNotificacaoDescanso`) e chamar `agendarNotificacaoDescanso(fimEm)`, gravando o resultado (identificador + fimEm, ou `null`) em `notificacaoAgendada` (contracts/notificacao-descanso.md, linha "handleIniciarDescanso cria um novo descansoAtivo").
- [X] T011 [US1] Em `src/app/treino/[treinoId].tsx`, na função `handleDescansoConcluido`, antes ou junto de `setDescansoAtivo(null)`: se `notificacaoAgendada` não for `null`, cancelar via `cancelarNotificacaoDescanso(notificacaoAgendada.identificador)` e definir `setNotificacaoAgendada(null)` (contracts/notificacao-descanso.md, linha "handleDescansoConcluido é chamado").

**Checkpoint**: Ao concluir uma série com o app em primeiro plano, o aviso sonoro/vibração ocorre no momento correto, e a UI reflete "descanso concluído" — User Story 1 completa e testável de forma independente.

---

## Phase 4: User Story 2 - Aviso funciona com o app minimizado ou a tela bloqueada (Priority: P1)

**Goal**: O mesmo aviso da User Story 1 continua funcionando (som + vibração no
horário correto) mesmo com o app minimizado ou a tela do celular bloqueada,
incluindo quando o cronômetro é ajustado (+/-15s) ou substituído (nova série
concluída) antes do aviso original disparar.

**Independent Test**: Iniciar um descanso curto, minimizar o app (ou bloquear a
tela) imediatamente, aguardar sem tocar no celular, e confirmar que o aviso ocorre
no horário correto mesmo com o app fora de primeiro plano (quickstart.md, Cenários
2 e 3).

### Implementation for User Story 2

- [X] T012 [US2] Em `src/app/treino/[treinoId].tsx`, na função `handleAjustarDescanso`, no ramo em que `calcularSegundosRestantes(novoFimEm) > 0` (ajuste válido, não zera o tempo): cancelar `notificacaoAgendada` anterior e chamar `agendarNotificacaoDescanso(novoFimEm)`, atualizando `notificacaoAgendada` com o novo identificador/fimEm — reagendamento a cada ajuste de +15s/-15s (research.md, Decisão 2; contracts/notificacao-descanso.md, linha "handleAjustarDescanso (+15s ou -15s) resulta em novo fimEm > Date.now()").
- [X] T013 [US2] Em `src/app/treino/[treinoId].tsx`, na função `handleAjustarDescanso`, no ramo em que `calcularSegundosRestantes(novoFimEm) <= 0` (ajuste que zera o tempo, antes de chamar `handleDescansoConcluido()`): a checagem de zero/negativo ocorre **antes** de qualquer cancelamento nesse fluxo, delegando o cancelamento ao próprio `handleDescansoConcluido` (T011) — evita cancelar duas vezes e mantém uma única responsabilidade por cancelamento (research.md, Decisão 3; contracts/notificacao-descanso.md, linha "-15s resulta em fimEm <= Date.now()").
- [X] T014 [US2] Em `src/app/treino/[treinoId].tsx`, na função `handleIniciarDescanso`, no ramo em que `descansoAtivo` já não é `null` no momento da chamada (substituição por nova série concluída antes do cronômetro anterior zerar — RF05 FR-011): o cancelamento de `notificacaoAgendada` ocorre incondicionalmente no início da função, antes de qualquer decisão sobre criar um novo cronômetro — cobre tanto o caso de criação a partir de `null` (T010) quanto o de substituição (contracts/notificacao-descanso.md, linha "onIniciarDescanso recebido enquanto descansoAtivo já não é null").
- [ ] T015 [US2] Validar manualmente (sem alteração de código) que tocar na notificação recebida com o app minimizado/tela bloqueada traz o app de volta à rota `src/app/treino/[treinoId].tsx` já exibindo o estado de descanso concluído — comportamento esperado do próprio Expo Router/SO ao reabrir o app, sem necessidade de deep link customizado, pois `calcularSegundosRestantes` (RF05) já recalcula corretamente ao montar/retomar (FR-010 da spec; quickstart.md, Cenários 2 e 3).

**Checkpoint**: O aviso dispara corretamente com o app minimizado ou a tela bloqueada, mesmo após ajustes de tempo ou substituição do cronômetro — User Stories 1 e 2 funcionam juntas e de forma independente.

---

## Phase 5: User Story 3 - Aviso respeita o modo silencioso do aparelho (Priority: P2)

**Goal**: Em modo silencioso, nenhum som é emitido, mas a vibração continua
ocorrendo; fora do modo silencioso, o som respeita o volume de notificação
configurado no sistema, sem o app definir um volume próprio.

**Independent Test**: Colocar o celular em modo silencioso, concluir uma série e
aguardar o fim do descanso; confirmar que nenhum som é ouvido, mas a vibração
ocorre normalmente (quickstart.md, Cenário 6).

### Implementation for User Story 3

- [X] T016 [US3] Nenhuma implementação de código é necessária para esta user story: o comportamento de respeitar o modo silencioso/volume de notificação já é responsabilidade nativa do sistema operacional sobre notificações entregues via canal (Android, configurado em T005) e configuração padrão de som (iOS) — research.md, Decisão 7. Esta task é apenas o registro de que a US3 é satisfeita como consequência de T004/T005/T007, sem código adicional. Confirmado: nenhuma leitura/escrita de volume ou modo silencioso foi adicionada ao código desta feature.
- [ ] T017 [US3] Validar manualmente, em ambas as plataformas, que: (a) com o celular em modo silencioso, nenhum som toca mas a vibração ocorre; (b) fora do modo silencioso, com o volume de notificação ajustado para um nível específico não-máximo, o som toca nesse mesmo volume (quickstart.md, Cenário 6).

**Checkpoint**: Todas as três user stories funcionam de forma independente e em conjunto.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final cobrindo os edge cases da spec e os riscos conhecidos documentados no plano, que atravessam mais de uma user story.

- [ ] T018 [P] Validar manualmente o edge case "ajuste de -15s que zera o tempo dispara aviso imediato" (spec.md, Edge Cases; quickstart.md, Cenário 7) — cobre a lógica implementada em T013.
- [ ] T019 [P] Validar manualmente o edge case "nova série conclui com aviso anterior ainda pendente" (spec.md, Edge Cases; quickstart.md, Cenário 5) — confirma que apenas um aviso dispara, nunca dois, cobrindo T014.
- [ ] T020 [P] Validar manualmente o edge case "exercício sem `descanso_seg`" (RF05 FR-010): confirmar que nenhum agendamento é criado quando nenhum cronômetro é iniciado.
- [ ] T021 [P] Validar manualmente o cenário de permissão de notificação negada (spec.md, Edge Cases; quickstart.md, Cenário 8): confirmar que o app não trava e que o descanso ainda é corretamente refletido como concluído ao reabrir, mesmo sem aviso sonoro/vibração.
- [ ] T022 Validar manualmente, no Redmi Note 12 (Android), o risco conhecido de precisão de disparo sob Doze mode registrado em `plan.md` → "Riscos Conhecidos" e `research.md` → Decisão 8 (quickstart.md, Cenário 9) — documentar o atraso observado, sem tratá-lo como bug de implementação caso decorra da limitação já conhecida de `SCHEDULE_EXACT_ALARM` via Expo Go.
- [ ] T023 Rodar a validação completa de `quickstart.md` nos dois aparelhos-alvo (Redmi Note 12/Android e iPhone 16 Plus/iOS), conforme Constituição Princípio III, cobrindo todos os 9 cenários antes de considerar o RF06 concluído.
- [X] T024 Atualizar `docs/PRD-app-treino.md` (seção 9, "Stack técnica") para incluir `expo-notifications` como dependência, refletindo a justificativa já registrada em `plan.md` → "Complexity Tracking" (fecha a violação do Princípio IV com uma atualização formal do PRD, conforme a própria Constituição exige para novas dependências).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode começar imediatamente.
- **Foundational (Phase 2)**: Depende da conclusão do Setup — BLOQUEIA todas as user stories (o handler de notificação e o canal Android MUST existir antes de qualquer agendamento).
- **User Stories (Phase 3+)**: Todas dependem da conclusão da Fase Foundational.
  - US1 (P1) não depende de US2 ou US3.
  - US2 (P1) reutiliza as funções de agendamento/cancelamento criadas em US1 (T007, T008, T010, T011) — não é totalmente independente de código, mas é independentemente testável (o comportamento de US1 já deve estar correto antes de validar US2).
  - US3 (P2) não introduz código novo — depende apenas de US1/Foundational já estarem implementados corretamente.
- **Polish (Phase 6)**: Depende de todas as user stories desejadas estarem completas.

### User Story Dependencies

- **User Story 1 (P1)**: Pode começar após a Fase Foundational (Phase 2). Sem dependência de outras stories.
- **User Story 2 (P1)**: Pode começar após a Fase Foundational, mas reutiliza as funções de serviço implementadas em US1 (T007, T008) — na prática, deve ser feita depois de US1 estar funcional, ainda que testável de forma independente.
- **User Story 3 (P2)**: Pode ser validada a qualquer momento após US1 estar implementada — não introduz tasks de implementação próprias.

### Dentro de cada User Story

- Serviço (`notificacao-descanso.ts`) antes de conectar a rota.
- Conexão na rota (`[treinoId].tsx`) antes da validação manual.
- Story completa (implementação + validação) antes de avançar para a próxima prioridade.

### Parallel Opportunities

- T001 e T002 podem rodar em paralelo (instalação de dependência vs. confirmação de documentação).
- T004 e T005 tocam o mesmo arquivo (`notificacao-descanso.ts`) e a mesma função (`configurarNotificacoesDescanso`) — não são paralelizáveis entre si, mas T006 (arquivo diferente, `_layout.tsx`) pode ser preparada em paralelo à espera da conclusão de T004/T005 antes da integração final.
- Nas tasks de validação manual da Phase 6, T018-T022 são independentes entre si (cenários distintos) e podem ser executadas em paralelo por pessoas diferentes, desde que T023 (validação completa) rode por último como consolidação.

---

## Parallel Example: Setup

```bash
# T001 e T002 podem ocorrer em paralelo:
Task: "Adicionar expo-notifications ao package.json via npx expo install"
Task: "Confirmar manualmente a forma do objeto de retorno de setNotificationHandler na doc v57.0.0"
```

## Parallel Example: Polish

```bash
# T018-T021 (edge cases independentes) podem ocorrer em paralelo:
Task: "Validar ajuste de -15s que zera o tempo dispara aviso imediato"
Task: "Validar nova série conclui com aviso anterior ainda pendente"
Task: "Validar exercício sem descanso_seg não agenda nada"
Task: "Validar permissão de notificação negada não bloqueia o app"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup (T001-T002).
2. Completar Phase 2: Foundational (T003-T006) — CRÍTICO, bloqueia todas as stories.
3. Completar Phase 3: User Story 1 (T007-T011).
4. **PARAR e VALIDAR**: testar User Story 1 de forma independente (quickstart.md, Cenário 1) — aviso funcionando com o app aberto já entrega valor real, ainda que incompleto frente ao requisito arquitetural central do RF06.
5. Só então avançar para User Story 2, que é o núcleo arquitetural do requisito (app minimizado/tela bloqueada).

### Incremental Delivery

1. Setup + Foundational → base pronta (handler + canal configurados).
2. User Story 1 → validar independentemente → aviso funcional com app aberto.
3. User Story 2 → validar independentemente → aviso funcional com app minimizado/tela bloqueada (requisito arquitetural central do RF06, satisfeito).
4. User Story 3 → validar independentemente → modo silencioso confirmado.
5. Polish → edge cases e riscos conhecidos documentados, PRD atualizado, RF06 pronto para ser considerado concluído.

## Notes

- [P] tasks = arquivos diferentes ou validações independentes, sem dependência entre si.
- Nenhuma task introduz persistência em `AsyncStorage` — todo o estado de agendamento é transitório, em memória, conforme `data-model.md`.
- Nenhuma task altera a lógica de cálculo de tempo já existente do RF05 (`calcularSegundosRestantes`, `ajustarFimEm`) — esta feature apenas observa `fimEm` e reage às suas mudanças.
- T022 documenta explicitamente um risco conhecido (research.md, Decisão 8) — um atraso observado nesse cenário não deve ser tratado como falha de implementação das tasks anteriores, mas registrado como confirmação do risco já previsto no plano.
