# Feature Specification: Avançar Entre Séries e Exercícios

**Feature Branch**: `005-avancar-series-exercicios`

**Created**: 2026-09-15

**Status**: Draft

**Input**: User description: "RF04: avançar entre séries e exercícios. Fluxo por série: preencher carga/reps → botão \"Concluir série\" (habilitado somente quando ambos os campos estão preenchidos) → ao tocar, registra os dados e inicia automaticamente o cronômetro de descanso (RF05, ainda não implementado — apenas disparar o início, sem implementar o cronômetro em si nesta feature). Ao concluir a última série planejada de um exercício, habilitar o botão \"Concluir exercício\". Ao concluir um exercício, voltar para a lista de exercícios do treino (RF03), marcando esse exercício como concluído visualmente (usando o estado 'concluido' já previsto em ExercicioListItem desde o RF03). O usuário escolhe livremente qual exercício fazer a seguir, não obrigatoriamente o próximo da lista. Se o usuário sair da tela de execução e voltar (ou fechar e reabrir o app) antes de concluir o treino, o progresso das séries já registradas deve ser mantido — isso implica persistência de sessão em andamento, não só ao final (dependência direta do RF07, que precisa ser considerado nesta spec mesmo que sua implementação completa fique para depois)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Concluir uma série e avançar automaticamente para a próxima (Priority: P1)

Durante a execução de um exercício (RF03), o usuário preenche a carga e as repetições feitas da série atual e toca em "Concluir série". Os dados são registrados, o app avança para a próxima série do mesmo exercício, e o descanso entre séries começa a ser contado automaticamente, sem o usuário precisar iniciar nada manualmente.

**Why this priority**: É o ciclo mais frequente e essencial de toda a experiência de treino — sem ele, os dados de carga e reps digitados no RF03 nunca avançam além da primeira série, e o app não cumpre sua função central de acompanhar o treino série a série.

**Independent Test**: Pode ser testado isoladamente iniciando um exercício com múltiplas séries (RF03), preenchendo carga e reps da série 1, tocando em "Concluir série", e confirmando que o indicador de série avança para "Série 2 de N", que os dados da série 1 ficam registrados, e que o início do descanso é disparado.

**Acceptance Scenarios**:

1. **Given** os campos de carga e repetições feitas da série atual estão vazios ou parcialmente preenchidos, **When** o usuário observa a tela, **Then** o botão "Concluir série" aparece desabilitado.
2. **Given** os campos de carga e repetições feitas da série atual estão ambos preenchidos, **When** o usuário observa a tela, **Then** o botão "Concluir série" aparece habilitado.
3. **Given** o botão "Concluir série" está habilitado, **When** o usuário toca nele, **Then** os dados de carga e reps daquela série são registrados, associados ao número da série concluída.
4. **Given** uma série foi concluída e o exercício ainda tem séries planejadas restantes, **When** a tela é atualizada, **Then** o indicador de série avança para a próxima (ex: de "Série 1 de 4" para "Série 2 de 4"), com o campo de repetições feitas limpo para a nova contagem.
5. **Given** o usuário concluiu uma série, **When** a ação é confirmada, **Then** o início da contagem de descanso é disparado automaticamente, sem exigir nenhuma ação adicional do usuário (o comportamento detalhado do cronômetro em si — duração, ajuste, notificação — é definido pelo RF05/RF06, fora do escopo desta feature).

---

### User Story 2 - Concluir um exercício ao terminar todas as suas séries (Priority: P1)

Após concluir a última série planejada de um exercício, o usuário vê o botão "Concluir exercício" ficar disponível. Ao tocar nele, o app volta para a lista de exercícios do treino, exibindo aquele exercício como concluído.

**Why this priority**: Fecha o ciclo iniciado pela User Story 1 e é o mecanismo que permite ao usuário progredir de um exercício para outro dentro do treino — sem ele, o usuário fica preso na tela de execução de um único exercício mesmo após terminar todas as suas séries.

