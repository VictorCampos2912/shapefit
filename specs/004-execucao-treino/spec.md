# Feature Specification: Tela de Execução do Treino

**Feature Branch**: `004-execucao-treino`

**Created**: 2026-09-15

**Status**: Draft

**Input**: User description: "RF03: tela de execução do treino. Ao tocar em um treino na lista (RF02), navegar para a tela de execução exibindo a lista de exercícios do treino selecionado com seus dados planejados (séries, reps_alvo, carga_sugerida_kg, descanso_seg). A navegação entre exercícios NÃO é estritamente sequencial — o usuário pode selecionar qualquer exercício da lista para iniciar, útil quando o equipamento do próximo exercício planejado não está disponível. Ao abrir um exercício, exibir botão \"Iniciar exercício\". Durante a execução, campos para registrar carga (kg, com casas decimais, ex: 42.5) e repetições feitas por série, com o campo de carga pré-preenchido com carga_sugerida_kg do JSON, editável pelo usuário. Indicar visualmente qual série está em andamento (ex: \"Série 2 de 4\"). Aplicar o mesmo nível de atenção visual já estabelecido no RF02 (ThemedText, ThemedView, Spacing, Colors), sem introduzir um design system novo, garantindo hierarquia visual clara entre o que está em foco (série atual) e o que é secundário (exercícios não iniciados ou concluídos)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar os exercícios planejados do treino selecionado (Priority: P1)

Um usuário toca em um treino na lista (RF02) e é levado à tela de execução, onde vê todos os exercícios daquele treino com seus dados planejados: número de séries, faixa de repetições-alvo, carga sugerida e tempo de descanso.

**Why this priority**: É o ponto de entrada de toda a experiência de execução — sem essa visão geral, o usuário não tem como decidir por qual exercício começar nem visualizar o que o treino do dia contém.

**Independent Test**: Pode ser testado isoladamente selecionando um treino com múltiplos exercícios na lista (RF02) e confirmando que a tela de execução exibe todos os exercícios do treino, cada um com séries, reps_alvo, carga_sugerida_kg e descanso_seg corretos conforme o JSON importado.

**Acceptance Scenarios**:

1. **Given** o usuário está na lista de treinos (RF02) com um treino contendo múltiplos exercícios, **When** ele toca nesse treino, **Then** o app navega para a tela de execução exibindo a lista de exercícios daquele treino, cada um com séries, reps_alvo, carga_sugerida_kg e descanso_seg planejados.
2. **Given** a tela de execução está exibindo a lista de exercícios, **When** o usuário observa qualquer item da lista, **Then** os dados planejados exibidos correspondem exatamente aos valores do JSON importado para aquele exercício.

---

### User Story 2 - Selecionar livremente qual exercício iniciar (Priority: P1)

Um usuário chega à academia e percebe que o equipamento do primeiro exercício planejado está ocupado. Em vez de esperar, ele escolhe outro exercício da lista para começar, sem que o app o force a seguir a ordem do JSON.

**Why this priority**: É uma decisão de produto explícita e central do RF03 — sem navegação livre, a tela se tornaria uma lista rígida que não reflete a realidade de uma academia compartilhada, comprometendo o objetivo principal do requisito.

**Independent Test**: Pode ser testado isoladamente abrindo um treino com 3+ exercícios e selecionando o segundo ou terceiro exercício da lista antes do primeiro, confirmando que o app permite iniciar por qualquer um deles sem bloqueio ou aviso de ordem incorreta.

**Acceptance Scenarios**:

1. **Given** a tela de execução exibe uma lista de exercícios ainda não iniciados, **When** o usuário toca em qualquer exercício da lista (não necessariamente o primeiro), **Then** o app abre esse exercício normalmente, sem exigir que exercícios anteriores da lista sejam feitos primeiro.
2. **Given** o usuário já iniciou um exercício que não é o primeiro da lista, **When** ele volta para a lista de exercícios, **Then** os demais exercícios continuam disponíveis para seleção livre, incluindo os que vêm antes na ordem do JSON.

---

### User Story 3 - Iniciar um exercício selecionado (Priority: P1)

Ao tocar em um exercício da lista, o usuário vê os detalhes desse exercício e um botão "Iniciar exercício" que dá início ao registro da primeira série.

**Why this priority**: É o passo que transforma a visualização passiva dos dados planejados em uma ação concreta de execução — sem ele, o usuário não tem como começar a registrar o treino.

**Independent Test**: Pode ser testado isoladamente tocando em um exercício da lista e confirmando que a tela exibe o botão "Iniciar exercício", e que tocar nesse botão libera os campos de registro da série atual.

