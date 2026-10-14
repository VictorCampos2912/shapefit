# Feature Specification: Observação por Exercício e Imagem para Exercício Composto (Bi-set)

**Feature Branch**: `023-observacao-e-imagens-bi-set`

**Created**: 2026-10-08

**Status**: Implemented — validado em Android em 2026-10-14 (Princípio III,
incluindo a paridade visual, Cenário 7 do `quickstart.md`, reverificada por
comparação pixel a pixel com as capturas de referência de T000); iOS pendente
por falta de conta Apple Developer (mesma situação da spec 022)

**Requisito**: RF21 (PRD, seção 6 — número confirmado em 2026-10-13 ao registrar;
estende RF01/RF11, importação, e RF03/RF04, execução, com o campo `observacao`;
emenda o FR-003 da spec `021-imagens-exercicios`, RF20, para buscar imagem de
exercícios compostos, bi-set)

**Nota**: Duas melhorias pequenas e relacionadas, motivadas pela conversão de um
treino real em PDF (5 treinos, 31 exercícios) para o formato de importação já
existente (RF01/RF11). O PDF original não é commitado no repositório (contém nome de
pessoa).

**Input**: User description: "Duas melhorias pequenas e relacionadas: 1) Campo
opcional `observacao` (string) em cada exercício do JSON de importação, para dicas de
execução hoje sem lugar (pausa no fundo, descida controlada, redução na última série,
definição de bi-set); exibido na tela de execução, em destaque secundário, antes de
'Iniciar exercício' e durante as séries; nunca na lista de exercícios nem no
histórico; omitido do documento Firestore quando ausente, nunca gravado como
undefined; texto longo não pode empurrar os campos de registro/'Concluir série' para
fora do alcance. 2) Para exercícios compostos no padrão 'A + B (Bi-set)' (que hoje
nunca casam no catálogo da spec 021 por exigirem igualdade exata do nome inteiro):
tentar o nome inteiro primeiro, e se não casar e o nome contiver ' + ', remover o
sufixo ' (Bi-set)', separar em ' + ', normalizar cada parte com a função do RF08 e
buscar cada parte por igualdade exata no catálogo; exibir a imagem de cada parte
encontrada (no máximo duas), legendada com o nome da parte; sem aproximação de nomes
em nenhum caso. Emendar o FR-003 da spec 021 com essa extensão, sem reescrever o
resto. Assunção aceita: bi-set é um único exercício com um par carga/reps por série;
o histórico trata o nome composto como exercício próprio. Não implementar código,
apenas descrever o comportamento esperado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver a dica de execução do exercício (Priority: P1)

O usuário importa um treino cujos exercícios têm instruções de execução que hoje não
têm onde ficar no arquivo ("pausa de 2s no fundo", "descida controlada de 5-8s",
"última série: reduzir ~30%"). Ao abrir esse exercício na tela de execução, ele quer
ver esse texto para lembrar como executar o movimento corretamente, sem depender de
memória ou de anotações fora do app.

**Why this priority**: é o problema relatado — a conversão de um treino real em PDF
expôs instruções de execução que o formato de importação atual não tem onde guardar.

**Independent Test**: Importar um treino com `observacao` preenchida em um exercício,
abrir esse exercício na tela de execução e confirmar que o texto aparece antes do
botão "Iniciar exercício" e continua visível durante o registro das séries, em
destaque secundário (nunca como o elemento principal da tela).

**Acceptance Scenarios**:

1. **Given** um exercício importado com `observacao` igual a um texto não vazio,
   **When** o usuário abre esse exercício na tela de execução antes de iniciar,
   **Then** o texto da observação é exibido em destaque secundário, antes do botão
   "Iniciar exercício".
2. **Given** o mesmo exercício do cenário anterior, **When** o usuário já iniciou o
   exercício e está registrando uma série, **Then** o texto da observação continua
   visível na tela, em destaque secundário.
3. **Given** um exercício com `observacao` preenchida, **When** o usuário olha a
   lista de exercícios do treino ou a tela de histórico de evolução (RF08), **Then**
   a observação não aparece em nenhuma dessas duas telas — exclusiva da execução.

