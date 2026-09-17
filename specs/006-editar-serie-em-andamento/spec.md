# Feature Specification: Editar Registro de Série Já Feito (Sessão em Andamento)

**Feature Branch**: `006-editar-serie-em-andamento`

**Created**: 2026-09-17

**Status**: Draft

**Input**: User description: "RF09a: editar registro de série já feito, na sessão em andamento (parte adiantada do RF09 original, para logo após o RF04). Escopo: apenas séries já concluídas do exercício atualmente em execução (aquele aberto na tela do RF04) — não depende do RF07 (finalização de sessão) nem do RF08 (histórico), que ainda não existem. A partir da tela de execução, o usuário deve conseguir visualizar e editar carga e/ou repetições de qualquer série já concluída daquele exercício (ex.: a série 1, mesmo já estando na série 3), antes de tocar em \"Concluir exercício\". A edição NÃO deve reabrir o exercício como \"em andamento\" caso ele já esteja marcado como concluído, nem alterar de nenhuma outra forma o estado de conclusão — apenas o valor daquela série específica é atualizado, tanto em memória quanto na sessão persistida (sessoes:<perfil_id>, criada pelo RF04). Antes de salvar qualquer edição, o app deve pedir confirmação ao usuário. A edição de séries de sessões já finalizadas no passado, a partir do histórico, é escopo do RF09b (futuro) — fora desta feature."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Corrigir carga ou repetições de uma série já concluída, no mesmo exercício (Priority: P1)

Durante a execução de um exercício (RF04), o usuário percebe que digitou um valor errado em uma série já concluída (ex.: registrou 40kg na série 1, mas a carga real foi 42.5kg). Sem essa correção, o erro ficaria registrado permanentemente na sessão, já que a tela de execução não permite editar séries concluídas (decisão explícita do RF04, FR-015). A partir da própria tela de execução do exercício, o usuário localiza a série 1 na lista de séries já concluídas, toca para editá-la, ajusta o valor incorreto, confirma a alteração quando solicitado, e o valor corrigido passa a valer imediatamente — tanto na tela quanto na sessão persistida.

**Why this priority**: Fecha uma lacuna deixada intencionalmente aberta pelo RF04 (FR-015): sem esta feature, não existe nenhuma forma de corrigir um erro de digitação até o fim do MVP (RF09 completo estava por último na fila original). Erros de digitação em carga/reps são comuns e corrigíveis apenas por edição direta.

**Independent Test**: Pode ser testado isoladamente concluindo pelo menos duas séries de um exercício (via RF04), tocando na série 1 (não a série atual) para editá-la, alterando a carga e/ou reps, confirmando a alteração, e verificando que o novo valor aparece imediatamente na tela e é o valor lido ao reabrir o app.

**Acceptance Scenarios**:

1. **Given** o exercício em execução tem uma ou mais séries já concluídas, **When** o usuário visualiza a tela de execução daquele exercício, **Then** cada série já concluída exibe seus valores de carga e repetições, com uma forma de iniciar a edição de cada uma individualmente.
2. **Given** o usuário está vendo a série 3 como a série atual e já concluiu as séries 1 e 2, **When** ele escolhe editar a série 1 (não a atual), **Then** o sistema permite editar a série 1 normalmente, independentemente de não ser a série mais recente.
3. **Given** o usuário iniciou a edição de uma série concluída e alterou a carga e/ou as repetições, **When** ele confirma a intenção de salvar, **Then** o sistema exibe um pedido de confirmação antes de gravar a alteração.
4. **Given** o pedido de confirmação está sendo exibido, **When** o usuário confirma, **Then** o novo valor da série é gravado, substituindo o valor anterior, tanto no estado em memória quanto na sessão persistida (`sessoes:<perfil_id>`).
5. **Given** o pedido de confirmação está sendo exibido, **When** o usuário cancela em vez de confirmar, **Then** nenhuma alteração é gravada e o valor original da série permanece inalterado.
6. **Given** uma série foi editada e confirmada, **When** o usuário sai da tela de execução e volta (ou fecha e reabre o app), **Then** o valor corrigido continua sendo o valor exibido — a edição sobrevive à mesma forma de persistência já garantida para séries recém-concluídas (RF04).

