# Implementation Plan: Editar Registro de Série Já Feito (Sessão em Andamento)

**Branch**: `006-editar-serie-em-andamento` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-editar-serie-em-andamento/spec.md`

## Summary

Implementar o RF09a: permitir editar `cargaKg` e/ou `reps` de qualquer `SerieRealizada` já
concluída do exercício atualmente aberto na tela de execução (RF04) — incluindo séries de
um exercício já marcado como `concluido`, reaberto apenas para visualização/edição, sem
reverter seu status. A edição reaproveita integralmente as estruturas de dados e a chave de
persistência já criadas pelo RF04 (`SerieRealizada`, `ExecucaoExercicio`, `SessaoTreino` em
`src/types/execucao-treino.ts`; chave `sessoes:<perfilId>` em `sessao-treino-storage.ts`),
adicionando uma única função de escrita nova (`atualizarSerieRealizada`) que localiza a
série pelo número (`serie`) dentro de `ExecucaoExercicio.seriesRealizadas` e substitui
`cargaKg`/`reps`, sem tocar em `status`, `finalizadaEm` ou qualquer outro campo. Na UI,
`ExercicioExecucao` (RF04) passa a exibir a lista de séries já concluídas com uma ação de
editar por item; a edição usa as mesmas funções de sanitização de entrada já existentes
(`sanitizarCarga`/`sanitizarReps`) e exige confirmação via `Alert.alert` (nativo do React
Native, sem nova dependência) antes de persistir. A tela `[treinoId].tsx` (RF04) passa a
permitir reabrir um exercício já concluído em modo de visualização/edição (hoje ela impede
implicitamente essa reabertura ao não oferecer a lista de séries quando `concluido` é
`true` e `jaEstavaConcluidoAoAbrir` também é `true`).

## Technical Context

**Language/Version**: TypeScript (strict, sem `any` implícito), conforme Constituição
Princípio I

**Primary Dependencies**: Expo SDK 57 (gerenciado), React Native 0.86 (`Alert` do próprio
`react-native`, já disponível, sem nova dependência), Expo Router, `@react-native-async-
storage/async-storage` — todas já presentes no projeto; nenhuma nova dependência é
necessária

**Storage**: `AsyncStorage`, mesma chave `sessoes:<perfilId>` já usada pelo RF04
(`sessao-treino-storage.ts`). Esta feature adiciona uma função de escrita
(`atualizarSerieRealizada`) que localiza e substitui uma `SerieRealizada` existente dentro
de `SessaoTreino.execucoes[].seriesRealizadas` — nenhuma nova chave, nenhuma nova estrutura
de dados

**Testing**: Validação manual em dispositivo real via Expo Go (Android e iOS), conforme
Constituição Princípio III — sem framework de testes automatizados configurado no projeto

**Target Platform**: Android 12+ (Redmi Note 12) e iOS 17+ (iPhone 16 Plus), via Expo Go

**Project Type**: Mobile app (Expo Router, projeto único em `src/`)

**Performance Goals**: Editar e confirmar uma série em no máximo 4 toques (SC-001), sem
percepção de atraso; leitura/escrita em `AsyncStorage` local, sem chamadas de rede

**Constraints**: Deve funcionar offline (RNF02 do PRD); edição restrita ao exercício
atualmente aberto na tela de execução (fora de escopo: outros exercícios do mesmo treino,
séries de outras sessões, sessões já finalizadas — RF09b); a edição MUST NOT alterar
`status` do exercício nem `finalizadaEm` da sessão; toda edição MUST passar por confirmação
via `Alert.alert` antes de persistir

**Scale/Scope**: Uma nova função no serviço existente (`sessao-treino-storage.ts`), extensão
do componente `exercicio-execucao.tsx` (RF04) para exibir/editar a lista de séries
concluídas, e um ajuste mínimo em `[treinoId].tsx` (RF04) para permitir reabrir um exercício
já concluído em modo visualização/edição; nenhuma nova rota, nenhum novo tipo de dado

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. TypeScript Obrigatório**: PASS — toda a extensão (nova função de serviço, props de
  componente, handlers) é TypeScript estrito, reaproveitando os tipos de domínio já
  definidos em `src/types/execucao-treino.ts` sem introduzir `any`.
- **II. Simplicidade sobre Funcionalidades Avançadas no MVP**: PASS — a confirmação usa
  `Alert.alert` nativo (já disponível via `react-native`, sem biblioteca de modal/diálogo
  adicional); a edição é uma operação direta de "localizar por número de série e substituir
  campos", sem versionamento, auditoria ou histórico de alterações (não pedido pelo PRD/
  critérios de aceite do RF09a).
- **III. Validação em Dois Dispositivos-Alvo**: PASS — plano prevê validação manual Android
  + iOS via Expo Go antes de considerar a feature concluída (ver quickstart.md), com atenção
  especial ao comportamento de `Alert.alert` (que já é nativo em ambas plataformas, mas com
  apresentação visual diferente) e aos mesmos campos de `TextInput` numérico/decimal que já
  têm histórico de comportamento divergente entre plataformas (RF03).
- **IV. Controle de Dependências**: PASS — nenhuma dependência nova; `Alert` é parte do
  módulo `react-native` já em uso.
- **V. Isolamento de Dados por Perfil (NON-NEGOTIABLE)**: PASS — a nova função de escrita
  (`atualizarSerieRealizada`) opera sobre a mesma chave `sessoes:<perfilId>` já
  parametrizada por `perfilId`, seguindo exatamente o mesmo padrão das funções existentes
  (`registrarSerieConcluida`, `marcarExercicioConcluido`) — nenhuma leitura/escrita ocorre
  sem `perfilId` explícito, obtido via `usePerfilAtivo()` sem modificação.

Nenhuma violação identificada. Seção "Complexity Tracking" não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/006-editar-serie-em-andamento/
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
│       └── [treinoId].tsx             # RF04 — MODIFICADO: permite reabrir um exercício já
│                                         concluído em modo visualização/edição (hoje só
│                                         exibe a tela de "parabéns" sem lista de séries
│                                         quando concluído + jaEstavaConcluidoAoAbrir); passa
│                                         a fornecer o handler onEditarSerie, que chama o
│                                         novo serviço e sincroniza seriesConcluidas em
│                                         estadosPorExercicio após a edição
├── components/
│   └── treino/
│       └── exercicio-execucao.tsx     # RF04 — MODIFICADO: passa a renderizar a lista de
│                                         séries já concluídas (número, carga, reps) com ação
│                                         de editar por item, reaproveitando
│                                         sanitizarCarga/sanitizarReps já existentes; ao
│                                         confirmar edição, dispara Alert.alert antes de
│                                         chamar onEditarSerie
├── services/
│   └── sessao-treino-storage.ts       # RF04 — MODIFICADO (aditivo): nova função
│                                         atualizarSerieRealizada(perfilId, treinoId,
│                                         exercicioId, serie, novosValores) — localiza a
│                                         SerieRealizada pelo número e substitui
│                                         cargaKg/reps, sem alterar status/finalizadaEm
└── types/
    └── execucao-treino.ts              # RF04 — reaproveitado sem alteração de campos
                                          (SerieRealizada, ExecucaoExercicio, SessaoTreino,
                                          EstadoExecucaoExercicio já suportam o que esta
                                          feature precisa)
```

**Structure Decision**: Mantém a estrutura de projeto único já estabelecida (RF01-RF04) —
nenhuma nova pasta, nenhum novo tipo, nenhuma nova rota. Toda a feature é uma extensão
aditiva de três arquivos já existentes do RF04 (`sessao-treino-storage.ts`,
`exercicio-execucao.tsx`, `[treinoId].tsx`), consistente com o Princípio II (simplicidade) —
evita introduzir uma tela/modal separada para edição quando a extensão inline do componente
já existente resolve o requisito.

## Complexity Tracking

*Não se aplica — nenhuma violação da Constitution Check foi identificada.*
