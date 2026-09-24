# Feature Specification: Progresso do Ciclo de Treinos (Múltiplos Treinos)

**Feature Branch**: `018-progresso-ciclo`

**Created**: 2026-09-23

**Status**: Draft — esclarecimentos resolvidos em 2026-09-23, pronta para `/speckit.plan`

**Requisito**: RF15 (PRD, seção 6 — pós-MVP; número confirmado em 2026-09-23 ao
registrar no PRD — era citado provisoriamente como "RF17" antes disso, já que
016/017 ainda não tinham sido registradas; como esta spec chegou primeiro à etapa
de registro, ficou com o próximo número livre real. RF15/RF16 continuam
reservados — 016 e 017 serão renumeradas para RF16/RF17 quando forem registradas)

**Nota**: Melhoria pós-desenvolvimento — não fazia parte do escopo original do MVP.
Ideia registrada durante os testes de campo do RF11-RF14 (ver roadmap pós-MVP), agora
solicitada formalmente. Depende do RF11 (importação de múltiplos treinos) já
implementado.

**Input**: User description: "Indicador de progresso de um conjunto de treinos
(arquivo com múltiplos treinos, RF11) ao longo de um ciclo fixo de 8 semanas,
assumindo 5 dias de treino por semana (40 sessões esperadas no total, fixo para todos
os perfis). O ciclo começa a contar automaticamente no momento em que o arquivo com
múltiplos treinos é importado (RF11) — não é necessário nenhuma confirmação manual do
usuário. Os N treinos do arquivo se distribuem o mais uniformemente possível entre os
40 slots esperados (ex: 5 treinos = 8 execuções esperadas cada; 3 treinos = ~13
execuções esperadas cada, com a diferença absorvida o mais equilibradamente possível
entre eles). Exibir um indicador visual (anel ou barra de progresso, reaproveitando o
componente já existente em src/components/ui/progress-ring.tsx da identidade visual)
mostrando sessões completadas vs. as 40 esperadas no ciclo atual."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver o progresso do ciclo atual de treinos (Priority: P1)

O usuário importou um arquivo com vários treinos (ex.: A, B, C, D, E de um programa de
academia) e, ao longo das semanas, quer ver visualmente o quanto já avançou no
programa completo — não só quantas vezes executou cada treino isoladamente (RF11), mas
o progresso do conjunto todo dentro do período de referência (8 semanas).

**Why this priority**: É o problema relatado — hoje o contador de sessões (RF11) mostra
quantas vezes CADA treino foi feito, mas não dá noção de progresso dentro de um ciclo
com prazo, o que dificulta perceber se o usuário está no ritmo esperado.

**Independent Test**: Importar um arquivo com múltiplos treinos, finalizar algumas
sessões de treinos desse lote, e confirmar que um indicador visual mostra o total de
sessões finalizadas em relação às 40 esperadas do ciclo.

**Acceptance Scenarios**:

1. **Given** um arquivo com múltiplos treinos acabou de ser importado, **When** a
   importação é concluída, **Then** um ciclo de progresso começa a contar
   automaticamente, sem nenhuma confirmação adicional do usuário.
2. **Given** um ciclo em andamento com N treinos, **When** o usuário finaliza uma
   sessão de qualquer um dos treinos desse lote, **Then** o indicador de progresso do
   ciclo é atualizado, contando essa sessão entre as 40 esperadas.
3. **Given** um arquivo importado com um único treino (não múltiplos), **When** o
   usuário finaliza sessões desse treino, **Then** nenhum ciclo de progresso é criado
   nem exibido para esse treino — o indicador desta feature só existe para lotes de
   múltiplos treinos (RF11).

---

### User Story 2 - Distribuir a expectativa de execuções entre os treinos do lote (Priority: P2)

Dentro de um ciclo com N treinos, o usuário quer que a "cota" esperada de execuções
seja dividida de forma justa entre os treinos do lote, mesmo quando 40 não é
perfeitamente divisível por N.

**Why this priority**: Suporta o cálculo do progresso geral (US1) e evita que a lógica
de distribuição pareça arbitrária; prioridade menor que US1 porque é um detalhe de
cálculo, não a funcionalidade visível principal.