---

### User Story 2 - Editar uma série de um exercício já concluído, sem reabri-lo (Priority: P2)

O usuário já concluiu todas as séries de um exercício e tocou em "Concluir exercício" (RF04), mas percebe — ainda durante a mesma sessão de treino — que uma das séries daquele exercício foi registrada com um valor incorreto. Ele reabre a visualização daquele exercício (sem que isso o marque como "em andamento" novamente), edita a série incorreta com a mesma confirmação de segurança, e o exercício continua concluído, com apenas o valor daquela série atualizado.

**Why this priority**: Garante que a correção não fica indisponível assim que o usuário avança no fluxo natural do treino (a maioria das correções provavelmente é percebida pouco depois de concluir o exercício, não necessariamente antes de tocar em "Concluir exercício"). É P2 porque o caso mais comum e imediato (US1, editar durante a execução ativa) já entrega o valor central da feature; este cenário estende a mesma capacidade a um momento ligeiramente posterior, ainda dentro dos limites desta feature (mesma sessão em andamento).

**Independent Test**: Pode ser testado isoladamente concluindo um exercício inteiro (todas as séries + "Concluir exercício"), reabrindo esse exercício a partir da lista para visualizar suas séries, editando uma delas com confirmação, e verificando que (a) o valor foi atualizado, e (b) o exercício continua marcado como concluído na lista, sem qualquer indicação de "em andamento".

**Acceptance Scenarios**:

1. **Given** um exercício já está marcado como concluído (todas as séries feitas, "Concluir exercício" já tocado), **When** o usuário o reabre para visualização, **Then** o sistema exibe as séries já concluídas com opção de edição, sem alterar o estado de conclusão do exercício.
2. **Given** o usuário edita e confirma uma série de um exercício já concluído, **When** a alteração é salva, **Then** o exercício permanece com status "concluído" — não retorna a "em andamento" nem a qualquer outro estado intermediário.
3. **Given** o usuário edita uma série de um exercício já concluído, **When** ele volta para a lista de exercícios do treino, **Then** o exercício continua exibido com a marcação visual de concluído (check ✓), sem mudança nesse indicador.

---

### Edge Cases

