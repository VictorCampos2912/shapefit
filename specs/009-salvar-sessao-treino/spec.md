# Feature Specification: Salvar Sessão de Treino (Completa ou Finalizada Manualmente)

**Feature Branch**: `009-salvar-sessao-treino`

**Created**: 2026-09-18

**Status**: Draft

**Input**: User description: "Baseado no PRD anexo (v1.1) e no criterios-aceite.md, criar a especificação do requisito RF07: salvar sessão de treino (completa ou finalizada manualmente). A sessão é marcada como concluída automaticamente quando todos os exercícios do treino são concluídos (via RF04). Existe também um botão 'Finalizar treino', acessível a qualquer momento durante a execução, permitindo encerrar a sessão mesmo com exercícios pendentes — nesse caso, apenas as séries já registradas são salvas, sem gerar registro vazio para exercícios não iniciados. Finalizar grava o campo finalizadaEm (contrato já estabelecido pelo RF10/RF04) com o timestamp atual, ativando o bloqueio de troca de perfil do RF10 para deixar de valer (sessão não está mais em andamento). AJUSTE ARQUITETURAL NECESSÁRIO: a busca de sessão em sessao-treino-storage.ts (RF04) hoje localiza pelo treinoId sozinho, sem considerar se já está finalizada — corrigir para que, ao iniciar/registrar uma série, a busca encontre apenas uma sessão EM ANDAMENTO (finalizadaEm === null) para aquele treinoId; se não houver nenhuma (porque a única existente já foi finalizada), uma nova sessão distinta deve ser criada, permitindo que o mesmo treino seja executado múltiplas vezes ao longo do tempo, cada execução como uma sessão própria no histórico (RF08). Depois de finalizada, iniciar uma nova execução do mesmo ou de outro treino não deve ter nenhum resíduo da sessão anterior. Usar os critérios de aceite do RF07 no documento criterios-aceite.md anexo. Não implementar código ainda — apenas descrever o comportamento esperado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sessão finalizada automaticamente ao concluir todos os exercícios (Priority: P1)

O usuário conclui todas as séries de todos os exercícios de um treino, um a um, até
não restar nenhum exercício pendente. Sem precisar de nenhuma ação extra, o app
reconhece que o treino foi totalmente concluído e marca a sessão como finalizada,
liberando, entre outras coisas, a possibilidade de trocar de perfil ativo (RF10) e
deixando a sessão pronta para aparecer no histórico (RF08).

**Why this priority**: É o caminho mais comum de uso do app — o usuário que segue o
treino do início ao fim. Sem essa transição automática, toda sessão completa
permaneceria "em andamento" para sempre, quebrando o histórico (RF08) e o bloqueio de
troca de perfil (RF10), que dependem de uma sessão realmente chegar ao estado
finalizado.

**Independent Test**: Concluir manualmente todas as séries de todos os exercícios de
um treino de teste. Verificar que, imediatamente após a última conclusão, a sessão
correspondente já está marcada como finalizada (sem exigir toque em nenhum botão
adicional), e que a troca de perfil ativo deixa de estar bloqueada por causa dessa
sessão.

**Acceptance Scenarios**:

1. **Given** um treino com 2 exercícios, cada um com todas as suas séries já
   registradas, **When** o usuário conclui o último exercício pendente, **Then** a
   sessão é automaticamente marcada como finalizada, sem exigir nenhuma ação
   adicional do usuário.
2. **Given** uma sessão acabou de ser finalizada automaticamente, **When** o usuário
   tenta trocar de perfil ativo (RF10), **Then** a troca não é mais bloqueada por
   causa dessa sessão (a menos que exista outra sessão em andamento de um treino
   diferente).
3. **Given** uma sessão foi finalizada automaticamente, **When** o usuário volta a
   abrir o mesmo treino em uma nova execução, **Then** o app inicia uma sessão nova
   e distinta, sem nenhum resquício de progresso da execução anterior (todos os
   exercícios aparecem como não iniciados).

---

### User Story 2 - Finalizar manualmente com exercícios pendentes (Priority: P1)

