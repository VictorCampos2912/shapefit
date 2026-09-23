# Implementation Plan: Conclusão Explícita de Sessão de Treino

**Branch**: `013-nova-sessao-treino` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-nova-sessao-treino/spec.md`

## Summary

Separar, na tela de execução de treino, a finalização de uma sessão (persistência —
continua 100% automática, disparada assim que o último exercício é concluído) do
reset visual da tela (passa a exigir uma ação explícita do usuário, um novo botão
"Nova sessão de Treino"). Hoje as duas coisas acontecem juntas e instantaneamente,
impedindo o usuário de ver a lista de exercícios estabilizada com todos marcados como
concluídos.

## Technical Context

**Language/Version**: TypeScript (strict), React Native + Expo SDK 57

**Primary Dependencies**: nenhuma dependência nova — reaproveita `finalizarSessao`
(já existente, `src/services/sessao-treino-storage.ts`) e o componente `Button`
(`src/components/ui/button.tsx`, criado nesta sessão de trabalho para as melhorias de
layout)

**Storage**: `AsyncStorage`, chave `sessoes:<perfilId>` — sem alteração de schema

**Testing**: validação manual em Android (Redmi Note 12) e iOS (iPhone 16 Plus), via `quickstart.md`

**Target Platform**: Android 12+ e iOS 17+, via development build

**Project Type**: mobile-app (Expo Router, `src/app/`)

**Performance Goals**: sem meta numérica — mudança é puramente de estado local de UI, sem novo I/O além do já existente (`finalizarSessao` já era chamado, só muda o gatilho)

**Constraints**: nenhuma alteração de comportamento de persistência perceptível (US3) — o contador de sessões finalizadas e o histórico não podem mudar de comportamento

**Scale/Scope**: 1 arquivo de produção alterado (`src/app/treino/[treinoId].tsx`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. TypeScript Obrigatório | ✅ Novo estado (`sessaoFinalizadaAutomaticamente`) tipado como `boolean` via `useState`, sem `any`. |
| II. Simplicidade sobre Funcionalidades Avançadas | ✅ Reaproveita `finalizarSessao` e o componente `Button` já existentes; nenhuma abstração nova além do estritamente necessário para desacoplar as duas responsabilidades (research.md, Decisão 1). |
| III. Validação em Dois Dispositivos-Alvo | ✅ `quickstart.md` com 4 cenários cobrindo as 3 User Stories + não-regressão do "Finalizar treino" manual. |
| IV. Controle de Dependências | ✅ Nenhuma dependência nova. |
| V. Isolamento de Dados por Perfil (NON-NEGOTIABLE) | ✅ `finalizarSessao(perfilAtivo.id, sessaoAtualId)` continua exigindo `perfilId` explícito, sem alteração da chave `sessoes:<perfilId>`. |

Nenhuma violação — Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/013-nova-sessao-treino/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões técnicas
├── data-model.md         # Fase 1 — estado local novo
├── quickstart.md         # Fase 1 — roteiro de validação manual
├── contracts/
│   └── treinoId-screen.md # Fase 1 — handlers e condições de renderização
└── tasks.md              # Fase 2 (gerado por /speckit.tasks)
```

### Source Code (repository root)

```text
src/
└── app/
    └── treino/
        └── [treinoId].tsx   # ALTERADO: novo estado, efeito de auto-finalização
                              #   reescrito, novo handler, condições de botão ajustadas
```

**Structure Decision**: nenhum arquivo novo — toda a mudança é local a uma única tela
já existente, seguindo a estrutura já usada pelo projeto.

## Complexity Tracking

*Não aplicável — nenhuma violação da Constitution Check acima.*
