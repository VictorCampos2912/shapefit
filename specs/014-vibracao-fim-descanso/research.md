# Phase 0 Research: Vibração Diferenciada ao Fim do Descanso

**Feature**: `014-vibracao-fim-descanso` | **Date**: 2026-09-22

Sem `[NEEDS CLARIFICATION]` pendente — escopo (só vibração, sem som) já decidido
explicitamente com o usuário antes da criação da spec.

## Decisão 1: API de vibração usada

**Decision**: `Vibration` do próprio React Native (`react-native`, não
`expo-haptics`) — `Vibration.vibrate(padrao)`, chamado dentro de
`handleDescansoConcluido` (`src/app/treino/[treinoId].tsx`).

**Rationale**: já faz parte do React Native core, sem nenhuma dependência nova —
exigência explícita do usuário para esta rodada (sem novo development build).
`expo-haptics` (feedback tátil curto, tipo toque de botão) foi considerado e
descartado: a proposta é uma vibração "mais intensa e diferente da notificação", que
`Vibration.vibrate` com um padrão customizado atende melhor do que os pulsos curtos de
haptics.

**Alternatives considered**: `expo-haptics` — rejeitado, pensado para feedback tátil
curto de interação (ex.: toque em botão), não para um aviso "mais intenso" como pedido;
também seria uma dependência nova, mesmo que pequena, sem necessidade já que
`Vibration` já resolve.

## Decisão 2: Padrão de vibração, diferenciado do já usado pela notificação

**Decision**: Novo padrão constante, `[0, 500, 200, 500, 200, 500]` (3 vibrações de
500ms, com pausas de 200ms) — perceptivelmente mais longo e insistente que o padrão já
usado pelo canal de notificação Android (`[0, 250, 250, 250]`, 2 vibrações de 250ms,
em `src/services/notificacao-descanso.ts`).

**Rationale**: FR-002 exige que o padrão seja "perceptivelmente mais
intenso/longo" que o já existente — o padrão da notificação já está fixado em código
(canal Android) e não deve ser alterado (FR-003); um padrão novo e claramente distinto
é a forma mais direta de atender isso sem tocar no que já existe.

**Alternatives considered**: reaproveitar o mesmo array `[0, 250, 250, 250]` —
rejeitado, não atenderia FR-002 (precisa ser perceptivelmente diferente).

## Decisão 3: Ponto único de disparo — `handleDescansoConcluido`

**Decision**: A chamada a `Vibration.vibrate(...)` entra dentro da função
`handleDescansoConcluido()` já existente em `[treinoId].tsx` — não em cada um dos
pontos que a invocam.

**Rationale**: `handleDescansoConcluido` já é o único ponto que os dois cenários
legítimos de "descanso terminou com o app em primeiro plano" passam por —
(1) o `useEffect` que observa `segundosRestantes === 0` durante a contagem normal, e
(2) o ajuste manual (-15s) que leva o tempo restante a zero ou negativo
(`handleAjustarDescanso`). Colocar a chamada uma única vez, dentro da função
compartilhada, evita duplicar a lógica nos dois pontos de chamada (Princípio II).

**Fora do escopo, propositalmente**: o branch de `handleIniciarDescanso` que pula o
cronômetro quando `descanso_seg` é ausente/zero/inválido (RF05, comportamento já
existente) não chama `handleDescansoConcluido` e não é alterado por esta feature —
nesse caso não existe cronômetro visível nem transição perceptível para o usuário
sentir, então não há evento a vibrar.

## Decisão 4: Sem guarda de primeiro/segundo plano — incompleta (ver Decisão 5)

**Decision original**: Nenhum código verifica se o app está em primeiro plano antes
de vibrar — `handleDescansoConcluido` só é alcançado enquanto o código está
executando, e o JS é suspenso em segundo plano, então "só dispara em primeiro
plano" pareceria garantido de graça.

**Por que estava incompleta**: essa afirmação confundiu "o código só EXECUTA em
primeiro plano" com "o EVENTO (descanso chegando a zero) só é detectado enquanto o
app já estava em primeiro plano contínuo". São coisas diferentes — ver Decisão 5.

## Decisão 5: Suprimir a vibração quando a detecção do "zero" vem de uma retomada de segundo plano (correção pós-teste, 2026-09-23)

