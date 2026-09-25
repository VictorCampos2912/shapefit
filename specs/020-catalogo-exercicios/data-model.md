# Data Model: Catálogo Interno de Exercícios

**Feature**: `020-catalogo-exercicios` | **Date**: 2026-09-23

Nenhum dado persistido em `AsyncStorage` — catálogo é um asset estático embutido no
bundle (JSON + imagens), sem associação a perfil (FR-005 da spec).

## Tipos novos: `src/types/catalogo-exercicios.ts`

### `GrupoMuscular`

```ts
export type GrupoMuscular = 'peito' | 'costas' | 'pernas' | 'ombros' | 'braços' | 'core';
```

União fixa de literais — lista definida nesta fase (`research.md`, Decisão 3),
cobrindo os principais grupos musculares de treino de academia (SC-004 da spec).

### `ExercicioCatalogo`

| Campo | Tipo | Obrigatório | Regras |
|-------|------|-------------|--------|
| `id` | `string` | sim | Slug estável, único dentro do catálogo (ex.: `"supino-reto-barra"`) |
| `nome` | `string` | sim | Nome de exibição do exercício |
| `grupoMuscular` | `GrupoMuscular` | sim | Um dos 6 valores fixos |
| `midia` | `{ tipo: 'imagem' \| 'gif'; arquivo: string }` | sim | `arquivo` é o caminho relativo dentro de `assets/catalogo/imagens/` (SC-001: todo exercício do catálogo tem mídia) |
| `fonteAtribuicao` | `string` | sim | Texto de crédito por item (fonte + licença — CC-BY-SA 3.0, wger project), consumido pela tela de créditos (FR-007) |

**Invariantes**:
- `id` único dentro de `exercicios.json` (sem duplicatas).
- Todo item tem os 3 atributos de SC-001 completos (nome, grupo muscular, mídia) —
  itens sem mídia disponível na fonte são excluídos da curadoria antes de gerar o
  JSON final (Edge Case já definido na spec), nunca incluídos com `midia` ausente.
- `fonteAtribuicao` nunca vazio — exigência da licença CC-BY-SA (atribuição por
  obra), não uma preferência de produto.

## Arquivo de dados: `assets/catalogo/exercicios.json`

```json
[
  {
    "id": "supino-reto-barra",
    "nome": "Supino reto (barra)",
    "grupoMuscular": "peito",
    "midia": { "tipo": "gif", "arquivo": "supino-reto-barra.gif" },
    "fonteAtribuicao": "wger project (wger.de), CC-BY-SA 3.0"
  }
]
```

Gerado pelo processo de curadoria (`research.md`, Decisão 2) — não gerado nem
alterado por código do app em runtime; committed no repositório como qualquer
outro asset estático (mesmo tratamento de `docs/exemplos/*.json`, só que embutido
no bundle do app em vez de ficar em `docs/`).

## Arquivo de índice: `assets/catalogo/imagens-index.ts`

Gerado pelo mesmo processo de curadoria que produz `exercicios.json` (não escrito
à mão, não alterado por código do app em runtime):

```ts
export const IMAGENS_CATALOGO: Record<string, ReturnType<typeof require>> = {
  'supino-reto-barra.gif': require('./imagens/supino-reto-barra.gif'),
  // ... uma entrada por item de exercicios.json
};
```

Chaveado pelo mesmo valor usado em `midia.arquivo` de cada `ExercicioCatalogo` —
uma entrada de `imagens-index.ts` por item de `exercicios.json`, sem exceção.

**Por que existe separado de `exercicios.json`**: o Metro (bundler do React
Native/Expo) resolve `require()` de asset estaticamente, em tempo de build — não
existe forma de fazer `require(variavel)` a partir de um nome de arquivo lido em
runtime de `exercicios.json`. `imagens-index.ts` existe só para contornar essa
limitação, com um `require()` literal por imagem; não é um dado alternativo, é o
único jeito de o Metro conseguir empacotar as imagens no bundle. Detalhe completo
em `specs/021-imagens-exercicios/research.md`, Decisão 2 (spec que efetivamente
consome este índice — esta feature só o gera).

## Relação com entidades já existentes

- **Nenhuma relação de dados** com `Treino`/`ExercicioPlanejado` (RF01) — FR-004 da
  spec já estabelece que esta feature não introduz nenhum vínculo entre o catálogo
  e os exercícios importados via JSON. A busca por correspondência de nome (para
  exibir imagem na execução) é escopo da spec 021, não desta.
