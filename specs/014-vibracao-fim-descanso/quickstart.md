# Quickstart: Vibração Diferenciada ao Fim do Descanso

**Feature**: `014-vibracao-fim-descanso`

Validação manual em Android e iOS (Princípio III da constituição). **Não é
verificável via emulador/web** — exige um aparelho físico com vibração habilitada.

## Pré-requisitos

- Perfil ativo com um treino importado, aparelho físico com vibração ativada nas
  configurações do sistema.

## Cenário 1 — Vibração ao fim do descanso, com app em primeiro plano (US1)

1. Concluir uma série de um exercício, iniciando o cronômetro de descanso.
2. Manter o app aberto e em primeiro plano até o cronômetro chegar a zero.
3. **Esperado**: no momento exato em que chega a zero, o aparelho vibra com o padrão
   forte (3 vibrações longas) — perceptivelmente mais forte/longo do que o padrão
   simples usado pela notificação **antes** desta feature existir.

## Cenário 2 — Ajuste manual até zero também vibra (US1, edge case)

1. Iniciar um descanso curto (ex.: 15s).
2. Tocar em "-15s" repetidas vezes até o tempo chegar a zero ou negativo.
3. **Esperado**: a vibração dispara no momento em que o ajuste zera o tempo, sem
   esperar a contagem regressiva natural terminar.

## Cenário 3 — Sem vibração dupla ao reabrir; mesma intensidade em segundo plano (US2)

1. Iniciar um descanso, colocar o app em segundo plano (trocar de app ou bloquear a
   tela) antes do tempo zerar.
2. **Esperado (atualizado em 2026-09-23)**: a vibração da notificação do sistema
   dispara com o **mesmo padrão forte** (3 vibrações longas) já usado com o app em
   primeiro plano — não mais o padrão simples antigo (FR-003 atualizado, pedido do
   usuário após comparar as duas).
3. Reabrir o app (ou desbloquear a tela).
4. **Esperado (corrigido em 2026-09-23)**: **nenhuma** vibração adicional dispara ao
   reabrir — a vibração do passo 2 já foi a única. Se vibrar de novo neste passo, é
   regressão do bug de vibração dupla corrigido nesta data.

## Cenário 4 — Respeita a configuração de vibração do sistema

1. Desativar a vibração nas configurações do aparelho.
2. Repetir o Cenário 1.
3. **Esperado**: nenhuma vibração ocorre (comportamento padrão do sistema
   operacional, sem nenhum código específico desta feature contornando essa
   configuração).

## Cenário 5 — "Finalizar treino" não dispara a vibração do descanso

1. Iniciar um descanso e, antes dele terminar, apertar "Finalizar treino" (com
   exercícios ainda pendentes).
2. **Esperado**: o treino é finalizado normalmente (RF07), sem a vibração forte do
   RF13 disparando — finalizar o treino não é "o descanso terminou".

## Referências

- Contratos: [`contracts/treinoId-screen.md`](./contracts/treinoId-screen.md),
  [`contracts/notificacao-descanso.md`](./contracts/notificacao-descanso.md)
- Critérios de aceite formais: `spec.md` (Acceptance Scenarios de cada User Story)
