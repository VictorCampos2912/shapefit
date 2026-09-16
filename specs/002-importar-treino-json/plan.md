# Implementation Plan: Importar Treino via Arquivo JSON

**Branch**: `002-importar-treino-json` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-importar-treino-json/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Implementar a importação de treinos via arquivo JSON selecionado pelo sistema operacional
(usando `expo-document-picker`), validando a estrutura mínima do arquivo (nome do treino e
lista de exercícios) e cada exercício individualmente (campos obrigatórios e tipos
corretos). Exercícios inválidos são descartados isoladamente, sem bloquear a importação dos
demais; o usuário é avisado quando isso ocorre. O treino importado é persistido sob a chave
AsyncStorage `treinos:<perfil_id>` (convenção já estabelecida em `specs/001-perfil-local/
data-model.md`), usando o `perfil_id` do perfil ativo no momento da importação, obtido via o
hook `usePerfilAtivo()` já existente (RF10). A camada de acesso a dados segue o mesmo padrão
de serviço estabelecido pelo RF10 (`src/services/`), com um novo arquivo dedicado a treinos.

## Technical Context

**Language/Version**: TypeScript ~6.0.3 (strict mode), React Native 0.86.3, React 19.2.3

**Primary Dependencies**: Expo SDK 57 (gerenciado), `expo-router` ~57.0.21 (roteamento
file-based, já configurado), `expo-document-picker` (nova dependência — seletor de arquivos
do sistema; ver Complexity Tracking), `@react-native-async-storage/async-storage` (já
instalada pelo RF10) — reaproveita `usePerfilAtivo()` (`src/hooks/use-perfil-ativo.tsx`) para
obter o perfil ativo

**Storage**: AsyncStorage. Chave por perfil `treinos:<perfil_id>`, conforme convenção já
definida em `specs/001-perfil-local/data-model.md` (seção "Convenção de chaves AsyncStorage")
e Princípio V da Constituição

**Testing**: Validação manual em dispositivo físico Android (Redmi Note 12) e iOS (iPhone
16 Plus) via Expo Go, conforme Princípio III da Constituição, mesma abordagem usada no RF10.
Arquivos de exemplo já existentes em `docs/exemplos/treino-exemplo.json` (válido) e
`docs/exemplos/treino-exemplo-com-erro.json` (com um exercício inválido) servem de fixtures
de validação manual e satisfazem FR-009

**Target Platform**: Android 12+ e iOS 17+ via Expo Go (RNF01 do PRD)

**Project Type**: Mobile app (Expo/React Native), single project com roteamento file-based
em `src/app/` (mesma estrutura estabelecida pelo RF10)

**Performance Goals**: Importação de um treino típico (até ~10 exercícios) percebida como
instantânea pelo usuário (SC-001: disponível na lista em menos de 10s, incluindo a interação
com o seletor de arquivos do sistema)

**Constraints**: Funcionar 100% offline (RNF02); nenhuma escrita de dado de treino pode
ocorrer sem o prefixo `perfil_id` (Princípio V, NON-NEGOTIABLE); erro em um exercício não
pode interromper a validação/importação dos demais (FR-005)

**Scale/Scope**: Volume de treinos por perfil compatível com uso pessoal (dezenas), sem
paginação; 1 novo ponto de entrada de importação (ação a partir da lista de treinos — tela
de RF02, ainda não implementada nesta feature) e 1 nova camada de serviço (`treino-storage.ts`
+ parsing/validação)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|-----------|-----------|--------|
| I. TypeScript Obrigatório | Tipos de domínio (`Treino`, `ExercicioPlanejado`) serão definidos em `src/types/treino.ts`, sem `any` implícito; parsing do JSON bruto (`unknown`) é convertido para os tipos tipados via validação explícita. | PASS |
| II. Simplicidade sobre Funcionalidades Avançadas no MVP | Sem deduplicação de treinos, sem schema validation library externa (validação manual campo a campo, suficiente para o schema pequeno e fixo do PRD); reaproveita padrão de serviço e hook já existentes do RF10 em vez de criar nova abstração. | PASS |
| III. Validação em Dois Dispositivos-Alvo | Plano assume validação manual em Android (Redmi Note 12) e iOS (iPhone 16 Plus) via Expo Go antes de considerar a feature concluída, usando os arquivos de exemplo já existentes em `docs/exemplos/`. | PASS (a validar na execução) |
| IV. Controle de Dependências | `expo-document-picker` não está listado explicitamente no PRD (seção 9 não cita bibliotecas de seleção de arquivo), mas os critérios de aceite do RF01 (`docs/criterios-aceite.md`) citam literalmente `expo-document-picker` como a decisão já tomada para este requisito. Justificativa registrada no Complexity Tracking abaixo. | PASS (justificado) |
| V. Isolamento de Dados por Perfil (NON-NEGOTIABLE) | Todo treino importado é escrito exclusivamente sob a chave `treinos:<perfil_id>` do perfil ativo no momento da importação (FR-003, FR-004); nenhuma leitura de treino ocorre sem esse prefixo. | PASS |

