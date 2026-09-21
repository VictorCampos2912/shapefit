# Feature Specification: Editar Registro de Série de uma Sessão Já Finalizada

**Feature Branch**: `011-editar-serie-finalizada`

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "Baseado no PRD anexo (v1.1) e no criterios-aceite.md, criar a especificação do requisito RF09b: editar registro de série de uma sessão já finalizada, a partir da tela de histórico (RF08). AJUSTE ARQUITETURAL NECESSÁRIO 1: o tipo RegistroHistorico (RF08) não guarda nenhuma referência de volta à sua origem (sessaoId, exercicioId, número da série) — isso foi deixado propositalmente para esta feature resolver. Estenda RegistroHistorico (ou crie um tipo derivado usado apenas na tela) para incluir essas referências, permitindo que a UI saiba exatamente qual série editar ao tocar em um registro. AJUSTE ARQUITETURAL NECESSÁRIO 2: a função de edição existente (atualizarSerieRealizada, RF04/RF09a) só localiza sessões EM ANDAMENTO (finalizadaEm === null) — não serve para editar uma sessão já finalizada. Descreva a necessidade de uma nova função de edição que localize a sessão por seu id (mesmo padrão de finalizarSessao, RF07), operando apenas sobre sessões com finalizadaEm !== null. Comportamento: o usuário toca em um registro na tela de histórico, edita carga e/ou reps, confirma via Alert (mesmo padrão do RF09a). A edição atualiza o valor permanentemente na sessão finalizada, sem reabri-la como \"em andamento\" — finalizadaEm permanece inalterado. Após editar, o novo valor é refletido imediatamente na tela de histórico, sem precisar recarregar manualmente. Usar os critérios de aceite do RF09b no documento criterios-aceite.md anexo. Não implementar código ainda — apenas descrever o comportamento esperado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Corrigir carga ou repetições de um registro de uma sessão já finalizada (Priority: P1)

Consultando o histórico de evolução de um exercício (RF08), o usuário percebe que um
dos registros — de um treino feito dias atrás, já finalizado — tem um valor de carga
ou repetições digitado errado (ex.: registrou "45kg" quando a carga real era "40kg").
Sem esta feature, esse erro ficaria permanentemente incorreto no histórico, já que a
única edição disponível até aqui (RF09a) só funciona durante a sessão em andamento, não
depois de finalizada. A partir da própria tela de histórico, o usuário toca no registro
incorreto, ajusta o valor, confirma a alteração quando solicitado, e o valor corrigido
passa a valer imediatamente na mesma tela.

**Why this priority**: Fecha a lacuna deixada intencionalmente aberta pelo RF09a (que
cobriu apenas sessões em andamento) e completa o RF09 original do PRD. Sem esta
feature, qualquer erro de digitação percebido depois de finalizar um treino se torna
permanente — o histórico de evolução (RF08), cujo valor depende de dados confiáveis ao
longo do tempo, ficaria vulnerável a erros não corrigíveis.

**Independent Test**: Com pelo menos uma sessão já finalizada contendo um registro de
série, abrir o histórico (RF08), tocar nesse registro, alterar a carga e/ou as
repetições, confirmar a alteração, e verificar que o novo valor aparece imediatamente
na tela de histórico, sem precisar sair e voltar para a aba.

**Acceptance Scenarios**:

1. **Given** o histórico exibe um registro de uma sessão já finalizada, **When** o
   usuário toca nesse registro, **Then** o sistema oferece uma forma de editar a carga
   e/ou as repetições daquele registro específico.
2. **Given** o usuário alterou a carga e/ou as repetições de um registro, **When** ele
   confirma a intenção de salvar, **Then** o sistema exibe um pedido de confirmação
   explícito antes de gravar a alteração.
3. **Given** o pedido de confirmação está sendo exibido, **When** o usuário confirma,
   **Then** o novo valor é gravado permanentemente, substituindo o valor anterior
   daquele registro, e o histórico exibido passa a mostrar o valor atualizado
   imediatamente, sem exigir que o usuário recarregue a tela manualmente.
4. **Given** o pedido de confirmação está sendo exibido, **When** o usuário cancela em
   vez de confirmar, **Then** nenhuma alteração é gravada e o valor original do
   registro permanece exatamente como estava, inclusive na tela.
