# Data Model: Conclusão Explícita de Sessão de Treino

**Feature**: `013-nova-sessao-treino` | **Date**: 2026-09-22

## Entidades persistidas (sem alteração de schema)

### SessaoTreino (`src/types/execucao-treino.ts`)

Sem alteração. O campo `finalizadaEm` já existente continua sendo a única fonte de
verdade sobre se uma sessão está finalizada — esta feature não introduz nenhum campo
novo nem muda quando `finalizadaEm` é preenchido (continua sendo no momento em que o
último exercício é concluído, ver `research.md` Decisão 1).

## Campo persistido novo (correção pós-teste, 2026-09-23)

### `SessaoTreino.revisadaPeloUsuario: boolean`

Novo campo em `src/types/execucao-treino.ts`. `false` ao criar a sessão
(`registrarSerieConcluida`); vira `true` quando o usuário aperta "Nova sessão de
Treino" ou "Finalizar treino" (`marcarSessaoRevisada`, `research.md` Decisão 6).
Permite que a tela de execução, ao ser remontada (ex.: usuário saiu para outra aba e
voltou), distinga "sessão concluída que o usuário ainda não reconheceu" (continua
mostrando tudo verde) de "sessão já reconhecida" (mostra o treino pronto para
começar).

## Estado local novo (não persistido — vive só na tela de execução)

### `sessaoFinalizadaAutomaticamente: boolean`

Novo estado em `src/app/treino/[treinoId].tsx` (`useState`), não relacionado a nenhuma
entidade persistida. Controla se o efeito de finalização automática já disparou para
a sessão/estado atual, evitando chamadas repetidas a `finalizarSessao` (ver
`research.md`, Decisão 2).

**Ciclo de vida**:
- Inicial: `false`.
- Vira `true` no momento em que o efeito de finalização automática dispara (todos os
  exercícios concluídos pela primeira vez).
- Volta a `false` quando a tela é resetada — tanto pelo novo botão "Nova sessão de
  Treino" (`handleNovaSessaoDeTreino`) quanto pelo botão "Finalizar treino" já
  existente (`handleFinalizarTreino`), já que ambos preparam a tela para uma execução
  futura.

## Estado local existente (sem alteração de shape, só de quando é resetado)

- `sessaoAtualId: string | null` — continua representando a sessão que a tela está
  acompanhando. Diferença de comportamento: antes desta feature, ficava `null`
  automaticamente assim que todos os exercícios eram concluídos; agora só volta a
  `null` quando o usuário aperta "Nova sessão de Treino" (ou "Finalizar treino", no
  encerramento manual antecipado).
- `estadosPorExercicio: Record<string, EstadoExecucaoExercicio>` — mesma observação:
  continua populado (todos com `concluido: true`) até uma ação explícita de reset.
- `exercicioSelecionadoId: string | null` — sem mudança de comportamento (já era
  resetado para `null` ao concluir um exercício, via `handleConcluirExercicio`).
