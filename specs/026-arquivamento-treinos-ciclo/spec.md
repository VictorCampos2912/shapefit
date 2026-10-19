# Feature Specification: Arquivamento Lógico de Treinos, "Encerrar Ciclo" e Tratamento de Sessões Abandonadas

**Feature Branch**: `026-arquivamento-treinos-ciclo`

**Created**: 2026-10-16

**Status**: Draft

**Requisito**: RF25 (PRD, seção 6 — nova entrada; número confirmado em
2026-10-16 ao consultar a tabela, a última entrada existente é RF24). **RF
novo**, não emenda a um RF existente — mesmo precedente do RF23/RF24, que
também estendem vários RFs anteriores mas ganharam número próprio por
introduzirem comportamento novo e visível, não só migração/ajuste interno.
Estende RF02 (lista de treinos), RF08 (histórico por exercício), RF15
(ciclo de progresso), RF18 (histórico por data) e RF24 (armazenamento no
Firestore).

**Input**: User description: "Arquivamento lógico de treinos, 'Encerrar
ciclo' e tratamento de sessões abandonadas — ver contexto completo abaixo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Arquivar um treino sem perder histórico (Priority: P1)

O usuário importou muitos treinos ao longo do tempo (testes e uso real) e
hoje não tem como tirá-los da lista "Meus treinos" — a lista só cresce. Ele
precisa conseguir arquivar um treino que não usa mais, fazendo-o
desaparecer da lista e de qualquer lugar onde poderia iniciar uma nova
execução, sem que isso apague nenhum dos registros de evolução (séries,
cargas, datas) já feitos nesse treino.

