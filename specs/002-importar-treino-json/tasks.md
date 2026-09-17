---

description: "Task list template for feature implementation"
---

# Tasks: Importar Treino via Arquivo JSON

**Input**: Design documents from `/specs/002-importar-treino-json/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/treino-storage.md, quickstart.md

**Tests**: Não solicitados explicitamente na spec nem no plano; nenhuma tarefa de teste automatizado é gerada. Validação é manual, via quickstart.md, em Android e iOS (Princípio III da Constituição), mesma abordagem usada no RF10.

**Organization**: Tarefas agrupadas por user story (US1, US2, US3, US4), na ordem de prioridade definida em spec.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência entre si)
- **[Story]**: A qual user story a tarefa pertence (US1, US2, US3, US4)
- Caminhos de arquivo exatos incluídos em cada descrição

## Path Conventions

Projeto único mobile (Expo Router), conforme plan.md — mesma estrutura do RF10:
- `src/app/(tabs)/` — rotas file-based existentes (ponto de entrada temporário da ação de importar, até o RF02 existir)
- `src/types/` — tipos de domínio
- `src/services/` — camada de acesso a dados (AsyncStorage)
- `src/hooks/use-perfil-ativo.tsx` — já existente (RF10), reaproveitado sem modificação
- `assets/exemplos/` — arquivo de exemplo embutido no bundle do app

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar dependências, tipos de domínio e o arquivo de exemplo embutido

- [X] T001 Instalar `expo-document-picker` via `npx expo install expo-document-picker` (garante versão compatível com Expo SDK 57, conforme research.md Decisão 1). Nota pós-implementação: `expo-file-system` foi avaliada para a leitura do conteúdo do arquivo (Decisão 2 original), mas removida após falhas em runtime no dispositivo físico — a leitura usa `fetch(uri).text()` (ver research.md, Decisão 2, tentativas 1–4)
- [X] T002 [P] Criar tipos `Treino`, `ExercicioPlanejado`, `ResultadoImportacao`, `TreinosPorPerfilState` em `src/types/treino.ts`, conforme campos e tipos definidos em data-model.md (seções "Treino", "ExercicioPlanejado", "ResultadoImportacao", "TreinosPorPerfilState")
- [X] T003 [P] Copiar `docs/exemplos/treino-exemplo.json` para `assets/exemplos/treino-exemplo.json`, tornando-o um asset embutido no bundle do app (satisfaz FR-009: "disponibilizar, embutido no app, um arquivo de treino de exemplo")

**Checkpoint**: Dependências instaladas, tipos de domínio e asset de exemplo disponíveis para todas as fases seguintes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Camada de persistência básica e funções de validação puras — infraestrutura obrigatória para todas as user stories

**⚠️ CRITICAL**: Nenhuma user story pode ser implementada antes desta fase estar completa

- [X] T004 Implementar leitura/escrita bruta da chave `treinos:<perfilId>` em `src/services/treino-storage.ts`: função interna `getTreinosState(perfilId: string)` (retorna `{ treinos: [] }` quando a chave não existir) e `setTreinosState(perfilId: string, state: TreinosPorPerfilState)`, conforme data-model.md (seção "TreinosPorPerfilState") e a convenção de chave já reservada pelo RF10
- [X] T005 Implementar `listarTreinos(perfilId: string): Promise<Treino[]>` em `src/services/treino-storage.ts`, lendo `getTreinosState(perfilId).treinos` (contrato em contracts/treino-storage.md) — depende de T004
- [X] T006 [P] Implementar `validarExercicio(bruto: unknown)` em `src/services/treino-storage.ts`: função pura que valida se `bruto` tem `id` (string não vazia), `nome` (string não vazia), `series` (MUST ser `number`, não `string`), `reps_alvo` (string não vazia, mapeado para o campo `repsAlvo`), `carga_sugerida_kg` (MUST ser `number`, mapeado para `cargaSugeridaKg`) e `descanso_seg` (MUST ser `number`, mapeado para `descansoSeg`); retorna o `ExercicioPlanejado` válido em caso de sucesso, ou um motivo de rejeição em caso de falha — nenhum campo ausente ou com tipo incorreto pode passar (FR-005, data-model.md seção "ExercicioPlanejado")
- [X] T007 [P] Implementar `validarEstruturaTreino(bruto: unknown)` em `src/services/treino-storage.ts`: função pura que valida se `bruto` tem `nome` (string não vazia após `trim()`) e `exercicios` (lista não vazia); retorna a estrutura mínima válida (nome e lista bruta de exercícios) em caso de sucesso, ou um motivo de rejeição em caso de falha (FR-007, FR-008, data-model.md seção "Treino")

**Checkpoint**: Camada de persistência e funções de validação prontas — implementação das user stories pode começar.

---

## Phase 3: User Story 1 - Importar um treino válido para o perfil ativo (Priority: P1) 🎯 MVP

**Goal**: Um usuário com perfil ativo consegue abrir o seletor de arquivos do sistema, escolher um `.json` de treino válido (ou o arquivo de exemplo embutido), e ter esse treino importado e associado ao perfil ativo no momento da importação.

**Independent Test**: Selecionar um arquivo JSON válido (seguindo o schema do PRD) através do seletor de arquivos e confirmar que o treino resultante fica associado ao perfil ativo, com todos os exercícios e seus dados planejados intactos (ver quickstart.md, cenário 1).

### Implementation for User Story 1

- [X] T008 [US1] Implementar `importarTreino(perfilId: string): Promise<ResultadoImportacao | null>` em `src/services/treino-storage.ts`: abre o seletor de arquivos via `expo-document-picker` restrito a JSON; se o usuário cancelar a seleção, retorna `null` sem qualquer efeito colateral (FR-011); lê o conteúdo do arquivo selecionado via `fetch(uri).text()`; tenta `JSON.parse` sobre o texto lido; chama `validarEstruturaTreino` (T007); se a estrutura mínima for válida, aplica `validarExercicio` (T006) a cada item de `exercicios`, monta um `Treino` (`id` via `Crypto.randomUUID()`, `perfilId` recebido como parâmetro, `nome` trimado, apenas os `ExercicioPlanejado` válidos, `importadoEm` em ISO 8601) e persiste via `setTreinosState` (T004), acrescentando à lista já existente sem removê-la (FR-002, FR-003, FR-010) — depende de T004, T006, T007
- [X] T009 [US1] Implementar `importarTreinoExemplo(perfilId: string): Promise<ResultadoImportacao>` em `src/services/treino-storage.ts`, carregando o conteúdo do asset embutido `assets/exemplos/treino-exemplo.json` (T003) e reaproveitando o mesmo caminho de validação e persistência usado por `importarTreino` (FR-009) — depende de T003, T008
- [X] T010 [US1] Adicionar as ações "Importar treino" e "Importar treino de exemplo" em `src/app/(tabs)/index.tsx`: obter `perfilAtivo` via `usePerfilAtivo()` (hook já existente do RF10, sem modificações); ao acionar, chamar `importarTreino(perfilAtivo.id)` ou `importarTreinoExemplo(perfilAtivo.id)`; exibir uma confirmação de sucesso quando `resultado` não é `null` e `resultado.treino` não é `null` — depende de T008, T009

**Checkpoint**: Um usuário com perfil ativo consegue importar um treino válido (próprio ou o de exemplo) com sucesso. User Story 1 funcional e testável de forma independente.

---

## Phase 4: User Story 2 - Isolamento de treinos importados por perfil (Priority: P1)

**Goal**: Um treino importado por um perfil nunca é exibido, listado ou acessível a partir de outro perfil no mesmo aparelho.

**Independent Test**: Importar um treino com o Perfil A ativo, trocar para o Perfil B (RF10) e confirmar que o treino de A não é acessível a partir de B; trocar de volta para A e confirmar que o treino continua íntegro (ver quickstart.md, cenário 2).

### Implementation for User Story 2

- [X] T011 [US2] Garantir que o `id` de cada `Treino` seja gerado via `Crypto.randomUUID()` (mesmo padrão de geração de id usado para `Perfil` no RF10, ver `src/services/perfil-storage.ts`) dentro de `importarTreino()` (`src/services/treino-storage.ts`), garantindo unicidade global entre perfis, não apenas dentro da lista de um único perfil — depende de T008
- [X] T012 [US2] Confirmar, por inspeção de código, que `listarTreinos` (T005), `importarTreino` e `importarTreinoExemplo` (T008, T009) são os únicos pontos de acesso às chaves `treinos:*` em `src/services/treino-storage.ts`, e que todos exigem `perfilId` como parâmetro explícito obrigatório, sem valor padrão, sem leitura implícita de um "perfil atual" global e sem importar `usePerfilAtivo()` dentro da camada de serviço (Princípio V; contrato "Ponto de integração com o perfil ativo" em contracts/treino-storage.md) — depende de T005, T008, T009

**Checkpoint**: Isolamento de treinos por perfil garantido estruturalmente pelo design da camada de serviço. User Stories 1 e 2 funcionam de forma independente.

---

## Phase 5: User Story 3 - Importação parcial: erro isolado em um exercício não bloqueia o restante (Priority: P2)

**Goal**: Quando um arquivo de treino tem um exercício com campo obrigatório ausente ou tipo incorreto, o restante do treino é importado normalmente e o usuário é avisado sobre o(s) exercício(s) ignorado(s).

**Independent Test**: Importar um arquivo JSON com um exercício inválido entre outros válidos (ex.: `docs/exemplos/treino-exemplo-com-erro.json`) e confirmar que os exercícios válidos aparecem no treino importado, que o inválido não aparece, e que uma mensagem informa o problema (ver quickstart.md, cenário 3).

### Implementation for User Story 3

- [X] T013 [US3] Estender `src/app/(tabs)/index.tsx` para exibir, após uma importação bem-sucedida, uma mensagem informando que o treino foi importado de forma incompleta sempre que `resultado.exerciciosIgnorados.length > 0`, identificando cada exercício ignorado pelo índice ou nome (quando disponível) e o motivo (FR-006) — depende de T008, T010

**Checkpoint**: Um arquivo com erro parcial em um exercício resulta em importação bem-sucedida dos demais exercícios, com aviso claro ao usuário. User Stories 1, 2 e 3 funcionam de forma independente.

---

## Phase 6: User Story 4 - Arquivo inválido é rejeitado sem importar nada (Priority: P2)

**Goal**: Um arquivo que não é JSON sintaticamente válido, ou que não tem a estrutura mínima de um treino (nome e ao menos um exercício válido), é rejeitado por completo, sem criar nenhum treino.

**Independent Test**: Selecionar um arquivo com erro de sintaxe JSON (ou um arquivo de outro formato renomeado para `.json`) e confirmar que nenhum treino é adicionado e que uma mensagem de erro clara é exibida (ver quickstart.md, cenário 4).

### Implementation for User Story 4

- [X] T014 [US4] Garantir que `importarTreino()` (`src/services/treino-storage.ts`) capture erros de `JSON.parse` em um bloco try/catch e retorne `{ treino: null, exerciciosIgnorados: [], erro: <mensagem> }` quando o arquivo selecionado não for um JSON sintaticamente válido (FR-007) — depende de T008
- [X] T015 [US4] Garantir que `importarTreino()` (`src/services/treino-storage.ts`) retorne `{ treino: null, exerciciosIgnorados: [], erro: <mensagem> }` quando `validarEstruturaTreino` (T007) falhar, ou quando, após aplicar `validarExercicio` (T006) a todos os itens de `exercicios`, nenhum exercício válido restar (Edge Case: "todos os exercícios inválidos") (FR-008) — depende de T006, T007, T008
- [X] T016 [US4] Estender `src/app/(tabs)/index.tsx` para exibir `resultado.erro` como mensagem de erro clara quando presente, sem adicionar nenhum treino à lista nesse caso (FR-007, FR-008) — depende de T008, T010, T014, T015

**Checkpoint**: Arquivos inválidos (sintaticamente ou estruturalmente) são rejeitados por completo, com mensagem de erro clara. Todas as quatro user stories funcionam de forma independente e em conjunto.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Ajustes finais que atravessam as quatro user stories

- [X] T017 [P] Revisar as mensagens de sucesso, aviso de importação parcial e erro exibidas em `src/app/(tabs)/index.tsx` (T010, T013, T016) para garantir textos claros e consistentes em português, conforme tom do restante do app
- [X] T018 [P] Rodar type-check (`npx tsc --noEmit`) confirmando ausência de `any` implícito em todo o código desta feature, conforme Princípio I da Constituição
- [X] T019 [P] Confirmar, por inspeção de código, que nenhuma chave AsyncStorage introduzida nesta feature é lida ou escrita fora do padrão `treinos:<perfil_id>` exigido pelo Princípio V da Constituição
- [X] T020 Executar manualmente todos os cenários de `quickstart.md` (1 a 4, mais o cenário de cancelamento) no Redmi Note 12 (Android 12+) via Expo Go. Resultado: todos os cenários PASS (importação de arquivo real e do exemplo embutido, isolamento por perfil, importação parcial com aviso, rejeição de arquivo inválido, cancelamento sem erro). Durante a validação, foi descoberto e corrigido um bug de leitura de arquivo: `expo-file-system` (em suas três formas — API de classes, export principal, `/legacy`) falhava em runtime no dispositivo físico ao ler o URI retornado por `expo-document-picker`; a solução estável foi usar `fetch(uri).text()`, e `expo-file-system` foi removida do projeto (ver research.md, Decisão 2)
- [X] T021 Executar manualmente todos os cenários de `quickstart.md` (1 a 4, mais o cenário de cancelamento) no iPhone 16 Plus (iOS 17+) via Expo Go. Resultado: todos os cenários PASS, confirmados pelo usuário em 2026-09-16 — importação de treino válido, importação parcial com alerta de erro do arquivo (exercício inválido ignorado, restante importado com aviso), cancelamento da seleção de arquivo sem erro, e listagem/diferenciação por horário de treinos com nome duplicado

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: Depende da conclusão do Setup — BLOQUEIA todas as user stories
- **User Story 1 (Phase 3)**: Depende da conclusão do Foundational
- **User Story 2 (Phase 4)**: Depende da conclusão do Foundational; T011/T012 também dependem de T005, T008, T009 (User Story 1), pois reforçam/verificam código já escrito nela
- **User Story 3 (Phase 5)**: Depende da conclusão do Foundational; T013 depende de T008/T010 (User Story 1), pois estende o mesmo ponto de entrada de UI
- **User Story 4 (Phase 6)**: Depende da conclusão do Foundational; T014/T015/T016 dependem de T006/T007/T008/T010 (User Stories 1 e a validação da Fase 2)
- **Polish (Phase 7)**: Depende da conclusão das User Stories 1, 2, 3 e 4

### User Story Dependencies

- **User Story 1 (P1)**: Implementa o núcleo da importação (`importarTreino`, `importarTreinoExemplo`) e o ponto de entrada de UI — implementar primeiro; as demais stories estendem esse mesmo código.
- **User Story 2 (P1)**: Reforça e verifica a garantia de isolamento por perfil já embutida no design de `importarTreino()` (parâmetro `perfilId` obrigatório) — não introduz nova UI, apenas endurece/confirma o contrato já criado em US1.
- **User Story 3 (P2)**: Estende a UI de US1 para reportar exercícios ignorados; a lógica de validação parcial em si (`validarExercicio`) já existe desde a Fase 2 (Foundational), pois `importarTreino()` (US1) já precisa dela para funcionar mesmo no caminho feliz.
- **User Story 4 (P2)**: Estende `importarTreino()` (US1) e a UI para tratar os dois casos de rejeição total (JSON sintaticamente inválido; estrutura mínima ausente).

> Nota: assim como no RF10, embora as quatro user stories tenham prioridades próprias na spec, elas compartilham a mesma função de serviço central (`importarTreino()`), construída incrementalmente a partir da Fase 2 (validação) e da Fase 3/US1 (orquestração). A ordem de implementação recomendada é US1 → US2 → US3 → US4, mas os artefatos de cada fase (validação, persistência) já existem desde a Fase 2.

### Parallel Opportunities

- T002 e T003 (Phase 1) podem rodar em paralelo — arquivos diferentes, sem dependência entre si
- T006 e T007 (Phase 2) podem rodar em paralelo — funções puras independentes, ambas em `treino-storage.ts` mas sem overlap de lógica
- T017, T018 e T019 (Phase 7) podem rodar em paralelo — revisões independentes sobre artefatos já finalizados

---

## Parallel Example: Foundational

```bash
# Fase 2 — em paralelo:
Task: "Implementar validarExercicio em src/services/treino-storage.ts"
Task: "Implementar validarEstruturaTreino em src/services/treino-storage.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloqueia todas as user stories)
3. Completar Phase 3: User Story 1
4. **PARAR e VALIDAR**: testar a importação de um treino válido (e do arquivo de exemplo) de forma independente (quickstart.md, cenário 1)
5. Este é o MVP mínimo que satisfaz FR-001, FR-002, FR-003, FR-009, FR-010, FR-011