O usuário está no meio de um treino, com um ou mais exercícios ainda não iniciados
ou não concluídos, e decide encerrar a sessão por conta própria (por exemplo, porque
precisa parar mais cedo). Ele toca em um botão "Finalizar treino", disponível a
qualquer momento durante a execução, e a sessão é encerrada imediatamente — apenas
com o que já foi de fato registrado até aquele momento.

**Why this priority**: É o mecanismo que dá ao usuário controle sobre quando parar,
essencial para o uso real (nem todo treino é concluído do início ao fim em uma única
sentada). Sem ele, a única forma de finalizar seria completar 100% do treino, o que
não reflete a realidade do uso.

**Independent Test**: Iniciar um treino com vários exercícios, concluir séries de
apenas um exercício (deixando os demais intocados), tocar em "Finalizar treino", e
verificar que a sessão é marcada como finalizada contendo apenas o que foi
registrado, sem nenhum exercício "vazio" para os que nunca foram tocados.

**Acceptance Scenarios**:

1. **Given** o usuário está executando um treino com 3 exercícios e já concluiu
   algumas séries de apenas 1 deles, **When** ele toca em "Finalizar treino", **Then**
   a sessão é imediatamente marcada como finalizada, contendo o registro do
   exercício parcialmente concluído e nenhum registro para os outros 2 exercícios
   nunca iniciados.
2. **Given** o usuário ainda não registrou nenhuma série em nenhum exercício do
   treino, **When** ele toca em "Finalizar treino" mesmo assim, **Then** a sessão é
   finalizada sem nenhum exercício registrado (sessão "vazia", mas ainda assim
   validamente finalizada).
3. **Given** o usuário está na tela de lista de exercícios do treino, **When** ele
   observa a tela, **Then** o botão "Finalizar treino" está visível ali. *(Ajustado
   após validação manual: o botão inicialmente também aparecia na tela de execução
   de um exercício específico, mas isso não fazia sentido na prática — dentro da
   execução de um exercício, o botão parecia um atalho de "emergência" fora de
   contexto; a partir desta revisão, o botão aparece **apenas** na lista de
   exercícios do treino — ver Assumptions.)*
4. **Given** o usuário concluiu todos os exercícios exceto um, que está parcialmente
   registrado, **When** ele toca em "Finalizar treino" nesse estado intermediário,
   **Then** a sessão é finalizada com o que já estava registrado até então, sem
   perguntar ou exigir que ele complete o exercício restante primeiro.

---

### User Story 3 - Repetir a execução do mesmo treino ao longo do tempo (Priority: P2)

Dias depois de ter finalizado uma sessão de um treino específico, o usuário abre o
mesmo treino novamente para executá-lo de novo (por exemplo, na próxima vez que for à
academia). O app trata essa nova execução como uma sessão totalmente independente da
anterior — sem misturar progresso, sem reabrir a sessão antiga, e permitindo que, no
futuro, o histórico (RF08) mostre cada execução separadamente.

**Why this priority**: Sustenta o uso recorrente do app ao longo do tempo — um treino
não é executado uma única vez na vida, mas repetidamente (ex.: toda semana). Sem essa
separação clara entre execuções, o histórico de evolução de carga (RF08) ficaria
inutilizável, pois todas as tentativas se misturariam em uma única sessão "eterna".
Prioridade P2 porque, embora essencial para o valor de longo prazo do app, não bloqueia
o uso imediato de uma primeira execução (User Stories 1 e 2 já cobrem isso).

**Independent Test**: Finalizar uma sessão de um treino (automaticamente ou
manualmente), depois abrir o mesmo treino novamente e começar a registrar séries.
Verificar que a nova sessão criada é distinta da anterior (não reabre nem soma
progresso a ela), com todos os exercícios aparecendo como não iniciados no começo
dessa nova execução.

**Acceptance Scenarios**:

1. **Given** o usuário já finalizou uma sessão de um treino no passado, **When** ele
   abre esse mesmo treino novamente e conclui uma série de um exercício, **Then** uma
   nova sessão é criada para essa nova execução, sem alterar ou reabrir a sessão já
   finalizada anteriormente.
2. **Given** o usuário tem duas sessões distintas do mesmo treino, uma finalizada no
   passado e uma nova em andamento, **When** ele consulta o estado de "sessão em
   andamento" usada pelo bloqueio de troca de perfil (RF10), **Then** apenas a nova
   sessão (ainda não finalizada) conta para esse bloqueio — a sessão antiga já
   finalizada não influencia mais nada.
