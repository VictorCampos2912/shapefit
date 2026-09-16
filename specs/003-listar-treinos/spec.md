# Feature Specification: Listar Treinos Importados/Salvos

**Feature Branch**: `003-listar-treinos`

**Created**: 2026-09-15

**Status**: Draft

**Input**: User description: "RF02: listar os treinos importados/salvos, filtrados sempre pelo perfil ativo no momento (herdando o padrão de isolamento por perfil do RF10/RF01). Se dois treinos tiverem o mesmo nome, diferenciar exibindo a data/hora de importação junto ao nome. Esta tela substitui o ponto de entrada provisório de importação criado no RF01 (botão \"Importar treino\" em (tabs)/index.tsx) — a ação de importar treino deve passar a viver nesta tela de lista, não mais na tela inicial temporária. Tocar em um treino da lista deve preparar a navegação para a execução do treino (RF03, ainda não implementado nesta feature). Por ser a primeira tela permanente do fluxo principal do app, aplicar um mínimo de atenção visual (não um design system completo, apenas layout organizado, tipografia e espaçamento adequados, distinto do boilerplate padrão do Expo) — conforme decisão registrada na seção 14 do PRD."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar a lista de treinos do perfil ativo (Priority: P1)

Um usuário que já importou um ou mais treinos (RF01) quer ver, de forma organizada, todos os treinos disponíveis para o seu perfil, para decidir qual executar. Ele abre a tela de treinos e vê uma lista com todos os treinos já importados por ele, identificados pelo nome de cada um.

**Why this priority**: É a razão de existir do requisito — sem a lista, os treinos importados no RF01 ficam "invisíveis" para o usuário, tornando o restante do fluxo (execução, histórico) inacessível na prática.

**Independent Test**: Pode ser testado isoladamente importando dois ou mais treinos (via RF01) para o mesmo perfil, abrindo a tela de treinos, e confirmando que todos aparecem na lista, identificados pelo nome do JSON de cada um.

**Acceptance Scenarios**:

1. **Given** o perfil ativo já importou um ou mais treinos, **When** o usuário abre a tela de treinos, **Then** todos os treinos daquele perfil aparecem na lista, identificados pelo nome de cada treino.
2. **Given** o perfil ativo importa um novo treino, **When** a importação é concluída, **Then** o novo treino passa a aparecer na lista, sem que nenhum treino já existente seja removido ou alterado.
3. **Given** a lista de treinos já foi exibida, **When** o usuário fecha e reabre o app, **Then** a mesma lista de treinos continua disponível, sem perda de dados.

---

### User Story 2 - Lista filtrada e atualizada por perfil ativo (Priority: P1)

Dois perfis compartilham o mesmo aparelho, cada um com seus próprios treinos importados. O usuário quer que a lista sempre reflita apenas os treinos do perfil atualmente ativo, e que essa lista se atualize imediatamente ao trocar de perfil, sem precisar fechar e reabrir o app.

**Why this priority**: É uma extensão direta do princípio de isolamento de dados por perfil, já estabelecido como não-negociável pelo RF10 e implementado no RF01; sem essa garantia, a lista vazaria dados entre perfis diferentes do mesmo aparelho.

**Independent Test**: Pode ser testado isoladamente importando um treino com o Perfil A ativo, abrindo a tela de treinos (deve mostrar apenas o treino de A), trocando para o Perfil B (RF10) sem sair da tela, e confirmando que a lista atualiza para mostrar apenas os treinos de B (nenhum treino de A visível).

**Acceptance Scenarios**:

1. **Given** o Perfil A tem treinos importados e o Perfil B não tem nenhum, **When** o Perfil A está ativo, **Then** a lista de treinos exibe somente os treinos do Perfil A.
2. **Given** o usuário está na tela de treinos, **When** ele troca o perfil ativo para outro perfil (RF10), **Then** a lista de treinos exibida atualiza imediatamente para refletir apenas os treinos do novo perfil ativo, sem necessidade de fechar e reabrir o app.

---

### User Story 3 - Diferenciar treinos com o mesmo nome (Priority: P2)

Um usuário importou, para o mesmo perfil, dois arquivos de treino diferentes que por coincidência têm o mesmo nome (por exemplo, duas versões de um "Treino A" importadas em momentos diferentes). Ao ver a lista, ele precisa conseguir distinguir qual é qual.

