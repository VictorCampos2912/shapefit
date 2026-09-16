# Feature Specification: Importar Treino via Arquivo JSON

**Feature Branch**: `002-importar-treino-json`

**Created**: 2026-09-15

**Status**: Draft

**Input**: User description: "RF01: importar arquivo JSON com estrutura de treino (nome, exercícios, séries, reps_alvo, carga_sugerida_kg, descanso_seg), vinculado ao perfil ativo no momento da importação (perfil_id, conforme o padrão de chave AsyncStorage estabelecido pelo RF10). Importação via seleção de arquivo do sistema (expo-document-picker). Em caso de erro em um exercício específico do JSON (campo faltando ou tipo errado), importar o restante do treino normalmente e avisar o usuário sobre o que foi ignorado — não bloquear a importação inteira por um erro parcial. Um treino importado por um perfil não deve aparecer para nenhum outro perfil."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Importar um treino válido para o perfil ativo (Priority: P1)

Um usuário com um perfil ativo já selecionado (RF10) quer trazer para o app um treino planejado externamente. Ele abre o seletor de arquivos do sistema a partir do app, escolhe um arquivo `.json` com a estrutura correta de treino, e o app importa esse treino com sucesso, associando-o ao seu perfil ativo no momento da importação.

**Why this priority**: É o caminho principal e o motivo de existir do requisito — sem essa capacidade básica de importação bem-sucedida, nenhuma outra funcionalidade do app (execução, histórico) tem dado para operar.

**Independent Test**: Pode ser testado isoladamente selecionando um arquivo JSON válido (seguindo o schema do PRD) através do seletor de arquivos e confirmando que o treino aparece disponível para o perfil ativo, com todos os exercícios e seus dados planejados intactos.

**Acceptance Scenarios**:

1. **Given** um perfil ativo selecionado e nenhum treino ainda importado, **When** o usuário abre o seletor de arquivos do sistema a partir do app e escolhe um arquivo `.json` válido (seguindo o schema do PRD), **Then** o treino é importado com sucesso e passa a estar disponível para esse perfil.
2. **Given** um treino foi importado com sucesso, **When** o app registra a importação, **Then** o treino fica associado ao perfil que estava ativo no momento da importação.
3. **Given** o app inclui um arquivo de exemplo pré-carregado, **When** o usuário importa esse arquivo de exemplo, **Then** a importação ocorre sem nenhum erro, servindo como referência de teste.

---

### User Story 2 - Isolamento de treinos importados por perfil (Priority: P1)

Dois perfis diferentes compartilham o mesmo aparelho. Um dos perfis importa um treino. O usuário quer ter certeza de que esse treino não aparece nem pode ser acessado quando outro perfil estiver ativo, preservando a separação de dados entre pessoas que usam o mesmo aparelho.

**Why this priority**: É uma extensão direta do Princípio de Isolamento de Dados por Perfil (não-negociável no projeto); sem essa garantia, a importação teria uma falha de privacidade, não apenas uma falha funcional.

**Independent Test**: Pode ser testado isoladamente importando um treino com o Perfil A ativo, depois trocando para o Perfil B (RF10) e confirmando que o treino importado por A não aparece em nenhuma lista ou tela acessível a partir do Perfil B.

**Acceptance Scenarios**:

1. **Given** o Perfil A importou um treino, **When** o Perfil B se torna o perfil ativo, **Then** o treino importado por A não é exibido nem fica acessível a partir do Perfil B.
2. **Given** o Perfil A importou um treino, **When** o Perfil A volta a ser o perfil ativo, **Then** o treino importado continua disponível e íntegro para ele.

---

### User Story 3 - Importação parcial: erro isolado em um exercício não bloqueia o restante (Priority: P2)

Um usuário tenta importar um arquivo JSON de treino em que um dos exercícios tem um campo obrigatório faltando ou com tipo incorreto (por exemplo, `series` como texto em vez de número). Em vez de rejeitar o arquivo inteiro, o app importa todos os exercícios válidos normalmente, ignora apenas o exercício com problema, e avisa claramente o usuário sobre o que foi ignorado.

