# Contract: UI de Edição de Série (`exercicio-execucao.tsx` + `[treinoId].tsx`)

**Feature**: 006-editar-serie-em-andamento | **Date**: 2026-09-17

Contrato de comportamento (props/callbacks e regras de exibição) entre os dois componentes
já existentes do RF04 que são estendidos por esta feature. Não há novo contrato de rede/API
— este documento descreve a interface entre componentes e a UI observável.

## Extensão de props de `ExercicioExecucao`

```ts
type ExercicioExecucaoProps = {
  exercicio: ExercicioPlanejado;
  estado: EstadoExecucaoExercicio;
  onAtualizarEstado: (novoEstado: EstadoExecucaoExercicio) => void;
  onConcluirSerie: (serie: SerieRealizada) => void;
  onConcluirExercicio: () => void;
  onIniciarDescanso?: () => void;
  jaEstavaConcluidoAoAbrir?: boolean;
  // NOVO:
  onEditarSerie: (serieEditada: SerieRealizada) => Promise<void>;
  // Chamado após o usuário confirmar (via Alert.alert) a edição de uma série já concluída.
  // serieEditada.serie identifica qual série foi editada; cargaKg/reps já são os novos
  // valores, validados (mesmas regras de sanitização do RF03/RF04).
};
```

## Regras de exibição (onde a lista de séries concluídas aparece)

| Estado do exercício | Ramo de renderização atual (RF04) | Mudança desta feature |
|---|---|---|
| `!estado.iniciado` | Botão "Iniciar exercício" | Sem mudança — nenhuma série concluída existe ainda |
| `estado.iniciado && !estado.concluido` | Área da série atual (carga/reps/"Concluir série") | **Adiciona**, abaixo da área da série atual, a lista de séries já concluídas (se houver `seriesConcluidas.length > 0`), cada uma com ação de editar |
| `estado.concluido && !jaEstavaConcluidoAoAbrir` | Mensagem "Todas as séries concluídas!" + botão "Concluir exercício" | **Adiciona** a lista de séries concluídas com ação de editar, acima ou junto da mensagem, sem alterar o botão "Concluir exercício" |
| `estado.concluido && jaEstavaConcluidoAoAbrir` | Mensagem estática "Este já foi feito, volte no próximo treino" (sem lista, sem interação) | **Adiciona** a lista de séries concluídas com ação de editar; mensagem estática permanece, mas a tela deixa de ser somente leitura — passa a ser visualização + edição, sem nenhum botão de conclusão (nenhuma mudança ao redor disso) |

Em nenhum dos três ramos modificados um novo botão de "Concluir exercício" ou de
"Concluir série" é introduzido — a lista de séries concluídas é puramente aditiva.

## Fluxo de interação (componente `ExercicioExecucao`)

1. Cada item da lista de séries concluídas exibe: número da série, carga (kg) e
   repetições, e um controle para iniciar a edição (ex.: toque no item, ou um botão
   "Editar").
2. Ao iniciar a edição de uma série, o componente entra em um estado local (interno,
   efêmero — ver data-model.md) com os campos de carga/reps daquela série, pré-preenchidos
   com os valores atuais, usando os mesmos `TextInput` + `sanitizarCarga`/`sanitizarReps`
   já existentes no arquivo.
3. O botão "Salvar edição" correspondente MUST permanecer desabilitado enquanto carga ou
   reps estiverem vazios ou inválidos — mesma regra de `podeConcluirSerie`, reaplicada aqui
   (ex.: `podeSalvarEdicao`).
4. Ao tocar em "Salvar edição" com valores válidos, o componente dispara `Alert.alert` com
   duas opções: cancelar (fecha o alerta, nenhuma chamada a `onEditarSerie`) ou confirmar
   (chama `onEditarSerie({ serie, cargaKg: Number(...), reps: Number(...) })`).
5. Ao cancelar a edição em qualquer ponto (antes de "Salvar edição", ou no próprio
   `Alert.alert`), nenhum estado em `EstadoExecucaoExercicio`/`SessaoTreino` é alterado — os
   valores exibidos na lista continuam os originais.

## Extensão de handler em `[treinoId].tsx`

```ts
async function handleEditarSerie(exercicioId: string, serieEditada: SerieRealizada) {
  if (!perfilAtivo || !treino) return;
  const sessao = await atualizarSerieRealizada({
    perfilId: perfilAtivo.id,
    treinoId: treino.id,
    exercicioId,
    serie: serieEditada.serie,
    novaCargaKg: serieEditada.cargaKg,
    novosReps: serieEditada.reps,
  });
  const execucao = sessao.execucoes.find((item) => item.exercicioId === exercicioId);
  if (!execucao) return;

  setEstadosPorExercicio((atual) => {
    const estadoAtual = atual[exercicioId] ?? criarEstadoExecucaoInicial(exercicioId);
    return {
      ...atual,
      [exercicioId]: {
        ...estadoAtual,
        seriesConcluidas: execucao.seriesRealizadas, // substitui a lista inteira pela
                                                       // versão já atualizada vinda do
                                                       // serviço — mesmo padrão usado por
                                                       // handleConcluirSerie
      },
    };
  });
}
```

**Nota sobre reabertura de exercício concluído**: `handleSelecionarExercicio` já define
`reaberturaJaConcluida` a partir de `estadosPorExercicio[exercicioId]?.concluido` — nenhuma
mudança é necessária nessa função para esta feature (ver research.md, Decisão 3). O único
ajuste necessário é no componente `ExercicioExecucao`, que passa a exibir a lista de séries
mesmo no ramo `jaEstavaConcluidoAoAbrir === true`.

## Comportamento observável (UI)

| Ação do usuário | Resultado | Acceptance Scenario relacionado |
|---|---|---|
| Abre um exercício com séries já concluídas (em andamento ou já concluído) | Vê a lista de séries com valores atuais e opção de editar cada uma | US1 Cenário 1, US2 Cenário 1 |
| Edita a série 1 estando na série 3 (exercício ainda em andamento) | Edição permitida normalmente, sem depender de qual é a "série atual" | US1 Cenário 2 |
| Confirma valores inválidos (campo vazio/inválido) | Botão de salvar edição permanece desabilitado; nenhum `Alert.alert` é exibido | Edge Case (validação) |
| Toca em "Salvar edição" com valores válidos | `Alert.alert` de confirmação aparece | US1 Cenário 3 |
| Confirma no `Alert.alert` | Valor é persistido e refletido imediatamente na lista | US1 Cenário 4 |
| Cancela no `Alert.alert` | Nenhuma alteração persistida; valor original continua exibido | US1 Cenário 5 |
| Edita uma série de um exercício já concluído (reaberto) | Exercício permanece concluído após a edição; nenhum botão de conclusão reaparece | US2 Cenário 2, 3 |
| Fecha e reabre o app após confirmar uma edição | Valor editado é o valor lido de `sessoes:<perfilId>` | US1 Cenário 6, SC-004 |