---

### User Story 2 - Importar treino sem observação, sem nenhuma mudança (Priority: P1)

O usuário importa um arquivo de treino que não usa o campo `observacao` (todo arquivo
já existente hoje, ou um exercício específico sem essa dica). Ele espera que nada
mude: nenhum espaço vazio, nenhum texto de preenchimento, e o treino continua
aparecendo normalmente na lista — inclusive depois de fechar e reabrir o app.

**Why this priority**: mesma prioridade da US1 — compatibilidade total com todo
arquivo existente é inegociável (precedente do RF17 e da spec 021, princípio do
silêncio), e a garantia de que o treino persiste de fato é crítica dado que a
gravação no Firestore é assíncrona e sem espera (fire-and-forget).

**Independent Test**: Importar, no mesmo arquivo, um treino com um exercício com
`observacao` e outro sem; abrir o exercício sem observação na execução e confirmar
que nenhum espaço reservado ou placeholder aparece; confirmar que ambos os treinos
(com e sem observação em algum exercício) aparecem na lista de treinos logo após a
importação e continuam lá depois de fechar e reabrir o app.

**Acceptance Scenarios**:

1. **Given** um exercício sem o campo `observacao`, ou com `observacao` igual a
   `null`, uma string vazia, ou só espaços, **When** o usuário abre esse exercício na
   execução, **Then** a tela se comporta de forma idêntica à anterior a esta
   feature — nenhum espaço reservado, nenhum placeholder.
2. **Given** um exercício com o campo `observacao` presente mas que não é uma string
   nem `null` (ex.: número, booleano, lista, objeto), **When** o treino é importado,
   **Then** esse exercício específico é descartado da importação com o motivo
   indicado ao usuário, e o restante do treino (demais exercícios) é importado
   normalmente — mesmo tratamento já usado para o campo `categoria` inválido (RF17,
   FR-003).
3. **Given** um treino com um exercício com `observacao` e outro sem, **When** a
   importação é concluída, **Then** o treino aparece na lista de treinos
   imediatamente.
4. **Given** o treino do cenário anterior já importado, **When** o usuário fecha o
   app completamente e o reabre, **Then** o treino continua aparecendo na lista, com
   a observação preservada no exercício que a tinha e ausente no que não tinha.

---

### User Story 3 - Observação longa não esconde o registro da série (Priority: P2)

O usuário tem um exercício com uma observação longa (várias linhas de texto, como a
descrição completa de um bi-set). Ao abrir esse exercício em um aparelho de tela
pequena, ele ainda precisa conseguir ver e tocar os campos de registro da série e o
botão "Concluir série" — o texto da observação não pode "empurrar" esses elementos
para fora da tela.

**Why this priority**: risco concreto de regressão de usabilidade identificado a
partir de um caso real (texto de observação com centenas de caracteres); menor
prioridade que US1/US2 porque só se manifesta com textos mais longos que a média.

**Independent Test**: Importar um exercício com uma `observacao` de várias centenas
de caracteres, abrir esse exercício em uma tela pequena durante o registro de uma
série, e confirmar que os campos de registro e o botão "Concluir série" permanecem
visíveis e alcançáveis (por rolagem, truncamento, ou outro mecanismo), nunca
inacessíveis.

**Acceptance Scenarios**:

1. **Given** um exercício com uma `observacao` de texto longo (centenas de
   caracteres), **When** o usuário o abre em uma tela pequena, **Then** os campos de
   registro da série (carga/reps ou equivalente da categoria do exercício, RF17) e o
   botão "Concluir série" continuam alcançáveis pelo usuário.
2. **Given** o mesmo exercício, **When** o usuário está durante o descanso entre
   séries, **Then** o texto da observação continua em destaque secundário, sem
   interferir na visibilidade do cronômetro de descanso (RF05/RF06).

---

### User Story 4 - Ver a imagem de um exercício composto (bi-set) (Priority: P2)