3. **Given** o usuário iniciou e finalizou várias sessões do mesmo treino ao longo do
   tempo, **When** essas sessões forem eventualmente listadas (RF08, fora do escopo
   desta feature), **Then** cada execução deve poder ser identificada como uma
   entrada distinta, não agregada nem sobrescrita pelas demais.

---

### User Story 4 - Ver quantas vezes já executou cada treino (Priority: P3)

*(Adicionada após validação manual do restante desta feature — demanda de UX
identificada durante a implementação, não parte do escopo original do PRD/RF07;
ver Assumptions.)*

Na tela onde o usuário escolhe qual treino executar (lista de treinos), ele
consegue ver, de relance, quantas vezes já concluiu cada treino no passado — sem
precisar abrir cada um para descobrir. Treinos nunca finalizados não exibem nada
diferente do padrão atual; a partir da primeira sessão finalizada, um contador
visível (um número dentro de um indicativo circular, junto ao nome do treino)
mostra a quantidade de vezes.

**Why this priority**: Não é essencial para o registro correto de sessões (já
garantido pelas User Stories 1-3), mas melhora diretamente a usabilidade da
tela de lista de treinos, que hoje não distingue visualmente um treino nunca
feito de um já executado dezenas de vezes — informação que a própria existência
de múltiplas sessões finalizadas por treino (User Story 3) passou a tornar
disponível, mas que ainda não era exibida em lugar nenhum.

**Independent Test**: Finalizar duas sessões distintas do mesmo treino (em
momentos diferentes); voltar para a tela de lista de treinos e confirmar que o
contador exibido para aquele treino mostra "2". Um treino nunca finalizado não
deve exibir nenhum contador.

**Acceptance Scenarios**:

1. **Given** um treino nunca teve nenhuma sessão finalizada, **When** o usuário
   visualiza a lista de treinos, **Then** nenhum contador é exibido para esse
   treino (aparência idêntica à de antes desta funcionalidade existir).
2. **Given** um treino já teve exatamente 1 sessão finalizada, **When** o
   usuário visualiza a lista de treinos, **Then** um contador exibindo "1" é
   exibido junto ao nome desse treino.
3. **Given** um treino já teve várias sessões finalizadas ao longo do tempo,
   **When** o usuário finaliza mais uma sessão desse treino e volta para a
   lista, **Then** o contador exibido é atualizado para refletir a nova
   contagem total, sem precisar fechar e reabrir o app.

---

### Edge Cases

- O que acontece se o usuário tocar em "Finalizar treino" duas vezes seguidas
  rapidamente (ex.: duplo toque)? → A segunda finalização não deve gerar uma
  segunda sessão nem sobrescrever a primeira com dados diferentes — finalizar uma
  sessão já finalizada é tratado como uma operação sem efeito adicional (idempotente),
  sem erro visível ao usuário.
- O que acontece se o usuário concluir a última série do último exercício pendente
  (disparando a finalização automática) e, no mesmo instante, tocar em "Finalizar
  treino" (ex.: o botão ainda estava visível na tela)? → O resultado final é o mesmo:
  a sessão termina finalizada exatamente uma vez, com todas as séries já registradas
  até aquele momento — não deve haver erro nem uma segunda sessão criada.
- O que acontece se existirem múltiplos treinos em andamento simultaneamente (já
  permitido pelo RF04) e o usuário finalizar apenas um deles? → Apenas a sessão do
  treino finalizado passa a não bloquear mais a troca de perfil; as demais sessões
  em andamento continuam bloqueando normalmente, conforme o já estabelecido pelo
  RF10/RF04.
- O que acontece se o usuário sair da tela de execução (sem finalizar) e voltar
  depois — a sessão em andamento antiga (não finalizada) ainda é reconhecida
  corretamente, sem ser confundida com uma sessão nova? → Sim: enquanto existir uma
  sessão em andamento (`finalizadaEm` nulo) para aquele treino, reabrir o treino
  continua essa mesma sessão, retomando o progresso já registrado — apenas sessões
  já finalizadas são "ignoradas" na hora de decidir se uma nova sessão precisa ser
  criada.
