# Implementation Plan: Vibração Diferenciada ao Fim do Descanso

**Branch**: `014-vibracao-fim-descanso` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-vibracao-fim-descanso/spec.md`

## Summary

Adicionar uma vibração perceptivelmente mais forte que a da notificação do sistema,
disparada no exato momento em que o descanso termina com o app em primeiro plano —
usando `Vibration.vibrate` (API nativa do React Native, sem dependência nova), dentro
da função `handleDescansoConcluido` já existente. Som fica fora do escopo (decisão
explícita do usuário).

## Technical Context

**Language/Version**: TypeScript (strict), React Native + Expo SDK 57

**Primary Dependencies**: nenhuma dependência nova — `Vibration` já faz parte do
`react-native` core

**Storage**: N/A — sem persistência envolvida

**Testing**: validação manual em Android (Redmi Note 12) e iOS (iPhone 16 Plus); **não
verificável via web/emulador** — exige aparelho físico com vibração

**Target Platform**: Android 12+ e iOS 17+, via development build

**Project Type**: mobile-app (Expo Router, `src/app/`)

**Performance Goals**: N/A — chamada síncrona e instantânea, sem I/O

**Constraints**: não pode alterar o comportamento já existente da notificação do
sistema (RF06); não pode introduzir dependência nova nesta rodada (decisão do
usuário)

**Scale/Scope**: 1 arquivo de produção alterado (`src/app/treino/[treinoId].tsx`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. TypeScript Obrigatório | ✅ Constante `PADRAO_VIBRACAO_FIM_DESCANSO` tipada implicitamente como `number[]`, sem `any`. |
| II. Simplicidade sobre Funcionalidades Avançadas | ✅ Um único ponto de disparo (`handleDescansoConcluido`), sem nova abstração; som explicitamente adiado para não inflar o escopo desta rodada. |
| III. Validação em Dois Dispositivos-Alvo | ✅ `quickstart.md` com 4 cenários — nota explícita de que esta feature não é verificável via web, só em aparelho físico. |
| IV. Controle de Dependências | ✅ Nenhuma dependência nova — `Vibration` é API nativa do React Native já em uso pelo projeto (RN core, não um pacote npm separado). |
| V. Isolamento de Dados por Perfil (NON-NEGOTIABLE) | ✅ Não aplicável — feature não lê nem escreve nenhum dado de perfil/treino/sessão. |

Nenhuma violação — Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/014-vibracao-fim-descanso/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões técnicas
├── data-model.md         # Fase 1 — N/A, sem entidades
├── quickstart.md         # Fase 1 — roteiro de validação manual
├── contracts/
│   └── treinoId-screen.md # Fase 1 — handleDescansoConcluido ajustado
└── tasks.md              # Fase 2 (gerado por /speckit.tasks)
```

### Source Code (repository root)

```text
src/
└── app/
    └── treino/
        └── [treinoId].tsx   # ALTERADO: import de Vibration, nova constante,
                              #   handleDescansoConcluido chama Vibration.vibrate
```

**Structure Decision**: nenhum arquivo novo — mudança local a uma função já existente
na mesma tela alterada pela spec 013.

## Complexity Tracking

*Não aplicável — nenhuma violação da Constitution Check acima.*
