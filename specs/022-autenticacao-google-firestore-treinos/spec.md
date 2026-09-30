# Feature Specification: Autenticação Google + Firestore para Treinos

**Feature Branch**: `022-autenticacao-google-firestore-treinos`

**Created**: 2026-09-29

**Status**: Draft

**Requisito**: Substitui o RF10 (PRD, seção 6); migra RF01/RF02 para Firestore; base de regras: Constitution v2.0.0, Princípio V (NON-NEGOTIABLE)

**Input**: User description: "Substituir o RF10 (criação/seleção de perfil local) por autenticação via Google Sign-In (Firebase Authentication) — Apple Sign-In FORA de escopo nesta rodada, feature futura quando houver conta paga do Apple Developer Program. Ao abrir o app sem sessão ativa, exibir tela de login (só Google); após autenticar, se for o primeiro login dessa conta, coletar os dados físicos já usados pelo RF10 (nome, peso, altura, idade, sexo, objetivo) — reaproveitando o mesmo formulário já validado, sem inventar um novo. Treinos importados (RF01) e a lista de treinos (RF02) passam a ser armazenados no Firestore, em uma coleção segregada pelo uid da conta autenticada (ex: users/{uid}/treinos), substituindo AsyncStorage para esses dois requisitos especificamente. AJUSTE ARQUITETURAL DE CONTINUIDADE: todo o restante do app que hoje depende de perfilId (sessão de execução RF03/04/05/06/07/09a, histórico RF08/09b/018/019, ciclo de progresso RF17) NÃO migra nesta fase — continua funcionando exatamente como hoje, via AsyncStorage, recebendo o uid da conta logada no lugar do perfilId local antigo (mesmo formato de identificador, fonte diferente) — para o app continuar 100% funcional ponta a ponta durante a transição em fases. \"Trocar perfil\" (RF14, tela Ações) vira \"Sair da conta\" (logout) — trocar de usuário no mesmo aparelho exige logout + novo login. Sem migração dos dados locais de teste já existentes — usuário aceita começar do zero. Login/logout exige rede; o restante do app (incluindo leitura/escrita de treinos no Firestore) continua funcionando offline via persistência nativa do SDK do Firestore, sincronizando automaticamente ao reconectar. Esta spec também deve cobrir, como parte do seu escopo de tasks (não como requisito funcional em si), a atualização de docs/PRD-app-treino.md: RNF02 (exceção de rede para login/logout), RNF05 (não é mais verdade que perfis não têm autenticação) e seção 5 - Não-objetivos (remover \"login/autenticação real\" e \"sincronização entre aparelhos\" da lista de itens fora de escopo, já que esta feature os torna escopo real). Usar a Constitution v2.0.0 (Princípio V) como base de regras não-negociáveis. Não implementar código ainda — apenas descrever o comportamento esperado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar no app com a Conta Google (Priority: P1)

Um usuário abre o app sem nenhuma sessão ativa (primeira instalação, ou depois de um logout). Em vez do formulário de criação de perfil ou da lista de perfis locais (RF10 antigo), o app exibe uma tela de login com um único botão de entrada via Conta Google. Ao tocar nesse botão, o fluxo padrão de autenticação do Google é exibido; ao concluir com sucesso, o usuário é autenticado e o app prossegue (para o formulário de dados físicos, se for a primeira vez dessa conta, ou direto para a lista de treinos, se não for).

**Why this priority**: Sem autenticação, nenhuma outra funcionalidade do app pode operar — a Constitution v2.0.0 (Princípio V, NON-NEGOTIABLE) já torna login obrigatório em qualquer acesso. Esta é a nova porta de entrada do app, substituindo o antigo RF10.

**Independent Test**: Pode ser testado isoladamente abrindo o app sem sessão ativa, confirmando que a tela de login (só Google) aparece antes de qualquer outra tela, completando o login e confirmando que o app avança.

**Acceptance Scenarios**:

1. **Given** o app é aberto e não há sessão de autenticação ativa, **When** o app carrega, **Then** a tela de login é exibida antes de qualquer outra tela, com apenas a opção "Entrar com o Google" (nenhuma opção de perfil local, nenhuma opção Apple).
2. **Given** a tela de login está sendo exibida, **When** o usuário toca em "Entrar com o Google" e conclui o fluxo de autenticação do Google com sucesso, **Then** o usuário fica autenticado e o app avança (User Story 2 ou 3, conforme o caso).
3. **Given** a tela de login está sendo exibida, **When** o usuário cancela o fluxo do Google ou ele falha (ex: sem conexão), **Then** o app permanece na tela de login, exibindo uma mensagem clara do que houve, sem travar nem fechar sozinho.
4. **Given** o usuário já concluiu login anteriormente e fecha/reabre o app sem ter feito logout, **When** o app é aberto, **Then** a sessão continua ativa automaticamente, sem exibir a tela de login novamente.

---

### User Story 2 - Preencher dados físicos no primeiro login de uma conta (Priority: P1)

Depois de autenticar com sucesso pela primeira vez com uma determinada Conta Google, o app detecta que essa conta ainda não tem dados físicos salvos e exibe o mesmo formulário já usado pelo RF10 (nome, peso, altura, idade, sexo, objetivo de treino), com as mesmas regras de obrigatoriedade e validação. Depois de salvar, esses dados ficam associados à conta e o app avança para a lista de treinos.

**Why this priority**: Dados físicos (peso, altura, idade, objetivo) são usados por outras partes do app; sem eles, a experiência fica incompleta logo na primeira sessão. Como o formulário já existe e já foi validado (RF10), esta funcionalidade é reaproveitar, não reinventar — baixo risco, alto valor imediato.

**Independent Test**: Pode ser testado isoladamente autenticando com uma Conta Google nova (sem dados físicos salvos), confirmando que o formulário aparece, preenchendo e salvando, e confirmando que o app chega à lista de treinos.

**Acceptance Scenarios**:

1. **Given** o usuário autenticou com sucesso e é o primeiro login dessa conta (nenhum dado físico salvo para ela), **When** o login é concluído, **Then** o app exibe o formulário de dados físicos (nome, peso, altura, idade, sexo, objetivo) antes de qualquer outra tela.
2. **Given** o formulário de dados físicos está aberto, **When** o usuário tenta salvar sem preencher algum campo obrigatório, **Then** o app impede o salvamento e indica quais campos estão faltando (mesmo comportamento do RF10 original).
3. **Given** o formulário de dados físicos está aberto, **When** o usuário preenche todos os campos e confirma, **Then** os dados são salvos associados à conta autenticada e o app navega para a lista de treinos.
4. **Given** uma conta já tem dados físicos salvos de um login anterior, **When** essa mesma conta autentica novamente (neste ou em outro aparelho), **Then** o formulário de dados físicos NÃO é exibido de novo — o app vai direto para a lista de treinos.

---

### User Story 3 - Treinos importados e listados via Firestore, por conta (Priority: P1)

Um usuário autenticado importa um arquivo de treino (RF01) ou consulta a lista de treinos (RF02). Essas operações passam a ler/escrever no Firestore, numa área exclusiva da conta autenticada — nenhum outro usuário, mesmo no mesmo aparelho, enxerga os treinos importados por outra conta. O comportamento visível ao usuário (mensagens de sucesso/erro, importação parcial, ordenação da lista) continua idêntico ao já existente em RF01/RF02.

**Why this priority**: É o núcleo funcional desta migração — sem isso, autenticar não muda onde os dados realmente moram. Prioridade igual às Stories 1 e 2 porque as três, juntas, são o que torna a conta autenticada útil de verdade.

**Independent Test**: Pode ser testado isoladamente autenticando com duas contas Google diferentes no mesmo aparelho (logout + login), importando treinos distintos em cada uma, e confirmando que cada conta só vê os próprios treinos.

**Acceptance Scenarios**:

1. **Given** um usuário está autenticado, **When** ele importa um arquivo de treino válido (RF01), **Then** o treino é salvo no Firestore, associado à conta autenticada, e passa a aparecer na lista de treinos (RF02) dessa conta.
2. **Given** duas contas Google diferentes já importaram treinos em algum momento, **When** cada uma está autenticada e consulta a lista de treinos, **Then** cada conta vê exclusivamente os próprios treinos, nunca os da outra conta.
3. **Given** um usuário está autenticado mas sem conexão de rede, **When** ele consulta a lista de treinos já sincronizada anteriormente, **Then** a lista é exibida normalmente a partir da persistência offline do Firestore, sem exigir rede.
4. **Given** um usuário importou um treino enquanto offline, **When** a conexão de rede é restabelecida, **Then** o treino é sincronizado automaticamente com o Firestore, sem ação manual do usuário.

---

### User Story 4 - Sair da conta (substitui "Trocar perfil") (Priority: P2)

Na tela de Ações (RF14), o item que antes permitia trocar de perfil local passa a se chamar "Sair da conta". Ao usar essa ação, a sessão autenticada é encerrada e o app volta à tela de login. Para usar outra Conta Google no mesmo aparelho, o usuário faz login novamente com a conta desejada.

**Why this priority**: Prioridade menor que as Stories 1-3 porque é a "saída" do fluxo, não a entrada — o app já é utilizável ponta a ponta sem essa ação (um único login já cobre o uso contínuo), mas ela é necessária para dar suporte a mais de uma conta no mesmo aparelho, como o modelo antigo de múltiplos perfis já suportava.

**Independent Test**: Pode ser testado isoladamente autenticando, acessando a tela de Ações, tocando em "Sair da conta", e confirmando que o app volta à tela de login (User Story 1) e que um novo login (mesma conta ou outra) funciona normalmente depois.

**Acceptance Scenarios**:

1. **Given** um usuário está autenticado e abre a tela de Ações, **When** ele observa a lista de ações, **Then** vê "Sair da conta" no lugar de "Trocar perfil", mostrando a conta atualmente autenticada (ex: e-mail ou nome da Conta Google).
2. **Given** o usuário está na tela de Ações, **When** ele toca em "Sair da conta", **Then** a sessão é encerrada e o app navega para a tela de login (User Story 1).
3. **Given** o usuário acabou de sair da conta, **When** ele faz login novamente com uma Conta Google diferente da anterior, **Then** o app trata essa conta como uma conta distinta (com seu próprio primeiro-login e seus próprios treinos), sem misturar dados com a conta anterior.

---

### Edge Cases

