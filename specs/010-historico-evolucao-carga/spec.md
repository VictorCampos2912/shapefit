# Feature Specification: Histórico de Evolução de Carga por Exercício

**Feature Branch**: `010-historico-evolucao-carga`

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "Baseado no PRD anexo (v1.1) e no criterios-aceite.md, criar a especificação do requisito RF08: tela de histórico de evolução de carga por exercício. Nova aba do app, reaproveitando a aba \"Explore\" já existente do template padrão do Expo (substituindo seu conteúdo boilerplate, mesmo padrão já usado no RF02 para a aba \"Home\"). A tela lê todas as sessões finalizadas (finalizadaEm !== null) do perfil ativo, em todos os treinos do perfil (não apenas um treino específico), e agrupa os registros por NOME do exercício — duas execuções de \"Supino reto\" vindas de treinos diferentes devem aparecer juntas na mesma evolução, já que exercicioId só é único dentro de um único treino/JSON importado, não globalmente. AJUSTE ARQUITETURAL NECESSÁRIO: como ExecucaoExercicio (dentro de SessaoTreino, RF04) só guarda exercicioId, não o nome do exercício, a construção dessa lista exige cruzar cada sessão com o Treino correspondente (via treinoId, já presente na sessão) para resolver o nome de cada exercicioId antes de agrupar. Defina explicitamente o tratamento de nomes com grafia diferente (espaços extras, maiúsculas/minúsculas). Exibição em lista simples (sem gráfico), ordenada da mais recente para a mais antiga, mostrando data, carga (kg) e reps de cada série registrada. Se o exercício nunca foi registrado, indicar isso claramente em vez de mostrar uma lista vazia sem explicação."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar a evolução de carga de um exercício (Priority: P1)

Como usuário que já finalizou um ou mais treinos, quero abrir a aba de histórico e ver,
para um exercício específico, a lista de todos os registros anteriores (data, carga em
kg e repetições de cada série), da mais recente para a mais antiga, para acompanhar se
estou progredindo naquele exercício ao longo do tempo.

**Why this priority**: É o valor central do RF08 — sem isso, não existe "histórico de
evolução" nenhum. Todas as outras histórias desta feature só fazem sentido em cima desta.

**Independent Test**: Com um perfil que tenha pelo menos duas sessões finalizadas
contendo o mesmo exercício, abrir a aba de histórico, selecionar esse exercício e
confirmar que todas as séries de ambas as sessões aparecem, ordenadas da mais recente
para a mais antiga, com data, carga e reps corretos.

**Acceptance Scenarios**:

1. **Given** o perfil ativo tem duas sessões finalizadas em dias diferentes, ambas
   contendo séries do exercício "Supino reto", **When** o usuário abre o histórico desse
   exercício, **Then** as séries das duas sessões aparecem juntas, ordenadas da sessão
   mais recente para a mais antiga, cada uma mostrando data, carga (kg) e reps.
2. **Given** uma sessão finalizada tem 4 séries registradas para um exercício, **When**
   o usuário consulta o histórico desse exercício, **Then** as 4 séries aparecem
   individualmente (não agregadas/resumidas em uma média).
3. **Given** existe uma sessão em andamento (ainda não finalizada) com séries já
   registradas para um exercício, **When** o usuário consulta o histórico desse
   exercício, **Then** nenhuma série dessa sessão em andamento aparece na lista.

---

### User Story 2 - Unificar o mesmo exercício vindo de treinos diferentes (Priority: P1)

Como usuário que importou mais de um treino (por exemplo, um treino A e um treino B, cada
um com seu próprio arquivo JSON), quero que execuções do exercício "Supino reto" feitas
dentro do treino A e execuções do mesmo exercício feitas dentro do treino B apareçam
juntas em uma única evolução, e não como dois históricos separados, já que na prática é o
mesmo exercício sendo acompanhado.

**Why this priority**: Sem esta unificação, o histórico perde grande parte do seu valor
para quem tem mais de um treino ativo — o identificador interno do exercício só é único
dentro do treino em que foi importado, então agrupar apenas por esse identificador
fragmentaria incorretamente a evolução de um mesmo exercício em várias listas
desconectadas.

**Independent Test**: Importar dois treinos distintos que contenham um exercício com o
mesmo nome, finalizar uma sessão de cada um registrando séries nesse exercício, abrir o
histórico desse exercício e confirmar que as séries de ambos os treinos aparecem juntas,
em uma única lista ordenada por data.

**Acceptance Scenarios**:

1. **Given** o treino A e o treino B têm, cada um, um exercício chamado "Supino reto"
   (identificadores internos distintos, pois vêm de arquivos JSON diferentes), **When**
   o usuário finaliza uma sessão de cada treino registrando séries nesse exercício,
   **Then** o histórico de "Supino reto" mostra as séries de ambas as sessões juntas,
   como uma única evolução.
