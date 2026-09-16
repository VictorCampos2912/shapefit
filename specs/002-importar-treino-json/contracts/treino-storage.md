# Contract: Serviço de Persistência e Importação de Treino (`treino-storage`)

**Feature**: 002-importar-treino-json | **Date**: 2026-09-15

Este app não expõe API externa; o "contrato" relevante é a interface interna que a camada de
serviço (`src/services/treino-storage.ts`) expõe para telas e hooks consumirem, seguindo o
mesmo padrão arquitetural de `src/services/perfil-storage.ts` (RF10). Ver
[data-model.md](../data-model.md) para os tipos referenciados.

## Interface

```ts
importarTreino(): Promise<ResultadoImportacao | null>
// Abre o seletor de arquivos do sistema (expo-document-picker) restrito a JSON.
// Se o usuário cancelar a seleção: retorna null, sem qualquer efeito colateral (FR-011).
// Se um arquivo for selecionado: lê o conteúdo, tenta fazer parse e valida a estrutura,
// obtém o perfil_id do perfil ativo (via usePerfilAtivo(), fora desta camada de serviço —
// ver "Ponto de integração" abaixo) e persiste o treino resultante sob `treinos:<perfil_id>`.
// Retorna sempre um ResultadoImportacao quando um arquivo foi de fato selecionado.

listarTreinos(perfilId: string): Promise<Treino[]>
// Lê a lista de treinos sob a chave `treinos:<perfilId>`. Retorna [] se a chave não existir.
// Consumido pelo RF02 (fora do escopo desta feature, mas o contrato já é definido aqui).
```

## Pré-condições e pós-condições

| Operação | Pré-condição | Pós-condição |
|----------|--------------|----------------|
| `importarTreino` | Existe um perfil ativo (garantido pelo RF10 — o app não libera acesso às telas sem um perfil ativo) | Se um arquivo válido (ao menos estruturalmente) foi selecionado: novo `Treino` persistido em `treinos:<perfil_id>` do perfil ativo no momento da chamada. Se o usuário cancelou, ou o arquivo é inválido: nenhuma alteração de estado ocorre |
| `listarTreinos` | — | Não possui efeitos colaterais (somente leitura); resultado contém apenas treinos do `perfilId` informado (Princípio V) |

## Ponto de integração com o perfil ativo

`importarTreino()` (a função de serviço) não lê o perfil ativo diretamente — essa
responsabilidade é do chamador (a tela/ação que aciona a importação), que MUST obter o
`perfilId` via o hook `usePerfilAtivo()` (`src/hooks/use-perfil-ativo.tsx`, já existente do
RF10) e passá-lo explicitamente à camada de persistência antes da escrita. Isso preserva a
separação de responsabilidades já estabelecida pelo RF10: hooks lidam com estado de React
(perfil ativo reativo), serviços lidam com persistência pura, sem depender de contexto de
React.

## Erros e casos observáveis (mapeados ao `ResultadoImportacao`)

| Caso | `treino` | `exerciciosIgnorados` | `erro` |
|------|----------|------------------------|--------|
| Usuário cancela a seleção | — (retorno é `null`, não um `ResultadoImportacao`) | — | — |
| Arquivo não é JSON sintaticamente válido | `null` | `[]` | Mensagem indicando arquivo inválido/corrompido (FR-007) |
| JSON válido, mas sem `nome` ou sem `exercicios` válido (lista ausente, vazia, ou todos os itens inválidos) | `null` | `[]` | Mensagem indicando que o treino não pôde ser reconhecido (FR-008, Edge Case) |
| JSON válido, estrutura mínima ok, todos os exercícios válidos | `Treino` completo | `[]` | `null` |
| JSON válido, estrutura mínima ok, parte dos exercícios inválidos | `Treino` com apenas os exercícios válidos | Lista com os exercícios descartados e o motivo | `null` (a importação é considerada bem-sucedida, porém parcial — FR-006) |

## Consumidores esperados (fora do escopo desta feature, mas que MUST aderir ao contrato)

- RF02 (Listar treinos importados/salvos): chama `listarTreinos(perfilId)` com o `perfilId` do
  perfil ativo (via `usePerfilAtivo()`), filtrando sempre por perfil (FR-004, Princípio V).
- RF03 (Tela de execução): lê um `Treino` específico (por `id`) da lista retornada por
  `listarTreinos`, para exibir seus `ExercicioPlanejado`.