- O que acontece se o usuário iniciar uma nova execução do mesmo treino enquanto uma
  sessão anterior dele *ainda está em andamento* (não finalizada)? → Esse cenário não
  é introduzido por esta feature: como já estabelecido pelo RF04, reabrir um treino
  com uma sessão em andamento existente continua essa mesma sessão (não cria uma
  segunda simultânea) — a criação de uma sessão nova e distinta só ocorre quando a
  única sessão existente para aquele treino já está finalizada.
- O que acontece se o usuário finalizar a sessão (automática ou manualmente)
  enquanto o cronômetro de descanso (RF05) ainda está contando, com um aviso já
  agendado no sistema operacional (RF06)? → O cronômetro é cancelado junto da
  finalização, e o aviso agendado é cancelado com ele — o usuário não deve receber,
  minutos depois de já ter encerrado o treino, um som/vibração de "hora de continuar"
  referente a uma sessão que não existe mais como "em andamento".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE marcar automaticamente uma sessão de treino como
  finalizada (preenchendo o campo já estabelecido `finalizadaEm` com o horário
  atual) no momento em que todos os exercícios do treino tiverem sido concluídos,
  sem exigir nenhuma ação adicional do usuário.
- **FR-002**: O sistema DEVE disponibilizar um controle ("Finalizar treino") na
  tela de lista de exercícios do treino, permitindo ao usuário encerrar a sessão
  manualmente, independentemente de quantos exercícios ainda estejam pendentes ou
  não iniciados. *(Ajustado após validação manual — ver Assumptions: o controle
  não é replicado na tela de execução de um exercício específico, pois nesse
  contexto ele soava como uma ação de "emergência" fora de lugar; a tela de lista
  já é acessível a qualquer momento a partir de "← Voltar para exercícios".)*
- **FR-003**: Ao finalizar manualmente uma sessão com exercícios pendentes, o
  sistema DEVE preservar apenas os registros de séries já efetivamente realizados
  até aquele momento — nenhum registro (vazio ou com valores padrão) DEVE ser criado
  para exercícios que o usuário nunca chegou a iniciar.
- **FR-004**: Finalizar uma sessão (automática ou manualmente) DEVE gravar o
  timestamp atual no campo `finalizadaEm` dessa sessão, usando o mesmo contrato de
  dados já estabelecido pelo RF04/RF10 (`finalizadaEm: string | null`).
- **FR-005**: Uma vez que uma sessão tenha `finalizadaEm` preenchido, ela DEVE deixar
  de contar como "sessão em andamento" para efeitos do bloqueio de troca de perfil
  ativo já estabelecido pelo RF10 — se não houver nenhuma outra sessão em andamento
  para o mesmo perfil, a troca de perfil DEVE deixar de ser bloqueada.
- **FR-006**: O sistema DEVE tratar finalizar uma sessão que já está finalizada como
  uma operação sem efeito adicional (idempotente) — não DEVE gerar erro visível ao
  usuário, não DEVE criar uma segunda sessão, e não DEVE alterar o `finalizadaEm` já
  gravado anteriormente.
- **FR-007**: Ao localizar a sessão de um treino para registrar uma nova série ou
  marcar um exercício como concluído, o sistema DEVE considerar apenas sessões desse
  treino que ainda estejam em andamento (`finalizadaEm` nulo) — sessões já
  finalizadas do mesmo treino NÃO DEVEM ser reabertas nem ter seu conteúdo alterado
  por essas operações.
- **FR-008**: Se não existir nenhuma sessão em andamento para um treino no momento em
  que uma nova série é registrada (por exemplo, porque a única sessão existente
  daquele treino já foi finalizada anteriormente), o sistema DEVE criar uma nova
  sessão distinta, iniciando um novo ciclo de execução independente das sessões já
  finalizadas anteriormente para o mesmo treino.
- **FR-009**: Cada sessão finalizada DEVE permanecer identificável de forma distinta
  das demais sessões (finalizadas ou em andamento) do mesmo treino e do mesmo perfil,
  de modo a poder ser listada individualmente no histórico de evolução (RF08, fora do
  escopo desta feature).
