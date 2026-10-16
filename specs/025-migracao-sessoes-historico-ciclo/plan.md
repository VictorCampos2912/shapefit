# Implementation Plan: Migração de Sessões, Histórico e Ciclo de Progresso para o Firestore

**Branch**: `025-migracao-sessoes-historico-ciclo` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/025-migracao-sessoes-historico-ciclo/spec.md`

## Summary

Migração de armazenamento (RF24, PRD seção 6 — nova entrada): sessões de
treino, histórico e ciclo de progresso saem do AsyncStorage local
(`sessoes:<uid>`, `ciclos:<uid>`) e passam a viver no Firestore
(`users/{uid}/sessoes/*`, `users/{uid}/ciclos/*`), um documento por sessão/
ciclo, mesmo padrão já usado para treinos (spec 022). Sem comportamento novo
visível, exceto os dois dados pedidos explicitamente: snapshot de nome do
treino e exercícios (com categoria) na sessão, e horário por série
registrada. De 15 funções exportadas nos dois serviços, só
`registrarSerieConcluida` ganha um campo novo no objeto de parâmetros — as
demais 14, e todas as telas que as consomem, mantêm assinatura idêntica
(`research.md`, Decisão 1). Reduz as leituras de "uma por treino" para "uma
por tela" tanto na lista de treinos quanto no cálculo de progresso do ciclo
(`research.md`, Decisão 7). Regras do Firestore estendidas com o mesmo
padrão `request.auth.uid == uid` já usado para treinos, cobrindo os dois
caminhos novos. Nenhuma dependência nova; nenhum script ou tela de seed —
dados de teste vêm do uso real do app (`research.md`, Decisão 5).

## Technical Context

**Language/Version**: TypeScript (strict), React Native + Expo SDK 57 (ver
`AGENTS.md` — consultar a documentação versionada antes de qualquer
alteração de código)

**Primary Dependencies**: nenhuma dependência nova —
`@react-native-firebase/firestore` já presente desde a spec 022, usado
agora também para `sessoes`/`ciclos`

**Storage**: Firestore (`users/{uid}/sessoes/*`, `users/{uid}/ciclos/*`,
novos nesta spec) — substitui AsyncStorage (`sessoes:<uid>`, `ciclos:<uid>`)
como fonte de verdade; `users/{uid}/treinos/*` (spec 022) inalterado, só
passa a ser lido uma vez a menos por `historico-evolucao.ts`
(`construirRegistrosBrutos` usa o snapshot da sessão em vez de cruzar com
`Treino`)

**Testing**: validação manual em Android (Constitution v2.0.0, Princípio
III) — sem framework de testes automatizados neste projeto; roteiro em
`quickstart.md`; dados de teste criados pelo uso real do app, sem script de
seed (`research.md`, Decisão 5); iOS pendente por falta de conta Apple
Developer paga (mesma situação herdada das specs 022-024)

**Target Platform**: Android 12+ (Redmi Note 12), via development build
(`expo-dev-client`, já exigido desde a spec 022)

**Project Type**: mobile-app (Expo Router, `src/app/`)

**Performance Goals**: redução de leituras Firestore por carregamento de
tela — de O(N) (uma leitura por treino) para O(1) (uma leitura da coleção
inteira) tanto na lista de treinos (`index.tsx`) quanto no cálculo de
progresso de ciclo (`calcularProgressoCiclo`); ver `research.md`, Decisão 7.
**Revisado pós-validação (2026-10-16)**: a otimização complementar prevista
para `obterSessao`/`registrarSerieConcluida` (query filtrada em vez da
coleção inteira) travou indefinidamente offline em teste real e foi
revertida — essas duas funções também leem a coleção inteira via
`listarSessoes`, igual a todas as demais do arquivo; confiabilidade
offline teve prioridade sobre essa otimização específica (`research.md`,
Decisão 1 e seção "Validação em aparelho").

**Constraints**:

- FR-021 exige que nenhuma escrita trave a UI esperando o servidor —
  resolvido reaproveitando o padrão fire-and-forget já usado por
  `treino-storage.ts`/`conta-storage.ts` (`setDoc(...).catch(...)`, sem
  `await`) para toda escrita de sessão/série/ciclo (`research.md`, Decisão
  4).
- FR-008 exige que editar uma série não altere seu `registradaEm` original
  — resolvido porque `atualizarSerieRealizada`/
  `atualizarSerieDeSessaoFinalizada` só tocam `cargaKg`/`reps` do objeto já
  existente (`contracts/sessao-treino-storage.md`).
- FR-018 exige ordenação determinística — resolvido ordenando no cliente
  por `iniciadaEm`/`criadoEm` + `id` como desempate, mesmo padrão já usado
  por `listarTreinos` (`research.md`, Decisão 2).
- FR-016/FR-017 exigem isolamento por conta nos novos caminhos — resolvido
  replicando literalmente a regra já validada para `treinos`
  (`contracts/firestore-rules.md`).
- **Resiliência a falha de leitura de sessão/ciclo, sem esvaziar a lista de
  treinos** (pedido explícito do usuário sobre este plano): em
  `index.tsx`, `carregarDadosDeSessao` e `carregarCicloAtual` DEVEM
  capturar qualquer rejeição de leitura (ex.: regras do Firestore ainda
  não publicadas no Console, `permission-denied`; falha transitória de
  rede/conversão) com `try/catch`, registrar o erro
  (`console.error`) e cair para valores padrão (`{}` para os `Record`s,
  `null` para `cicloAtual`/`progressoCiclo`) em vez de propagar a rejeição
  — a lista de treinos em si (`treinos`, vinda de `listarTreinos`,
  definida antes dessas duas chamadas em `recarregarTreinos`) nunca é
  afetada por essa falha (`contracts/lista-treinos-e-historico.md`).
- **Trava de envio por exercício, adicionada durante a validação**
  (`[treinoId].tsx`, não prevista neste plano original): offline,
  `registrarSerieConcluida` pode ficar lenta o suficiente para o usuário
  tocar várias vezes em "Concluir série" sem ver nada mudar, disparando
  chamadas concorrentes que se sobrescrevem — um state
  `exerciciosEnviandoSerie` (por `exercicioId`) bloqueia uma nova chamada
  enquanto a anterior do mesmo exercício está em andamento e desabilita o
  botão com o texto "Salvando..." (ver
  `contracts/sessao-treino-storage.md` e `research.md`, "Validação em
  aparelho").

**Scale/Scope**: 2 serviços alterados (`sessao-treino-storage.ts`,
`ciclo-treino-storage.ts`, migração completa de AsyncStorage para
Firestore), 1 serviço com ajuste pontual de leitura
(`historico-evolucao.ts`), 1 tela com leitura consolidada (`index.tsx`), 1
efeito colateral de tipo (`exercicio-execucao.tsx`, prop `onConcluirSerie`),
1 arquivo de regras estendido (`firestore.rules`), 3 tipos alterados
(`SessaoTreino`, `SerieRealizada`, `CicloTreino`) — ver Project Structure.
Nenhum arquivo novo de tela ou componente.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Avaliação contra `.specify/memory/constitution.md` v2.0.0:

- **Princípio I (TypeScript Obrigatório)**: PASS — `SessaoTreino` ganha
  `treinoNomeSnapshot: string`/`exerciciosSnapshot: {...}[]` tipados (sem
  `any`); `SerieRealizada` ganha `registradaEm: string`; `CicloTreino`/
  `SessaoTreino` renomeiam `perfilId` para `uid: string` (mesmo tipo,
  mesmo valor, research.md Decisão 6); `registrarSerieConcluida` ganha o
  parâmetro `treinoSnapshot` tipado explicitamente
  (`contracts/sessao-treino-storage.md`).
- **Princípio II (Simplicidade sobre Funcionalidades Avançadas)**: PASS —
  nenhuma transação do Firestore introduzida para as corridas entre
  aparelhos (aceitas e documentadas, `spec.md` Edge Cases); nenhum script
  de seed novo, reaproveita o uso real do app (research.md, Decisão 5);
  `calcularProgressoCiclo` mantém sua própria leitura em vez de introduzir
  uma camada de cache compartilhada entre módulos (research.md, Decisão 7);
  AsyncStorage antigo só deixa de ser lido, sem código de limpeza ativa
  (research.md, Decisão 6).
- **Princípio III (Validação em Dois Dispositivos-Alvo)**: PASS, mesma
  ressalva das specs 022-024 — `quickstart.md` cobre as 6 User Stories em
  Android; iOS permanece pendente só pela falta de conta Apple Developer.
- **Princípio IV (Controle de Dependências)**: PASS — nenhuma dependência
  nova; `firebase-admin` explicitamente rejeitado para o script de seed
  descartado (research.md, Decisão 5).
- **Princípio V (Autenticação Obrigatória e Isolamento por Conta,
  NON-NEGOTIABLE)**: PASS — os dois caminhos novos
  (`users/{uid}/sessoes/*`, `users/{uid}/ciclos/*`) seguem a mesma regra de
  segurança já validada para `treinos`
  (`contracts/firestore-rules.md`), com o mesmo `uid` como parte da chave
  do documento e das regras — nenhuma consulta nem campo de corpo de
  documento é usado para decidir acesso, só o segmento `{uid}` do caminho.

Nenhuma violação — Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/025-migracao-sessoes-historico-ciclo/
├── plan.md               # Este arquivo
├── research.md           # Fase 0 — decisões 1-7 pedidas pelo usuário
├── data-model.md          # Fase 1 — SessaoTreino/SerieRealizada/CicloTreino alterados
├── quickstart.md          # Fase 1 — roteiro de validação manual (8 cenários)
├── contracts/
│   ├── firestore-rules.md            # Fase 1 — regras para sessoes/ciclos
│   ├── sessao-treino-storage.md      # Fase 1 — serviço de sessão migrado
│   ├── ciclo-treino-storage.md       # Fase 1 — serviço de ciclo migrado
│   └── lista-treinos-e-historico.md  # Fase 1 — index.tsx + historico-evolucao.ts
└── tasks.md                # Fase 2 (gerado por /speckit-tasks)
```

### Source Code (repository root)

```text
firestore.rules                        # ALTERADO: + match /sessoes/{sessaoId},
                                          #   + match /ciclos/{cicloId}

src/
├── types/
│   ├── execucao-treino.ts             # ALTERADO: SessaoTreino ganha
│   │                                     #   treinoNomeSnapshot/exerciciosSnapshot;
│   │                                     #   SerieRealizada ganha registradaEm
│   └── perfil.ts                      # ALTERADO: SessaoRegistro.perfilId → uid
├── services/
│   ├── sessao-treino-storage.ts       # ALTERADO: AsyncStorage → Firestore,
│   │                                     #   + listarSessoes, registrarSerieConcluida
│   │                                     #   ganha treinoSnapshot
│   ├── ciclo-treino-storage.ts        # ALTERADO: AsyncStorage → Firestore,
│   │                                     #   calcularProgressoCiclo usa listarSessoes
│   └── historico-evolucao.ts          # ALTERADO: construirRegistrosBrutos lê
│                                         #   snapshot da sessão, não cruza com Treino
├── app/
│   └── (tabs)/
│       └── index.tsx                  # ALTERADO: 3 loaders por-treino viram 1
│                                         #   loader carregarDadosDeSessao
└── components/
    └── treino/
        └── exercicio-execucao.tsx     # ALTERADO: prop onConcluirSerie tipada como
                                          #   Omit<SerieRealizada, 'registradaEm'>

src/types/ciclo-treino.ts               # ALTERADO: CicloTreino.perfilId → uid

src/app/treino/[treinoId].tsx           # ALTERADO: handleConcluirSerie passa
                                          #   treinoSnapshot a registrarSerieConcluida;
                                          #   trava de envio por exercício
                                          #   (exerciciosEnviandoSerie, achada na validação)
```

**Structure Decision**: nenhum arquivo novo de tela/componente/tipo — dois
serviços migram de AsyncStorage para Firestore (mesmo módulo, mesmo nome de
arquivo), um serviço e uma tela ajustam só a origem dos dados que já
consomem, e um componente/uma tela recebem um ajuste pontual de tipo/
parâmetro. `firestore.rules` ganha dois `match` novos, replicando o padrão
já existente.

## Complexity Tracking

*Não aplicável — nenhuma violação da Constitution Check acima.*
