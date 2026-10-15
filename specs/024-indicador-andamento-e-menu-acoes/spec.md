# Feature Specification: Indicador de Sessão em Andamento na Lista de Treinos e Remoção do Treino de Exemplo

**Feature Branch**: `024-indicador-andamento-e-menu-acoes`

**Created**: 2026-10-14

**Status**: Implemented — validado em Android em 2026-10-15 (Princípio III);
iOS pendente por falta de conta Apple Developer (mesma situação das specs
022/023)

**Requisito**: RF23 (PRD, seção 6 — nova entrada; número confirmado em 2026-10-14 ao
consultar a tabela da seção 6, nenhuma entrada prévia usa RF23). **Nota importante**:
o pedido original hipotetizou que estes ajustes poderiam ser apenas uma emenda aos
RF02/RF04/RF14, sem RF novo — a conferência da tabela mostra o contrário: **toda**
melhoria pós-MVP registrada até hoje (RF11 a RF22, 12 entradas) recebeu seu próprio
número, mesmo quando descrita como "estende RFxx" (ex.: RF16 "estende o RF02", RF21
"estende o RF01/RF03/RF04/RF11/RF20") e mesmo quando agrupa duas melhorias pequenas e
relacionadas pedidas juntas (precedente direto: RF21). Não há, nesta tabela, nenhuma
entrada pós-MVP registrada como emenda pura, sem número próprio. Por isso esta spec
assume **RF23** como nova entrada, agrupando as duas melhorias desta feature (mesmo
padrão da RF21): Parte 1 estende o RF02 (lista de treinos) e o RF04 (estrutura de
"sessão em andamento", `finalizadaEm`); Parte 2 estende o RF14 (tela de Ações) e o RF01
(decisão original de incluir um arquivo de exemplo pré-carregado). Ver "Assumptions"
para o raciocínio completo — **esta é uma decisão explícita para o usuário revisar
antes do `/speckit.plan`, não um fato assumido silenciosamente**.

**Nota**: Dois ajustes pequenos, pedidos juntos, mas sem relação funcional entre si:
(1) a lista de treinos passa a destacar visualmente qual(is) treino(s) têm uma sessão
em andamento, fechando uma lacuna documentada desde a especificação do RF04 (ver
`docs/criterios-aceite.md`: "Observação registrada durante a spec do RF04 (revisitar
depois, fora deste requisito): a lista de treinos não indica visualmente quais treinos
têm uma sessão em andamento"); (2) a ação "Importar treino de exemplo" sai do menu de
Ações (RF14) por não fazer mais sentido, levando consigo o código e o asset que
ficarem sem nenhum outro uso.

**Input**: User description: "Ajustes na tela de lista de treinos e no menu de Ações.
Não implementar código ainda — apenas descrever o comportamento esperado.

1. Indicador de treino em andamento na lista de treinos (estende o RF02/RF04). Hoje,
   se o usuário inicia um treino e sai da tela, a tela de lista de treinos (que o app
   costuma abrir ao voltar) não mostra qual treino está em andamento; só a tela
   interna do treino mostra o exercício em andamento. Quando existir uma sessão em
   andamento (finalizadaEm null) de um treino, o item desse treino na lista deve ter
   destaque visual igual ao usado hoje para "exercício em andamento" (mesma
   cor/linguagem visual, sem inventar um novo padrão). Como vários treinos em
   andamento são permitidos, todos devem ser destacados ao mesmo tempo. Ao finalizar a
   sessão, o destaque some. Treinos sem sessão em andamento ficam exatamente como
   hoje. Sem nenhuma mudança em como a sessão é guardada (continua em AsyncStorage por
   uid).

2. Remover "Importar treino de exemplo" do menu de Ações (estende o RF14/RF01). A
   ação não faz mais sentido. Deve sair do menu, junto com o código e o asset que
   ficarem sem uso, mas só se nada mais os referenciar (conferir antes; os arquivos em
   docs/exemplos/ usados em testes manuais NÃO devem ser apagados). As outras ações do
   menu continuam idênticas. Os critérios de aceite do RF14 e do RF01 que citam o
   exemplo pré-carregado precisam ser emendados no docs/criterios-aceite.md (marcar
   como removido, sem apagar o histórico).

Restrições:
- Somente JS, sem mudança em Firestore, rules ou dependências.
- O número do RF deve ser lido da tabela da seção 6 do docs/PRD-app-treino.md; não
  presumir. Se esses ajustes não exigirem RF novo e forem emenda aos RF02, RF04 e
  RF14, dizer isso explicitamente.
