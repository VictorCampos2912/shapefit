# Contract: `sessao-treino-storage.ts` e `src/app/treino/[treinoId].tsx` (extensão)

**Feature**: 009-salvar-sessao-treino | **Date**: 2026-09-18

Estende o contrato já existente em
[../../005-avancar-series-exercicios/contracts/sessao-treino-storage.md](../../005-avancar-series-exercicios/contracts/sessao-treino-storage.md)
(RF04), que documenta a interface original do serviço e sua compatibilidade
obrigatória com `existeSessaoEmAndamento` (RF10). Não repete o que já está lá — apenas
o que esta feature altera ou adiciona.

## Alteração de assinatura/comportamento das funções existentes

```ts
// Antes (RF04): localizava por treinoId sozinho.
// Depois (RF07): localiza por treinoId + finalizadaEm === null.

export async function obterSessao(
  perfilId: string,
  treinoId: string,
): Promise<SessaoTreino | null>
// Retorna a sessão EM ANDAMENTO daquele treino, se houver. Se a única sessão
// existente já estiver finalizada, retorna null (equivalente a "nenhuma sessão em
// andamento" — a UI trata como se fosse a primeira execução).

export async function registrarSerieConcluida(params: {
  perfilId: string;
  treinoId: string;
  exercicioId: string;
  serie: SerieRealizada;
  totalSeriesDoExercicio: number;
}): Promise<SessaoTreino>
// Localiza a sessão EM ANDAMENTO do treino (treinoId + finalizadaEm === null). Se
// não encontrar, cria uma nova sessão com id: Crypto.randomUUID() (NOVO em relação
// ao RF04), iniciadaEm = agora, finalizadaEm: null, execucoes: []. Restante do
// comportamento (localizar/criar ExecucaoExercicio, anexar série, recalcular status)
// inalterado em relação ao RF04.

export async function marcarExercicioConcluido(params: {
  perfilId: string;
  treinoId: string;
  exercicioId: string;
}): Promise<SessaoTreino>
// Mesma mudança de busca (treinoId + finalizadaEm === null). Continua lançando erro
// se nenhuma sessão em andamento existir (pressupõe que registrarSerieConcluida já
// criou uma).

export async function atualizarSerieRealizada(params: {
  perfilId: string;
  treinoId: string;
  exercicioId: string;
  serie: number;
  novaCargaKg: number;
  novosReps: number;
}): Promise<SessaoTreino>
// Mesma mudança de busca (treinoId + finalizadaEm === null).
```

## Nova função (`finalizarSessao`)

```ts
export async function finalizarSessao(
  perfilId: string,
  sessaoId: string,
): Promise<SessaoTreino>
```

| Entrada | Resultado | FR relacionado |
|---|---|---|
| Sessão com `id === sessaoId` existe e `finalizadaEm === null` | Grava `finalizadaEm = new Date().toISOString()`, persiste, retorna a sessão atualizada | FR-004 |
| Sessão com `id === sessaoId` existe e `finalizadaEm` já preenchido | Retorna a sessão sem nenhuma escrita adicional (idempotente) | FR-006 |
| Nenhuma sessão com `id === sessaoId` existe no array | Lança erro (mesmo padrão de "sessão não encontrada" já usado por `marcarExercicioConcluido`) — não deveria ocorrer no fluxo normal da UI | — |

## Novo campo em `SessaoTreino` (`src/types/execucao-treino.ts`)

```ts
export interface SessaoTreino extends SessaoRegistro {
  id: string;  // NOVO
  treinoId: string;
  iniciadaEm: string;
  execucoes: ExecucaoExercicio[];
}
```

## Novo estado e novos handlers em `src/app/treino/[treinoId].tsx`

```ts
const [sessaoAtualId, setSessaoAtualId] = useState<string | null>(null);
```

| Evento | Efeito |
|---|---|
| Montagem da rota, `obterSessao` retorna uma sessão | `setSessaoAtualId(sessao.id)` |
| `registrarSerieConcluida` retorna com sucesso | `setSessaoAtualId(sessao.id)` (já era o mesmo `id`, exceto quando uma nova sessão acabou de ser criada — ver Invariante 1 do data-model.md) |
| `treino.exercicios.every((item) => estadosPorExercicio[item.id]?.concluido)` transiciona de `false` para `true` | `handleFinalizarTreino()` é chamado automaticamente (novo `useEffect`) — FR-001 |
| Usuário toca no botão "Finalizar treino" | `handleFinalizarTreino()` é chamado — FR-002 |