**Independent Test**: Pode ser testado isoladamente concluindo todas as séries planejadas de um exercício (via User Story 1, repetida N vezes) e confirmando que o botão "Concluir exercício" passa a ficar habilitado, e que tocar nele retorna à lista de exercícios com aquele item marcado como concluído.

**Acceptance Scenarios**:

1. **Given** um exercício ainda tem séries planejadas não concluídas, **When** o usuário observa a tela de execução daquele exercício, **Then** o botão "Concluir exercício" aparece desabilitado (ou ausente).
2. **Given** o usuário concluiu a última série planejada de um exercício, **When** a tela é atualizada, **Then** o botão "Concluir exercício" passa a ficar habilitado.
3. **Given** o botão "Concluir exercício" está habilitado, **When** o usuário toca nele, **Then** o app volta para a lista de exercícios do treino.
4. **Given** o usuário concluiu um exercício e voltou para a lista, **When** ele visualiza a lista, **Then** o exercício concluído aparece marcado visualmente como concluído (ex: indicador de check ✓), distinto dos exercícios não iniciados ou pausados.

---

### User Story 3 - Escolher livremente qual exercício fazer a seguir (Priority: P1)

Depois de concluir um exercício, o usuário decide por conta própria qual exercício fazer em seguida — não é obrigado a seguir a ordem do treino original, podendo inclusive retomar um exercício pausado ou iniciar qualquer outro ainda não concluído.

**Why this priority**: Preserva o princípio de navegação não sequencial já estabelecido no RF03 mesmo após a conclusão de exercícios, garantindo que o fluxo real de treino (equipamento ocupado, preferência pessoal) continue funcionando ao longo de todo o treino, não apenas no início.

**Independent Test**: Pode ser testado isoladamente concluindo um exercício, e então selecionando, a partir da lista atualizada, um exercício diferente do "próximo da lista" (pulando um ou mais exercícios ainda não iniciados), confirmando que o app permite iniciar esse exercício normalmente.

**Acceptance Scenarios**:

1. **Given** o usuário acabou de concluir um exercício e está de volta à lista, **When** ele toca em qualquer outro exercício ainda não concluído (não necessariamente o próximo da lista), **Then** o app abre esse exercício normalmente, permitindo continuar ou iniciar sua execução.
2. **Given** existe um exercício pausado (iniciado, mas não concluído) e outros ainda não iniciados, **When** o usuário está escolhendo o próximo exercício, **Then** ele pode escolher tanto retomar o pausado quanto iniciar um dos não iniciados, sem restrição de ordem.

---

### User Story 4 - Retomar o progresso após sair da tela ou fechar o app (Priority: P2)

O usuário está no meio de um treino, com uma ou mais séries e exercícios já concluídos, e precisa sair da tela de execução (ou fechar o app completamente) antes de terminar o treino inteiro. Ao voltar — seja navegando de volta, seja reabrindo o app do zero — ele encontra o treino exatamente como deixou: os mesmos exercícios concluídos continuam concluídos, e os dados das séries já registradas não são perdidos.

**Why this priority**: Sem essa garantia, uma interrupção comum (chamada de telefone, app minimizado, celular reiniciado no meio do treino) faria o usuário perder todo o progresso já registrado, o que é inaceitável para a proposta central do produto (acompanhar o treino sem retrabalho); porém, é uma prioridade abaixo do ciclo básico de registro (US1–US3), pois o registro em si já teria valor mesmo sem sobreviver a um fechamento do app.

**Independent Test**: Pode ser testado isoladamente concluindo pelo menos uma série de um exercício (sem concluir o exercício inteiro), fechando o app completamente, reabrindo-o, navegando de volta ao mesmo treino, e confirmando que a série concluída anteriormente continua registrada e que o exercício aparece no estado correto (pausado, com a série seguinte correta indicada).