- Validação em Android (iOS segue pendente por falta de conta Apple Developer, como
  nas specs 022 e 023).
- Seguir a Constitution v2.0.0. Ao terminar, parar para eu revisar o pacote (spec,
  checklist) antes do /speckit.plan."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reconhecer de volta qual treino estava em andamento (Priority: P1)

O usuário inicia um treino, registra algumas séries, sai da tela de execução (volta
para a lista "Meus treinos" ou troca de aba) e, mais tarde, volta para a lista. Ele
quer identificar de imediato qual treino estava em andamento, sem abrir cada treino um
por um para descobrir e sem depender da própria memória.

**Why this priority**: é a lacuna relatada pelo usuário e já documentada como
pendência desde a especificação do RF04 — hoje só a tela interna de execução mostra o
exercício em andamento; a lista não mostra nada.

**Independent Test**: Iniciar uma sessão de um treino (completar ao menos uma série,
sem finalizar), sair para a lista de treinos e confirmar que o item desse treino
exibe o destaque visual de "em andamento"; fechar e reabrir o app e confirmar que o
destaque continua aparecendo.

**Acceptance Scenarios**:

1. **Given** um treino sem nenhuma sessão em andamento, **When** o usuário inicia uma
   sessão desse treino e volta para a lista de treinos, **Then** o item desse treino
   passa a exibir o mesmo destaque visual já usado hoje para "exercício em andamento"
   (cor/fundo/borda de aviso), sem nenhum padrão visual novo.
2. **Given** o treino do cenário anterior com sessão em andamento, **When** o usuário
   fecha o app completamente e o reabre, **Then** o item continua exibindo o destaque
   já na primeira exibição da lista.
3. **Given** um treino sem nenhuma sessão em andamento, **When** a lista de treinos é
   exibida, **Then** o item desse treino aparece exatamente como hoje, sem nenhum
   destaque — comportamento idêntico ao anterior a esta feature.

---

### User Story 2 - Vários treinos em andamento ao mesmo tempo (Priority: P1)

O usuário inicia o Treino A, sai sem finalizar, inicia o Treino B também sem
finalizar (permitido desde o RF04) e volta para a lista. Ele quer ver os dois treinos
destacados ao mesmo tempo, não apenas o mais recente.

**Why this priority**: o app já permite múltiplos treinos em andamento simultâneos
(decisão do RF04); um indicador que mostrasse só um treino por vez seria incompleto e
enganoso.

**Independent Test**: Iniciar sessões de dois treinos diferentes, sem finalizar
nenhuma, voltar para a lista e confirmar que os dois itens aparecem destacados ao
mesmo tempo.

**Acceptance Scenarios**:

1. **Given** dois ou mais treinos com sessão em andamento simultaneamente, **When** a
   lista de treinos é exibida, **Then** todos os itens correspondentes exibem o
   destaque ao mesmo tempo, sem limite de quantidade.
2. **Given** a situação do cenário anterior, **When** o usuário finaliza a sessão de
   apenas um dos treinos em andamento, **Then** somente o item desse treino perde o
   destaque — os demais continuam destacados.

---

### User Story 3 - O destaque some ao finalizar a sessão (Priority: P2)

O usuário termina de verdade uma sessão que estava em andamento (RF07/RF12). Ele
espera que, ao voltar para a lista, o treino não apareça mais destacado como "em
andamento", já que não está mais.

**Why this priority**: é a contraparte necessária da US1 — sem isso, o destaque
perderia credibilidade, ficando "preso" em treinos já finalizados.

**Independent Test**: Finalizar uma sessão em andamento (fluxo normal de conclusão de
treino) e confirmar que, ao voltar para a lista de treinos, o destaque desapareceu do
item correspondente.

**Acceptance Scenarios**:

1. **Given** um treino com sessão em andamento e destacado na lista, **When** o
   usuário finaliza essa sessão, **Then** ao voltar para a lista de treinos o destaque
   não aparece mais nesse item.
2. **Given** o treino do cenário anterior já finalizado, **When** o usuário inicia uma
   nova sessão do mesmo treino (RF12), **Then** o destaque volta a aparecer, já que há
   novamente uma sessão em andamento.

---

### User Story 4 - Menu de Ações sem a ação de treino de exemplo (Priority: P2)

O usuário abre o menu de Ações (ícone de três pontos) e vê apenas as ações que ainda
fazem sentido: sair da conta, importar treino e créditos do catálogo. A ação
"Importar treino de exemplo" não existe mais.

