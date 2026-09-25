# Feature Specification: Catálogo Interno de Exercícios

**Feature Branch**: `020-catalogo-exercicios`

**Created**: 2026-09-23

**Status**: Implemented — validado em Android e iOS em 2026-09-25 (Princípio III)

**Requisito**: RF19 (PRD, seção 6 — pós-MVP, a confirmar numeração ao registrar no PRD)

**Nota**: Melhoria pós-desenvolvimento — não fazia parte do escopo original do MVP.
Base de dados própria de exercícios (nome, grupo muscular, mídia), pensada para
sustentar futuras melhorias visuais (ex.: exibir imagem/GIF do exercício durante a
execução) e uma futura funcionalidade de montar treinos direto no app. Nenhuma dessas
duas coisas faz parte desta feature — ver "Fora de Escopo".

**Input**: User description: "Catálogo interno de exercícios (nome, grupo muscular,
imagem/GIF), importado de um banco de dados aberto (ex: free-exercise-db ou dataset
equivalente, já pesquisados anteriormente no projeto). ATENÇÃO CRÍTICA DE
ARQUITETURA: um catálogo com centenas de exercícios, cada um com imagem/GIF, embutido
no bundle do app conflita diretamente com o RNF02 (100% offline, sem dependência de
rede) devido ao tamanho resultante do app — descreva como parte da spec a decisão
entre embutir tudo (app maior), embutir um subconjunto curado, ou baixar sob demanda
com cache local (que introduziria a primeira dependência de rede do projeto, ainda que
opcional/não bloqueante). Esta feature NÃO inclui o Treino Customizado (RF/G, fora de
escopo aqui) — o catálogo existe como base de dados própria, sem necessariamente ter
uma tela de navegação/busca própria nesta rodada, a menos que isso seja necessário
para a spec 021 (imagens) funcionar."

**Nota sobre referências externas ao pedido**: o pedido cita "Treino Customizado
(RF/G)" e "free-exercise-db... já pesquisados anteriormente no projeto" — nenhuma
menção a essas duas coisas foi encontrada em nenhum arquivo deste repositório
(`docs/`, `specs/`) até esta data. Tratadas aqui como contexto novo trazido agora pelo
usuário, não como algo já decidido/documentado anteriormente neste projeto. Se essa
pesquisa existe em outro lugar (outra conversa, documento externo), ela não foi usada
como base desta spec — apenas o texto do pedido em si.

## Decisão de Arquitetura: fonte dos dados do catálogo

**Decisão**: catálogo embutido no pacote do app como um **subconjunto curado e
limitado** de exercícios (dados de texto + mídia estática), nunca a base de dados
aberta completa e nunca baixado sob demanda em tempo de execução.

**Por quê** (decisão tomada nesta spec, não perguntada de volta, dado que a
Constitution do projeto já estabelece os critérios de desempate):

- **Embutir a base completa** ("centenas de exercícios", cada um com imagem/GIF) foi
  descartado — é exatamente o problema que o próprio pedido identificou como "ATENÇÃO
  CRÍTICA": tamanho de pacote sem limite superior definido, crescendo com o dataset de
  origem, não com a necessidade real do app.
