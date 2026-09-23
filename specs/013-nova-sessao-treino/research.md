# Phase 0 Research: Conclusão Explícita de Sessão de Treino

**Feature**: `013-nova-sessao-treino` | **Date**: 2026-09-22

A spec não tem nenhum `[NEEDS CLARIFICATION]` pendente — a única ambiguidade real
("o contador não muda do lado de fora") foi confirmada explicitamente pelo usuário e
já está registrada no cabeçalho de `spec.md`. As decisões abaixo cobrem os pontos
técnicos derivados dessa confirmação.

## Decisão 1: Desacoplar "finalizar sessão" de "resetar a tela"

**Decision**: Em `src/app/treino/[treinoId].tsx`, o `useEffect` que hoje detecta
`todosConcluidos` e chama `handleFinalizarTreino()` (que finaliza a sessão E reseta o
estado local na mesma função) é substituído por um efeito que **só** finaliza a sessão
(`finalizarSessao(perfilId, sessaoAtualId)`), sem tocar em `sessaoAtualId`,
`estadosPorExercicio` ou `exercicioSelecionadoId`. O reset desses três estados passa a
viver exclusivamente em um novo handler, `handleNovaSessaoDeTreino`, disparado só pelo
novo botão.

**Rationale**: é exatamente o comportamento confirmado pelo usuário — a persistência
(contador, histórico) continua automática, só o reset visual passa a depender de uma
ação explícita.

**Alternatives considered**: manter tudo em `handleFinalizarTreino` e só adiar a
chamada — rejeitado, porque misturaria a responsabilidade de "finalizar" (deve ser
automático) com "resetar a UI" (deve ser manual), tornando o código mais difícil de
raciocinar do que simplesmente separar as duas responsabilidades em funções distintas.

## Decisão 2: Guarda contra finalização repetida

**Decision**: Novo estado local `sessaoFinalizadaAutomaticamente: boolean` (inicial
`false`). O efeito de finalização automática só dispara quando `todosConcluidos &&
sessaoAtualId !== null && !sessaoFinalizadaAutomaticamente`, e marca esse estado como
`true` assim que dispara. É resetado para `false` junto com os demais estados, tanto
em `handleNovaSessaoDeTreino` quanto em `handleFinalizarTreino` (finalização manual
antecipada).

**Rationale**: `finalizarSessao` (já existente) é idempotente (retorna a sessão sem
reescrever se `finalizadaEm` já estiver preenchido), então tecnicamente seria seguro
chamá-la repetidas vezes sem essa guarda. Mas sem ela, qualquer re-render que altere
`estadosPorExercicio` depois de tudo concluído (ex.: editar a carga de uma série já
concluída, fluxo já existente do RF09a) dispararia uma leitura+escrita desnecessária
no `AsyncStorage` a cada edição. A guarda evita esse I/O redundante sem adicionar
complexidade real (Princípio II).

**Alternatives considered**: nenhuma guarda, confiando só na idempotência do
`finalizarSessao` — rejeitado por gerar I/O desnecessário em um caminho que pode ser
acionado várias vezes (edição de série já concluída).

## Decisão 3: Condição de exibição do botão "Finalizar treino" existente

**Decision**: O botão "Finalizar treino" (já existente, estilo `warning`, para encerrar
a sessão antes de todos os exercícios concluídos) passa a exigir também
`!todosConcluidos` na condição de exibição (antes: só `sessaoAtualId`). Uma vez que
todos os exercícios estão concluídos, esse botão desaparece e dá lugar ao novo botão
"Nova sessão de Treino".

**Rationale**: FR-006 da spec exige que o botão "Finalizar treino" continue se
comportando exatamente como hoje **enquanto existir exercício pendente** — mas ele
nunca fazia sentido simultâneo com "todos concluídos" (finalizar manualmente algo que
já terminou é redundante); antes da mudança, essa sobreposição nunca era visível na
prática porque o reset automático escondia o cenário. Agora que a tela permanece
estável, a condição precisa ficar explícita para não mostrar os dois botões ao mesmo
tempo.

