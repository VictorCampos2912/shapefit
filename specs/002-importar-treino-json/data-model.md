# Data Model: Importar Treino via Arquivo JSON

**Feature**: 002-importar-treino-json | **Date**: 2026-09-15

## Entidades

### Treino (persistido)

Representa um plano de treino importado, associado a um perfil (ver spec, seção Key Entities).

| Campo | Tipo | Obrigatório | Regras de validação |
|-------|------|-------------|----------------------|
| `id` | `string` | sim (gerado pelo sistema) | Único; gerado na importação (não vem do JSON de entrada) |
| `perfilId` | `string` | sim (gerado pelo sistema) | Igual ao `perfil_id` do perfil ativo no momento da importação (FR-003); nunca editável |
| `nome` | `string` | sim | Vem do campo `nome` do JSON de entrada; não vazio após `trim()` — ausência ou vazio torna o arquivo inteiro inválido (FR-008) |
| `exercicios` | `ExercicioPlanejado[]` | sim | Resultado da validação individual de cada item de `exercicios` no JSON; contém apenas os exercícios válidos (FR-005). Lista vazia após validação (todos os exercícios inválidos) torna a importação inteira inválida (Edge Case) |
| `importadoEm` | `string` (ISO 8601) | sim (gerado pelo sistema) | Timestamp da importação; usado para diferenciar treinos com `nome` repetido (consumido pelo RF02) |

**Invariantes**:
- Um `Treino` só existe se `nome` não vazio e `exercicios` tiver pelo menos 1 item válido (FR-008, Edge Case).
- `perfilId` MUST corresponder ao perfil ativo no momento da importação e nunca é alterado após a criação (Princípio V).

### ExercicioPlanejado (dentro de um Treino)

Representa um exercício individual dentro de um treino importado.

| Campo | Tipo | Obrigatório | Regras de validação |
|-------|------|-------------|----------------------|
| `id` | `string` | sim | Vem do campo `id` do JSON do exercício; não vazio |
| `nome` | `string` | sim | Vem do campo `nome` do JSON do exercício; não vazio |
| `series` | `number` | sim | Vem do campo `series` do JSON; MUST ser numérico (não string) |
| `repsAlvo` | `string` | sim | Vem do campo `reps_alvo` do JSON (ex.: `"8-10"`); MUST ser string não vazia |
| `cargaSugeridaKg` | `number` | sim | Vem do campo `carga_sugerida_kg` do JSON; MUST ser numérico |
| `descansoSeg` | `number` | sim | Vem do campo `descanso_seg` do JSON; MUST ser numérico |

**Regra de validação por exercício (FR-005)**: um item da lista `exercicios` do JSON é
considerado **inválido e descartado** se qualquer um dos campos acima estiver ausente ou com
tipo diferente do especificado. Nenhum outro exercício da mesma lista é afetado pela
invalidez de um item.

### ResultadoImportacao (valor de retorno da operação, não persistido)

Representa o resultado observável de uma tentativa de importação, usado para compor a
mensagem exibida ao usuário (FR-006).

| Campo | Tipo | Descrição |
|-------|------|------------|
| `treino` | `Treino \| null` | O treino criado, ou `null` se a importação foi totalmente rejeitada (FR-007, FR-008) |
| `exerciciosIgnorados` | `{ indice: number; motivo: string }[]` | Lista dos exercícios descartados durante a validação (FR-006); vazia quando todos os exercícios do arquivo são válidos |
| `erro` | `string \| null` | Mensagem de erro quando `treino` é `null` (arquivo sintaticamente inválido, ou estruturalmente inválido); `null` em importações bem-sucedidas (mesmo com exercícios ignorados) |

**Regras de transição**:
- Arquivo não é JSON sintaticamente válido → `{ treino: null, exerciciosIgnorados: [], erro: <mensagem> }` (FR-007).
- JSON válido mas sem `nome` ou sem `exercicios` (ou `exercicios` vazio, ou todos os itens de `exercicios` inválidos) → `{ treino: null, exerciciosIgnorados: [], erro: <mensagem> }` (FR-008, Edge Case).
- JSON válido com estrutura mínima presente e ao menos 1 exercício válido → `{ treino: <Treino>, exerciciosIgnorados: <lista, pode ser vazia>, erro: null }` (FR-002, FR-005, FR-006).
- Usuário cancela a seleção de arquivo → nenhuma chamada de importação ocorre; não há `ResultadoImportacao` (FR-011, tratado antes da camada de parsing).

### TreinosPorPerfilState (registro raiz persistido)

Estrutura raiz armazenada sob a chave `treinos:<perfil_id>` no AsyncStorage, por perfil —
segue a mesma convenção definida em `specs/001-perfil-local/data-model.md`.

| Campo | Tipo | Descrição |
|-------|------|------------|
| `treinos` | `Treino[]` | Lista de todos os treinos importados por aquele perfil |

**Regra de escrita**: uma nova importação bem-sucedida acrescenta o `Treino` criado à lista
existente sob `treinos:<perfil_id>` do perfil ativo, sem remover ou alterar treinos já
presentes (FR-010). Se a chave `treinos:<perfil_id>` não existir ainda para aquele perfil, o
estado inicial é `{ treinos: [] }` antes da inserção.

## Convenção de chaves AsyncStorage (reaproveitada do RF10)

| Chave | Escopo | Conteúdo |
|-------|--------|----------|
| `treinos:<perfil_id>` | Por perfil | `TreinosPorPerfilState` serializado em JSON — definida em `specs/001-perfil-local/data-model.md`, implementada por esta feature |

Nenhuma nova convenção de chave é introduzida; esta feature apenas implementa a chave já
reservada pelo RF10.

## Relações

```text
Perfil (id, de RF10) 1 ── N Treino (perfilId)
Treino (id) 1 ── N ExercicioPlanejado (embutido, não é entidade própria de storage)
Treino ── 1 ResultadoImportacao (valor de retorno, não persistido)
```