O usuário executa um exercício importado com nome no padrão "Supino reto + Crucifixo
(Bi-set)". Hoje (spec 021) esse nome nunca casa com o catálogo, porque a busca exige
igualdade exata do nome inteiro. Ele quer ver a imagem de referência de cada
movimento que compõe o bi-set, mesmo sem o catálogo ter um item com o nome composto
exato.

**Why this priority**: valor real identificado no treino convertido do PDF (vários
exercícios no padrão bi-set); menor prioridade que as observações porque é uma
melhoria de exibição de imagem já opcional (spec 021 também não bloqueia nada quando
não há correspondência).

**Independent Test**: Importar um exercício com nome "A + B (Bi-set)" cujas partes
"A" e "B", depois de normalizadas, correspondem exatamente a dois itens do catálogo
(spec 020); abrir esse exercício na execução e confirmar que as duas imagens
aparecem, cada uma legendada com o nome da parte correspondente.

**Acceptance Scenarios**:

1. **Given** um exercício com nome "A + B (Bi-set)" sem correspondência exata para o
   nome inteiro no catálogo, mas cujas partes "A" e "B" (normalizadas) correspondem
   cada uma a um exercício do catálogo, **When** o usuário abre esse exercício na
   execução, **Then** as duas imagens do catálogo são exibidas, cada uma legendada
   com o nome da parte a que corresponde.
2. **Given** um exercício com nome "A + B" (sem o sufixo "(Bi-set)") nas mesmas
   condições do cenário anterior, **When** o usuário abre esse exercício, **Then** o
   comportamento é o mesmo — o sufixo "(Bi-set)" é opcional para a separação em
   partes.
3. **Given** um exercício com nome "A + B (Bi-set)" em que só a parte "A" corresponde
   a um exercício do catálogo, **When** o usuário abre esse exercício, **Then**
   apenas a imagem de "A" é exibida, legendada com o nome de "A"; nada é exibido no
   lugar de "B".

---

### User Story 5 - Nome composto sem nenhuma correspondência continua sem imagem (Priority: P3)

O usuário executa um exercício com nome composto cujas partes não correspondem a
nenhum item do catálogo, ou um exercício cujo nome não segue o padrão de nome
composto. Ele não deve ver nenhuma imagem incorreta nem espaço reservado vazio — a
tela deve se comportar exatamente como hoje (spec 021).

**Why this priority**: garante que a extensão não introduz nenhum efeito colateral
nos casos sem correspondência, que já tinham um comportamento definido e validado
pela spec 021.

**Independent Test**: Abrir, na execução, um exercício de nome composto cujas duas
partes não correspondem a nenhum item do catálogo, e confirmar que nenhuma imagem é
exibida — mesmo comportamento de "sem correspondência" já existente.

**Acceptance Scenarios**:

1. **Given** um exercício com nome "A + B (Bi-set)" em que nenhuma das partes
   corresponde a um exercício do catálogo, **When** o usuário abre esse exercício,
   **Then** nenhuma imagem é exibida — comportamento idêntico ao de um exercício sem
   correspondência hoje (spec 021).
2. **Given** um exercício cujo nome não contém " + " (não é um nome composto),
   **When** a busca pelo nome inteiro não encontra correspondência, **Then** o
   sistema não tenta nenhuma separação em partes — comportamento idêntico ao
   existente antes desta feature (spec 021, sem alteração).
3. **Given** um exercício com nome composto que casa por igualdade exata do nome
   **inteiro** no catálogo (ex.: o catálogo passou a ter, por coincidência, um item
   cadastrado com esse nome composto exato), **When** o usuário abre esse exercício,
   **Then** a imagem desse item é exibida diretamente — a separação em partes só é
   tentada quando o nome inteiro não encontra correspondência.

---

### Edge Cases

- `observacao` contém apenas espaços (ex.: `"   "`) → tratado como ausente após
  remover espaços das extremidades (trim); comportamento idêntico a não ter o campo.