**Why this priority**: Evita que um único erro de digitação em um arquivo grande obrigue o usuário a corrigir e reimportar tudo; é uma decisão explícita de produto registrada no PRD e nos critérios de aceite, priorizada logo após o caminho feliz porque impacta diretamente a experiência de importação.

**Independent Test**: Pode ser testado isoladamente preparando um arquivo JSON com um exercício inválido entre outros válidos, importando-o, e confirmando que os exercícios válidos aparecem no treino importado, que o exercício inválido não aparece, e que uma mensagem informa o problema.

**Acceptance Scenarios**:

1. **Given** um arquivo JSON de treino com um exercício cujo campo obrigatório está faltando ou com tipo errado, **When** o usuário importa esse arquivo, **Then** o exercício problemático é ignorado, mas todos os demais exercícios válidos são importados normalmente.
2. **Given** uma importação com erro parcial ocorreu, **When** a importação termina, **Then** o app exibe uma mensagem informando que o treino foi importado de forma incompleta e, quando possível, identifica qual(is) exercício(s) foram ignorados.

---

### User Story 4 - Arquivo inválido é rejeitado sem importar nada (Priority: P2)

Um usuário seleciona, por engano, um arquivo que não é um JSON válido (corrompido ou com erro de sintaxe). O app precisa deixar claro que a importação falhou, sem criar um treino incompleto ou incorreto no sistema.

**Why this priority**: Protege a integridade dos dados do usuário — sem essa proteção, um arquivo malformado poderia gerar um treino "fantasma" ou parcialmente corrompido na lista de treinos.

**Independent Test**: Pode ser testado isoladamente selecionando um arquivo com erro de sintaxe JSON (ou um arquivo de outro formato renomeado para `.json`) e confirmando que nenhum treino é adicionado à lista e que uma mensagem de erro clara é exibida.

**Acceptance Scenarios**:

1. **Given** o usuário seleciona um arquivo que não é um JSON sintaticamente válido, **When** o app tenta processá-lo, **Then** o app exibe uma mensagem de erro clara e nenhum treino é importado.

---

### Edge Cases

- O que acontece se o campo `nome` do treino (nível raiz do JSON, não do exercício) estiver ausente? O arquivo é tratado como inválido no nível estrutural mínimo e a importação inteira é rejeitada com mensagem de erro clara (mesmo tratamento de um JSON malformado), já que não há treino identificável sem nome.
- O que acontece se a lista `exercicios` estiver ausente ou vazia? O arquivo é tratado como inválido no nível estrutural mínimo (mesmo tratamento acima), pois um treino sem nenhum exercício não tem utilidade e provavelmente indica um arquivo incorreto.
- O que acontece se todos os exercícios do arquivo forem inválidos (nenhum sobra após a validação)? O comportamento é equivalente a "todos os exercícios foram ignorados" — o app não cria um treino vazio; trata como falha de importação e informa que nenhum exercício válido foi encontrado.
- O que acontece se o usuário cancelar a seleção de arquivo no seletor do sistema? Nenhuma ação ocorre; o app retorna ao estado anterior sem exibir erro (cancelamento não é uma falha).
- O que acontece se o mesmo arquivo for importado duas vezes pelo mesmo perfil? Ambas as importações são aceitas como treinos distintos (mesmo comportamento de nomes duplicados já coberto pelo RF02); esta especificação não impõe deduplicação.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que o usuário abra o seletor de arquivos nativo do aparelho a partir do app e escolha um arquivo com extensão `.json`.
- **FR-002**: O sistema MUST importar com sucesso um arquivo JSON que siga a estrutura de treino definida (nome do treino e lista de exercícios, cada um com identificador, nome, número de séries, faixa de repetições alvo, carga sugerida em kg e tempo de descanso em segundos), tornando o treino disponível na lista de treinos do perfil ativo.
- **FR-003**: O sistema MUST associar todo treino importado ao identificador do perfil que estava ativo no momento exato da importação.
- **FR-004**: O sistema MUST impedir que um treino importado por um perfil seja exibido, listado ou de qualquer forma acessível a partir de outro perfil.
- **FR-005**: O sistema MUST validar cada exercício do arquivo individualmente: se um exercício tiver um campo obrigatório ausente ou com tipo de dado incorreto, o sistema MUST ignorar apenas esse exercício específico, sem interromper a validação e importação dos demais exercícios do mesmo treino.
- **FR-006**: Quando um ou mais exercícios forem ignorados durante uma importação, o sistema MUST exibir ao usuário uma mensagem informando que o treino foi importado de forma incompleta, identificando quando possível quais exercícios foram ignorados.
- **FR-007**: O sistema MUST rejeitar a importação inteira (sem criar nenhum treino) quando o arquivo selecionado não for um JSON sintaticamente válido, exibindo uma mensagem de erro clara ao usuário.
- **FR-008**: O sistema MUST rejeitar a importação inteira quando o arquivo, mesmo sendo um JSON válido, não contiver o nome do treino ou não contiver nenhum exercício estruturalmente reconhecível, tratando esse caso como arquivo inválido.
- **FR-009**: O sistema MUST disponibilizar, embutido no app, um arquivo de treino de exemplo que importe com sucesso e sem nenhum erro, servindo de referência de teste para o usuário.
- **FR-010**: O sistema MUST NOT alterar ou remover treinos já importados anteriormente como efeito colateral de uma nova importação.
- **FR-011**: O sistema MUST tratar o cancelamento da seleção de arquivo pelo usuário como uma ação neutra, sem exibir mensagem de erro e sem alterar a lista de treinos.