5. **Given** o usuário tenta confirmar uma edição com o campo de carga ou de repetições
   vazio ou com um valor inválido, **Then** o sistema impede a confirmação, mantendo o
   valor original intacto — mesmas regras de validação já usadas no preenchimento
   original da série (RF03) e na edição de séries em andamento (RF09a): carga aceita
   valor decimal, repetições aceita apenas inteiro não negativo.

---

### User Story 2 - A sessão finalizada continua finalizada depois da edição (Priority: P1)

Depois de editar um registro de uma sessão já finalizada, o usuário espera que aquela
sessão continue exatamente como estava em todos os outros aspectos — ainda aparecendo
como uma sessão concluída no histórico, sem passar a bloquear a troca de perfil ativo
(RF10) como se fosse uma sessão em andamento, e sem interferir em nenhuma nova sessão
que venha a ser criada depois para o mesmo treino.

**Why this priority**: É a garantia central que torna esta feature diferente e
tecnicamente necessária em relação ao RF09a — sem ela, editar um registro do passado
poderia acidentalmente "reabrir" uma sessão encerrada, quebrando o contrato de
finalização estabelecido pelo RF07 (do qual depende o bloqueio de troca de perfil do
RF10 e a própria contagem de sessões finalizadas por treino, RF02). Por isso tem a
mesma prioridade P1 da User Story 1 — a edição só tem valor real se essa garantia se
mantiver.

**Independent Test**: Editar um registro de uma sessão já finalizada e, imediatamente
depois, verificar que: (a) essa sessão continua aparecendo como finalizada em qualquer
lugar do app que já distinga sessões finalizadas de sessões em andamento (ex.: a
contagem de sessões finalizadas do RF07/RF02); (b) a troca de perfil ativo (RF10)
continua permitida exatamente como estava antes da edição.

**Acceptance Scenarios**:

1. **Given** uma sessão finalizada tem um de seus registros editado, **When** a edição
   é confirmada, **Then** a data/hora de finalização original dessa sessão permanece
   exatamente a mesma — a edição não altera quando a sessão foi finalizada, apenas o
   valor da série editada.
2. **Given** uma sessão finalizada teve um registro editado, **When** o usuário tenta
   trocar de perfil ativo (RF10) e não há nenhuma outra sessão em andamento no
   momento, **Then** a troca não é bloqueada por causa dessa sessão editada.
3. **Given** o treino ao qual pertence a sessão editada é reaberto para uma nova
   execução, **When** o usuário registra uma nova série nesse treino, **Then** uma
   sessão nova e distinta é criada (mesmo comportamento já garantido pelo RF07) — a
   sessão editada permanece intacta, separada, não é reaproveitada nem reaberta.

---

### Edge Cases

- O usuário tenta editar um registro pertencente a uma sessão que ainda está em
  andamento (não finalizada) → fora do escopo desta feature; esse caso já é coberto
  pelo RF09a, a partir da tela de execução, não pela tela de histórico.
- O usuário edita um registro sem alterar nenhum valor (reabre a edição e confirma sem
  mudar nada) → a confirmação ainda é solicitada, e o valor é regravado igual ao
  anterior — sem efeito prático, sem erro (mesmo comportamento já definido pelo RF09a
  para o caso equivalente em sessões em andamento).
- Existem duas sessões finalizadas diferentes do mesmo treino, cada uma com seu próprio
  registro do mesmo exercício → editar o registro de uma delas afeta exclusivamente
  aquela sessão específica; a outra sessão finalizada do mesmo treino permanece
  intocada, e ambas continuam aparecendo como registros distintos no histórico (RF08),
  já que a ordenação por data (finalizadaEm) determina qual é "mais recente" — editar
  carga/reps não move o registro para outra posição na lista, pois a data não muda.
- O exercício editado faz parte de um grupo do histórico (RF08) cujo nome exibido
  (`nomeExibido`) foi determinado pela grafia do registro mais recente daquele grupo →
  editar apenas a carga/reps de um registro não afeta essa grafia, já que ela depende
  apenas do nome do exercício e da data da sessão (RF08), nenhum dos quais esta feature
  altera.
