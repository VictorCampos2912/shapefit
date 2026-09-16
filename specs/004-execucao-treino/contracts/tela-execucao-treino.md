# Contract: Tela de Execução do Treino (`src/app/treino/[treinoId].tsx`)

**Feature**: 004-execucao-treino | **Date**: 2026-09-15

Este app não expõe API externa; o "contrato" relevante é a interface de composição da nova
rota `src/app/treino/[treinoId].tsx` com as camadas já existentes de serviço
(`treino-storage.ts`, RF01) e de hook (`use-perfil-ativo.tsx`, RF10) — ambas consumidas sem
modificação — além do contrato de navegação com a tela de lista (RF02). Ver
[data-model.md](../data-model.md) para os tipos e o estado local referenciados.

## Parâmetro de rota

```ts
useLocalSearchParams<{ treinoId: string }>()
// treinoId vem da navegação disparada por src/app/(tabs)/index.tsx (ver "Contrato de
// navegação" abaixo). Não há outro ponto de entrada para esta rota nesta feature.
```

## Consumo de `treino-storage.ts` (RF01, sem alteração)

```ts
listarTreinos(perfilId: string): Promise<Treino[]>
// Chamada ao montar a rota, usando perfilAtivo.id (do use-perfil-ativo.tsx).
// A rota localiza o treino correspondente a treinoId dentro do array retornado
// (`treinos.find(t => t.id === treinoId)`), sem introduzir uma nova função de storage
// (Decisão 1 do research.md).
// Se nenhum treino corresponder (ex.: treino removido entre a navegação e o carregamento),
// a tela trata como estado de erro/não encontrado — ver "Comportamento observável".
```

## Consumo de `use-perfil-ativo.tsx` (RF10, sem alteração)

```ts
usePerfilAtivo(): { perfilAtivo: Perfil | null; ... }
// A rota lê perfilAtivo.id para a chamada a listarTreinos. Não há necessidade de reagir a
// troca de perfil dentro desta tela: por regra de negócio (RF10), a troca de perfil ativo
// já é bloqueada enquanto haveria uma sessão de treino em andamento — fora do escopo desta
// feature (RF07), mas relevante como invariante que evita que esta tela precise lidar com
// perfilAtivo mudando "debaixo dela".
```

## Contrato de navegação (com `src/app/(tabs)/index.tsx`, RF02)

```ts
// Em src/app/(tabs)/index.tsx, handleSelecionarTreino(treino: Treino) passa a:
router.push(`/treino/${treino.id}`);
// Substitui o Alert.alert provisório (Decisão 2 do research.md).
// Nenhuma outra forma de entrada nesta rota é definida por esta feature.
```

## Estado interno da rota (não é um contrato externo, documentado aqui por ser o núcleo do comportamento)

| Estado | Transição | FR relacionado |
|---|---|---|
| Carregando treino | Ao montar, antes de `listarTreinos` resolver | — |
| Treino carregado, nenhum exercício selecionado | Exibe lista de exercícios com dados planejados (`series`, `repsAlvo`, `cargaSugeridaKg`, `descansoSeg`) | FR-002, FR-003 |
| Exercício selecionado, não iniciado | Usuário tocou em um item da lista de exercícios (qualquer um, em qualquer ordem); exibe botão "Iniciar exercício" | FR-004, FR-005, FR-006 |
| Exercício em execução | Usuário tocou em "Iniciar exercício"; exibe campos de carga (pré-preenchido com `cargaSugeridaKg`) e reps para a série atual, e o indicador "Série X de Y" | FR-007, FR-008, FR-009, FR-011, FR-012 |
| Edição de carga/reps | Usuário edita os campos da série atual; carga aceita decimais e rejeita não-numéricos | FR-009, FR-010 |
| Voltar à lista e reabrir um exercício já iniciado | O progresso daquele exercício (iniciado, série atual, carga/reps digitados) é preservado e reexibido tal como estava, via `estadosPorExercicio` (data-model.md) — nenhum campo é resetado | FR-004, FR-005, FR-014 |

## Comportamento observável da tela

| Entrada | Estado exibido | FR relacionado |
|---------|------------------|------------------|
| `treinoId` não corresponde a nenhum treino do perfil ativo | Estado de erro/não encontrado (não há navegação alternativa nesta feature; cenário não esperado em uso normal, pois a navegação só ocorre a partir de itens já existentes na lista do RF02) | — |
| Lista de exercícios exibida | Cada item mostra `nome`, `series`, `repsAlvo`, `cargaSugeridaKg`, `descansoSeg`; itens em estados diferentes (não iniciado / pausado / concluído) recebem estilo visual distinto (FR-014). Não existe estado "em andamento" na lista: o app não executa dois exercícios ao mesmo tempo, então um exercício já iniciado aparece como "pausado" enquanto o usuário está em outro exercício ou na própria lista | FR-002, FR-003, FR-014 |
| Usuário toca em qualquer exercício da lista | Exercício selecionado abre imediatamente, independentemente de posição na lista ou de exercícios anteriores estarem "concluídos" (conceito de conclusão pertence ao RF04; nesta feature nenhum exercício fica bloqueado) | FR-004, FR-005 |
| Usuário toca em "Iniciar exercício" | Campos de carga/reps aparecem para a série 1; carga pré-preenchida com `cargaSugeridaKg` | FR-006, FR-007, FR-008 |
| Usuário edita o campo de carga | Aceita dígitos e um separador decimal (ex.: `42.5`); rejeita letras/símbolos | FR-009, FR-010 |
| Indicador de série | Sempre visível durante a execução, no formato "Série {serieAtual} de {series}" | FR-011, FR-012 |
| Comparação visual com a tela de lista (RF02) | Mesma família de componentes (`ThemedText`, `ThemedView`) e tokens (`Spacing`, `Colors`); nenhuma paleta ou biblioteca nova | FR-013 |

## Fora de escopo desta feature (documentado para não ser confundido com omissão)

- Botões "Concluir série" / "Concluir exercício", avanço de série, e volta à lista com
  marcação de concluído: RF04.
- Cronômetro de descanso e sua notificação: RF05/RF06.
- Persistência do progresso (retomar sessão após fechar o app): RF07 (e RF04 para o
  registro de séries em si).