- `observacao` é explicitamente `null` (em vez de ausente do objeto) → tratado da
  mesma forma que ausente, nunca como erro de tipo — comum em geradores de JSON que
  preenchem campos opcionais sem valor como `null` em vez de omiti-los.
- Um exercício tem `observacao` válida (string não vazia) **e** nome no padrão bi-set
  com imagens encontradas → as duas melhorias coexistem de forma independente no
  mesmo exercício, sem nenhuma interação entre elas.
- O nome do exercício, depois de remover o sufixo "(Bi-set)" e separar por " + ",
  produz mais de duas partes (ex.: "A + B + C") → cada parte ainda é buscada
  individualmente no catálogo, mas no máximo duas imagens são exibidas.
- As duas partes de um nome composto, depois de normalizadas, são iguais entre si
  (ex.: "Rosca direta + Rosca direta (Bi-set)") e ambas correspondem ao mesmo item do
  catálogo → a mesma imagem é exibida duas vezes, cada uma com sua própria legenda —
  não há deduplicação, já que são duas partes do nome tratadas de forma independente.
- O catálogo (spec 020) está vazio ou ainda não implementado → nenhuma imagem é
  exibida, nem para o nome inteiro nem para nenhuma parte — mesmo comportamento de
  "sem correspondência" (spec 021).
- Um exercício importado antes desta feature (sem o campo `observacao` no documento
  já salvo no Firestore) é aberto na execução depois da atualização do app → tratado
  como sem observação, sem exigir reimportação (mesmo princípio de compatibilidade já
  usado no RF17 para o campo `categoria`).

## Requirements *(mandatory)*

### Functional Requirements

**Observação por exercício**

- **FR-001**: O schema de importação de treino (RF01/RF11) DEVE aceitar um campo
  opcional `observacao` (string) em cada exercício.
- **FR-002**: Quando `observacao` estiver ausente, for `null`, ou presente como uma
  string vazia ou composta só de espaços (depois de remover espaços das
  extremidades), o exercício DEVE ser tratado como sem observação — nenhum arquivo ou
  treino já importado hoje muda de comportamento por causa desta feature.
- **FR-003**: Quando `observacao` estiver presente com um valor que não é do tipo
  string nem `null` (ex.: número, booleano, lista, objeto), esse exercício específico
  DEVE ser tratado como inválido e descartado da importação, com o motivo indicado ao
  usuário, sem afetar os demais exercícios do mesmo treino nem invalidar o treino
  inteiro — mesmo tratamento já usado hoje para o campo `categoria` inválido (RF17,
  FR-003).
- **FR-004**: Na tela de execução do exercício (RF03/RF04), quando houver uma
  observação (FR-001, não vazia por FR-002), o texto DEVE ser exibido em destaque
  secundário (visualmente subordinado ao conteúdo principal da tela) em dois
  momentos: antes do botão "Iniciar exercício" e durante o registro das séries.
- **FR-005**: Quando não houver observação (FR-002), a tela de execução NÃO DEVE
  reservar nenhum espaço vazio nem exibir qualquer texto de preenchimento no lugar da
  observação — comportamento idêntico ao existente hoje.
- **FR-006**: A observação NÃO DEVE aparecer na lista de exercícios do treino nem na
  tela de histórico de evolução por exercício (RF08) — exclusiva da tela de execução.
- **FR-007**: Independentemente do tamanho do texto da observação, os campos de
  registro da série (carga/reps, ou o campo equivalente da categoria do exercício,
  RF17) e o botão "Concluir série" DEVEM permanecer visíveis e alcançáveis pelo
  usuário na tela de execução, em qualquer tamanho de tela suportado (RNF01) — a
  observação nunca pode tornar esses elementos inacessíveis.
- **FR-008**: Quando um exercício tiver observação (FR-001), ela DEVE fazer parte do
  treino persistido no Firestore (`users/{uid}/treinos`, RF01/RF11, spec 022); quando
  o exercício não tiver observação (FR-002), a chave `observacao` DEVE ser omitida
  do documento gravado — nunca gravada com valor `undefined`, `null` ou string vazia.
