# Research: Editar Registro de Série Já Feito (Sessão em Andamento)

**Feature**: 006-editar-serie-em-andamento | **Date**: 2026-09-17

Nenhum `[NEEDS CLARIFICATION]` restou na spec (todas as ambiguidades foram resolvidas por
defaults documentados na seção Assumptions). As decisões abaixo tratam de como encaixar a
feature no código já existente do RF04, sem introduzir conceitos novos.

## Decisão 1: Onde persistir a edição

**Decision**: Adicionar uma função `atualizarSerieRealizada` em `sessao-treino-storage.ts`
(mesmo arquivo do RF04), que localiza a sessão por `treinoId`, a execução por `exercicioId`,
e a série por `serie` (número), substituindo apenas `cargaKg`/`reps` do objeto encontrado.

**Rationale**: Reaproveita o mesmo padrão já estabelecido por `registrarSerieConcluida` e
`marcarExercicioConcluido` (buscar sessão → buscar execução → mutar → `setSessoes`), mesma
chave (`sessoes:<perfilId>`), mesmo arquivo. Não há necessidade de um serviço novo — a
edição é apenas mais uma operação de escrita sobre a mesma estrutura.

**Alternatives considered**:
- Criar um serviço/arquivo separado (`edicao-serie-storage.ts`): rejeitado — seria uma
  duplicação de acesso à mesma chave de storage, violando o Princípio II (simplicidade) sem
  ganho real, já que a lógica de leitura/escrita é idêntica à já existente.
- Reaproveitar `registrarSerieConcluida` para também editar (ex.: parâmetro `sobrescrever:
  boolean`): rejeitado — `registrarSerieConcluida` sempre incrementa (`push`) uma nova série
  e recalcula `status`; misturar os dois comportamentos numa única função tornaria a
  assinatura ambígua e arriscaria alterar `status` acidentalmente durante uma edição (o que
  a spec proíbe explicitamente em FR-008).

## Decisão 2: Confirmação antes de salvar

**Decision**: Usar `Alert.alert` do módulo `react-native` (já importado indiretamente via
outros componentes do projeto; API nativa, sem dependência nova), com dois botões
("Cancelar" / "Salvar"), disparado no momento em que o usuário confirma os novos valores de
carga/reps na UI de edição (antes de chamar o serviço de persistência).

**Rationale**: `Alert.alert` é a forma mais simples e nativa (Android + iOS) de obter uma
confirmação bloqueante, consistente com o Princípio II e IV (nenhuma dependência nova) e com
o requisito explícito do usuário de usar "diálogo nativo (`Alert.alert`)". Evita construir um
modal customizado só para esta confirmação.

**Alternatives considered**:
- Modal customizado (`Modal` do RN ou biblioteca de UI): rejeitado — maior superfície de
  código e manutenção para uma confirmação simples de aceitar/cancelar; não solicitado pelo
  PRD/critérios de aceite, que só exigem "pedir confirmação".
- Confirmação inline (ex.: botão "Salvar" vira "Confirmar salvar?" por 3 segundos):
  rejeitado — foge do padrão de confirmação claro e explícito esperado pelos critérios de
  aceite do RF09a ("o app pede confirmação antes de salvar uma edição").

## Decisão 3: Reabertura de exercício já concluído para visualização/edição

**Decision**: Em `[treinoId].tsx`, a função `handleSelecionarExercicio` já define
`reaberturaJaConcluida` com base em `estadosPorExercicio[exercicioId]?.concluido`; essa
lógica é mantida sem alteração. A mudança necessária é em `ExercicioExecucao`
(`exercicio-execucao.tsx`): hoje, quando `estado.concluido && jaEstavaConcluidoAoAbrir`, o
componente renderiza apenas uma mensagem estática ("Este já foi feito, volte no próximo
treino"), sem exibir a lista de séries. Esta feature adiciona a lista de séries concluídas
(com ação de editar) também nesse ramo, sem alterar a mensagem existente nem o fluxo de
"Concluir exercício" (que já está corretamente ausente nesse ramo, pois o exercício já foi
concluído anteriormente).

**Rationale**: Não requer nenhuma mudança na máquina de estados de conclusão já definida no
RF04 (`concluido`, `jaEstavaConcluidoAoAbrir`) — apenas adiciona uma superfície de
visualização/edição dentro de um ramo de renderização já existente e já isolado do fluxo de
conclusão. Isso satisfaz diretamente FR-008/FR-009 (a edição não pode alterar o status de
conclusão): como não há nenhum caminho de código nesse ramo que chame
`marcarExercicioConcluido` ou `registrarSerieConcluida`, é estruturalmente impossível a
edição reverter o status.

**Alternatives considered**:
- Permitir reabrir o exercício concluído no modo "normal" (`estado.concluido &&
  !jaEstavaConcluidoAoAbrir`, que hoje mostra o botão "Concluir exercício"): rejeitado — esse
  ramo é destinado ao momento em que o usuário acabou de concluir a última série *nesta*
  visita à tela, distinto de reabrir um exercício já concluído anteriormente; usá-lo para
  edição arriscaria expor "Concluir exercício" novamente (que já foi tocado), quebrando a
  premissa de FR-008.

## Decisão 4: Identificação da série a editar

**Decision**: Cada `SerieRealizada` é identificada, para fins de edição, pelo seu campo
`serie` (número, 1-indexado, já único dentro de `seriesRealizadas` de um mesmo
`ExecucaoExercicio`, garantido pela forma como `registrarSerieConcluida` as insere em
sequência). Não é necessário nenhum campo de identidade novo (ex.: `id` gerado).

**Rationale**: `serie` já cumpre o papel de chave natural dentro do array — o RF04 nunca
insere duas séries com o mesmo número para o mesmo exercício/sessão. Introduzir um `id`
adicional seria uma estrutura de dados nova não justificada (viola Princípio II).

**Alternatives considered**:
- Usar o índice do array (`seriesRealizadas[i]`) diretamente: rejeitado como identificador de
  UI/callback — funciona internamente, mas `serie` é mais explícito e já é o valor exibido ao
  usuário ("Série 1", "Série 2"), evitando depender da ordem do array permanecer estável.

## Decisão 5: Validação de entrada na edição

**Decision**: Reaproveitar exatamente `sanitizarCarga` e `sanitizarReps`, já definidas em
`exercicio-execucao.tsx` (RF03/RF04), para os campos de edição — mesmas regras (carga aceita
decimal com `,`/`.` normalizado; reps aceita apenas dígitos).

**Rationale**: Elimina qualquer risco de divergência de comportamento entre o preenchimento
original de uma série e sua edição (o critério de aceite do RF09a não pede novas regras de
validação, apenas reaplicação das já existentes do RF03).

**Alternatives considered**: Nenhuma — reaproveitar funções puras já existentes é a única
opção consistente com o Princípio II.