**Why this priority**: é o problema mais citado pelo usuário ("hoje importa
muitos treinos... e não tem como tirá-los da lista") e o que mais afeta o
uso diário do app — uma lista "Meus treinos" poluída dificulta achar o
treino certo.

**Independent Test**: com um treino que já tem sessões finalizadas,
arquivá-lo e confirmar que ele some da lista "Meus treinos" e da tela de
execução, enquanto o histórico desse treino continua mostrando as sessões
antigas normalmente.

**Acceptance Scenarios**:

1. **Given** um treino aparece em "Meus treinos", **When** o usuário aciona
   "Arquivar" (a partir da lista ou de dentro do próprio treino) e confirma,
   **Then** o treino desaparece imediatamente da lista "Meus treinos",
   sem precisar fechar/reabrir o app.
2. **Given** um treino arquivado que já teve sessões finalizadas,
   **When** o usuário abre o histórico ("Por exercício" ou "Por data"),
   **Then** todas as sessões e séries já registradas desse treino continuam
   aparecendo normalmente, com o nome do treino/exercício no momento em que
   a sessão foi feita (snapshot, RF24).
3. **Given** um treino foi arquivado, **When** o usuário tenta abrir a tela
   de execução desse treino (por qualquer caminho, incluindo navegação
   direta residual), **Then** o sistema impede a execução e informa que o
   treino está arquivado, em vez de permitir iniciar ou continuar uma
   sessão.
4. **Given** um treino arquivado faz parte de um ciclo de progresso ainda
   ativo, **When** o usuário olha "Meus treinos", **Then** nenhum anel de
   progresso daquele treino aparece (porque o item inteiro não aparece),
   mas as sessões finalizadas que ele já tinha continuam contando para o
   total de 40 sessões do ciclo.

---

### User Story 2 - Ver e restaurar treinos arquivados (Priority: P1)

Arquivar não pode ser uma armadilha: o usuário precisa conseguir ver quais
treinos arquivou e trazer algum de volta para "Meus treinos" caso tenha se
arrependido ou volte a usá-lo.

**Why this priority**: sem essa capacidade, o arquivamento da User Story 1
seria, na prática, irreversível pela interface — o usuário teria que pedir
ajuda fora do app (Console do Firebase) para desfazer um arquivamento, o
que contraria a decisão explícita de que isso é uma exclusão **lógica**.

**Independent Test**: arquivar um treino, abrir a lista de treinos
arquivados, restaurá-lo e confirmar que ele volta a aparecer em "Meus
treinos" com todo o histórico, cota de ciclo e indicadores intactos.

**Acceptance Scenarios**:

1. **Given** o usuário tem um ou mais treinos arquivados, **When** ele
   acessa a lista de treinos arquivados (pelo menu de Ações, mesmo lugar
   de "Importar treino"/"Encerrar ciclo"), **Then** vê todos os treinos
   arquivados, cada um com uma ação para restaurar.
2. **Given** um treino está na lista de arquivados, **When** o usuário o
   restaura, **Then** ele volta a aparecer em "Meus treinos" imediatamente,
   com o histórico, contador de sessões e indicador de ciclo (se ainda
   fizer parte de um ciclo ativo) exatamente como estavam antes de ser
   arquivado.

---

### User Story 3 - Encerrar um ciclo de progresso manualmente (Priority: P2)

Hoje um ciclo de 40 sessões só é considerado concluído ao atingir
exatamente 40 sessões finalizadas, e enquanto isso a importação de um novo
lote de múltiplos treinos fica bloqueada. O usuário precisa de uma ação
manual para encerrar o ciclo atual a qualquer momento, liberando a
importação de um novo lote, sem apagar nenhuma sessão já registrada.

**Why this priority**: resolve um bloqueio real e explícito ("tem como
desbloquear a importação"), mas depende menos de uso diário que arquivar
treinos — o usuário troca de ciclo com bem menos frequência do que organiza
a lista de treinos.

**Independent Test**: com um ciclo ativo (menos de 40 sessões), encerrá-lo
manualmente e confirmar que a importação de um novo lote de múltiplos
treinos passa a funcionar, enquanto as sessões do ciclo encerrado continuam
aparecendo no histórico.

**Acceptance Scenarios**:

1. **Given** existe um ciclo de progresso ativo (encerrado ou não ao
   atingir 40), **When** o usuário aciona "Encerrar ciclo" e confirma,
   **Then** o ciclo é marcado como encerrado (nunca apagado), os anéis de
   progresso somem de "Meus treinos" e o aviso "Hora de trocar o treino"
   (quando aplicável) some junto.
2. **Given** um ciclo foi encerrado, **When** o usuário importa um novo
   arquivo com múltiplos treinos, **Then** a importação funciona
   normalmente (sem a mensagem de bloqueio), mesmo que o ciclo encerrado
   tivesse menos de 40 sessões finalizadas.
3. **Given** um ciclo foi encerrado, **When** o usuário consulta o
   histórico ou os contadores de sessões dos treinos que faziam parte dele,
   **Then** tudo continua exatamente como antes — encerrar o ciclo não
   afeta nenhuma sessão nem contador, só a cota/anel de progresso e o
   bloqueio de importação.

---

### User Story 4 - Tratar uma sessão iniciada e nunca finalizada (Priority: P3)

Uma sessão iniciada (com ao menos uma série registrada) e nunca finalizada
fica destacada como "Em andamento" indefinidamente — hoje a única forma de
resolver isso é abrir especificamente aquele treino e tocar em "Finalizar
treino". O usuário precisa de uma forma mais direta de encerrar uma sessão
assim, sem perder as séries já registradas.

**Why this priority**: é uma limitação já aceita e convivida nas specs
024/025 (não é um bug novo), então tem prioridade menor que arquivar/
encerrar ciclo — mas fica mais visível agora que o arquivamento (User
Story 1) precisa decidir o que fazer com um treino arquivado que tem uma
sessão assim (ver Edge Cases e FR-010/FR-011).

**Independent Test**: com uma sessão "Em andamento" de um treino que o
usuário não pretende continuar, finalizá-la pela nova ação direta e
confirmar que ela some do destaque "Em andamento" em "Meus treinos", com as
séries já registradas preservadas no histórico.

**Acceptance Scenarios**:

1. **Given** um treino está destacado como "Em andamento" em "Meus
   treinos", **When** o usuário aciona a forma de encerrar essa sessão
   definida em FR-011, **Then** a sessão é finalizada com as séries já
   registradas (mesmo comportamento de "Finalizar treino" hoje) e o
   destaque "Em andamento" some.
2. **Given** uma sessão foi finalizada dessa forma, **When** o usuário
   consulta o histórico, **Then** a sessão aparece normalmente, como
   qualquer outra sessão finalizada manualmente.

---

### Edge Cases

- Um treino arquivado que já tinha sessão "Em andamento" no momento do
  arquivamento: arquivar finaliza automaticamente essa sessão (preservando
  as séries já registradas, FR-010), para nunca deixar uma sessão "Em
  andamento" órfã, presa a um treino que não aparece mais em lugar nenhum.
- Um treino arquivado é o único do lote de um ciclo ativo que ainda não
  bateu sua cota individual: a cota desse treino **não é redistribuída**
  entre os demais treinos do ciclo — simplicidade sobre o cálculo (as
  sessões que esse treino já tinha continuam contando no total de 40; só
  não é mais possível registrar novas sessões dele enquanto estiver
  arquivado, a não ser que seja restaurado).
- Dois ciclos "atuais" nunca coexistem: encerrar o ciclo atual não reabre
  automaticamente nenhum ciclo anterior — o próximo lote de múltiplos
  treinos importado cria um ciclo novo, independente do(s) encerrado(s).
- "Ciclo atual" passa a significar, depois desta spec, "o **último** ciclo
  criado, e só ele, se não estiver encerrado" — hoje significa
  simplesmente "o último criado". **Nunca** "o último entre os não
  encerrados" (isso reabriria um ciclo antigo que já tinha chegado a 40
  sessões mas nunca foi encerrado manualmente — não existe encerramento
  automático ao bater 40 — no momento em que o ciclo mais novo fosse
  encerrado): ciclos anteriores nunca reabrem, mesmo que algum deles
  também esteja com `encerradoEm` nulo. Essa mudança de definição é o que
  faz o bloqueio de importação (RF15) parar de disparar depois de
  "Encerrar ciclo", sem precisar mudar a lógica de bloqueio em si.
- Arquivar/restaurar/encerrar ciclo offline: a ação MUST funcionar sem rede
  (mesma persistência offline nativa do Firestore já usada em todo o resto
  do app), refletindo na tela imediatamente e sincronizando ao reconectar —
  nenhuma UI trava esperando o servidor.
- Sessão sem nenhuma série registrada: nunca existe como documento
  persistido (herdado da spec 025 — a sessão só é criada ao concluir a
  primeira série) — não há cenário de "abandonar" uma sessão vazia, porque
  ela nunca chega a existir.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir arquivar um treino a partir da lista
  "Meus treinos" e também a partir da própria tela do treino, com uma
  confirmação explícita antes de efetivar.
- **FR-002**: Arquivar um treino MUST ser uma marcação lógica (ex.: um
  campo de data de arquivamento no próprio treino) — o documento do treino
  nunca é removido do Firestore.
- **FR-003**: Um treino arquivado MUST desaparecer imediatamente da lista
  "Meus treinos" (sem precisar fechar/reabrir o app) e MUST deixar de ser
  acessível para iniciar ou continuar uma execução — qualquer tentativa de
  abrir a tela de execução de um treino arquivado (por qualquer caminho,
  incluindo tocar na notificação de fim de descanso do RF06, que também
  navega direto para a tela de execução) MUST ser impedida, informando que
  o treino está arquivado.
- **FR-004**: Arquivar um treino MUST preservar, sem nenhuma alteração,
  todas as sessões já registradas desse treino — elas MUST continuar
  aparecendo integralmente no histórico "Por exercício" (RF08) e "Por
  data" (RF18), exatamente como antes do arquivamento (via snapshot de
  nome/exercícios, RF24 — não depende do treino continuar ativo).
