# Implementation Plan: Histórico de Evolução de Carga por Exercício

**Branch**: `010-historico-evolucao-carga` | **Date**: 2026-09-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-historico-evolucao-carga/spec.md`

## Summary

Implementar o RF08 introduzindo um novo serviço dedicado,
`src/services/historico-evolucao.ts`, que cruza os treinos do perfil ativo
(`listarTreinos`, já existente do RF01) com as sessões finalizadas desse perfil (nova
função `listarSessoesFinalizadas`, adicionada a `sessao-treino-storage.ts`, RF04/RF07)
para montar a evolução por exercício exigida pela spec. A resolução de nome do
exercício a partir de `treinoId` + `exercicioId` (FR-004) e o agrupamento por nome
(FR-005) vivem nesse novo serviço; a normalização de grafia (FR-006) é extraída para
uma função pura e testável separada, `normalizarNomeExercicio` em
`src/utils/normalizar-nome-exercicio.ts`, seguindo o mesmo padrão já estabelecido por
`src/utils/cronometro-descanso.ts` (RF05/RF06) de isolar lógica pura de cálculo fora
dos serviços de storage e das telas. A omissão defensiva de registros não resolvíveis
(FR-013) é acompanhada de um `console.warn` (FR-014), emitido dentro do próprio
`historico-evolucao.ts`, no ponto exato em que a omissão ocorre.

A aba "Explore" (`src/app/(tabs)/explore.tsx`) é inteiramente reescrita, removendo todo
o boilerplate do template Expo — **inclusive reaproveitando**, e não removendo, o
componente `Collapsible` que o boilerplate já usava, agora para renderizar cada
exercício como uma seção expansível contendo sua lista de registros. Isso evita
introduzir uma rota nova só para exibir a evolução de um exercício específico,
mantendo tudo em uma única tela, consistente com Constituição Princípio II
(simplicidade). Nenhuma mudança em `app-tabs.tsx`/`app-tabs.web.tsx` — a aba continua
rotulada "Explore", com o mesmo ícone, seguindo exatamente o precedente já
estabelecido pelo RF02 na aba "Home" (spec.md, Assumptions: a aba manteve o rótulo
"Home" mesmo após seu conteúdo ser inteiramente substituído pela lista de treinos).

## Technical Context

**Language/Version**: TypeScript (strict, sem `any` implícito), conforme
Constituição Princípio I

**Primary Dependencies**: Nenhuma nova. Reaproveita
`@react-native-async-storage/async-storage` (já em uso por `treino-storage.ts` e
`sessao-treino-storage.ts`) e `useFocusEffect` de `expo-router` (já em uso por
`src/app/(tabs)/index.tsx`, RF02/RF07, para recarregar dados ao voltar o foco para a
aba).

**Storage**: `AsyncStorage`, apenas leitura de duas chaves já existentes:
`treinos:${perfilId}` (RF01, via `listarTreinos`) e `sessoes:${perfilId}` (RF04/RF07,
via nova `listarSessoesFinalizadas`). Esta feature não introduz nenhuma nova chave de
storage nem grava nada — é puramente leitura e agregação em memória dos dados já
persistidos por RF01/RF02 e RF04/RF07.

**Testing**: Validação manual em dispositivo real via **development build** (Android e
iOS) — não Expo Go, pelo mesmo motivo já registrado em
`specs/009-salvar-sessao-treino/plan.md` (import de `expo-notifications` em
`src/app/_layout.tsx` quebra o Expo Go/Android desde o RF06, independentemente desta
feature usar ou não notificações). O projeto não tem framework de testes automatizados
configurado; a função pura `normalizarNomeExercicio` é escrita de forma que **poderia**
ser testada por um framework de testes se um vier a ser adotado, mas nenhum teste
automatizado é adicionado por esta feature, consistente com as features anteriores.

**Target Platform**: Android 12+ (Redmi Note 12) e iOS 17+ (iPhone 16 Plus)

**Project Type**: Mobile app (Expo Router, projeto único em `src/`)

**Performance Goals**: Montar a lista de evolução ao focar a aba "Explore" deve
refletir na UI em um único ciclo de renderização perceptível como instantâneo — mesma
expectativa já aplicada às demais leituras de storage do app (RF02, RF07). O volume de
dados esperado (uso pessoal, semanas/meses) não introduz nenhuma preocupação de
performance que justifique paginação ou memoização adicional (spec.md, Assumptions).

**Constraints**: A resolução de nome (FR-004) MUST cruzar cada execução registrada com
o treino correspondente via `treinoId`, nunca assumir que `exercicioId` é
globalmente único. A normalização (FR-006) MUST ser limitada a espaços (início, fim,
múltiplos internos) e caixa (maiúsculas/minúsculas) — nenhuma normalização de
acentuação ou pontuação. A lista de registros de cada exercício MUST estar ordenada da
sessão mais recente para a mais antiga (FR-007), usando `finalizadaEm` da sessão como
critério de data (ver research.md, Decisão 7). Sessões com `finalizadaEm === null`
MUST ser excluídas (FR-002/FR-003). Um exercício sem nenhum registro MUST continuar
aparecendo na tela com uma indicação explícita de "sem registros" (FR-009), não ser
omitido da lista de exercícios. A tela inteira MUST indicar claramente a ausência de
qualquer sessão finalizada quando for o caso (FR-010), distinto do caso anterior. Toda
leitura MUST ser filtrada pelo `perfilId` ativo (FR-011/FR-012, Princípio V da
Constituição). Registros não resolvíveis MUST ser omitidos da UI e MUST gerar um
`console.warn` de diagnóstico (FR-013/FR-014).

**Scale/Scope**: Um novo serviço (`src/services/historico-evolucao.ts`), uma nova
função em um serviço existente (`sessao-treino-storage.ts`), um novo arquivo de tipos
(`src/types/historico.ts`), uma nova função utilitária pura
(`src/utils/normalizar-nome-exercicio.ts`), e a reescrita completa de uma tela já
existente (`src/app/(tabs)/explore.tsx`). Nenhuma nova rota, nenhum novo componente de
navegação, nenhuma nova dependência de terceiros.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. TypeScript Obrigatório**: PASS — todos os arquivos novos/modificados são
  TypeScript estrito; os novos tipos (`RegistroHistorico`, `EvolucaoExercicio`,
  `HistoricoPerfil`) são definidos explicitamente em `src/types/historico.ts`, sem
  `any`.
- **II. Simplicidade sobre Funcionalidades Avançadas no MVP**: PASS — nenhuma
  biblioteca de gráfico é introduzida (decisão já registrada no PRD/spec: lista
  simples, sem gráfico); a tela reaproveita o componente `Collapsible` que já existia
  no próprio arquivo, evitando uma rota nova só para exibir a evolução de um
  exercício; a função de normalização usa apenas `String.prototype.trim`/`replace`
  (sem regex de acentuação, sem biblioteca de i18n/slugify).
- **III. Validação em Dois Dispositivos-Alvo**: PASS — quickstart.md prevê validação
  manual Android + iOS, incluindo os cenários de unificação entre treinos e de
  estados vazios.
- **IV. Controle de Dependências**: PASS — nenhuma dependência nova introduzida.
- **V. Isolamento de Dados por Perfil (NON-NEGOTIABLE)**: PASS — `obterHistoricoPorPerfil`
  recebe `perfilId` explicitamente e só lê `treinos:${perfilId}` e
  `sessoes:${perfilId}`; nenhuma consulta cruza `perfilId` diferentes; a tela recarrega
  o histórico sempre que `perfilAtivo?.id` muda (mesmo padrão do RF02/RF07), garantindo
  FR-012 (atualização imediata ao trocar de perfil).

Nenhuma violação identificada. Seção "Complexity Tracking" não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/010-historico-evolucao-carga/
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
│   └── (tabs)/
│       └── explore.tsx                 # RF02 (boilerplate do template) —
│                                          REESCRITO: tela de histórico de evolução
│                                          por exercício (RF08); reaproveita
│                                          `Collapsible` (uma seção expansível por
│                                          exercício); estados vazios de tela inteira
│                                          (FR-010) e por exercício (FR-009); recarrega
│                                          via `useFocusEffect` + efeito em
│                                          `perfilAtivo?.id`
├── services/
│   ├── sessao-treino-storage.ts        # RF04/RF07 — MODIFICADO: nova função
│                                          `listarSessoesFinalizadas(perfilId):
│                                          Promise<SessaoTreino[]>`
│   └── historico-evolucao.ts           # NOVO — `obterHistoricoPorPerfil(perfilId):
│                                          Promise<HistoricoPerfil>`; cruza
│                                          `listarTreinos` + `listarSessoesFinalizadas`,
│                                          resolve nome de cada exercício (FR-004),
│                                          agrupa via `normalizarNomeExercicio`
│                                          (FR-005/FR-006), ordena registros por
│                                          `finalizadaEm` desc (FR-007), emite
│                                          `console.warn` para registros não
│                                          resolvíveis (FR-013/FR-014)
├── types/
│   └── historico.ts                    # NOVO — `RegistroHistorico`,
│                                          `EvolucaoExercicio`, `HistoricoPerfil`
└── utils/
    └── normalizar-nome-exercicio.ts    # NOVO — `normalizarNomeExercicio(nome: string):
                                           string`, função pura (trim + colapsar
                                           espaços internos + lowercase), sem
                                           dependência de storage/UI
```

**Structure Decision**: Mantém a estrutura de projeto único já estabelecida
(RF01–RF07). Um serviço novo é criado (`historico-evolucao.ts`) em vez de estender
`treino-storage.ts` ou `sessao-treino-storage.ts` diretamente, seguindo o mesmo
princípio de separação de responsabilidades já aplicado pelo RF07 ao decidir manter
`contarSessoesFinalizadas` dentro de `sessao-treino-storage.ts` em vez de movê-la para
`treino-storage.ts` (specs/009-salvar-sessao-treino/research.md, Decisão 10) — aqui a
lógica é ainda mais clara de isolar, pois `historico-evolucao.ts` depende dos **dois**
serviços existentes simultaneamente, não fazendo sentido viver dentro de nenhum dos
dois. Nenhuma nova rota é criada (ver research.md, Decisão 8).

## Complexity Tracking

*Não se aplica — nenhuma violação da Constitution Check foi identificada.*
