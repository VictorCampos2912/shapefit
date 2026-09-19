# Data Model: Salvar Sessão de Treino (Completa ou Finalizada Manualmente)

## Entidades existentes (reaproveitadas, com alteração de campo)

### `SessaoRegistro` (sem alteração)

```ts
// src/types/perfil.ts — inalterado
export type SessaoRegistro = {
  perfilId: string;
  finalizadaEm: string | null;
};
```

Continua sendo o formato mínimo lido por `existeSessaoEmAndamento` (RF10). Esta
feature não altera este tipo — a única mudança de campo ocorre em `SessaoTreino`
(abaixo), que já `extends SessaoRegistro`.

### `SessaoTreino` (campo novo: `id`)

```ts
// src/types/execucao-treino.ts
import type { SessaoRegistro } from '@/types/perfil';

export interface SessaoTreino extends SessaoRegistro {
  id: string;           // NOVO — identificador próprio da sessão
  treinoId: string;
  iniciadaEm: string;
  execucoes: ExecucaoExercicio[];
  // finalizadaEm: string | null — herdado de SessaoRegistro; antes desta feature,
  // sempre null; agora preenchido por finalizarSessao()
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | **novo** — identificador único da sessão, gerado via `Crypto.randomUUID()` no momento da criação (primeira série concluída daquela execução), nunca recalculado ou derivado de outros campos |
| `perfilId` | `string` | herdado de `SessaoRegistro` — dono da sessão (inalterado) |
| `finalizadaEm` | `string \| null` | herdado de `SessaoRegistro`; **antes** desta feature sempre `null`; **agora** preenchido com um timestamp ISO 8601 por `finalizarSessao` |
| `treinoId` | `string` | identifica o treino ao qual esta sessão pertence (inalterado) — deixa de ser suficiente, sozinho, para localizar "a" sessão de um treino (ver Invariante 1 abaixo) |
| `iniciadaEm` | `string` (ISO 8601) | data/hora em que a sessão foi criada (inalterado) |
| `execucoes` | `ExecucaoExercicio[]` | inalterado |

### `ExecucaoExercicio` / `SerieRealizada` (sem alteração)

Ambos permanecem exatamente como definidos pelo RF04 — nenhum campo novo, nenhuma
mudança de comportamento de validação.

## Invariantes (novas, introduzidas por esta feature)

1. **No máximo uma sessão em andamento por `(perfilId, treinoId)`**: para qualquer
   par `(perfilId, treinoId)`, no máximo um objeto em `sessoes:${perfilId}` pode ter
   `treinoId` igual a esse valor **e** `finalizadaEm === null` simultaneamente. Pode
   haver, adicionalmente, qualquer número de sessões já finalizadas para o mesmo
   `(perfilId, treinoId)`.
2. **`id` é único e imutável por sessão**: uma vez atribuído na criação, `id` nunca é
   alterado, mesmo quando a sessão é finalizada (apenas `finalizadaEm` muda nesse
   momento).
3. **Finalizar é uma transição de mão única**: uma vez que `finalizadaEm` é
   preenchido, nenhuma operação desta feature (nem de features anteriores) volta a
   gravar `null` nesse campo — reabrir "a mesma sessão" depois de finalizada não é
   uma operação suportada; a próxima série registrada para aquele `treinoId` cria uma
   sessão nova e distinta (Invariante 1 continua valendo, agora sobre a nova sessão).

## Fluxo de leitura/escrita (atualizado em relação ao RF04)

### `obterSessao(perfilId, treinoId)` (comportamento alterado)

Antes: retornava `sessoes.find((s) => s.treinoId === treinoId)` — a primeira
sessão daquele treino encontrada no array, independentemente de estar finalizada.

Agora: retorna `sessoes.find((s) => s.treinoId === treinoId && s.finalizadaEm ===
null)` — apenas a sessão em andamento daquele treino, se houver. Se a única sessão
existente daquele treino já estiver finalizada, retorna `null` (equivalente a "nunca
houve sessão para este treino", do ponto de vista da rota que a consome — a rota
inicia uma execução do zero, exatamente como se fosse a primeira vez).

### `registrarSerieConcluida(...)` (comportamento alterado)

Antes: localizava a sessão por `treinoId` sozinho; se não encontrasse, criava uma
nova (sem `id`).

Agora: localiza por `treinoId` **e** `finalizadaEm === null`; se não encontrar
(nunca houve sessão, ou a única existente já foi finalizada), cria uma nova sessão
com `id: Crypto.randomUUID()`, `iniciadaEm: new Date().toISOString()`,
`finalizadaEm: null`, `execucoes: []` — mesma lógica de criação de antes, apenas com
o `id` adicionado e a condição de busca corrigida.

### `marcarExercicioConcluido(...)` / `atualizarSerieRealizada(...)` (comportamento alterado)

Mesma mudança de busca (`treinoId` + `finalizadaEm === null`) — ambas continuam
lançando erro se nenhuma sessão em andamento for encontrada (comportamento herdado
do RF04: essas duas funções pressupõem que uma sessão em andamento já existe,
criada anteriormente por `registrarSerieConcluida`).

### `finalizarSessao(perfilId, sessaoId)` (nova função)

```ts
export async function finalizarSessao(perfilId: string, sessaoId: string): Promise<SessaoTreino>
```

1. Lê o array de sessões do perfil.
2. Localiza a sessão por `id === sessaoId` (não por `treinoId`).
3. Se `finalizadaEm` já estiver preenchido, retorna a sessão sem nenhuma escrita
   adicional (idempotente).
4. Caso contrário, grava `finalizadaEm = new Date().toISOString()`, persiste o array
   de volta em `sessoes:${perfilId}`, e retorna a sessão atualizada.
5. Lança erro apenas se nenhuma sessão com esse `id` existir no array (situação que
   não deveria ocorrer no fluxo normal da UI, que sempre passa um `id` obtido de uma
   leitura/escrita anterior — mesmo padrão de erro já usado por `marcarExercicioConcluido`
   para "sessão não encontrada").

## Estado de UI (rota `[treinoId].tsx`, novo em relação ao RF05/RF06)

| Estado | Tipo | Descrição |
|---|---|---|
| `sessaoAtualId` | `string \| null` | id da sessão em andamento sendo exibida/editada nesta rota; `null` enquanto nenhuma série foi registrada ainda nesta execução; atualizado a cada retorno de `obterSessao`/`registrarSerieConcluida` |

**Transições**:
- Ao montar a rota, se `obterSessao` (já filtrando por `finalizadaEm === null`,
  Decisão 1 do research.md) retornar uma sessão, `sessaoAtualId` é inicializado com
  `sessao.id`. Caso contrário, permanece `null` até a primeira série ser registrada.
- A cada `registrarSerieConcluida` bem-sucedido, `sessaoAtualId` é atualizado com
  `sessao.id` retornado (idempotente na prática — já era o mesmo `id`, exceto na
  primeira chamada de uma nova execução, quando uma sessão nova acaba de ser criada).
- Ao finalizar (`handleFinalizarTreino`), depois de `finalizarSessao` retornar com
  sucesso, `sessaoAtualId` volta a `null` — a rota passa a se comportar como se
  nenhuma sessão estivesse em andamento (consistente com FR-010: nenhum resquício da
  execução finalizada).
