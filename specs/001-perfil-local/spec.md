# Feature Specification: Criar e Selecionar Perfil Local

**Feature Branch**: `001-perfil-local`

**Created**: 2026-09-14

**Status**: Draft

**Input**: User description: "RF10: criar e selecionar perfil local, com todos os campos obrigatórios (nome, peso, altura, idade, sexo, objetivo), suporte a múltiplos perfis no mesmo aparelho, sem login ou senha. A troca de perfil ativo deve ser bloqueada enquanto houver uma sessão de treino em andamento."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Criar o primeiro perfil ao abrir o app (Priority: P1)

Um usuário instala o app e o abre pela primeira vez, sem nenhum perfil criado ainda. Antes de qualquer outra tela, o app apresenta um formulário para criar seu perfil local, pedindo nome, peso, altura, idade, sexo e objetivo de treino. Após preencher todos os campos e salvar, esse perfil se torna o perfil ativo e o usuário é levado para a lista de treinos.

**Why this priority**: Sem um perfil ativo, nenhuma outra funcionalidade do app (importar treino, executar treino, ver histórico) pode operar, pois todos os dados são segregados por perfil. Esta é a porta de entrada obrigatória do app.

**Independent Test**: Pode ser testado isoladamente instalando o app pela primeira vez (sem dados de perfil salvos), preenchendo o formulário e confirmando que o usuário chega à lista de treinos com o perfil recém-criado ativo.

**Acceptance Scenarios**:

1. **Given** o app é aberto pela primeira vez e nenhum perfil existe, **When** o app carrega, **Then** a tela de criação de perfil é exibida antes de qualquer outra tela.
2. **Given** o formulário de criação de perfil está aberto, **When** o usuário tenta salvar sem preencher nome, peso, altura, idade, sexo ou objetivo, **Then** o app impede o salvamento e indica quais campos estão faltando.
3. **Given** o formulário de criação de perfil está aberto, **When** o usuário preenche todos os campos obrigatórios e confirma o salvamento, **Then** o perfil é criado, passa a ser o perfil ativo, e o app navega para a lista de treinos desse perfil.

---

### User Story 2 - Selecionar perfil existente e criar perfis adicionais (Priority: P2)

Um usuário que já possui um ou mais perfis salvos no aparelho abre o app e vê uma lista de perfis para escolher qual usar na sessão atual, em vez do formulário de criação. A partir dessa lista, ele também pode iniciar a criação de um novo perfil (por exemplo, para um familiar que compartilha o aparelho).

**Why this priority**: Suportar múltiplos perfis no mesmo aparelho é um requisito central do produto (uso compartilhado entre o usuário e familiares), mas depende da capacidade de criar o primeiro perfil (User Story 1) já estar funcionando.

**Independent Test**: Pode ser testado isoladamente criando dois ou mais perfis previamente e reabrindo o app, verificando que a lista de seleção aparece (não o formulário) e que é possível escolher qualquer perfil existente ou criar um novo a partir dessa tela.

**Acceptance Scenarios**:

1. **Given** existem um ou mais perfis salvos no aparelho, **When** o app é aberto, **Then** é exibida uma lista de perfis para seleção, em vez do formulário de criação.
2. **Given** a lista de perfis está sendo exibida, **When** o usuário toca em um perfil da lista, **Then** esse perfil passa a ser o perfil ativo e o app navega para a lista de treinos desse perfil.
3. **Given** a lista de perfis está sendo exibida, **When** o usuário escolhe a opção "Criar novo perfil", **Then** o formulário de criação de perfil é exibido, permitindo adicionar mais um perfil ao aparelho.

---

### User Story 3 - Trocar o perfil ativo a qualquer momento, exceto durante um treino em andamento (Priority: P1)