**Acceptance Scenarios**:

1. **Given** o usuário tocou em um exercício ainda não iniciado, **When** a tela desse exercício é exibida, **Then** um botão "Iniciar exercício" é apresentado, visível e acionável.
2. **Given** o botão "Iniciar exercício" está visível, **When** o usuário toca nele, **Then** o app exibe os campos de registro (carga e repetições) para a primeira série do exercício.

---

### User Story 4 - Registrar carga e repetições da série atual (Priority: P1)

Durante a execução de um exercício, o usuário registra quanto peso usou e quantas repetições completou na série em andamento, com o campo de carga já sugerido pelo plano, mas ajustável caso o peso real usado tenha sido diferente.

**Why this priority**: É a ação central e mais frequente de toda a tela — o motivo de existir do app é justamente capturar esses dois valores por série, de forma rápida, durante o treino.

**Independent Test**: Pode ser testado isoladamente iniciando um exercício, observando que o campo de carga aparece pré-preenchido com o valor de `carga_sugerida_kg`, alterando esse valor para um número decimal diferente (ex: de 40 para 42.5), preenchendo as repetições feitas, e confirmando que ambos os valores ficam registrados para aquela série.

**Acceptance Scenarios**:

1. **Given** o usuário iniciou um exercício, **When** a tela de registro da série atual é exibida, **Then** o campo de carga aparece pré-preenchido com o valor de `carga_sugerida_kg` do JSON daquele exercício.
2. **Given** o campo de carga está pré-preenchido, **When** o usuário edita esse valor (incluindo valores com casas decimais, ex: 42.5), **Then** o app aceita o novo valor editado, substituindo o valor sugerido.
3. **Given** os campos de carga e repetições estão visíveis para a série atual, **When** o usuário tenta digitar um valor não numérico no campo de carga, **Then** o app rejeita a entrada, mantendo apenas valores numéricos (incluindo decimais) no campo.
4. **Given** o usuário preencheu carga e repetições para a série atual, **When** ele observa a tela, **Then** os valores preenchidos permanecem visíveis e associados àquela série específica.

---

### User Story 5 - Identificar visualmente qual série está em andamento (Priority: P2)

Durante a execução de um exercício com múltiplas séries, o usuário precisa saber, a qualquer momento, em qual série ele está (ex: "Série 2 de 4"), para não perder a contagem em meio ao esforço físico do treino.

**Why this priority**: É um requisito de usabilidade que apoia a User Story 4 — sem essa indicação, o registro de séries continua funcionalmente possível, mas o usuário fica mais suscetível a erros de contagem, especialmente em exercícios com muitas séries.

**Independent Test**: Pode ser testado isoladamente iniciando um exercício com `series` igual a 4 no JSON e confirmando que a tela exibe um indicador textual ou visual equivalente a "Série 1 de 4" ao iniciar, atualizando para "Série 2 de 4" após a primeira série ser concluída, e assim sucessivamente.

**Acceptance Scenarios**:

1. **Given** um exercício com múltiplas séries planejadas foi iniciado, **When** a tela de registro é exibida, **Then** um indicador mostra claramente qual série está em andamento e o total de séries planejadas (ex: "Série 2 de 4").
2. **Given** a série atual muda (ao avançar de uma série para a próxima), **When** a tela é atualizada, **Then** o indicador de série reflete o novo número da série em andamento.

---

### User Story 6 - Hierarquia visual entre o que está em foco e o que é secundário (Priority: P3)

Ao navegar pela tela de execução, o usuário consegue distinguir rapidamente, por meio visual, o que exige sua atenção imediata (a série atual em andamento) do que é apenas informativo ou secundário (exercícios ainda não iniciados ou já concluídos na lista), reaproveitando os mesmos padrões visuais já estabelecidos na tela de lista de treinos (RF02).

**Why this priority**: Contribui para a usabilidade e consistência visual do app, mas não bloqueia a funcionalidade principal de registro — é um refinamento sobre uma tela que já funciona corretamente sem ele.

**Independent Test**: Pode ser testado isoladamente abrindo um treino com exercícios em diferentes estados (não iniciado, em andamento, concluído) e confirmando visualmente que o exercício/série em foco se destaca claramente dos demais itens, usando os mesmos componentes e tokens de tema (ThemedText, ThemedView, Spacing, Colors) já usados no RF02.

**Acceptance Scenarios**:

