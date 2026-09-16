---

description: "Task list template for feature implementation"
---

# Tasks: Criar e Selecionar Perfil Local

**Input**: Design documents from `/specs/001-perfil-local/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/perfil-storage.md, quickstart.md

**Tests**: Não solicitados explicitamente na spec nem no plano; nenhuma tarefa de teste automatizado é gerada. Validação é manual, via quickstart.md, em Android e iOS (Princípio III da Constituição).

**Organization**: Tarefas agrupadas por user story (US1, US2, US3), na ordem de prioridade definida em spec.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência entre si)
- **[Story]**: A qual user story a tarefa pertence (US1, US2, US3)
- Caminhos de arquivo exatos incluídos em cada descrição

## Path Conventions

Projeto único mobile (Expo Router), conforme plan.md:
- `src/app/` — rotas file-based
- `src/components/` — componentes de UI
- `src/constants/` — constantes de domínio
- `src/hooks/` — hooks compartilhados
- `src/services/` — camada de acesso a dados (AsyncStorage)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar dependências e tipos de domínio compartilhados por todas as user stories

- [X] T001 Instalar `@react-native-async-storage/async-storage` e `expo-crypto` via `npx expo install @react-native-async-storage/async-storage expo-crypto` (garante versões compatíveis com Expo SDK 57, conforme research.md Decisão 2 e Decisão 3)
- [X] T002 [P] Criar tipos de domínio `Perfil`, `PerfisState`, `Sexo`, `ObjetivoTreino` em `src/types/perfil.ts`, conforme campos e tipos definidos em data-model.md (seção "Perfil" e "PerfisState")
- [X] T003 [P] Criar constantes `SEXO_OPCOES: Sexo[] = ["Masculino", "Feminino"]` e `OBJETIVO_OPCOES: ObjetivoTreino[] = ["Hipertrofia", "Emagrecimento", "Condicionamento", "Manutenção"]` em `src/constants/perfil.ts` (valores fixos de FR-002a e FR-002b)

**Checkpoint**: Dependência instalada e tipos/constantes de domínio disponíveis para todas as fases seguintes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Camada de persistência e hook de perfil ativo — infraestrutura obrigatória para todas as user stories

**⚠️ CRITICAL**: Nenhuma user story pode ser implementada antes desta fase estar completa

- [X] T004 Implementar leitura/escrita bruta do registro `perfis` no AsyncStorage em `src/services/perfil-storage.ts`: função interna de `getPerfisState()` (retorna `{ perfis: [], perfilAtivoId: null }` quando a chave `perfis` não existir) e `setPerfisState(state: PerfisState)`, conforme data-model.md (seção "PerfisState") e regra de estado inicial
- [X] T005 [US-shared] Implementar `listarPerfis(): Promise<Perfil[]>` em `src/services/perfil-storage.ts`, lendo `getPerfisState().perfis` (contrato em contracts/perfil-storage.md)
- [X] T006 Implementar `criarPerfil(dados: Omit<Perfil, 'id' | 'criadoEm'>): Promise<Perfil>` em `src/services/perfil-storage.ts`: valida que `nome`, `pesoKg`, `alturaCm`, `idade`, `sexo`, `objetivo` estão preenchidos e que `nome.trim()` não é vazio (FR-002, FR-003, Edge Case de espaços em branco); em caso de campo faltante, rejeita a promise indicando quais campos faltam; gera `id` único via `Crypto.randomUUID()` de `expo-crypto` (import `* as Crypto from 'expo-crypto'`; NÃO usar o `crypto.randomUUID()` global do JavaScript, que não é garantido no motor Hermes sem polyfill) e `criadoEm` (ISO 8601); adiciona à lista de `perfis` e define `perfilAtivoId` para o novo perfil (FR-004, FR-014)
- [X] T007 Implementar `obterPerfilAtivoId(): Promise<string | null>` em `src/services/perfil-storage.ts`, lendo `getPerfisState().perfilAtivoId`
- [X] T008 Implementar `existeSessaoEmAndamento(perfilId: string): Promise<boolean>` em `src/services/perfil-storage.ts`: lê a chave `sessoes:<perfilId>` do AsyncStorage; se a chave não existir, retorna `false`; caso exista, retorna `true` se houver algum registro com `finalizadaEm === null`, conforme contrato em contracts/perfil-storage.md e convenção de chaves em data-model.md
- [X] T009 Implementar `definirPerfilAtivo(perfilId: string): Promise<{ ok: true } | { ok: false; motivo: 'sessao_em_andamento' }>` em `src/services/perfil-storage.ts`: antes de trocar, chama `existeSessaoEmAndamento` para o `perfilAtivoId` atual; se `true`, retorna `{ ok: false, motivo: 'sessao_em_andamento' }` sem alterar o estado (FR-009, FR-010); caso contrário, atualiza `perfilAtivoId` para o novo valor e retorna `{ ok: true }`
- [X] T010 Criar hook `usePerfilAtivo()` em `src/hooks/use-perfil-ativo.ts`, expondo `perfilAtivo: Perfil | null`, `perfis: Perfil[]`, `carregando: boolean`, e funções `criarPerfil`, `selecionarPerfil` (encapsulando `definirPerfilAtivo` e re-consultando a lista/estado ativo), consumido pelas telas de todas as user stories

**Checkpoint**: Camada de persistência e hook de perfil ativo prontos — implementação das user stories pode começar.

---

## Phase 3: User Story 1 - Criar o primeiro perfil ao abrir o app (Priority: P1) 🎯 MVP

**Goal**: Ao abrir o app pela primeira vez (nenhum perfil salvo), exibir o formulário de criação de perfil antes de qualquer outra tela; ao salvar com todos os campos obrigatórios preenchidos, tornar o perfil ativo e navegar para a lista de treinos.

**Independent Test**: Instalar o app sem dados de perfil salvos, abrir, preencher o formulário com todos os campos e confirmar que o app navega para a lista de treinos com o perfil recém-criado ativo (ver quickstart.md, cenário 1).

### Implementation for User Story 1

- [X] T011 [P] [US1] Criar componente de formulário `PerfilForm` em `src/components/perfil/perfil-form.tsx`, com campos controlados para `nome` (texto), `pesoKg` (numérico), `alturaCm` (numérico), `idade` (numérico), `sexo` (seleção entre `SEXO_OPCOES`), `objetivo` (seleção entre `OBJETIVO_OPCOES`); recebe `onSubmit(dados)` e `submitting: boolean` como props
- [X] T012 [US1] Implementar validação de campos obrigatórios no `PerfilForm` (`src/components/perfil/perfil-form.tsx`): impedir submissão enquanto `nome` (após trim), `pesoKg`, `alturaCm`, `idade`, `sexo` ou `objetivo` estiverem vazios/não preenchidos, exibindo mensagem indicando quais campos faltam (FR-002, FR-003) — depende de T011
- [X] T013 [US1] Criar rota `src/app/perfil/criar.tsx`: renderiza `PerfilForm`; no `onSubmit`, chama `criarPerfil` do hook `usePerfilAtivo` (T010); em caso de sucesso, navega (via `router.replace`) para a rota principal de treinos (`/`, ou equivalente já existente em `src/app/index.tsx`) — depende de T010, T011, T012
- [X] T014 [US1] Atualizar `src/app/_layout.tsx` para, ao carregar, consultar `usePerfilAtivo()`: enquanto `carregando`, manter a splash/overlay existente (`AnimatedSplashOverlay`); se não houver nenhum perfil (`perfis.length === 0`), redirecionar para `/perfil/criar` antes de renderizar as tabs (FR-001) — depende de T010, T013

**Checkpoint**: Um usuário sem perfis consegue criar seu primeiro perfil e chegar à lista de treinos. User Story 1 funcional e testável de forma independente.

---

## Phase 4: User Story 2 - Selecionar perfil existente e criar perfis adicionais (Priority: P2)

**Goal**: Quando já existem perfis salvos, exibir uma lista de seleção (em vez do formulário de criação) ao abrir o app, com opção clara para criar mais um perfil.

**Independent Test**: Com dois ou mais perfis previamente criados, reabrir o app e verificar que a lista de seleção aparece, que é possível escolher qualquer perfil existente, e que a opção "Criar novo perfil" leva ao formulário de criação (ver quickstart.md, cenário 2).

### Implementation for User Story 2

- [X] T015 [P] [US2] Criar componente `PerfilListItem` em `src/components/perfil/perfil-list-item.tsx`, exibindo `nome`, e dados de resumo do perfil (ex.: objetivo), recebendo `onPress` como prop
- [X] T016 [US2] Criar rota `src/app/perfil/selecionar.tsx`: usa `usePerfilAtivo()` (T010) para listar `perfis` com `PerfilListItem` (T015); ao tocar em um perfil, chama `selecionarPerfil(id)`; inclui um item/botão "Criar novo perfil" que navega para `/perfil/criar` (FR-006, FR-007) — depende de T010, T013, T015
- [X] T017 [US2] Atualizar `src/app/_layout.tsx` para redirecionar para `/perfil/selecionar` (em vez de `/perfil/criar`) quando já existir ao menos um perfil salvo (`perfis.length > 0`) e nenhuma seleção explícita de perfil ativo tiver ocorrido ainda nesta sessão do app — depende de T014, T016

**Checkpoint**: Usuários com múltiplos perfis conseguem selecionar entre eles ou criar mais um. User Stories 1 e 2 funcionam de forma independente.

---

## Phase 5: User Story 3 - Trocar o perfil ativo a qualquer momento, exceto durante um treino em andamento (Priority: P1)

**Goal**: Permitir a troca de perfil ativo livremente quando não há sessão de treino em andamento vinculada ao perfil ativo, e bloquear essa troca (com aviso) quando houver.

**Independent Test**: Sem sessão em andamento, trocar de perfil e confirmar que as telas dependentes atualizam imediatamente; simular uma sessão em andamento (registro manual em `sessoes:<perfil_id>` com `finalizadaEm: null`, já que RF07 ainda não existe) e confirmar que a troca é bloqueada com aviso (ver quickstart.md, cenário 3).

### Implementation for User Story 3

- [X] T018 [US3] Adicionar ponto de entrada de troca de perfil ativo em `src/app/perfil/selecionar.tsx` (reaproveitando T016): ao tocar em um perfil diferente do ativo enquanto já existe um perfil ativo definido, chamar `selecionarPerfil(id)`; se o retorno for `{ ok: false, motivo: 'sessao_em_andamento' }`, exibir um aviso (ex.: `Alert.alert`) explicando que é necessário finalizar a sessão atual antes de trocar, sem navegar (FR-009, FR-010) — depende de T009, T016
- [X] T019 [US3] Adicionar controle de acesso à tela `src/app/perfil/selecionar.tsx` a partir das tabs principais (ex.: botão/ação em `src/app/index.tsx` ou `src/app/explore.tsx` que navegue para `/perfil/selecionar`), permitindo a troca de perfil a qualquer momento durante o uso do app, não apenas na abertura — depende de T016
- [X] T020 [US3] Garantir que hooks/telas dependentes de perfil (`usePerfilAtivo`, rotas de treinos existentes) reconsultem `perfilAtivo` sempre que ele mudar (ex.: já coberto se `usePerfilAtivo` expõe estado reativo consumido diretamente pelas telas), de forma que a troca de perfil ativo reflita imediatamente sem fechar/reabrir o app (FR-011) — depende de T010, T018

**Checkpoint**: Troca de perfil ativo funciona livremente fora de sessão em andamento e é bloqueada corretamente durante uma sessão em andamento. Todas as três user stories funcionam de forma independente e em conjunto.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Ajustes finais que atravessam as três user stories

- [X] T021 [P] Revisar mensagens de erro/validação do `PerfilForm` (`src/components/perfil/perfil-form.tsx`) e do aviso de bloqueio de troca (`src/app/perfil/selecionar.tsx`) para garantir textos claros e consistentes em português, conforme tom do restante do app
- [X] T022 Executar manualmente todos os cenários de `quickstart.md` no Redmi Note 12 (Android 12+) via Expo Go. Resultado: Cenários 1, 2 e 3 (parte sem sessão em andamento) PASS. Cenário 3b (bloqueio de troca com sessão em andamento) permanece não validado nesta rodada por depender de RF07 (sessão de treino), ainda não implementado.
- [X] T023 Executar manualmente todos os cenários de `quickstart.md` no iPhone 16 Plus (iOS 17+) via Expo Go. Resultado: Cenário 1 (formulário exibido primeiro, validação de campos obrigatórios, criação de perfil) PASS; Cenário 2 (segundo perfil criado e listado corretamente na tela de seleção) PASS; Cenário 3 (troca de perfil ativo) PASS.
- [X] T024 Revisar todo o código desta feature confirmando ausência de `any` implícito e type-check limpo (`npx tsc --noEmit`), conforme Princípio I da Constituição
- [X] T025 Confirmar, por inspeção de código, que nenhuma chave AsyncStorage de dado dependente de perfil introduzida nesta feature (`sessoes:<perfil_id>`, referenciada em T008) viola o padrão `<dominio>:<perfil_id>` exigido pelo Princípio V da Constituição

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: Depende da conclusão do Setup — BLOQUEIA todas as user stories
- **User Story 1 (Phase 3)**: Depende da conclusão do Foundational
- **User Story 2 (Phase 4)**: Depende da conclusão do Foundational; T016/T017 também dependem de T013/T014 (User Story 1), pois reaproveitam a rota de criação de perfil e o redirecionamento do `_layout.tsx`
- **User Story 3 (Phase 5)**: Depende da conclusão do Foundational; T018/T019 dependem de T016 (User Story 2), pois estendem a tela de seleção de perfis
- **Polish (Phase 6)**: Depende da conclusão das User Stories 1, 2 e 3

### User Story Dependencies

- **User Story 1 (P1)**: Independente na lógica de negócio, mas fisicamente reutiliza o mesmo `_layout.tsx` e rota `criar.tsx` que User Story 2 estende — implementar primeiro.
- **User Story 2 (P2)**: Estende a rota `criar.tsx` (US1) com a tela `selecionar.tsx`; não pode ser testada de forma significativa sem US1 já existir (é necessário conseguir criar ao menos um perfil primeiro).
- **User Story 3 (P1)**: Estende a tela `selecionar.tsx` (US2) com a lógica de bloqueio; para testar de ponta a ponta a simulação de sessão em andamento, depende de US1 e US2 já estarem implementadas.

> Nota: apesar de US3 ter prioridade P1 na spec (mesma prioridade de US1), sua implementação depende estruturalmente de US2 (tela de seleção de perfis), pois é o ponto de entrada onde a troca de perfil ocorre. A ordem de implementação sugerida é US1 → US2 → US3.

### Parallel Opportunities

- T002 e T003 (Phase 1) podem rodar em paralelo — arquivos diferentes, sem dependência entre si
- T011 (Phase 3) pode começar em paralelo com as tarefas T004–T009 da Fase 2, desde que T013 só integre `criarPerfil` depois que T006/T010 estiverem prontos
- T015 (Phase 4) pode ser desenvolvido em paralelo com o restante da Fase 3, desde que T016 só seja finalizada após T013

---

## Parallel Example: Setup + Foundational

```bash
# Fase 1 — em paralelo:
Task: "Criar tipos de domínio em src/types/perfil.ts"
Task: "Criar constantes SEXO_OPCOES/OBJETIVO_OPCOES em src/constants/perfil.ts"