**Acceptance Scenarios**:

1. **Given** o usuário concluiu uma ou mais séries de um exercício, mas não o exercício inteiro, **When** ele sai da tela de execução e volta a ela (sem fechar o app), **Then** o exercício continua no mesmo ponto em que estava, com as séries já concluídas preservadas.
2. **Given** o usuário concluiu uma ou mais séries de um exercício, **When** ele fecha o app completamente e o reabre, navegando de volta ao mesmo treino, **Then** o progresso das séries já concluídas continua preservado, e o exercício retoma exatamente de onde parou (mesma série seguinte a registrar).
3. **Given** o usuário concluiu um ou mais exercícios inteiros, **When** ele fecha e reabre o app, **Then** esses exercícios continuam marcados como concluídos na lista.

---

### Edge Cases

- O que acontece se o usuário concluir a última série do último exercício pendente do treino (ou seja, todos os exercícios ficam concluídos)? Esta especificação garante apenas que cada exercício individual seja marcado como concluído e que o usuário volte à lista normalmente; a marcação da sessão inteira como "finalizada" e sua exibição no histórico são escopo do RF07, não desta feature — a lista simplesmente mostrará todos os exercícios concluídos, sem nenhuma ação automática adicional de finalização de sessão sendo definida aqui.
- O que acontece se o usuário tentar tocar em "Concluir exercício" antes de concluir todas as séries planejadas? O botão permanece desabilitado (ou ausente) até a última série ser concluída — não é possível concluir um exercício com séries pendentes.
- O que acontece com o campo de carga ao avançar para uma nova série do mesmo exercício? O valor da carga é pré-preenchido com o valor usado na série anterior (assumindo que o usuário tende a manter a mesma carga entre séries de um mesmo exercício), permanecendo editável; o campo de repetições feitas é sempre limpo para a nova contagem.
- O que acontece se o usuário voltar para a lista de exercícios no meio do preenchimento de uma série (carga/reps digitados, mas "Concluir série" ainda não tocado)? O comportamento de navegação em si (pausar o exercício) já é coberto pelo RF03; esta feature garante apenas que as séries já concluídas (via "Concluir série") sobrevivem a esse tipo de navegação e a fechamentos do app — os valores digitados em uma série ainda não concluída não têm garantia de sobreviver ao fechamento completo do app (embora continuem visíveis normalmente ao apenas navegar entre telas sem fechar o app).
- O que acontece se o usuário tentar concluir um exercício que já está marcado como concluído (reabrindo-o pela lista)? Reabrir um exercício já concluído está fora do escopo desta especificação; a interação prevista aqui é apenas com exercícios ainda não concluídos (não iniciados ou pausados).
- O que acontece ao reabrir o app com um treino em andamento? O app navega para a lista de exercícios do treino (RF02/RF03), não diretamente para o exercício que estava aberto no momento do fechamento — a lista já reflete os estados corretos (concluído/pausado/não iniciado), e o usuário escolhe manualmente qual exercício retomar (ver FR-014 e User Story 3). Não há navegação automática para dentro de um exercício específico.
- O usuário pode corrigir a carga/reps de uma série logo depois de tocar em "Concluir série", ainda dentro da tela de execução? Não, nesta feature. Uma vez concluída, a série não é editável na tela de execução — qualquer correção de um registro já concluído é escopo exclusivo do RF09 (editar registro de série já feito), que ainda não foi especificado (ver FR-015).
- O que acontece se o usuário iniciar o Treino A, sair sem concluí-lo, e depois iniciar o Treino B (ambos do mesmo perfil)? O sistema permite normalmente — múltiplas sessões em andamento simultâneas do mesmo perfil não são bloqueadas nem avisadas (ver "Contrato de Persistência da Sessão"). A lista de treinos (RF02) não indica, nesta feature, quais treinos têm uma sessão em andamento — essa indicação visual é uma decisão adiada para uma iteração futura, não incluída no escopo do RF04.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST manter o botão "Concluir série" desabilitado enquanto os campos de carga e de repetições feitas da série atual não estiverem ambos preenchidos.
- **FR-002**: O sistema MUST habilitar o botão "Concluir série" assim que ambos os campos (carga e repetições feitas) da série atual estiverem preenchidos.
- **FR-003**: Ao tocar em "Concluir série", o sistema MUST registrar os valores de carga e repetições feitas informados, associando-os ao número daquela série do exercício.
- **FR-004**: Ao concluir uma série que não é a última planejada do exercício, o sistema MUST avançar o indicador de série (ex: "Série 2 de 4") para a série seguinte, pré-preenchendo o campo de carga com o valor usado na série recém-concluída e limpando o campo de repetições feitas.
- **FR-005**: Ao concluir uma série, o sistema MUST disparar automaticamente o início da contagem de descanso, sem exigir nenhuma ação adicional do usuário (a experiência completa do cronômetro — duração, ajuste em incrementos, notificação sonora/vibração — é escopo do RF05/RF06).
- **FR-006**: O sistema MUST manter o botão "Concluir exercício" desabilitado (ou ausente) enquanto houver séries planejadas do exercício ainda não concluídas.
- **FR-007**: O sistema MUST habilitar o botão "Concluir exercício" imediatamente após a conclusão da última série planejada daquele exercício.
- **FR-008**: Ao tocar em "Concluir exercício", o sistema MUST retornar o usuário à lista de exercícios do treino (RF03).
- **FR-009**: O sistema MUST exibir, na lista de exercícios, cada exercício concluído com uma marcação visual distinta (ex: indicador de check) das dos exercícios não iniciados ou pausados, reaproveitando o estado `concluido` já previsto para essa lista.
- **FR-010**: O sistema MUST permitir que o usuário selecione, após concluir um exercício, qualquer outro exercício ainda não concluído do treino (pausado ou não iniciado) para continuar, independentemente da ordem original do treino.
- **FR-011**: O sistema MUST persistir, de forma que sobreviva ao fechamento completo do app, cada série concluída (via "Concluir série") e cada exercício concluído (via "Concluir exercício") da sessão de treino em andamento.
- **FR-012**: Ao reabrir o app (ou retornar à tela de execução do mesmo treino), o sistema MUST restaurar o progresso previamente persistido — exercícios concluídos permanecem concluídos, e exercícios com séries parcialmente concluídas retomam a partir da série seguinte à última concluída.
- **FR-013**: O sistema MUST NOT exigir do usuário nenhuma ação manual para salvar o progresso — a persistência de séries e exercícios concluídos MUST ocorrer automaticamente como parte de "Concluir série" e "Concluir exercício".
- **FR-014**: Ao reabrir o app (ou a rota do treino) com uma sessão em andamento, o sistema MUST navegar para a lista de exercícios do treino (RF02/RF03) — nunca diretamente para a tela de execução de um exercício específico. A retomada de um exercício com progresso salvo é sempre uma ação explícita do usuário a partir dessa lista (consistente com a navegação livre já estabelecida na User Story 3 e no RF03).
- **FR-015**: O sistema MUST NOT permitir a edição de carga ou repetições de uma série já concluída (via "Concluir série") a partir da tela de execução desta feature. Qualquer correção de um registro já concluído é escopo exclusivo do RF09 (ainda não especificado); esta feature não introduz nenhum estado de edição para séries passadas.
- **FR-016**: O sistema MUST permitir que um perfil tenha múltiplas sessões de treino em andamento simultaneamente (um treino distinto por sessão), sem bloqueio, aviso ou restrição de qualquer tipo ao iniciar um novo treino enquanto outro já está em andamento para o mesmo perfil (ver "Contrato de Persistência da Sessão").