2. **Given** o treino A tem um exercício "Supino Reto" (com espaço e maiúsculas assim) e
   o treino B tem um exercício "supino  reto" (com espaço duplo e minúsculas), **When**
   o usuário consulta o histórico, **Then** os registros de ambos aparecem no mesmo
   grupo/evolução, tratados como o mesmo exercício.
3. **Given** o treino A tem "Rosca direta" e o treino B tem "Rosca direta com barra",
   **When** o usuário consulta o histórico, **Then** os dois aparecem como evoluções
   **separadas** — nomes diferentes, mesmo que parecidos, nunca são unificados
   automaticamente.

---

### User Story 3 - Indicação clara quando um exercício nunca foi registrado (Priority: P2)

Como usuário consultando o histórico de um exercício que faz parte de um treino
importado mas que eu nunca cheguei a executar (nenhuma sessão finalizada contém esse
exercício), quero ver uma mensagem explícita dizendo que não há registros ainda, para não
confundir "nunca fiz esse exercício" com "o app não está mostrando meus dados".

**Why this priority**: Importante para a clareza da experiência, mas não bloqueia o valor
central (consultar exercícios que já têm histórico) — por isso prioridade P2, abaixo das
duas histórias de consulta/agrupamento.

**Independent Test**: Com um perfil que tenha um treino importado mas nenhuma sessão
finalizada, ou com sessões finalizadas que não contêm um exercício específico do treino,
abrir o histórico desse exercício e confirmar que aparece uma mensagem clara de "sem
registros", nunca uma lista vazia sem explicação.

**Acceptance Scenarios**:

1. **Given** o perfil ativo não tem nenhuma sessão finalizada, **When** o usuário abre a
   aba de histórico, **Then** o app indica claramente que ainda não há registros, em vez
   de mostrar uma tela vazia sem contexto.
2. **Given** o perfil ativo tem sessões finalizadas, mas nenhuma delas contém séries de
   um exercício específico (ex.: um exercício de um treino que nunca foi executado),
   **When** o usuário consulta o histórico desse exercício, **Then** o app indica
   claramente que esse exercício ainda não tem registros.

---

### User Story 4 - Histórico restrito e atualizado pelo perfil ativo (Priority: P2)

Como usuário que compartilha o app com outras pessoas usando perfis diferentes no mesmo
aparelho, quero que o histórico exibido mostre apenas os registros do perfil
atualmente ativo, e que essa exibição se atualize imediatamente se eu trocar de perfil,
para nunca ver ou confundir a evolução de carga de outra pessoa com a minha.

**Why this priority**: Consistente com o mesmo requisito de segregação por perfil já
aplicado a RF01, RF02 e RF07 — importante para a integridade dos dados exibidos, mas
depende logicamente das histórias 1 e 2 já existirem (não há o que segregar por perfil
sem histórico funcionando).

**Independent Test**: Com dois perfis distintos, cada um com sessões finalizadas do mesmo
exercício com valores diferentes, abrir o histórico desse exercício com o perfil 1 ativo,
trocar para o perfil 2 e confirmar que a lista exibida passa a mostrar exclusivamente os
registros do perfil 2.

**Acceptance Scenarios**:

1. **Given** o perfil 1 e o perfil 2 têm, cada um, sessões finalizadas do mesmo
   exercício, **When** o usuário consulta o histórico desse exercício com o perfil 1
   ativo, **Then** apenas os registros do perfil 1 aparecem.
2. **Given** o usuário está vendo o histórico do perfil 1, **When** ele troca o perfil
   ativo para o perfil 2, **Then** a tela de histórico passa a refletir imediatamente
   apenas os dados do perfil 2, sem nenhum registro residual do perfil 1.

---

### Edge Cases

- Um exercício existe em um treino importado, mas nenhuma sessão finalizada nesse ou em
  qualquer outro treino do perfil jamais registrou séries dele → tratado pela User Story
  3 (mensagem explícita de "sem registros", nunca lista vazia sem contexto).
- Duas sessões finalizadas de treinos diferentes têm exercícios cujo nome é idêntico após
  remover espaços extras nas pontas e ignorar diferença de maiúsculas/minúsculas (ex.:
  "Supino Reto " vs. "supino reto") → tratados como o mesmo exercício, registros
  unificados na mesma evolução (ver User Story 2, Assumptions).
- Duas sessões têm exercícios com nomes visivelmente parecidos mas não idênticos após essa
  normalização (ex.: "Rosca direta" vs. "Rosca direta com barra", ou nomes com acentuação
  diferente, ex.: "Triceps" vs. "Tríceps") → tratados como exercícios distintos, cada um
  com sua própria evolução; o sistema nunca tenta adivinhar semelhança além da
  normalização definida.