**Decision**: Novo `useRef` (`voltouDeSegundoPlanoRef`), marcado `true` dentro do
listener de `AppState.addEventListener('change', ...)` sempre que o app volta a
`'active'`. O `useEffect` que detecta `segundosRestantes === 0` lê e reseta esse ref
a cada execução; se o ref estava `true` (ou seja, esta avaliação foi disparada por
uma retomada de segundo plano, não pelo tick natural de 1s), `handleDescansoConcluido`
é chamado com `deveVibrar = false` — limpa o cronômetro e cancela a notificação
agendada, mas **não** vibra. `handleDescansoConcluido` ganha o parâmetro
`deveVibrar: boolean = true`.

**Rationale**: bug real reportado pelo usuário após testar em iPhone — "com o app
aberto ele vibra mais longo e três vezes, em segundo plano é uma vibração normal de
notificação, e vibra 3 vezes quando reabre o app". Causa raiz: se o descanso zera
com o app em segundo plano, o JS fica suspenso e não processa o evento naquele
momento — só quando o app volta a `'active'` é que o efeito de
`segundosRestantes === 0` roda pela primeira vez para aquele descanso, e (antes desta
correção) sempre vibrava, como se o zero tivesse acabado de acontecer ali. Só que a
notificação do sistema (RF06) já tinha vibrado no momento certo, em segundo plano —
resultado: duas vibrações para o mesmo evento, uma delas (a mais forte, do RF13) na
hora errada (ao reabrir, não ao zerar). FR-001 já dizia "enquanto o app estiver em
primeiro plano" — a implementação original não cobria esse caso.

**Efeito colateral encontrado e também corrigido**: `handleFinalizarTreino` (botão
"Finalizar treino", existente desde o RF07) também chama `handleDescansoConcluido()`
para limpar um cronômetro ativo ao encerrar o treino manualmente — com a vibração
adicionada nesta feature, esse call site também passou a vibrar por engano (finalizar
o treino não é "o descanso terminou"). Corrigido chamando
`handleDescansoConcluido(false)` ali.

**Alternatives considered**: verificar `AppState.currentState` diretamente dentro do
efeito, sem `useRef` — rejeitado; no momento em que o efeito roda, o app já está
`'active'` de qualquer forma (só pode executar JS nesse estado), então não dá pra
distinguir "acabou de voltar" de "já estava ativo" sem guardar esse sinal em algum
lugar que sobreviva entre o evento de `AppState` e a leitura no efeito seguinte.

## Decisão 6: unificar o padrão de vibração entre app aberto e notificação (pedido pós-teste, 2026-09-23)

**Decision**: `PADRAO_VIBRACAO_FIM_DESCANSO` sai de dentro de `[treinoId].tsx` e vira
uma constante compartilhada em `src/constants/vibracao.ts`, importada tanto por
`[treinoId].tsx` (vibração em primeiro plano, `Vibration.vibrate`) quanto por
`src/services/notificacao-descanso.ts` (`vibrationPattern` do canal Android). O id do
canal de notificação muda de `descanso-v3` para `descanso-v4`.

**Rationale**: o usuário testou as duas vibrações lado a lado (app aberto vs.
notificação em segundo plano) e notou a diferença de intensidade — pediu que fossem
iguais. Reaproveitar a mesma constante nos dois lugares evita duplicar o array e
garante que os dois pontos nunca fiquem dessincronizados de novo. O bump de versão do
canal é necessário porque canais de notificação do Android são efetivamente imutáveis
depois de criados num aparelho — `Notifications.setNotificationChannelAsync` com o
mesmo id não reescreve `vibrationPattern` num canal já existente (mesma lição já
aplicada antes, daí o canal já estar em "v3").

**Alternatives considered**: manter duas constantes iguais em arquivos diferentes —
rejeitado, risco de um dos dois ser alterado no futuro sem o outro acompanhar,
reintroduzindo a assimetria que o usuário acabou de pedir para eliminar.

## Resumo das entidades técnicas afetadas

- `src/constants/vibracao.ts` (novo): `PADRAO_VIBRACAO_FIM_DESCANSO`, compartilhado
  entre os dois pontos de disparo (Decisão 6).
- `src/app/treino/[treinoId].tsx`: `handleDescansoConcluido` ganha uma chamada a
  `Vibration.vibrate(PADRAO_VIBRACAO_FIM_DESCANSO)`, condicionada a um novo parâmetro
  `deveVibrar`; novo `useRef` (`voltouDeSegundoPlanoRef`) para suprimir vibração em
  retomadas de segundo plano; novo import de `Vibration` do `react-native` e da
  constante compartilhada.
- `src/services/notificacao-descanso.ts`: canal de notificação atualizado para usar
  `PADRAO_VIBRACAO_FIM_DESCANSO`; id do canal alterado de `descanso-v3` para
  `descanso-v4` (Decisão 6).