1. **Given** a tela de execução exibe a lista de exercícios com itens em estados diferentes, **When** o usuário visualiza a lista, **Then** existe uma diferenciação visual clara entre exercícios não iniciados, exercícios já iniciados mas não em foco no momento ("pausados" — ver Edge Cases) e exercícios concluídos (ex: estilo, cor ou indicador distintos).
2. **Given** o usuário está registrando a série atual de um exercício, **When** ele visualiza a tela, **Then** os elementos relativos à série em andamento (indicador de série, campos de carga/reps, botão de ação) recebem destaque visual maior do que elementos secundários da tela.
3. **Given** as telas de lista de treinos (RF02) e de execução (RF03) são comparadas lado a lado, **When** o usuário observa tipografia, espaçamento e componentes usados, **Then** ambas seguem o mesmo padrão visual estabelecido, sem introdução de um novo sistema de design ou paleta de cores.

---

### Edge Cases

- O que acontece se o usuário voltar para a lista de exercícios no meio do registro de uma série (antes de concluí-la)? Esta especificação cobre apenas a exibição e o registro dos campos da série atual; o comportamento de avançar, concluir ou persistir séries entre exercícios é escopo do RF04, não desta feature.
- O que acontece se o exercício selecionado não tiver `carga_sugerida_kg` definida no JSON (campo ausente ou zero)? O campo de carga é exibido vazio ou com valor zero, mas continua editável normalmente pelo usuário — a ausência de sugestão não impede o registro manual do valor real usado.
- O que acontece se o usuário tentar registrar repetições feitas maiores ou muito diferentes do `reps_alvo` planejado (ex: reps_alvo "8-10", mas usuário registra 15)? O campo de repetições feitas aceita o valor informado pelo usuário sem restringir ao intervalo do `reps_alvo`, pois `reps_alvo` é apenas uma meta planejada, não um limite de validação.
- O que acontece se o treino selecionado não tiver nenhum exercício (lista `exercicios` vazia)? Este cenário é prevenido a montante pelo RF01, que rejeita a importação de um treino sem exercícios válidos; portanto, não deve ocorrer na prática ao chegar nesta tela.
- O que acontece se o usuário deixar os campos de carga ou repetições em branco? Esta especificação define apenas a exibição, pré-preenchimento e edição dos campos; a validação de preenchimento obrigatório antes de avançar de série é tratada pelo RF04 (botão "Concluir série" só habilitado com os campos preenchidos).
- O que acontece se o usuário iniciar um exercício (registrando progresso em uma série) e, sem concluí-lo, voltar para a lista e iniciar um segundo exercício? O app não executa dois exercícios simultaneamente — não existem "exercícios conjugados" nesta feature. O primeiro exercício passa a ser exibido como "pausado" na lista (seu progresso — série atual, carga e reps já digitados — é preservado em memória), e apenas o exercício aberto no momento é tratado como em execução. O usuário pode retomar o exercício pausado a qualquer momento, voltando exatamente de onde parou.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST navegar para a tela de execução do treino selecionado imediatamente após o usuário tocar em um item na lista de treinos (RF02).
- **FR-002**: O sistema MUST exibir, na tela de execução, a lista completa dos exercícios do treino selecionado.
- **FR-003**: O sistema MUST exibir, para cada exercício da lista, seus dados planejados conforme o JSON importado: número de séries (`series`), faixa de repetições-alvo (`reps_alvo`), carga sugerida em kg (`carga_sugerida_kg`) e tempo de descanso em segundos (`descanso_seg`).
- **FR-004**: O sistema MUST permitir que o usuário selecione qualquer exercício da lista para iniciar, independentemente da ordem em que os exercícios aparecem no JSON do treino.
- **FR-005**: O sistema MUST NOT impor uma ordem sequencial obrigatória de execução entre os exercícios do treino.
- **FR-006**: O sistema MUST exibir um botão "Iniciar exercício" ao abrir um exercício ainda não iniciado.
- **FR-007**: O sistema MUST exibir, após o início do exercício, campos para registrar a carga (em kg) e as repetições feitas na série atual.
- **FR-008**: O sistema MUST pré-preencher o campo de carga da série atual com o valor de `carga_sugerida_kg` do JSON do exercício correspondente.
- **FR-009**: O sistema MUST permitir que o usuário edite livremente o valor pré-preenchido no campo de carga.
- **FR-010**: O sistema MUST aceitar valores decimais no campo de carga (ex: 42.5) e rejeitar entradas não numéricas nesse campo.
- **FR-011**: O sistema MUST indicar visualmente, de forma clara, qual série está em andamento em relação ao total de séries planejadas do exercício (ex: "Série 2 de 4").
- **FR-012**: O sistema MUST atualizar o indicador de série em andamento sempre que a série atual mudar.
- **FR-013**: O sistema MUST apresentar a tela de execução reaproveitando os componentes e tokens de tema já estabelecidos na tela de lista de treinos (RF02) — como `ThemedText`, `ThemedView`, `Spacing` e `Colors` — sem introduzir um novo sistema de design, paleta de cores ou biblioteca visual.
- **FR-014**: O sistema MUST apresentar hierarquia visual clara entre elementos em foco (série atual em andamento e seus campos de registro) e elementos secundários (exercícios ainda não iniciados, pausados ou já concluídos na lista).
- **FR-015**: O sistema MUST NOT tratar mais de um exercício como "em execução" simultaneamente; ao selecionar um novo exercício enquanto outro já iniciado não foi concluído, o sistema MUST preservar o progresso do exercício anterior (marcando-o como pausado) sem descartar seus dados, e permitir retomá-lo posteriormente sem perda de progresso.