- **FR-009**: A validação desta feature DEVE confirmar, para um treino importado com
  exercícios com e sem observação, que ele aparece na lista de treinos imediatamente
  após a importação e continua aparecendo depois de o app ser fechado e reaberto —
  cobrindo o risco de a gravação no Firestore (assíncrona, sem espera) falhar
  silenciosamente enquanto a tela já indicou sucesso na importação.

**Imagem para exercício composto (bi-set)**

- **FR-010**: Esta FR amplia o FR-003 da spec `021-imagens-exercicios` (RF20, busca de
  imagem por nome exato no catálogo). Quando a busca pelo nome **inteiro** do
  exercício (FR-001-FR-003 da spec 021) não encontrar correspondência, e o nome do
  exercício contiver o separador " + ", o sistema DEVE: (a) remover um sufixo " (Bi-
  set)" do final do nome, se presente, ignorando diferença entre maiúsculas e
  minúsculas e espaços no final do nome (ex.: "A + B (BI-SET)" ou "A + B (Bi-set) "
  também têm o sufixo removido) — continua sendo só remoção literal desse sufixo, sem
  nenhuma outra tolerância (nenhuma variação de pontuação, hífen/espaço interno ao
  sufixo, ou abreviação é reconhecida); (b) separar o restante do nome em partes
  usando " + " como delimitador; (c) normalizar cada parte com a mesma função de
  normalização já usada pelo RF08 (FR-002 da spec 021); (d) buscar cada parte,
  individualmente, por igualdade exata no catálogo — sem nenhuma forma de
  aproximação, igual à regra já existente no FR-003 original da spec 021, que
  permanece válida tanto para a busca do nome inteiro quanto para a busca de cada
  parte extraída.
- **FR-011**: Para cada parte do nome composto que encontrar correspondência exata no
  catálogo (FR-010), a tela de execução DEVE exibir a imagem correspondente,
  legendada com o nome (`nome`) do item do catálogo correspondente — não com o texto
  normalizado usado para a busca — no máximo duas imagens exibidas, mesmo quando o
  nome tiver mais de duas partes.
- **FR-012**: Uma parte do nome composto sem correspondência exata no catálogo NÃO
  DEVE exibir nenhuma imagem nem placeholder para essa parte especificamente — apenas
  as partes com correspondência aparecem.
- **FR-013**: Quando nenhuma parte do nome composto tiver correspondência, ou quando
  o nome do exercício não contiver " + ", a tela de execução DEVE se comportar
  exatamente como hoje (spec 021) — nenhuma imagem, nenhuma UI adicional relacionada
  ao catálogo.
- **FR-014**: Esta extensão NÃO introduz nenhuma forma de correspondência aproximada,
  nem para o nome inteiro nem para cada parte extraída — qualquer parte que não bater
  exatamente, após a normalização do FR-010(c), simplesmente não encontra
  correspondência (mesma garantia do FR-003 original da spec 021).

### Key Entities

- **ExercicioPlanejado** (já existe, RF01/RF11): ganha um atributo novo e opcional,
  `observacao` (string), presente apenas quando informada no arquivo importado e não
  vazia após remoção de espaços — ausente em todo exercício que não a usa, inclusive
  os já importados antes desta feature.
- **Treino persistido** (já existe, Firestore `users/{uid}/treinos`, spec 022): cada
  item de `exercicios` segue a mesma regra — a chave `observacao` só existe no
  documento quando o exercício tem uma observação válida.
- **Correspondência de nome composto** (nova, não persistida): resultado em tempo de
  exibição da separação de um nome de exercício em até duas partes e da busca exata
  de cada parte no catálogo (spec 020) — recalculado a cada abertura do exercício na
  execução, sem cache, mesmo princípio já adotado pela correspondência de nome
  inteiro (spec 021, Key Entities).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos exercícios importados com uma `observacao` válida, o texto
  aparece na tela de execução antes de "Iniciar exercício" e continua visível durante
  o registro das séries.