### Incremental Delivery

1. Setup + Foundational → base pronta (persistência + validação)
2. User Story 1 → validar independentemente → importação de treino válido funcional (MVP)
3. User Story 2 → validar independentemente → isolamento por perfil confirmado
4. User Story 3 → validar independentemente → importação parcial com aviso ao usuário
5. User Story 4 → validar independentemente → rejeição total de arquivos inválidos
6. Polish → validação manual completa em Android e iOS

---

## Notes

- [P] tasks = arquivos diferentes ou funções puras independentes, sem dependência entre si
- [Story] label mapeia a tarefa à user story correspondente para rastreabilidade
- Nenhuma tarefa de teste automatizado foi gerada — não solicitado na spec; validação é manual via quickstart.md (Princípio III da Constituição), mesmo padrão do RF10
- Restrições de campo (data-model.md) foram citadas literalmente nas tarefas de validação (T006, T007) para não deixar a implementação a critério da IA
- `importarTreino()` e `importarTreinoExemplo()` não importam `usePerfilAtivo()` diretamente — o `perfilId` é sempre recebido como parâmetro explícito, preservando a separação entre camada de serviço (persistência pura) e camada de hook (estado de React), conforme já estabelecido pelo RF10
- O ponto de entrada de UI em `src/app/(tabs)/index.tsx` é temporário, conforme registrado em research.md (Decisão 4) e no Complexity Tracking de plan.md; deverá ser revisitado quando o RF02 (lista de treinos) for planejado e implementado
