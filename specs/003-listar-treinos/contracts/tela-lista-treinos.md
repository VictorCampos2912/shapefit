# Contract: Tela de Lista de Treinos (`(tabs)/index.tsx`)

**Feature**: 003-listar-treinos | **Date**: 2026-09-15

Este app não expõe API externa; o "contrato" relevante é a interface de composição da tela
`src/app/(tabs)/index.tsx` com as camadas já existentes de serviço (`treino-storage.ts`, RF01)
e de hook (`use-perfil-ativo.tsx`, RF10) — ambas consumidas sem modificação. Ver
[data-model.md](../data-model.md) para os tipos referenciados.

## Consumo de `treino-storage.ts` (RF01, sem alteração)

```ts
listarTreinos(perfilId: string): Promise<Treino[]>
// Chamada pela tela sempre que perfilAtivo?.id mudar (Decisão 2 do research.md).
// A tela NÃO filtra o resultado — listarTreinos já retorna apenas treinos do perfilId dado.

importarTreino(perfilId: string): Promise<ResultadoImportacao | null>
importarTreinoExemplo(perfilId: string): Promise<ResultadoImportacao>
// Chamadas pela ação "Importar treino" / "Importar treino de exemplo" na tela de lista.
// Após uma chamada bem-sucedida (resultado.treino !== null), a tela MUST recarregar a lista
// chamando listarTreinos(perfilId) novamente, para refletir o novo treino sem fechar/reabrir
// o app (FR-005).
```

## Consumo de `use-perfil-ativo.tsx` (RF10, sem alteração)

```ts
usePerfilAtivo(): { perfilAtivo: Perfil | null; ... }
// A tela lê perfilAtivo.id para toda chamada a listarTreinos/importarTreino/importarTreinoExemplo.
// Mudanças em perfilAtivo (ex.: troca de perfil via /perfil/selecionar) MUST disparar uma
// releitura da lista (FR-003, FR-004) — não é necessária nenhuma mudança no hook em si.
```

## Comportamento observável da tela

| Entrada | Estado exibido | FR relacionado |
|---------|------------------|------------------|
| `perfilAtivo` ainda carregando (do Context de RF10) | Estado de carregamento, sem lista nem estado vazio | — (Assumption: perfil ativo sempre existe quando a tela é alcançável) |
| `listarTreinos(perfilAtivo.id)` retorna `[]` | Indicação clara de "nenhum treino ainda", com ação de importar visível | FR-011 |
| `listarTreinos(perfilAtivo.id)` retorna 1+ treinos | Lista de itens, cada um mostrando `nome`; itens com `nome` duplicado também mostram `importadoEm` | FR-002, FR-007 |
| Usuário aciona "Importar treino" | Fluxo de seleção de arquivo do RF01 é executado; ao concluir, mensagem de resultado (sucesso/parcial/erro) e lista recarregada em caso de sucesso | FR-008 |
| Usuário toca em um item da lista | O treino tocado é reconhecido de forma inequívoca (ex.: `treino.id` capturado no handler de toque); nenhuma navegação de tela é exigida nesta feature | FR-010 |
| Perfil ativo muda (troca de perfil via RF10) | Lista recarregada automaticamente para o novo `perfilAtivo.id`, sem fechar/reabrir o app | FR-003, FR-004 |

## Invariante de UI (FR-009)

Nenhuma outra tela do app (incluindo a versão anterior de `(tabs)/index.tsx`, agora
substituída) MUST oferecer uma ação de importar treino. Como a tela antiga é completamente
reescrita por esta feature, essa invariante é garantida estruturalmente — não há duplicação
de código de importação em dois arquivos.