- O usuário cancela a edição no meio do processo (ex.: navega para outra aba antes de
  confirmar ou cancelar o diálogo) → nenhuma alteração é persistida, mesmo
  comportamento de "sair sem confirmar" já definido pelo RF09a.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir que o usuário inicie a edição de qualquer
  registro individual exibido na tela de histórico (RF08) que pertença a uma sessão já
  finalizada, tocando nesse registro.
- **FR-002**: Cada registro exibido na tela de histórico DEVE poder ser identificado de
  volta, de forma inequívoca, à série exata de origem (qual sessão, qual exercício
  dentro dela, e qual número de série) — sem essa identificação exata, o sistema não
  tem como saber qual registro específico gravar ao confirmar uma edição, já que um
  mesmo exercício pode ter múltiplos registros com valores iguais ou parecidos.
- **FR-003**: O sistema DEVE permitir a edição do valor de carga e/ou do valor de
  repetições do registro selecionado, usando as mesmas regras de validação de entrada
  já definidas para o preenchimento original (RF03) e para a edição de séries em
  andamento (RF09a): carga aceita valor decimal, repetições aceita apenas inteiro não
  negativo.
- **FR-004**: O sistema NÃO DEVE permitir confirmar/salvar uma edição enquanto o valor
  de carga ou de repetições informado for inválido (vazio, não numérico, ou repetições
  negativas), mantendo o valor original do registro intacto nesse caso.
- **FR-005**: Antes de gravar qualquer alteração de um registro editado, o sistema DEVE
  solicitar confirmação explícita do usuário, distinta da ação que iniciou a edição —
  mesmo padrão já estabelecido pelo RF09a.
- **FR-006**: Ao confirmar a edição, o sistema DEVE localizar e atualizar
  permanentemente a série de origem exata (identificada via FR-002) dentro da sessão
  finalizada correspondente, sem criar um novo registro nem remover o existente —
  apenas os valores daquela série específica são atualizados.
- **FR-007**: A edição de um registro de uma sessão finalizada NÃO DEVE, em nenhuma
  circunstância, alterar o campo que marca aquela sessão como finalizada — a sessão
  editada permanece finalizada, com a mesma data/hora de finalização de antes da edição.
- **FR-008**: A edição de um registro de uma sessão finalizada NÃO DEVE afetar o
  bloqueio de troca de perfil ativo (RF10), a contagem de sessões finalizadas por
  treino (RF02/RF07), nem qualquer outro comportamento do app que dependa de uma sessão
  estar finalizada ou não — do ponto de vista de todo o resto do app, a sessão
  permanece, antes e depois da edição, igualmente finalizada.
- **FR-009**: Ao cancelar o pedido de confirmação, ou sair da edição sem confirmar, o
  sistema NÃO DEVE persistir nenhuma alteração — o valor original do registro
  permanece exatamente como estava.
- **FR-010**: Após uma edição confirmada, o sistema DEVE refletir o novo valor na tela
  de histórico imediatamente, sem exigir que o usuário atualize a tela manualmente
  (ex.: trocando de aba e voltando, ou fechando e reabrindo o app).
- **FR-011**: O sistema NÃO DEVE, por meio desta feature, permitir a edição de
  registros pertencentes a sessões ainda em andamento (`finalizadaEm` não preenchido) —
  esse cenário permanece escopo exclusivo do RF09a, a partir da tela de execução.
- **FR-012**: Toda edição realizada por esta feature DEVE continuar respeitando o
  isolamento por perfil ativo já estabelecido pelo RF10 — o usuário só consegue editar
  registros de sessões pertencentes ao perfil ativo no momento da edição.

### Key Entities

- **Registro de histórico editável**: o mesmo "registro de histórico" já definido pelo
  RF08, agora capaz de ser rastreado de volta à sua série de origem exata (sessão,
  exercício, número da série) para fins de edição — sem essa capacidade, a tela de
  histórico não teria como distinguir, entre vários registros exibidos, qual série
  gravar quando o usuário confirma uma edição.
- **Sessão de treino finalizada (`SessaoTreino`, RF07)**: entidade já existente. Esta
  feature localiza uma sessão finalizada especificamente por sua identidade (não pelo
  par perfil+treino, que pode corresponder a múltiplas sessões finalizadas ao longo do
  tempo — RF07), e grava a edição diretamente dentro da série correspondente, sem
  alterar `finalizadaEm`, `treinoId`, `perfilId` ou `iniciadaEm`.
