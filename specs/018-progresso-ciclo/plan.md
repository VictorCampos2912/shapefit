# Implementation Plan: Progresso do Ciclo de Treinos (Múltiplos Treinos)

**Branch**: `018-progresso-ciclo` | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/018-progresso-ciclo/spec.md`

## Summary

Ao importar com sucesso um arquivo com 2+ treinos (RF11), criar automaticamente um
"Ciclo de Treinos" persistido (40 sessões esperadas, distribuídas entre os treinos do
lote o mais igualmente possível). Bloquear uma nova importação de múltiplos treinos
enquanto o ciclo atual do perfil tiver menos de 40 sessões finalizadas somadas.
Exibir, na lista "Meus Treinos", um `ProgressRing` por treino do lote atual (progresso
individual rumo à cota daquele treino) e, quando o total do ciclo atingir 40, um aviso
para trocar de treino — sem nunca travar a contagem, mesmo além de 40.

## Technical Context

**Language/Version**: TypeScript (strict), React Native + Expo SDK 57

**Primary Dependencies**: nenhuma dependência nova — reaproveita `AsyncStorage` e o
componente `ProgressRing` (`src/components/ui/progress-ring.tsx`) já existente

**Storage**: `AsyncStorage`, nova chave `ciclos:<perfilId>` (array de `CicloTreino`,
ver Decisão 2 do `research.md`) — além das chaves já existentes
(`treinos:<perfilId>`, `sessoes:<perfilId>`), sem alterá-las

**Testing**: validação manual em Android e iOS (Princípio III); testável via web/
Playwright antes da validação física — sem API nativa envolvida

**Target Platform**: Android 12+ e iOS 17+

**Project Type**: mobile-app (Expo Router, `src/app/`)

**Performance Goals**: N/A — cálculos triviais sobre listas pequenas (uso pessoal)

**Constraints**: FR-007 exige bloquear a importação de forma síncrona com o restante
do fluxo de `processarConteudoArray` (RF11) — a checagem de ciclo ativo precisa
acontecer antes de persistir qualquer treino novo, para que o bloqueio seja tudo ou
nada (nenhum treino do arquivo é importado se bloqueado)

**Scale/Scope**: 1 tipo novo, 1 serviço novo (`ciclo-treino-storage.ts`), 3 arquivos
existentes alterados — ver Project Structure

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. TypeScript Obrigatório | ✅ Novo tipo `CicloTreino` explicitamente definido em `src/types/ciclo-treino.ts`, sem `any`. |
| II. Simplicidade sobre Funcionalidades Avançadas | ✅ Progresso e status do ciclo ("em andamento"/"concluído") são **derivados** em tempo de leitura a partir das sessões já persistidas (mesmo padrão de `contarSessoesFinalizadas`, RF11) — `CicloTreino` persiste só o necessário para não poder ser recalculado (treinos do lote, cota por treino, data de criação), não um contador que precisaria ser mantido sincronizado. |
| III. Validação em Dois Dispositivos-Alvo | ✅ `quickstart.md` cobre as duas User Stories e os cenários de bloqueio/aviso; testável via web antes da confirmação física. |
| IV. Controle de Dependências | ✅ Nenhuma dependência nova — reaproveita `ProgressRing` já existente na identidade visual. |
| V. Isolamento de Dados por Perfil (NON-NEGOTIABLE) | ✅ Nova chave `ciclos:<perfilId>` segue exatamente a mesma convenção por perfil já usada por `treinos:<perfilId>`/`sessoes:<perfilId>`; toda leitura/escrita de ciclo é filtrada por `perfilId`. |

Nenhuma violação — Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/018-progresso-ciclo/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões técnicas
├── data-model.md         # Fase 1 — CicloTreino (nova entidade persistida)
├── quickstart.md         # Fase 1 — roteiro de validação manual
├── contracts/
│   ├── ciclo-treino-storage.md  # Fase 1 — novo serviço (CRUD + cálculo de progresso)
│   ├── treino-storage.md        # Fase 1 — processarConteudoArray ajustado (FR-001/FR-007)
│   └── index-screen.md          # Fase 1 — indicador por treino + aviso (FR-006/FR-008)
└── tasks.md              # Fase 2 (gerado por /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── types/
│   └── ciclo-treino.ts             # NOVO: tipo CicloTreino
├── services/
│   ├── ciclo-treino-storage.ts     # NOVO: CRUD de ciclos + cálculo de progresso
│   │                                #   (derivado de sessao-treino-storage.ts)
│   └── treino-storage.ts           # ALTERADO: processarConteudoArray passa a
│                                     #   checar bloqueio (FR-007) e criar o ciclo
│                                     #   (FR-001) via ciclo-treino-storage.ts
└── app/
    └── (tabs)/
        └── index.tsx                # ALTERADO: exibe ProgressRing por treino do
                                      #   ciclo atual (FR-006) e o aviso de troca de
                                      #   treino (FR-008)
```

**Structure Decision**: um serviço novo (`ciclo-treino-storage.ts`), separado de
`treino-storage.ts` e `sessao-treino-storage.ts` — mesmo padrão de um serviço por
entidade/responsabilidade já usado no projeto; `treino-storage.ts` importa dele para
o fluxo de importação múltipla, mantendo a lógica de ciclo isolada em um só lugar.

## Complexity Tracking

*Não aplicável — nenhuma violação da Constitution Check acima.*