```ts
// Conceitual — chamado tanto pela transição automática quanto pelo botão manual.
async function handleFinalizarTreino() {
  if (!perfilAtivo || !sessaoAtualId) return;

  handleDescansoConcluido(); // RF05/RF06 — cancela cronômetro + notificação ativos (FR-011)
  await finalizarSessao(perfilAtivo.id, sessaoAtualId);

  setSessaoAtualId(null);
  setEstadosPorExercicio({});     // limpa progresso em memória — FR-010
  setExercicioSelecionadoId(null); // volta para a lista de exercícios
}
```

## Novo botão "Finalizar treino" (apenas na lista de exercícios — revisado após validação manual)

Renderizado no JSX de `[treinoId].tsx`, **dentro** do branch que exibe a lista de
exercícios (não mais fora do condicional) — visível apenas quando o usuário está
vendo a lista de exercícios do treino, não durante a execução de um exercício
específico (FR-002, research.md, Decisão 7 — revisada após validação manual em
dispositivo real). Chama `handleFinalizarTreino` ao ser tocado, independentemente de
quantos exercícios estejam pendentes. Usa `ThemedView type="warningBackground"` +
`ThemedText themeColor="warning"` (não mais `success`), condicionado a
`sessaoAtualId !== null`.

## Comportamento observável (novo, em relação ao RF04/RF05/RF06)

| Entrada | Estado resultante | FR relacionado |
|---|---|---|
| Usuário conclui o último exercício pendente de um treino | Sessão automaticamente finalizada (`finalizadaEm` preenchido); cronômetro/notificação cancelados se ativos; UI volta ao estado "sem sessão em andamento" | FR-001, FR-011 |
| Usuário toca em "Finalizar treino" com exercícios pendentes | Sessão finalizada imediatamente, contendo apenas as séries já registradas; nenhum registro criado para exercícios nunca iniciados | FR-002, FR-003 |
| Usuário toca em "Finalizar treino" duas vezes seguidas (ou finalização automática e manual coincidem) | Apenas uma finalização tem efeito; a segunda chamada a `finalizarSessao` é idempotente | FR-006 |
| Usuário reabre o mesmo treino após uma sessão já finalizada | `obterSessao` retorna `null` (nenhuma sessão em andamento); `estadosPorExercicio` começa vazio; `sessaoAtualId` começa `null`; a próxima série registrada cria uma sessão nova e distinta | FR-008, FR-010 |
| Troca de perfil ativo (RF10) após a única sessão do perfil ser finalizada | `existeSessaoEmAndamento` (inalterado) volta a retornar `false`; troca deixa de ser bloqueada | FR-005 |

## Nova função de contagem (`contarSessoesFinalizadas`) — User Story 4, demanda de UX pós-validação

```ts
export async function contarSessoesFinalizadas(
  perfilId: string,
  treinoId: string,
): Promise<number>
// Retorna sessoes.filter((s) => s.treinoId === treinoId && s.finalizadaEm !== null).length
```

Consumida por `src/app/(tabs)/index.tsx` (RF02), que carrega a contagem de todos os
treinos do perfil ativo (em paralelo) sempre que a lista é recarregada — na
montagem inicial e a cada vez que a tela ganha foco (`useFocusEffect`, exportado
por `expo-router`) — e repassa o valor para `TreinoListItem` via a nova prop
`qtdSessoesFinalizadas?: number` (padrão `0`; o indicativo circular só é
renderizado quando o valor é maior que zero).

## Fora de escopo desta feature (reforçando o já documentado na spec)

- Exibição de sessões finalizadas em uma tela de histórico: RF08.
- Qualquer tela de confirmação dedicada para "Finalizar treino": decisão de UX em
  aberto, não obrigatória por esta spec (ver Assumptions do spec.md).
- Limite de quantas sessões finalizadas um treino pode acumular: sem limite, por
  design (Assumptions do spec.md).