### Key Entities

- **Sessão de treino em andamento**: representa a execução de um treino específico por um perfil, ainda não finalizada. Contém, no mínimo, o perfil que a iniciou, o treino ao qual pertence, o instante em que foi iniciada, se e quando foi finalizada, e a lista de execuções por exercício (séries concluídas, com carga e repetições registradas). Corresponde à estrutura de "sessão" já delineada no PRD (seção 8) para o RF07 — esta feature cria e atualiza essa sessão a cada série/exercício concluído, mas não implementa a marcação de finalização completa do treino nem sua exibição no histórico (RF07). Ver "Contrato de Persistência da Sessão" abaixo para a estrutura exata adotada por esta feature.
- **Execução do exercício** (dentro da sessão): associa um exercício do treino às séries já concluídas nele (número da série, carga registrada, repetições feitas) e ao estado de conclusão do exercício (concluído ou não). É o que permite à lista de exercícios (RF03) exibir corretamente os estados "concluído" e "pausado" mesmo após reabrir o app.

### Contrato de Persistência da Sessão

Como o RF07 (salvar sessão de treino completa e em andamento) ainda não foi especificado,
mas esta feature já depende de persistir uma sessão em andamento (FR-011 a FR-013), o
contrato abaixo é definido agora — formalmente, não apenas como suposição — para que o
RF07 possa reaproveitá-lo sem exigir migração de dados já salvos por esta feature.

