# Implementation Plan: Observação por Exercício e Imagem para Exercício Composto (Bi-set)

**Branch**: `023-observacao-e-imagens-bi-set` | **Date**: 2026-10-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/023-observacao-e-imagens-bi-set/spec.md`

## Summary

Duas melhorias independentes, mas relacionadas, sobre o fluxo já existente de
importação (RF01/RF11) e execução de treino (RF03/RF04): (1) um campo opcional
`observacao` (string) por exercício, validado pelo mesmo mecanismo já usado para
`categoria` (RF17) e exibido em destaque secundário na tela de execução, sem
aparecer na lista de exercícios nem no histórico; (2) uma extensão do FR-003 da
spec `021-imagens-exercicios` (já registrada como nota de emenda no próprio
`specs/021-imagens-exercicios/spec.md`) para buscar, por igualdade exata, até
duas partes de um nome de exercício composto no padrão "A + B (Bi-set)" quando o
nome inteiro não corresponde a nada no catálogo. Nenhuma dependência nova;
reaproveita integralmente a infraestrutura já existente (`treino-storage.ts`,
`catalogo-exercicios.ts`, `normalizarNomeExercicio`, `exercicio-execucao.tsx`).

## Technical Context

**Language/Version**: TypeScript (strict), React Native + Expo SDK 57 (ver
`AGENTS.md` — consultar a documentação versionada antes de qualquer alteração de
código, ainda que esta feature não introduza API nova do Expo)

**Primary Dependencies**: nenhuma dependência nova — `Image`, `ScrollView` e
`TextInput` são APIs do React Native core; `@react-native-firebase/firestore` já
presente desde a spec 022

**Storage**: Firestore (`users/{uid}/treinos`, já existente desde a spec 022) —
`observacao` é apenas mais um campo opcional dentro do `ExercicioPlanejado` já
persistido como parte do `Treino`; nenhuma coleção nova, nenhuma regra de
segurança nova

**Testing**: validação manual em Android e iOS (Constitution v2.0.0, Princípio
III) — sem framework de testes automatizados neste projeto; roteiro em
`quickstart.md`

**Target Platform**: Android 12+ (Redmi Note 12) e iOS 17+ (iPhone 16 Plus), via
development build (`expo-dev-client`, já exigido desde a spec 022) — iOS
continua pendente de validação por falta de conta Apple Developer paga (mesma
situação herdada da spec 022, não introduzida por esta)

**Project Type**: mobile-app (Expo Router, `src/app/`)

**Performance Goals**: N/A — operações síncronas triviais (trim/split de string,
no máximo 2 buscas adicionais por abertura de exercício em uma lista estática e
pequena do catálogo)

**Constraints**:

- FR-007 exige que os campos de registro da série e o botão "Concluir série"
  nunca fiquem inacessíveis, independentemente do tamanho do texto da
  observação — resolvido por rolagem, reaproveitando o padrão já usado em
  `src/app/conta/dados-fisicos.tsx` (`research.md`, Decisão 3), não por
  truncamento de texto.
- FR-008 exige que a chave `observacao` nunca seja gravada como `undefined` no
  Firestore quando ausente — resolvido construindo o objeto persistido com
  espalhamento condicional, nunca atribuindo o valor `undefined` explicitamente
  (`research.md`, Decisão 4).
- FR-010/FR-014 proíbem qualquer aproximação de nome, inclusive na busca por
  partes do nome composto — reaproveita `buscarNoCatalogo`/
  `normalizarNomeExercicio` sem nenhuma regra de normalização nova.

**Scale/Scope**: 1 campo novo em 1 tipo já existente, 1 função nova no serviço de
catálogo já existente, 1 componente alterado, 1 tela alterada (rolagem) — ver
Project Structure. A emenda ao FR-003 da spec 021 já foi registrada no próprio
arquivo dessa spec (nota de emenda, sem reescrever o resto) — não é um item de
código pendente.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Avaliação contra `.specify/memory/constitution.md` v2.0.0:

- **Princípio I (TypeScript Obrigatório)**: PASS — `observacao?: string` é
  adicionado a `ExercicioPlanejado` (tipo já existente), sem `any`;
  `buscarPartesCompostoNoCatalogo` é tipada `(nome: string) => ExercicioCatalogo[]`,
  reaproveitando `ExercicioCatalogo` já tipado pela spec 020.
- **Princípio II (Simplicidade sobre Funcionalidades Avançadas)**: PASS —
  reaproveita `normalizarNomeExercicio`/`buscarNoCatalogo` (spec 020/021) sem
  nenhuma lógica de normalização nova; resolve o FR-007 reaproveitando o padrão
  de `ScrollView` já usado em `dados-fisicos.tsx`, em vez de inventar
  truncamento/expansão de texto; a observação é renderizada em um único ponto
  do componente (não duplicada), satisfazendo os "dois momentos" do FR-004 sem
  JSX repetido (`research.md`, Decisão 2).
- **Princípio III (Validação em Dois Dispositivos-Alvo)**: PASS —
  `quickstart.md` cobre as 5 User Stories da spec em Android e iOS; iOS
  permanece pendente apenas pela falta de conta Apple Developer (situação já
  herdada da spec 022, não introduzida por esta feature).
- **Princípio IV (Controle de Dependências)**: PASS — nenhuma dependência nova.
- **Princípio V (Autenticação Obrigatória e Isolamento por Conta, NON-NEGOTIABLE)**:
  PASS — `observacao` é só um atributo adicional dentro de um
  `ExercicioPlanejado` que já pertence a um `Treino` já segregado por `uid`
  (`users/{uid}/treinos`, spec 022); nenhuma coleção nova, nenhuma consulta
  cross-conta nova. A busca de partes no catálogo (bi-set) não toca em nenhum
  dado de conta — o catálogo é estático e global, já estabelecido pela spec
  020/021, sem segregação por `uid`.

Nenhuma violação — Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/023-observacao-e-imagens-bi-set/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões técnicas (6 decisões)
├── data-model.md        # Fase 1 — campo novo + resultado derivado de busca por partes
├── quickstart.md        # Fase 1 — roteiro de validação manual (5 User Stories)
├── contracts/
│   ├── treino-storage.md            # Fase 1 — validação/montagem/persistência de `observacao`
│   ├── catalogo-exercicios.md       # Fase 1 — nova função `buscarPartesCompostoNoCatalogo`
│   └── execucao-treino-screen.md    # Fase 1 — exibição de observação + imagens de bi-set + rolagem
└── tasks.md              # Fase 2 (gerado por /speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── types/
│   └── treino.ts                    # ALTERADO: ExercicioPlanejado ganha
│                                       #   `observacao?: string` (opcional)
├── services/
│   ├── treino-storage.ts            # ALTERADO: validarExercicio valida
│   │                                   #   `observacao`; montarTreinoValido monta
│   │                                   #   o campo só quando válido (nunca undefined)
│   └── catalogo-exercicios.ts       # ALTERADO (arquivo já criado pela spec 020,
│                                       #   estendido pela 021): ganha
│                                       #   buscarPartesCompostoNoCatalogo
└── components/
    └── treino/
        └── exercicio-execucao.tsx   # ALTERADO: exibe a observação (destaque
                                        #   secundário, ponto único de renderização)
                                        #   e as imagens de partes de bi-set

src/app/treino/[treinoId].tsx        # ALTERADO: envolve a tela de execução de um
                                        #   exercício em ScrollView (FR-007),
                                        #   reaproveitando o padrão já usado em
                                        #   src/app/conta/dados-fisicos.tsx
```

**Structure Decision**: nenhum tipo, serviço ou componente novo — `observacao`
é só mais um atributo opcional dentro de `ExercicioPlanejado` (já existente,
mesmo tratamento de validação já usado por `categoria`), e a busca por partes de
nome composto é uma função nova dentro do mesmo arquivo de serviço já usado pela
spec 020/021 (`catalogo-exercicios.ts`), não um arquivo paralelo. A única
mudança de fora do componente de execução é envolver a tela em `ScrollView` no
arquivo pai (`[treinoId].tsx`), reaproveitando um padrão já existente no projeto
em vez de alterar a estrutura interna de `exercicio-execucao.tsx`.

## Complexity Tracking

*Não aplicável — nenhuma violação da Constitution Check acima.*