Um usuário com múltiplos perfis no aparelho deseja trocar o perfil ativo (por exemplo, passar do seu perfil para o de um familiar). Se não houver nenhuma sessão de treino em andamento, a troca é permitida livremente, e todas as telas do app (treinos, execução, histórico) passam a refletir imediatamente os dados do novo perfil ativo. Se houver uma sessão de treino em andamento associada ao perfil ativo, a troca é bloqueada até que essa sessão seja finalizada.

**Why this priority**: Esta é a regra de negócio explicitamente destacada no requisito (RF10) e protege a integridade dos dados de uma sessão de treino em andamento, evitando que ela fique órfã ou seja corrompida por uma troca de contexto no meio da execução.

**Independent Test**: Pode ser testado isoladamente iniciando uma sessão de treino em um perfil, tentando trocar de perfil (deve ser bloqueado com aviso), finalizando a sessão, e então tentando trocar novamente (deve ser permitido, com as telas atualizando para o novo perfil).

**Acceptance Scenarios**:

1. **Given** o perfil ativo não possui nenhuma sessão de treino em andamento, **When** o usuário aciona a troca de perfil, **Then** o app permite a troca sem impedimentos, sem exigir reinstalação do app.
2. **Given** o perfil ativo possui uma sessão de treino em andamento, **When** o usuário tenta trocar de perfil, **Then** a opção de troca fica desabilitada ou exibe um aviso explicando que é necessário finalizar a sessão atual antes de trocar.
3. **Given** a troca de perfil ativo foi concluída com sucesso, **When** as telas de treinos, execução e histórico são exibidas, **Then** elas atualizam imediatamente para mostrar apenas os dados do novo perfil ativo, sem exigir fechar e reabrir o app.

---

### Edge Cases

- O que acontece se o usuário tentar salvar o perfil com um campo obrigatório preenchido apenas com espaços em branco? O app deve tratar isso como campo vazio e impedir o salvamento.
- O que acontece se o usuário tentar trocar de perfil enquanto o cronômetro de descanso (RF05) está ativo, mas nenhuma série está sendo registrada no momento? A sessão de treino ainda é considerada "em andamento" enquanto não for finalizada (RF07), portanto a troca continua bloqueada.
- O que acontece se todos os perfis forem removidos do aparelho (se essa capacidade existir)? O app deve voltar a exibir a tela de criação de perfil, como se fosse a primeira abertura.
- O que acontece se o usuário criar dois perfis com o mesmo nome? Não há impedimento: perfis são identificados internamente por um identificador próprio, não pelo nome, então nomes duplicados são permitidos.
- O que acontece se o usuário fechar o app durante o preenchimento do formulário de criação, sem salvar? Nenhum perfil parcial é criado; ao reabrir o app, o formulário de criação (ou a lista de seleção, se já houver outros perfis) é exibido novamente do zero.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST exibir a tela de criação de perfil antes de qualquer outra tela quando o app é aberto e nenhum perfil local existe ainda.
- **FR-002**: O sistema MUST exigir o preenchimento de todos os seguintes campos antes de permitir salvar um perfil: nome, peso (kg), altura (cm), idade, sexo e objetivo de treino.
- **FR-002a**: O sistema MUST restringir o campo "sexo" às opções fixas: Masculino, Feminino.
- **FR-002b**: O sistema MUST restringir o campo "objetivo de treino" às opções fixas: Hipertrofia, Emagrecimento, Condicionamento, Manutenção.
- **FR-003**: O sistema MUST impedir o salvamento de um perfil se qualquer campo obrigatório estiver vazio ou em branco, e MUST indicar ao usuário quais campos específicos estão faltando.
- **FR-004**: O sistema MUST definir o perfil recém-criado como o perfil ativo imediatamente após seu salvamento bem-sucedido.
- **FR-005**: O sistema MUST navegar automaticamente para a lista de treinos do perfil ativo logo após a criação ou seleção de um perfil.
- **FR-006**: O sistema MUST exibir uma lista de perfis existentes para seleção, em vez do formulário de criação, sempre que já houver ao menos um perfil salvo no aparelho ao abrir o app.
- **FR-007**: O sistema MUST oferecer, a partir da lista de seleção de perfis, uma opção clara e visível para criar um novo perfil.
- **FR-008**: O sistema MUST suportar múltiplos perfis salvos simultaneamente no mesmo aparelho, sem limite artificial baixo (ao menos os cenários de uso familiar, na casa de poucas unidades de perfis).
- **FR-009**: O sistema MUST permitir a troca do perfil ativo para qualquer outro perfil existente, a qualquer momento, desde que não haja uma sessão de treino em andamento vinculada ao perfil ativo.
- **FR-010**: O sistema MUST bloquear a troca de perfil ativo (desabilitando a opção ou exibindo um aviso explicativo) sempre que houver uma sessão de treino em andamento (não finalizada) vinculada ao perfil ativo.
- **FR-011**: O sistema MUST atualizar imediatamente todas as telas dependentes de perfil (treinos, execução, histórico) para refletir apenas os dados do perfil ativo, sempre que a troca de perfil ativo ocorrer.
- **FR-012**: O sistema MUST NOT solicitar senha, PIN ou qualquer outro mecanismo de autenticação para criar, selecionar ou trocar de perfil.
- **FR-013**: O sistema MUST persistir os perfis criados localmente no aparelho, de forma que estejam disponíveis em aberturas futuras do app, sem depender de conexão com a internet.
- **FR-014**: O sistema MUST manter a identidade de cada perfil por meio de um identificador próprio, permitindo que dois ou mais perfis tenham o mesmo nome sem conflito.