- O que acontece se o usuário sair da conta (logout) enquanto uma sessão de treino está em andamento (execução ativa, RF04)? A sessão em andamento continua salva localmente (AsyncStorage, associada ao `uid`) e é retomada normalmente se a mesma conta fizer login de novo neste aparelho — o logout NÃO é bloqueado por uma sessão em andamento (diferente da regra antiga do RF10, que bloqueava troca de perfil nesse caso; deixou de ser necessária porque os dados não ficam órfãos — continuam vinculados ao mesmo `uid`).
- O que acontece se a mesma Conta Google autenticar em dois aparelhos diferentes? A lista de treinos (RF01/RF02, via Firestore) é a mesma nos dois aparelhos. Já a execução em andamento, o histórico de sessões e o progresso de ciclo (RF03-09a/RF08/RF09b/RF18/RF15, que continuam via AsyncStorage local nesta fase — ver FR-012) são independentes por aparelho — um treino concluído num aparelho não aparece no histórico do outro até uma fase futura de migração. Este comportamento é esperado nesta fase de transição, não um defeito.
- O que acontece se o dispositivo tiver dados locais de perfis antigos (`perfilId`) de antes desta migração? Esses dados são ignorados e permanecem inacessíveis a partir desta feature — não há importação/migração automática (decisão explícita do usuário: começar do zero).
- O que acontece se o login for concluído mas a verificação de dados físicos já salvos da conta falhar (ex: rede cai bem nesse instante)? O app MUST tratar isso de forma segura — exibir uma mensagem de erro clara com opção de tentar novamente, nunca travar numa tela em branco nem arriscar duplicar dados físicos da mesma conta.
- O que acontece se o usuário fechar o app durante o preenchimento do formulário de dados físicos, sem salvar? Nenhum dado parcial é salvo; no próximo login dessa conta, o formulário é exibido novamente do zero (mesmo comportamento do RF10 original).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST exigir autenticação para qualquer uso do app — nenhuma tela além da tela de login MUST ser acessível sem uma sessão autenticada ativa (Constitution v2.0.0, Princípio V).
- **FR-002**: O sistema MUST oferecer exclusivamente a opção "Entrar com o Google" (Google Sign-In via Firebase Authentication) na tela de login nesta fase — nenhuma outra opção de login (incluindo Apple Sign-In) MUST ser exibida.
- **FR-003**: O sistema MUST manter a sessão autenticada entre aberturas do app (o usuário não deve precisar logar novamente a cada vez que abre o app), até que ele saia explicitamente da conta (User Story 4) ou a sessão seja invalidada pelo provedor.
- **FR-004**: O sistema MUST exibir uma mensagem de erro clara e permanecer na tela de login quando o login falhar ou for cancelado pelo usuário, sem travar o app.
- **FR-005**: O sistema MUST detectar, a cada login bem-sucedido, se é o primeiro login dessa conta (nenhum dado físico salvo associado a ela) e, se for, exibir o formulário de dados físicos antes de qualquer outra tela.
- **FR-006**: O formulário de dados físicos do primeiro login MUST reaproveitar os mesmos campos, opções fixas e regras de obrigatoriedade já definidos pelo RF10 original: nome, peso (kg), altura (cm), idade, sexo (Masculino/Feminino) e objetivo de treino (Hipertrofia/Emagrecimento/Condicionamento/Manutenção) — todos obrigatórios, sem inventar novos campos.
- **FR-007**: O sistema MUST armazenar os dados físicos preenchidos no Firestore, num documento identificado pelo `uid` da conta autenticada (ex: `users/{uid}`) — mesma área/tecnologia de armazenamento usada para os treinos (FR-008), e não AsyncStorage — de forma que logins futuros da mesma conta, neste ou em qualquer outro aparelho, encontrem esses dados e não exibam o formulário novamente.
- **FR-008**: O sistema MUST armazenar treinos importados (RF01) e a lista de treinos (RF02) no Firestore, numa área identificada pelo `uid` da conta autenticada (ex: `users/{uid}/treinos`), substituindo o AsyncStorage como fonte de verdade para esses dois requisitos especificamente.
- **FR-009**: As regras de segurança do Firestore MUST impedir, no próprio backend (não apenas por filtro no cliente), que uma conta autenticada leia ou escreva os treinos (FR-008) ou o documento de dados físicos (FR-007) de outro `uid` (Constitution v2.0.0, Princípio V).
- **FR-010**: O comportamento observável de importação e listagem de treinos (mensagens de sucesso, erro, importação parcial, ordenação, estado vazio) MUST permanecer idêntico ao já especificado em RF01/RF02 — esta feature muda apenas onde os dados são armazenados, não como o usuário interage com eles.
- **FR-011**: O sistema MUST continuar funcionando offline para leitura e escrita de treinos (Firestore), usando a persistência offline nativa do SDK do Firestore, sincronizando automaticamente ao reconectar — a única exceção à operação offline é o próprio fluxo de login/logout, que exige conectividade de rede.
- **FR-012**: Todas as demais áreas do app que hoje dependem de `perfilId` — sessão de execução (RF03/RF04/RF05/RF06/RF07/RF09a), histórico (RF08/RF09b/RF18, spec `019-historico-por-data/`), e ciclo de progresso (RF15, spec `018-progresso-ciclo/`) — MUST continuar funcionando exatamente como hoje, via AsyncStorage, usando o `uid` da conta autenticada no lugar do `perfilId` local antigo (mesmo formato de chave, fonte de identidade diferente). Nenhuma dessas áreas MUST ser migrada para Firestore nesta feature.
- **FR-013**: A tela de Ações (RF14) MUST substituir o item "Trocar perfil" por "Sair da conta", exibindo a conta autenticada atual (ex: e-mail/nome da Conta Google).
- **FR-014**: Ao tocar em "Sair da conta", o sistema MUST encerrar a sessão autenticada e navegar para a tela de login, sem bloquear essa ação mesmo que haja uma sessão de treino em andamento (ver Edge Cases).
- **FR-015**: O sistema MUST NOT migrar, importar ou de qualquer forma reaproveitar dados locais de perfis anteriores a esta feature (`perfilId` antigo) — cada conta autenticada começa sem nenhum treino e sem dados físicos salvos, até que os preencha.
- **FR-016**: O sistema MUST NOT exibir, nesta fase, nenhuma opção de login via Apple — essa opção fica reservada para uma feature futura, condicionada à existência de uma conta paga do Apple Developer Program.

