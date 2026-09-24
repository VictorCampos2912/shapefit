# Feature Specification: "Finalizado em" na Lista de Treinos

**Feature Branch**: `016-finalizado-em`

**Created**: 2026-09-23

**Status**: Draft

**Requisito**: RF15 (PRD, seção 6 — pós-MVP, a confirmar numeração ao registrar no PRD)

**Nota**: Melhoria pós-desenvolvimento — não fazia parte do escopo original do MVP.
Pedido concreto registrado durante os testes de campo do RF11-RF14, para facilitar
saber quando cada treino foi feito pela última vez e evitar repeti-lo na mesma semana.

**Input**: User description: "Na lista de treinos (RF02), substituir o texto
'Importado em: <data>' por 'Finalizado em: <data da sessão finalizada mais recente
deste treino>' — se o treino nunca foi executado (0 sessões finalizadas), exibir
'Nunca treinado' em vez de uma data. A informação de data de importação (importadoEm)
deixa de aparecer na lista e passa a ficar visível dentro da tela do treino (lista de
exercícios, RF03/RF04), como informação secundária. Atenção: hoje, quando dois treinos
têm o mesmo nome, a lista os diferencia mostrando a data de importação junto ao nome —
como essa data sai da lista, é preciso uma nova forma de diferenciar treinos homônimos,
incluindo o caso de dois treinos homônimos nunca executados."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Saber quando cada treino foi feito pela última vez (Priority: P1)

O usuário abre a tela "Meus Treinos" para decidir qual treino fazer hoje. Ele quer ver,
de relance, quando executou cada treino pela última vez, para não repetir um treino já
feito na mesma semana e para lembrar quais treinos do lote importado ainda não fez.

**Why this priority**: É o problema relatado — hoje a lista mostra apenas quando o
arquivo foi *importado*, uma informação que não ajuda a decidir o que treinar hoje;
saber a última execução é o dado que realmente importa para essa decisão.

**Independent Test**: Importar um treino, executá-lo até finalizar uma sessão, voltar
para "Meus Treinos" e confirmar que o item mostra "Finalizado em" com a data/hora dessa
sessão.

**Acceptance Scenarios**:

1. **Given** um treino com pelo menos uma sessão finalizada, **When** o usuário abre
   "Meus Treinos", **Then** o item desse treino mostra "Finalizado em <data e hora>",
   referente à sessão finalizada mais recente daquele treino.
2. **Given** um treino que nunca teve nenhuma sessão finalizada, **When** o usuário
   abre "Meus Treinos", **Then** o item desse treino mostra "Nunca treinado" no lugar
   da data.
3. **Given** um treino com várias sessões finalizadas em datas diferentes, **When** o
   usuário finaliza uma nova sessão desse treino, **Then** a data exibida em "Meus
   Treinos" passa a refletir essa sessão nova (a mais recente).

---

### User Story 2 - Ver quando o treino foi importado, dentro da tela do treino (Priority: P2)

O usuário já está dentro da tela de um treino específico (lista de exercícios) e quer
saber quando aquele arquivo foi importado — informação que hoje aparece na lista geral,
mas que passa a fazer mais sentido dentro do treino específico, como um dado
secundário de referência.

**Why this priority**: Preserva uma informação que já existia e tinha valor (data de
importação), só que movida para um local mais coerente; não é o problema principal
relatado, por isso prioridade menor que a US1.

**Independent Test**: Abrir a tela de um treino específico e confirmar que a data de
importação aparece como informação secundária, sem me exigir voltar para a lista geral.

**Acceptance Scenarios**:

1. **Given** um treino qualquer, **When** o usuário abre a tela desse treino, **Then**
   a data de importação aparece visível como informação secundária (não em destaque
   igual ao nome do treino ou aos exercícios).
2. **Given** a tela "Meus Treinos", **When** o usuário observa a lista, **Then** a data
   de importação não aparece mais ali em nenhum item (substituída por "Finalizado
   em"/"Nunca treinado" da US1).

---

### User Story 3 - Diferenciar treinos com o mesmo nome sem mostrar a data de importação (Priority: P1)

O usuário importou (ou tem) dois ou mais treinos com o mesmo nome. Ele precisa
continuar conseguindo distinguir qual é qual na lista "Meus Treinos", mesmo a data de
importação não aparecendo mais ali.

**Why this priority**: Sem isso, a mudança da US1 quebraria uma garantia já validada
do MVP (RF02, SC-004: treinos homônimos sempre diferenciáveis na lista) — por isso
mesma prioridade da US1, não uma melhoria opcional.

**Independent Test**: Ter dois treinos com o mesmo nome, um já treinado e outro nunca
treinado, e confirmar que a lista os diferencia. Repetir com os dois nunca treinados e
confirmar que ainda são diferenciáveis.

**Acceptance Scenarios**:

1. **Given** dois treinos com o mesmo nome, um finalizado ao menos uma vez e outro
   nunca treinado (ou finalizado pela última vez em datas diferentes), **When** o
   usuário abre "Meus Treinos", **Then** o texto "Finalizado em <data>"/"Nunca
   treinado" já é suficiente para diferenciá-los, sem informação extra.
2. **Given** dois ou mais treinos com o mesmo nome cujo texto "Finalizado em"/"Nunca
   treinado" seria idêntico entre eles (ex.: todos nunca treinados, ou todos com a
   sessão mais recente finalizada no mesmo instante), **When** o usuário abre "Meus
   Treinos", **Then** cada um desses itens também mostra a data de importação (a
   mesma informação usada para diferenciação antes desta feature), como uma segunda
   linha, para continuar diferenciáveis entre si.