- **Identificação da sessão em andamento**: um perfil pode ter múltiplas sessões em
  andamento simultaneamente — por exemplo, iniciar o Treino A, sair sem concluí-lo, e
  iniciar o Treino B, com ambos permanecendo em andamento ao mesmo tempo, sem bloqueio ou
  aviso do sistema. O sistema MUST manter, por perfil, uma coleção de sessões (uma por
  `treinoId` iniciado), e MUST conseguir localizar a sessão em andamento correspondente a
  um treino específico diretamente, sem precisar varrer um histórico de sessões
  finalizadas. Esta feature não define nenhum limite de sessões simultâneas em andamento
  por perfil.
- **Estrutura da sessão** (campos, independente da tecnologia de persistência escolhida na
  fase de planejamento):
  - `perfilId`: identifica o perfil dono da sessão.
  - `treinoId`: identifica o treino sendo executado.
  - `iniciadaEm`: data/hora (ISO 8601) em que a sessão foi criada (primeira série
    concluída do treino).
  - `finalizadaEm`: `null` enquanto a sessão está em andamento; esta feature MUST manter
    esse campo como `null` durante toda a sua execução — preenchê-lo é escopo exclusivo do
    RF07 (finalização de sessão, automática ou manual).
  - `execucoes`: lista de execuções por exercício, cada uma com:
    - `exercicioId`: identifica o exercício dentro do treino.
    - `seriesRealizadas`: lista das séries já concluídas daquele exercício, cada uma com o
      número da série, a carga registrada (kg, decimal) e as repetições feitas.
    - `status` do exercício dentro da sessão: `em_andamento` (iniciado, com 1 ou mais
      séries concluídas, mas não todas) ou `concluido` (todas as séries planejadas
      concluídas). Um exercício sem nenhuma série concluída simplesmente não possui
      entrada em `execucoes`.
- **Compatibilidade com o RF10**: o campo `finalizadaEm: null` é o mesmo mecanismo já
  contratado pelo RF10 para decidir se a troca de perfil ativo deve ser bloqueada (PRD,
  seção 8) — esta feature MUST popular esse campo corretamente desde já, mesmo sem
  implementar o bloqueio de troca de perfil em si. Como um perfil pode ter múltiplas
  sessões em andamento simultâneas (ver "Identificação da sessão em andamento" acima), a
  verificação de bloqueio que o RF07/RF10 vierem a implementar precisará checar se existe
  **qualquer** sessão do perfil com `finalizadaEm === null`, não apenas "a" sessão do
  perfil — esta feature garante apenas que o campo é corretamente populado em cada sessão
  individual, sem implementar essa verificação agregada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue concluir uma série (preencher carga/reps e tocar em "Concluir série") em no máximo 3 toques, incluindo o preenchimento dos dois campos.