- O que acontece se o usuário tentar editar uma série que ainda não foi concluída (a série atual, em preenchimento, ou uma série futura)? Fora do escopo desta feature — a edição só se aplica a séries já concluídas (com `SerieRealizada` já persistida); a série atual continua sendo preenchida e concluída pelo fluxo normal do RF04, não por este mecanismo de edição.
- O que acontece se o usuário abrir a edição de uma série, alterar os valores, mas não confirmar (fechar a edição, navegar para outra tela, ou cancelar o diálogo de confirmação)? Nenhuma alteração é persistida; o valor original da série permanece como estava antes da tentativa de edição.
- O que acontece se o usuário tentar salvar uma edição com o campo de carga ou de repetições vazio, ou com um valor inválido (não numérico, negativo em repetições)? As mesmas regras de validação de entrada já aplicadas ao preenchimento original da série (RF03: carga aceita decimal, repetições aceita apenas inteiro não negativo) se aplicam à edição — um valor inválido impede a confirmação da edição, sem gravar nada.
- O que acontece se o usuário editar uma série e não alterar nenhum valor (reabrir e confirmar sem mudar nada)? A confirmação ainda é solicitada (o sistema não distingue "sem mudança real" de "mudança"), e o valor é regravado igual ao anterior — sem efeito prático, mas sem erro.
- O que acontece se a sessão em andamento correspondente ao treino não existir mais (ex.: dado corrompido ou removido por fora do app)? Fora do escopo desta feature — assume-se que a sessão existe, pois a própria tela de execução (RF04) depende dela para exibir as séries concluídas; a ausência da sessão é uma condição de erro tratada pela infraestrutura de persistência do RF04, não redefinida aqui.
- O que acontece se o usuário tentar editar uma série de um exercício diferente do que está atualmente aberto na tela de execução? Fora do escopo desta feature — a edição está disponível apenas para séries do exercício atualmente em foco na tela de execução (aberto via RF04), não para outros exercícios do mesmo treino a partir dessa tela.
- O que acontece com o campo de repetições/carga da série *atual* (ainda não concluída) quando o usuário está editando uma série *anterior* já concluída? Nenhum impacto — são estados independentes; editar uma série concluída não interfere nos valores em preenchimento da série atual, nem interrompe o cronômetro de descanso em andamento (RF05), caso este esteja ativo no momento da edição.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST exibir, na tela de execução do exercício atualmente aberto (RF04), a lista de séries já concluídas daquele exercício com seus valores atuais de carga e repetições, incluindo séries que não são a mais recentemente concluída.
- **FR-002**: O sistema MUST permitir que o usuário inicie a edição de qualquer série já concluída daquele exercício, individualmente, independentemente de ser a série mais recente ou uma anterior.
- **FR-003**: O sistema MUST permitir a edição do valor de carga e/ou do valor de repetições da série selecionada, usando as mesmas regras de validação de entrada já definidas para o preenchimento original (RF03): carga aceita valor decimal, repetições aceita apenas inteiro não negativo.
- **FR-004**: O sistema MUST NOT permitir confirmar/salvar uma edição enquanto o valor de carga ou de repetições informado for inválido (vazio, não numérico, ou repetições negativas), mantendo o valor original da série intacto nesse caso.
- **FR-005**: Antes de gravar qualquer alteração de uma série editada, o sistema MUST solicitar confirmação explícita do usuário, distinta da ação que iniciou a edição.
- **FR-006**: Ao confirmar a edição, o sistema MUST atualizar o valor da série editada (carga e/ou repetições) tanto no estado em memória quanto na sessão persistida (`sessoes:<perfil_id>`, estrutura `SessaoTreino.execucoes[].seriesRealizadas`, criada e mantida pelo RF04), sem criar uma nova série nem remover a existente — apenas o registro daquela série específica é atualizado.
- **FR-007**: Ao cancelar o pedido de confirmação, ou sair da edição sem confirmar, o sistema MUST NOT persistir nenhuma alteração — o valor original da série permanece exatamente como estava.
- **FR-008**: O sistema MUST NOT alterar o campo `status` (`em_andamento`/`concluido`) do exercício, nem qualquer outro indicador de estado de conclusão, como efeito de editar uma de suas séries — a edição afeta exclusivamente o valor de `cargaKg` e/ou `reps` da `SerieRealizada` editada.
- **FR-009**: O sistema MUST permitir a edição de séries mesmo quando o exercício já estiver marcado como concluído (`status: 'concluido'`), desde que ainda dentro da mesma sessão em andamento (`finalizadaEm === null`) e o exercício seja reaberto para visualização a partir da tela de execução — sem que essa reabertura reverta o exercício para `em_andamento`.
- **FR-010**: O sistema MUST NOT permitir, por meio desta feature, a edição de séries de exercícios diferentes do exercício atualmente em foco na tela de execução, nem de séries ainda não concluídas (a série atual em preenchimento ou séries futuras).
- **FR-011**: O sistema MUST NOT permitir, por meio desta feature, a edição de séries pertencentes a sessões já finalizadas (`finalizadaEm` preenchido) — esse cenário é escopo exclusivo do RF09b, a partir da tela de histórico (RF08), ainda não implementada.

### Key Entities

