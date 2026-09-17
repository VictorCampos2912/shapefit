# Contract: Extensão da Tela de Execução (`src/app/treino/[treinoId].tsx` e componentes)

**Feature**: 005-avancar-series-exercicios | **Date**: 2026-09-16

Estende o contrato já existente em
[../../004-execucao-treino/contracts/tela-execucao-treino.md](../../004-execucao-treino/contracts/tela-execucao-treino.md)
(RF03). Não repete o que já está lá (parâmetro de rota, consumo de `treino-storage.ts` e
`use-perfil-ativo.tsx`, navegação a partir do RF02) — documenta apenas o que muda ou é
adicionado por esta feature.

## Consumo de `sessao-treino-storage.ts` (novo, ver contrato irmão)

```ts
// Ao montar a rota, além de listarTreinos:
obterSessao(perfilAtivo.id, treinoId)
// Usado para reconstruir estadosPorExercicio a partir da sessão persistida (data-model.md,
// "Fluxo de carregamento"), antes de exibir a lista de exercícios.

// Dentro de ExercicioExecucao, ao tocar em "Concluir série":
registrarSerieConcluida({ perfilId, treinoId, exercicioId, serie, totalSeriesDoExercicio })

// Dentro de ExercicioExecucao (ou no pai, ao receber o callback), ao tocar em "Concluir
// exercício":
marcarExercicioConcluido({ perfilId, treinoId, exercicioId })
```

## Estado interno da rota/componentes (novo, em adição ao já descrito no RF03)

| Estado | Transição | FR relacionado |
|---|---|---|
| Concluir série habilitado | `estado.cargaKg` e `estado.repsFeitas` ambos não vazios | FR-001, FR-002 |
| Concluir série tocado, ainda há séries restantes | `seriesConcluidas` ganha uma entrada; `serieAtual` avança; `cargaKg` pré-preenchido com a carga da série recém-concluída; `repsFeitas` limpo; indicador "Série X de Y" atualizado | FR-003, FR-004, FR-005 |
| Concluir série tocado, era a última planejada | `concluido: true` no estado do exercício; botão "Concluir exercício" passa a aparecer/habilitar | FR-006, FR-007 |
| Concluir exercício tocado | Sessão marca a execução como `'concluido'`; rota volta para a lista de exercícios | FR-008 |
| Lista de exercícios, item com execução `'concluido'` | Exibido com o estado visual `'concluido'` (reintroduzido em `ExercicioListItem` — no RF03 esse estado existia no tipo mas nunca era alcançado) | FR-009 |
| Lista de exercícios, usuário toca em item concluído/pausado/não iniciado | Mesma navegação livre já estabelecida no RF03 — nenhuma restrição de ordem | FR-010 |

## Comportamento observável (novo/alterado em relação ao RF03)

| Entrada | Estado exibido | FR relacionado |
|---------|------------------|------------------|
| Campos de carga/reps vazios ou parciais | Botão "Concluir série" desabilitado | FR-001 |
| Campos de carga/reps ambos preenchidos | Botão "Concluir série" habilitado | FR-002 |
| Botão "Concluir série" tocado | Série registrada (memória + `AsyncStorage`); início do descanso disparado como evento (sem UI própria nesta feature — RF05/RF06) | FR-003, FR-005 |
| Última série concluída | Botão "Concluir exercício" aparece habilitado | FR-006, FR-007 |
| Botão "Concluir exercício" tocado | Volta à lista; item exibido como concluído | FR-008, FR-009 |
| Reabrir o app / voltar à rota com sessão existente | Navega para a lista de exercícios (nunca direto para dentro de um exercício); estados concluído/pausado corretos, série seguinte correta ao reabrir um exercício pausado | FR-012, FR-014 |
| Tentativa de editar série já concluída | Não exposto pela UI — nenhum campo de edição para séries passadas nesta feature | FR-015 |
| Perfil com dois treinos iniciados (ambos não concluídos) | Ambos navegáveis normalmente a partir da lista de treinos (RF02); nenhum aviso de conflito | Contrato de Persistência da Sessão (spec.md) |

## Fora de escopo desta feature (reforçando o já documentado na spec)

- UI do cronômetro de descanso (contagem, ajuste, notificação): RF05/RF06 — esta feature
  apenas dispara o evento de início.
- Edição de séries concluídas: RF09.
- Indicação de sessão em andamento na lista de treinos (RF02): decisão adiada.
- Finalização de sessão (`finalizadaEm`) e histórico: RF07.
