# Feature Specification: Conclusão Explícita de Sessão de Treino

**Feature Branch**: `013-nova-sessao-treino`

**Created**: 2026-09-21

**Status**: Implemented (código pronto, validado via web; pendente validação real em Android/iOS)

**Requisito**: RF12 (PRD, seção 6 — pós-MVP)

**Nota**: Melhoria pós-desenvolvimento — não fazia parte do escopo original do MVP.
Solicitada pelo usuário após testar o app em uso real, como correção de fluxo.

**Input**: User description: "Após concluir uma sessão de treino, todos os exercícios
devem ficar sinalizados como concluídos (verdes) e habilitar um botão de 'Nova sessão
de Treino' para iniciar a nova sessão, igual o 'Iniciar exercício' já faz. O contador
não muda do lado de fora. Comportamento atual (investigado no código): ao concluir o
último exercício, um efeito automático finaliza a sessão E reseta a tela
imediatamente, fazendo os exercícios voltarem a aparecer como 'não iniciado' quase
instantaneamente — o usuário não consegue ver a lista toda verde nem o banner de
parabéns de forma estável."

**Confirmado com o usuário (2026-09-22)**: "o contador não muda do lado de fora"
significa que a sessão continua sendo finalizada e contada automaticamente assim que
o último exercício é concluído — o contador de sessões e o histórico não dependem do
botão "Nova sessão de Treino". Só o comportamento visual da tela de execução muda
(deixa de resetar sozinha). Esse é o pedido original do usuário para esta feature, não
apenas uma interpretação.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver a conquista de concluir todos os exercícios (Priority: P1)

O usuário está executando um treino e conclui o último exercício pendente. Ele espera
ver, de forma estável (sem a tela mudar sozinha), todos os exercícios da lista
marcados como concluídos — o mesmo indicador visual verde que já aparece em cada
exercício concluído individualmente — junto com o aviso de que o treino foi
finalizado.

**Why this priority**: É o problema relatado: hoje essa confirmação visual não é
percebida porque a tela se reseta sozinha antes do usuário conseguir vê-la
estabilizada. Sem isso, o usuário fica sem retorno claro de que o treino terminou.

**Independent Test**: Concluir todos os exercícios de um treino, um a um, e verificar
que, após concluir o último, a lista permanece visível com todos os itens marcados
como concluídos — sem voltar sozinha para o estado "não iniciado".

**Acceptance Scenarios**:

1. **Given** um treino com todos os exercícios, exceto o último, já concluídos,
   **When** o usuário conclui o último exercício pendente, **Then** a lista de
   exercícios passa a mostrar todos os itens com o indicador visual de concluído
   (verde), e permanece assim sem reverter sozinha.
2. **Given** todos os exercícios de um treino foram concluídos, **When** a tela de
   lista de exercícios é exibida, **Then** o aviso de "treino concluído" (banner de
   parabéns) continua visível até o usuário decidir começar de novo.

---

### User Story 2 - Decidir quando começar uma nova sessão do mesmo treino (Priority: P1)

Depois de ver todos os exercícios concluídos, o usuário decide, por conta própria,
quando quer começar a treinar esse mesmo treino de novo — por exemplo, em outro dia.
Ele faz isso apertando um botão explícito "Nova sessão de Treino", do mesmo jeito que
hoje ele aperta "Iniciar exercício" para começar cada exercício individualmente (nada
começa sozinho, sem ele pedir).

**Why this priority**: É a contrapartida necessária da User Story 1 — sem um gatilho
explícito para "recomeçar", a tela ficaria travada no estado de concluído para sempre.
Junto com a US1, entrega o valor completo desta feature.

**Independent Test**: Com todos os exercícios de um treino concluídos e a lista
estável (US1), apertar "Nova sessão de Treino" e verificar que a lista volta ao estado
"pronto para começar" (exercícios sem indicador de concluído, prontos para apertar
"Iniciar exercício" novamente).

**Acceptance Scenarios**:

1. **Given** todos os exercícios de um treino estão marcados como concluídos e o botão
   "Nova sessão de Treino" está visível, **When** o usuário aperta esse botão, **Then**
   a lista de exercícios volta ao estado inicial (nenhum exercício marcado como
   concluído), pronta para uma nova execução do mesmo treino.
2. **Given** o usuário ainda não concluiu todos os exercícios do treino, **When** ele
   olha a tela de lista de exercícios, **Then** o botão "Nova sessão de Treino" NÃO
   aparece — só aparece depois que todos os exercícios estiverem concluídos.

---

### User Story 3 - Contagem de sessões finalizadas continua correta (Priority: P1)

O contador de sessões finalizadas de um treino, mostrado na tela de lista de treinos,
continua contando corretamente cada sessão — sem depender de o usuário apertar "Nova
sessão de Treino". A sessão é considerada finalizada assim que o último exercício é
concluído, independente de quando (ou se) o usuário decide começar de novo depois.

**Why this priority**: Mesma prioridade das anteriores porque é uma garantia de
não-regressão sobre o histórico de sessões (RF08/RF09), que já depende de uma sessão
ser corretamente marcada como finalizada — quebrar isso quebraria o histórico de
evolução de carga já existente.