**Why this priority**: é uma limpeza independente da indicação visual (US1-3); baixo
risco, mas de valor menor que resolver a lacuna de visibilidade do treino em
andamento.

**Independent Test**: Abrir o menu de Ações e confirmar que aparecem apenas as três
ações restantes (sair da conta, importar treino, créditos), sem nenhum vestígio da
ação removida; confirmar que as três ações restantes continuam funcionando exatamente
como antes.

**Acceptance Scenarios**:

1. **Given** o menu de Ações, **When** o usuário o abre, **Then** a ação "Importar
   treino de exemplo" não aparece em lugar nenhum da tela.
2. **Given** o menu de Ações sem a ação removida, **When** o usuário usa qualquer uma
   das três ações restantes, **Then** cada uma se comporta exatamente como antes desta
   feature.
3. **Given** o código-fonte do app depois desta feature, **When** se verifica se há
   alguma referência à função/handler de importar treino de exemplo ou ao asset do
   treino de exemplo embutido no app, **Then** nenhuma referência a código ou asset
   que ficou órfão após a remoção é encontrada (FR-010) — nem a função nem o asset
   embutido continuam existindo no código.
4. **Given** a pasta `docs/exemplos/`, usada em testes manuais de importação,
   **When** esta feature é implementada, **Then** nenhum arquivo dessa pasta é apagado
   ou alterado.

### Edge Cases

