# Implementation Plan: Editar Registro de Série de uma Sessão Já Finalizada

**Branch**: `011-editar-serie-finalizada` | **Date**: 2026-09-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-editar-serie-finalizada/spec.md`

## Summary

Implementar o RF09b estendendo o tipo `RegistroHistorico` (RF08,
`src/types/historico.ts`) com `sessaoId`, `exercicioId` e `serie`, permitindo que a
tela de histórico identifique de forma inequívoca qual série gravar ao confirmar uma
edição (FR-002). `historico-evolucao.ts` já calcula esses três valores internamente ao
montar cada registro — a mudança é apenas incluí-los na projeção final para
`RegistroHistorico`, sem alterar o algoritmo de agrupamento/ordenação do RF08.

Uma nova função `atualizarSerieDeSessaoFinalizada` é adicionada a
`sessao-treino-storage.ts`, localizando a sessão por `id` (mesmo padrão de
`finalizarSessao`, RF07) em vez de por `treinoId` (que a função irmã do RF09a,
`atualizarSerieRealizada`, usa, e que se torna ambíguo assim que múltiplas sessões
finalizadas do mesmo treino coexistem — RF07). Como sugestão de robustez do usuário, a
nova função valida defensivamente que a sessão localizada tem `finalizadaEm !== null`
antes de gravar, lançando erro caso contrário — mesmo padrão de erro já usado por
`marcarExercicioConcluido` para "sessão/execução não encontrada".

Na UI, a aba "Histórico" (`explore.tsx`, RF08) passa a permitir tocar em qualquer
registro exibido para editá-lo — reaproveitando integralmente o padrão de interação já
validado pelo RF09a (campos editáveis inline, `Alert.alert` de confirmação antes de
persistir). As funções puras de sanitização de entrada (`sanitizarCarga`/
`sanitizarReps`), hoje privadas dentro de `exercicio-execucao.tsx` (RF04/RF09a), são
extraídas para um utilitário compartilhado, para serem reaproveitadas por esta feature
sem duplicar a lógica de validação em dois arquivos.

## Technical Context

**Language/Version**: TypeScript (strict, sem `any` implícito), conforme
Constituição Princípio I

**Primary Dependencies**: Nenhuma nova. Reaproveita `react-native` (`Alert`, já usado
pelo RF09a), `@react-native-async-storage/async-storage` (já em uso por
`sessao-treino-storage.ts`).

**Storage**: `AsyncStorage`, mesma chave já existente `sessoes:${perfilId}` (RF04/RF07).
Esta feature adiciona uma função de escrita (`atualizarSerieDeSessaoFinalizada`) que
localiza e substitui `cargaKg`/`reps` de uma `SerieRealizada` já existente dentro de
`SessaoTreino.execucoes[].seriesRealizadas` — nenhuma nova chave, nenhuma nova
estrutura de dados persistida.

**Testing**: Validação manual em dispositivo real via **development build** (Android e
iOS) — não Expo Go, migração já documentada desde o RF06 e reconfirmada no PRD v1.1
(seção 9): `expo-notifications` quebra o carregamento do app no Expo Go puro no
Android, então toda validação manual a partir do RF06 usa development build. O projeto
não tem framework de testes automatizados configurado; nenhum teste automatizado é
adicionado por esta feature.

**Target Platform**: Android 12+ (Redmi Note 12) e iOS 17+ (iPhone 16 Plus)

**Project Type**: Mobile app (Expo Router, projeto único em `src/`)

**Performance Goals**: Editar e confirmar um registro em no máximo 4 toques (SC-001),
sem percepção de atraso — mesma expectativa já validada pelo RF09a; leitura/escrita em
`AsyncStorage` local, sem chamadas de rede.

**Constraints**: A nova função de escrita DEVE localizar a sessão por `id`, nunca por
`treinoId` sozinho (FR-002, research.md Decisão 2). DEVE validar `finalizadaEm !==
null` antes de gravar, lançando erro caso contrário (sugestão de robustez do usuário;
research.md Decisão 3). A edição NÃO DEVE, em nenhuma circunstância, alterar
`finalizadaEm` da sessão (FR-007). Toda edição DEVE passar por confirmação via
`Alert.alert` antes de persistir (FR-005), reaproveitando o mesmo padrão do RF09a. A
edição DEVE refletir na tela de histórico imediatamente, sem recarregar manualmente
(FR-010).

**Scale/Scope**: Extensão de `src/types/historico.ts` (`RegistroHistorico` ganha 3
campos), `src/services/historico-evolucao.ts` (projeta os 3 campos novos, sem mudar o
algoritmo de agrupamento), `src/services/sessao-treino-storage.ts` (nova função),
`src/app/(tabs)/explore.tsx` (UI de edição inline por registro), e extração de um
utilitário compartilhado (`sanitizarCarga`/`sanitizarReps`) a partir de
`src/components/treino/exercicio-execucao.tsx`. Nenhuma nova rota, nenhuma nova
dependência.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. TypeScript Obrigatório**: PASS — toda a extensão (novos campos de tipo, nova
  função de serviço, novo estado de UI) é TypeScript estrito, sem `any`.
- **II. Simplicidade sobre Funcionalidades Avançadas no MVP**: PASS — reaproveita
  integralmente o padrão de UI já validado pelo RF09a (`Alert.alert` nativo, sem
  biblioteca de modal adicional); a extração de `sanitizarCarga`/`sanitizarReps` para
  um utilitário compartilhado remove duplicação em vez de introduzi-la; nenhum
  versionamento/histórico de alterações é adicionado (não pedido pela spec).
- **III. Validação em Dois Dispositivos-Alvo**: PASS — quickstart.md prevê validação
  manual Android + iOS via development build antes de considerar a feature concluída.
- **IV. Controle de Dependências**: PASS — nenhuma dependência nova.
- **V. Isolamento de Dados por Perfil (NON-NEGOTIABLE)**: PASS —
  `atualizarSerieDeSessaoFinalizada` recebe `perfilId` explícito e opera exclusivamente
  sobre `sessoes:${perfilId}` desse perfil, seguindo o mesmo padrão já estabelecido por
  todas as demais funções do serviço.

Nenhuma violação identificada. Seção "Complexity Tracking" não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/011-editar-serie-finalizada/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── (tabs)/
│       └── explore.tsx                    # RF08 — MODIFICADO: cada registro exibido
│                                             dentro de um `Collapsible` passa a ser
│                                             tocável; estado local de edição por
│                                             seção (`edicaoAtiva`), campos de
│                                             carga/reps, `Alert.alert` de confirmação,
│                                             chama o novo handler
│                                             `handleEditarRegistro`, que atualiza o
│                                             `historico` em memória (patch pontual do
│                                             registro editado, sem recarregar tudo)
├── components/
│   └── treino/
│       └── exercicio-execucao.tsx         # RF04/RF09a — MODIFICADO: `sanitizarCarga`/
│                                             `sanitizarReps` deixam de ser funções
│                                             privadas do arquivo, passam a importar do
│                                             novo utilitário compartilhado
├── services/
│   ├── sessao-treino-storage.ts           # RF04/RF07/RF09a — MODIFICADO (aditivo):
│                                             nova função
│                                             `atualizarSerieDeSessaoFinalizada(params):
│                                             Promise<SessaoTreino>`
│   └── historico-evolucao.ts              # RF08 — MODIFICADO: `RegistroHistorico`
│                                             projetado ao final do algoritmo passa a
│                                             incluir `sessaoId`, `exercicioId`,
│                                             `serie` (já calculados internamente, sem
│                                             mudança de agrupamento/ordenação)
├── types/
│   └── historico.ts                        # RF08 — MODIFICADO: `RegistroHistorico`
│                                             ganha `sessaoId: string`,
│                                             `exercicioId: string`, `serie: number`
└── utils/
    └── sanitizar-serie.ts                  # NOVO — `sanitizarCarga`/`sanitizarReps`,
                                              extraídas de `exercicio-execucao.tsx`
                                              (RF09a) sem alteração de comportamento
```

**Structure Decision**: Mantém a estrutura de projeto único já estabelecida
(RF01–RF10). Nenhuma nova rota, nenhum novo componente de tela dedicado — a edição vive
inline dentro da própria seção `Collapsible` já existente no RF08, mesmo princípio de
simplicidade já aplicado pelo RF09a (edição inline na lista de séries, sem modal/tela
separada). A única extração estrutural nova é o utilitário de sanitização
compartilhado, necessário porque a mesma validação de entrada agora é usada por dois
componentes de tela diferentes (`exercicio-execucao.tsx` e `explore.tsx`), que antes
não tinham motivo para compartilhar código.

## Complexity Tracking

*Não se aplica — nenhuma violação da Constitution Check foi identificada.*