**Independent Test**: Concluir todos os exercícios de um treino sem apertar "Nova
sessão de Treino" em seguida (ex.: fechar o treino e voltar para a lista de treinos) e
verificar que o contador de sessões finalizadas daquele treino já aumentou em 1, e que
o registro aparece no histórico (RF08).

**Acceptance Scenarios**:

1. **Given** um treino com todos os exercícios concluídos, **When** o usuário conclui
   o último exercício, **Then** a sessão é finalizada e persistida imediatamente
   (contador de sessões e histórico atualizados), mesmo que o usuário ainda não tenha
   apertado "Nova sessão de Treino".
2. **Given** uma sessão já foi finalizada ao concluir o último exercício, **When** o
   usuário aperta "Nova sessão de Treino" depois, **Then** nenhuma sessão adicional é
   criada nesse momento — o botão apenas reseta a tela para permitir uma execução
   futura, que só vira uma nova sessão quando o usuário realmente começar a concluir
   exercícios de novo.

---

### Edge Cases

- O usuário conclui o último exercício, mas fecha o app (ou navega para outra tela)
  antes de apertar "Nova sessão de Treino" → a sessão já foi finalizada e persistida
  (User Story 3); ao voltar para o treino depois, a tela deve mostrar o estado de
  "pronto para começar" novamente (mesmo comportamento de reabertura já existente para
  treinos concluídos anteriormente), sem exigir que o botão tenha sido apertado.
- O usuário usa o botão "Finalizar treino" (já existente, para encerrar a sessão antes
  de concluir todos os exercícios) — esse botão continua existindo e seu comportamento
  não muda; ele não deve ser confundido com "Nova sessão de Treino", que só aparece
  depois que todos os exercícios já foram concluídos.
- O usuário conclui todos os exercícios, vê a tela estável, mas decide reabrir um
  exercício individual já concluído (fluxo de reabertura já existente) em vez de
  apertar "Nova sessão de Treino" → esse fluxo de reabertura individual continua
  funcionando como hoje, sem interferência desta feature.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE finalizar e persistir a sessão de treino automaticamente
  assim que o último exercício pendente é concluído — sem exigir nenhuma ação adicional
  do usuário para que a sessão conte no histórico e no contador de sessões finalizadas.
- **FR-002**: O sistema NÃO DEVE resetar automaticamente o estado visual da tela de
  lista de exercícios quando todos os exercícios são concluídos — a lista DEVE
  continuar mostrando todos os exercícios com o indicador de concluído até o usuário
  decidir agir.
- **FR-003**: O sistema DEVE exibir um botão "Nova sessão de Treino" quando, e somente
  quando, todos os exercícios do treino estiverem marcados como concluídos.
- **FR-004**: Ao apertar "Nova sessão de Treino", o sistema DEVE resetar o estado
  visual local da tela para o estado inicial (nenhum exercício marcado como
  concluído), permitindo iniciar cada exercício novamente — sem criar uma nova sessão
  nesse momento (a nova sessão só passa a existir quando o usuário voltar a concluir
  séries/exercícios).
- **FR-005**: O sistema DEVE manter o banner de "treino concluído" (parabéns) visível
  enquanto todos os exercícios estiverem concluídos e o usuário não tiver apertado
  "Nova sessão de Treino".
- **FR-006**: O botão "Finalizar treino" já existente (para encerrar a sessão antes de
  todos os exercícios concluídos) DEVE continuar se comportando exatamente como hoje,
  sem alteração por esta feature.

### Key Entities

- **Sessão de treino** (já existente, sem alteração de schema): o momento em que ela é
  considerada finalizada não muda (continua sendo quando o último exercício é
  concluído) — o que muda é apenas o comportamento visual da tela depois disso.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ao concluir o último exercício de um treino, o usuário consegue ver
  todos os exercícios marcados como concluídos de forma estável, sem a tela reverter
  sozinha, em 100% das execuções.
- **SC-002**: O contador de sessões finalizadas de um treino aumenta corretamente
  assim que o último exercício é concluído, independente de o usuário apertar "Nova
  sessão de Treino" em seguida — sem nenhuma mudança perceptível em relação ao
  comportamento já existente antes desta feature.
- **SC-003**: O usuário consegue iniciar uma nova execução do mesmo treino a qualquer
  momento depois de concluí-lo, com uma única ação explícita ("Nova sessão de
  Treino").

## Assumptions

- **Escopo visual, não de persistência**: esta feature não altera quando uma sessão é
  considerada finalizada para fins de histórico/contador (RF08/RF09) — apenas quando a
  tela de execução volta a ficar pronta para uma nova execução visualmente. Confirmado
  explicitamente pelo usuário (ver nota no cabeçalho da spec).
- **Reaproveita fluxo de reabertura já existente**: "começar de novo" depois de
  apertar "Nova sessão de Treino" usa a mesma lógica já existente para reabrir um
  treino já concluído anteriormente (campo `jaEstavaConcluidoAoAbrir` e cálculo de
  estados por sessão) — nenhum conceito novo de re-execução é introduzido.
- **Sem mudança de schema**: nenhum campo novo é adicionado à sessão de treino; a
  mudança é inteiramente de comportamento de UI na tela de execução
  (`src/app/treino/[treinoId].tsx`).
