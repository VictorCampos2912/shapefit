# Contract: `src/app/treino/[treinoId].tsx`

**Feature**: `013-nova-sessao-treino`

Contrato interno (handlers e efeito de uma tela — não há API HTTP nesta feature).

## Efeito de finalização automática (reescrito)

```ts
useEffect(() => {
  const todosConcluidos = treino?.exercicios.every((item) => estadosPorExercicio[item.id]?.concluido) ?? false;
  if (todosConcluidos && sessaoAtualId !== null && !sessaoFinalizadaAutomaticamente && perfilAtivo) {
    setSessaoFinalizadaAutomaticamente(true);
    finalizarSessao(perfilAtivo.id, sessaoAtualId);
  }
}, [estadosPorExercicio, sessaoAtualId, treino?.exercicios, sessaoFinalizadaAutomaticamente, perfilAtivo]);
```

- **Pré-condição**: `sessaoAtualId` não nulo (existe uma sessão sendo rastreada pela
  tela) e todos os exercícios do treino estão com `concluido: true`.
- **Pós-condição**: a sessão correspondente a `sessaoAtualId` fica com `finalizadaEm`
  preenchido no `AsyncStorage` (via `finalizarSessao`, já existente, sem alteração de
  assinatura). **Nenhum estado visual da tela é alterado** por este efeito —
  `estadosPorExercicio`, `sessaoAtualId` e `exercicioSelecionadoId` permanecem como
  estavam (FR-001, FR-002).
- **Idempotência**: dispara no máximo uma vez por sessão, mesmo que
  `estadosPorExercicio` mude depois (ex.: edição de série já concluída) — controlado
  por `sessaoFinalizadaAutomaticamente` (ver `data-model.md`).

## `handleNovaSessaoDeTreino` (novo)

```ts
function handleNovaSessaoDeTreino() {
  setSessaoAtualId(null);
  setEstadosPorExercicio({});
  setExercicioSelecionadoId(null);
  setSessaoFinalizadaAutomaticamente(false);
}
```

- **Pré-condição**: só é alcançável pela UI quando `sessaoAtualId !== null` e todos os
  exercícios estão concluídos (botão só renderiza nesse estado — ver seção "Condições
  de renderização" abaixo).
- **Pós-condição**: a tela volta ao estado "pronto para começar" — nenhum exercício
  marcado como concluído, pronta para o usuário apertar "Iniciar exercício" de novo
  (FR-003, FR-004). **Não cria nem finaliza nenhuma sessão** — a sessão já foi
  finalizada pelo efeito automático antes deste botão sequer aparecer; a próxima
  sessão só passa a existir de fato quando `registrarSerieConcluida` for chamado de
  novo (mesmo mecanismo já existente, sem alteração).

## `handleFinalizarTreino` (existente, ajustado)

```ts
async function handleFinalizarTreino() {
  if (!perfilAtivo || !sessaoAtualId) return;
  handleDescansoConcluido();
  await finalizarSessao(perfilAtivo.id, sessaoAtualId);
  setSessaoAtualId(null);
  setEstadosPorExercicio({});
  setExercicioSelecionadoId(null);
  setSessaoFinalizadaAutomaticamente(false); // linha nova
}
```

- Assinatura e corpo inalterados, exceto pela linha final que também reseta a nova
  flag — necessário porque este handler também pode ser o ponto de reset da tela
  (encerramento manual antecipado, com exercícios ainda pendentes), então precisa
  deixar a guarda pronta para a próxima sessão (FR-006).

## `marcarExercicioConcluido` (`src/services/sessao-treino-storage.ts`, assinatura alterada)

```ts
export async function marcarExercicioConcluido(params: {
  perfilId: string;
  sessaoId: string; // era treinoId
  exercicioId: string;
}): Promise<SessaoTreino>
```

- **Antes**: localizava a sessão por `treinoId` + `finalizadaEm === null` (exigia
  sessão em andamento).
- **Depois**: localiza por `id === sessaoId` diretamente — funciona independente de a
  sessão já estar finalizada ou não (`research.md`, Decisão 5). Chamador
  (`handleConcluirExercicio`) passa `sessaoAtualId` em vez de `treino.id`.
- Necessário porque, com esta feature, a sessão pode legitimamente já estar
  finalizada no momento em que o usuário aperta "Concluir exercício" do último
  exercício (o efeito de auto-finalização não espera mais esse clique).

## Condições de renderização (tela de lista de exercícios)

| Elemento | Condição antes | Condição depois |
|---|---|---|
| Banner "🎉 Parabéns" | `todosConcluidos` | inalterada |
| Botão "Finalizar treino" | `sessaoAtualId` | `sessaoAtualId && !todosConcluidos` |
| Botão "Nova sessão de Treino" (novo) | — | `sessaoAtualId && todosConcluidos` |

`todosConcluidos` é a mesma expressão já usada hoje no JSX
(`treino.exercicios.every((item) => estadosPorExercicio[item.id]?.concluido)`),
apenas extraída para uma constante reaproveitada pelas três condições.