- Um treino tem sessão em andamento **e** faz parte de um ciclo com anel de progresso
  visível (RF15) → os dois indicadores (anel de progresso e destaque de "em
  andamento") aparecem ao mesmo tempo no mesmo item, sem um substituir o outro.
- Dois treinos homônimos (RF02/RF16) em que só um deles tem sessão em andamento →
  apenas o item correspondente a esse treino específico (por identificador interno,
  não pelo nome) exibe o destaque; o homônimo sem sessão em andamento permanece sem
  destaque, preservando a distinção já garantida pelo RF02/RF16.
- O usuário permanece na tela de lista, sem trocar de aba nem voltar a ela, e uma
  sessão muda de estado "por fora" desse fluxo → fora de escopo; o destaque só é
  recalculado quando a lista ganha foco, mesmo princípio já usado hoje pelas
  contagens e datas de finalização (RF02/RF16) — não há mecanismo de atualização em
  tempo real nem hoje nem nesta feature.
- Um usuário abre um exercício e toca em "Iniciar exercício", mas sai sem concluir
  nenhuma série → **corrigido durante o `/speckit-tasks` (verificação no código,
  ver `research.md`, Decisão 7)**: nenhuma `SessaoTreino` chega a ser criada nesse
  caso — o registro da sessão (com `finalizadaEm: null`) só passa a existir a
  partir da primeira série efetivamente concluída (`registrarSerieConcluida`); até
  lá não há nada com `finalizadaEm === null` para o destaque consultar. Logo, o
  treino **não** aparece destacado só por o usuário ter aberto/iniciado um
  exercício — o destaque começa exatamente quando a primeira série é concluída,
  nunca antes (versão anterior desta spec afirmava o contrário; corrigida aqui).
- Nenhum treino tem sessão em andamento → nenhum item exibe destaque; tela idêntica à
  anterior a esta feature, incluindo o estado vazio (nenhum treino importado).
- Uma sessão é iniciada e abandonada (o usuário nunca volta para finalizá-la) →
  o item desse treino permanece destacado indefinidamente, por tempo ilimitado; é um
  comportamento conhecido e aceito nesta feature, não um bug a corrigir aqui — um
  eventual tratamento de sessões abandonadas (expiração, limpeza automática, ou
  equivalente) fica fora de escopo, para uma futura migração de sessões/ciclo.

## Requirements *(mandatory)*

### Functional Requirements

**Indicador de sessão em andamento (estende RF02/RF04)**

- **FR-001**: A lista de treinos DEVE exibir, para cada treino que tiver uma sessão em
  andamento (sessão com `finalizadaEm` igual a `null`) no momento em que a lista é
  exibida ou ganha foco, o mesmo destaque visual (cor de fundo e borda) já usado hoje
  para indicar "exercício em andamento" na tela de execução — sem introduzir nenhum
  padrão visual novo.
- **FR-002**: Um treino sem sessão em andamento DEVE permanecer exatamente como hoje,
  sem nenhuma alteração visual causada por esta feature.
- **FR-003**: Quando mais de um treino tiver sessão em andamento simultaneamente,
  TODOS os itens correspondentes DEVEM exibir o destaque ao mesmo tempo, sem limite de
  quantidade nem priorização entre eles — consistente com a permissão já existente
  (RF04) de múltiplos treinos em andamento ao mesmo tempo.
- **FR-004**: O destaque DEVE deixar de aparecer no item de um treino assim que a
  sessão em andamento correspondente for finalizada (RF07/RF12) e a lista ganhar foco
  novamente — mesmo mecanismo de atualização por foco já usado hoje pela lista para
  refletir contagens de sessões e datas de finalização (RF02/RF16), sem exigir nenhum
  mecanismo novo de atualização em tempo real enquanto a lista permanece aberta sem
  ganhar foco.
- **FR-005**: Esta feature NÃO DEVE alterar onde nem como a sessão em andamento é
  persistida — permanece em AsyncStorage, chaveada pela conta autenticada (`uid`),
  exatamente como hoje (RF04, migração de chave pela spec 022); a feature apenas lê
  essa informação já existente para decidir o destaque.
- **FR-006**: O destaque desta feature DEVE coexistir com os demais elementos já
  exibidos no item da lista (contador de sessões finalizadas, anel de progresso de
  ciclo do RF15, texto "Finalizado em"/"Nunca treinado" do RF16), sem ocultar ou
  substituir nenhum deles.
- **FR-007**: A identificação de qual treino tem sessão em andamento DEVE ser feita
  pelo identificador interno do treino, não pelo nome — preservando a distinção entre
  treinos homônimos já garantida pelo RF02/RF16.

**Remoção da ação "Importar treino de exemplo" (estende RF14/RF01)**

- **FR-008**: A ação "Importar treino de exemplo" DEVE deixar de existir no menu de
  Ações — não pode estar acessível por nenhum caminho do app depois desta feature.
- **FR-009**: As demais ações do menu (sair da conta, importar treino, créditos do
  catálogo de exercícios) DEVEM continuar se comportando exatamente como hoje, sem
  nenhuma alteração.
- **FR-010**: Todo código (função, handler, importação de asset) que ficar sem
  nenhuma outra referência no app depois da remoção da ação DEVE ser removido do
  código-fonte; qualquer código ou asset que ainda for referenciado por outra parte do
  app NÃO DEVE ser removido.
- **FR-011**: Os arquivos de treino de exemplo usados hoje em testes manuais de
  importação (pasta `docs/exemplos/`) NÃO DEVEM ser apagados nem alterados por esta
  feature — são artefatos de teste manual, independentes do asset embutido no app que
  esta feature remove, mesmo quando tiverem nome ou conteúdo parecido.
- **FR-012**: Os critérios de aceite do RF01 e do RF14 em `docs/criterios-aceite.md`
  que descrevem a decisão e a validação do arquivo de exemplo pré-carregado DEVEM ser
  emendados indicando que a funcionalidade foi removida por esta feature (RF23), no
  mesmo padrão já usado no documento para registrar decisões históricas substituídas
  (nota de emenda ao lado do texto original, sem apagar o histórico).

### Key Entities

- **SessãoTreino** (já existe, RF04/RF07): usada somente em leitura por esta feature;
  nenhum atributo novo. O campo já existente `finalizadaEm` (`null` enquanto em
  andamento) é a única informação consultada.
- **Treino**, item da lista (já existe, RF02/RF16): ganha um estado visual derivado,
  calculado a cada exibição da lista — "tem sessão em andamento" (sim/não) — não é um
  atributo persistido do treino.
- **Ação de menu "Importar treino de exemplo"** (removida): deixa de existir como
  conceito do produto. O arquivo de treino de exemplo embutido no app e o código que o
  importava deixam de ter função no app (ver FR-011: os arquivos de `docs/exemplos/`,
  usados em teste manual, são uma entidade diferente e não são afetados).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das vezes em que a lista de treinos ganha foco com ao menos um
  treino em sessão em andamento, o(s) item(ns) correspondente(s) aparece(m) com o
  destaque visual, sem exigir nenhuma ação manual do usuário.
- **SC-002**: Em 100% dos treinos sem sessão em andamento, o item permanece
  visualmente idêntico ao comportamento anterior a esta feature.
- **SC-003**: Em 100% dos casos com múltiplos treinos em andamento simultaneamente,
  todos aparecem destacados ao mesmo tempo, sem exceção.
- **SC-004**: Em 100% das finalizações de sessão, o destaque do treino correspondente
  desaparece já na primeira vez que a lista de treinos ganha foco depois da
  finalização.
- **SC-005**: Em 100% das aberturas do menu de Ações depois desta feature, exatamente
  três ações aparecem (sair da conta, importar treino, créditos do catálogo), sem
  nenhum traço da ação removida.
- **SC-006**: Zero arquivos da pasta `docs/exemplos/` são alterados ou removidos por
  esta feature — todos permanecem byte a byte idênticos a antes dela.

## Assumptions

- **RF novo, não emenda pura (decisão explícita para o usuário revisar)**: o pedido
  original perguntou se bastaria emendar RF02/RF04/RF14 sem RF novo. A tabela da seção
  6 do PRD mostra que toda melhoria pós-MVP até hoje (RF11-RF22) recebeu número
  próprio — inclusive as descritas como "estende RFxx" (RF16 "estende o RF02", RF21
  "estende o RF01/RF03/RF04/RF11/RF20") e as que agrupam duas melhorias relacionadas
  pedidas juntas, exatamente como aqui (precedente direto: RF21). Não existe, nesta
  tabela, nenhuma entrada pós-MVP sem número próprio. Por isso esta spec assume
  **RF23** como nova entrada — mas essa é uma leitura, não um fato imposto; fica para
  o usuário confirmar ou corrigir na revisão antes do `/speckit.plan`.
- **Uma sessão em andamento por treino**: o modelo de dados já existente (RF04)
  garante no máximo uma sessão com `finalizadaEm = null` por combinação de treino e
  conta autenticada — esta feature não introduz nem depende de nenhuma regra nova
  sobre isso, apenas lê o que já existe.
- **Atualização por foco, não em tempo real**: o destaque é recalculado quando a tela
  de lista ganha foco (mesmo padrão já usado hoje pelo RF02/RF16 para contagens e
  datas), não por um mecanismo de observação contínua enquanto a lista permanece
  aberta sem trocar de tela — consistente com o Princípio II da Constitution
  (simplicidade).
- **O visual exato é decisão de implementação, mas a equivalência é requisito**: esta
  spec exige reaproveitar a mesma linguagem visual já usada para "exercício em
  andamento" (cor de aviso, fundo e borda) — qual componente/estilo concreto implementa
  isso é decisão da fase de planejamento, não desta especificação.
- **Destaque só por cor pode passar despercebido**: cor de fundo/borda sozinha é um
  sinal mais sutil que o já usado na tela de execução (que também tem o texto "⏸ Em
  andamento (pausado)" ao lado da cor). Se acrescentar um rótulo curto equivalente
  (ex.: "Em andamento") ao item da lista, mantendo a mesma linguagem visual do
  exercício em andamento e sem inventar um padrão novo, é uma decisão que fica para o
  `/speckit.plan` — não está definida por esta spec.
- **Mecanismo de foco ao voltar da execução precisa ser confirmado no plano**: o
  FR-004 depende de a lista ganhar foco quando o usuário finaliza a sessão dentro da
  tela do treino e volta para "Meus treinos". O `/speckit.plan` DEVE confirmar como
  isso já acontece no roteamento atual do app (navegação de volta à aba, troca de
  aba, ou outro mecanismo) antes de assumir que o `useFocusEffect` já existente na
  lista (usado hoje pelo RF02/RF16) é suficiente sem ajuste adicional.
- **"Importar treino de exemplo" e os arquivos de `docs/exemplos/` são entidades
  diferentes**: o primeiro é um asset embutido no app (usado pela ação removida); os
  segundos são arquivos usados manualmente, fora do app, para testar o fluxo de
  importação por seletor de arquivo (RF01/RF11) — confirmado por busca no código-fonte
  de que nenhum arquivo de `docs/exemplos/` é referenciado por código do app, apenas o
  asset separado em `assets/exemplos/`.
- **Nenhuma dependência nova, nenhuma mudança em Firestore ou regras de segurança**:
  ambos os ajustes são implementáveis só com código já presente no projeto
  (Constitution v2.0.0, Princípios II e IV) — a sessão em andamento já está disponível
  em AsyncStorage, e a remoção de uma ação de menu não toca nenhum dado remoto.
- **Validação em dois dispositivos, com iOS pendente**: mesma situação já registrada
  pelas specs 022 e 023 — validação completa depende de Android e iOS (Princípio III),
  e o iOS continua bloqueado pela falta de conta Apple Developer paga.
- **Fora de escopo**: qualquer mudança em como/onde a sessão em andamento é
  persistida; qualquer mudança nas outras três ações do menu de Ações; qualquer
  mudança nos arquivos de `docs/exemplos/`; qualquer atualização em tempo real da
  lista sem ganho de foco; qualquer nova dependência, mudança de schema do Firestore
  ou de regras de segurança.
