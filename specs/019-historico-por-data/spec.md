# Feature Specification: Histórico por Data

**Feature Branch**: `019-historico-por-data`

**Created**: 2026-09-23

**Status**: Draft

**Requisito**: RF18 (PRD, seção 6 — pós-MVP, a confirmar numeração ao registrar no PRD)

**Nota**: Melhoria pós-desenvolvimento — não fazia parte do escopo original do MVP.
Ideia relatada pela usuária durante os testes de campo do RF11-RF14 ("qual treino
realizado numa determinada data"), registrada no roadmap pós-MVP com prioridade
menor, agora solicitada formalmente.

**Input**: User description: "Nova visualização de histórico, organizada por DATA
(ex: '21/09 → Treino A: Supino Reto 3x10 @40kg, ...'), complementar à visualização já
existente por exercício (RF08) — não substitui, adiciona uma segunda forma de
consultar os mesmos dados já persistidos (sessões finalizadas, RF07). Reaproveitar a
mesma fonte de dados já usada pelo RF08 (sessões finalizadas do perfil ativo), sem
introduzir nova estrutura de storage. Definir onde essa visualização vive na
navegação (ex: uma segunda seção/aba dentro da tela de Histórico já existente, com
alternância entre 'por exercício' e 'por data') e como cada dia é exibido quando há
mais de uma sessão finalizada no mesmo dia."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Saber o que foi treinado em cada dia (Priority: P1)

O usuário quer responder "o que eu treinei no dia X?" — diferente de "como evoluí no
exercício Y?" (RF08). Ele abre a tela de Histórico, alterna para a visão "por data" e
vê, para cada dia com sessões finalizadas, qual(is) treino(s) fez e quais exercícios
(com séries/reps/carga) registrou naquele dia, da data mais recente para a mais
antiga.

**Why this priority**: É o valor central do pedido — sem isso, não existe "histórico
por data" nenhum; a User Story 2 só faz sentido em cima desta.

**Independent Test**: Com um perfil que tenha sessões finalizadas em pelo menos dois
dias diferentes, abrir a visão "por data" do Histórico e confirmar que cada dia
aparece com o(s) treino(s) e exercícios corretos daquela data, ordenados do mais
recente para o mais antigo.

**Acceptance Scenarios**:

1. **Given** o perfil ativo tem sessões finalizadas em dias diferentes, **When** o
   usuário abre a visão "por data", **Then** cada dia aparece como um grupo próprio,
   ordenado do mais recente para o mais antigo.
2. **Given** um dia específico com uma sessão finalizada de um treino, **When** o
   usuário vê esse dia na visão "por data", **Then** aparece o nome do treino e, para
   cada exercício executado, os registros de série feitos naquele dia (mesmo nível de
   detalhe já usado pela visão "por exercício" — carga, reps, por série, sem agregar
   múltiplas séries em um único valor, RF08 FR-008).
3. **Given** o perfil ativo não tem nenhuma sessão finalizada, **When** o usuário abre
   a visão "por data", **Then** o app indica claramente que não há registros ainda,
   mesmo texto/comportamento já usado pela visão "por exercício" (RF08) para o caso
   equivalente.

---

### User Story 2 - Alternar entre as duas formas de consultar o histórico (Priority: P1)

O usuário já está na tela de Histórico (consultando por exercício, RF08) e quer trocar
para a visão por data sem sair da tela ou perder o contexto de que ainda está no
Histórico — as duas são formas diferentes de olhar para os mesmos dados, não telas
não relacionadas.

**Why this priority**: Sem uma forma clara de alternar entre as duas visões, a
funcionalidade fica difícil de descobrir/usar — tão essencial quanto a própria visão
existir (US1), por isso mesma prioridade.

**Independent Test**: Abrir a tela de Histórico, confirmar que existe um controle
visível para alternar entre "por exercício" e "por data", e que trocar entre eles
mantém o usuário na mesma tela (Histórico), sem navegação para uma rota separada.

**Acceptance Scenarios**:

1. **Given** o usuário está na tela de Histórico, **When** ele olha a tela, **Then**
   existe um controle visível (ex.: alternância/abas internas) para escolher entre
   "Por exercício" e "Por data".
2. **Given** o usuário está na visão "Por exercício", **When** ele seleciona "Por
   data", **Then** a tela troca de conteúdo para a nova visão, permanecendo na mesma
   tela de Histórico (sem navegação para uma rota/aba separada do app).
3. **Given** o usuário trocou de perfil ativo (RF10) enquanto estava na visão "Por
   data", **When** a troca de perfil ocorre, **Then** a visão por data atualiza para
   mostrar exclusivamente os dados do novo perfil ativo — mesma garantia já aplicada
   à visão por exercício (RF08).

---

### Edge Cases

- Duas ou mais sessões finalizadas no mesmo dia (do mesmo treino ou de treinos
  diferentes) → cada sessão aparece como um bloco próprio dentro do grupo daquele
  dia, na ordem do horário de finalização (mais recente primeiro); o dia nunca mescla
  registros de sessões diferentes em um único bloco.
- Uma sessão finalizada tem exercícios sem nenhuma série registrada (ex.: exercício
  pulado) → esse exercício não aparece no bloco daquela sessão (nada a mostrar), sem
  quebrar a exibição dos demais exercícios da mesma sessão.
- Um registro de sessão finalizada cujo treino ou exercício de origem não pôde ser
  resolvido (dado inconsistente) → mesmo tratamento defensivo já definido pelo RF08
  (FR-013/FR-014): o registro específico é omitido da interface, sem quebrar a
  exibição do restante.
- O usuário nunca importou um treino com múltiplos exercícios num mesmo dia mas
  finalizou a MESMA sessão duas vezes (não é possível no fluxo atual — uma sessão só
  finaliza uma vez, RF07) → não é um caso a tratar; mencionado apenas para deixar
  claro que "duas sessões no mesmo dia" sempre significa duas sessões distintas
  (`SessaoTreino.id` diferentes).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela de Histórico (RF08) DEVE oferecer um controle de alternância
  entre duas visões: "Por exercício" (já existente, RF08) e "Por data" (nova),
  ambas na mesma tela/rota já existente — esta feature NÃO introduz uma aba de
  navegação nova.
- **FR-002**: A visão "Por data" DEVE reaproveitar exclusivamente os dados já
  persistidos por RF07 (sessões finalizadas) e RF01 (treinos importados) — nenhuma
  nova estrutura de armazenamento é introduzida por esta feature.
- **FR-003**: A visão "Por data" DEVE agrupar os registros por dia civil da data de
  finalização da sessão (`finalizadaEm`), ordenados do dia mais recente para o mais
  antigo.
- **FR-004**: Dentro de cada dia, quando houver mais de uma sessão finalizada nesse
  dia, cada sessão DEVE aparecer como um bloco distinto (nunca mesclado com outra
  sessão do mesmo dia), identificado pelo nome do treino de origem, ordenado da
  sessão mais recente para a mais antiga dentro daquele dia.
- **FR-005**: Dentro do bloco de cada sessão, os exercícios executados DEVEM ser
  listados com seus registros de série (carga em kg e reps, por série individual) —
  mesmo nível de detalhe e mesma regra de não agregar séries já definida pelo RF08
  (FR-008), aplicada aqui por sessão/dia em vez de por exercício.
- **FR-006**: Quando o perfil ativo não tiver nenhuma sessão finalizada, a visão "Por
  data" DEVE indicar isso explicitamente, mesmo comportamento e mensagem equivalente
  já usados pela visão "Por exercício" (RF08, FR-010) para esse caso.
- **FR-007**: A visão "Por data" DEVE respeitar a mesma segregação por perfil ativo
  já garantida pela visão "Por exercício" (RF08, FR-011/FR-012) — troca de perfil
  atualiza imediatamente os dados exibidos, sem registros residuais do perfil
  anterior.
- **FR-008**: Um registro de sessão cujo treino ou exercício de origem não possa ser
  resolvido DEVE ser omitido apenas desse registro específico, sem impedir a exibição
  do restante — mesmo tratamento defensivo do RF08 (FR-013/FR-014).

### Key Entities

- **Dia de histórico** (novo, apenas para exibição — não persistido): agrupamento dos
  registros de todas as sessões finalizadas de um mesmo dia civil, contendo um ou mais
  blocos de sessão.
- **Bloco de sessão** (novo, apenas para exibição — não persistido): dentro de um dia
  de histórico, representa uma única sessão finalizada — nome do treino de origem e a
  lista de exercícios/séries registrados nela. Derivado a partir de `SessaoTreino` já
  persistida (RF07) e do `Treino` de origem (RF01), mesma fonte de dados já usada pela
  visão por exercício (RF08) — nenhuma entidade nova é persistida.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A partir da tela de Histórico já existente, o usuário alterna para a
  visão "Por data" em no máximo um toque.
- **SC-002**: 100% das sessões finalizadas do perfil ativo aparecem na visão "Por
  data", agrupadas no dia civil correto de finalização.
- **SC-003**: Em 100% dos dias com mais de uma sessão finalizada, cada sessão
  permanece visualmente distinta (nenhuma mescla de registros entre sessões
  diferentes do mesmo dia).
- **SC-004**: Após trocar de perfil ativo, 100% dos registros exibidos na visão "Por
  data" pertencem ao novo perfil ativo.
- **SC-005**: Consultando um dia específico, o usuário identifica em poucos segundos
  qual treino fez e quais exercícios/cargas registrou, sem precisar abrir a visão por
  exercício para essa informação.

## Assumptions

- **Local da nova visão**: dentro da tela "Histórico" já existente (RF08), como uma
  segunda visão alternável — não uma aba de navegação nova. Escolhido para manter a
  navegação principal do app enxuta (2 abas: Treinos e Histórico) e porque ambas as
  visões consultam exatamente os mesmos dados, apenas organizados de forma diferente
  — decisão explicitamente delegada pelo usuário ("definir onde essa visualização
  vive"), usando a sugestão do próprio pedido como padrão adotado.
- **Nível de detalhe por série, não resumo agregado**: o exemplo do pedido ("Supino
  Reto 3x10 @40kg") é lido como ilustração informal do formato, não como uma mudança
  de regra — esta spec segue a mesma decisão já validada pelo RF08 (FR-008) de nunca
  agregar/resumir séries com valores diferentes em um único número, para não
  reintroduzir uma ambiguidade que o RF08 já resolveu deliberadamente.
- **Sem edição nesta visão**: a visão "Por data" é somente leitura nesta feature; a
  edição de um registro (RF09a/RF09b) continua disponível apenas pela visão "Por
  exercício" já existente — evita duplicar a mesma lógica de edição em dois lugares
  nesta rodada.
- **Dia civil no fuso horário do aparelho**: o agrupamento por "dia" usa a mesma
  representação de data/hora local já usada em todo o app (`toLocaleString()`/data do
  aparelho), sem tratamento especial de fuso horário além do que já existe hoje.
- **Categorias de unidade** (atualizado em 2026-09-25): o RF17 (categorias de
  exercício — peso, tempo, distância, repetições, `specs/017-categorias-exercicio/`)
  **já está implementado** — esta assumption, escrita quando o RF17 ainda não
  existia, previa exatamente este cenário ("se o RF16/17 for implementado antes
  desta feature, a visão 'Por data' deve seguir a mesma adaptação"). Essa integração
  já foi incorporada ao escopo real desta spec: `data-model.md`
  (`RegistroExercicioNoDia.categoria`), `contracts/historico-evolucao.md`
  (`RegistroBruto.categoria`) e `contracts/explore-screen.md` (`SecaoDia` usa
  `src/utils/categoria-exercicio.ts`) já refletem isso, e `quickstart.md` tem um
  cenário próprio (Cenário 5) equivalente ao já validado na visão "Por exercício".
  A visão "Por data" nunca mostra carga(kg) fixo para todas as categorias — segue a
  mesma unidade por categoria já aplicada em todas as outras telas pelo RF17.
