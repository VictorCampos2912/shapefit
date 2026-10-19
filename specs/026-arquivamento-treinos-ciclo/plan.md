# Implementation Plan: Arquivamento Lógico de Treinos, "Encerrar Ciclo" e Tratamento de Sessões Abandonadas

**Branch**: `026-arquivamento-treinos-ciclo` | **Date**: 2026-10-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/026-arquivamento-treinos-ciclo/spec.md`

## Summary

Arquivamento lógico de treinos (RF25, PRD seção 6 — nova entrada): um
campo `arquivadoEm` no treino (nunca remoção de documento) o tira de "Meus
treinos" e bloqueia sua execução, sem apagar nenhuma sessão — histórico
continua lendo pelo snapshot já existente (RF24). "Encerrar ciclo"
manualmente (campo `encerradoEm` no ciclo) libera a importação de um novo
lote antes de atingir 40 sessões, sem tocar em nenhuma sessão. Uma ação
direta em "Meus treinos" finaliza uma sessão "Em andamento" sem precisar
abrir a tela de execução. Toda filtragem é feita em memória sobre leituras
de coleção inteira já existentes (`listarTreinos`/`listarSessoes`/
`listarCiclos`) — nenhuma query nova com `where`/`limit`, nenhum `getDoc`
de documento único (lição da spec 025: esses formatos travaram
indefinidamente offline neste SDK/aparelho). Regras do Firestore passam a
proibir `delete` em `treinos`, `sessoes` e `ciclos` (garantia no servidor
de que o histórico nunca é apagável, FR-013) — nenhum código do app usa
`delete` hoje, confirmado por grep. Nenhuma dependência nova; dois ícones
SVG novos seguem o padrão já existente.

## Technical Context

**Language/Version**: TypeScript (strict), React Native + Expo SDK 57 (ver
`AGENTS.md` — consultar a documentação versionada antes de qualquer
alteração de código)

**Primary Dependencies**: nenhuma dependência nova —
`@react-native-firebase/firestore` já presente desde a spec 022

**Storage**: Firestore (`users/{uid}/treinos/*`, `users/{uid}/ciclos/*`,
campos novos; `users/{uid}/sessoes/*` sem mudança de schema, só de
permissão de regra) — mesma fonte de verdade já usada desde a spec 025

**Testing**: validação manual em Android (Constitution v2.0.0, Princípio
III) — sem framework de testes automatizados neste projeto; roteiro em
`quickstart.md`; iOS pendente por falta de conta Apple Developer paga
(mesma situação herdada das specs 022-025)

**Target Platform**: Android 12+ (Redmi Note 12), via development build
(`expo-dev-client`, já exigido desde a spec 022)

**Project Type**: mobile-app (Expo Router, `src/app/`)

**Performance Goals**: nenhuma leitura nova em `index.tsx` (pedido
explícito do usuário) — toda filtragem de treinos arquivados/ciclos
encerrados acontece em memória, sobre as mesmas leituras de coleção
inteira já feitas hoje (`research.md`, Decisões 1, 7, 8). A nova ação
"Finalizar sessão em andamento" reaproveita a mesma leitura de sessões já
feita por `carregarDadosDeSessao`, sem leitura adicional.

**Constraints**:

- FR-003/FR-010 exigem que um treino arquivado nunca fique executável nem
  com uma sessão em andamento presa a ele — resolvido com `writeBatch`
  atômico em `arquivarTreino` (`batch.update` de `arquivadoEm` no treino
  e, se houver, `finalizadaEm` na sessão, no mesmo commit — sem leitura
  prévia, o chamador já passa os ids que tem em memória) e checagem em
  dois pontos de `[treinoId].tsx` (carregamento inicial + retorno do
  segundo plano, que é o caminho real da notificação de fim de descanso —
  `research.md`, Decisões 4 e 6).
- FR-013 exige garantia no servidor de que sessões nunca são apagáveis —
  resolvido proibindo `delete` nas regras do Firestore para `treinos`,
  `sessoes` e `ciclos` (`contracts/firestore-rules.md`); confirmado por
  `grep -rn "deleteDoc" src/` (zero ocorrências) que nenhum código do app
  depende de `delete` em nenhuma das três coleções.
- Lição da spec 025 (SDK offline): nenhuma query nova com `where`/`limit`,
  nenhum `getDoc` de documento único — toda **leitura** nova ou alterada
  desta spec usa `listarTreinos`/`listarSessoes`/`listarCiclos` (coleção
  inteira via `getDocs`, já comprovadamente confiável offline) seguida de
  filtro/busca em memória (`research.md`, Decisão 1).
- **Risco a validar, não uma lição já confirmada**: as quatro funções de
  escrita desta spec (`arquivarTreino`, `restaurarTreino`, `encerrarCiclo`,
  `finalizarSessaoPorId`) usam `updateDoc`/`batch.update` de um único
  campo, por id, **sem nenhuma leitura prévia** — um formato de escrita
  que este projeto ainda **não validou offline** (só `setDoc` do
  documento inteiro foi confirmado confiável offline, specs 022-025).
  `quickstart.md` Cenário 11 passa a testar isso explicitamente — cada
  ação offline é seguida de remover o app dos recentes e reabrir ainda em
  modo avião, para provar que a escrita foi persistida de verdade antes
  de confiar neste formato (`research.md`, Decisão 4 revisada).
- Assinaturas públicas estáveis onde possível: `listarTreinos`,
  `obterCicloAtual`, `calcularProgressoCiclo`, `criarCiclo` não mudam de
  assinatura — a filtragem entra como funções puras novas
  (`filtrarTreinosAtivos`/`filtrarTreinosArquivados`) ou como mudança
  interna de `obterCicloAtual` (`research.md`, Decisões 1 e 7).

**Scale/Scope**: 2 tipos alterados (`Treino.arquivadoEm`,
`CicloTreino.encerradoEm`), 2 serviços alterados
(`treino-storage.ts` ganha `arquivarTreino`/`restaurarTreino`/2 funções
puras; `ciclo-treino-storage.ts` ganha `encerrarCiclo` + mudança interna
em `obterCicloAtual`), 1 serviço com 1 função nova sem leitura
(`sessao-treino-storage.ts`: `finalizarSessaoPorId`, reaproveitada pelo
`writeBatch` de `arquivarTreino` e pela ação de "finalizar sessão em
andamento"), 1 serviço com ajuste pontual (`historico-evolucao.ts`,
filtro FR-005), 2
telas alteradas (`index.tsx`: filtro + menu "mais opções" por item;
`[treinoId].tsx`: bloqueio de execução + link "Arquivar"), 1 tela alterada
(`acoes.tsx`: 2 linhas novas), 1 tela nova
(`treinos-arquivados.tsx`), 1 arquivo de regras estendido
(`firestore.rules`), 2 ícones SVG novos. Nenhum componente de
modal/gesto novo — tudo via `Alert.alert` (`research.md`, Decisão 5).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Avaliação contra `.specify/memory/constitution.md` v2.0.0:

- **Princípio I (TypeScript Obrigatório)**: PASS — `Treino.arquivadoEm` e
  `CicloTreino.encerradoEm` tipados como `string | null` (sem `any`,
  `data-model.md`); `arquivarTreino`/`restaurarTreino`/`encerrarCiclo`
  tipados explicitamente (`contracts/`).
- **Princípio II (Simplicidade sobre Funcionalidades Avançadas)**: PASS —
  nenhuma redistribuição automática de cota de ciclo entre treinos
  arquivados (`spec.md`, Edge Cases); nenhum componente de UI novo além de
  reaproveitar `Alert.alert`/`Button`/ícones já no padrão do app
  (`research.md`, Decisão 5); `obterCicloAtual` resolve a redefinição de
  "ciclo atual" com uma mudança interna, sem expor uma segunda função
  equivalente (`research.md`, Decisão 7); nenhum mecanismo de deep-link
  por notificação introduzido só para cobrir um caminho que, na prática,
  já é coberto pelo retorno do segundo plano (`research.md`, Decisão 6).
- **Princípio III (Validação em Dois Dispositivos-Alvo)**: PASS, mesma
  ressalva das specs 022-025 — `quickstart.md` cobre as 4 User Stories em
  Android; iOS permanece pendente só pela falta de conta Apple Developer.
- **Princípio IV (Controle de Dependências)**: PASS — nenhuma dependência
  nova; os 2 ícones novos usam `react-native-svg`, já em uso.
- **Princípio V (Autenticação Obrigatória e Isolamento por Conta,
  NON-NEGOTIABLE)**: PASS — nenhuma coleção nova; os campos novos
  (`arquivadoEm`/`encerradoEm`) vivem em documentos já segregados por
  `uid` (`users/{uid}/treinos/*`, `users/{uid}/ciclos/*`); regras do
  Firestore atualizadas mantêm a mesma condição de isolamento
  (`request.auth.uid == uid`), só restringindo as operações permitidas
  (`contracts/firestore-rules.md`) — nenhuma consulta nem campo de corpo
  de documento passa a decidir acesso.

Nenhuma violação — Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/026-arquivamento-treinos-ciclo/
├── plan.md               # Este arquivo
├── research.md           # Fase 0 — decisões 1-9 pedidas pelo usuário
├── data-model.md          # Fase 1 — Treino/CicloTreino alterados
├── quickstart.md          # Fase 1 — roteiro de validação manual (14 cenários)
├── contracts/
│   ├── firestore-rules.md               # Fase 1 — delete proibido em treinos/sessoes/ciclos
│   ├── treino-storage.md                # Fase 1 — arquivar/restaurar/filtros
│   ├── ciclo-treino-storage.md          # Fase 1 — encerrar ciclo/redefinição de ciclo atual
│   ├── sessao-treino-storage.md         # Fase 1 — finalizarSessaoPorId (sem leitura)
│   ├── treino-execucao.md               # Fase 1 — bloqueio em [treinoId].tsx
│   ├── lista-treinos-e-historico.md     # Fase 1 — index.tsx + historico-evolucao.ts
│   └── acoes-e-sessao-abandonada.md     # Fase 1 — acoes.tsx (novas ações)
└── tasks.md                # Fase 2 (gerado por /speckit-tasks)
```

### Source Code (repository root)

```text
firestore.rules                        # ALTERADO: treinos/sessoes/ciclos trocam
                                          #   allow read, write por
                                          #   allow read, create, update (sem delete)

src/
├── types/
│   ├── treino.ts                      # ALTERADO: Treino ganha arquivadoEm
│   └── ciclo-treino.ts                # ALTERADO: CicloTreino ganha encerradoEm
├── services/
│   ├── treino-storage.ts              # ALTERADO: listarTreinos normaliza arquivadoEm;
│   │                                     #   + filtrarTreinosAtivos/filtrarTreinosArquivados;
│   │                                     #   + arquivarTreino (writeBatch.update, sem leitura);
│   │                                     #   + restaurarTreino (updateDoc, sem leitura)
│   ├── ciclo-treino-storage.ts        # ALTERADO: criarCiclo escreve encerradoEm: null;
│   │                                     #   obterCicloAtual filtra ciclos encerrados (interno);
│   │                                     #   + encerrarCiclo (updateDoc, sem leitura)
│   ├── sessao-treino-storage.ts       # ALTERADO: + finalizarSessaoPorId (updateDoc/batch.update,
│   │                                     #   sem leitura)
│   └── historico-evolucao.ts          # ALTERADO: universo do RF08 filtra treinos ativos
├── app/
│   ├── (tabs)/
│   │   └── index.tsx                  # ALTERADO: filtra ativos; menu "mais opções" por
│   │                                     #   item (arquivar / finalizar sessão abandonada)
│   ├── treino/
│   │   └── [treinoId].tsx             # ALTERADO: bloqueio de treino arquivado (2 pontos);
│   │                                     #   link "Arquivar treino"
│   ├── acoes.tsx                      # ALTERADO: + "Treinos arquivados", + "Encerrar ciclo"
│   └── treinos-arquivados.tsx         # NOVO: lista de arquivados + restaurar
└── components/
    └── ui/
        └── icons.tsx                  # ALTERADO: + ArquivarIcon, + EncerrarCicloIcon
```

**Structure Decision**: nenhum componente de modal/gesto novo, nenhuma
coleção Firestore nova — dois tipos ganham um campo cada, dois serviços
ganham funções novas reaproveitando o padrão de leitura/escrita já
estabelecido (specs 022/024/025), duas telas existentes recebem pontos de
entrada novos (via `Alert.alert`, mesmo padrão já usado em todo o app), e
uma tela nova (`treinos-arquivados.tsx`) segue o mesmo padrão de rota
top-level de `/acoes`.

## Complexity Tracking

*Não aplicável — nenhuma violação da Constitution Check acima.*