- **FR-010**: Ao iniciar uma nova execução de um treino cuja única sessão anterior já
  está finalizada, o sistema DEVE apresentar todos os exercícios desse treino como
  não iniciados, sem nenhum resquício visual ou de dados (séries, cargas, reps) da
  execução anterior já finalizada.
- **FR-011**: Se houver um cronômetro de descanso ativo (RF05) associado ao treino no
  momento em que a sessão é finalizada (automática ou manualmente), o sistema DEVE
  cancelar esse cronômetro junto — incluindo o aviso sonoro/vibração já agendado no
  sistema operacional (RF06) — de modo que nenhum aviso de "descanso concluído"
  dispare posteriormente para uma sessão que já foi encerrada.
- **FR-012**: Cada sessão de treino DEVE possuir um identificador próprio, distinto e
  atribuído no momento em que a sessão é criada, de forma que sessões diferentes do
  mesmo treino (algumas já finalizadas, no máximo uma em andamento — ver FR-008)
  possam ser individualmente referenciadas e diferenciadas entre si, mesmo
  compartilhando o mesmo treino e o mesmo perfil.
- **FR-013** *(adicionado após validação manual — demanda de UX, ver User Story 4 e
  Assumptions)*: A tela de lista de treinos DEVE exibir, para cada treino, a
  quantidade de sessões já finalizadas daquele treino, na forma de um indicativo
  visual (contador). Treinos sem nenhuma sessão finalizada NÃO DEVEM exibir esse
  indicativo. A contagem DEVE refletir imediatamente novas finalizações, sem exigir
  que o usuário feche e reabra o app.

### Key Entities *(include if feature involves data)*

- **Sessão de treino**: já uma entidade existente (estabelecida pelo RF04),
  representando uma execução específica de um treino por um perfil, contendo o
  horário de início, o horário de finalização (`finalizadaEm`, nulo enquanto em
  andamento) e o conjunto de execuções de exercícios com suas séries registradas.
  Esta feature é responsável por preencher `finalizadaEm` (antes sempre nulo), por
  garantir que operações de registro em andamento nunca reabram uma sessão já
  finalizada — em vez disso, iniciam uma nova sessão distinta para o mesmo treino —
  e por introduzir um identificador próprio da sessão (`id`, ver FR-012), necessário
  agora que múltiplas sessões do mesmo treino coexistem (o `treinoId` sozinho deixa
  de ser suficiente para diferenciá-las).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das sessões em que o usuário conclui todos os exercícios de um
  treino são automaticamente marcadas como finalizadas, sem exigir nenhum toque
  adicional além das próprias conclusões de série/exercício já feitas.
- **SC-002**: O usuário consegue encerrar uma sessão manualmente, a partir de
  qualquer tela dentro da execução do treino, em um único toque no controle de
  finalização.
- **SC-003**: 100% dos exercícios não iniciados no momento de uma finalização manual
  não geram nenhum registro no histórico — apenas o que foi de fato realizado é
  preservado.
- **SC-004**: Depois de finalizar uma sessão, o usuário consegue iniciar uma nova
  execução do mesmo treino (ou de outro) imediatamente, sem qualquer vestígio visual
  ou de dados da sessão anterior já finalizada.
- **SC-005**: A troca de perfil ativo deixa de ser bloqueada em até uma finalização
  de sessão (automática ou manual) após não existir mais nenhuma sessão em
  andamento para o perfil.

## Assumptions

- O campo `finalizadaEm` e o formato de sessão (`SessaoRegistro`/`SessaoTreino`) já
  foram estabelecidos pelo RF04/RF10 e são reutilizados sem alteração de forma por
  esta feature — apenas o momento em que `finalizadaEm` passa de `null` para um
  timestamp é o novo comportamento introduzido aqui.
- A busca de "sessão em andamento para um treino" (usada ao registrar séries e ao
  marcar exercícios como concluídos) precisa passar a considerar exclusivamente
  sessões com `finalizadaEm` nulo — hoje essa busca localiza qualquer sessão daquele
  treino, independentemente do estado de finalização, o que precisa ser corrigido
  como parte desta feature para que o comportamento descrito nas User Stories 1 e 3
  funcione corretamente (permitir múltiplas execuções do mesmo treino ao longo do
  tempo, cada uma como uma sessão própria).