- **FR-005**: O universo de "exercícios nunca registrados em nenhuma
  sessão" do histórico "Por exercício" (RF08, FR-009 da spec 025) MUST
  considerar apenas treinos **não arquivados** — um treino arquivado sem
  nenhuma sessão não MUST aparecer mais nesse universo; um treino
  arquivado **com** sessões continua aparecendo normalmente, através dos
  registros dessas sessões (não do treino em si).
- **FR-006**: O sistema MUST permitir consultar uma lista dos treinos
  arquivados do usuário (reachable pelo mesmo menu de Ações que já reúne
  "Importar treino"/"Sair da conta") e MUST permitir restaurar qualquer
  treino arquivado dessa lista, fazendo-o voltar a aparecer em "Meus
  treinos" imediatamente, com histórico, contadores e indicador de ciclo
  (se aplicável) intactos. (Resolvido com o usuário em 2026-10-16: sim,
  pode restaurar, pela lista de arquivados no menu de Ações.)
- **FR-007**: O sistema MUST permitir encerrar manualmente o ciclo de
  progresso atual (RF15), a qualquer momento (independente de ter
  atingido 40 sessões finalizadas ou não), com uma confirmação explícita
  antes de efetivar. A ação "Encerrar ciclo" só MUST aparecer/ficar
  habilitada quando existe um ciclo ativo (não encerrado) — sem ciclo
  ativo, não há o que encerrar.