- **Baixar sob demanda com cache local** foi descartado nesta rodada — introduziria a
  **primeira dependência de rede do projeto inteiro**, contrariando RNF02 ("Funcionar
  offline, sem dependência de internet") mesmo sendo "opcional/não bloqueante"; a
  Constitution do projeto trata qualquer mudança de postura offline-first como mudança
  de escopo que exige atualização formal da Constitution *antes* da implementação —
  processo à parte, fora do alcance desta spec.
- **Subconjunto curado embutido** é a única das três opções que não introduz nenhuma
  dependência nova (Princípio IV) nem compromete RNF02, ao custo de cobertura menor
  que a base completa — aceitável porque, nesta rodada, o catálogo ainda não alimenta
  nenhuma tela de busca/navegação própria (ver Fora de Escopo) nem valida os
  exercícios de treinos importados (FR-004): seu único consumidor concreto hoje é a
  base de dados em si, para uso futuro.

**Atualizado em 2026-09-23** (verificação real de licença em `/speckit.plan`): a
fonte de dados escolhida para a curadoria deixa de ser o free-exercise-db (citado
apenas como exemplo no pedido original) e passa a ser o **wger project**
(CC-BY-SA 3.0) — motivo e evidência em `research.md`, Decisão 1, e na Assumption de
licenciamento abaixo. Isso não muda nenhuma das três opções de arquitetura acima
(continua sendo subconjunto curado embutido) — só a fonte de onde os dados/mídia
desse subconjunto são extraídos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ter uma base própria de exercícios com nome, grupo muscular e mídia (Priority: P1)

O app precisa de uma fonte de dados própria e estruturada de exercícios — não apenas
os nomes livres que já vêm dos arquivos JSON importados (RF01) — como base para
melhorias futuras (mostrar imagem/GIF do exercício, por exemplo). Essa base precisa
existir no dispositivo, sem exigir conexão de rede.

**Why this priority**: é o único entregável desta feature — sem a base de dados em si,
não há nada para as features futuras (imagens, treino customizado) consumirem.

**Independent Test**: Com o app instalado e o aparelho em modo avião, verificar que os
dados do catálogo (nome, grupo muscular, mídia) de qualquer exercício da lista curada
estão disponíveis, sem nenhuma tentativa de acesso à rede.

**Acceptance Scenarios**:

1. **Given** o app está instalado, **When** o catálogo de exercícios é consultado
   (por código, sem depender de UI própria ainda), **Then** cada exercício do
   catálogo tem nome, grupo muscular e uma mídia (imagem ou GIF) associada, todos
   já embutidos no pacote do app.
2. **Given** o aparelho está sem conexão de rede (modo avião), **When** o catálogo é
   consultado, **Then** os dados retornam normalmente — nenhuma requisição de rede é
   feita para acessar o catálogo.
3. **Given** o catálogo é um subconjunto curado (Decisão de Arquitetura acima),
   **When** ele é definido, **Then** cobre os principais grupos musculares usados em
   treinos de academia (ex.: peito, costas, pernas, ombros, braços, core), sem
   pretender ser exaustivo.

---

### User Story 2 - Não interferir no fluxo de importação de treino já existente (Priority: P2)

O usuário continua importando treinos via arquivo JSON (RF01) normalmente. O catálogo
novo não pode mudar, restringir ou validar esse fluxo já existente e validado.

**Why this priority**: garantia de não regressão sobre uma funcionalidade central já
implementada; menor prioridade que US1 porque é uma restrição de escopo, não uma
funcionalidade nova em si.

**Independent Test**: Importar um treino cujo exercício não existe no catálogo curado
e confirmar que a importação funciona exatamente como hoje, sem erro, aviso ou
comportamento diferente por causa do catálogo.

**Acceptance Scenarios**:

1. **Given** um arquivo de treino a importar contém um exercício cujo nome não existe
   no catálogo curado, **When** o treino é importado (RF01), **Then** a importação
   funciona normalmente, sem nenhuma validação, erro ou aviso relacionado ao
   catálogo.

---

### Edge Cases

- Um exercício do catálogo curado tem o mesmo nome (ou nome muito parecido) de um
  exercício vindo de um arquivo de treino importado → nenhuma relação é estabelecida
  entre os dois nesta feature (FR-004); são fontes de dados completamente
  independentes por enquanto.
- Um exercício do dataset de origem (base aberta) não tem imagem/GIF disponível ou
  tem mídia de qualidade muito baixa → esse exercício específico é excluído da
  curadoria (não entra no subconjunto embutido) — o catálogo só inclui exercícios com
  os 3 atributos completos (nome, grupo muscular, mídia).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE ter um catálogo interno de exercícios, cada um com nome,
  grupo muscular e uma mídia (imagem ou GIF) associada.
- **FR-002**: O catálogo DEVE ser construído a partir de uma base de dados aberta de
  exercícios (ex.: free-exercise-db ou equivalente), como um subconjunto curado e
  limitado — nunca a base completa (ver Decisão de Arquitetura).
- **FR-003**: O catálogo DEVE ser embutido no pacote do app (dados e mídia
  estáticos) — nenhum dado do catálogo é obtido por download em tempo de execução,
  preservando RNF02 (100% offline).
- **FR-004**: O fluxo de importação de treino via arquivo JSON (RF01) NÃO DEVE ser
  alterado por esta feature — exercícios importados continuam sendo texto livre, sem
  validação ou vínculo obrigatório com o catálogo.
- **FR-005**: O catálogo é dado estático de referência da aplicação — NÃO é dado de
  treino, sessão ou histórico de nenhum perfil, e portanto não está sujeito à regra de
  segregação por `perfil_id` (Princípio V da Constitution): é o mesmo catálogo,
  compartilhado, para todos os perfis do aparelho.
- **FR-006**: Esta feature NÃO inclui uma tela própria de navegação/busca do
  catálogo — a existência dessa tela fica para quando a feature de exibição de
  imagens/GIFs (referida no pedido como "spec 021", ainda não especificada)
  determinar se ela é necessária.
- **FR-007** (novo, decorrente da verificação de licença — ver `research.md`,
  Decisão 1): o app DEVE exibir, em algum lugar acessível (ex.: dentro da tela de
  "Ações" já existente, RF14), um texto de atribuição/créditos ao wger project e à
  licença CC-BY-SA 3.0 dos dados/mídia do catálogo — exigência da própria licença
  escolhida (atribuição obrigatória), não uma preferência de produto.

### Key Entities

- **Exercício de Catálogo** (novo): nome, grupo muscular, e uma referência à mídia
  (imagem/GIF) associada. Dado estático embutido no app, não persistido em
  AsyncStorage nem associado a nenhum perfil — mesmo conceito para todos os usuários
  do aparelho.
- **Grupo Muscular** (novo, atributo do Exercício de Catálogo): categoria fixa usada
  para organizar o catálogo (ex.: peito, costas, pernas, ombros, braços, core) — lista
  exata de grupos fica a cargo do `/speckit.plan`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos exercícios do catálogo têm os 3 atributos completos (nome,
  grupo muscular, mídia) — nenhuma entrada parcial.
- **SC-002**: O app continua funcionando 100% offline com o catálogo presente —
  nenhum fluxo do app (existente ou novo) faz uma requisição de rede para consultar
  dados do catálogo, em 100% dos casos verificados.
- **SC-003**: 100% das importações de treino via JSON (RF01) continuam funcionando
  sem nenhuma mudança de comportamento perceptível, independente de os exercícios do
  arquivo baterem ou não com nomes do catálogo.
- **SC-004**: O catálogo cobre os principais grupos musculares de treino de academia,
  como um subconjunto deliberadamente curado — não uma cópia integral do dataset de
  origem.

## Fora de Escopo

- **Treino Customizado** (montar um treino selecionando exercícios diretamente do
  catálogo, em vez de importar um arquivo JSON) — mencionado no pedido como já
  existindo como ideia ("RF/G"), mas sem nenhum registro encontrado neste repositório;
  tratado aqui apenas como um consumidor futuro do catálogo, não especificado nesta
  spec.
- **Exibição de imagem/GIF na tela de execução do treino** — depende desta feature
  existir primeiro, mas é escopo de uma feature separada (referida no pedido como
  "spec 021"), ainda não especificada.
- **Tela de navegação/busca do catálogo** — ver FR-006.
- **Download sob demanda / cache de mídia** — decisão explícita de não seguir por
  esse caminho nesta rodada (ver Decisão de Arquitetura); revisitar exigiria alterar a
  Constitution do projeto antes de implementar.

## Assumptions

- **Curadoria não quantificada nesta spec**: o pedido não definiu um número exato de
  exercícios nem uma lista fechada de grupos musculares — esta spec define o
  *princípio* (subconjunto curado, limitado, cobrindo os principais grupos
  musculares), deixando a lista exata e o tamanho final para o `/speckit.plan` (que
  pode, inclusive, propor um orçamento de tamanho de pacote como critério objetivo de
  curadoria).
- **Formato da mídia**: "imagem ou GIF" é tratado como uma escolha por exercício (o
  que a base de dados de origem já fornece para aquele exercício), não uma exigência
  de que todo exercício tenha necessariamente um GIF — uma imagem estática também
  atende FR-001 quando for o que a fonte de dados oferece.
- **Licenciamento do dataset de origem — verificado em `/speckit.plan`, não mais
  assumido**: a pesquisa real (ver `research.md`, Decisão 1) encontrou dúvida
  recorrente e nunca respondida pelos mantenedores sobre a origem/direitos das
  imagens do free-exercise-db (3 issues abertas entre 2023-2024 perguntando se as
  imagens são realmente livres de direitos autorais, nenhuma respondida) — apesar de
  o repositório declarar Unlicense (domínio público) para tudo. Por esse motivo, a
  fonte escolhida para a mídia (imagem/GIF) é o **wger project**
  (CC-BY-SA 3.0, com atribuição rastreável por exercício), não o free-exercise-db —
  ver Decisão de Arquitetura (atualizada) e `research.md`. Dados de texto (nome,
  grupo muscular) do free-exercise-db continuam considerados seguros (Unlicense,
  sem a mesma dúvida levantada), mas nesta spec a curadoria usa uma única fonte
  (wger) para manter nome/grupo/mídia de cada exercício consistentes entre si.