**Why this priority**: Sem essa diferenciação, dois treinos com nome idêntico ficariam indistinguíveis na lista, impedindo o usuário de saber qual selecionar — um problema de usabilidade que compromete a User Story 1, mas que só se manifesta no caso específico de nomes duplicados, por isso prioridade menor que o caminho principal.

**Independent Test**: Pode ser testado isoladamente importando dois arquivos de treino com o mesmo campo `nome` para o mesmo perfil (em momentos diferentes) e confirmando que ambos aparecem na lista, cada um exibindo também a data/hora em que foi importado, permitindo diferenciá-los.

**Acceptance Scenarios**:

1. **Given** dois treinos com o mesmo nome foram importados para o mesmo perfil em momentos diferentes, **When** o usuário visualiza a lista de treinos, **Then** ambos aparecem como itens distintos, cada um exibindo a data/hora de importação junto ao nome.

---

### User Story 4 - Importar um novo treino a partir da tela de treinos (Priority: P2)

Um usuário quer importar um novo treino sem precisar navegar para uma tela temporária separada — a ação de importar deve estar disponível diretamente na tela onde os treinos são listados, que passa a ser o único lugar do app para essa ação.

**Why this priority**: Consolida a experiência de importação e listagem em um único lugar coerente, eliminando o ponto de entrada provisório criado no RF01 antes desta tela existir; não é o caminho mais crítico (a importação em si já funciona desde o RF01), mas é necessário para que a tela de treinos se torne o único ponto de entrada permanente do fluxo.

**Independent Test**: Pode ser testado isoladamente abrindo a tela de treinos, acionando a ação de importar a partir dela, selecionando um arquivo de treino válido, e confirmando que o treino aparece na lista sem sair da tela — e que a ação de importar não está mais acessível a partir da tela inicial usada anteriormente pelo RF01.

**Acceptance Scenarios**:

1. **Given** o usuário está na tela de treinos, **When** ele aciona a ação de importar treino a partir dessa tela, **Then** o fluxo de importação (já existente do RF01) é executado normalmente e o resultado (sucesso, sucesso parcial, ou erro) é comunicado ao usuário do mesmo modo que no RF01.
2. **Given** a tela de treinos já existe, **When** o usuário navega pelo restante do app, **Then** a ação de importar treino não está mais disponível a partir da tela inicial provisória usada anteriormente pelo RF01.

---

### User Story 5 - Preparar a navegação para executar um treino (Priority: P3)

Um usuário decide qual treino quer executar e toca no item correspondente na lista, esperando ser levado para a execução guiada desse treino.

**Why this priority**: É o gancho de transição para o RF03 (execução), mas o RF03 ainda não existe — esta feature só precisa garantir que o toque no item é reconhecido e associado ao treino correto, sem implementar a tela de execução em si; por isso é a prioridade mais baixa aqui.

**Independent Test**: Pode ser testado isoladamente tocando em um item específico da lista e confirmando que o app reconhece de forma inequívoca qual treino foi selecionado (por exemplo, através de algum indicativo visual de seleção ou navegação, mesmo que a tela de destino ainda não exista de fato).

**Acceptance Scenarios**:

1. **Given** a lista de treinos exibe um ou mais itens, **When** o usuário toca em um treino específico, **Then** o app reconhece de forma inequívoca qual treino foi selecionado, preparando a transição para a tela de execução (RF03).

---

### Edge Cases

