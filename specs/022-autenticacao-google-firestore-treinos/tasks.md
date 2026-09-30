---

description: "Task list template for feature implementation"
---

# Tasks: Autenticação Google + Firestore para Treinos

**Input**: Design documents from `/specs/022-autenticacao-google-firestore-treinos/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem tasks de teste automatizado — não solicitado na spec (Constitution v2.0.0, Princípio III: validação manual em Android/iOS via `quickstart.md`, não framework de testes).

**Organização**: Tasks agrupadas por user story (spec.md). Esta é uma feature de
**migração** (RF10 → autenticação; RF01/RF02 → Firestore), não green-field — por
isso a fase Foundational é estritamente **aditiva** (cria o novo sem remover o
antigo) e a remoção dos arquivos/tipos antigos só acontece na fase final de
Polish, depois que **todos** os 7 consumidores de `usePerfilAtivo()` (levantamento
exaustivo em `plan.md`) tiverem sido migrados — nunca antes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: A qual user story esta task pertence (US1-US4)
- Caminhos de arquivo exatos em cada descrição

---

## Phase 1: Setup

**Purpose**: Registrar dependências novas e preparar infraestrutura externa
(Firebase) antes de qualquer código.

- [X] T001 Atualizar `docs/PRD-app-treino.md`: (a) registrar as novas
      dependências `@react-native-firebase/app`, `@react-native-firebase/auth`,
      `@react-native-firebase/firestore` e `@react-native-google-signin/google-signin`
      na seção de stack/dependências (Constitution v2.0.0, Princípio IV); (b)
      RNF02 — acrescentar a exceção de rede para login/logout (spec.md,
      Assumptions); (c) RNF05 — remover/corrigir a afirmação de que perfis não
      têm autenticação; (d) seção 5 (Não-objetivos) — remover os itens "Login,
      senha ou autenticação real" e "Sincronização de perfis/dados entre
      aparelhos" (spec.md, Assumptions: esta feature os torna escopo real).
- [X] T002 [P] Instalar `@react-native-firebase/app`, `@react-native-firebase/auth`,
      `@react-native-firebase/firestore` e `@react-native-google-signin/google-signin`
      em `package.json` (research.md, Decisões 1-2).
- [X] T003 Adicionar os plugins nativos `@react-native-firebase/app` e
      `@react-native-google-signin/google-signin` em `app.json` (depende de
      T002).
- [ ] T004 **(passo manual, fora do código)** Configurar o projeto Firebase:
      habilitar Firestore e Authentication (provedor Google); registrar os apps
      Android (`com.shapefit.app`) e iOS (`com.shapefit.app`, ver `app.json`);
      colocar `google-services.json` e `GoogleService-Info.plist` na raiz do
      projeto (`quickstart.md`, Pré-requisitos 1-2).
- [ ] T005 **(passo manual, fora do código)** Publicar a regra de segurança de
      `contracts/firestore-rules.md` como `firestore.rules` no projeto Firebase
      — antes de qualquer teste com dados reais (`quickstart.md`, Pré-requisito
      3; depende de T004).
- [ ] T006 **(passo manual, fora do código)** Gerar um novo build de
      development client (perfil `development` do EAS) incluindo os módulos
      nativos instalados em T002/T003 — necessário para testar qualquer parte
      desta feature em aparelho (`quickstart.md`, Pré-requisito 4; depende de
      T003).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Criar as peças novas (tipos, serviço de conta, hook de auth) sem
remover nada do sistema antigo ainda — o antigo continua funcionando até cada
consumidor ser migrado nas fases seguintes.

**⚠️ CRITICAL**: Nenhuma user story começa antes desta fase estar completa.

- [ ] T007 [P] Em `src/types/perfil.ts`: adicionar o tipo `DadosFisicos = { nome: string; pesoKg: number; alturaCm: number; idade: number; sexo: Sexo; objetivo: ObjetivoTreino; criadoEm: string }`
      (`data-model.md`, `users/{uid}`), reaproveitando `Sexo` e `ObjetivoTreino`
      já existentes no mesmo arquivo **sem alterá-los**. Não remover `Perfil`/
      `PerfisState` ainda (fase de Polish, T023).
- [ ] T008 [P] Criar `src/services/conta-storage.ts` com `obterDadosFisicos(uid: string): Promise<DadosFisicos | null>`
      e `salvarDadosFisicos(uid: string, dados: DadosFisicos): Promise<void>`,
      lendo/escrevendo o documento `users/{uid}` no Firestore
      (`contracts/conta-storage.md`). Não toca em `perfil-storage.ts`.
- [ ] T009 Criar `src/hooks/use-conta-autenticada.tsx` com
      `ContaAutenticadaProvider`/`useContaAutenticada()` expondo `{ uid,
      contaAutenticada, carregando, temDadosFisicos, entrarComGoogle,
      sairDaConta }` (`contracts/use-conta-autenticada.md`) — `entrarComGoogle`
      usa `@react-native-google-signin/google-signin` + `GoogleAuthProvider.credential`
      + `signInWithCredential` (research.md, Decisão 2); `sairDaConta` chama
      `auth().signOut()`; ao autenticar, chama `conta-storage.obterDadosFisicos`
      (T008) para preencher `temDadosFisicos` (depende de T008).
- [ ] T010 [P] Em `src/types/treino.ts`: remover o campo `perfilId` do tipo
      `Treino` — a segregação por conta passa a ser o caminho do documento
      Firestore (`users/{uid}/treinos/*`), não um campo interno
      (`data-model.md`).

**Checkpoint**: infraestrutura nova pronta; nada do sistema antigo foi tocado
ainda — o app continua funcionando exatamente como antes desta feature até a
Phase 3.

---

## Phase 3: User Story 1 - Entrar no app com a Conta Google (Priority: P1) 🎯 MVP

**Goal**: Ao abrir o app sem sessão ativa, exibir a tela de login (só Google);
ao autenticar com sucesso, o app avança.

**Independent Test**: Abrir o app sem sessão ativa, confirmar que só a tela de
login aparece, completar o login e confirmar que o app avança (nota: para ver
o avanço completo até a lista de treinos, esta story depende de US2 estar
implementada também — ver "User Story Dependencies" abaixo; testável
isoladamente até o ponto de "login bem-sucedido").

### Implementation for User Story 1

- [ ] T011 [US1] Criar `src/app/login.tsx`: tela com um único botão "Entrar com
      o Google", chamando `useContaAutenticada().entrarComGoogle()`; em caso de
      falha/cancelamento, exibir mensagem de erro e permanecer na tela (FR-004,
      Acceptance Scenario 3 da User Story 1) — depende de T009.
- [ ] T012 [US1] Alterar `src/app/_layout.tsx`: trocar `PerfilAtivoProvider`/
      `usePerfilAtivo()` por `ContaAutenticadaProvider`/`useContaAutenticada()`
      no `RootNavigator` — gate conforme `contracts/use-conta-autenticada.md`:
      `carregando` → não renderiza nada; sem conta → `Redirect` para `/login`;
      com conta e `temDadosFisicos === null` → não renderiza nada; com conta e
      `temDadosFisicos === false` → `Redirect` para `/conta/dados-fisicos`; com
      conta e `temDadosFisicos === true` → stack normal (depende de T009,
      T011; plan.md, linha #1 do levantamento exaustivo).

**Checkpoint**: login funciona e o gate decide corretamente para onde navegar
— falta a tela de destino do primeiro login (US2) para o fluxo ficar completo
ponta a ponta.

---

## Phase 4: User Story 2 - Preencher dados físicos no primeiro login (Priority: P1)

**Goal**: No primeiro login de uma conta, coletar os dados físicos reaproveitando
o formulário do RF10, sem inventar um novo.

**Independent Test**: Autenticar com uma Conta Google nova (sem dados físicos
salvos), confirmar que o formulário aparece, preencher e salvar, confirmar que
o app chega à lista de treinos.

### Implementation for User Story 2

- [ ] T013 [US2] Criar `src/app/conta/dados-fisicos.tsx`: renderiza
      `PerfilForm` (`src/components/perfil/perfil-form.tsx`, **sem nenhuma
      alteração** — research.md, Decisão 4) com `onSubmit` chamando
      `conta-storage.salvarDadosFisicos(useContaAutenticada().uid, dados)` e, ao
      concluir, navegando para a lista de treinos (mesmo padrão de
      `src/app/perfil/criar.tsx`, que este arquivo substitui) — depende de
      T008, T009.
- [ ] T014 [US2] Remover `src/app/perfil/criar.tsx` (substituído por T013;
      confirmar que nada mais importa este arquivo antes de remover).

**Checkpoint**: US1 + US2 juntas cobrem o fluxo completo de login até a lista
de treinos, incluindo o primeiro login. `_layout.tsx` (T012) já aponta pra
rota criada aqui.

---

## Phase 5: User Story 3 - Treinos importados e listados via Firestore (Priority: P1)

**Goal**: Importação (RF01) e lista (RF02) de treinos passam a usar Firestore,
segregados por `uid`, com o mesmo comportamento observável de antes.

**Independent Test**: Autenticar com duas Contas Google diferentes (logout +
login), importar treinos distintos em cada uma, confirmar que cada conta só
vê os próprios treinos.

### Implementation for User Story 3

- [ ] T015 [US3] Em `src/services/treino-storage.ts`: migrar `listarTreinos`,
      `importarTreino`, `importarTreinoExemplo`, `processarConteudoObjeto` e
      `processarConteudoArray` de `AsyncStorage` (`treinos:<perfilId>`) para
      Firestore (`users/{uid}/treinos/*`) — parâmetro renomeado de `perfilId`
      para `uid` em todas essas funções (`contracts/treino-storage-firestore.md`);
      a normalização de `categoria` ausente (bug fix do RF17) continua
      aplicada sobre os dados vindos do Firestore, sem alteração de lógica.
- [ ] T016 [US3] Em `src/services/treino-storage.ts`, função
      `montarTreinoValido`: remover o parâmetro `perfilId` **inteiramente**
      (não renomear para `uid`) e o campo `perfilId` do literal `Treino`
      construído — função pura, sem outro uso para esse valor depois da
      remoção do campo do tipo (`contracts/treino-storage-firestore.md`,
      "Ponto de construção afetado"; depende de T010, T015).
- [ ] T017 [US3] Alterar `src/app/(tabs)/index.tsx`: trocar todo uso de
      `usePerfilAtivo().perfilAtivo.id` por `useContaAutenticada().uid` —
      chamadas a `listarTreinos`, `carregarContagens`, `carregarDatasFinalizacao`,
      `carregarCicloAtual` e os arrays de dependência de `useEffect`/
      `useFocusEffect` (plan.md, linha #5 do levantamento exaustivo; depende
      de T009, T015).
- [ ] T018 [US3] Alterar `src/app/acoes.tsx`: trocar `perfilAtivo.id` por
      `useContaAutenticada().uid` nas chamadas a `importarTreino`/
      `importarTreinoExemplo` (plan.md, linha #4 do levantamento exaustivo —
      só a parte de importação; o item "Sair da conta" no mesmo arquivo é
      T019, da US4; depende de T009, T015).

**Checkpoint**: US1+US2+US3 juntas entregam o fluxo funcional completo —
login, primeiro cadastro, e treinos segregados por conta no Firestore.

---

## Phase 6: User Story 4 - Sair da conta (Priority: P2)

**Goal**: "Trocar perfil" (RF14) vira "Sair da conta" — trocar de usuário no
mesmo aparelho passa a exigir logout + novo login.

**Independent Test**: Autenticar, abrir a tela de Ações, tocar em "Sair da
conta", confirmar que volta à tela de login, e que um novo login (mesma conta
ou outra) funciona normalmente depois.

### Implementation for User Story 4

- [ ] T019 [US4] Alterar `src/app/acoes.tsx`: substituir a linha
      `Perfil ativo: {perfilAtivo?.nome} (trocar)` por
      `Sair da conta ({contaAutenticada?.email})`, com `onPress` chamando
      `useContaAutenticada().sairDaConta()` (FR-013/FR-014) — sem bloquear por
      sessão de treino em andamento (spec.md, Edge Cases). Remover o import de
      `usePerfilAtivo` deste arquivo (T018 já migrou o outro uso — depois desta
      task, `acoes.tsx` não usa mais `usePerfilAtivo`).
- [ ] T020 [US4] Remover `src/app/perfil/selecionar.tsx` (não há mais seleção
      entre múltiplos perfis no mesmo login — trocar de conta é logout + login).

**Checkpoint**: todas as 4 user stories completas e testáveis
independentemente.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Migrar os 2 consumidores de `usePerfilAtivo()` que não pertencem a
nenhuma story específica (FR-012 — continuidade do que não muda de tecnologia),
depois remover o sistema antigo por completo e validar.

- [ ] T021 [P] Alterar `src/app/(tabs)/explore.tsx`: trocar
      `usePerfilAtivo().perfilAtivo.id` por `useContaAutenticada().uid` em
      `obterHistoricoPorPerfil`, `obterHistoricoPorData`, `marcarSessaoRevisada`
      e os arrays de dependência de efeito (plan.md, linha #6 do levantamento
      exaustivo) — FR-012, histórico continua em AsyncStorage sem mudança de
      schema, só troca a origem do identificador (depende de T009).
- [ ] T022 [P] Alterar `src/app/treino/[treinoId].tsx`: trocar **todos** os 9
      pontos de uso de `perfilAtivo.id` por `uid` — `listarTreinos`,
      `obterSessao`, `marcarExercicioConcluido`, `finalizarSessao`,
      `marcarSessaoRevisada` e os arrays de dependência de efeito (plan.md,
      linha #7 do levantamento exaustivo, o arquivo com mais pontos de uso —
      maior risco de esquecer algum call site) — FR-012, execução/sessão
      continuam em AsyncStorage sem mudança de schema (depende de T009, T015).
- [ ] T023 Remover `src/hooks/use-perfil-ativo.tsx`, `src/services/perfil-storage.ts`
      e os tipos `Perfil`/`PerfisState`/`DefinirPerfilAtivoResultado`/
      `SessaoRegistro` de `src/types/perfil.ts` (manter `Sexo`/`ObjetivoTreino`,
      usados por `PerfilForm`/`DadosFisicos`) — **só depois** de T012, T014,
      T017, T018, T019, T020, T021 e T022 estarem todos completos. Confirmar
      com `grep -rn "usePerfilAtivo" src/` retornando vazio antes de remover.
- [ ] T024 Rodar `npx tsc --noEmit` na raiz do projeto e confirmar zero erros —
      validação final de que nenhum consumidor de `usePerfilAtivo`/`Perfil`/
      `perfilId` (em `Treino`) foi esquecido (Constitution v2.0.0, Princípio I;
      depende de T023).
- [ ] T025 Executar os 5 cenários de `quickstart.md` em Android e iOS
      (Constitution v2.0.0, Princípio III) — incluindo o caso de teste de
      isolamento entre contas via regra de segurança
      (`contracts/firestore-rules.md`, casos de teste 1-4). Atualizar
      `docs/criterios-aceite.md` com o resultado, marcando RF10 como
      substituído e registrando RF01/RF02 como migrados para Firestore
      (depende de T024).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente.
- **Foundational (Phase 2)**: depende de T002/T003 (Setup) para os módulos
  nativos existirem; BLOQUEIA todas as user stories.
- **User Stories (Phase 3-6)**: todas dependem da Foundational completa.
  - **US1 e US2 são sequenciais na prática**, apesar de ambas P1: o gate de
    `_layout.tsx` (T012, US1) redireciona para `/conta/dados-fisicos` (T013,
    US2) no primeiro login — a rota precisa existir para o fluxo funcionar
    ponta a ponta, mesmo que T011/T012 sejam implementáveis antes de T013.
  - **US3 é independente de US1/US2** na sua própria lógica de storage (T015,
    T016), mas as telas que a exercitam (T017, T018) usam
    `useContaAutenticada()` (T009, Foundational) — não dependem de US1/US2
    estarem prontas, só da Foundational.
  - **US4 depende de US3 no arquivo `acoes.tsx`** (T019 depende de T018 no
    mesmo arquivo — ordem de edição, não ordem de valor entregue).
- **Polish (Phase 7)**: T021/T022 dependem só da Foundational (T009) e, no
  caso de T022, também de T015 (US3). T023 depende de **todas** as phases 3-6
  e de T021/T022 estarem completas — é a task que efetivamente teria quebrado
  alguma tela se o levantamento exaustivo do `plan.md` tivesse esquecido um
  consumidor.

### Parallel Opportunities

- Setup: T002 pode rodar em paralelo com T001 (arquivos diferentes).
- Foundational: T007, T008, T010 são `[P]` entre si (arquivos diferentes); T009
  depende de T008.
- Depois da Foundational: US1 (T011-T012), o storage de US3 (T015-T016) e os
  itens de Polish T021/T022 podem avançar em paralelo — todos só dependem da
  Foundational, não uns dos outros.

---

## Parallel Example: Foundational

```bash
# T007, T008 e T010 podem ser feitos em paralelo (arquivos diferentes, sem dependência entre si):
Task: "Adicionar DadosFisicos em src/types/perfil.ts"
Task: "Criar src/services/conta-storage.ts"
Task: "Remover perfilId de Treino em src/types/treino.ts"

# T009 depende de T008 (chama obterDadosFisicos) — não entra no lote paralelo acima.
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2, juntas — ver nota de dependência acima)

1. Completar Phase 1: Setup (inclui os 3 passos manuais de Firebase, T004-T006
   — sem eles nenhum teste em aparelho é possível).
2. Completar Phase 2: Foundational.
3. Completar Phase 3 (US1) + Phase 4 (US2) juntas — é o menor conjunto que dá
   um fluxo de login ponta a ponta testável (`quickstart.md`, Cenários 1-2).
4. **PARAR E VALIDAR**: testar login + primeiro cadastro isoladamente antes de
   seguir.

### Incremental Delivery

1. Setup + Foundational → base pronta, nada quebrado ainda.
2. US1 + US2 → login completo até a lista de treinos (`quickstart.md`,
   Cenários 1-2).
3. US3 → treinos de verdade segregados por conta (`quickstart.md`, Cenário 3 —
   o teste mais importante da feature).
4. US4 → sair da conta / trocar de usuário (`quickstart.md`, Cenário 5 junto
   com a continuidade de execução/histórico).
5. Polish → migra os 2 arquivos restantes (FR-012), remove o sistema antigo,
   valida em Android e iOS.

---

## Notes

- `[P]` = arquivos diferentes, sem dependência.
- Esta é uma migração, não uma feature nova — por isso a ordem
  "aditivo → cutover por story → remoção no final" é mais importante aqui do
  que em specs anteriores: remover `use-perfil-ativo.tsx`/`perfil-storage.ts`
  antes da hora quebra qualquer um dos 7 consumidores listados no `plan.md`.
- T016 e T023 são os pontos de maior risco de "esquecer alguma coisa" — ambos
  têm uma verificação explícita (`grep`) na própria descrição da task, não
  apenas a instrução de remover.
- Task de maior risco de segurança real: nenhuma nesta lista — a regra de
  segurança do Firestore (T005) é publicada no Setup, antes de qualquer dado
  real trafegar, e revalidada explicitamente em T025.
