# Phase 0 Research: Progresso do Ciclo de Treinos (Múltiplos Treinos)

**Feature**: `018-progresso-ciclo` | **Date**: 2026-09-23

Sem `[NEEDS CLARIFICATION]` pendente — os 3 pontos em aberto da spec já foram
resolvidos com o usuário (ver `spec.md`, Assumptions). Esta fase cobre decisões
técnicas de implementação, incluindo pontos que a spec deixou implícitos por operar
em nível de produto, não de dados/código.

## Decisão 1: identificar o "lote" sem alterar o tipo `Treino`

**Decision**: `CicloTreino` guarda a lista de `treinoIds` do lote diretamente (novo
tipo, novo storage) — nenhum campo novo é adicionado ao tipo `Treino` já existente
(ex.: nenhum `loteId`).

**Rationale**: hoje nada liga treinos importados juntos de um mesmo array (RF11,
spec 012) — cada `Treino` persistido é independente, sem referência ao lote de
origem. Adicionar um campo ao `Treino` para isso exigiria migração de dados já
persistidos (treinos importados antes desta feature); manter a associação só do lado
do `CicloTreino` (que é uma entidade nova, sem dados legados) evita esse problema
inteiramente (Princípio II).

**Alternatives considered**: adicionar `loteId?: string` a `ExercicioPlanejado`/
`Treino` — rejeitado por exigir lidar com o caso de treinos já existentes sem esse
campo (mais um "opcional, default X" a documentar), quando a alternativa não exige
nada disso.

## Decisão 2: `CicloTreino` — schema e chave de armazenamento

**Decision**:

```ts
export type CicloTreino = {
  id: string;
  perfilId: string;
  treinoIds: string[];                    // treinos do lote, na ordem do arquivo importado
  cotaPorTreinoId: Record<string, number>; // expectativa individual (FR-003), soma = 40
  criadoEm: string;                        // ISO 8601 — momento da importação que criou o ciclo
};
```

Persistido sob a chave `ciclos:<perfilId>`, como **array** `CicloTreino[]` —
acrescentado (nunca sobrescrito/removido) a cada novo ciclo criado. O "ciclo atual"
de um perfil é sempre o **último elemento** do array (o mais recentemente criado).

**Rationale**: a spec (Key Entities) diz explicitamente que um perfil "pode ter
ciclos concluídos anteriores, que deixam de ser o ciclo atual assim que um novo é
criado" — isso só é possível se ciclos antigos não forem apagados. Guardar como
array append-only é a forma mais simples de satisfazer essa frase sem precisar de
nenhuma tela ou consulta de histórico (nenhum FR/SC exige uma tela de histórico de
ciclos) — o array existe só para não destruir dado sem necessidade; nenhuma feature
desta spec lê outra coisa além do último elemento.

**Alternatives considered**:
- Guardar só 1 registro (`ciclo:<perfilId>`, singular, sobrescrito a cada novo ciclo)
  — mais simples, mas destruiria o registro do ciclo anterior assim que um novo
  ciclo fosse criado, contradizendo a frase da spec sobre "ciclos concluídos
  anteriores" persistirem; rejeitado por essa razão, mesmo sendo levemente mais
  simples.
- Persistir um `status` (`'em_andamento' | 'concluido'`) no próprio `CicloTreino` —
  rejeitado: status é 100% derivável comparando o total de sessões finalizadas
  (calculado a partir de `sessoes:<perfilId>`, já existente) com 40; persistir um
  status exigiria mantê-lo sincronizado toda vez que uma sessão for finalizada, uma
  fonte extra de inconsistência que o cálculo derivado evita (mesmo raciocínio já
  aplicado por `contarSessoesFinalizadas`, RF11).

## Decisão 3: progresso é sempre derivado, nunca persistido

**Decision**: nenhum contador de sessões (nem total do ciclo, nem por treino) é
persistido em `CicloTreino`. Duas funções de leitura, em `ciclo-treino-storage.ts`:

- `obterCicloAtual(perfilId): Promise<CicloTreino | null>` — último elemento de
  `ciclos:<perfilId>`, ou `null`.
- `calcularProgressoCiclo(perfilId, ciclo): Promise<{ totalFinalizado: number;
  porTreino: Record<string, number> }>` — soma, para cada `treinoId` do ciclo, o
  resultado de `contarSessoesFinalizadas(perfilId, treinoId)` (já existente em
  `sessao-treino-storage.ts`, RF11); `totalFinalizado` é a soma de todos.

**Rationale**: mesmo raciocínio da Decisão 2 — `contarSessoesFinalizadas` já existe e
já é a fonte de verdade para "quantas sessões finalizadas tem esse treino"; somá-la
por treino do lote é suficiente, sem duplicar esse dado em outro lugar que poderia
dessincronizar (ex.: se uma sessão finalizada fosse editada/removida por outro fluxo
no futuro, um contador persistido no ciclo ficaria desatualizado; um valor derivado
nunca fica).

**Alternatives considered**: incrementar um contador no `CicloTreino` toda vez que
`finalizarSessao` for chamado — rejeitado: acoplaria `sessao-treino-storage.ts` a
`ciclo-treino-storage.ts` (uma função de finalizar sessão passaria a precisar saber
se aquele treino pertence a algum ciclo), contrariando a separação de
responsabilidades já estabelecida entre os dois serviços.

## Decisão 4: distribuição da cota entre os N treinos (FR-003)

**Decision**:

```ts
function calcularCotaPorTreino(treinoIds: string[]): Record<string, number> {
  const base = Math.floor(40 / treinoIds.length);
  const resto = 40 % treinoIds.length;
  const cota: Record<string, number> = {};
  treinoIds.forEach((id, indice) => {
    cota[id] = base + (indice < resto ? 1 : 0);
  });
  return cota;
}
```

Os primeiros `resto` treinos (na ordem em que aparecem no arquivo importado) recebem
1 sessão a mais que os demais.

**Rationale**: reproduz exatamente os exemplos da spec (5 treinos → 8 cada; 3 treinos
→ 14/13/13) com o algoritmo mais simples possível (divisão inteira + resto) — sem
nenhuma regra adicional de "justiça" além de distribuir o resto pelos primeiros da
lista, já que a spec não especifica nenhum critério de prioridade entre os treinos do
lote além de "o mais equilibrado possível" (que este algoritmo já satisfaz: nenhum
treino recebe mais de 1 a mais que outro).

**Alternatives considered**: distribuir o resto aleatoriamente ou pelo treino com
"maior número de exercícios" — rejeitado por adicionar critério não pedido, sem
nenhum ganho sobre a ordem já existente no arquivo (Princípio II).

## Decisão 5: quando um lote de múltiplos treinos conta como "múltiplo" (FR-001/FR-004)