**Independent Test**: Importar um arquivo com 3 treinos e confirmar que a distribuição
esperada entre eles soma exatamente 40, com a diferença absorvida da forma mais
equilibrada possível (nenhum treino recebendo muito mais que os outros).

**Acceptance Scenarios**:

1. **Given** um arquivo com 5 treinos, **When** o ciclo é calculado, **Then** cada um
   dos 5 treinos tem uma expectativa de 8 execuções (40 ÷ 5).
2. **Given** um arquivo com 3 treinos, **When** o ciclo é calculado, **Then** a
   expectativa somada dos 3 treinos é exatamente 40, distribuída o mais igualmente
   possível entre eles (ex.: 14/13/13, não 20/10/10).

---

### Edge Cases

- Um arquivo com múltiplos treinos é importado, mas o usuário nunca finaliza nenhuma
  sessão → o indicador mostra o ciclo em 0 de 40, sem erro.
- Um treino específico do lote é executado muito mais que sua cota individual
  esperada (ex.: cota de 8, mas o usuário já fez 15 sessões só desse treino) → essas
  execuções extras continuam contando para o total geral do ciclo (rumo às 40), mesmo
  já tendo ultrapassado a cota individual daquele treino especificamente.
- Um dos treinos do lote é excluído depois de importado (funcionalidade já existente,
  fora do escopo desta feature) → suas sessões já finalizadas continuam contando para
  o total do ciclo; apenas deixa de ser possível gerar novas sessões daquele treino
  específico.
- Um segundo arquivo de múltiplos treinos é importado enquanto um ciclo anterior ainda
  está em andamento (menos de 40 sessões finalizadas) → **Resolvido em 2026-09-23**: a
  importação é bloqueada/rejeitada, com uma mensagem explicando que já existe um ciclo
  em andamento (FR-007).
- O ciclo atinge as 40 sessões esperadas → **Resolvido em 2026-09-23**: o ciclo não é
  interrompido nem reiniciado automaticamente — continua contando qualquer sessão
  finalizada adicional dos treinos do lote além de 40, e o sistema passa a exibir uma
  mensagem de aviso ("Hora de trocar o treino — X sessões já realizadas", X = total do
  ciclo) enquanto esse continuar sendo o ciclo do perfil (FR-008).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Ao importar com sucesso um arquivo com múltiplos treinos (RF11, 2 ou
  mais treinos válidos), o sistema DEVE iniciar automaticamente um ciclo de progresso
  para esse lote de treinos, sem exigir nenhuma ação de confirmação do usuário.
- **FR-002**: Um ciclo DEVE ter uma expectativa total fixa de 40 sessões finalizadas
  (equivalente a 8 semanas de 5 dias de treino), igual para todos os perfis e todos os
  ciclos.
- **FR-003**: A expectativa de 40 sessões DEVE ser distribuída entre os N treinos do
  lote da forma mais equilibrada possível — quando 40 não for divisível igualmente por
  N, a diferença (resto da divisão) é distribuída entre os treinos de forma que nenhum
  treino receba mais de 1 execução esperada a mais que outro do mesmo lote.
- **FR-004**: Um arquivo importado com um único treino (não um lote de múltiplos)
  NÃO DEVE iniciar nenhum ciclo de progresso — esta feature se aplica exclusivamente a
  importações de múltiplos treinos (RF11).
- **FR-005**: Toda sessão finalizada (RF07) de qualquer treino pertencente a um lote
  com ciclo ativo DEVE contar para o total de sessões finalizadas desse ciclo.
- **FR-006**: **Resolvido em 2026-09-23**: o indicador visual de progresso DEVE ser
  exibido **por treino**, na lista "Meus Treinos" — cada treino pertencente a um lote
  com ciclo ativo mostra seu próprio progresso individual (sessões finalizadas desse
  treino específico em relação à sua cota individual dentro do ciclo, US2), não um
  indicador único agregado para o ciclo inteiro.