# Fase 3 — componente de UI pode ser adiantado em paralelo à Fase 2:
Task: "Criar componente PerfilForm em src/components/perfil/perfil-form.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloqueia todas as user stories)
3. Completar Phase 3: User Story 1
4. **PARAR e VALIDAR**: testar a criação do primeiro perfil de forma independente (quickstart.md, cenário 1)
5. Este é o MVP mínimo que satisfaz FR-001 a FR-005, FR-012 a FR-014

### Incremental Delivery

1. Setup + Foundational → base pronta
2. User Story 1 → validar independentemente → primeiro perfil funcional (MVP)
3. User Story 2 → validar independentemente → múltiplos perfis e seleção
4. User Story 3 → validar independentemente → troca de perfil com bloqueio por sessão em andamento
5. Polish → validação manual completa em Android e iOS

---

## Notes

- [P] tasks = arquivos diferentes, sem dependência entre si
- [Story] label mapeia a tarefa à user story correspondente para rastreabilidade
- Nenhuma tarefa de teste automatizado foi gerada — não solicitado na spec; validação é manual via quickstart.md (Princípio III da Constituição)
- Restrições de campo (data-model.md) foram citadas literalmente nas tarefas de validação (T006, T012) para não deixar a implementação a critério da IA
- A tarefa T008 implementa apenas a **leitura** de `sessoes:<perfil_id>`; a escrita de sessões é escopo de RF07 (fora desta feature)
