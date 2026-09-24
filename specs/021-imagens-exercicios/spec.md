# Feature Specification: Imagem/GIF do Exercício na Execução

**Feature Branch**: `021-imagens-exercicios`

**Created**: 2026-09-23

**Status**: Draft — depende de `specs/020-catalogo-exercicios` estar implementada

**Requisito**: RF20 (PRD, seção 6 — pós-MVP, a confirmar numeração ao registrar no PRD)

**Nota**: Melhoria pós-desenvolvimento — não fazia parte do escopo original do MVP.
Consome o catálogo interno de exercícios (spec 020) para enriquecer a tela de
execução de treino já existente (RF03/RF04), sem alterar o fluxo de importação via
JSON (RF01).

**Input**: User description: "Exibir imagem/GIF do exercício (catálogo, spec 020) na
tela de execução de treinos IMPORTADOS via JSON (RF03/RF04) — não depende do Treino
Customizado (fora de escopo). Ao abrir um exercício durante a execução, tentar
localizar uma correspondência no catálogo pelo NOME do exercício (mesma regra de
normalização já usada no RF08: espaços e maiúsculas/minúsculas ignorados, mas nada
além disso) — se houver correspondência exata após essa normalização, exibir a
imagem/GIF; se não houver, não exibir nada (sem tentar aproximar nomes parecidos, sem
UI de 'escolher manualmente' nesta rodada). Depende da spec 020 já existir."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver a imagem do exercício ao executá-lo (Priority: P1)

O usuário abre um exercício durante a execução de um treino importado. Quando o nome
desse exercício corresponde a um exercício do catálogo interno (spec 020), ele quer
ver a imagem/GIF de referência, para lembrar a execução correta do movimento sem
precisar sair do app ou depender só da memória/nome do exercício.

**Why this priority**: é o valor central do pedido — sem isso, o catálogo (spec 020)
não tem nenhum consumidor visível ao usuário ainda.

**Independent Test**: Ter um treino importado com um exercício cujo nome (após
normalização) corresponde exatamente a um exercício do catálogo; abrir esse exercício
na tela de execução e confirmar que a imagem/GIF do catálogo aparece.

**Acceptance Scenarios**:

1. **Given** um exercício do treino em execução tem, após normalização de nome
   (espaços e maiúsculas/minúsculas ignorados — mesma regra do RF08), correspondência
   exata com um exercício do catálogo, **When** o usuário abre esse exercício na tela
   de execução, **Then** a imagem/GIF correspondente do catálogo é exibida.
2. **Given** dois exercícios de treinos diferentes têm nomes que só diferem em
   espaçamento ou maiúsculas/minúsculas (ex.: "Supino Reto" vs. "supino  reto"), mas
   ambos correspondem ao mesmo exercício do catálogo após normalização, **When** o
   usuário abre qualquer um dos dois na execução, **Then** a mesma imagem/GIF do
   catálogo é exibida para ambos.

---

### User Story 2 - Não mostrar nada quando não há correspondência (Priority: P1)

O usuário abre um exercício cujo nome não corresponde a nenhum exercício do catálogo
(catálogo é um subconjunto curado, spec 020 — nem todo exercício importado
necessariamente está nele). Ele não deve ver nenhuma imagem incorreta, nem um espaço
vazio estranho, nem ser interrompido por uma tela pedindo para escolher manualmente.

**Why this priority**: mesma prioridade da US1 — sem esse comportamento bem definido
para o caso de "não encontrado" (o caso mais comum, já que o catálogo é curado e
limitado), a experiência para a maioria dos exercícios ficaria mal definida.

**Independent Test**: Abrir, na execução, um exercício cujo nome normalizado não
corresponde a nenhum exercício do catálogo, e confirmar que a tela se comporta
exatamente como hoje (antes desta feature existir) — nenhuma imagem, nenhum espaço
reservado vazio, nenhuma UI adicional.

**Acceptance Scenarios**:

1. **Given** um exercício do treino em execução não corresponde, após normalização,
   a nenhum exercício do catálogo, **When** o usuário abre esse exercício na tela de
   execução, **Then** nenhuma imagem/GIF é exibida e nenhuma UI relacionada ao
   catálogo aparece — a tela se comporta como antes desta feature.
2. **Given** um exercício do treino em execução tem um nome parecido, mas não
   idêntico após normalização, a um exercício do catálogo (ex.: "Rosca direta" no
   treino vs. "Rosca direta com barra" no catálogo), **When** o usuário abre esse
   exercício, **Then** nenhuma imagem é exibida — o sistema nunca tenta aproximar
   nomes parecidos, mesmo critério de "tudo ou nada" já usado pelo RF08 (FR-006) para
   evitar uma unificação incorreta.

---

### Edge Cases

