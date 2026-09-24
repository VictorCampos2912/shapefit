# Implementation Plan: Histórico por Data

**Branch**: `019-historico-por-data` | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/019-historico-por-data/spec.md`

## Summary

Adicionar uma segunda visão à tela "Histórico" (RF08) já existente, alternável via
um controle no topo da tela: "Por exercício" (já existente) e "Por data" (nova),
agrupando as mesmas sessões finalizadas por dia civil e, dentro de cada dia, por
sessão (treino + exercícios registrados). Extrai a lógica de cruzamento
sessão→treino→exercício, hoje só dentro de `obterHistoricoPorPerfil` (RF08), para
um passo intermediário compartilhado, reaproveitado pelas duas visões — evita
duplicar essa lógica (incluindo o tratamento defensivo de dado inconsistente, FR-013/
014 do RF08) numa função nova e separada.

## Technical Context

**Language/Version**: TypeScript (strict), React Native + Expo SDK 57

**Primary Dependencies**: nenhuma dependência nova

**Storage**: `AsyncStorage`, chaves já existentes (`treinos:<perfilId>`,
`sessoes:<perfilId>`) — nenhuma nova estrutura de armazenamento (FR-002 da spec)

**Testing**: validação manual em Android e iOS (Princípio III); testável via web/
Playwright — sem API nativa envolvida

**Target Platform**: Android 12+ e iOS 17+

**Project Type**: mobile-app (Expo Router, `src/app/`)

**Performance Goals**: N/A — mesma escala já assumida pelo RF08 (uso pessoal)

**Constraints**: não pode alterar o comportamento observável da visão "Por
exercício" (RF08) já validada — o refactor de extração do cruzamento
sessão→treino→exercício precisa ser puramente interno, sem mudar nenhuma saída já
existente

**Scale/Scope**: 1 refactor interno + 1 função nova de serviço, 2 tipos novos, 1
sub-componente novo dentro de `explore.tsx` — ver Project Structure

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. TypeScript Obrigatório | ✅ Dois tipos novos (`DiaHistorico`, `BlocoSessao`) explicitamente definidos, sem `any`. |
| II. Simplicidade sobre Funcionalidades Avançadas | ✅ Reaproveita o cruzamento sessão→treino→exercício já existente (extraído para uma função compartilhada, não duplicado); visão nova vive na mesma tela/rota já existente, sem aba de navegação nova (FR-001). |
| III. Validação em Dois Dispositivos-Alvo | ✅ `quickstart.md` cobre as 2 User Stories; testável via web antes da confirmação física. |
| IV. Controle de Dependências | ✅ Nenhuma dependência nova. |
| V. Isolamento de Dados por Perfil (NON-NEGOTIABLE) | ✅ A nova função de leitura opera sobre os mesmos dados já filtrados por `perfilId` (`listarSessoesFinalizadas`, `listarTreinos`) — nenhuma consulta cross-perfil nova. |

Nenhuma violação — Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/019-historico-por-data/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões técnicas (inclui o refactor compartilhado)
├── data-model.md         # Fase 1 — DiaHistorico, BlocoSessao (dados derivados)
├── quickstart.md         # Fase 1 — roteiro de validação manual
└── contracts/
    ├── historico-evolucao.md  # Fase 1 — refactor + nova função obterHistoricoPorData
    └── explore-screen.md      # Fase 1 — alternância de visão + novo sub-componente
```

(Sem `tasks.md` ainda — gerado por `/speckit.tasks`.)

### Source Code (repository root)

```text
src/
├── types/
│   └── historico.ts          # ALTERADO: novos tipos DiaHistorico, BlocoSessao,
│                               #   HistoricoPorData
├── services/
│   └── historico-evolucao.ts # ALTERADO: cruzamento sessão→treino→exercício
│                               #   extraído para função interna compartilhada;
│                               #   nova função obterHistoricoPorData exportada
└── app/
    └── (tabs)/
        └── explore.tsx        # ALTERADO: controle de alternância "Por
                                #   exercício"/"Por data"; novo sub-componente
                                #   inline (mesmo padrão de SecaoExercicio já
                                #   existente no arquivo) para renderizar os dias
```

**Structure Decision**: nenhum arquivo novo de componente — o novo sub-componente
de renderização (dias/blocos de sessão) fica inline em `explore.tsx`, seguindo o
mesmo padrão já estabelecido nesse arquivo (`SecaoExercicio` também é definido
inline, não extraído para um arquivo próprio). O único arquivo de serviço alterado
(`historico-evolucao.ts`) ganha uma função interna nova (compartilhada) e uma
função exportada nova — nenhum serviço novo.

## Complexity Tracking

*Não aplicável — nenhuma violação da Constitution Check acima.*