- O que acontece se o perfil ativo ainda não importou nenhum treino? A tela de treinos exibe uma indicação clara de que não há treinos ainda, com a ação de importar visível e acessível, em vez de mostrar uma lista vazia sem explicação.
- O que acontece se o usuário trocar de perfil enquanto uma importação está em andamento na tela de treinos? Este cenário está fora do escopo desta especificação, pois depende da regra de bloqueio de troca de perfil durante sessão de treino em andamento (RF10/RF07), não da importação em si; a importação de treino não é uma "sessão de treino em andamento" para efeitos dessa regra.
- O que acontece se três ou mais treinos compartilharem o mesmo nome? Todos aparecem como itens distintos na lista, cada um com sua própria data/hora de importação exibida, permitindo diferenciar todos eles, não apenas um par.
- O que acontece se o usuário tocar em um treino e o RF03 ainda não existir no app? A ação de seleção é reconhecida internamente (ver User Story 5), mas como não há tela de execução implementada nesta feature, nenhuma navegação efetiva de tela precisa ocorrer; o comportamento exato de "o que aparece depois do toque" é resolvido pelo RF03.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST exibir, em uma tela dedicada, a lista de todos os treinos importados/salvos vinculados ao perfil ativo no momento.
- **FR-002**: O sistema MUST identificar cada treino da lista pelo nome do treino (campo `nome` do JSON importado, conforme RF01).
- **FR-003**: O sistema MUST atualizar a lista exibida imediatamente sempre que o perfil ativo mudar (RF10), sem exigir que o usuário feche e reabra o app.
- **FR-004**: O sistema MUST exibir apenas os treinos vinculados ao perfil ativo no momento, nunca treinos de outros perfis do mesmo aparelho.
- **FR-005**: O sistema MUST manter todos os treinos já importados na lista após uma nova importação, sem substituir ou remover treinos existentes.
- **FR-006**: O sistema MUST persistir a lista de treinos entre sessões do app (fechar e reabrir o app não deve remover nenhum treino da lista).
- **FR-007**: Quando dois ou mais treinos do mesmo perfil tiverem o mesmo nome, o sistema MUST exibir a data/hora de importação de cada um junto ao nome, de forma que cada treino seja individualmente diferenciável na lista.
- **FR-008**: O sistema MUST oferecer, a partir da tela de treinos, uma ação para importar um novo treino, reaproveitando o comportamento de importação já especificado no RF01 (sucesso, sucesso parcial com aviso, ou rejeição com mensagem de erro).
- **FR-009**: O sistema MUST NOT manter, em nenhuma outra tela do app (incluindo a tela inicial usada anteriormente pelo RF01), uma ação alternativa de importar treino fora da tela de treinos.
- **FR-010**: O sistema MUST permitir que o usuário toque em qualquer treino da lista, reconhecendo de forma inequívoca qual treino foi selecionado, como preparação para a navegação de execução (RF03).
- **FR-011**: O sistema MUST exibir uma indicação clara ao usuário quando o perfil ativo não tiver nenhum treino importado, distinguindo esse estado de uma falha ou de uma lista vazia sem explicação.
- **FR-012**: O sistema MUST apresentar a tela de treinos com layout organizado, tipografia e espaçamento consistentes, visualmente distintos do boilerplate padrão de exemplo do Expo usado nas telas temporárias anteriores — sem exigir um sistema de design completo.

### Key Entities

- **Treino** (já definido no RF01): usado aqui apenas para leitura/exibição — nenhum novo atributo é introduzido por esta feature. O nome e a data/hora de importação (já existentes) são os atributos usados para identificação e diferenciação na lista.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário com treinos já importados consegue visualizar a lista completa de seus treinos em até 2 segundos após abrir a tela de treinos.
- **SC-002**: 100% dos treinos exibidos na lista pertencem ao perfil ativo no momento da exibição, sem exceção.
- **SC-003**: Após uma troca de perfil ativo, a lista de treinos exibida reflete o novo perfil em no máximo 1 interação do usuário (sem necessidade de fechar/reabrir o app).
- **SC-004**: Quando existem treinos com nomes duplicados, 100% deles permanecem diferenciáveis na lista (nenhum usuário reporta confusão sobre qual treino é qual).
- **SC-005**: A ação de importar um novo treino está disponível a partir da tela de treinos e em nenhuma outra tela do app.

## Assumptions

- A camada de importação de treinos (validação, persistência, tratamento de erros parciais e totais) já existe e funciona conforme especificado e implementado no RF01; esta feature reutiliza esse comportamento sem alterá-lo, apenas mudando de onde ele é acionado na interface.
- Um perfil ativo sempre existe no momento em que a tela de treinos é exibida, pois o app exige a criação/seleção de um perfil (RF10) antes de liberar acesso às demais telas.
- "Atenção visual mínima" (FR-012) significa layout organizado, tipografia e espaçamento adequados para uma lista de itens, não a criação de um sistema de design completo, paleta de cores nova, ou biblioteca de componentes visuais — decisão já registrada na seção 14 do PRD (v1.1).
- A navegação efetiva para a tela de execução de treino (o que acontece de fato após o toque em um item da lista) é escopo do RF03, ainda não especificado nem implementado; esta feature só garante que a seleção do treino é reconhecida de forma inequívoca.
- Não há necessidade de paginação, busca, ou ordenação customizável da lista nesta especificação, dado o volume esperado de treinos por perfil (uso pessoal, dezenas de itens), conforme já assumido no RF01.