### Key Entities

- **Perfil**: Representa uma pessoa que usa o app localmente no aparelho. Atributos principais: identificador único, nome, peso (kg), altura (cm), idade, sexo (Masculino ou Feminino), objetivo de treino (Hipertrofia, Emagrecimento, Condicionamento ou Manutenção), e uma indicação de qual perfil está atualmente ativo. Um perfil é a unidade de segregação de todos os dados de treino, sessão e histórico do app.
- **Sessão de treino em andamento**: Representa uma execução de treino que foi iniciada mas ainda não finalizada, associada a um perfil específico. Sua mera existência para o perfil ativo é a condição que bloqueia a troca de perfil ativo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um novo usuário consegue criar seu primeiro perfil e chegar à lista de treinos em menos de 1 minuto, sem qualquer orientação externa ao app.
- **SC-002**: 100% das tentativas de salvar um perfil com ao menos um campo obrigatório vazio são bloqueadas, com indicação clara do campo faltante.
- **SC-003**: Um usuário com múltiplos perfis consegue alternar entre eles em no máximo 2 toques, quando não há sessão de treino em andamento.
- **SC-004**: 100% das tentativas de troca de perfil ativo enquanto há uma sessão de treino em andamento são bloqueadas ou avisadas, sem exceção.
- **SC-005**: Após uma troca de perfil bem-sucedida, todas as telas dependentes de perfil exibem os dados corretos do novo perfil ativo sem necessidade de fechar e reabrir o app.

## Assumptions

- "Sessão de treino em andamento" é definida pelo mesmo conceito usado no RF07 (sessão iniciada e ainda não finalizada, seja automaticamente ao concluir o último exercício, seja manualmente via "Finalizar treino").
- Não há limite máximo explícito de perfis por aparelho definido no PRD; assume-se suporte confortável a um pequeno número de perfis (uso familiar, tipicamente 2 a 5), sem necessidade de otimização para grandes volumes.
- Não existe fluxo de exclusão ou edição de perfil especificado neste requisito (RF10); esses fluxos, se necessários, ficam fora do escopo desta especificação.
- A troca de perfil ativo é uma ação iniciada explicitamente pelo usuário (ex: a partir de um menu ou tela de perfis), não uma troca automática por qualquer outro evento do sistema.