### Key Entities

- **Treino** (já definido no RF01/RF02): usado aqui apenas para leitura — fornece a lista de exercícios exibida ao entrar na tela de execução. Nenhum novo atributo é introduzido por esta feature.
- **Exercício** (subestrutura do Treino, já definida no RF01): atributos relevantes para esta feature — `id`, `nome`, `series` (número de séries planejadas), `reps_alvo` (faixa-alvo de repetições, texto), `carga_sugerida_kg` (número), `descanso_seg` (número). Todos consumidos apenas para exibição e pré-preenchimento nesta feature; nenhum novo atributo de exercício é introduzido aqui.
- **Série em andamento**: conceito de exibição usado por esta feature para indicar, a qualquer momento durante a execução de um exercício, qual número de série (dentre o total planejado) está sendo registrada. O registro persistente de séries concluídas (avanço entre séries, conclusão de exercício) é escopo do RF04.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ao tocar em um treino na lista, o usuário visualiza a tela de execução com a lista de exercícios planejados em até 2 segundos.
- **SC-002**: 100% dos exercícios exibidos na tela de execução mostram os quatro dados planejados (séries, reps_alvo, carga_sugerida_kg, descanso_seg) exatamente como definidos no treino importado.
- **SC-003**: O usuário consegue iniciar qualquer exercício da lista, independentemente de sua posição, em no máximo 2 toques (selecionar o exercício + tocar em "Iniciar exercício").
- **SC-004**: O campo de carga aparece pré-preenchido corretamente em 100% dos exercícios iniciados, refletindo o valor de `carga_sugerida_kg` do treino.
- **SC-005**: O usuário identifica corretamente, sem ambiguidade, qual série está em andamento em pelo menos 95% das interações observadas em teste manual (indicador sempre visível e atualizado).
- **SC-006**: A tela de execução é percebida, em comparação visual direta com a tela de lista de treinos (RF02), como parte do mesmo aplicativo — mesma tipografia, espaçamento e paleta — sem relatos de inconsistência visual entre as duas telas.

## Assumptions

- Esta especificação cobre exclusivamente a exibição da lista de exercícios planejados, a seleção livre de exercício, o botão de início, e a exibição/pré-preenchimento/edição dos campos de carga e repetições da série atual — o avanço entre séries, a conclusão de exercícios e a navegação de volta à lista após concluir são escopo do RF04, não desta feature.
- O cronômetro de descanso (RF05) e sua notificação (RF06) não fazem parte desta especificação; `descanso_seg` é exibido aqui apenas como dado planejado informativo na lista de exercícios.
- A persistência das séries registradas (salvar no armazenamento local, retomar sessão em andamento) é escopo do RF04/RF07; esta feature assume que os valores digitados ficam disponíveis em memória durante a navegação dentro da tela de execução, mas não define aqui o mecanismo de persistência entre fechamentos do app.
- Um treino sempre chega a esta tela com pelo menos um exercício válido, pois o RF01 já impede a importação de treinos sem exercícios válidos.
- "Mesmo nível de atenção visual do RF02" significa reaproveitar os componentes e tokens de tema já existentes (`ThemedText`, `ThemedView`, `Spacing`, `Colors`) com layout organizado e hierarquia clara — não a criação de novos componentes visuais, paleta de cores ou biblioteca de design, conforme decisão já registrada na seção 14 do PRD (v1.1).
- O campo de repetições feitas aceita apenas números inteiros não negativos, seguindo o padrão natural de contagem de repetições, sem necessidade de casas decimais (diferente do campo de carga).
