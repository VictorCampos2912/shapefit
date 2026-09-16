# Data Model: Listar Treinos Importados/Salvos

**Feature**: 003-listar-treinos | **Date**: 2026-09-15

Esta feature não introduz nenhuma entidade nova nem altera o modelo de dados persistido.
Todas as entidades relevantes já foram definidas em `specs/002-importar-treino-json/
data-model.md` (RF01) e são apenas consumidas em modo leitura aqui.

## Entidades reaproveitadas (definidas no RF01, sem alteração)

### Treino

Ver definição completa em `specs/002-importar-treino-json/data-model.md`, seção "Treino".
Campos relevantes para esta feature:

| Campo | Tipo | Uso nesta feature |
|-------|------|---------------------|
| `id` | `string` | Chave de item da lista (`key` de renderização) |
| `perfilId` | `string` | Não exibido; usado apenas indiretamente — a lista já vem filtrada por perfil, pois `listarTreinos(perfilId)` só retorna treinos daquele perfil |
| `nome` | `string` | Exibido como identificação principal do item (FR-002) |
| `exercicios` | `ExercicioPlanejado[]` | Não exibido nesta feature (fica para o RF03, tela de execução) |
| `importadoEm` | `string` (ISO 8601) | Exibido junto ao nome apenas quando há outro treino com o mesmo `nome` na lista (FR-007) |

### TreinosPorPerfilState

Ver definição completa em `specs/002-importar-treino-json/data-model.md`, seção
"TreinosPorPerfilState". Não é manipulada diretamente por esta feature — o acesso acontece
exclusivamente através de `listarTreinos(perfilId)`, já implementada.

## Estrutura derivada (somente em memória, não persistida)

### ItemDeListaTreino (view model, não persistido)

Representa como um `Treino` é exibido na lista, calculado no momento da renderização a
partir da lista retornada por `listarTreinos`.

| Campo | Tipo | Origem |
|-------|------|--------|
| `treino` | `Treino` | Item original retornado por `listarTreinos` |
| `nomeDuplicado` | `boolean` | Calculado: `true` se mais de um item da lista compartilha o mesmo `treino.nome` |

**Regra de cálculo**: `nomeDuplicado` para um item é `true` se, na lista completa retornada
por `listarTreinos(perfilId)`, existir pelo menos um outro item com `nome` idêntico
(comparação exata, sem normalização de maiúsculas/acentos, pois `nome` já vem trimado desde
o RF01). Quando `nomeDuplicado` é `true`, a apresentação do item inclui `importadoEm`
formatado; quando `false`, apenas `nome` é exibido.

## Relações

```text
Perfil (id, de RF10) 1 ── N Treino (perfilId)   [já existente, apenas consumido aqui]
Treino 1 ── 1 ItemDeListaTreino                  [transformação de apresentação, nesta feature]
```

## Estados da tela (não persistidos)

| Estado | Condição | Comportamento (FR relacionado) |
|--------|----------|-----------------------------------|
| Carregando | `listarTreinos` ainda não retornou para o perfil ativo atual | Nenhum requisito específico exige um indicador; recomenda-se não exibir a lista nem o estado vazio até a leitura concluir |
| Lista vazia | `listarTreinos(perfilAtivo.id)` retorna `[]` | Exibir indicação clara de que não há treinos ainda, com a ação de importar visível (FR-011) |
| Lista com itens | `listarTreinos(perfilAtivo.id)` retorna 1+ itens | Exibir todos os itens, aplicando a regra de `nomeDuplicado` (FR-007) |