- Perfil ativo sem nenhum treino importado e sem nenhuma sessão finalizada → a aba de
  histórico indica claramente que não há dados ainda, em vez de lista vazia sem contexto.
- Uma sessão está marcada como finalizada, mas o treino ao qual ela pertence não pôde ser
  localizado, ou o identificador de um exercício registrado não corresponde a nenhum
  exercício desse treino (situação que não deveria ocorrer no fluxo normal do app, já que
  nenhum requisito implementado até aqui permite excluir um treino depois de importado) →
  esses registros específicos são omitidos *da interface* (não silenciosamente do ponto
  de vista de desenvolvimento — ver FR-014), sem quebrar a exibição do restante do
  histórico.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE oferecer uma aba própria de navegação, sempre acessível a
  partir de qualquer tela principal do app, dedicada ao histórico de evolução de
  exercícios.
- **FR-002**: O sistema DEVE considerar, para compor o histórico, todas as sessões de
  treino do perfil ativo marcadas como finalizadas, de todos os treinos desse perfil —
  não apenas de um treino específico.
- **FR-003**: O sistema DEVE excluir do histórico qualquer sessão que ainda esteja em
  andamento (não finalizada).
- **FR-004**: O sistema DEVE determinar o nome de cada exercício executado cruzando cada
  execução registrada em uma sessão com o treino ao qual essa sessão pertence, para
  resolver o nome correspondente ao identificador de exercício armazenado — já que esse
  identificador, por si só, não é garantidamente único entre treinos diferentes.
- **FR-005**: O sistema DEVE agrupar os registros de séries pelo nome do exercício
  resolvido (FR-004), de forma que execuções do mesmo exercício vindas de treinos
  diferentes apareçam juntas na mesma evolução.
- **FR-006**: Ao comparar nomes de exercícios para fins de agrupamento (FR-005), o
  sistema DEVE tratar como o mesmo exercício nomes que só diferem por espaços extras no
  início, no fim ou entre palavras, ou por diferença entre maiúsculas e minúsculas.
  Nomes que diferem em qualquer outro aspecto (palavras adicionais, ortografia,
  acentuação) DEVE ser tratados como exercícios distintos, cada um com sua própria
  evolução.
- **FR-007**: O sistema DEVE exibir, para cada exercício, os registros de série em uma
  lista simples (sem representação gráfica), ordenada da sessão mais recente para a mais
  antiga.
- **FR-008**: Cada item da lista DEVE mostrar, no mínimo, a data da sessão, a carga (kg)
  e as repetições daquela série específica — sem agregar ou resumir múltiplas séries em
  um único valor.
- **FR-009**: Quando um exercício nunca teve nenhuma série registrada em nenhuma sessão
  finalizada do perfil ativo, o sistema DEVE indicar isso de forma explícita e
  compreensível, em vez de exibir uma lista vazia sem explicação.
- **FR-010**: Quando o perfil ativo não possui nenhuma sessão finalizada, o sistema DEVE
  indicar isso de forma explícita na tela de histórico, em vez de exibir uma lista vazia
  sem explicação.
- **FR-011**: O sistema DEVE exibir apenas registros pertencentes ao perfil ativo no
  momento da consulta.
- **FR-012**: Ao trocar de perfil ativo, o sistema DEVE atualizar o histórico exibido
  imediatamente para refletir exclusivamente os dados do novo perfil ativo, sem manter
  nenhum registro do perfil anterior visível.
- **FR-013**: Caso um registro de sessão finalizada não possa ter seu treino ou exercício
  de origem resolvido (dado inconsistente), o sistema DEVE omitir apenas esse registro
  específico do histórico, sem impedir a exibição dos demais registros válidos.
- **FR-014**: Toda vez que a omissão descrita em FR-013 ocorrer, o sistema DEVE registrar
  um diagnóstico de desenvolvimento (não visível ao usuário final) identificando o
  registro omitido, para que essa situação — que não deveria ocorrer no fluxo normal do
  app — seja perceptível durante testes manuais e não passe despercebida silenciosamente.

### Key Entities *(include if feature involves data)*

- **Registro de histórico**: representação, na tela de histórico, de uma série
  específica já executada — composta pelo nome do exercício (resolvido a partir do
  treino de origem da sessão), a data da sessão a que pertence, a carga (kg) e as
  repetições daquela série. Derivado a partir das sessões de treino finalizadas
  existentes (RF07) e dos treinos importados existentes (RF01/RF02); esta feature não
  introduz um novo local de armazenamento — apenas uma forma de ler e apresentar dados já
  persistidos por outros requisitos.
