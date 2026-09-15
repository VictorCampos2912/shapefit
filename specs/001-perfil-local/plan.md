# Implementation Plan: Criar e Selecionar Perfil Local

**Branch**: `001-perfil-local` | **Date**: 2026-09-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-perfil-local/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Implementar a tela de criação/seleção de perfil local (RF10) como a primeira rota do app,
usando Expo Router (file-based routing já configurado no projeto). Perfis são persistidos
localmente via AsyncStorage, sem login/senha, suportando múltiplos perfis no mesmo
aparelho. Todo dado de treino/sessão/histórico criado a partir de agora MUST usar chaves
AsyncStorage prefixadas por `perfil_id` (ex.: `treinos:<perfil_id>`, `sessoes:<perfil_id>`),
estabelecendo o padrão de segregação por perfil exigido pela Constituição (Princípio V)
para todas as features subsequentes (RF01, RF02, RF07, RF08). A troca de perfil ativo é
bloqueada enquanto existir uma sessão de treino em andamento vinculada ao perfil ativo.

## Technical Context

**Language/Version**: TypeScript ~6.0.3 (strict mode), React Native 0.86.3, React 19.2.3

**Primary Dependencies**: Expo SDK 57 (gerenciado), `expo-router` ~57.0.21 (roteamento
file-based, já configurado como `main` do app), `@react-native-async-storage/async-storage`
(nova dependência — persistência local; ver Complexity Tracking para justificativa)

**Storage**: AsyncStorage (local, key-value, assíncrono). Chaves segregadas por perfil:
`perfis` (lista de perfis + perfil ativo) é global; toda chave de dado dependente de perfil
(treinos, sessões, histórico) MUST ser prefixada como `<dominio>:<perfil_id>`

**Testing**: Validação manual em dispositivo físico Android (Redmi Note 12) e iOS (iPhone
16 Plus) via Expo Go, conforme Princípio III da Constituição. Sem framework de teste
automatizado configurado no projeto atualmente (fora de escopo desta feature introduzir um)

**Target Platform**: Android 12+ e iOS 17+ via Expo Go (RNF01 do PRD)

**Project Type**: Mobile app (Expo/React Native), single project com roteamento file-based
em `src/app/`

**Performance Goals**: Interações principais em no máximo 2 toques (RNF03 do PRD); troca de
perfil ativo deve refletir nas telas dependentes imediatamente (sem reload perceptível)

**Constraints**: Funcionar 100% offline (RNF02); sem qualquer mecanismo de autenticação
(senha/PIN) para perfis (FR-012); bloqueio de troca de perfil apenas quando há sessão de
treino em andamento (FR-010)

**Scale/Scope**: Poucos perfis por aparelho (uso familiar, tipicamente 2-5, conforme
Assumptions do spec); 1 tela de criação de perfil, 1 tela de seleção de perfil, lógica de
perfil ativo compartilhada entre telas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|-----------|-----------|--------|
| I. TypeScript Obrigatório | Todo código novo (telas, hooks, tipos de `Perfil`) será TypeScript, sem `any` implícito; tipos de domínio (`Perfil`, `PerfilId`) serão definidos e compartilhados. | PASS |
| II. Simplicidade sobre Funcionalidades Avançadas no MVP | Sem edição/exclusão de perfil (fora de escopo, conforme Assumptions do spec); sem abstrações de storage além do necessário para o prefixo por perfil. | PASS |
| III. Validação em Dois Dispositivos-Alvo | Plano assume validação manual em Android (Redmi Note 12) e iOS (iPhone 16 Plus) via Expo Go antes de considerar a feature concluída. | PASS (a validar na execução) |
| IV. Controle de Dependências | `@react-native-async-storage/async-storage` não está listado explicitamente no PRD (seção 9 cita "AsyncStorage" apenas em prosa, sem nome de pacote), mas é a dependência padrão e única implementação de AsyncStorage para Expo/React Native — não há alternativa mais simples que atenda ao requisito de persistência local. Justificativa registrada no Complexity Tracking abaixo. | PASS (justificado) |
| V. Isolamento de Dados por Perfil (NON-NEGOTIABLE) | Esta feature É a origem do padrão de isolamento: define `perfil_id` como chave de todo dado futuro. Todas as chaves AsyncStorage de domínio (treinos, sessões, histórico) MUST ser prefixadas por `perfil_id`, conforme instrução do usuário e Fase 1 (data-model.md). | PASS |

Nenhuma violação sem justificativa. Prosseguir para Fase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-perfil-local/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
# Option 1: Single project (mobile app, Expo Router file-based)
src/
├── app/
│   ├── _layout.tsx              # layout raiz existente; passa a decidir
│   │                             # redirect inicial (perfil vs. tabs) via lógica
│   │                             # de perfil ativo
│   ├── perfil/
│   │   ├── criar.tsx            # tela de criação de perfil (formulário)
│   │   └── selecionar.tsx       # tela de lista de perfis para seleção/troca
│   ├── index.tsx                # já existente (home das tabs)
│   └── explore.tsx              # já existente
├── components/
│   └── perfil/
│       └── perfil-form.tsx      # formulário reutilizável (criar perfil)
├── constants/
│   └── perfil.ts                 # opções fixas: SEXO_OPCOES, OBJETIVO_OPCOES
├── hooks/
│   └── use-perfil-ativo.ts       # hook de leitura/escrita do perfil ativo
└── services/
    └── perfil-storage.ts          # camada de acesso ao AsyncStorage para perfis
                                    # e chaves prefixadas por perfil_id

tests/
└── (validação manual em dispositivo — sem suíte automatizada nesta fase,
    conforme Technical Context)
```

**Structure Decision**: Projeto único mobile (Expo Router). A navegação usa roteamento
file-based já configurado (`src/app/`); não é introduzido `NavigationContainer` ou
`Stack.Navigator` manual do React Navigation puro — o Expo Router já o encapsula
internamente. A tela de perfil (`src/app/perfil/`) é a primeira rota efetiva do app: o
layout raiz (`_layout.tsx`) redireciona para `perfil/criar` (nenhum perfil existente) ou
`perfil/selecionar` (um ou mais perfis existentes) antes de liberar acesso às tabs
principais (`index.tsx`/`explore.tsx`). A camada `services/perfil-storage.ts` centraliza
toda leitura/escrita no AsyncStorage e é o único ponto que constrói chaves prefixadas por
`perfil_id`, servindo de padrão a ser reutilizado pelas features de treinos/sessões/
histórico (RF01, RF02, RF07, RF08).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| Dependência `@react-native-async-storage/async-storage` não citada literalmente pelo nome de pacote no PRD | O PRD (seção 9) especifica "Armazenamento local: AsyncStorage no MVP", mas o pacote comunitário `@react-native-async-storage/async-storage` é a única implementação padrão e mantida de AsyncStorage para Expo SDK gerenciado desde a remoção do módulo do core do React Native. É a mesma tecnologia citada no PRD, apenas com o nome de pacote atual. | Não há alternativa mais simples: implementar um key-value store próprio sobre `expo-file-system` duplicaria funcionalidade já resolvida e madura, contrariando o Princípio II (Simplicidade). |