- **Série realizada (`SerieRealizada`, RF04)**: entidade já existente. Esta feature não
  adiciona campos a essa entidade — apenas permite que `cargaKg` e/ou `reps` de uma
  instância já existente, dentro de uma sessão já finalizada, sejam substituídos por um
  novo valor, mantendo o mesmo número de série.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue corrigir a carga e/ou as repetições de qualquer
  registro do histórico pertencente a uma sessão finalizada em no máximo 4 toques
  (selecionar o registro, editar o valor, confirmar a edição, confirmar o diálogo de
  segurança) — mesmo padrão de esforço já estabelecido pelo RF09a.
- **SC-002**: 100% das edições de registros de sessões finalizadas exigem uma
  confirmação explícita antes de serem gravadas.
- **SC-003**: Em 100% dos casos de edição de um registro de uma sessão finalizada, essa
  sessão permanece finalizada (mesma data/hora de finalização) depois da edição, sem
  reverter para "em andamento" nem afetar o bloqueio de troca de perfil.
- **SC-004**: Em 100% dos casos, uma edição confirmada é refletida na tela de histórico
  imediatamente, sem exigir nenhuma ação manual de atualização por parte do usuário.
- **SC-005**: Em 100% das tentativas de cancelar a confirmação de uma edição, o valor
  original do registro permanece inalterado, verificável reabrindo o histórico.

## Assumptions

- **Identificação de origem do registro (Ajuste arquitetural 1 da instrução original)**:
  o tipo de dado usado pela tela de histórico (RF08) para representar cada registro
  precisa passar a carregar as referências necessárias para localizar sua série de
  origem (sessão, exercício, número da série) — hoje ele carrega apenas data, carga e
  repetições, suficiente para exibição (RF08), mas insuficiente para edição. A forma
  exata dessa extensão (estender o tipo existente ou introduzir um tipo derivado usado
  só na tela) fica a critério do `/speckit.plan`, não desta especificação.
- **Nova função de gravação (Ajuste arquitetural 2 da instrução original)**: a função
  de edição já existente (usada pelo RF09a) localiza sessões apenas pelo par
  perfil+treino, exigindo que a sessão esteja em andamento — ela não serve para esta
  feature, pois uma vez finalizada, uma sessão deixa de ser a única/mais recente do seu
  treino (RF07 permite múltiplas sessões finalizadas do mesmo treino ao longo do
  tempo). Esta feature precisa de um mecanismo de gravação que localize a sessão
  alvo por sua identidade própria (mesmo padrão já usado por `finalizarSessao`, RF07,
  para o mesmo problema de ambiguidade), operando exclusivamente sobre sessões já
  finalizadas. A assinatura exata fica a critério do `/speckit.plan`.
- **Confirmação via diálogo simples**: consistente com o padrão já estabelecido pelo
  RF09a (RNF03: interações principais em no máximo 2 toques) — não é assumido nenhum
  mecanismo adicional de segurança (senha, biometria), já que o RF10 estabelece que
  perfis não têm proteção de acesso.
- **Sem exclusão nem criação de registros**: esta feature, assim como o RF09a, permite
  apenas a edição do valor de `cargaKg` e/ou `reps` de uma série já existente — não
  introduz nenhuma forma de excluir uma série de uma sessão finalizada, nem de
  adicionar uma série extra além das já registradas.
- **Sem efeito sobre agrupamento/ordenação do RF08**: como a edição nunca altera a data
  de finalização da sessão nem o nome do exercício, ela não interfere na ordenação dos
  registros dentro de um grupo (mais recente → mais antigo) nem na grafia exibida do
  grupo (`nomeExibido`) — ambos já definidos pelo RF08 a partir de campos que esta
  feature não modifica.
- **Reaproveitamento visual**: a interação de edição (toque no registro → campos
  editáveis → confirmação via diálogo) segue o mesmo padrão visual já estabelecido pelo
  RF09a, adaptado da tela de execução para a tela de histórico — nenhum novo padrão de
  interação é introduzido.
