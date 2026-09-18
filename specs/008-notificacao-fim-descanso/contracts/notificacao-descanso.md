# Contract: Notificação de Fim do Descanso (`src/services/notificacao-descanso.ts` e `src/app/treino/[treinoId].tsx`)

**Feature**: 008-notificacao-fim-descanso | **Date**: 2026-09-17

Estende o contrato já existente em
[../../007-cronometro-descanso/contracts/cronometro-descanso.md](../../007-cronometro-descanso/contracts/cronometro-descanso.md)
(RF05), que documenta o estado `descansoAtivo` e o ponto de extensão
`onDescansoConcluido`. Não repete o que já está lá (cálculo de tempo restante,
ajuste de +/-15s, substituição de cronômetro) — documenta apenas o que esta feature
adiciona: o agendamento de notificação do sistema operacional atrelado a esse
mesmo estado.

## Novo módulo de serviço (`src/services/notificacao-descanso.ts`)

```ts
// Configuração do handler de exibição em primeiro plano — chamada uma única vez,
// na inicialização do app (src/app/_layout.tsx), antes de qualquer agendamento.
configurarNotificacoesDescanso(): void

// Agenda o aviso para o horário `fimEm` informado. Solicita permissão na primeira
// chamada, se ainda não concedida/negada. Retorna o identificador da notificação
// agendada, ou null se a permissão foi negada (agendamento não criado).
agendarNotificacaoDescanso(fimEm: number): Promise<string | null>

// Cancela um agendamento existente por identificador. Não lança erro se o
// identificador já não existir mais (idempotente).
cancelarNotificacaoDescanso(identificador: string): Promise<void>
```

## Novo estado na rota (`src/app/treino/[treinoId].tsx`), irmão de `descansoAtivo`

```ts
const [notificacaoAgendada, setNotificacaoAgendada] =
  useState<{ identificador: string; fimEm: number } | null>(null);
```

| Evento (já existente no RF05) | Efeito adicional desta feature |
|---|---|
| `handleIniciarDescanso` cria um novo `descansoAtivo` com `fimEm` válido | Cancela `notificacaoAgendada` anterior (se houver) e chama `agendarNotificacaoDescanso(fimEm)`; grava o resultado em `notificacaoAgendada` |
| `handleIniciarDescanso` recebido com `descansoSeg` ausente/zero (RF05 FR-010) — nenhum cronômetro é criado | Nenhum agendamento é criado; se havia um `notificacaoAgendada` de um cronômetro anterior ainda pendente, ele é cancelado |
| `handleAjustarDescanso` (+15s ou -15s) resulta em novo `fimEm > Date.now()` | Cancela `notificacaoAgendada` anterior e agenda um novo com o `fimEm` ajustado |
| `handleAjustarDescanso` (-15s) resulta em `fimEm <= Date.now()` | Cancela `notificacaoAgendada` anterior; não cria novo agendamento futuro — o caminho de conclusão imediata já existente no RF05 (`handleDescansoConcluido`) é acionado, disparando o efeito local de "descanso concluído" sem depender do agendamento |
| `onIniciarDescanso` recebido enquanto `descansoAtivo` já não é `null` (substituição, RF05 FR-011) | Cancela `notificacaoAgendada` do cronômetro substituído; agenda um novo para o `fimEm` do cronômetro que assume o lugar |
| `handleDescansoConcluido` é chamado (tempo chegou a zero, detectado em primeiro plano) | `notificacaoAgendada` é limpo (`null`); se o agendamento correspondente ainda não disparou por algum motivo, ele é cancelado (não deve disparar depois de já concluído localmente) |
| Notificação dispara no sistema operacional (app em qualquer estado) | Som + vibração emitidos pelo próprio sistema operacional, conforme configuração do canal (Android) / conteúdo da notificação (iOS); nenhum código JS do app precisa executar para que o som/vibração ocorram |
| Usuário toca na notificação (app minimizado/tela bloqueada) | Sistema operacional traz o app de volta ao primeiro plano, na mesma rota `[treinoId].tsx`; ao montar/retomar, o cálculo já existente do RF05 (`calcularSegundosRestantes`) reflete que o tempo já chegou a zero, acionando `handleDescansoConcluido` normalmente pelo caminho já existente (via tick/`AppState`, RF05) |

## Configuração de inicialização (`src/app/_layout.tsx`)

```ts
// Chamado uma vez, fora de qualquer componente de rota específico.
useEffect(() => {
  configurarNotificacoesDescanso();
}, []);
```

Responsabilidades de `configurarNotificacoesDescanso`:
- `Notifications.setNotificationHandler({ handleNotification: async () => ({...}) })`,
  retornando `{ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true,
  shouldSetBadge: false }` — **não** `shouldShowAlert` (depreciado nas versões
  recentes do SDK) — para que a notificação seja ouvida/vista mesmo com o app em
  primeiro plano (ver research.md, Decisão 4).
- Em Android, configura o canal de notificação `'descanso'` usado pelo aviso
  (`Notifications.setNotificationChannelAsync`), com
  `importance: Notifications.AndroidImportance.MAX` e `vibrationPattern` explícito
  (ver research.md, Decisão 6) — feito aqui, na inicialização do app, e não sob
  demanda dentro de `agendarNotificacaoDescanso`, para garantir que o canal já
  exista antes do primeiro agendamento. `agendarNotificacaoDescanso` referencia
  esse canal via `channelId: 'descanso'` no `content` de cada chamada a
  `scheduleNotificationAsync`.

## Fora de escopo desta feature (reforçando o já documentado na spec)

- Qualquer alteração ao cálculo de tempo restante, ajuste de +/-15s, ou à
  substituição de cronômetro — toda essa lógica permanece exatamente como o RF05 a
  implementou; esta feature apenas observa `fimEm` e reage às suas mudanças.
- Persistência do agendamento (ou do próprio cronômetro) em `AsyncStorage`: fora de
  escopo, mesma decisão já tomada pelo RF05 — se o app for fechado por completo, o
  agendamento pode não sobreviver, e isso é aceito.
- Configuração de ícone/som customizado da notificação via plugin do `app.json`:
  não necessária para o comportamento funcional básico exigido pela spec (som
  padrão do sistema já satisfaz "som + vibração simultâneos"); pode ser considerada
  em uma iteração futura de identidade visual, fora do escopo funcional deste RF06.
- Leitura ou controle do volume/modo silencioso do aparelho pelo app: o sistema
  operacional já aplica essa política nativamente sobre notificações (ver
  research.md, Decisão 7).
- Declaração/garantia da permissão `SCHEDULE_EXACT_ALARM` no Android 12+ (exigiria
  development build, não disponível testando via Expo Go): registrado como risco
  conhecido, não resolvido por esta feature — ver plan.md, "Riscos Conhecidos", e
  research.md, Decisão 8.