- **SC-002**: 100% das tentativas de tocar em "Concluir série" com algum campo vazio são bloqueadas (botão desabilitado), sem exceção.
- **SC-003**: Ao concluir a última série planejada de um exercício, o botão "Concluir exercício" fica disponível em até 1 interação (a própria conclusão da série), sem passos adicionais.
- **SC-004**: Em 100% dos casos de fechamento completo do app durante um treino em andamento, o progresso de séries e exercícios já concluídos é recuperado integralmente ao reabrir o app e voltar ao treino.
- **SC-005**: O usuário consegue, após concluir um exercício, iniciar qualquer outro exercício ainda não concluído do treino em no máximo 1 toque a partir da lista, sem restrição de ordem.
- **SC-006**: A estrutura de dados da sessão em andamento criada por esta feature é reaproveitada pelo RF07 sem exigir migração ou reformatação dos dados já persistidos por usuários que usaram o app entre a entrega do RF04 e a entrega do RF07.

## Assumptions

- A finalização completa da sessão (preencher `finalizadaEm`, decidir quando isso acontece, bloqueio de troca de perfil associado, exibição no histórico) permanece escopo do RF07; esta feature apenas cria a sessão, mantém `finalizadaEm: null` e a atualiza a cada série/exercício concluído, conforme "Contrato de Persistência da Sessão".
- O disparo do início do descanso (FR-005) é tratado nesta feature apenas como um evento/estado a ser iniciado; a interface visual do cronômetro (contagem regressiva, ajuste de tempo, notificação sonora/vibração ao final) é especificada e implementada pelo RF05/RF06, não por esta feature.
- Ao avançar de uma série para a próxima dentro do mesmo exercício, o valor de carga sugerido para a nova série é o valor usado na série imediatamente anterior (não o `carga_sugerida_kg` original do JSON), refletindo o padrão comum de manter a mesma carga entre séries de um exercício; o campo de repetições feitas sempre inicia vazio a cada nova série.
- Valores digitados em uma série ainda não concluída (carga/reps preenchidos, mas "Concluir série" ainda não tocado) não têm garantia de persistência caso o app seja fechado completamente — apenas séries e exercícios já concluídos são garantidamente recuperados; a navegação simples entre telas (sem fechar o app) continua preservando esses valores em memória, conforme já estabelecido pelo RF03.
- Um treino com todos os seus exercícios concluídos não aciona, por parte desta feature, nenhuma finalização automática de sessão ou navegação especial — o usuário permanece na lista de exercícios, todos marcados como concluídos, até que o RF07 (fora de escopo aqui) defina esse comportamento.
- A lista de treinos (RF02) não é alterada por esta feature para indicar visualmente quais treinos têm uma sessão em andamento — essa é uma decisão adiada, a ser retomada em uma iteração futura (possivelmente junto do RF07, que já lida com o conceito de sessão finalizada vs. em andamento). **Feedback de validação manual (2026-09-17)**: ao sair de um treino em andamento para a lista de treinos, ou ao tentar trocar de perfil (bloqueado pelo RF10), o usuário não consegue identificar visualmente qual treino específico está em andamento — a experiência prática confirmou que essa ausência é perceptível e vale ser priorizada como melhoria de UX numa iteração futura (ex.: um indicador na lista de treinos do RF02 análogo ao "pausado"/"concluído" já usado na lista de exercícios).
- A edição de séries recém-concluídas (mesmo dentro da mesma sessão em andamento) é tratada como parte do RF09, próxima feature da fila após esta e o RF05/RF06 — não há necessidade de uma variante "rápida"/parcial dessa edição dentro do RF04.
