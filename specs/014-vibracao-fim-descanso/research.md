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

## Decisão 4: Sem guarda de primeiro/segundo plano — desnecessária por construção

**Decision**: Nenhum código novo verifica se o app está em primeiro plano antes de
vibrar.

**Rationale**: `handleDescansoConcluido` só é alcançado por meio de efeitos que
dependem do estado `tick` (atualizado por um `setInterval` que só roda enquanto o componente
está montado e `descansoAtivo` é verdadeiro) ou de uma ação direta do usuário
(`handleAjustarDescanso`). Como o JS do app é suspenso em segundo plano (already
documented em `docs/PRD-app-treino.md`, seção 9), esses caminhos simplesmente não
executam com o app em segundo plano — a garantia de "só primeiro plano" (US2/FR-003)
já vem de graça da arquitetura existente, sem precisar de nenhuma verificação extra.

## Resumo das entidades técnicas afetadas

- `src/app/treino/[treinoId].tsx`: `handleDescansoConcluido` ganha uma chamada a
  `Vibration.vibrate(PADRAO_VIBRACAO_FIM_DESCANSO)`; nova constante de módulo
  `PADRAO_VIBRACAO_FIM_DESCANSO`; novo import de `Vibration` do `react-native`.
- Nenhum outro arquivo muda. `src/services/notificacao-descanso.ts` não é alterado
  (FR-003).
