# Feature Specification: Importar Múltiplos Treinos de um Único Arquivo

**Feature Branch**: `012-importar-multiplos-treinos`

**Created**: 2026-09-21

**Status**: Implemented (código pronto, validado via web; pendente validação real em Android/iOS)

**Requisito**: RF11 (PRD, seção 6 — pós-MVP)

**Input**: User description: "Estender o RF01 (importação de treino via JSON) para aceitar um único arquivo contendo múltiplos treinos, não apenas um treino por arquivo. Contexto real do usuário: o personal trainer normalmente entrega o plano completo em um arquivo só (ex: Treino Superior, Treino Inferior, Cardio), não um arquivo por dia de treino — a suposição de \"um treino por arquivo\" do RF01 original não reflete como esses arquivos chegam na prática. Fixture de teste já preparado em docs/exemplos/treinos_multiplos.json: um array JSON no nível raiz, cada item seguindo exatamente o mesmo schema de treino já usado pelo RF01 (nome + exercicios[]). O comportamento esperado: ao selecionar um arquivo cujo JSON raiz é um array de treinos (em vez de um único objeto de treino), o app deve reconhecer e importar todos os treinos válidos daquele array de uma vez, associados ao perfil ativo (mesma regra de vínculo por perfil do RF01) — mantendo compatibilidade total com arquivos de treino único já suportados (um objeto no nível raiz continua funcionando exatamente como hoje). Reaproveitar as mesmas regras de validação por exercício e de erro parcial já definidas no RF01 (um exercício inválido não invalida o treino inteiro; um treino inválido dentro do array não deveria invalidar os demais treinos válidos do mesmo array — mas isso deve ser tratado como uma decisão a esclarecer, não presumida). Usar os critérios de aceite do RF01 já existentes em criterios-aceite.md como base, estendendo onde necessário para o caso de múltiplos treinos por arquivo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Importar o plano completo de treinos em um único arquivo (Priority: P1)

O personal trainer do usuário entrega o plano de treino completo em um único arquivo
JSON contendo vários treinos (ex.: "Treino Superior", "Treino Inferior", "Cardio").
Hoje, o usuário só consegue importar esse arquivo se ele contiver exatamente um
treino — na prática, o arquivo que ele recebe nunca vem assim. Com esta feature, o
usuário seleciona esse mesmo arquivo através da ação "Importar treino" já existente, e
todos os treinos válidos contidos nele são importados de uma só vez, cada um
aparecendo separadamente na lista de treinos (RF02), exatamente como se tivessem sido
importados um a um.

**Why this priority**: É o valor central desta feature e resolve uma limitação que
impede o uso real do app com o material que o usuário efetivamente recebe do personal
trainer — sem isso, o app não serve para o fluxo de trabalho real dele.

**Independent Test**: Selecionar, via "Importar treino", um arquivo cujo JSON raiz é
um array com dois ou mais treinos válidos (ex.:
`docs/exemplos/treinos_multiplos.json`); verificar que todos aparecem na lista de
treinos do perfil ativo, cada um com seus próprios exercícios corretos.

**Acceptance Scenarios**:

1. **Given** um arquivo JSON cujo elemento raiz é um array contendo dois treinos
   válidos, **When** o usuário o seleciona via "Importar treino", **Then** ambos os
   treinos são importados e passam a aparecer na lista de treinos do perfil ativo.
2. **Given** um arquivo com múltiplos treinos foi importado com sucesso, **When** o
   usuário abre qualquer um dos treinos importados, **Then** ele exibe exatamente os
   exercícios definidos para aquele treino específico no arquivo original, sem mistura
   com os exercícios de outro treino do mesmo arquivo.
3. **Given** um arquivo com múltiplos treinos é importado, **When** a importação
   termina, **Then** todos os treinos importados ficam associados ao perfil que estava
   ativo no momento da importação (mesma regra do RF01), e nenhum aparece para outro
   perfil.

---

### User Story 2 - Continuar importando arquivos de um único treino exatamente como antes (Priority: P1)

Usuários que ainda recebem (ou já possuem) arquivos com um único treino continuam
importando-os exatamente como hoje — esta feature não pode quebrar nem alterar esse
comportamento já existente.