**Alternatives considered**: manter os dois botões visíveis simultaneamente quando
`todosConcluidos` — rejeitado, gera confusão de UI (duas ações concorrentes sem
diferença clara de efeito nesse estado).

## Decisão 4: Reaproveitar o componente `Button` e o padrão visual já validado

**Decision**: O botão "Nova sessão de Treino" usa o componente `Button`
(`src/components/ui/button.tsx`, variante `primary`), criado nesta mesma sessão de
trabalho para as melhorias de layout — mesmo padrão do botão "Iniciar exercício"
citado como referência pelo próprio usuário no pedido original.

**Rationale**: feedback do usuário já registrado em memória ("gostei muito do layout,
bote manter este nível") — reaproveitar o componente existente evita duplicar
Pressable/estilo ad-hoc e mantém consistência visual.

**Alternatives considered**: nenhuma — não haveria razão para introduzir um novo
padrão visual quando o existente já cobre o caso.

## Decisão 5: `marcarExercicioConcluido` precisa localizar a sessão por `sessaoId`, não por "sessão em andamento" (achado durante a implementação)

**Decision**: `marcarExercicioConcluido` (`src/services/sessao-treino-storage.ts`) deixa
de receber `treinoId` e buscar `sessoes.find(item => item.treinoId === treinoId &&
item.finalizadaEm === null)`; passa a receber `sessaoId` diretamente e buscar por
`item.id === sessaoId` — mesmo padrão já usado por `finalizarSessao` e
`atualizarSerieDeSessaoFinalizada`. O chamador (`handleConcluirExercicio`, em
`[treinoId].tsx`) passa `sessaoAtualId` (já disponível no estado da tela) em vez de
`treino.id`.

**Rationale**: bug real encontrado ao testar esta feature. Como o efeito de
finalização automática (Decisão 1) agora depende só de `estadosPorExercicio` — que já
marca um exercício como `concluido: true` assim que sua última série é registrada,
**antes** do usuário apertar "Concluir exercício" — o `todosConcluidos` pode virar
`true`, e a sessão ser finalizada (`finalizadaEm` preenchido), **enquanto o usuário
ainda está vendo a tela do último exercício com o botão "Concluir exercício" visível**.
Ao tocar nesse botão, `marcarExercicioConcluido` (versão antiga) não encontrava mais
nenhuma sessão com `finalizadaEm === null` para aquele treino e lançava uma exceção.

Antes desta feature, esse mesmo race já existia tecnicamente, mas era mascarado: o
efeito antigo resetava `exercicioSelecionadoId` para `null` junto com tudo mais,
fazendo a tela voltar sozinha para a lista antes que o usuário conseguisse tocar em
"Concluir exercício" do último exercício — na prática, esse botão nunca chegava a ser
pressionado para o último exercício de uma sessão. Como esta feature *propositalmente*
para de resetar a tela sozinha (FR-002), o botão passa a ficar visível e clicável, e o
race vira 100% reproduzível.

**Alternatives considered**: manter a busca por `treinoId +
finalizadaEm === null` e só reordenar o efeito de finalização para disparar depois —
rejeitado, pois não existe uma ordem de execução confiável entre um `useEffect` (que
roda depois da renderização) e um toque físico do usuário na tela (evento
independente) — a única forma robusta é fazer `marcarExercicioConcluido` não depender
de "a sessão ainda estar em andamento" para operar, já que agora é um estado legítimo
tentar marcar o último exercício como concluído em uma sessão que acabou de ser
finalizada no mesmo instante.

## Resumo das entidades técnicas afetadas

- `src/app/treino/[treinoId].tsx`: novo estado `sessaoFinalizadaAutomaticamente`; o
  `useEffect` de auto-finalização é reescrito (Decisão 1 e 2); novo handler
  `handleNovaSessaoDeTreino`; condição do botão "Finalizar treino" ajustada (Decisão
  3); novo botão "Nova sessão de Treino" usando `Button` (Decisão 4).
- Nenhum arquivo de serviço (`sessao-treino-storage.ts`) precisa mudar —
  `finalizarSessao` já existe e já é idempotente, exatamente como esta feature precisa.
- Nenhuma alteração de schema de dados (sessão persistida continua igual).
