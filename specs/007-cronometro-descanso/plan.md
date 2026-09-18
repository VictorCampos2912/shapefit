# Implementation Plan: Cronômetro de Descanso

**Branch**: `007-cronometro-descanso` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-cronometro-descanso/spec.md`

## Summary

Implementar o RF05 conectando-se ao ponto de extensão já existente do RF04
(`onIniciarDescanso`, hoje disparado dentro de `handleConcluirSerie` em
`exercicio-execucao.tsx`, sem nenhum efeito). O cronômetro é calculado por
timestamp: ao iniciar (ou ajustar), a rota `src/app/treino/[treinoId].tsx` grava um
`fimEm` absoluto (`Date.now() + duracaoMs`); o tempo restante exibido a qualquer
momento é sempre `fimEm - Date.now()`, nunca um contador decrementado por
`setInterval`. Esse estado (`descansoAtivo: { exercicioId, fimEm } | null`) vive na
rota, no mesmo nível de `estadosPorExercicio` (já estabelecido pelo RF04) — não como
estado local de `ExercicioExecucao`, que continua sendo um componente controlado sem
estado de progresso próprio. Isso garante que o cronômetro sobreviva tanto à
navegação interna à própria rota (lista de exercícios ↔ exercício selecionado,
sem desmontar `[treinoId].tsx`) quanto a minimizar o app (o cálculo por timestamp
absoluto não depende de o processo continuar executando intervalos). `[treinoId].tsx`
é uma rota de nível raiz empilhada por cima das tabs (não aninhada em `(tabs)/`),
então navegar para outra aba do app (ex.: um futuro histórico do RF08) hoje exige
um "voltar" que desmonta a rota — esse caso está fora do que esta feature garante
(ver research.md, Decisão 2, e quickstart.md). Um `setInterval` de 1s
é usado exclusivamente como "tick" de re-render enquanto a tela de execução está em
primeiro plano — nunca como fonte de verdade do valor exibido — e é recalculado
(não pausado) sempre que o app volta ao primeiro plano, via `AppState`. Um novo
componente de UI (`cronometro-descanso.tsx`) exibe o tempo e os controles de
+15s/-15s; a lógica de cálculo de tempo restante fica isolada em uma função pura
testável (`src/utils/cronometro-descanso.ts`), reaproveitada tanto pelo tick quanto
pelo recálculo ao voltar de background. Ao chegar a zero, a rota dispara
`onDescansoConcluido` — um novo ponto de extensão, no mesmo padrão de
`onIniciarDescanso`, sem UI própria — que o RF06 (som/vibração) consumirá depois.

## Technical Context

**Language/Version**: TypeScript (strict, sem `any` implícito), conforme
Constituição Princípio I

**Primary Dependencies**: Expo SDK 57 (gerenciado), Expo Router, React 19 / React
Native 0.86, `AppState` (API nativa do React Native, já disponível, sem pacote
adicional) — nenhuma nova dependência de terceiros é necessária

**Storage**: N/A — o estado do cronômetro é transitório (em memória, na rota),
conforme Assumption da spec; nenhuma escrita em `AsyncStorage` é introduzida por
esta feature

**Testing**: Validação manual em dispositivo real via Expo Go (Android e iOS),
conforme Constituição Princípio III. A função pura de cálculo de tempo restante
(`src/utils/cronometro-descanso.ts`) é escrita de forma isolada e testável, mas o
projeto não tem framework de testes automatizados configurado — nenhum teste
automatizado é adicionado nesta feature além do que já não existia

**Target Platform**: Android 12+ (Redmi Note 12) e iOS 17+ (iPhone 16 Plus), via
Expo Go

**Project Type**: Mobile app (Expo Router, projeto único em `src/`)

**Performance Goals**: Divergência entre tempo exibido e tempo real decorrido de no
máximo 1-2 segundos após navegação ou retorno de background (SC-002); ajuste de
+/-15s refletido imediatamente na UI (SC-003)

**Constraints**: Cálculo de tempo restante MUST ser sempre derivado de
`fimEm - Date.now()` (timestamp absoluto), nunca por decremento de um contador a
cada tick de `setInterval` — meta explícita do usuário para garantir correção após
minimizar o app; o estado do cronômetro (`fimEm`, exercício associado) MUST viver
na rota (`[treinoId].tsx`), não em `ExercicioExecucao`; nenhuma alteração ao ponto
onde `onIniciarDescanso` é hoje disparado dentro de `handleConcluirSerie`

**Scale/Scope**: Um novo componente de UI (`cronometro-descanso.tsx`), uma nova
função utilitária pura (`src/utils/cronometro-descanso.ts`), extensão da rota
`[treinoId].tsx` (novo estado `descansoAtivo` + assinatura de `AppState` + tick de
render) e da prop `onIniciarDescanso` já recebida por `ExercicioExecucao` (que passa
a ser efetivamente conectada, em vez de apenas chamada); nenhuma nova rota, nenhum
novo serviço de storage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. TypeScript Obrigatório**: PASS — todo o código novo (função de cálculo,
  componente de cronômetro, extensão da rota) é TypeScript estrito; o tipo do novo
  estado `descansoAtivo` é explicitamente definido em `src/types/execucao-treino.ts`.
- **II. Simplicidade sobre Funcionalidades Avançadas no MVP**: PASS — nenhuma
  biblioteca de timer/animação de terceiros é introduzida; a solução usa apenas
  `setInterval` (já uma primitiva nativa) para re-render e `Date.now()`/`AppState`
  (nativos) para o cálculo — a alternativa mais simples que ainda atende ao
  requisito de correção após background. Não é introduzida persistência do
  cronômetro em `AsyncStorage` (deliberadamente fora de escopo, ver Assumptions da
  spec).
- **III. Validação em Dois Dispositivos-Alvo**: PASS — plano prevê validação manual
  Android + iOS via Expo Go (ver quickstart.md), com atenção especial ao
  comportamento de `AppState` ao minimizar o app, que pode variar sutilmente entre
  plataformas (timing de `background`/`active`).
- **IV. Controle de Dependências**: PASS — nenhuma dependência nova; `AppState` é
  parte do React Native já em uso, sem necessidade de instalação.
- **V. Isolamento de Dados por Perfil (NON-NEGOTIABLE)**: PASS — o cronômetro não
  introduz nenhuma leitura/escrita de dado de treino/sessão/histórico; é um estado
  puramente transitório de UI, associado à execução em andamento na rota já
  isolada por perfil (a rota só é alcançada a partir de um treino já filtrado por
  `perfilAtivo.id`, herdando o isolamento já garantido pelo RF01/RF02/RF04). Nenhuma
  nova chave de storage é criada.

Nenhuma violação identificada. Seção "Complexity Tracking" não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/007-cronometro-descanso/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── treino/
│       └── [treinoId].tsx             # RF04 — MODIFICADO: novo estado
│                                         `descansoAtivo` (mesmo nível de
│                                         `estadosPorExercicio`); implementa
│                                         `handleIniciarDescanso` (conectado a
│                                         `onIniciarDescanso` do RF04),
│                                         `handleAjustarDescanso` (+/-15s) e
│                                         `handleDescansoConcluido`; assina
│                                         `AppState` para recalcular ao voltar de
│                                         background; renderiza <CronometroDescanso>
│                                         quando `descansoAtivo` não é null
├── components/
│   └── treino/
│       ├── exercicio-execucao.tsx     # RF04 — MODIFICADO: passa a receber e
│       │                                 chamar `onIniciarDescanso` com os dados
│       │                                 necessários (exercicioId, descansoSeg) em
│       │                                 vez da chamada sem argumentos já existente
│       └── cronometro-descanso.tsx    # NOVO — UI do cronômetro: exibe tempo
│                                         restante formatado e os controles
│                                         "+15s"/"-15s"; recebe `segundosRestantes`
│                                         e callbacks via props, sem estado próprio
│                                         (mesmo padrão "componente controlado" do
│                                         RF04)
└── utils/
    └── cronometro-descanso.ts         # NOVO — funções puras: calcular tempo
                                          restante a partir de `fimEm` e `Date.now()`
                                          (nunca negativo), aplicar ajuste de +/-15s
                                          a um `fimEm` existente, e formatar segundos
                                          para exibição (mm:ss)
```

**Structure Decision**: Mantém a estrutura de projeto único já estabelecida
(RF01-RF04) — `src/app` para rotas, `src/components/treino` para UI,
`src/utils` para lógica pura sem dependência de React/Storage (novo, mas alinhado
ao padrão de `src/services` para I/O e `src/types` para tipos de domínio: aqui é
lógica de cálculo pura, sem I/O, então não se encaixa em `services`). Nenhuma nova
rota; extensão da rota e do componente já existentes do RF04, seguindo
explicitamente o padrão de "estado na rota, componente controlado" já estabelecido
por `estadosPorExercicio`/`ExercicioExecucao`.

## Complexity Tracking

*Não se aplica — nenhuma violação da Constitution Check foi identificada.*