### Key Entities

- **Treino importado**: Representa um plano de treino trazido para o app via arquivo JSON. Atributos principais: nome do treino, lista de exercícios planejados, identificador do perfil ao qual pertence, momento da importação (usado para diferenciar treinos com nomes repetidos, conforme RF02). Pertence exclusivamente a um perfil.
- **Exercício planejado**: Representa um exercício dentro de um treino importado. Atributos principais: identificador do exercício, nome, número de séries planejadas, faixa de repetições alvo, carga sugerida (kg), tempo de descanso sugerido (segundos). Um exercício inválido (campo obrigatório ausente ou tipo incorreto) é descartado individualmente, sem afetar os demais exercícios do mesmo treino.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário consegue importar um arquivo de treino válido e vê-lo disponível na lista de treinos em menos de 10 segundos após selecionar o arquivo.
- **SC-002**: 100% dos treinos importados por um perfil permanecem invisíveis e inacessíveis para qualquer outro perfil no mesmo aparelho, sem exceção.
- **SC-003**: Quando um arquivo contém exercícios inválidos misturados a válidos, 100% dos exercícios válidos são importados com sucesso e o usuário é informado sobre os exercícios ignorados.
- **SC-004**: 100% das tentativas de importar um arquivo sintaticamente inválido resultam em nenhum treino criado e em uma mensagem de erro compreensível ao usuário.
- **SC-005**: O arquivo de exemplo pré-carregado no app importa com sucesso em 100% das tentativas, sem exercícios ignorados.

## Assumptions

- Um perfil ativo sempre existe no momento em que a importação é iniciada, pois o app exige a criação/seleção de um perfil (RF10) antes de liberar acesso às demais telas.
- "Campo obrigatório" e "tipo esperado" por exercício seguem exatamente o schema de treino descrito na seção 8 do PRD (nome do treino; e por exercício: identificador, nome, número de séries, faixa de repetições alvo, carga sugerida em kg, tempo de descanso em segundos).
- A extensão do arquivo aceito é `.json`; arquivos com outra extensão não são oferecidos ou são rejeitados pelo próprio seletor de arquivos do sistema.
- Esta especificação cobre apenas o comportamento de importação em si; a exibição do treino importado em uma lista (ordenação, diferenciação por data/hora de importação) é escopo do RF02, já especificado separadamente.
- Não há limite máximo de treinos importáveis por perfil definido nesta especificação; assume-se volume compatível com uso pessoal (dezenas de treinos), sem necessidade de paginação ou otimização especial.
