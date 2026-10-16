# Feature Specification: Migração de Sessões, Histórico e Ciclo de Progresso para o Firestore

**Feature Branch**: `025-migracao-sessoes-historico-ciclo`

**Created**: 2026-10-15

**Status**: Implemented — validado em Android em 2026-10-16 (Princípio III); iOS pendente por falta de conta Apple Developer (mesma situação das specs 022-024)

**Requisito**: RF24 (PRD, seção 6 — nova entrada; número confirmado em
2026-10-15 ao consultar a tabela, nenhuma entrada prévia usa RF24). Migra
RF04/RF07/RF09a/RF09b/RF12 (sessão de treino e sua edição), RF08/RF18
(histórico por exercício e por data), RF02/RF16/RF23 (indicadores derivados
na lista de treinos) e RF15 (ciclo de progresso) de AsyncStorage para o
Firestore — mesmo padrão de "migra" já usado pelo RF22 (que migrou RF01/RF02
e deixou RF07/RF08/RF15/RF18 explicitamente pendentes em AsyncStorage, "sem
migração"; esta spec fecha essa pendência). Segue o precedente já
estabelecido e verificado pela spec 024 (RF23, `spec.md`, campo "Requisito"):
toda melhoria pós-MVP registrada até hoje (RF11-RF23) recebeu número próprio,
mesmo quando é só uma migração de armazenamento sem comportamento novo
visível — por isso esta spec assume **RF24**, não uma emenda a RF04/RF07/
RF08/RF15/etc.

**Nota**: Continuação da migração de armazenamento iniciada pelo RF22
(autenticação + Firestore para contas e treinos). O RF22 migrou RF01
(importar) e RF02 (listar treinos); esta spec migra tudo que falta e que
depende de sessão de treino: criação/atualização/finalização de sessão
(RF04/RF07/RF12), edição de séries (RF09a/RF09b), histórico (RF08/RF18),
indicadores derivados na lista de treinos (RF02/RF16/RF23) e ciclo de
progresso (RF15). **Fora de escopo, por decisão explícita do usuário**:
arquivamento de treinos, uma ação "Encerrar ciclo", e tratamento de sessões
abandonadas (todos para uma spec seguinte) — esta spec é só a migração de
armazenamento, sem nenhum comportamento novo visível ao usuário, além dos
dois novos dados explicitamente pedidos (snapshot de nome/exercícios na
sessão, e horário por série).

**Input**: User description: "Migrar sessões de treino, histórico e ciclo de
progresso de AsyncStorage para o Firestore (Fases 2, 3 e a parte de
armazenamento da Fase 4 da migração; Constitution v2.0.0, Princípio V). É
migração de armazenamento sem comportamento novo: arquivamento de treinos,
ação 'Encerrar ciclo' e tratamento de sessões abandonadas NÃO entram aqui
(spec posterior). Não implementar código ainda — apenas descrever o
comportamento esperado.

Contexto e decisões já tomadas pelo usuário:
- O histórico de evolução deve ser preservado sempre; é a partir dele que a
  evolução do usuário será acompanhada. Nenhuma funcionalidade desta spec
  pode apagar sessões finalizadas.
- Os dados atuais de sessão/histórico/ciclo em AsyncStorage são de teste e
  podem ser DESCARTADOS: não há migração de dados antigos. Para testes e
  validações, usar dados fictícios (como o plano decidir criar/inserir).
- Sessões e ciclo passam a viver na conta (por uid), acessíveis em outro
  aparelho da mesma conta, com cache offline nativo do Firestore. Isso
  também resolve o estado dividido atual (treinos na nuvem, ciclo local):
  limpar os dados do app não pode mais zerar o ciclo.

Escopo (comportamento a migrar, sem mudar o que o usuário vê hoje):
- Sessão em andamento e finalizada (RF04, RF07, RF12): criação ao concluir a
  primeira série, atualização a cada série, finalização manual ou
  automática, 'Nova sessão' (RF12), persistência ao fechar o app.
- Edição de séries da sessão em andamento (RF09a) e de sessões finalizadas
  (RF09b).
- Histórico por exercício (RF08) e por data (RF18), contador de sessões
  finalizadas e 'Finalizado em' na lista de treinos (RF02/RF16), indicador
  de sessão em andamento (RF23).
- Ciclo de progresso (RF15): criação automática ao importar múltiplos
  treinos, cota por treino, anel de progresso, bloqueio de nova importação
  enquanto o ciclo tem menos de 40 sessões, aviso ao atingir 40. Tudo deve
  continuar funcionando exatamente como hoje, agora lendo/gravando no
  Firestore.

Novos dados que a sessão deve passar a guardar (para análises futuras e para
o histórico não depender de o treino continuar ativo):
- Nome do treino e dos exercícios (com categoria) copiados para dentro da
  sessão no momento da criação, de modo que o histórico continue legível
  mesmo se o treino for arquivado/alterado depois.
- Horário de início da sessão e horário de cada série registrada (permitirá
  duração do treino depois, a ser especificada em outra spec).

Requisitos de comportamento:
- Offline mantido: concluir série, finalizar, editar, consultar histórico e
  importar com ciclo funcionam em modo avião, sincronizam ao reconectar;
  abertura a frio em modo avião continua passando. Escritas não devem travar
  a UI esperando o servidor (lição da spec 022). O registro de série
  continua em no máximo 2 toques (RNF03).
- Ordenação determinística nas listagens (o Firestore não garante ordem).
- Isolamento por conta: uma conta nunca lê nem escreve sessões ou ciclo de
  outra; regras de segurança do Firestore devem cobrir os novos caminhos com
  a mesma garantia dos treinos (testar no Rules Playground, os 4 casos da
  spec 022, e com duas contas).
- Regra de no máximo uma sessão em andamento por treino e por conta, mesmo
  se a conta for usada em dois aparelhos: definir o comportamento (e
  registrar o caso de borda) em vez de deixar implícito. Mesma atenção para
  dois aparelhos importando um lote ao mesmo tempo (um único ciclo ativo).
- Sessões abandonadas continuam como hoje; o tratamento delas fica para a
  spec seguinte.
- Após a migração, os dados antigos em AsyncStorage deixam de ser lidos; o
  plano deve decidir se são limpos ou ignorados.

Restrições:
- Ler o número do RF na tabela da seção 6 do docs/PRD-app-treino.md; não
  presumir. Dizer explicitamente se é RF novo (estende/substitui RF04/RF07/
  RF08/RF15/RF18 etc.) ou emenda, seguindo o precedente da tabela.
- Atualizar o contrato de regras (contracts/firestore-rules.md) e lembrar
  que publicar as regras no Console do Firebase é passo manual do usuário.
- Seguir a Constitution v2.0.0. Validação em Android; iOS pendente (sem
  conta Apple Developer paga), como nas specs 022 a 024.
- Ao terminar, parar para eu revisar o pacote (spec, checklist) antes do
  /speckit-tasks."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Treinar normalmente, agora salvo na conta (Priority: P1)

O usuário abre um treino, registra séries, descansa, finaliza (manual ou
automaticamente ao concluir o último exercício) e eventualmente inicia uma
nova sessão do mesmo treino — exatamente como hoje. A diferença é só por
baixo do capô: tudo isso agora é salvo na conta (Firestore), não mais só
neste aparelho.

**Why this priority**: é o núcleo da migração — sem isso, nada mais desta
spec tem onde se apoiar (histórico e ciclo dependem de sessões existirem).

**Independent Test**: Treinar um treino do início ao fim (algumas séries,
descanso, finalizar manualmente ou concluindo todos os exercícios), fechar e
reabrir o app, e confirmar que o progresso e a finalização persistiram
exatamente como hoje — sem nenhuma diferença perceptível de comportamento.

**Acceptance Scenarios**:

1. **Given** um treino sem nenhuma sessão em andamento, **When** o usuário
   conclui a primeira série de um exercício, **Then** uma sessão passa a
   existir na conta (Firestore), com `finalizadaEm` nulo, exatamente como o
   comportamento atual em AsyncStorage.
2. **Given** uma sessão em andamento, **When** o usuário conclui mais
   séries (do mesmo exercício ou de outro), **Then** cada série é
   adicionada à sessão, sem perder as anteriores.
3. **Given** uma sessão em andamento, **When** o usuário toca em "Finalizar
   treino" (manual) ou conclui o último exercício planejado (automático),
   **Then** a sessão é marcada como finalizada, do mesmo jeito que hoje.
4. **Given** uma sessão já finalizada e revisada pelo usuário ("Nova sessão
   de Treino", RF12), **When** o usuário inicia uma nova série do mesmo
   treino, **Then** uma nova sessão é criada, distinta da anterior, sem
   nenhum resquício da sessão anterior.
5. **Given** uma sessão em andamento, **When** o usuário fecha o app por
   completo e o reabre, **Then** o progresso continua exatamente de onde
   parou — mesma garantia já existente hoje (RF04), agora vinda do Firestore
   em vez de AsyncStorage.

---

### User Story 2 - Histórico e indicadores continuam mostrando os mesmos dados (Priority: P1)

O usuário consulta o histórico de evolução por exercício (RF08) e por data
(RF18), vê o contador de sessões finalizadas e o texto "Finalizado em"/
"Nunca treinado" na lista de treinos (RF02/RF16), e vê o destaque de "em
andamento" (RF23) — tudo exatamente igual a hoje, só que os dados agora vêm
da conta, não mais deste aparelho especificamente.

**Why this priority**: é a verificação mais direta de que a migração não
regrediu nada visível — todo o valor do histórico está em ele continuar
confiável e completo.

**Independent Test**: Com algumas sessões finalizadas e uma em andamento,
abrir a tela de histórico (nas duas visões) e a lista de treinos, e
confirmar que todos os números, textos e destaques aparecem exatamente como
antes da migração.

**Acceptance Scenarios**:

1. **Given** sessões finalizadas de um ou mais treinos, **When** o usuário
   abre o histórico "Por exercício" (RF08), **Then** vê a mesma evolução de
   carga/reps por exercício que veria antes da migração, incluindo
   exercícios de um treino que nunca foram registrados (RF08, comportamento
   já existente).
2. **Given** as mesmas sessões, **When** o usuário abre o histórico "Por
   data" (RF18), **Then** vê os mesmos dias, treinos e séries agrupados do
   mesmo jeito que veria antes da migração.
3. **Given** um treino com sessões finalizadas, **When** o usuário vê esse
   treino na lista "Meus treinos", **Then** o contador de sessões
   finalizadas e o texto "Finalizado em `<data>`"/"Nunca treinado" (RF02/
   RF16) aparecem corretos.
4. **Given** um treino com uma sessão em andamento, **When** o usuário vê a
   lista de treinos, **Then** o destaque de "em andamento" (RF23) aparece,
   exatamente como já migrado por aquela spec.

---

### User Story 3 - Isolamento entre contas (Priority: P1)

Duas contas diferentes no mesmo aparelho (ou em aparelhos diferentes) nunca
veem sessão, histórico, contador ou ciclo de progresso uma da outra — mesma
garantia já validada para treinos pela spec 022, agora estendida às sessões
e ao ciclo.

**Why this priority**: Constitution v2.0.0, Princípio V, é NON-NEGOTIABLE —
mesma prioridade máxima que a spec 022 deu a esse teste.

**Independent Test**: Conta A finaliza uma sessão e tem um ciclo de
progresso ativo; trocar para a conta B (nova ou sem essas sessões) e
confirmar que nada da conta A aparece (histórico vazio ou só com os dados
próprios de B, nenhum ciclo de A visível); voltar para a conta A e confirmar
que nada mudou.

**Acceptance Scenarios**:

1. **Given** a conta A com sessões finalizadas e um ciclo de progresso
   ativo, **When** o usuário troca para a conta B, **Then** o histórico, os
   contadores e o ciclo de progresso exibidos são exclusivos da conta B
   (vazios, se B nunca treinou) — nada da conta A aparece.
2. **Given** a situação anterior, **When** o usuário volta para a conta A,
   **Then** as sessões, o histórico e o ciclo de progresso da conta A
   continuam exatamente como estavam.
3. **Given** as regras de segurança do Firestore para os novos caminhos de
   sessão e ciclo, **When** testadas no Rules Playground com os mesmos 4
   casos já usados pela spec 022 (leitura cruzada entre contas rejeitada;
   leitura/escrita da própria conta permitida; cliente sem autenticação
   rejeitado; tentativa de "personificar" outra conta via campo do corpo do
   documento, não só via caminho, rejeitada), **Then** todos os 4 casos se
   comportam da mesma forma para `sessoes` e `ciclos` que já se comportam
   para `treinos`.

---

### User Story 4 - Ciclo de progresso sobrevive a limpar dados e a trocar de aparelho (Priority: P2)

O usuário importa um lote de múltiplos treinos, o ciclo de progresso começa
a contar (RF15) exatamente como hoje — mas agora, diferente de hoje, limpar
os dados do app (ou reinstalar) não zera o ciclo, e abrir a conta em outro
aparelho mostra o mesmo ciclo, com o mesmo progresso.

**Why this priority**: resolve o problema concreto que motivou parte desta
spec (estado dividido entre treinos na nuvem e ciclo local) — mas depende da
US1 (sessões na conta) já estar funcionando, por isso P2.

**Independent Test**: Importar um lote de múltiplos treinos (ciclo criado),
registrar algumas sessões, depois limpar os dados do app (ou usar um
aparelho diferente com a mesma conta) e confirmar que o ciclo e seu
progresso continuam exatamente os mesmos.

**Acceptance Scenarios**:

1. **Given** um arquivo com múltiplos treinos, **When** o usuário o importa,
   **Then** um ciclo de progresso é criado automaticamente, com a mesma
   distribuição de cota por treino de hoje (RF15).
2. **Given** um ciclo ativo com menos de 40 sessões, **When** o usuário
   tenta importar outro lote de múltiplos treinos, **Then** a importação é
   bloqueada com a mesma mensagem de hoje.
3. **Given** um ciclo que atinge 40 sessões, **When** a 40ª sessão é
   finalizada, **Then** o aviso "Hora de trocar o treino" aparece, e uma
   nova importação de lote passa a funcionar normalmente de novo.
4. **Given** um ciclo ativo com progresso parcial, **When** o usuário limpa
   os dados do app (ou troca para um aparelho novo, mesma conta), **Then**
   o ciclo e seu progresso continuam exatamente os mesmos, lidos da conta.

---

### User Story 5 - Editar séries continua funcionando (Priority: P2)

O usuário corrige a carga ou as reps de uma série já registrada, tanto de
uma sessão ainda em andamento (RF09a) quanto de uma sessão já finalizada no
passado (RF09b) — exatamente como hoje.

**Why this priority**: funcionalidade já existente e menos usada no dia a
dia que registrar séries novas; depende da US1 (estrutura de sessão na
conta) já existir.

**Independent Test**: Editar a carga/reps de uma série de uma sessão em
andamento, e de uma série de uma sessão já finalizada, confirmando que o
novo valor persiste e aparece correto no histórico.

**Acceptance Scenarios**:

1. **Given** uma sessão em andamento com ao menos uma série registrada,
   **When** o usuário edita a carga ou as reps dessa série, **Then** o novo
   valor é salvo, sem reabrir o exercício nem alterar o estado de conclusão
   (RF09a, comportamento já existente).
2. **Given** uma sessão já finalizada, **When** o usuário edita a carga ou
   as reps de uma série dela a partir do histórico, **Then** o novo valor é
   salvo e refletido imediatamente no histórico, sem reabrir a sessão como
   "em andamento" (RF09b, comportamento já existente).

---

### User Story 6 - Histórico continua legível mesmo se o treino mudar depois (Priority: P3)

O usuário executa um treino, e depois o treino de origem é alterado (nome,
exercícios) ou deixa de existir na forma atual (fora de escopo desta spec
arquivá-lo de fato, mas a estrutura de dados já precisa suportar esse
cenário para specs futuras). O histórico dessa sessão continua mostrando o
nome do treino e dos exercícios como estavam no momento em que a sessão foi
feita, não o estado atual.

**Why this priority**: valor para o futuro (análises, RF a definir depois),
não observável no fluxo normal de hoje — por isso prioridade mais baixa,
mas precisa estar correto desde já para não exigir retrabalho de dados mais
tarde.

**Independent Test**: Registrar uma sessão de um treino, depois alterar
(em código/dado de teste, já que esta spec não expõe edição de treino na UI)
o nome do treino ou de um exercício já importado, e confirmar que o
histórico dessa sessão continua mostrando o nome original, não o alterado.

**Acceptance Scenarios**:

1. **Given** uma sessão criada a partir de um treino com nome X e um
   exercício Y de categoria "peso", **When** o nome do treino ou do
   exercício muda depois (fora desta spec, mas a sessão já existe), **Then**
   o histórico dessa sessão continua mostrando X e Y como estavam na criação
   da sessão, não o valor atual.

### Edge Cases

- **Dois aparelhos da mesma conta criam, quase ao mesmo tempo, uma sessão em
  andamento para o mesmo treino** (cenário novo, só possível a partir desta
  migração — antes, cada aparelho tinha seu próprio AsyncStorage) → sem
  transação no Firestore nesta spec (Princípio II), as duas sessões podem
  ser criadas e persistidas separadamente; nenhuma é descartada
  silenciosamente. O comportamento aceito: cada aparelho segue operando
  sobre a sessão que criou/encontrou localmente; eventualmente ambas podem
  ser finalizadas, resultando em duas sessões "em andamento → finalizada"
  para o mesmo treino no mesmo período — sem perda de nenhuma série
  registrada em nenhuma delas. Tratado como caso de borda raro e aceito,
  não bloqueado.
- **Dois aparelhos da mesma conta importam um lote de múltiplos treinos
  quase ao mesmo tempo** → mesmo tratamento: sem transação, ambos os ciclos
  podem ser criados; o "ciclo atual" (RF15, já definido como o último
  criado) passa a ser o que foi persistido por último no Firestore — sem
  bloqueio adicional nesta spec.
- **A mesma conta, em dois aparelhos, registra uma série na mesma sessão ao
  mesmo tempo, ou um finaliza enquanto o outro ainda registra séries**
  (também só possível a partir desta migração) → sem bloqueio nem merge
  especial nesta spec; o Firestore resolve pela última escrita confirmada
  (last-write-wins no documento). Perder uma série registrada quase
  simultaneamente nos dois aparelhos é um risco teórico aceito nesta spec
  (Princípio II) — não é o cenário de uso esperado (uma pessoa treina em um
  aparelho por vez), mas precisa estar documentado, não implícito.
  **Confirmado pelo usuário em 2026-10-15** (revisão do `tasks.md`): o
  comportamento last-write-wins entre aparelhos é aceito como está —
  nenhuma transação ou mecanismo de resolução de conflito adicional foi
  pedido.
- **Treino arquivado ou alterado depois de uma sessão existir** → a sessão
  já tem seu próprio snapshot (nome do treino e dos exercícios com
  categoria); o histórico dessa sessão não depende do treino continuar
  existindo ou igual (US6).
- **Sessão iniciada e nunca finalizada (abandonada)** → comportamento
  idêntico ao de hoje, incluindo a limitação já aceita pela spec 024 (fica
  destacada como "em andamento" indefinidamente); nenhum tratamento novo
  nesta spec — fica para a spec seguinte, por decisão explícita do usuário.
- **Dados antigos em AsyncStorage (`sessoes:*`, `ciclos:*`)** → deixam de
  ser lidos por qualquer tela do app após esta migração; o plano decide se
  são apagados ativamente ou apenas ignorados (nenhum dos dois apaga
  histórico do Firestore, que é uma estrutura de dados separada).
- **Edição de uma série (RF09a/RF09b) não deve alterar o horário original
  de quando aquela série foi registrada** — só o valor de carga/reps muda;
  o novo dado de horário por série (desta spec) reflete sempre o momento do
  registro original, nunca o da edição.

## Requirements *(mandatory)*

### Functional Requirements

**Sessão de treino — criação, atualização, finalização (estende RF04/RF07/RF12)**

- **FR-001**: A criação, atualização a cada série, finalização (manual ou
  automática) e o fluxo de "Nova sessão de Treino" (RF12) de uma sessão de
  treino DEVEM passar a ler e gravar na conta autenticada (Firestore), em
  vez de AsyncStorage local — sem nenhuma mudança observável no
  comportamento descrito pelo RF04/RF07/RF12.
- **FR-002**: Uma sessão DEVE continuar sendo criada somente ao se concluir
  a primeira série de um exercício do treino — nunca ao simplesmente abrir
  ou "iniciar" um exercício sem concluir nenhuma série (mesmo comportamento
  já confirmado e corrigido pela spec 024, Decisão 7 do `research.md`
  daquela spec).
- **FR-003**: No momento da criação de uma sessão, ela DEVE copiar para
  dentro de si mesma (snapshot) o nome do treino de origem e, para cada
  exercício planejado desse treino, o nome e a categoria — de forma que o
  histórico dessa sessão nunca precise consultar o treino de origem para
  exibir esses três dados.
- **FR-004**: Cada série registrada DEVE passar a incluir o horário
  (timestamp) em que foi registrada, além dos dados já existentes (número
  da série, carga, reps). O horário de início da sessão (`iniciadaEm`) já
  existe hoje e DEVE ser preservado sem alteração de comportamento.
- **FR-005**: O sistema NÃO DEVE permitir, pela lógica normal de uso em um
  único aparelho por vez, mais de uma sessão em andamento simultânea para o
  mesmo treino na mesma conta — mesma garantia já existente hoje (RF04). O
  caso de dois aparelhos da mesma conta criando sessões quase
  simultaneamente para o mesmo treino é um caso de borda aceito, não
  bloqueado (ver Edge Cases).

**Edição de séries (estende RF09a/RF09b)**

- **FR-006**: A edição de carga/reps de uma série de uma sessão em
  andamento (RF09a) DEVE continuar funcionando sem reabrir o exercício nem
  alterar o estado de conclusão, agora lendo e gravando no Firestore.
- **FR-007**: A edição de carga/reps de uma série de uma sessão já
  finalizada (RF09b) DEVE continuar funcionando sem reabrir a sessão como
  "em andamento", agora lendo e gravando no Firestore.
- **FR-008**: Editar uma série (RF09a ou RF09b) NÃO DEVE alterar o horário
  de registro daquela série (FR-004) — o horário reflete sempre o momento
  do registro original.

**Histórico e indicadores derivados (estende RF08/RF18/RF02/RF16/RF23)**

- **FR-009**: O histórico por exercício (RF08) e por data (RF18) DEVEM
  continuar exibindo exatamente os mesmos dados e a mesma organização de
  hoje, agora lidos das sessões no Firestore em vez de AsyncStorage.
- **FR-010**: Ao montar o histórico, os dados de nome de treino, nome de
  exercício e categoria de registros já feitos DEVEM vir do snapshot
  guardado na própria sessão (FR-003), não de uma nova consulta ao treino
  de origem.
- **FR-011**: O comportamento do RF08 de listar também exercícios de um
  treino que nunca foram registrados em nenhuma sessão DEVE ser preservado
  — continua vindo da lista de treinos atual da conta (não do snapshot de
  nenhuma sessão).
- **FR-012**: O contador de sessões finalizadas e o texto "Finalizado em
  `<data>`"/"Nunca treinado" na lista de treinos (RF02/RF16) DEVEM continuar
  corretos, agora calculados a partir das sessões no Firestore.
- **FR-013**: O destaque de "sessão em andamento" na lista de treinos
  (RF23) DEVE continuar funcionando exatamente como especificado por
  aquela spec, agora consultando sessões no Firestore.

**Ciclo de progresso (estende RF15)**

- **FR-014**: A criação automática de um ciclo de progresso ao importar um
  lote de múltiplos treinos, a distribuição de cota por treino, o anel de
  progresso, o bloqueio de nova importação de lote enquanto o ciclo tiver
  menos de 40 sessões finalizadas, e o aviso ao atingir 40, DEVEM continuar
  funcionando exatamente como hoje (RF15), agora lendo e gravando o ciclo no
  Firestore em vez de AsyncStorage.
- **FR-015**: O ciclo de progresso e seu status DEVEM continuar corretos
  depois de limpar os dados locais do app ou de a conta ser usada em um
  aparelho diferente — deixam de depender de qualquer estado guardado só
  neste aparelho.

**Isolamento, offline e infraestrutura (Constitution, Princípio V, NON-NEGOTIABLE)**

- **FR-016**: Toda leitura e escrita de sessão e de ciclo de progresso DEVE
  ser segregada pela conta autenticada (`uid`) — nenhuma sessão ou ciclo de
  uma conta pode ser lido ou escrito por outra conta, em nenhuma
  circunstância.
- **FR-017**: As regras de segurança do Firestore DEVEM cobrir os novos
  caminhos de sessão e de ciclo com a mesma garantia de isolamento já válida
  para treinos (spec 022) — os mesmos 4 casos de teste daquela spec DEVEM
  valer também para estes novos caminhos.
- **FR-018**: Toda listagem derivada de sessões ou de ciclos (histórico,
  contadores, "Finalizado em", indicador de sessão em andamento, anel de
  progresso) DEVE ser exibida em uma ordem determinística entre leituras
  diferentes — o Firestore não garante ordem por si só.
- **FR-019**: Concluir série, finalizar sessão, editar série, consultar
  histórico e importar um lote com ciclo DEVEM continuar funcionando com o
  aparelho em modo avião, sincronizando ao reconectar — mesma garantia
  offline já validada para treinos pela spec 022.
- **FR-020**: Uma abertura a frio do app em modo avião DEVE continuar
  exibindo corretamente lista de treinos, histórico e ciclo de progresso a
  partir do cache local do Firestore, sem exigir rede — mesmo teste mais
  rigoroso já aplicado pela spec 022.
- **FR-021**: Nenhuma escrita de sessão, série ou ciclo DEVE travar a
  interface esperando confirmação do servidor — mesma técnica
  "fire-and-forget" já usada pela spec 022 para treinos.
- **FR-022**: O registro de uma série DEVE continuar possível em no máximo
  2 toques (RNF03), sem nenhum toque adicional introduzido por esta
  migração.

**Dados antigos em AsyncStorage**

- **FR-023**: Após esta migração, nenhuma tela ou serviço do app DEVE ler
  os dados antigos de sessão, histórico ou ciclo que estavam em AsyncStorage
  — toda leitura passa a vir exclusivamente do Firestore.
- **FR-024**: Esta spec NÃO EXIGE migrar o conteúdo dos dados antigos de
  AsyncStorage para o Firestore — são descartados (decisão explícita do
  usuário); a decisão de apagá-los ativamente do AsyncStorage ou apenas
  deixá-los sem uso fica para a fase de planejamento.

### Key Entities

- **SessaoTreino** (já existe, RF04/RF07; migra de AsyncStorage para
  Firestore nesta spec): ganha um snapshot do nome do treino e, por
  exercício planejado, nome e categoria (FR-003); passa a viver em um
  caminho segregado por conta (mesma garantia de isolamento dos treinos,
  spec 022).
- **SerieRealizada** (já existe, dentro de uma execução de exercício de uma
  sessão): ganha o horário de registro (FR-004).
- **CicloTreino** (já existe, RF15; migra de AsyncStorage para Firestore
  nesta spec): sem mudança de campos — só muda onde vive, passando a ser
  segregado por conta do mesmo jeito que sessões e treinos.
- **Histórico de evolução** (RF08/RF18, não persistido, derivado em tempo
  de leitura): continua calculado a partir das sessões, mas lendo nome de
  treino/exercício/categoria do snapshot da sessão (FR-010) em vez de
  cruzar com o treino de origem, exceto para a lista de exercícios nunca
  registrados (FR-011), que continua vindo da lista de treinos atual.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das sessões de treino (criar, atualizar por série,
  finalizar, "Nova sessão"), o comportamento observável pelo usuário é
  idêntico ao existente antes desta migração.
- **SC-002**: Em 100% das consultas ao histórico (por exercício e por
  data), aos contadores de sessões, ao texto "Finalizado em"/"Nunca
  treinado" e ao indicador de sessão em andamento, os dados exibidos são
  idênticos aos que seriam exibidos antes desta migração, para os mesmos
  dados de entrada.
- **SC-003**: Em 100% dos testes de troca de conta (duas contas, mesmo ou
  diferentes aparelhos), nenhuma sessão, histórico ou ciclo de uma conta é
  visível para a outra.
- **SC-004**: Zero sessões finalizadas são perdidas ou alteradas por esta
  migração.
- **SC-005**: O ciclo de progresso e seu status permanecem corretos depois
  de limpar os dados locais do app ou trocar de aparelho com a mesma conta,
  em 100% dos casos testados.
- **SC-006**: Em 100% dos testes offline (modo avião, incluindo abertura a
  frio), concluir série, finalizar, editar, consultar histórico e importar
  com ciclo continuam funcionando sem erro, sincronizando ao reconectar.
- **SC-007**: O registro de uma série continua levando no máximo 2 toques,
  em 100% das execuções testadas.

## Assumptions

- **RF novo (RF24), seguindo o precedente já verificado pela spec 024**:
  esta spec não reabre a análise completa já feita pela spec 024 (RF23) —
  reaproveita a mesma conclusão (toda melhoria pós-MVP recebe número
  próprio, mesmo sendo só migração de armazenamento sem comportamento novo
  visível, como o próprio RF22 já fez para RF01/RF02).
- **Mecanismo de leitura/ordenação é decisão da fase de planejamento**: esta
  spec exige ordenação determinística (FR-018) e preservação de
  comportamento, mas não prescreve se as listagens serão feitas por leitura
  completa da coleção com ordenação no cliente (mesmo padrão já usado por
  `listarTreinos`, spec 022) ou por consultas com `where`/`orderBy` do
  Firestore — essa escolha técnica é do `/speckit.plan`.
- **Corridas entre aparelhos da mesma conta são aceitas, não bloqueadas**:
  nenhuma transação do Firestore é introduzida nesta spec para evitar
  sessões ou ciclos duplicados criados quase simultaneamente por dois
  aparelhos da mesma conta (Edge Cases) — risco teórico aceito por
  simplicidade (Constitution, Princípio II); uma spec futura pode endurecer
  isso se o risco se mostrar real na prática.
- **Nomenclatura de campos (`perfilId` → `uid`, por exemplo, em
  `CicloTreino`/`SessaoRegistro`) é decisão de implementação**: esta spec
  exige que o valor usado para segregar os dados seja o `uid` da conta
  autenticada (já é assim desde a spec 022 para a chave de AsyncStorage),
  mas não exige renomear nenhum campo ou tipo existente — decisão do
  `/speckit.plan`.
- **Dados fictícios para validação são decisão da fase de planejamento**:
  como os dados reais de teste em AsyncStorage são descartados (não
  migrados), o `/speckit.plan`/`/speckit-tasks` devem decidir como
  criar/inserir dados fictícios suficientes para validar todos os cenários
  desta spec (sessões antigas para histórico, ciclos em progressos
  variados, etc.).
- **Limpeza do AsyncStorage antigo é decisão da fase de planejamento**:
  FR-023/FR-024 exigem que os dados antigos deixem de ser *lidos*, mas não
  determinam se o código deve apagá-los ativamente (`AsyncStorage.
  removeItem`) ou simplesmente deixar de referenciá-los — decisão do
  `/speckit.plan`.
- **`contracts/firestore-rules.md` é atualizado na fase de planejamento, não
  nesta spec**: a spec descreve o requisito de isolamento (FR-016/FR-017),
  mas o contrato de regras em si (texto das novas regras para `sessoes` e
  `ciclos`) é artefato de `/speckit.plan` (Fase 1), seguindo o mesmo padrão
  já usado pela spec 022. **Lembrete explícito do usuário, válido para a
  fase de implementação**: publicar as regras atualizadas no Console do
  Firebase é um passo manual do usuário, fora do alcance de qualquer código
  ou automação deste repositório.
- **Fora de escopo** (decisão explícita do usuário): arquivamento de
  treinos; uma ação "Encerrar ciclo"; qualquer tratamento especial de
  sessões abandonadas (expiração, limpeza automática, aviso) — todos para
  uma spec seguinte. Também fora de escopo: migrar o conteúdo de dados
  antigos do AsyncStorage para o Firestore (descartados, não migrados);
  qualquer mudança de comportamento visível ao usuário além dos dois novos
  dados explicitamente pedidos (snapshot na sessão, horário por série);
  mudança de dependências.
- **Validação em dois dispositivos, com iOS pendente**: mesma situação já
  registrada pelas specs 022, 023 e 024 — validação completa depende de
  Android e iOS (Princípio III), e o iOS continua bloqueado pela falta de
  conta Apple Developer paga.
