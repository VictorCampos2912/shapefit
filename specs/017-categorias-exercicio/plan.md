# Implementation Plan: Categorias de Unidade por Exercício

**Branch**: `017-categorias-exercicio` | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-categorias-exercicio/spec.md`

## Summary

Adicionar um campo opcional `categoria` (`peso` | `tempo` | `distancia` |
`repeticoes`) a cada exercício do schema de importação (RF01), default `peso`
quando ausente. Os campos numéricos já existentes (`cargaSugeridaKg` em
`ExercicioPlanejado`, `cargaKg` em `SerieRealizada`) **mantêm os mesmos nomes**
(decisão já confirmada com o usuário) — só passam a ser rotulados/formatados de
forma diferente na UI conforme a categoria do exercício, através de um utilitário
central de mapeamento categoria → rótulo/unidade, reaproveitado pelas 4 telas
afetadas (execução, RF03/04; histórico, RF08; edição em andamento, RF09a; edição de
sessão finalizada, RF09b).

## Technical Context

**Language/Version**: TypeScript (strict), React Native + Expo SDK 57

**Primary Dependencies**: nenhuma dependência nova

**Storage**: `AsyncStorage`, chaves já existentes (`treinos:<perfilId>`,
`sessoes:<perfilId>`) — `categoria` é um campo novo dentro de `ExercicioPlanejado`
(persistido como parte do `Treino` já existente), sem nova chave

**Testing**: validação manual em Android e iOS (Princípio III); testável via web/
Playwright — sem API nativa envolvida

**Target Platform**: Android 12+ e iOS 17+

**Project Type**: mobile-app (Expo Router, `src/app/`)

**Performance Goals**: N/A — mapeamento trivial (tabela fixa de 4 categorias)

**Constraints**: **não renomear** `cargaKg`/`cargaSugeridaKg` para nada genérico
(decisão já confirmada com o usuário — ver `research.md`, Decisão 1) — qualquer
adaptação é só de rótulo/unidade exibida, nunca de schema de dados já persistido

**Scale/Scope**: 2 tipos alterados, 1 utilitário novo, 5 arquivos de produção
alterados — ver Project Structure

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. TypeScript Obrigatório | ✅ Novo tipo `CategoriaExercicio` (union de 4 literais), sem `any`; tabelas de rótulo tipadas como `Record<CategoriaExercicio, ...>` — o compilador garante as 4 categorias sempre tratadas. |
| II. Simplicidade sobre Funcionalidades Avançadas | ✅ Um único utilitário central (`categoria-exercicio.ts`) reaproveitado pelas 4 telas afetadas, em vez de lógica de rótulo duplicada em cada uma; nomes de campo existentes preservados para minimizar o diff (decisão já confirmada). |
| III. Validação em Dois Dispositivos-Alvo | ✅ `quickstart.md` cobre as 3 User Stories nas 4 telas afetadas; testável via web antes da confirmação física. |
| IV. Controle de Dependências | ✅ Nenhuma dependência nova. |
| V. Isolamento de Dados por Perfil (NON-NEGOTIABLE) | ✅ `categoria` é um atributo de `ExercicioPlanejado`, já dentro de `Treino` (já segregado por `perfilId`); nenhuma nova consulta cross-perfil introduzida. |

Nenhuma violação — Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/017-categorias-exercicio/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões técnicas (inclui o trade-off do nome cargaKg)
├── data-model.md         # Fase 1 — CategoriaExercicio, campos afetados
├── quickstart.md         # Fase 1 — roteiro de validação manual
├── contracts/
│   ├── treino-storage.md            # Fase 1 — schema/validação de "categoria"
│   ├── categoria-exercicio-util.md  # Fase 1 — utilitário central novo
│   ├── execucao-treino-screen.md    # Fase 1 — RF03/04 + RF09a (exercicio-execucao.tsx)
│   └── historico-e-edicao.md        # Fase 1 — RF08 + RF09b (historico-evolucao.ts, explore.tsx)
└── tasks.md              # Fase 2 (gerado por /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── types/
│   ├── treino.ts                    # ALTERADO: CategoriaExercicio (novo);
│   │                                  #   ExercicioPlanejado ganha `categoria`
│   └── historico.ts                 # ALTERADO: RegistroHistorico ganha `categoria`
├── utils/
│   └── categoria-exercicio.ts       # NOVO: tabelas de rótulo/unidade por categoria
├── services/
│   ├── treino-storage.ts            # ALTERADO: validarExercicio valida "categoria"
│   └── historico-evolucao.ts        # ALTERADO: resolve `categoria` junto do nome
│                                      #   do exercício (mesmo cruzamento já existente)
└── components/
    └── treino/
        └── exercicio-execucao.tsx   # ALTERADO: rótulo/campo principal dinâmico
                                      #   por categoria (RF03/04, RF09a)

src/app/(tabs)/explore.tsx           # ALTERADO: rótulo dinâmico no histórico (RF08)
                                      #   e na edição de sessão finalizada (RF09b)
```

**Structure Decision**: nenhum arquivo novo de armazenamento — `categoria` é só mais
um atributo dentro de estruturas já existentes (`ExercicioPlanejado`,
`RegistroHistorico`). O único arquivo novo é o utilitário de mapeamento
(`categoria-exercicio.ts`), criado especificamente para não duplicar a tabela
rótulo/unidade nas 4 telas que a consomem (Princípio II).

## Complexity Tracking

*Não aplicável — nenhuma violação da Constitution Check acima.*