- **FR-007**: Enquanto um ciclo tiver menos de 40 sessões finalizadas (ciclo "em
  andamento"), uma nova importação de arquivo com múltiplos treinos DEVE ser
  bloqueada, com uma mensagem informando que já existe um ciclo em andamento para
  aquele perfil.
- **FR-008**: Ao atingir 40 sessões finalizadas, o ciclo DEVE continuar contando
  qualquer sessão finalizada adicional dos treinos do lote (sem limite, sem reiniciar
  automaticamente) e o sistema DEVE exibir uma mensagem de aviso — "Hora de trocar o
  treino — X sessões já realizadas", onde X é o total de sessões finalizadas do ciclo
  (podendo ultrapassar 40).
- **FR-009**: A partir do momento em que um ciclo atinge 40 sessões finalizadas, ele
  deixa de bloquear novas importações (FR-007 deixa de se aplicar a ele) — uma nova
  importação de múltiplos treinos volta a ser permitida e, ao acontecer, inicia um
  novo ciclo (FR-001), tornando-se o ciclo atual do perfil.

### Key Entities

- **Ciclo de Treinos** (novo): representa o acompanhamento de progresso de um lote de
  treinos importado junto (RF11). Atributos: os treinos que pertencem ao lote, a
  expectativa individual de execuções de cada um (US2), o total de sessões finalizadas
  já contabilizadas para o ciclo (podendo ultrapassar 40, FR-008), a expectativa fixa
  total (40), e se o ciclo está "em andamento" (< 40, bloqueia novas importações,
  FR-007) ou "concluído" (≥ 40, não bloqueia mais, FR-009). Um treino importado
  sozinho (fora de um lote de múltiplos) nunca pertence a um Ciclo de Treinos. Um
  perfil tem no máximo um Ciclo de Treinos "em andamento" por vez (FR-007); pode ter
  ciclos "concluídos" anteriores, que deixam de ser o ciclo atual assim que um novo é
  criado (FR-009).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das importações de múltiplos treinos (RF11) geram um ciclo de
  progresso visível, sem nenhuma ação manual adicional do usuário.
- **SC-002**: Em 100% dos ciclos, a soma das expectativas individuais de execução de
  todos os treinos do lote é exatamente 40.
- **SC-003**: 100% das sessões finalizadas de treinos de um lote com ciclo ativo são
  refletidas no indicador de progresso individual do treino correspondente (FR-006).
- **SC-004**: 100% dos treinos importados individualmente (fora de um lote de
  múltiplos) não exibem nenhum indicador de ciclo.
- **SC-005**: 100% das tentativas de importar um novo lote de múltiplos treinos
  enquanto há um ciclo "em andamento" (< 40 sessões) são bloqueadas, com uma mensagem
  explicando o motivo.
- **SC-006**: 100% dos ciclos que atingem 40 sessões finalizadas passam a exibir a
  mensagem de aviso para trocar de treino, mostrando o total real de sessões
  (inclusive além de 40).

## Assumptions

- **Reaching 40 marca o fim do bloqueio, não o fim do ciclo** (confirmado pelo usuário
  em 2026-09-23): síntese das respostas do usuário às duas perguntas em aberto —
  bloquear novas importações "enquanto houver ciclo ativo" (Q1) só faz sentido
  operacionalmente se existir um momento em que o ciclo deixa de "bloquear"; como o
  próprio usuário definiu que o ciclo não se encerra sozinho ao chegar em 40, apenas
  passa a mostrar um aviso (Q2), a leitura adotada é que atingir 40 sessões é o que
  libera uma nova importação (FR-009), mesmo o ciclo antigo continuando a
  existir/contar em segundo plano até ser substituído. Inferência feita para
  reconciliar as duas respostas, sem estar dita explicitamente na resposta original —
  confirmada correta pelo usuário, não é mais uma suposição em aberto.
- **Duração e cadência fixas**: 8 semanas e 5 dias de treino por semana são valores
  fixos do produto (não configuráveis por perfil ou por lote nesta rodada), conforme
  já descrito no pedido original.
- **Contagem por sessão finalizada, não por sessão iniciada**: uma sessão só conta
  para o ciclo quando finalizada (RF07), mesmo critério já usado pelo contador de
  sessões do RF11.