### Key Entities

- **Conta autenticada**: Representa o usuário logado via Google Sign-In. Atributos principais: `uid` (identificador único fornecido pelo Firebase Authentication), e-mail/nome exibido pelo Google. Substitui o antigo "Perfil" como unidade de identidade do app.
- **Dados físicos da conta**: nome, peso (kg), altura (cm), idade, sexo, objetivo de treino — mesmos atributos do antigo "Perfil" (RF10), agora associados ao `uid` em vez de um `perfilId` local. Armazenados no Firestore (ex: documento `users/{uid}`), na mesma área/tecnologia dos treinos — não em AsyncStorage — para que fiquem consistentes entre aparelhos da mesma conta (decisão confirmada: já era exigida pelo Acceptance Scenario 4 da User Story 2, que só é satisfazível com armazenamento centralizado).
- **Treino** (já existente, RF01): sem mudança de estrutura/campos nesta feature — só muda onde é armazenado (Firestore em vez de AsyncStorage), segregado por `uid` em vez de `perfilId`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário sem sessão ativa consegue autenticar com o Google e chegar à lista de treinos (ou ao formulário de dados físicos, no primeiro login) em menos de 30 segundos, dado um login bem-sucedido.
- **SC-002**: 100% das tentativas de acessar qualquer tela do app sem sessão autenticada ativa são redirecionadas para a tela de login, sem exceção.
- **SC-003**: 100% dos treinos importados por uma conta ficam inacessíveis a qualquer outra conta, mesmo no mesmo aparelho — verificável autenticando com duas contas diferentes e comparando as listas.
- **SC-004**: Um usuário consegue consultar e importar treinos normalmente mesmo sem conexão de rede, exceto durante o próprio login/logout.
- **SC-005**: Um usuário consegue sair da conta e entrar com outra Conta Google no mesmo aparelho em até 3 toques a partir da tela de Ações, sem precisar desinstalar ou limpar dados do app.
- **SC-006**: 100% dos logins subsequentes de uma conta que já preencheu os dados físicos pulam diretamente para a lista de treinos, sem repetir o formulário.

## Assumptions

- O formulário de dados físicos reaproveitado (User Story 2) é o mesmo componente/tela já implementado e validado pelo RF10 (spec `001-perfil-local`) — esta feature reaproveita a UI existente, sem recriar um novo formulário do zero.
- Sair da conta (logout) NÃO é bloqueado por uma sessão de treino em andamento, ao contrário da regra antiga de troca de perfil (RF10 US3) — porque os dados da sessão ficam seguros sob o mesmo `uid` em AsyncStorage e são retomados no próximo login da mesma conta, sem risco de ficarem órfãos.
- A mesma Conta Google pode autenticar em múltiplos aparelhos; a lista de treinos (Firestore) fica consistente entre eles, mas execução/histórico/progresso de ciclo (que continuam em AsyncStorage local nesta fase) permanecem independentes por aparelho — consequência aceita da migração em fases, não um requisito novo desta feature.
- Dados locais de perfis anteriores a esta feature (modelo `perfilId`) não são lidos, migrados nem exibidos de nenhuma forma — cada conta autenticada começa com estado vazio (decisão explícita do usuário).
- A atualização de `docs/PRD-app-treino.md` (RNF02, RNF05, seção 5 - Não-objetivos) para refletir esta mudança de arquitetura é tratada como parte do trabalho de implementação desta feature (fase de tasks), não como um requisito funcional do produto em si.
- Apple Sign-In fica fora de escopo nesta feature; nenhuma FR desta spec cobre esse provedor, ficando reservado para uma feature futura dependente de uma conta paga do Apple Developer Program.
