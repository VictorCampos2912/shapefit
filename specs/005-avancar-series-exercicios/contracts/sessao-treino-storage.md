# Contract: `sessao-treino-storage.ts` (novo serviço)

**Feature**: 005-avancar-series-exercicios | **Date**: 2026-09-16

Este app não expõe API externa; o "contrato" relevante é a interface do novo serviço de
persistência e sua compatibilidade **obrigatória** com a leitura já existente em
`src/services/perfil-storage.ts` (RF10). Ver [data-model.md](../data-model.md) para os
tipos referenciados.

## Compatibilidade com o RF10 (restrição, não opcional — garantida em tempo de compilação)

```ts
// src/types/perfil.ts — SessaoRegistro movido para cá (era um `type` privado dentro de
// perfil-storage.ts) e exportado, sem alteração de campos/nomes:
export type SessaoRegistro = { perfilId: string; finalizadaEm: string | null };

// src/services/perfil-storage.ts (RF10) — única mudança: importa o tipo em vez de
// declará-lo localmente; existeSessaoEmAndamento permanece com o mesmo comportamento:
import type { SessaoRegistro } from '@/types/perfil';

export async function existeSessaoEmAndamento(perfilId: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(`sessoes:${perfilId}`);
  if (!raw) return false;
  const sessoes = JSON.parse(raw) as SessaoRegistro[];
  return sessoes.some((sessao) => sessao.finalizadaEm === null);
}

// src/types/execucao-treino.ts (novo, desta feature):
export interface SessaoTreino extends SessaoRegistro {
  treinoId: string;
  iniciadaEm: string;
  execucoes: ExecucaoExercicio[];
}
```

Como `SessaoTreino` usa `extends SessaoRegistro`, qualquer sessão gravada por
`sessao-treino-storage.ts` é estruturalmente garantida — pelo compilador, não apenas por
convenção — a conter `perfilId` e `finalizadaEm` com os mesmos nomes e tipos que
`existeSessaoEmAndamento` já espera. Se `SessaoRegistro` for alterado no futuro (ex.: pelo
RF07), `SessaoTreino` deixa de compilar até ser ajustado, evitando divergência silenciosa.

Toda escrita feita por `sessao-treino-storage.ts` na chave `sessoes:${perfilId}` MUST:
- Gravar um **array** de objetos (nunca um objeto único).
- Cada objeto MUST conter, no mínimo, `perfilId: string` e `finalizadaEm: string | null`
  com esses nomes e tipos exatos.
- Nesta feature, `finalizadaEm` MUST ser sempre `null` (nunca preenchido — isso é escopo
  do RF07).

Qualquer violação desses pontos quebra silenciosamente o bloqueio de troca de perfil do
RF10, sem lançar erro — por isso este contrato é tratado como restrição obrigatória, não
como sugestão.

## Interface do serviço

```ts
export async function obterSessao(
  perfilId: string,
  treinoId: string,
): Promise<SessaoTreino | null>
// Busca, dentre as sessões do perfil, a que corresponde a treinoId. Retorna null se o
// perfil nunca teve nenhuma série concluída para esse treino (nenhuma sessão criada ainda
// — ver research.md, Decisão 3).

export async function registrarSerieConcluida(params: {
  perfilId: string;
  treinoId: string;
  exercicioId: string;
  serie: SerieRealizada;
  totalSeriesDoExercicio: number;
}): Promise<SessaoTreino>
// Cria a sessão do treino se ainda não existir (iniciadaEm = agora, finalizadaEm = null,
// execucoes = []). Localiza ou cria a ExecucaoExercicio para exercicioId. Anexa `serie` ao
// final de seriesRealizadas. Recalcula status: 'concluido' se
// seriesRealizadas.length === totalSeriesDoExercicio, senão 'em_andamento'. Persiste o
// array inteiro de sessões do perfil de volta em sessoes:${perfilId}. Retorna a sessão
// atualizada.

export async function marcarExercicioConcluido(params: {
  perfilId: string;
  treinoId: string;
  exercicioId: string;
}): Promise<SessaoTreino>
// Atualiza ExecucaoExercicio.status para 'concluido' (idempotente — normalmente já é
// 'concluido' após a última série, conforme registrarSerieConcluida; esta função existe
// para tornar explícito o momento de "Concluir exercício" tocado pelo usuário, distinto de
// apenas ter terminado as séries). Não altera finalizadaEm da sessão (permanece null).
```

## Comportamento observável

| Entrada | Resultado | FR relacionado |
|---------|------------------|------------------|
| Primeira série concluída de um treino (nenhuma sessão prévia) | Cria uma nova `SessaoTreino` em `sessoes:${perfilId}` com `iniciadaEm` = agora, `finalizadaEm: null`, `execucoes` com uma `ExecucaoExercicio` contendo a série | FR-003, FR-011 |
| Série concluída de um exercício que já tem sessão/execução | Anexa a série a `seriesRealizadas` existente, sem recriar a sessão | FR-003, FR-011 |
| Série concluída é a última planejada do exercício | `status` da execução vira `'concluido'`; sessão continua com `finalizadaEm: null` | FR-006, FR-007, FR-011 |
| Usuário toca em "Concluir exercício" | `status` confirmado como `'concluido'` (idempotente); rota volta à lista, item exibido com estado visual `'concluido'` | FR-008, FR-009 |
| Reabrir o app / voltar à rota do treino | `obterSessao` retorna a sessão já persistida; a tela reconstrói `estadosPorExercicio` a partir dela (ver data-model.md, "Fluxo de carregamento") | FR-012 |
| Perfil inicia um segundo treino sem concluir o primeiro | Uma segunda `SessaoTreino` (outro `treinoId`) é adicionada ao mesmo array em `sessoes:${perfilId}`, sem afetar a primeira | Contrato de Persistência da Sessão (spec.md) |
| `existeSessaoEmAndamento` (RF10) é chamada após qualquer uma dessas escritas | Continua retornando `true` enquanto existir ao menos uma sessão do perfil com `finalizadaEm: null` — sem nenhuma alteração em `perfil-storage.ts` | Compatibilidade com o RF10 (spec.md) |

## Fora de escopo desta feature (documentado para não ser confundido com omissão)

- Preencher `finalizadaEm` (finalização de sessão, automática ou manual): RF07.
- Indicar, na lista de treinos (RF02), quais treinos têm sessão em andamento: decisão
  adiada (spec.md, Assumptions).
- Editar `seriesRealizadas` já persistidas: RF09.
- Qualquer lógica de expiração, limpeza ou limite de sessões antigas em andamento: fora de
  escopo, não solicitado pela spec.
