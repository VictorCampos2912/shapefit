# Implementation Plan: "Finalizado em" na Lista de Treinos

**Branch**: `016-finalizado-em` | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/016-finalizado-em/spec.md`

## Summary

Trocar, na lista "Meus Treinos", o texto "Importado em `<data>`" por "Finalizado em
`<data da sessão finalizada mais recente>`" (ou "Nunca treinado"); mover a exibição da
data de importação para dentro da tela do treino específico; e restringir a exibição
da data de importação na lista a apenas os casos de colisão entre treinos homônimos
com o mesmo texto de "Finalizado em"/"Nunca treinado". Nenhuma nova estrutura de
armazenamento — tudo derivado de `Treino.importadoEm` e `SessaoTreino.finalizadaEm`
já existentes.

## Technical Context

**Language/Version**: TypeScript (strict), React Native + Expo SDK 57

**Primary Dependencies**: nenhuma dependência nova — reaproveita `AsyncStorage` e os
serviços já existentes (`treino-storage.ts`, `sessao-treino-storage.ts`)

**Storage**: `AsyncStorage`, chaves já existentes `treinos:<perfilId>` e
`sessoes:<perfilId>` — nenhuma mudança de schema/estrutura, apenas uma nova consulta
de leitura sobre dados já persistidos

**Testing**: validação manual em Android e iOS (Princípio III); esta feature **não**
depende de hardware nativo (ao contrário de RF13/vibração) — pode ser validada
integralmente via web/Playwright antes da validação física, como já feito para RF11/
RF12/RF14

**Target Platform**: Android 12+ e iOS 17+, mesmo alvo já usado pelo projeto

**Project Type**: mobile-app (Expo Router, `src/app/`)

**Performance Goals**: N/A — cálculo trivial sobre listas já pequenas (uso pessoal,
mesma escala já assumida pelo RF08/RF11)

**Constraints**: não pode reintroduzir a ambiguidade entre treinos homônimos já
resolvida pelo RF02 (SC-004) — critério de desempate (FR-005) é obrigatório, não
opcional

**Scale/Scope**: 4 arquivos de produção alterados, nenhum arquivo novo de produção —
ver Project Structure

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. TypeScript Obrigatório | ✅ Nenhum tipo novo obrigatório; a nova função de serviço é tipada com os tipos já existentes (`Treino`, `SessaoTreino`), sem `any`. |
| II. Simplicidade sobre Funcionalidades Avançadas | ✅ Reaproveita `contarSessoesFinalizadas`/`listarSessoesFinalizadas` (padrão já existente em `sessao-treino-storage.ts`) para uma nova função de leitura equivalente; nenhuma abstração nova, nenhum estado global novo. |
| III. Validação em Dois Dispositivos-Alvo | ✅ `quickstart.md` cobre os cenários das 3 User Stories; feature é validável via web (sem hardware nativo envolvido), com confirmação física nos dois aparelhos antes de marcar como concluída. |
| IV. Controle de Dependências | ✅ Nenhuma dependência nova. |
| V. Isolamento de Dados por Perfil (NON-NEGOTIABLE) | ✅ A nova consulta (data da sessão finalizada mais recente) opera sobre `sessoes:<perfilId>` do perfil ativo, mesmo filtro por `perfilId` já usado por toda leitura de sessão existente — nenhuma consulta cross-perfil introduzida. |

Nenhuma violação — Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/016-finalizado-em/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões técnicas
├── data-model.md         # Fase 1 — dados derivados (sem entidade nova)
├── quickstart.md         # Fase 1 — roteiro de validação manual
├── contracts/
│   ├── sessao-treino-storage.md  # Fase 1 — nova função de leitura
│   └── treino-list-item.md       # Fase 1 — mudança de UI/props do item da lista
└── tasks.md              # Fase 2 (gerado por /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── services/
│   └── sessao-treino-storage.ts   # ALTERADO: nova função de leitura —
│                                   #   data da sessão finalizada mais recente
│                                   #   por treino (deriva de dados já persistidos)
├── components/
│   └── treino/
│       └── treino-list-item.tsx   # ALTERADO: troca "Importado em" por
│                                   #   "Finalizado em"/"Nunca treinado";
│                                   #   novo prop para data de desempate (FR-005)
└── app/
    ├── (tabs)/
    │   └── index.tsx               # ALTERADO: calcula a data mais recente por
    │                                #   treino e o critério de colisão (FR-005),
    │                                #   passa como props para TreinoListItem
    └── treino/
        └── [treinoId].tsx          # ALTERADO: exibe importadoEm como
                                     #   informação secundária (FR-004)
```

**Structure Decision**: nenhum arquivo novo de produção — mudança localizada aos 4
arquivos já existentes que compõem a lista de treinos e a tela do treino específico;
`sessao-treino-storage.ts` ganha uma função de leitura a mais, no mesmo padrão das já
existentes (`contarSessoesFinalizadas`, `listarSessoesFinalizadas`).

## Complexity Tracking

*Não aplicável — nenhuma violação da Constitution Check acima.*
