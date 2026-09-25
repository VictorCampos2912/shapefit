# Implementation Plan: Catálogo Interno de Exercícios

**Branch**: `020-catalogo-exercicios` | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/020-catalogo-exercicios/spec.md`

## Summary

Criar um catálogo estático embutido no app (nome, grupo muscular, imagem por
exercício), curado a partir dos dados abertos do **wger project** (CC-BY-SA 3.0,
trocado do free-exercise-db original após pesquisa real de licença — ver
`research.md`, Decisão 1), sem nenhuma dependência de rede em tempo de execução. O
dado é extraído da API pública do wger **uma única vez, durante o desenvolvimento**
(processo de curadoria, fora do app), nunca pelo app em produção — preservando
RNF02 (100% offline). O app ganha uma tela de créditos/atribuição (FR-007), exigida
pela licença escolhida.

## Technical Context

**Language/Version**: TypeScript (strict), React Native + Expo SDK 57

**Primary Dependencies**: nenhuma dependência nova de runtime — a curadoria em si
usa a API pública do wger (`https://wger.de/api/v2/`), mas só como ferramenta de
desenvolvimento (script/processo manual de extração), nunca importada nem chamada
pelo código do app

**Storage**: nenhuma chave nova de `AsyncStorage` — catálogo é dado estático
embutido no bundle (JSON + arquivos de imagem em `src/assets/`), não persistido em
tempo de execução (Key Entities da spec já define isso)

**Testing**: validação manual em Android e iOS (Princípio III) — nesta rodada, sem
UI própria (FR-006), a validação é majoritariamente de dados (checar que o JSON do
catálogo carrega e resolve as imagens corretamente nos dois bundlers, Metro
Android/iOS) mais a exibição da tela de créditos (FR-007)

**Target Platform**: Android 12+ e iOS 17+

**Project Type**: mobile-app (Expo Router, `src/app/`)

**Performance Goals**: N/A — leitura de um JSON estático pequeno, sem I/O de rede

**Constraints**: RNF02 (100% offline) não pode ser violado — nenhum código do app
chama a API do wger em runtime; Princípio IV — nenhuma dependência de HTTP/rede nova
adicionada ao `package.json` por causa desta feature (o processo de curadoria roda
fora do app, não faz parte do bundle)

**Scale/Scope**: 1 tipo novo, 1 arquivo de dados estático (JSON), N arquivos de
imagem estáticos (curadoria — quantidade exata definida durante a extração, não
neste plano), 1 serviço novo de leitura, 1 tela de créditos nova — ver Project
Structure

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. TypeScript Obrigatório | ✅ Novo tipo `ExercicioCatalogo` explicitamente definido, sem `any`; JSON do catálogo tipado ao ser importado (`as ExercicioCatalogo[]` com validação em dev, ver `research.md`). |
| II. Simplicidade sobre Funcionalidades Avançadas | ✅ Catálogo é um JSON estático + imagens locais, lido por uma função síncrona/pura — sem cache, sem estado, sem tela própria (FR-006, fora de escopo). |
| III. Validação em Dois Dispositivos-Alvo | ✅ `quickstart.md` cobre carregamento do catálogo e a tela de créditos nos dois bundlers/plataformas. |
| IV. Controle de Dependências | ✅ Nenhuma dependência de runtime nova — a API do wger é só uma ferramenta de curadoria, fora do app; PRD será atualizado citando a fonte dos dados (não uma dependência de código). |
| V. Isolamento de Dados por Perfil (NON-NEGOTIABLE) | ✅ Catálogo é dado estático compartilhado, não associado a `perfil_id` (FR-005, já explícito na spec) — nenhuma violação, já que não é dado de perfil. |

Nenhuma violação — Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/020-catalogo-exercicios/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões técnicas (inclui a pesquisa real de licença)
├── data-model.md         # Fase 1 — ExercicioCatalogo, GrupoMuscular
├── quickstart.md         # Fase 1 — roteiro de validação manual
└── contracts/
    ├── catalogo-exercicios.md   # Fase 1 — schema do JSON + serviço de leitura
    └── tela-creditos.md         # Fase 1 — atribuição obrigatória (FR-007)
```

### Source Code (repository root)

```text
assets/                          # raiz do repo (@/assets/* no tsconfig), não src/
└── catalogo/
    ├── exercicios.json      # NOVO: catálogo curado (dados estáticos)
    ├── imagens/             # NOVO: mídia curada (imagens/GIFs estáticos)
    └── imagens-index.ts     # NOVO (ver nota abaixo): mapa estático de
                              #   require() por arquivo — gerado pelo mesmo
                              #   processo de curadoria

src/
├── types/
│   └── catalogo-exercicios.ts   # NOVO: ExercicioCatalogo, GrupoMuscular
├── services/
│   └── catalogo-exercicios.ts   # NOVO: leitura pura do JSON embutido
└── app/
    └── acoes.tsx                 # ALTERADO: novo item/seção de créditos (FR-007)
```

**Correção aplicada durante o `/speckit.implement`**: os documentos desta spec
(este `plan.md`, `data-model.md`, `contracts/catalogo-exercicios.md`,
`quickstart.md`, `tasks.md`) citavam originalmente `src/assets/catalogo/...`,
mas o projeto já usa `assets/` na raiz do repo para dado estático embutido
(alias `@/assets/*` → `./assets/*` em `tsconfig.json`, mesmo caminho de
`assets/exemplos/treino-exemplo.json`, já existente para RF01) — `src/assets/`
não existia e o `tsc` falha ao resolver `@/assets/catalogo/exercicios.json` a
partir de `src/`. Corrigido nos documentos e no código durante a implementação;
`specs/021-imagens-exercicios/research.md` (Decisão 2) também corrigido pelo
mesmo motivo.

**Nota adicionada em 2026-09-23** (durante o `/speckit.plan` da spec 021, primeira
feature a efetivamente carregar uma imagem do catálogo): o processo de curadoria
desta spec precisa gerar, além de `exercicios.json`, o arquivo
`imagens-index.ts` — um mapa estático com um `require()` literal por imagem. O
Metro (bundler) não resolve `require()` com caminho dinâmico/vindo de uma
variável, então guardar só o nome do arquivo em `exercicios.json` (como já
definido em `data-model.md`) não é suficiente sozinho para carregar a imagem em
runtime — é preciso esse índice complementar. Isso não muda `ExercicioCatalogo`
nem `listarCatalogo` (ambos continuam como já definidos), só adiciona um artefato
de saída à curadoria. Detalhe completo em `specs/021-imagens-exercicios/research.md`,
Decisão 2.

**Structure Decision**: nenhum arquivo de storage novo (`AsyncStorage`) — o
catálogo é dado estático do bundle, mesma categoria de asset já usada por
`src/assets/exemplos/treino-exemplo.json` (exemplo de treino embutido, já existente
para RF01). A tela de créditos é um acréscimo pequeno à tela "Ações" (RF14, spec
015) já existente, não uma tela nova.

## Complexity Tracking

*Não aplicável — nenhuma violação da Constitution Check acima.*
