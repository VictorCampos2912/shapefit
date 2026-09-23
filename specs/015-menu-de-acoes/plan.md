# Implementation Plan: Tela Separada para Ações de Perfil e Importação

**Branch**: `015-menu-de-acoes` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-menu-de-acoes/spec.md`

## Summary

Mover os atalhos de trocar perfil, importar treino e importar treino de exemplo da
tela "Treinos" para uma nova tela dedicada (`/acoes`), acessada por um ícone na linha
de título de cada aba (Treinos e Histórico) — já que a API de tabs nativas usada pelo
projeto não expõe um slot de cabeçalho customizável para colocar esse ícone num lugar
verdadeiramente compartilhado entre abas. Nenhuma dependência nova; nenhuma mudança
de comportamento nas três ações em si.

## Technical Context

**Language/Version**: TypeScript (strict), React Native + Expo SDK 57

**Primary Dependencies**: nenhuma dependência nova — reaproveita Expo Router
(`router.push`/`router.back`) e `react-native-svg` (já em uso) para o novo ícone

**Storage**: N/A — feature de navegação/UI, sem dado novo

**Testing**: validação manual em Android/iOS + verificável via Expo web (Playwright)

**Target Platform**: Android 12+, iOS 17+, web (dev)

**Project Type**: mobile-app (Expo Router, `src/app/`)

**Performance Goals**: N/A

**Constraints**: não pode alterar a casca de navegação existente (`headerShown:
false` no `Stack` raiz, `NativeTabs` como tab bar) — decisão explícita para não
arriscar o layout já validado pelo usuário (`research.md`, Decisão 1)

**Scale/Scope**: 1 tela nova (`src/app/acoes.tsx`), 1 componente novo
(`src/components/ui/botao-acoes.tsx`), 1 ícone novo, 3 arquivos existentes alterados
(`(tabs)/index.tsx`, `(tabs)/explore.tsx`, `icons.tsx`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. TypeScript Obrigatório | ✅ Novo componente e tela totalmente tipados, sem `any`. |
| II. Simplicidade sobre Funcionalidades Avançadas | ✅ Reaproveita o mecanismo de recarregamento por foco já existente em vez de inventar comunicação nova entre telas; rejeitou explicitamente habilitar header nativo (mudança maior) em favor da solução mais simples que atende o pedido (`research.md`, Decisão 1). |
| III. Validação em Dois Dispositivos-Alvo | ✅ `quickstart.md` com 4 cenários, verificável também via web. |
| IV. Controle de Dependências | ✅ Nenhuma dependência nova. |
| V. Isolamento de Dados por Perfil (NON-NEGOTIABLE) | ✅ Não aplicável — feature não introduz leitura/escrita de dado novo; `importarTreino`/`importarTreinoExemplo` continuam recebendo `perfilAtivo.id` exatamente como hoje. |

Nenhuma violação — Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/015-menu-de-acoes/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões técnicas
├── data-model.md         # Fase 1 — N/A, sem entidades
├── quickstart.md         # Fase 1 — roteiro de validação manual
├── contracts/
│   └── navegacao.md      # Fase 1 — rotas e componentes
└── tasks.md              # Fase 2 (gerado por /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── acoes.tsx                # NOVO: tela com as 3 ações
│   └── (tabs)/
│       ├── index.tsx            # ALTERADO: remove atalhos, adiciona BotaoAcoes
│       └── explore.tsx          # ALTERADO: adiciona BotaoAcoes
└── components/
    └── ui/
        ├── icons.tsx             # ALTERADO: + AcoesIcon
        └── botao-acoes.tsx       # NOVO: botão reutilizável
```

**Structure Decision**: segue exatamente a convenção já usada pelo projeto para uma
tela empilhada fora das abas (mesmo padrão de `src/app/treino/[treinoId].tsx`).

## Complexity Tracking

*Não aplicável — nenhuma violação da Constitution Check acima.*