**Why this priority**: É uma garantia de não-regressão sobre uma funcionalidade já em
uso (RF01, RF02, RF07 e demais features dependem de treinos importados corretamente)
— tem a mesma prioridade da User Story 1 porque a feature só tem valor se não quebrar
o que já funciona.

**Independent Test**: Importar um arquivo cujo JSON raiz é um único objeto de treino
(não um array) — igual aos arquivos já usados em todas as features anteriores — e
confirmar que o comportamento observável (treino importado, mensagens de sucesso/erro,
tratamento de exercício inválido) é idêntico ao que já existia antes desta feature.

**Acceptance Scenarios**:

1. **Given** um arquivo JSON cujo elemento raiz é um único objeto de treino (mesmo
   formato já suportado pelo RF01), **When** o usuário o seleciona via "Importar
   treino", **Then** o comportamento é idêntico ao já existente antes desta feature —
   nenhuma mudança perceptível.
2. **Given** o arquivo de exemplo pré-carregado no app (ação "Importar treino de
   exemplo") continua sendo um único objeto de treino, **When** o usuário usa essa
   ação, **Then** o comportamento permanece exatamente o mesmo de antes desta feature.

---

### User Story 3 - Saber quantos treinos foram importados de uma vez (Priority: P2)

Depois de importar um arquivo com múltiplos treinos, o usuário quer confirmar, de
forma clara e em uma única mensagem, quantos treinos foram efetivamente importados —
sem precisar contar manualmente na lista de treinos nem receber uma mensagem de
confirmação separada para cada treino do arquivo.

**Why this priority**: Melhora a confiança do usuário de que a importação múltipla
funcionou como esperado, mas não é indispensável para o valor central (os treinos já
aparecem corretamente na lista mesmo sem essa mensagem resumida) — por isso P2, abaixo
das duas histórias anteriores.

**Independent Test**: Importar um arquivo com três treinos válidos e confirmar que
uma única mensagem de confirmação é exibida ao final, informando quantos treinos
foram importados — não três mensagens separadas, uma por treino.

**Acceptance Scenarios**:

1. **Given** um arquivo com múltiplos treinos válidos é importado com sucesso,
   **When** a importação termina, **Then** o usuário vê uma única mensagem de
   confirmação informando quantos treinos foram importados.

---

### Edge Cases

- O arquivo selecionado tem como elemento raiz um array vazio (`[]`) → tratado como
  arquivo inválido, nenhum treino é importado — mesmo tratamento já dado hoje a um
  treino sem nenhum exercício válido (RF01).
- Um exercício individual, dentro de um dos treinos do array, tem campo obrigatório
  ausente ou de tipo errado → mesma regra já existente do RF01: apenas aquele
  exercício é ignorado, o treino ao qual ele pertence continua sendo importado com os
  demais exercícios válidos.
- O elemento raiz do arquivo não é nem um objeto de treino único nem um array (ex.: um
  número, uma string, `null`) → tratado como arquivo inválido, mesma mensagem genérica
  já usada hoje para JSON malformado/estrutura irreconhecível (RF01).
- Dois treinos dentro do mesmo array têm o mesmo nome, ou um treino do array tem o
  mesmo nome de um treino já importado anteriormente → sem tratamento especial nesta
  feature; usa o mesmo indicativo de nome duplicado já existente na lista de treinos
  (RF02).
- O usuário cancela a seleção de arquivo no seletor do sistema → nenhuma ação ocorre,
  sem mensagem de erro, sem alteração na lista de treinos (mesmo comportamento já
  existente do RF01).
- Dois treinos do mesmo arquivo, mesmo nome, importados no mesmo lote, podem ter
  `importadoEm` idêntico ou próximo demais para diferenciar visualmente na lista
  (RF02) → risco aceito conscientemente, sem tratamento especial nesta feature; caso
  se mostre um problema real no uso prático, resolver em iteração futura.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE reconhecer quando o elemento raiz do JSON de um arquivo
  selecionado é um array, tratando cada item desse array como um treino independente,
  a ser validado e importado segundo as mesmas regras já aplicadas a um treino único
  (RF01).
- **FR-002**: O sistema DEVE continuar reconhecendo e importando corretamente um
  arquivo cujo elemento raiz seja um único objeto de treino (não um array), com
  comportamento idêntico ao já existente antes desta feature — nenhuma mudança para
  arquivos de treino único.
- **FR-003**: Quando um dos treinos dentro do array falha na validação de nível de
  treino (campo `nome` ausente, ou lista `exercicios` ausente/vazia, ou nenhum
  exercício individual válido restante após a validação por exercício), o sistema DEVE
  importar os demais treinos válidos do mesmo array e informar ao usuário quais foram
  ignorados e o motivo — a mesma lógica de "item inválido não invalida o restante" já
  aplicada a exercícios individuais no RF01, estendida ao nível de treino dentro do
  array.
- **FR-004**: O sistema DEVE aplicar, a cada treino dentro do array, as mesmas regras
  de validação por exercício já definidas no RF01 — um exercício individual inválido
  não invalida o treino ao qual pertence, apenas aquele exercício é ignorado.
- **FR-005**: O sistema DEVE associar todos os treinos importados com sucesso de um
  único arquivo ao perfil ativo no momento da importação, mesma regra já existente do
  RF01 — nenhum treino importado por esta feature aparece para outro perfil.
- **FR-006**: Após importar múltiplos treinos de um único arquivo, o sistema DEVE
  exibir uma única mensagem resumindo quantos treinos foram importados com sucesso e,
  se houver algum treino ou exercício ignorado, quais foram e o motivo — nunca uma
  mensagem separada por treino do array.
- **FR-007**: O sistema DEVE tratar um array vazio (`[]`) como arquivo inválido, sem
  importar nenhum treino — mesmo tratamento já dado hoje a um treino sem nenhum
  exercício válido (RF01).
- **FR-008**: Esta feature NÃO DEVE alterar o comportamento da ação "Importar treino
  de exemplo" já existente, cujo arquivo de exemplo pré-carregado continua sendo um
  único objeto de treino — a menos que esse arquivo de exemplo venha a ser alterado
  para conter múltiplos treinos no futuro, o que está fora do escopo desta feature.

### Key Entities

- **Treino** (RF01/RF02, sem alteração de schema): esta feature não introduz nenhum
  campo novo ao treino em si — apenas reconhece que um único arquivo pode conter mais
  de uma instância dessa mesma entidade já existente, cada uma validada e importada
  de forma independente das demais.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue importar todos os treinos de um plano completo
  (múltiplos treinos) em uma única ação de seleção de arquivo, sem precisar repetir o
  processo de importação uma vez por treino.
- **SC-002**: 100% dos arquivos de treino único já suportados antes desta feature
  continuam sendo importados com sucesso, sem nenhuma mudança de comportamento
  perceptível pelo usuário.
- **SC-003**: Ao importar um arquivo com múltiplos treinos válidos, 100% deles
  aparecem corretamente na lista de treinos do perfil ativo, cada um com seus próprios
  exercícios, sem mistura entre treinos do mesmo arquivo.

## Assumptions

- **Detecção automática pela mesma ação já existente**: não é introduzida nenhuma
  ação/botão novo para "importar múltiplos treinos" — a mesma ação "Importar treino"
  (RF01) passa a reconhecer automaticamente se o arquivo selecionado contém um treino
  único ou múltiplos treinos, com base no formato do elemento raiz do JSON (objeto vs.
  array), sem exigir nenhuma escolha explícita do usuário sobre isso.
- **Sem alteração ao schema de cada treino individual**: cada elemento do array segue
  exatamente o mesmo schema de treino já definido pelo RF01 (`nome` + `exercicios[]`)
  — esta feature não introduz nenhum campo novo em nível de treino ou de exercício.
- **Sem seleção parcial pelo usuário**: esta feature não introduz uma tela para o
  usuário escolher quais treinos, dentre os vários do arquivo, deseja importar — todos
  os treinos válidos do array são importados de uma vez (ver FR-003 sobre o que
  acontece quando um treino do array é inválido).
