# Feature Specification: Categorias de Unidade por Exercício

**Feature Branch**: `017-categorias-exercicio`

**Created**: 2026-09-23

**Status**: Implemented — validado em Android e iOS em 2026-09-25 (Princípio III)

**Requisito**: RF17 (PRD, seção 6 — pós-MVP; número confirmado em 2026-09-24 ao
registrar no PRD — era citado provisoriamente como "RF16" antes disso, mas esse
número já tinha sido ocupado por `specs/016-finalizado-em` quando chegou a vez desta
spec de ser registrada)

**Nota**: Melhoria pós-desenvolvimento — não fazia parte do escopo original do MVP.
Pedido registrado durante os testes de campo do RF11-RF14 ("exercícios de cardio não
possuem carga, geralmente, logo não teria porque o arquivo ter esse valor... isso me
alerta que exercícios deveriam ter categorias e para cada tipo uma referência de
medida"), marcado então como evolução futura e agora solicitado formalmente.

**Input**: User description: "Adicionar categoria de unidade a cada exercício de um
treino, com 4 categorias: peso (kg, padrão atual), tempo (minutos), distância (km),
repetições sem carga (sem nenhuma unidade associada, só contagem). Campo novo
'categoria' no JSON de treino (schema do RF01), a nível de exercício — OPCIONAL,
assumindo 'peso' quando ausente, para manter compatibilidade total com todo
arquivo/exemplo já existente. A tela de execução (RF03/RF04) deve adaptar os campos de
registro conforme a categoria: peso continua carga(kg)+reps; tempo substitui carga por
um campo de tempo registrado; distância substitui carga por um campo de distância;
reps sem carga esconde o campo de carga, mantendo só reps. O histórico (RF08) e
RF09a/b (edição) precisam refletir a categoria correta de cada registro."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar um exercício de cardio sem um campo de carga sem sentido (Priority: P1)

O usuário está treinando um exercício de cardio (ex.: esteira, bicicleta) que, no
arquivo importado, foi marcado com a categoria correta (tempo ou distância). Ao abrir
esse exercício na tela de execução, ele quer registrar o que realmente fez — minutos
ou quilômetros — em vez de precisar preencher (ou ignorar) um campo de carga em kg que
não faz sentido para esse exercício.

**Why this priority**: É o problema relatado — hoje todo exercício usa carga(kg)+reps,
mesmo quando a carga não existe (veio `0` no arquivo), o que confunde o registro real
do treino.

**Independent Test**: Importar um treino com um exercício de categoria "tempo" e outro
de categoria "distância", abrir cada um na execução e confirmar que o campo de
registro mostrado corresponde à categoria (tempo em minutos; distância em km), sem
nenhum campo de carga(kg) visível.

**Acceptance Scenarios**:

1. **Given** um exercício de categoria "peso", **When** o usuário abre a execução
   desse exercício, **Then** os campos de registro são carga (kg) e reps, exatamente
   como hoje.
2. **Given** um exercício de categoria "tempo", **When** o usuário abre a execução
   desse exercício, **Then** o campo de carga (kg) é substituído por um campo de
   tempo (minutos); o campo de reps continua disponível.
3. **Given** um exercício de categoria "distância", **When** o usuário abre a execução
   desse exercício, **Then** o campo de carga (kg) é substituído por um campo de
   distância (km); o campo de reps continua disponível.
4. **Given** um exercício de categoria "repetições sem carga", **When** o usuário abre
   a execução desse exercício, **Then** o campo de carga (kg) não aparece; só o campo
   de reps é exibido.
5. **Given** um exercício de categoria "tempo" ou "distância", **When** o usuário olha
   o valor sugerido do exercício antes de começar a série (hoje "carga sugerida"),
   **Then** esse valor sugerido aparece na unidade da categoria (minutos ou km), não
   em kg.

---

### User Story 2 - Importar um treino sem informar categoria (compatibilidade) (Priority: P1)

O usuário importa um arquivo de treino já existente (criado antes desta feature, ou
sem o campo "categoria" preenchido em algum exercício). Ele espera que o app continue
funcionando exatamente como antes — nenhum treino ou exercício antigo deve parar de
funcionar ou ser rejeitado por causa desta mudança.

**Why this priority**: Constitution do projeto (Princípio IV) e a própria garantia já
validada do RF01 — mudança de schema não pode quebrar arquivos existentes; sem isso a
feature seria um risco de regressão inaceitável.

**Independent Test**: Importar um arquivo JSON de treino sem o campo "categoria" em
nenhum exercício (ex.: qualquer exemplo já existente em `docs/exemplos/`) e confirmar
que a importação funciona normalmente e todo exercício se comporta como categoria
"peso".

**Acceptance Scenarios**:

1. **Given** um arquivo de treino sem o campo "categoria" em um exercício, **When** o
   treino é importado, **Then** esse exercício é tratado como categoria "peso"
   (comportamento idêntico ao existente antes desta feature).
2. **Given** um arquivo de treino misturando exercícios com e sem o campo "categoria",
   **When** o treino é importado, **Then** cada exercício usa sua própria categoria
   informada, e os sem categoria usam "peso".

---

### User Story 3 - Ver o histórico e editar registros com a unidade correta (Priority: P2)

O usuário consulta a evolução de um exercício de cardio na tela de histórico (RF08),
ou corrige um registro já feito (RF09a/RF09b). Ele quer ver e editar o valor na
unidade certa (tempo, distância, ou só repetições), não em carga(kg).

**Why this priority**: Consequência direta da US1 — sem isso, o histórico e a edição
ficariam inconsistentes com o que foi registrado na execução, uma regressão de duas
funcionalidades já existentes. Prioridade menor que a US1 porque depende dela existir
primeiro (mesmo dado, exibido em outro lugar).

**Independent Test**: Registrar uma série de um exercício de categoria "tempo",
verificar que o histórico (RF08) mostra o valor em minutos, e editar esse registro
(RF09a ou RF09b) confirmando que o campo de edição também é de tempo, não de carga.

**Acceptance Scenarios**:

1. **Given** um registro de série de um exercício de categoria "peso", **When** o
   usuário vê esse registro no histórico (RF08), **Then** aparece com carga (kg) e
   reps, como hoje.
2. **Given** um registro de série de um exercício de categoria "tempo" ou
   "distância", **When** o usuário vê esse registro no histórico (RF08), **Then**
   aparece com o valor na unidade da categoria (minutos ou km) e reps — não em kg.
3. **Given** um registro de série de um exercício de categoria "repetições sem
   carga", **When** o usuário vê esse registro no histórico (RF08), **Then** aparece
   só a contagem de reps, sem nenhum valor de carga/tempo/distância.
4. **Given** um registro de qualquer categoria, **When** o usuário edita esse
   registro (RF09a, sessão em andamento, ou RF09b, sessão finalizada), **Then** o
   campo de edição exibido corresponde à categoria do exercício (o mesmo
   comportamento de campos da US1, agora no fluxo de edição).

---

### Edge Cases

- O campo "categoria" no JSON tem um valor não reconhecido (ex.: erro de digitação,
  categoria diferente das 4 previstas) → o exercício inteiro é descartado na
  importação, com o motivo indicado ao usuário — mesmo tratamento já usado hoje para
  qualquer outro campo inválido de um exercício (RF01, "exercícios inválidos são
  descartados individualmente, sem invalidar o treino inteiro").
- Um treino já importado (antes desta feature) é executado depois da atualização do
  app → continua funcionando como categoria "peso" para todos os seus exercícios,
  sem exigir reimportação.
- Um exercício de categoria "tempo" ou "distância" — o campo de reps continua sendo
  pedido; não é obrigatório reinterpretar ou remover reps para essas categorias
  (mantido igual ao já existente, só o campo de carga muda).
- Um exercício de categoria "repetições sem carga" tem, mesmo assim, um valor de
  "carga sugerida" no arquivo importado (campo legado) → esse valor é ignorado; não é
  exibido em nenhuma tela para essa categoria.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O schema de importação de treino (RF01) DEVE aceitar um campo opcional
  "categoria" em cada exercício, com um dos 4 valores: "peso", "tempo", "distancia",
  "repeticoes".
- **FR-002**: Quando o campo "categoria" estiver ausente em um exercício, o sistema
  DEVE tratá-lo como categoria "peso" — nenhum arquivo ou exemplo já existente hoje
  pode deixar de funcionar por causa desta feature.
- **FR-003**: Quando o campo "categoria" estiver presente com um valor diferente dos 4
  previstos, esse exercício específico DEVE ser tratado como inválido e descartado da
  importação, com o restante do treino e dos demais exercícios não afetado (mesma
  regra já aplicada a outros campos inválidos no RF01).
- **FR-004**: Na tela de execução (RF03/RF04), os campos de registro de uma série
  DEVEM se adaptar à categoria do exercício:
  - "peso": carga (kg) + reps (comportamento atual, sem mudança).
  - "tempo": tempo (minutos) + reps.
  - "distancia": distância (km) + reps.
  - "repeticoes": apenas reps (sem campo de carga/tempo/distância).
- **FR-005**: O valor sugerido do exercício exibido antes do registro (hoje "carga
  sugerida", vindo do arquivo importado) DEVE ser exibido na unidade correspondente à
  categoria do exercício (kg, minutos, ou km); para a categoria "repeticoes", nenhum
  valor sugerido de carga/tempo/distância é exibido.
- **FR-006**: A tela de histórico de evolução (RF08) DEVE exibir cada registro de
  série na unidade correspondente à categoria do exercício ao qual pertence, em vez de
  assumir sempre carga (kg).
- **FR-007**: Os fluxos de edição de registro de série já feito, tanto para sessão em
  andamento (RF09a) quanto para sessão finalizada (RF09b), DEVEM exibir e editar o
  campo correspondente à categoria do exercício (carga, tempo, distância, ou somente
  reps), em vez de assumir sempre carga (kg).

### Key Entities

- **ExercicioPlanejado** (já existe, RF01): ganha um atributo novo, categoria, com um
  dos 4 valores previstos ("peso" quando o arquivo importado não informar nada); o
  valor sugerido hoje interpretado sempre como "carga sugerida em kg" passa a ser
  interpretado na unidade da categoria (kg, minutos, km, ou não aplicável).
- **Registro de série realizada** (já existe, dentro de `SessaoTreino`, RF04): o valor
  numérico hoje sempre interpretado como "carga em kg" passa a ser interpretado na
  unidade da categoria do exercício ao qual a série pertence (kg, minutos, km, ou não
  aplicável — só reps).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos exercícios de categoria "tempo" ou "distância", nenhum campo
  de carga (kg) aparece em nenhuma tela (execução, histórico, edição) — substituído
  pela unidade correta.
- **SC-002**: Em 100% dos exercícios de categoria "repetições sem carga", apenas a
  contagem de reps aparece — nenhum campo de carga, tempo ou distância em nenhuma
  tela.
- **SC-003**: 100% dos treinos e arquivos JSON já existentes antes desta feature
  continuam sendo importados e executados sem nenhuma mudança de comportamento
  perceptível (todos tratados como categoria "peso").
- **SC-004**: Em 100% dos registros de série de qualquer categoria, o histórico (RF08)
  e as telas de edição (RF09a/RF09b) mostram a mesma unidade usada no momento do
  registro original — sem inconsistência entre onde o dado foi criado e onde é
  exibido/editado.

## Assumptions

- **Campo `cargaKg` mantém esse nome para todas as categorias** (confirmado pelo
  usuário em 2026-09-23): o valor numérico do registro de série de tempo/distância/
  repetições continua guardado no mesmo campo hoje chamado `cargaKg`
  (`SerieRealizada`), só reinterpretado conforme a categoria do exercício (minutos,
  km, ou não aplicável) — o nome do campo em si não muda. Decisão consciente, não um
  esquecimento: o nome fica tecnicamente impreciso para essas categorias (um valor em
  minutos guardado em um campo chamado "cargaKg"), mas evita alterar a assinatura de
  dados já consumida por RF03/RF04, RF07, RF08 e RF09a/RF09b — renomear exigiria
  revisar todos esses pontos de consumo só por clareza de nome, sem nenhum ganho
  funcional (Princípio II, simplicidade: menor mudança que atende o requisito).
- **Reps sempre presente**: as 4 categorias sempre incluem o campo de reps; a
  categoria determina apenas se existe (e qual é) o campo adicional de
  carga/tempo/distância. Reps nunca é removido, mesmo para exercícios de tempo ou
  distância (ex.: 3 séries de 1 minuto cada ainda registram quantas repetições, se
  aplicável ao exercício) — decisão tomada para manter a mudança pequena e simétrica
  entre categorias (Princípio II), já que o pedido original não indicou remoção de
  reps para essas duas categorias.
- **Nomenclatura dos valores de "categoria"**: strings em minúsculas e sem acento
  ("peso", "tempo", "distancia", "repeticoes"), seguindo a mesma convenção já usada
  pelos demais campos do schema JSON de importação (RF01, `snake_case`/minúsculo sem
  acento, ex.: `carga_sugerida_kg`).
- **Sem unidade configurável**: as unidades de cada categoria são fixas (kg, minutos,
  km) — esta feature não introduz uma forma de o usuário escolher/alterar a unidade de
  uma categoria.
- **Sem migração de dados**: treinos e sessões já persistidos antes desta feature não
  precisam de nenhuma migração — a ausência do campo "categoria" já é o caso coberto
  por FR-002 (assume "peso"), tanto para treinos novos importados sem o campo quanto
  para treinos e sessões que já existiam no armazenamento antes desta feature existir.
