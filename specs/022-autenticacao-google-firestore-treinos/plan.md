# Implementation Plan: Autenticação Google + Firestore para Treinos

**Branch**: `022-autenticacao-google-firestore-treinos` | **Date**: 2026-09-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/022-autenticacao-google-firestore-treinos/spec.md`

## Summary

Substitui o RF10 (perfil local sem autenticação) por login obrigatório via Conta
Google (Firebase Authentication), migra RF01/RF02 (importação e lista de
treinos) e os dados físicos da conta para o Firestore, segregados por `uid`, e
mantém todo o restante do app (execução, histórico, ciclo de progresso)
funcionando exatamente como hoje via AsyncStorage, agora chaveado por `uid` em
vez de `perfilId`. Abordagem técnica: módulos nativos
(`@react-native-firebase/*` + `@react-native-google-signin/google-signin`), não
o SDK Web do Firebase — ver `research.md`, Decisão 1, para a comparação real que
motivou essa escolha (persistência offline genuinamente nativa é um requisito
explícito, FR-011).

## Technical Context

**Language/Version**: TypeScript (strict), React Native 0.86.3, Expo SDK ~57

**Primary Dependencies**: `@react-native-firebase/app`, `@react-native-firebase/auth`,
`@react-native-firebase/firestore`, `@react-native-google-signin/google-signin`
(novas); `expo-dev-client` (já presente, reaproveitada — módulos nativos exigem
development build, mesma categoria de mudança do RF06/`expo-notifications`)

**Storage**: Firestore (novo — `users/{uid}` e `users/{uid}/treinos/*`, RF01/RF02
e dados físicos da conta) + `@react-native-async-storage/async-storage` (sem
mudança — execução/histórico/ciclo de progresso, agora chaveados por `uid`)

**Testing**: manual em Android e iOS (Constitution v2.0.0, Princípio III) — sem
framework de testes automatizados neste projeto; validação via
`quickstart.md`

**Target Platform**: Android 12+ (Redmi Note 12) e iOS 17+ (iPhone 16 Plus), via
development build (`expo-dev-client`) — Expo Go não é viável (módulos nativos,
mesma razão já documentada para `expo-notifications` desde o RF06/RF08)

**Project Type**: mobile-app (Expo Router, `src/app/`)

**Performance Goals**: login + navegação até a lista de treinos (ou formulário
de dados físicos, no primeiro login) em menos de 30s (SC-001)

**Constraints**: offline-capable para tudo exceto o próprio fluxo de
login/logout (FR-011); isolamento entre contas garantido por regra de segurança
do Firestore no backend, não só filtro no cliente (FR-009, Constitution v2.0.0
Princípio V, NON-NEGOTIABLE)

**Scale/Scope**: uso pessoal/familiar, poucas contas simultâneas — sem
necessidade de otimização para grande volume de usuários ou de treinos por conta

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Avaliação contra `.specify/memory/constitution.md` v2.0.0:

- **Princípio I (TypeScript Obrigatório)**: PASS — nenhum código novo previsto
  fora de TypeScript; tipos novos (`DadosFisicos`, forma de `Conta autenticada`)
  serão explícitos (`data-model.md`).
- **Princípio II (Simplicidade)**: PASS — reaproveita `PerfilForm` (RF10) sem
  recriar (`research.md` Decisão 4), reaproveita o padrão Context/Provider já
  estabelecido (`use-perfil-ativo.tsx`) em vez de inventar um novo mecanismo de
  gate de navegação (Decisão 6).
- **Princípio III (Validação em Dois Dispositivos)**: PASS — `quickstart.md`
  exige explicitamente repetição de todos os 5 cenários em Android e iOS antes
  de a feature ser considerada concluída.
- **Princípio IV (Controle de Dependências)**: **AÇÃO PENDENTE, não uma
  violação** — `@react-native-firebase/app`, `/auth`, `/firestore` e
  `@react-native-google-signin/google-signin` são dependências novas. Firebase
  Authentication e Firestore já foram pré-aprovados pela Constitution v2.0.0
  (emenda que motivou esta própria feature); as bibliotecas específicas
  escolhidas (Decisões 1-2 do `research.md`) são a materialização técnica dessa
  aprovação, não dependências não relacionadas. Ainda assim, o Princípio IV
  exige que estejam **listadas no PRD** — isso MUST ser uma task explícita da
  fase `/speckit-tasks` (atualizar `docs/PRD-app-treino.md`, seção de
  dependências/stack), não um código a escrever.
- **Princípio V (Autenticação Obrigatória e Isolamento por Conta, NON-NEGOTIABLE)**:
  PASS por desenho — esta feature É a implementação deste princípio. FR-001 a
  FR-009 cobrem diretamente as exigências do princípio (login obrigatório,
  isolamento por `uid`, regra de segurança no backend). `contracts/firestore-rules.md`
  documenta a regra real com casos de teste explícitos, não apenas a intenção.

**Gate resultado**: PASS — nenhuma violação sem justificativa; a única pendência
(registro das novas dependências no PRD) é uma task de documentação, não uma
exceção ao princípio.

## Project Structure

### Documentation (this feature)

```text
specs/022-autenticacao-google-firestore-treinos/
├── plan.md              # This file
├── research.md          # Phase 0 — decisões técnicas (SDK, regras, reaproveitamento)
├── data-model.md         # Phase 1 — entidades Firestore + o que não muda
├── quickstart.md         # Phase 1 — 5 cenários de validação ponta a ponta
└── contracts/
    ├── firestore-rules.md           # Regra de segurança real (FR-009)
    ├── conta-storage.md             # users/{uid} — dados físicos
    ├── treino-storage-firestore.md  # users/{uid}/treinos/* — RF01/RF02
    └── use-conta-autenticada.md     # Hook de auth + gate de navegação
```

(`tasks.md` — Phase 2, gerado por `/speckit-tasks`, não por este comando.)

### Source Code (repository root)

```text
src/
├── app/
│   ├── _layout.tsx                  # ALTERADO — gate passa a usar useContaAutenticada
│   ├── login.tsx                    # NOVO — User Story 1
│   ├── conta/
│   │   └── dados-fisicos.tsx        # NOVO — User Story 2, reaproveita PerfilForm
│   ├── acoes.tsx                    # ALTERADO — "Sair da conta" + perfilAtivo.id → uid
│   ├── (tabs)/
│   │   ├── index.tsx                # ALTERADO — perfilAtivo.id → uid (ver levantamento abaixo)
│   │   └── explore.tsx              # ALTERADO — perfilAtivo.id → uid (ver levantamento abaixo)
│   ├── treino/
│   │   └── [treinoId].tsx           # ALTERADO — perfilAtivo.id → uid (ver levantamento abaixo)
│   └── perfil/                      # REMOVIDO ao final da migração (criar.tsx, selecionar.tsx)
├── components/
│   └── perfil/
│       └── perfil-form.tsx          # SEM ALTERAÇÃO — reaproveitado como está; nenhum outro arquivo em src/components chama usePerfilAtivo (confirmado por varredura)
├── hooks/
│   ├── use-conta-autenticada.tsx    # NOVO — substitui use-perfil-ativo.tsx
│   └── use-perfil-ativo.tsx         # REMOVIDO ao final da migração (só depois que os 7 consumidores abaixo forem migrados)
├── services/
│   ├── conta-storage.ts             # NOVO — Firestore, users/{uid}
│   ├── treino-storage.ts            # ALTERADO — RF01/RF02 migram para Firestore
│   └── perfil-storage.ts            # REMOVIDO ao final da migração
└── types/
    ├── perfil.ts                    # Sexo/ObjetivoTreino reaproveitados; Perfil/PerfisState removidos
    └── treino.ts                    # Treino.perfilId removido

firestore.rules                      # NOVO — regra de segurança (contracts/firestore-rules.md)
app.json                             # ALTERADO — plugins nativos (Firebase/Google Sign-In)
google-services.json                 # NOVO — config nativa Android; NÃO commitado (.gitignore), baixar do console do Firebase (quickstart.md)
GoogleService-Info.plist             # NOVO — config nativa iOS; NÃO commitado (.gitignore), baixar do console do Firebase (quickstart.md)
```

**Structure Decision**: mobile-app único (Expo Router), sem separação
backend/frontend — o "backend" desta feature é inteiramente Firebase
(Authentication + Firestore + suas regras de segurança), configurado via
console/CLI do Firebase, não um serviço próprio do projeto. Segue a mesma
estrutura de pastas já usada por toda spec anterior deste repositório
(`src/app`, `src/components`, `src/hooks`, `src/services`, `src/types`).

### Levantamento exaustivo: todo consumidor de `usePerfilAtivo()`

Varredura literal (`grep -rl "usePerfilAtivo" src/ --include="*.tsx" --include="*.ts"`)
em todo `src/app`, `src/components`, `src/hooks` e `src/services` do repositório
real, em 2026-09-29. Resultado: **7 arquivos consumidores**, além da própria
definição do hook (`src/hooks/use-perfil-ativo.tsx`). Nenhum arquivo em
`src/components` ou `src/services` consome o hook diretamente. `use-perfil-ativo.tsx`
MUST só ser removido depois que os 7 abaixo estiverem migrados — remover antes
quebra qualquer um deles.

| # | Arquivo | O que lê de `usePerfilAtivo()` | Mudança exata nesta feature |
|---|---------|----------------------------------|-------------------------------|
| 1 | `src/app/_layout.tsx` | `{ perfis, sessaoConfirmada, carregando }` — gate de navegação (`RootNavigator`) | Trocar pelo gate de `useContaAutenticada()` descrito em `contracts/use-conta-autenticada.md` (substitui os `Redirect` para `/perfil/criar`/`/perfil/selecionar` pelos de `/login`/`/conta/dados-fisicos`) |
| 2 | `src/app/perfil/criar.tsx` | `{ criarPerfil }` | Arquivo REMOVIDO (substituído por `src/app/conta/dados-fisicos.tsx`, que chama `conta-storage.salvarDadosFisicos(uid, dados)` a partir do mesmo `PerfilForm.onSubmit`) |
| 3 | `src/app/perfil/selecionar.tsx` | `{ perfis, perfilAtivo, selecionarPerfil }` | Arquivo REMOVIDO — não há mais "selecionar entre múltiplos perfis"; trocar de conta é logout + login (User Story 4) |
| 4 | `src/app/acoes.tsx` | `{ perfilAtivo }` — usa `perfilAtivo.id` em `importarTreino`/`importarTreinoExemplo` (linhas 99, 110) e `perfilAtivo?.nome` no texto "Perfil ativo: ... (trocar)" (linha 131) | `perfilAtivo.id` → `useContaAutenticada().uid`; linha 131 vira "Sair da conta ({contaAutenticada?.email})" com `onPress` chamando `sairDaConta()` (FR-013/FR-014) |
| 5 | `src/app/(tabs)/index.tsx` | `{ perfilAtivo }` — usa `perfilAtivo.id` em `listarTreinos`, `carregarContagens`, `carregarDatasFinalizacao`, `carregarCicloAtual` (linhas 94, 97-99, 108, 114-116) e como dependência de `useEffect`/`useFocusEffect` (linhas 123, 129) | `perfilAtivo.id` → `uid` em todas as chamadas; `perfilAtivo?.id` nos arrays de dependência → `uid` (mesmo comentário de eslint-disable já existente permanece válido) |
| 6 | `src/app/(tabs)/explore.tsx` | `{ perfilAtivo }` — usa `perfilAtivo.id` em `obterHistoricoPorPerfil`, `obterHistoricoPorData` (linhas 255-256) e em `marcarSessaoRevisada` (linha 279), além de dependência de efeito (linhas 266, 272) | `perfilAtivo.id` → `uid` em todas as chamadas (histórico continua em AsyncStorage, FR-012 — só troca a origem do identificador) |
| 7 | `src/app/treino/[treinoId].tsx` | `{ perfilAtivo }` — usado extensivamente: `listarTreinos`, `obterSessao`, `salvarSessao`(ou equivalente), `marcarExercicioConcluido`, `finalizarSessao`, `marcarSessaoRevisada` (linhas 113, 120, 124, 202, 234, 258, 331-332, 342, 357) e como dependência de efeitos (linhas 144, 359) | `perfilAtivo.id` → `uid` em **todas** essas chamadas — é o arquivo com mais pontos de uso; maior risco de esquecer algum call site nesta migração especificamente |

Esta tabela é a fonte de verdade para as tasks de migração de cada arquivo —
`/speckit-tasks` MUST gerar uma task por linha desta tabela (não uma task
genérica de "migrar telas que usam perfilAtivo"), para que cada call site listado
tenha um item de checklist próprio e nenhum fique esquecido.

### Verificações adicionais (2026-09-29, antes do `/speckit-tasks`)

- `grep -rn "\.perfilId" src/ --include="*.tsx" --include="*.ts"` → **nenhum
  resultado**. Confirmado: nenhum código lê `treino.perfilId` por acesso direto
  de propriedade em nenhum arquivo do repositório — só o tipo (`src/types/treino.ts:15`)
  declara o campo, e um único ponto o constrói (`src/services/treino-storage.ts:127-157`,
  `montarTreinoValido` — ver `contracts/treino-storage-firestore.md`, seção
  "Ponto de construção afetado", incluindo o detalhe de que o parâmetro
  `perfilId` dessa função pura deve ser removido, não renomeado, já que não
  sobra uso para ele).
- `find src -iname "perfil-form*"` → **um único resultado**,
  `src/components/perfil/perfil-form.tsx` — confirma que `research.md` Decisão 4
  aponta para o arquivo certo antes de basear a User Story 2 nele.
- Nota lateral da mesma varredura (`grep -rn "perfilId:" src/`): outros tipos
  (`CicloTreino.perfilId` em `src/types/ciclo-treino.ts`,
  `SessaoRegistro.perfilId` em `src/types/perfil.ts`) e vários parâmetros de
  função em `sessao-treino-storage.ts`/`ciclo-treino-storage.ts`/`historico-evolucao.ts`
  também se chamam `perfilId` — **esses NÃO são removidos** (FR-012: essas
  áreas continuam em AsyncStorage sem mudança de schema, só recebendo `uid`
  como o valor passado onde hoje se passa `perfilId`). Só o campo dentro do
  tipo `Treino` é removido nesta feature; os demais `perfilId` seguem existindo
  como nomes de parâmetro/campo, agora alimentados por `uid`.

## Complexity Tracking

> Nenhuma violação da Constitution sem justificativa (ver Constitution Check).
> Registrado aqui apenas como referência de custo aceito, não como exceção:

| Adição | Por que necessária | Alternativa mais simples rejeitada porque |
|--------|---------------------|---------------------------------------------|
| Novo development build (módulos nativos) | Firestore com persistência offline genuinamente nativa e Google Sign-In nativo exigem isso (`research.md` Decisão 1) | SDK Web evitaria o build, mas não entrega persistência offline confiável em React Native (item central de FR-011/RNF02) |