- **Série concluída (`SerieRealizada`)**: entidade já existente, criada pelo RF04 (`src/types/execucao-treino.ts`), contendo `serie` (número), `cargaKg` e `reps`. Esta feature não adiciona campos a essa entidade — apenas permite que `cargaKg` e/ou `reps` de uma instância já existente sejam substituídos por um novo valor, mantendo o mesmo `serie`.
- **Execução do exercício (`ExecucaoExercicio`)**: entidade já existente (RF04), contém `seriesRealizadas` (lista de `SerieRealizada`) e `status`. Esta feature lê e localiza a série a editar dentro dessa lista, mas não modifica `status` nem `exercicioId` como parte da edição.
- **Sessão de treino em andamento (`SessaoTreino`)**: entidade já existente (RF04), persistida em `sessoes:<perfil_id>`, com `finalizadaEm: null` enquanto em andamento. Esta feature grava a edição diretamente dentro da `ExecucaoExercicio` correspondente, sem alterar `finalizadaEm`, `treinoId`, `perfilId` ou `iniciadaEm`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue corrigir a carga e/ou as repetições de qualquer série já concluída do exercício em execução, incluindo séries anteriores à série atual, em no máximo 4 toques (selecionar a série, editar o valor, confirmar a edição, confirmar o diálogo de segurança).
- **SC-002**: 100% das edições de série exigem uma confirmação explícita antes de serem gravadas — nenhuma edição é salva automaticamente ao sair do campo de edição.
- **SC-003**: Em 100% dos casos de edição de uma série de um exercício já concluído, o exercício permanece marcado como concluído após a edição, sem reverter para "em andamento" ou qualquer outro estado.
- **SC-004**: Em 100% dos casos, uma edição confirmada continua refletida no valor da série após fechar e reabrir o app durante a mesma sessão em andamento (mesma garantia de persistência já validada pelo RF04).
- **SC-005**: Em 100% das tentativas de cancelar a confirmação de uma edição, o valor original da série permanece inalterado, verificável reabrindo a série para visualização.

## Assumptions

- Esta feature só se aplica a séries do **exercício atualmente aberto** na tela de execução (RF04) — editar séries de outros exercícios do mesmo treino, ou de outros treinos/sessões, está fora de escopo (fica implícito no RF09b para sessões finalizadas, e não há necessidade identificada de um mecanismo equivalente para "outro exercício da mesma sessão, ainda em andamento" nesta fase do MVP).
- A confirmação exigida (FR-005) é um diálogo de confirmação simples (aceitar/cancelar), consistente com o padrão de baixo atrito já estabelecido nas demais interações do MVP (RNF03: interações principais em no máximo 2 toques) — não é assumido nenhum mecanismo adicional de segurança (senha, biometria), já que o RF10 estabelece que perfis não têm proteção de acesso.
- A edição de uma série de um exercício já concluído (User Story 2) exige que o usuário consiga "reabrir" a visualização desse exercício a partir da lista de exercícios (RF04) sem que essa ação, por si só, reverta o estado de conclusão — este comportamento de navegação (abrir um exercício já concluído apenas para visualização) é uma extensão necessária desta feature sobre o que o RF04 definia (RF04 previa apenas abrir exercícios não concluídos); reabrir um exercício concluído nesta feature é estritamente para fins de visualização/edição de séries, não reinicia nem altera nenhum outro aspecto do fluxo de execução do RF04.
- Esta feature não introduz nenhuma forma de excluir uma série já concluída, nem de adicionar uma série extra além das planejadas — apenas a edição do valor de `cargaKg` e/ou `reps` de uma série já existente.
- O cronômetro de descanso (RF05, se já em andamento no momento da edição) não é afetado pela edição de uma série anterior — a edição é tratada como uma ação independente do fluxo de séries/descanso.
- Conforme a Contrato de Persistência da Sessão definido pelo RF04, a gravação da edição usa a mesma chave (`sessoes:<perfil_id>`) e a mesma estrutura (`SessaoTreino.execucoes[].seriesRealizadas`) já criada por aquele requisito — esta feature não introduz uma nova chave de armazenamento nem uma estrutura paralela.