- **FR-008**: Encerrar um ciclo MUST ser uma marcação lógica (ex.: um campo
  de data de encerramento no próprio ciclo) — o documento do ciclo nunca é
  removido do Firestore, e nenhuma sessão é alterada ou apagada por essa
  ação.
- **FR-009**: Depois de encerrado, um ciclo MUST deixar de bloquear a
  importação de um novo lote de múltiplos treinos (RF15, independente de
  ter atingido 40 sessões) e MUST deixar de exibir qualquer anel de
  progresso ou aviso de "Hora de trocar o treino" associado a ele em "Meus
  treinos" — sem afetar histórico, contadores nem sessões dos treinos que
  faziam parte dele. Enquanto o bloqueio de importação ainda estiver
  ativo (ciclo atual com menos de 40 sessões, ainda não encerrado), a
  mensagem exibida MUST orientar explicitamente o caminho para liberar a
  importação imediatamente ("Encerrar ciclo", FR-007), não só explicar a
  regra das 40 sessões.
- **FR-010**: Ao arquivar um treino que tem uma sessão em andamento
  (`finalizadaEm: null`), o sistema MUST finalizar essa sessão
  automaticamente como parte da mesma ação (preservando as séries já
  registradas, mesmo efeito de "Finalizar treino" hoje), informando esse
  efeito colateral no texto de confirmação do arquivamento — nunca deixando
  uma sessão "Em andamento" presa a um treino arquivado. (Resolvido com o
  usuário em 2026-10-16: arquivar finaliza a sessão automaticamente, num
  único toque de confirmação.)
- **FR-011**: O sistema MUST oferecer uma ação direta para finalizar uma
  sessão "Em andamento" (preservando as séries já registradas) a partir de
  "Meus treinos", sem exigir que o usuário abra a tela de execução
  completa do treino correspondente, com uma confirmação explícita antes
  de efetivar. A sessão finalizada por essa ação MUST contar nos
  contadores de sessões finalizadas (RF02/RF16) e no total do ciclo de
  progresso (RF15) exatamente como uma sessão finalizada manualmente por
  "Finalizar treino" — nenhum tratamento diferente por ter sido finalizada
  por este caminho. Só ação manual — nenhum gatilho automático por tempo
  decorrido (lembretes/notificações permanecem fora de escopo). (Resolvido
  com o usuário em 2026-10-16: ação direta em "Meus treinos", sem
  automação por tempo.)
- **FR-012**: Todas as ações desta spec (arquivar, restaurar, encerrar
  ciclo, finalizar sessão abandonada) MUST continuar funcionando offline —
  escrita sem bloquear a UI esperando confirmação do servidor (mesmo
  padrão fire-and-forget já usado em todo o app desde a spec 022/025) — e
  MUST permanecer isoladas por `uid` da conta autenticada (Constitution
  v2.0.0, Princípio V).