- O catálogo (spec 020) ainda não foi implementado, ou está vazio no momento da
  consulta → nenhuma imagem é exibida para nenhum exercício, tela se comporta como
  hoje — mesmo comportamento de "sem correspondência" (US2), não um estado de erro.
- Um exercício do treino em execução corresponde a mais de um exercício do catálogo
  (dados do catálogo com nomes duplicados após normalização) → fora do fluxo normal
  esperado, já que a curadoria do catálogo (spec 020) não prevê nomes duplicados;
  tratado como uma inconsistência de dados do catálogo, não desta feature — nesse
  caso hipotético, o sistema usa a primeira correspondência encontrada, sem quebrar a
  tela.
- O mesmo exercício (mesmo `exercicioId`) é reaberto várias vezes na mesma sessão de
  execução → a busca por correspondência no catálogo é feita normalmente a cada
  abertura (sem exigir que o resultado seja armazenado/persistido entre aberturas).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Ao abrir um exercício na tela de execução de treino (RF03/RF04), o
  sistema DEVE buscar, no catálogo interno de exercícios (spec 020), uma
  correspondência pelo nome do exercício.
- **FR-002**: A comparação de nomes para essa correspondência DEVE usar exatamente a
  mesma normalização já definida e implementada pelo RF08 (FR-006: remover espaços no
  início/fim, colapsar espaços internos múltiplos em um único espaço, ignorar
  diferença entre maiúsculas e minúsculas) — reaproveitando a função já existente
  (`normalizarNomeExercicio`), não uma regra nova ou separada.
- **FR-003**: A correspondência DEVE exigir igualdade exata dos nomes já normalizados
  — o sistema NÃO DEVE tentar aproximar, sugerir ou unificar nomes apenas parecidos
  (nenhuma comparação além da normalização de FR-002).
- **FR-004**: Quando houver correspondência, a tela de execução DEVE exibir a
  imagem/GIF associada a esse exercício no catálogo.
- **FR-005**: Quando NÃO houver correspondência, a tela de execução NÃO DEVE exibir
  nenhuma imagem, nenhum espaço reservado vazio, nem qualquer UI relacionada ao
  catálogo — o comportamento da tela permanece idêntico ao que já existe hoje, antes
  desta feature.
- **FR-006**: Esta feature NÃO DEVE oferecer nenhuma forma de o usuário escolher
  manualmente uma imagem/exercício do catálogo quando não há correspondência
  automática — nenhuma UI de seleção manual nesta rodada.
- **FR-007**: Esta feature aplica-se exclusivamente a exercícios de treinos
  importados via arquivo JSON (RF01/RF03/RF04) — não depende de, nem introduz,
  nenhuma funcionalidade de "Treino Customizado" (fora de escopo, spec 020).
- **FR-008**: Esta feature DEPENDE da spec 020 (catálogo interno de exercícios) já
  estar implementada — não é executável isoladamente sem um catálogo para consultar.

### Key Entities

- Nenhuma entidade nova é persistida. A correspondência descrita (FR-001-FR-003) é
  calculada em tempo de exibição, cruzando o nome de um `ExercicioPlanejado` (treino
  importado, RF01) com o nome de um Exercício de Catálogo (spec 020) — resultado não
  armazenado, recalculado a cada abertura do exercício na execução (ver Edge Cases).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos exercícios cujo nome normalizado corresponde exatamente a
  um exercício do catálogo, a imagem/GIF correspondente é exibida na execução.
- **SC-002**: Em 100% dos exercícios sem correspondência exata (incluindo nomes só
  parecidos), nenhuma imagem nem UI de catálogo aparece — a tela de execução se
  comporta de forma idêntica à versão anterior a esta feature.
- **SC-003**: Nenhuma sessão de execução de treino é bloqueada, atrasada ou alterada
  em seu fluxo de registro de séries por causa da busca de correspondência com o
  catálogo — a funcionalidade central de RF03/RF04 permanece inalterada.

## Assumptions

- **Sem cache/persistência do resultado da correspondência**: a busca é recalculada a
  cada vez que o exercício é aberto na execução — catálogo é estático e a operação é
  barata (comparação de string em uma lista curada e limitada), não há necessidade de
  otimização adicional nesta rodada (Princípio II, simplicidade).
- **Catálogo sem nomes duplicados, por construção**: assume-se que a curadoria da
  spec 020 não produz dois exercícios do catálogo com o mesmo nome normalizado; o
  Edge Case de duplicidade é tratado defensivamente (usa a primeira correspondência),
  não como um fluxo a testar extensivamente.
- **Sem indicação visual do "não encontrado"**: por decisão explícita do pedido
  ("se não houver, não exibir nada"), esta feature não inclui nenhuma mensagem tipo
  "imagem não disponível" — silêncio total é o comportamento esperado, não uma
  omissão.
