# Implementation Plan: Listar Treinos Importados/Salvos

**Branch**: `003-listar-treinos` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-listar-treinos/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Substituir o conteúdo temporário de `src/app/(tabs)/index.tsx` (boilerplate do Expo + botões
provisórios de importação criados no RF01) pela tela definitiva de lista de treinos do
perfil ativo. A tela lê os treinos via `listarTreinos(perfilId)` (já existente em
`src/services/treino-storage.ts`, reaproveitada sem modificação), reage a mudanças de perfil
ativo através do hook já existente `usePerfilAtivo()`, diferencia treinos com nome duplicado
exibindo a data/hora de importação, e move as ações de importar treino (`importarTreino`,
`importarTreinoExemplo`, também já existentes e reaproveitadas sem modificação) para esta
tela — removendo-as da tela inicial anterior. O toque em um item da lista reconhece o treino
selecionado (preparação para RF03, ainda não implementado). A tela recebe um layout com
tipografia e espaçamento organizados, distinto do boilerplate padrão do Expo, conforme
decisão já registrada na seção 14 do PRD.

## Technical Context

**Language/Version**: TypeScript ~6.0.3 (strict mode), React Native 0.86.3, React 19.2.3

**Primary Dependencies**: Expo SDK 57 (gerenciado), `expo-router` ~57.0.21 (roteamento
file-based, já configurado) — nenhuma dependência nova de terceiros; reaproveita
integralmente `src/services/treino-storage.ts` (RF01, sem modificações) e
`src/hooks/use-perfil-ativo.tsx` (RF10, sem modificações)

**Storage**: AsyncStorage, via `listarTreinos(perfilId)` já implementada em
`treino-storage.ts` (chave `treinos:<perfil_id>`, convenção estabelecida no RF10 e
implementada no RF01). Esta feature é somente leitura sobre esse dado — não introduz nem
altera nenhuma chave de storage

**Testing**: Validação manual em dispositivo físico Android (Redmi Note 12) e iOS (iPhone
16 Plus) via Expo Go, conforme Princípio III da Constituição, mesma abordagem usada no RF10
e no RF01

**Target Platform**: Android 12+ e iOS 17+ via Expo Go (RNF01 do PRD)

**Project Type**: Mobile app (Expo/React Native), single project com roteamento file-based
em `src/app/` (mesma estrutura estabelecida pelo RF10/RF01)

**Performance Goals**: Lista visível em até 2 segundos após abrir a tela (SC-001); atualização
da lista após troca de perfil ativo em no máximo 1 interação do usuário, sem reload percebido
(SC-003)

**Constraints**: Funcionar 100% offline (RNF02); nenhuma leitura de treino pode ocorrer sem
filtrar pelo `perfil_id` ativo (Princípio V, NON-NEGOTIABLE); a tela substitui integralmente o
conteúdo de `(tabs)/index.tsx` sem deixar a ação de importar acessível em nenhum outro lugar
do app (FR-009)

**Scale/Scope**: Mesmo volume assumido no RF01 (uso pessoal, dezenas de treinos por perfil,
sem paginação); 1 tela reescrita (`(tabs)/index.tsx`), sem novas rotas — a navegação para a
execução do treino (RF03) fica fora de escopo, apenas a seleção é reconhecida

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|-----------|-----------|--------|
| I. TypeScript Obrigatório | Nenhum tipo novo é introduzido (reaproveita `Treino` do RF01); a tela usa os tipos já existentes sem `any` implícito. | PASS |
| II. Simplicidade sobre Funcionalidades Avançadas no MVP | Sem paginação, busca, ordenação customizável, ou nova abstração de storage — apenas leitura direta via `listarTreinos`, já existente; nenhum sistema de design novo, apenas ajustes de tipografia/espaçamento usando os componentes (`ThemedText`, `ThemedView`) e constantes (`Spacing`, `Colors`) já existentes no projeto. | PASS |
| III. Validação em Dois Dispositivos-Alvo | Plano assume validação manual em Android (Redmi Note 12) e iOS (iPhone 16 Plus) via Expo Go antes de considerar a feature concluída. | PASS (a validar na execução) |
| IV. Controle de Dependências | Nenhuma dependência nova de terceiros é introduzida nesta feature. | PASS |
| V. Isolamento de Dados por Perfil (NON-NEGOTIABLE) | A tela lê treinos exclusivamente via `listarTreinos(perfilAtivo.id)`, reagindo a mudanças de `perfilAtivo` (hook já existente); nenhuma leitura ocorre sem o `perfil_id` do perfil ativo no momento. | PASS |

Nenhuma violação sem justificativa. Prosseguir para Fase 0.

## Project Structure

### Documentation (this feature)

```text
specs/003-listar-treinos/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
# Option 1: Single project (mobile app, Expo Router file-based) — mesma estrutura do RF10/RF01
src/
├── app/
│   └── (tabs)/
│       └── index.tsx              # REESCRITA: era o ponto de entrada temporário
│                                    # (boilerplate Expo + botões de importação do RF01);
│                                    # passa a ser a tela definitiva de lista de treinos
├── components/
│   └── treino/
│       └── treino-list-item.tsx    # novo componente: item da lista (nome + data/hora
│                                    # de importação quando há nome duplicado)
├── services/
│   └── treino-storage.ts           # já existente (RF01) — reaproveitado sem modificação:
│                                    # listarTreinos, importarTreino, importarTreinoExemplo
└── hooks/
    └── use-perfil-ativo.tsx         # já existente (RF10) — reaproveitado sem modificação

tests/
└── (validação manual em dispositivo — sem suíte automatizada nesta fase,
    conforme Technical Context, mesmo padrão do RF10/RF01)
```

**Structure Decision**: Projeto único mobile (Expo Router), reaproveitando integralmente a
estrutura e os padrões já estabelecidos pelo RF10 e RF01. Esta feature não introduz nenhuma
rota nova nem camada de serviço nova — o único arquivo de rota alterado é
`src/app/(tabs)/index.tsx`, que tem seu conteúdo completamente substituído (deixa de ser a
tela inicial temporária do RF01 e passa a ser a lista de treinos definitiva). É criado um
único componente novo de apresentação (`treino-list-item.tsx`) para exibir cada item da
lista, incluindo a diferenciação por data/hora quando há nomes duplicados (FR-007). Nenhuma
mudança é feita em `treino-storage.ts` (RF01) ou em `use-perfil-ativo.tsx` (RF10) — ambos são
consumidos exatamente como já existem, conforme instrução explícita do usuário.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Nenhuma violação da Constituição nesta feature — tabela omitida por não haver entradas a
registrar.

## Constitution Re-Check (pós-Fase 1)

*GATE: Re-avaliação após completar data-model.md, contracts/ e quickstart.md (Fase 1).*

O design de Fase 1 confirma o que já estava previsto no Constitution Check inicial: nenhuma
entidade nova é persistida (data-model.md trata `Treino` e `TreinosPorPerfilState` como
reaproveitados do RF01, apenas com um view model de apresentação em memória,
`ItemDeListaTreino`, não persistido); o contrato da tela
(`contracts/tela-lista-treinos.md`) reafirma que `treino-storage.ts` e
`use-perfil-ativo.tsx` são consumidos sem modificação, e que a leitura de treinos permanece
sempre filtrada por `perfilId` (Princípio V). Nenhum gate regride. **Todos os princípios
permanecem PASS.** Pronto para `/speckit-tasks`.