- Não há um limite para quantas sessões finalizadas um mesmo treino pode acumular ao
  longo do tempo — cada nova execução gera uma nova sessão, sem descartar as
  anteriores (elas continuam existindo para consulta futura no histórico, RF08).
- A exibição do controle "Finalizar treino" não exige uma tela de confirmação
  dedicada nesta especificação — o app já usa confirmações (`Alert`) em outras
  operações potencialmente destrutivas (ex.: edição de série, RF09a); se uma
  confirmação for desejada para evitar toques acidentais, essa decisão de interface
  específica fica para a fase de design/planejamento, não como um requisito
  funcional obrigatório desta spec.
- O histórico de evolução por exercício (RF08) que consumirá essas sessões
  finalizadas está fora do escopo desta feature — esta spec garante apenas que os
  dados ficam corretamente estruturados (sessões distintas, com `finalizadaEm`
  preenchido) para que o RF08 possa exibi-los no futuro.
- Múltiplos treinos em andamento simultaneamente (já permitido pelo RF04) continuam
  permitidos; finalizar um deles não afeta o estado dos demais.
- Cancelar o cronômetro de descanso e o aviso agendado (RF05/RF06) ao finalizar a
  sessão é tratado como parte do próprio ato de finalizar — não como uma etapa
  separada que o usuário precisa realizar antes. Se não houver nenhum cronômetro
  ativo no momento da finalização (por exemplo, o usuário já não estava em
  descanso), esta parte do comportamento simplesmente não tem efeito, sem gerar
  erro.
- A sessão de treino passa a ter um `id` próprio, gerado no mesmo padrão já usado
  para identificadores de outras entidades do app (ex.: `Treino.id`, `Perfil.id`) —
  um identificador único atribuído na criação da sessão, não derivado do `treinoId`
  nem do horário de início. Esse identificador é o que permite, a partir da User
  Story 3, diferenciar de forma inequívoca cada execução do mesmo treino ao longo
  do tempo.
- **Sessões de treino já persistidas antes desta feature (dados de teste dos RF04,
  RF05 e RF06, criados sem o campo `id`) não são migradas.** Como o app ainda não
  tem usuários reais além do próprio desenvolvedor durante o desenvolvimento, esta
  spec assume que o armazenamento local do aparelho é limpo (ou o app é
  reinstalado do zero) antes da validação manual desta feature — não é
  especificado nenhum comportamento de compatibilidade retroativa para sessões
  sem `id`. Se, no futuro, o app já tiver usuários reais com sessões antigas nesse
  formato, uma migração de dados seria necessária antes desta feature poder ser
  implantada com segurança — isso está fora do escopo desta spec.
- **Ajustes de UX identificados durante a validação manual em dispositivo real
  (posteriores à implementação inicial e ao plano original desta feature), não
  parte do pedido original do PRD/RF07:**
  - O botão "Finalizar treino" (FR-002) foi inicialmente implementado visível
    tanto na lista de exercícios quanto na tela de execução de um exercício
    específico, exatamente como a spec original pedia (User Story 2, Acceptance
    Scenario 3). Ao validar manualmente, esse posicionamento na tela de um
    exercício específico não fez sentido na prática — o botão parecia um atalho
    de "encerramento de emergência" fora de contexto dentro do fluxo de registrar
    uma série. Ajustado para aparecer **apenas** na tela de lista de exercícios.
  - A cor do botão "Finalizar treino" foi inicialmente a mesma cor de sucesso
    (verde) usada por "Concluir exercício". Como finalizar o treino não é
    necessariamente uma ação "positiva" (pode estar sendo usada para encerrar com
    exercícios pendentes), a cor foi ajustada para o tom de atenção/`warning` já
    existente no tema do app, distinguindo visualmente essa ação de uma conclusão
    bem-sucedida.
  - A User Story 4 (contador de sessões finalizadas por treino, FR-013) foi
    proposta pelo usuário ao validar esta feature na prática, percebendo que a
    tela de lista de treinos (RF02) não distinguia visualmente treinos nunca
    executados de treinos já executados múltiplas vezes — informação que só se
    tornou disponível de forma estruturada a partir desta própria feature (RF07,
    múltiplas sessões finalizadas distintas por treino). Não fazia parte do
    escopo original do PRD nem da spec inicial deste requisito.