---

### Edge Cases

- Um treino tem sessões em andamento (não finalizadas) mas nenhuma finalizada ainda →
  continua contando como "Nunca treinado" na lista; sessão em andamento não é
  "finalizada" (RF07).
- Dois treinos homônimos, ambos "Nunca treinado" → cai no critério de desempate da US3
  (Acceptance Scenario 2): ambos passam a mostrar também a data de importação.
- Três ou mais treinos com o mesmo nome, misturando alguns já treinados (em datas
  diferentes) e outros nunca treinados → cada item usa "Finalizado em"/"Nunca treinado"
  normalmente; o desempate por data de importação (US3) se aplica apenas ao subgrupo
  de itens cujo texto colidiria entre si (ex.: só entre os "Nunca treinado", se houver
  mais de um).
- O treino é excluído/reimportado depois de ter sessões finalizadas → segue o
  comportamento já existente de exclusão de treino (fora do escopo desta feature);
  novas sessões finalizadas para o treino reimportado recomeçam a contagem.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A lista "Meus Treinos" DEVE mostrar, para cada treino, a data e hora da
  sessão finalizada mais recente desse treino, no formato "Finalizado em <data e
  hora>", no lugar do texto "Importado em <data>" usado até hoje.
- **FR-002**: Quando um treino não tiver nenhuma sessão finalizada, a lista DEVE
  mostrar "Nunca treinado" no lugar da data.
- **FR-003**: A data de importação do treino NÃO DEVE mais aparecer na lista "Meus
  Treinos" em nenhuma circunstância (substituída por FR-001/FR-002), exceto quando
  usada como critério de desempate visual (FR-005).
- **FR-004**: A tela do treino específico (lista de exercícios, RF03/RF04) DEVE
  exibir a data de importação do treino como informação secundária (visualmente menos
  destacada que o nome do treino e a lista de exercícios).
- **FR-005**: Quando dois ou mais treinos com o mesmo nome exibiriam o mesmo texto de
  "Finalizado em <data>"/"Nunca treinado" (colisão), a lista DEVE mostrar também a data
  de importação para esses itens especificamente, como informação adicional, para que
  continuem diferenciáveis entre si — preservando a garantia já validada em RF02
  (SC-004) de que treinos homônimos nunca ficam indistinguíveis na lista.
- **FR-006**: Treinos com nome único na lista (sem nenhum outro treino do mesmo nome)
  NUNCA mostram a data de importação na lista, independentemente de "Finalizado
  em"/"Nunca treinado" — a data de importação na lista existe só como desempate entre
  homônimos (FR-005), não como informação padrão para todo treino.

### Key Entities

- **Treino**: já existe (`Treino`, campo `importadoEm`); nenhum campo novo é
  necessário — a data de importação continua existindo, só muda onde é exibida.
- **SessaoTreino**: já existe; a "sessão finalizada mais recente" de um treino é
  derivada das sessões já persistidas desse treino (campo `finalizadaEm`), sem
  necessidade de um novo campo — dado derivado, não persistido separadamente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos treinos com ao menos uma sessão finalizada, a lista "Meus
  Treinos" mostra a data da sessão finalizada mais recente, não a data de importação.
- **SC-002**: Em 100% dos treinos sem nenhuma sessão finalizada, a lista mostra "Nunca
  treinado".
- **SC-003**: Em 100% dos casos de treinos homônimos, o usuário continua conseguindo
  identificar qual item da lista corresponde a qual treino (nenhuma ambiguidade),
  igual à garantia já validada em RF02 antes desta mudança.
- **SC-004**: A data de importação do treino continua acessível ao usuário (agora
  dentro da tela do treino específico) em 100% dos treinos, mesmo não aparecendo mais
  na lista geral.

## Assumptions

- **Fonte da data "Finalizado em"**: usa o mesmo campo `finalizadaEm` de
  `SessaoTreino` já usado por RF07/RF08/RF12 — nenhuma sessão nova ou campo novo é
  necessário, apenas uma consulta pela sessão finalizada mais recente de cada treino.
- **Contador de sessões finalizadas** (badge numérico já existente ao lado do nome do
  treino, RF11) não muda nesta feature — "Finalizado em" é informação adicional, não
  substitui esse contador.
- **Critério de desempate (FR-005)** usa a mesma fonte de dado que já existia antes
  desta feature (`importadoEm`) — não introduz um novo mecanismo de diferenciação,
  apenas restringe quando ele aparece (só quando necessário, não sempre).
- **Fuso horário e formato de data/hora**: mesmo formato já usado hoje pela lista para
  "Importado em" (`toLocaleString()` do aparelho) — sem mudança de formato nesta
  feature.