**Decision**: um ciclo só é criado quando o número de treinos **validados com
sucesso** (não o tamanho bruto do array do arquivo) for **2 ou mais**. Um array com
exatamente 1 treino válido (mesmo vindo do caminho de código de múltiplos treinos,
`processarConteudoArray`) não cria ciclo — mesmo tratamento de "treino único" do
FR-004, e consistente com a nota já registrada no roadmap pós-MVP ("não vale para um
treino único importado sozinho").

**Rationale**: a spec já resolvida (RF11/spec 012) trata um array como "múltiplos
treinos" só pela forma do JSON (array vs. objeto único), não pela quantidade real de
treinos válidos resultantes — um array de 2 itens onde 1 é inválido resultaria em 1
treino importado de fato. Um ciclo distribuído entre 1 treino não faz sentido
conceitualmente (não há "distribuição" com N=1); esta feature usa a contagem pós-
validação, não a forma bruta do arquivo, para decidir se cria o ciclo.

**Alternatives considered**: usar o tamanho bruto do array (`bruto.length >= 2`)
para decidir se cria ciclo, independente de quantos treinos validaram — rejeitado:
poderia criar um "ciclo" com um único treino de fato importado (todos os outros
inválidos), distribuindo 40 sessões para 1 treino só, o que é exatamente o caso que
FR-004 pede para excluir.

## Decisão 6: onde e quando bloquear a importação (FR-007)

**Decision**: dentro de `processarConteudoArray` (`treino-storage.ts`), como
primeiro passo — antes de validar qualquer treino/exercício do array — quando
`bruto.length >= 2`: chamar `obterCicloAtual(perfilId)` e, se existir e seu
`totalFinalizado` derivado (Decisão 3) for `< 40`, retornar imediatamente
`{ treinos: [], treinosIgnorados: [], erro: '<mensagem>' }`, sem processar o
restante do arquivo. Reaproveita o campo `erro` já existente em
`ResultadoImportacaoMultipla` — mesmo padrão já usado para "o arquivo não contém
nenhum treino" e outros erros de nível de arquivo.

**Rationale**: FR-007 diz que a **importação** é bloqueada, não só a criação do
ciclo — ou seja, nenhum treino do arquivo deve ser persistido enquanto o bloqueio se
aplica. Checar antes de validar evita trabalho desnecessário (falha rápido) e evita
qualquer efeito colateral parcial (nenhum treino criado, mesmo os que seriam
válidos). Usar `bruto.length >= 2` (não a contagem pós-validação da Decisão 5) como
gatilho do bloqueio é intencional: o bloqueio é sobre *tentar importar um novo lote*,
o que já é verdade a partir da forma do arquivo, antes mesmo de saber quantos itens
vão validar.

**Alternatives considered**: validar o arquivo primeiro e só bloquear depois de
saber que 2+ treinos validariam — rejeitado: um usuário tentando importar um lote
inválido enquanto há um ciclo ativo ainda deveria ver a mensagem de bloqueio (mais
informativa do que un erro de validação de arquivo, já que a causa raiz é o ciclo
ativo), e falhar rápido evita processamento redundante.

## Decisão 7: onde exibir o indicador por treino e o aviso (FR-006/FR-008)

**Decision**: ambos em `src/app/(tabs)/index.tsx` ("Meus Treinos"), tela já
responsável por listar treinos com contadores (RF11). O `ProgressRing` por treino
aparece ao lado do contador de sessões já existente, só para treinos cujo `id` está
em `cicloAtual.treinoIds`; o aviso de FR-008 aparece como um banner no topo da lista,
visível quando `totalFinalizado >= 40` para o ciclo atual.

**Rationale**: é a única tela hoje que já lista todos os treinos com metadados de
progresso (contador de sessões, RF11) — colocar o indicador ali evita introduzir uma
tela nova só para isso, e mantém a informação de progresso concentrada em um único
lugar (mesma tela onde o usuário decide o que treinar).

**Alternatives considered**: mostrar o indicador dentro da tela do treino específico
(`[treinoId].tsx`) em vez da lista — rejeitado: FR-006 fala de progresso "por
treino" mas dentro do contexto de comparar vários treinos do mesmo lote entre si; a
lista é onde essa comparação visual faz sentido, não a tela de execução de um treino
isolado.

## Resumo das entidades técnicas afetadas

- `src/types/ciclo-treino.ts` (novo): tipo `CicloTreino`.
- `src/services/ciclo-treino-storage.ts` (novo): `obterCicloAtual`,
  `calcularProgressoCiclo`, `criarCiclo` (usa `calcularCotaPorTreino`, Decisão 4).
- `src/services/treino-storage.ts`: `processarConteudoArray` ganha a checagem de
  bloqueio (Decisão 6) e, após persistir os treinos com sucesso, chama `criarCiclo`
  quando `treinos.length >= 2` (Decisão 5).
- `src/app/(tabs)/index.tsx`: carrega o ciclo atual e seu progresso; renderiza
  `ProgressRing` por treino do lote e o banner de aviso (Decisão 7).
