# Implementation Plan: Imagem/GIF do Exercício na Execução

**Branch**: `021-imagens-exercicios` | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/021-imagens-exercicios/spec.md`

## Summary

Ao abrir um exercício na tela de execução (RF03/04), buscar no catálogo interno
(spec 020) uma correspondência exata de nome (mesma normalização do RF08) e, se
houver, exibir a imagem/GIF associada. Reaproveita **integralmente** a estrutura de
dados (`ExercicioCatalogo`) e a função de leitura (`listarCatalogo`) já definidas
pela spec 020 — nenhuma reinterpretação ou interface paralela. Esta spec adiciona
uma função de busca por nome (nova, mas dentro do mesmo serviço já criado pela spec
020) e resolve um requisito técnico que a spec 020 ainda não precisava tratar: como
carregar a imagem localizada, dado que o bundler (Metro) não aceita `require()` com
caminho dinâmico.

## Technical Context

**Language/Version**: TypeScript (strict), React Native + Expo SDK 57

**Primary Dependencies**: nenhuma dependência nova

**Storage**: nenhuma — mesma leitura de dado estático já definida pela spec 020,
sem `AsyncStorage`

**Testing**: validação manual em Android e iOS (Princípio III); testável via web —
sem API nativa envolvida, mas a resolução de imagem estática via Metro precisa ser
confirmada nos bundlers reais (web/Android/iOS podem resolver assets de forma
levemente diferente)

**Target Platform**: Android 12+ e iOS 17+

**Project Type**: mobile-app (Expo Router, `src/app/`)

**Performance Goals**: N/A — busca síncrona em uma lista pequena e estática

**Constraints**: **depende de `specs/020-catalogo-exercicios` já implementada**
(FR-008 da spec) — `ExercicioCatalogo`/`listarCatalogo` não são redefinidos aqui,
só consumidos; qualquer ajuste de schema do catálogo é escopo da spec 020, não
desta

**Scale/Scope**: 1 função nova (no serviço já existente da spec 020), 1 arquivo
novo de índice de imagens (resolve limitação do Metro), 1 componente alterado — ver
Project Structure

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. TypeScript Obrigatório | ✅ Reaproveita `ExercicioCatalogo` já tipado (spec 020); `buscarNoCatalogo` tipada `(nome: string) => ExercicioCatalogo \| null`, sem `any`. |
| II. Simplicidade sobre Funcionalidades Avançadas | ✅ Busca síncrona, sem cache/memoização além de um `useMemo` local; nenhuma UI de seleção manual (FR-006, fora de escopo); reaproveita `normalizarNomeExercicio` já existente (RF08) em vez de nova lógica de comparação. |
| III. Validação em Dois Dispositivos-Alvo | ✅ `quickstart.md` cobre correspondência/ausência de correspondência; resolução de asset via Metro validada nos bundlers reais, não só em teste unitário. |
| IV. Controle de Dependências | ✅ Nenhuma dependência nova — `Image` é API do React Native core. |
| V. Isolamento de Dados por Perfil (NON-NEGOTIABLE) | ✅ Catálogo não é dado de perfil (já estabelecido pela spec 020); `ExercicioPlanejado.nome` já pertence a um treino já segregado por perfil — nenhuma consulta cross-perfil nova. |

Nenhuma violação — Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/021-imagens-exercicios/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões técnicas (inclui a limitação do Metro)
├── data-model.md         # Fase 1 — sem entidade nova; só a relação de busca
├── quickstart.md         # Fase 1 — roteiro de validação manual
└── contracts/
    ├── catalogo-exercicios.md      # Fase 1 — nova função no serviço já existente (spec 020)
    └── execucao-treino-screen.md   # Fase 1 — exibição condicional na execução
```

### Source Code (repository root)

```text
assets/                              # raiz do repo (@/assets/* no tsconfig), não src/
└── catalogo/
    └── imagens-index.ts        # NOVO — mapa estático nome-de-arquivo → require()
                                  #   (necessário pelo Metro, ver research.md)

src/
├── services/
│   └── catalogo-exercicios.ts      # ALTERADO (arquivo já criado pela spec 020):
│                                     #   ganha buscarNoCatalogo(nome), sem tocar em
│                                     #   ExercicioCatalogo/listarCatalogo já existentes
└── components/
    └── treino/
        └── exercicio-execucao.tsx  # ALTERADO: busca e exibe a imagem/GIF quando
                                      #   há correspondência (FR-001-FR-005)
```

**Correção aplicada durante o `/speckit.implement` da spec 020**: este documento
citava originalmente `src/assets/catalogo/...` — corrigido para `assets/catalogo/`
(raiz do repo), mesmo motivo documentado em `specs/020-catalogo-exercicios/plan.md`
e `specs/020-catalogo-exercicios/research.md`.

**Structure Decision**: nenhum tipo novo, nenhum serviço novo — `buscarNoCatalogo`
é adicionada ao mesmo arquivo de serviço já criado pela spec 020
(`catalogo-exercicios.ts`), não um arquivo paralelo. O único arquivo
verdadeiramente novo (`imagens-index.ts`) resolve uma limitação técnica do
bundler, não uma decisão de produto — ver `research.md`, Decisão 2 (inclui nota de
que isso é um complemento ao plano da spec 020, não uma mudança nele).

## Complexity Tracking

*Não aplicável — nenhuma violação da Constitution Check acima.*
