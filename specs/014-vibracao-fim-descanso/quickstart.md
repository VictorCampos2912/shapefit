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
3. **Esperado**: no momento exato em que chega a zero, o aparelho vibra com um
   padrão perceptivelmente mais forte/longo do que a vibração padrão de notificação
   do aparelho (a mesma que já era usada antes desta feature).

## Cenário 2 — Ajuste manual até zero também vibra (US1, edge case)

1. Iniciar um descanso curto (ex.: 15s).
2. Tocar em "-15s" repetidas vezes até o tempo chegar a zero ou negativo.
3. **Esperado**: a vibração dispara no momento em que o ajuste zera o tempo, sem
   esperar a contagem regressiva natural terminar.

## Cenário 3 — Sem vibração dupla; notificação em segundo plano inalterada (US2)

1. Iniciar um descanso, colocar o app em segundo plano (trocar de app ou bloquear a
   tela) antes do tempo zerar.
2. **Esperado**: só a vibração já existente da notificação do sistema ocorre — sem
   vibração adicional perceptível, comportamento idêntico ao já validado no RF06
   antes desta feature.

## Cenário 4 — Respeita a configuração de vibração do sistema

1. Desativar a vibração nas configurações do aparelho.
2. Repetir o Cenário 1.
3. **Esperado**: nenhuma vibração ocorre (comportamento padrão do sistema
   operacional, sem nenhum código específico desta feature contornando essa
   configuração).

## Referências

- Contrato: [`contracts/treinoId-screen.md`](./contracts/treinoId-screen.md)
- Critérios de aceite formais: `spec.md` (Acceptance Scenarios de cada User Story)