- **FR-013**: O sistema MUST garantir, inclusive no lado do servidor (não
  só na interface), que uma sessão já registrada nunca pode ser apagada
  pelo app — exclusão lógica aplica-se somente a treinos (FR-002) e ciclos
  (FR-008), nunca a sessões.
- **FR-014**: A listagem de treinos (ativos, em "Meus treinos") e de
  treinos arquivados MUST manter ordenação determinística, consistente com
  o critério já usado hoje para a lista de treinos (RF02/RF24).

### Key Entities *(include if feature involves data)*

- **Treino**: ganha um campo de arquivamento (data/hora em que foi
  arquivado, ou ausência dele enquanto ativo). Nenhum outro campo muda.
  Treinos arquivados continuam existindo por completo no Firestore —
  apenas deixam de aparecer em "Meus treinos" e de serem executáveis.
- **CicloTreino**: ganha um campo de encerramento (data/hora em que foi
  encerrado manualmente, ou ausência dele enquanto ativo). "Ciclo atual"
  passa a significar o último ciclo criado que ainda não foi encerrado
  (ver Edge Cases).
- **SessaoTreino**: nenhuma mudança de schema — esta spec só adiciona uma
  forma mais direta de finalizar uma sessão em andamento (FR-011) e um
  efeito colateral automático ao arquivar (FR-010), reaproveitando a
  finalização já existente (RF07/RF24).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue arquivar um treino em no máximo 2 toques
  (a partir da lista ou da tela do treino) além do toque de confirmação.
- **SC-002**: Um treino arquivado desaparece imediatamente da lista "Meus
  treinos" e de qualquer caminho para iniciar/continuar sua execução, sem
  necessidade de fechar e reabrir o app.
- **SC-003**: 100% das sessões e séries já registradas de um treino
  continuam visíveis no histórico depois de arquivá-lo e depois de
  encerrar o ciclo ao qual ele pertencia — nenhuma perda de dado em
  nenhum cenário desta spec.
- **SC-004**: O usuário consegue importar um novo lote de múltiplos
  treinos imediatamente depois de encerrar o ciclo atual, mesmo com menos
  de 40 sessões finalizadas nesse ciclo.
- **SC-005**: O usuário consegue encontrar e restaurar um treino arquivado
  inteiramente pela interface do app, sem precisar de acesso ao Console do
  Firebase.
- **SC-006**: Todas as ações desta spec (arquivar, restaurar, encerrar
  ciclo, finalizar sessão abandonada) funcionam offline (modo avião), sem
  travar a interface, e refletem corretamente ao reconectar.

## Assumptions

- Sessão sem nenhuma série registrada nunca existe como documento
  persistido (herdado da spec 025) — não há cenário de "sessão abandonada
  vazia" a tratar.
- Nenhuma dependência nova é introduzida; nenhuma mudança de layout além
  dos novos pontos de entrada necessários para as ações desta spec (ex.:
  menu de Ações ganha "Treinos arquivados"/"Encerrar ciclo").
- Fora de escopo (conforme pedido do usuário): relógio de duração do
  treino, lembretes/notificações automáticas baseadas em tempo decorrido,
  e qualquer redistribuição automática de cota de ciclo entre treinos.
- A forma exata de acionar "Arquivar" a partir da lista "Meus treinos"
  (ex.: toque longo, ícone dedicado, deslizar) é uma decisão de interface
  a ser tomada no plano — esta spec só exige que a ação exista, seja
  alcançável em até 2 toques (SC-001) e peça confirmação.
- "Treinos arquivados" e "Encerrar ciclo" ficam acessíveis pelo mesmo menu
  de Ações (`/acoes`) que já reúne "Importar treino"/"Sair da conta" —
  reaproveita um padrão de navegação já existente, sem criar uma aba nova.
- Regras do Firestore proibindo `delete` em `sessoes` (ver FR-013) é uma
  decisão técnica do plano (`research.md`), incluindo a publicação manual
  das regras atualizadas no Console do Firebase pelo usuário — fora do
  escopo desta spec, que só define a garantia funcional.
