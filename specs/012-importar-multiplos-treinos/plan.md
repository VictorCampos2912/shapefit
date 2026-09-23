# Implementation Plan: Importar Múltiplos Treinos de um Único Arquivo

**Branch**: `012-importar-multiplos-treinos` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-importar-multiplos-treinos/spec.md`

## Summary

Estender a importação de treino (RF01) para reconhecer, pela raiz do JSON
selecionado, se o arquivo contém um treino único (objeto — comportamento inalterado)
ou múltiplos treinos (array — novo). A validação por treino e por exercício já
existentes (`validarEstruturaTreino`, `validarExercicio`) são extraídas para uma
função pura (`montarTreinoValido`) reaproveitada pelos dois caminhos, evitando
duplicação de lógica. Persistência do lote de treinos válidos ocorre em uma única
leitura/escrita do `AsyncStorage`, e o usuário recebe uma única mensagem resumida ao
final (nunca uma por treino).

## Technical Context

**Language/Version**: TypeScript (strict), React Native + Expo SDK 57

**Primary Dependencies**: nenhuma dependência nova — reaproveita `expo-document-picker`
e `expo-crypto` já usados pelo RF01; nenhuma biblioteca externa adicional necessária
para detectar array vs. objeto (`Array.isArray` é nativo do JS)

**Storage**: `AsyncStorage`, chave `treinos:<perfilId>` (`@react-native-async-storage/async-storage`, já em uso) — sem alteração de schema

**Testing**: validação manual em Android (Redmi Note 12) e iOS (iPhone 16 Plus), via `quickstart.md` — mesmo padrão já usado em todas as features anteriores do projeto (sem suíte de testes automatizados no MVP)

**Target Platform**: Android 12+ e iOS 17+, via development build (Expo Go não suportado desde o RF06)

**Project Type**: mobile-app (Expo Router, `src/app/`)

**Performance Goals**: sem meta numérica específica — a operação é local (sem rede) e limitada ao tamanho de um arquivo JSON selecionado pelo usuário; não há expectativa de arquivos com centenas de treinos

**Constraints**: offline-only (RNF02 do PRD); interação principal (importar) não deve exigir mais toques do que hoje (um único "Importar treino" continua cobrindo os dois casos, sem escolha extra do usuário)

**Scale/Scope**: 2 arquivos de produção alterados (`src/services/treino-storage.ts`, `src/types/treino.ts`) + 1 call site ajustado (`src/app/(tabs)/index.tsx`); nenhuma tela nova

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. TypeScript Obrigatório | ✅ Todos os tipos novos (`TreinoIgnorado`, `TreinoImportadoComPendencias`, `ResultadoImportacaoMultipla`) explicitamente definidos em `src/types/treino.ts`, sem `any`. |
| II. Simplicidade sobre Funcionalidades Avançadas | ✅ Reaproveita a validação existente (Decisão 1 do `research.md`), sem introduzir tela nova, configuração nova ou escolha extra do usuário. Rejeitou explicitamente a alternativa de duplicar lógica de validação. |
| III. Validação em Dois Dispositivos-Alvo | ✅ Plano de validação manual documentado em `quickstart.md`, cobrindo Android e iOS, com 5 cenários mapeados às User Stories/FRs da spec. |
| IV. Controle de Dependências | ✅ Nenhuma dependência nova introduzida — `Array.isArray` é nativo do JavaScript, sem necessidade de biblioteca. |
| V. Isolamento de Dados por Perfil (NON-NEGOTIABLE) | ✅ `perfilId` continua obrigatório em `montarTreinoValido` (usado para montar cada `Treino`) e a chave de persistência (`treinos:<perfilId>`) não muda — nenhum treino importado por esta feature pode vazar entre perfis, mesmo no caminho de múltiplos treinos. |

Nenhuma violação — Complexity Tracking não se aplica a esta feature.

## Project Structure

### Documentation (this feature)

```text
specs/012-importar-multiplos-treinos/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões técnicas
├── data-model.md         # Fase 1 — tipos novos e entidades afetadas
├── quickstart.md         # Fase 1 — roteiro de validação manual
├── contracts/
│   └── treino-storage.md # Fase 1 — assinaturas de função (contrato interno)
└── tasks.md              # Fase 2 (gerado por /speckit.tasks, ainda não existe)
```

### Source Code (repository root)

```text
src/
├── services/
│   └── treino-storage.ts   # ALTERADO: processarConteudo ganha branch de array;
│                            # nova função interna montarTreinoValido
├── types/
│   └── treino.ts            # ALTERADO: + TreinoIgnorado, TreinoImportadoComPendencias,
│                            #   ResultadoImportacaoMultipla
└── app/
    └── (tabs)/
        └── index.tsx         # ALTERADO: exibirResultadoImportacao ganha branch
                              #   para ResultadoImportacaoMultipla (type guard)
```

**Structure Decision**: projeto mobile único (Expo Router), sem separação
frontend/backend — segue exatamente a estrutura já usada por todas as specs
anteriores do projeto (`src/services/`, `src/types/`, `src/app/`). Nenhuma pasta nova
criada; apenas arquivos já existentes são alterados.

## Complexity Tracking

*Não aplicável — nenhuma violação da Constitution Check acima.*