- **SC-002**: Em 100% dos exercícios sem observação válida, a tela de execução
  permanece idêntica à versão anterior a esta feature — nenhum espaço reservado,
  nenhum texto de preenchimento.
- **SC-003**: Em 100% das aberturas de um exercício, independentemente do tamanho do
  texto de observação, os campos de registro da série e o botão "Concluir série"
  permanecem visíveis e alcançáveis.
- **SC-004**: Em 100% dos treinos importados com exercícios com e sem observação, o
  treino aparece na lista de treinos imediatamente após a importação e continua
  aparecendo depois de o app ser fechado e reaberto.
- **SC-005**: Em 100% dos exercícios com nome no padrão "A + B (Bi-set)" cujas duas
  partes têm correspondência exata no catálogo, ambas as imagens aparecem, cada uma
  legendada com o nome do item do catálogo correspondente.
- **SC-006**: Em 100% dos exercícios de nome composto sem nenhuma parte com
  correspondência, ou cujo nome inteiro já casa diretamente, a tela se comporta de
  forma idêntica ao definido pela spec 021 — nenhuma imagem incorreta, nenhuma UI
  adicional.

## Assumptions

- **A emenda ao FR-003 da spec 021 precisa ser registrada no próprio arquivo da spec
  021**: `specs/021-imagens-exercicios/spec.md` DEVE receber uma nota de emenda junto
  ao seu FR-003 (não uma reescrita do resto dessa spec), referenciando esta spec
  (`023-observacao-e-imagens-bi-set`) como origem da extensão de busca por partes de
  nome composto. Sem essa nota, as duas specs ficam contraditórias entre si (a 021
  continuaria descrevendo só a busca pelo nome inteiro, enquanto esta spec já assume
  a busca por partes). Tratar como task explícita em `/speckit-tasks`, não como
  decorrência implícita das tasks de implementação desta feature.
- **Bi-set é um único exercício, com um único par carga/reps por série (limitação
  aceita nesta rodada)**: o usuário registra os números da parte principal do bi-set
  e descreve o restante na observação (ex.: "última série: reduzir ~30% na segunda
  parte"); esta feature não modela dois registros por série para um exercício
  composto. O histórico por exercício (RF08) trata o nome composto como um exercício
  próprio, separado dos exercícios que representam cada parte isoladamente.
- **Número de RF confirmado no registro**: seguindo o mesmo cuidado já adotado pela
  spec `022-autenticacao-google-firestore-treinos` (número de RF não presumido antes
  de fechar), esta feature ficou com **RF21** — confirmado em 2026-10-13 ao conferir a
  tabela da seção 6 do PRD no momento do registro (a spec 022, embora criada antes
  desta, ainda não tinha registrado o dela nesse momento).
- **Nenhuma dependência nova**: ambas as melhorias são implementáveis com as
  bibliotecas já presentes no projeto (Constitution v2.0.0, Princípio II).
- **Validação em dois aparelhos, com iOS pendente**: mesma situação já registrada
  pela spec 022 — validação completa depende de Android e iOS (Princípio III), e o
  iOS continua bloqueado pela falta de conta Apple Developer paga (Sign in with Apple
  fora de escopo, seção 13 do PRD).
- **Mecanismo de rolagem/truncamento não especificado**: o FR-007 define o resultado
  exigido (campos de registro e botão sempre alcançáveis), não a técnica usada para
  chegar lá (rolagem, truncamento do texto, recolhimento/expansão, ou outra) — essa
  escolha é de implementação, fora do escopo desta especificação de comportamento.
- **Busca de partes reaproveita a infraestrutura existente**: a normalização de cada
  parte do nome composto usa a mesma função já usada pelo RF08 e pela spec 021
  (`normalizarNomeExercicio`), sem nenhuma regra de normalização nova ou diferente.
- **Fora de escopo** (herdado do pedido original): categorias de unidade em
  segundos/metros, curadoria de novas imagens do catálogo, importação de PDF dentro
  do app, qualquer mudança nas regras de segurança do Firestore, e Sign in with
  Apple.