Nenhuma violação sem justificativa. Prosseguir para Fase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-importar-treino-json/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
# Option 1: Single project (mobile app, Expo Router file-based) — mesma estrutura do RF10
src/
├── app/
│   └── (tabs)/
│       └── index.tsx              # ponto de entrada temporário para o botão
│                                    # "Importar treino" (RF02 ainda não existe;
│                                    # a lista de treinos em si é escopo do RF02)
├── types/
│   └── treino.ts                   # tipos Treino, ExercicioPlanejado, ResultadoImportacao
├── services/
│   └── treino-storage.ts           # parsing/validação do JSON + persistência sob
│                                    # `treinos:<perfil_id>`, seguindo o mesmo padrão
│                                    # de src/services/perfil-storage.ts (RF10)
└── hooks/
    └── use-perfil-ativo.tsx         # já existente (RF10) — reaproveitado, não modificado

tests/
└── (validação manual em dispositivo — sem suíte automatizada nesta fase,
    conforme Technical Context, mesmo padrão do RF10)
```

**Structure Decision**: Projeto único mobile (Expo Router), reaproveitando integralmente a
estrutura e os padrões já estabelecidos pelo RF10. Nenhuma nova camada de navegação ou
gerenciamento de estado é introduzida: a importação é uma ação (função assíncrona) exposta
por `src/services/treino-storage.ts`, no mesmo nível arquitetural de `perfil-storage.ts`, e
o perfil ativo é obtido lendo o hook `usePerfilAtivo()` já existente — sem duplicar essa
lógica. Como o RF02 (listar treinos importados) ainda não foi implementado, o ponto de
entrada da ação de importar (botão/toque que aciona o seletor de arquivos) é adicionado
temporariamente à tela inicial (`(tabs)/index.tsx`); a tarefa de mover esse ponto de entrada
para a tela definitiva de lista de treinos fica registrada como dependência do RF02.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| Dependência `expo-document-picker` não citada literalmente no PRD (seção 9) | Os critérios de aceite do RF01 (`docs/criterios-aceite.md`, seção "RF01 — Importar arquivo JSON com estrutura de treino") já registram esta decisão explicitamente: "Importação via seleção de arquivo do sistema (`expo-document-picker`)". É a biblioteca oficial do Expo SDK gerenciado para seleção de arquivos do sistema operacional. | Não há alternativa mais simples dentro do Expo gerenciado: implementar um seletor de arquivos customizado exigiria APIs nativas fora do SDK gerenciado, contrariando a stack definida no PRD (seção 9: "React Native + Expo (SDK gerenciado)"). |
| ~~Dependência `expo-file-system`~~ (removida) | Avaliada inicialmente para ler o conteúdo do arquivo cujo URI é retornado por `expo-document-picker`, mas todas as três formas de uso testadas (API nova por classes, export principal, `/legacy`) falharam em runtime no dispositivo físico de teste durante a validação manual (ver research.md, Decisão 2, tentativas 1–3). | A solução estável usa `fetch(uri).text()`, API padrão do React Native já disponível globalmente, sem dependência adicional. `expo-file-system` foi desinstalada do projeto. |
| Ponto de entrada de importação adicionado temporariamente em `(tabs)/index.tsx`, fora do fluxo "natural" de uma lista de treinos (RF02) | RF02 (lista de treinos) ainda não foi planejado nem implementado; a spec do RF01 exige que a ação de importar seja testável de ponta a ponta nesta feature, sem esperar pelo RF02. | Adiar toda a feature até o RF02 existir contrariaria a ordem de implementação recomendada em `docs/criterios-aceite.md` (RF01 antes de RF02) e ampliaria o escopo desta feature para incluir uma tela que já tem spec própria futura. |

## Constitution Re-Check (pós-Fase 1)

*GATE: Re-avaliação após completar data-model.md, contracts/ e quickstart.md (Fase 1).*

O design de Fase 1 não introduziu nenhuma nova dependência, camada de estado, ou padrão de
acesso a dados além dos já registrados no Constitution Check inicial e no Complexity
Tracking acima. A convenção de chave `treinos:<perfil_id>` (data-model.md) e o contrato de
serviço (`contracts/treino-storage.md`) reafirmam o isolamento por perfil (Princípio V) e a
reutilização do padrão de serviço do RF10 (Princípio II). Nenhum gate regride. **Todos os
princípios permanecem PASS.** Pronto para `/speckit-tasks`.