- **Evolução por exercício**: agrupamento de todos os registros de histórico (acima) que
  compartilham o mesmo nome de exercício (após a normalização descrita em FR-006),
  ordenados da sessão mais recente para a mais antiga.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A partir de qualquer tela principal do app, o usuário chega à lista de
  evolução de um exercício específico em no máximo dois toques.
- **SC-002**: 100% das séries de sessões finalizadas do perfil ativo aparecem no
  histórico do exercício correspondente, incluindo os casos em que o mesmo exercício foi
  executado em treinos diferentes com pequenas variações de grafia (espaços extras,
  maiúsculas/minúsculas).
- **SC-003**: Nenhuma série de uma sessão em andamento (não finalizada) aparece no
  histórico, em 100% dos casos verificados.
- **SC-004**: Após trocar de perfil ativo, 100% dos registros exibidos no histórico
  pertencem ao novo perfil ativo, sem nenhum registro residual do perfil anterior.
- **SC-005**: Ao consultar um exercício sem nenhum registro anterior, o usuário
  reconhece em poucos segundos, sem ambiguidade, que não há dados — nunca interpreta a
  tela como um erro ou como uma lista vazia sem explicação.

## Assumptions

- **Sem gráfico no MVP**: conforme decisão já registrada no PRD v1.1 e no
  `criterios-aceite.md`, a exibição é uma lista simples de valores por data — nenhuma
  visualização gráfica faz parte deste requisito.
- **Regra de normalização de nomes (FR-006)**: dois nomes de exercício são tratados como
  o mesmo exercício quando, após remover espaços no início/fim, colapsar múltiplos
  espaços internos em um único espaço, e ignorar diferença entre maiúsculas e minúsculas,
  resultam no mesmo texto. Acentuação, pontuação e palavras adicionais/faltantes **não**
  são normalizadas — nomes que diferem nesses aspectos são tratados como exercícios
  distintos. Esta é a interpretação mais segura para o MVP: unifica os casos de
  divergência acidental de digitação mencionados explicitamente no pedido deste
  requisito, sem correr o risco de fundir exercícios que só parecem semelhantes.
- **Grafia exibida do grupo**: quando um mesmo exercício (após normalização) tem nomes
  digitados de formas diferentes entre treinos, a tela exibe a grafia do registro mais
  recente daquele grupo como título da evolução — não uma lista de variantes nem a
  primeira grafia encontrada.
- **Navegação — reaproveitamento da aba já existente do template Expo**: esta feature
  substitui integralmente o conteúdo de exemplo da segunda aba do template Expo (a rota
  `explore.tsx`) pelo histórico de evolução — não é criada uma aba nova além das duas já
  existentes. **Correção pós-validação manual (ver research.md, Decisão 13)**:
  o rótulo dessa aba, exibido ao usuário, passa de "Explore" para "Histórico" — o
  boilerplate original do template Expo rotulava as duas abas como "Home" e "Explore",
  e a primeira suposição desta spec era manter "Explore" inalterado, citando como
  precedente o fato de o RF02 não ter renomeado "Home" ao substituir seu conteúdo. Essa
  suposição estava equivocada: o RF02 nunca tomou essa decisão explicitamente (sua
  spec/research não menciona rótulo de aba), então não havia de fato um "padrão já
  usado" a seguir — apenas um rótulo nunca revisitado. Corrigido nesta feature: os dois
  rótulos passam a refletir o conteúdo real de cada aba ("Treinos" e "Histórico").
- **Treinos não são excluídos nesta versão do app**: nenhum requisito implementado até
  aqui (RF01–RF10) permite remover um treino já importado, então a resolução de nome de
  exercício via treino de origem (FR-004) encontra o treino correspondente em todos os
  casos do fluxo normal de uso; a omissão descrita em FR-013 é uma proteção defensiva
  contra dados inconsistentes, não um caminho esperado de uso.
- **Sem edição nesta feature**: esta especificação cobre apenas a exibição do histórico.
  A edição de um registro de uma sessão já finalizada, a partir desta mesma tela, é
  escopo do RF09b (requisito separado, que depende deste RF08 já existir).
- **Sem paginação definida**: o MVP exibe a lista completa de registros de cada
  exercício, sem limite de itens ou paginação — volume esperado de uso pessoal (um único
  usuário, ao longo de semanas/meses) não justifica essa complexidade nesta fase.
- **Mecanismo do diagnóstico de desenvolvimento (FR-014)**: o mecanismo exato fica a
  cargo do `/speckit.plan`, mas a expectativa registrada aqui é a de um log simples de
  console (ex.: `console.warn`), sem UI própria e sem persistência — apenas uma forma de
  o comportamento defensivo de FR-013 não passar despercebido durante o desenvolvimento
  e a validação manual.
