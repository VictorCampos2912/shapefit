# Research: Salvar Sessão de Treino (Completa ou Finalizada Manualmente)

O usuário já especificou explicitamente a abordagem técnica (reaproveitar
`sessao-treino-storage.ts`, corrigir a busca para `finalizadaEm === null`, adicionar
`id` via `Crypto.randomUUID()`, nova função `finalizarSessao`, conectar cancelamento
de cronômetro/notificação ao mesmo fluxo, botão acessível nos dois estados da rota).
As decisões abaixo documentam como essa abordagem se encaixa no que o RF04/RF05/RF06
já estabeleceram, e resolvem os detalhes que a instrução do usuário não cobriu
explicitamente.

## Decisão 1: Filtro por `finalizadaEm === null` em todas as buscas de "a sessão de um treino"

**Decision**: As quatro funções de `sessao-treino-storage.ts` que hoje localizam uma
sessão por `sessoes.find((item) => item.treinoId === treinoId)`
(`obterSessao`, `registrarSerieConcluida`, `marcarExercicioConcluido`,
`atualizarSerieRealizada`) passam a localizar por
`sessoes.find((item) => item.treinoId === treinoId && item.finalizadaEm === null)`.
Se `registrarSerieConcluida` não encontrar nenhuma sessão em andamento para o
`treinoId` (seja porque nunca houve uma, seja porque a única existente já foi
finalizada), ela cria uma nova — mesmo comportamento de "criar se não existir" já
implementado pelo RF04, apenas com a condição de busca corrigida.

**Rationale**: Pedido explícito do usuário, e é a mudança que resolve diretamente
FR-007/FR-008 da spec: sem esse filtro, reabrir um treino cuja única sessão anterior
já foi finalizada faria `registrarSerieConcluida` encontrar essa sessão encerrada
(por `treinoId` sozinho) e voltar a escrever nela — reabrindo silenciosamente uma
sessão que deveria permanecer congelada no histórico, e nunca permitindo uma segunda
execução distinta do mesmo treino (User Story 3 da spec ficaria impossível de
satisfazer).

**Alternatives considered**:
- Manter a busca por `treinoId` sozinho, mas adicionar uma verificação separada que
  impede escrita em sessões já finalizadas (lançando erro): rejeitado — mudaria o
  comportamento esperado de "criar uma nova sessão automaticamente" (FR-008) para
  "falhar ao tentar continuar um treino já finalizado", o que não é o que a spec
  pede; o usuário deve conseguir simplesmente começar de novo, sem erro.
- Marcar sessões finalizadas com uma flag adicional (`arquivada`, por exemplo) em vez
  de usar `finalizadaEm` para essa distinção: rejeitado — `finalizadaEm` já é
  exatamente essa informação (nulo = em andamento, preenchido = encerrada); criar um
  segundo campo redundante violaria o Princípio II (simplicidade).

## Decisão 2: Campo `id` da sessão, gerado via `Crypto.randomUUID()` na criação

**Decision**: Todo objeto `SessaoTreino` criado (nos pontos onde hoje `sessao = {
perfilId, treinoId, iniciadaEm, finalizadaEm: null, execucoes: [] }` é construído)
passa a incluir `id: Crypto.randomUUID()`, gerado uma única vez no momento da
criação — nunca recalculado ou derivado de `treinoId`/`iniciadaEm`. `SessaoTreino`
(em `src/types/execucao-treino.ts`) ganha o campo `id: string` em sua definição.

**Rationale**: Pedido explícito do usuário, e resolve FR-012 da spec. Antes desta
feature, `treinoId` era suficiente para identificar "a" sessão de um treino porque só
podia existir uma por vez (a busca não distinguia estado de finalização). Com a
Decisão 1, múltiplas sessões do mesmo `treinoId` passam a coexistir no mesmo array
(uma em andamento, no máximo, mais quantas já tiverem sido finalizadas ao longo do
tempo) — um identificador que dependa apenas de `treinoId` não consegue mais apontar
para uma execução específica. `Crypto.randomUUID()` já é o padrão estabelecido no
projeto para esse propósito (`Treino.id`, `Perfil.id`), então reutilizá-lo aqui mantém
consistência sem introduzir uma nova convenção de identificador.

**Alternatives considered**:
- Usar `iniciadaEm` (o timestamp ISO já existente) como identificador: rejeitado —
  tecnicamente quase sempre único, mas não é uma garantia (duas sessões poderiam, em
  tese, ser criadas no mesmo milissegundo em cenários futuros não prováveis hoje, mas
  não vale o risco); além disso, um identificador dedicado é mais claro semanticamente
  do que reaproveitar um campo que já tem outro propósito (registrar quando a sessão
  começou).
- Gerar o `id` como uma concatenação de `treinoId` + `iniciadaEm`: rejeitado por
  complexidade desnecessária (Princípio II) — um UUID gerado diretamente já é mais
  simples e é o padrão já em uso no projeto.

## Decisão 3: Nova função `finalizarSessao(perfilId, sessaoId)`, localizando por `id`

**Decision**: `sessao-treino-storage.ts` ganha uma nova função:

```ts
export async function finalizarSessao(perfilId: string, sessaoId: string): Promise<SessaoTreino>
```

Ela localiza a sessão por `sessoes.find((item) => item.id === sessaoId)` — não por
`treinoId`, que voltaria a ser ambíguo assim que múltiplas sessões do mesmo treino
existirem (Decisão 1). Se a sessão já tiver `finalizadaEm` preenchido, a função
retorna a sessão sem nenhuma escrita adicional (idempotente, FR-006). Caso contrário,
grava `finalizadaEm = new Date().toISOString()` (mesmo formato ISO 8601 já usado por
`iniciadaEm`) e persiste o array de volta em `sessoes:${perfilId}`.

**Rationale**: Pedido explícito do usuário. Localizar por `id` (não por `treinoId`)
garante que finalizar afeta exatamente a sessão que a UI tem em mãos, mesmo que,
teoricamente, existisse mais de uma sessão do mesmo treino no array (o que não deveria
acontecer em andamento simultaneamente, mas pode acontecer entre uma finalizada antiga
e uma nova em andamento). A idempotência atende diretamente ao edge case da spec sobre
duplo toque no botão "Finalizar treino" e à corrida entre finalização automática e
manual no mesmo instante.

**Alternatives considered**:
- Localizar por `treinoId` e assumir que só há uma sessão em andamento por vez (a
  que a UI está exibindo): rejeitado — mistura a responsabilidade de "qual sessão
  finalizar" com uma suposição implícita sobre unicidade que a própria Decisão 1 já
  invalidou; localizar por `id` é mais direto e explícito sobre qual sessão está
  sendo afetada.
- Lançar erro ao tentar finalizar uma sessão já finalizada, em vez de retornar
  silenciosamente: rejeitado — contraria FR-006 da spec (idempotência explícita, sem
  erro visível ao usuário).

## Decisão 4: Rota mantém o `id` da sessão em andamento como estado, não recalculado a cada chamada

**Decision**: A rota `[treinoId].tsx` passa a guardar `sessaoAtualId: string | null`
como estado (irmão de `estadosPorExercicio`), atualizado sempre que
`registrarSerieConcluida` retorna uma sessão (`setSessaoAtualId(sessao.id)`) — tanto
ao carregar a sessão existente na montagem da rota (via `obterSessao`, que também
passa a considerar apenas `finalizadaEm === null`, Decisão 1) quanto a cada nova série
registrada. `handleFinalizarTreino` usa esse `sessaoAtualId` para chamar
`finalizarSessao(perfilAtivo.id, sessaoAtualId)`.

**Rationale**: Evita que a rota precise re-buscar "qual é a sessão atual" no momento
de finalizar (o que exigiria uma chamada extra a `obterSessao` só para descobrir o
`id`, ou reintroduzir a ambiguidade de buscar por `treinoId`). Manter o `id` como
estado, atualizado no mesmo lugar onde a sessão já é lida/escrita, é a opção mais
simples e consistente com o padrão já usado por `estadosPorExercicio` (estado
derivado da sessão, vivendo na rota).

**Alternatives considered**:
- Não guardar `sessaoAtualId` como estado; em vez disso, chamar `obterSessao`
  novamente dentro de `handleFinalizarTreino` para descobrir o `id` no momento de
  finalizar: rejeitado — chamada assíncrona redundante para uma informação que a
  rota já obteve minutos antes; adiciona latência perceptível ao toque em "Finalizar
  treino" sem necessidade.
- Passar o `treinoId` para `finalizarSessao` em vez do `sessaoId`, deixando a função
  decidir "qual sessão em andamento finalizar" internamente: rejeitado — reintroduz
  a mesma ambiguidade que a Decisão 3 já resolveu ao expor `finalizarSessao` por `id`;
  a rota já sabe exatamente qual sessão está exibindo, então repassar essa
  informação explicitamente é mais direto.

## Decisão 5: Finalização automática reaproveita a checagem `every(concluido)` já existente na rota

**Decision**: A rota já calcula, a cada renderização,
`treino.exercicios.every((item) => estadosPorExercicio[item.id]?.concluido)` (hoje
usado apenas para exibir a mensagem "🎉 Parabéns pelo treino de hoje!"). Um novo
`useEffect(() => { ... }, [estadosPorExercicio, sessaoAtualId, treino.exercicios])`
recalcula essa mesma condição dentro do efeito e, se ela for verdadeira **e**
`sessaoAtualId !== null`, chama `handleFinalizarTreino()` automaticamente — sem
exigir nenhuma ação do usuário. Nenhum `ref` ou estado auxiliar dedicado a rastrear
"já disparou" é necessário: como `handleFinalizarTreino` (Decisão 4) zera
`sessaoAtualId` para `null` ao concluir a finalização, a própria condição
`sessaoAtualId !== null` deixa de ser satisfeita nas renderizações seguintes,
impedindo o re-disparo automático de forma natural.

**Rationale**: Reaproveita uma condição que já existe e já está correta (mesma lógica
que decide mostrar a mensagem de parabéns), em vez de duplicar essa checagem em outro
lugar. A guarda `sessaoAtualId !== null` é suficiente para evitar chamadas repetidas
de `finalizarSessao` — mais simples do que introduzir um `useRef`/estado adicional só
para rastrear a transição de `false` para `true`, já que o próprio estado que a
finalização já zera (`sessaoAtualId`) serve como esse sinal.

**Alternatives considered**:
- Rastrear a transição de `false` para `true` com um `useRef`/estado auxiliar
  dedicado (ex.: `jaFinalizouAutomaticamente`): rejeitado — funcionalmente
  equivalente, mas introduz um estado extra só para replicar uma informação que
  `sessaoAtualId` já carrega (não-nulo enquanto a sessão está em andamento, nulo
  assim que finalizada); viola o Princípio II (simplicidade) manter dois sinais
  para a mesma coisa.
- Chamar `handleFinalizarTreino` diretamente dentro de `handleConcluirExercicio`,
  verificando ali mesmo se era o último exercício pendente: tecnicamente equivalente,
  mas exigiria duplicar a lógica de "todos concluídos" (que já existe como uma
  expressão separada, usada para a UI de parabéns) dentro do handler; usar um efeito
  observando a mesma condição existente evita essa duplicação.

## Decisão 6: Cancelamento de cronômetro/notificação reaproveita `handleDescansoConcluido` já existente

**Decision**: `handleFinalizarTreino` chama `handleDescansoConcluido()` (já existente,
RF05/RF06 — zera `descansoAtivo` e cancela `notificacaoAgendada` via
`cancelarNotificacaoDescanso`) antes de chamar `finalizarSessao`. Se não houver
nenhum cronômetro ativo no momento (`descansoAtivo === null`), `handleDescansoConcluido`
já lida com esse caso sem efeito adicional (nenhuma mudança de comportamento
necessária nessa função).

**Rationale**: Pedido explícito do usuário (FR-011 da spec). Reaproveitar a função já
existente evita duplicar a lógica de "cancelar cronômetro + notificação agendada",
que já está correta e testada pelo RF06 — nenhuma modificação em
`handleDescansoConcluido` é necessária, apenas uma nova chamada a ela a partir do
novo `handleFinalizarTreino`.

**Alternatives considered**:
- Cancelar `descansoAtivo`/`notificacaoAgendada` diretamente dentro de
  `handleFinalizarTreino`, duplicando a lógica já presente em
  `handleDescansoConcluido`: rejeitado por duplicação desnecessária (Princípio II) —
  a função já existente faz exatamente o que é necessário.

## Decisão 7: Botão "Finalizar treino" — apenas na lista de exercícios, cor `warning` (revisada após validação manual)

**Decision original (pré-validação)**: O botão "Finalizar treino" seria renderizado
no JSX da rota `[treinoId].tsx`, fora do bloco condicional `{exercicioSelecionado ?
(...) : (...)}`, visível tanto na lista de exercícios quanto na tela de execução de
um exercício específico, com a mesma cor de sucesso (verde) usada por "Concluir
exercício".

**Achado durante a validação manual em dispositivo real**: com o botão visível
também dentro da tela de execução de um exercício específico, o posicionamento não
fez sentido na prática — dentro do fluxo de registrar carga/reps de uma série, o
botão de finalizar o treino inteiro parecia um atalho de "emergência" fora de
contexto, sem relação com a ação que o usuário está realizando naquele momento. Além
disso, a cor verde (igual à de "Concluir exercício", uma ação de sucesso) não
comunicava corretamente que finalizar pode estar acontecendo com exercícios
pendentes — uma ação diferente de "tudo concluído com sucesso".

**Decision (revisada)**: O botão passa a ser renderizado **dentro** do branch da
lista de exercícios (`{... : (<>lista de exercícios</>)}`), não mais fora do
condicional — deixando de aparecer na tela de execução de um exercício específico. A
cor muda de `success`/`successBackground` para `warning`/`warningBackground` (tokens
já existentes em `src/constants/theme.ts`), sinalizando uma ação de atenção/decisão
do usuário, distinta de uma conclusão bem-sucedida.

**Rationale**: A tela de lista de exercícios já é alcançável a qualquer momento
durante a execução do treino (botão "← Voltar para exercícios" sempre visível
dentro da tela de um exercício específico), então FR-002 ("acessível a qualquer
momento durante a execução") continua satisfeito sem precisar duplicar o controle
em dois lugares — só exige um toque a mais (voltar para a lista) quando o usuário
está dentro de um exercício específico, o que é aceitável dado que essa ação
(encerrar o treino inteiro) não é algo feito no meio de registrar uma série
específica.

**Alternatives considered** (da decisão original, ainda válidas onde aplicável):
- Renderizar o botão duas vezes, uma em cada branch do condicional: rejeitado —
  mesmo motivo de antes (duplicação desnecessária), agora ainda mais claro porque o
  botão nem deveria aparecer no branch de execução de exercício específico.
- Criar um componente `BotaoFinalizarTreino` dedicado: mantido como não necessário
  — o botão continua sendo um único `Pressable`/`ThemedView`/`ThemedText` sem lógica
  própria, agora vivendo dentro do mesmo bloco JSX que já renderiza a lista.
- Manter a cor `success`: rejeitado após a validação manual — reservar `success`
  para ações que representam "tudo certo, sem pendências" (como "Concluir
  exercício", chamado apenas quando todas as séries já foram feitas) evita
  confundir o usuário sobre o que a cor está comunicando.

## Decisão 10 (demanda de UX adicionada durante a validação manual): Contador de sessões finalizadas na lista de treinos

**Achado durante a validação manual**: ao testar as User Stories 1-3, o usuário
notou que a tela de lista de treinos (RF02, `src/app/(tabs)/index.tsx`) não
diferenciava visualmente um treino nunca executado de um já executado várias
vezes — informação que só passou a existir de forma estruturada a partir desta
própria feature (múltiplas sessões finalizadas distintas por treino, FR-008/FR-012).
Não fazia parte do escopo original do PRD nem da spec inicial deste requisito (ver
spec.md, User Story 4 e Assumptions, onde isso está registrado explicitamente como
demanda de UX pós-implementação).

**Decision**: Nova função `contarSessoesFinalizadas(perfilId, treinoId): Promise<number>`
em `sessao-treino-storage.ts`, contando `sessoes.filter((s) => s.treinoId ===
treinoId && s.finalizadaEm !== null).length`. A tela de lista de treinos
(`(tabs)/index.tsx`) carrega essa contagem para todos os treinos do perfil ativo
(em paralelo, via `Promise.all`) sempre que a lista de treinos é recarregada —
tanto na montagem inicial quanto ao ganhar foco novamente (`useFocusEffect`, já
exportado por `expo-router`, sem nova dependência), garantindo que o contador
reflita uma finalização que acabou de ocorrer ao voltar da tela de execução.
`TreinoListItem` ganha uma prop opcional `qtdSessoesFinalizadas` (padrão `0`) e só
renderiza o indicativo quando o valor é maior que zero.

**Ajuste visual após validação manual (duas rodadas)**: a primeira implementação
exibia o número dentro de um badge circular colorido (`ThemedView
type="backgroundSelected"`), logo à direita do nome do treino. Após feedback do
usuário, dois ajustes foram aplicados em sequência: (1ª rodada) o badge/fundo
colorido foi removido, passando a exibir apenas o número em
`ThemedText type="small" themeColor="textSecondary"`, na mesma linha do nome; (2ª
rodada) o número foi movido para a extremidade direita do card — usando
`justifyContent: 'space-between'` no container da linha e `flex: 1` no texto do
título — em vez de ficar logo depois do nome, para que treinos com nomes longos
não empurrem o contador nem tenham seu próprio espaço reduzido por ele.

**Rationale**: Reaproveita o mesmo padrão de leitura já usado por
`existeSessaoEmAndamento` (RF10) — uma função de contagem simples sobre o array já
persistido em `sessoes:${perfilId}`, sem introduzir nenhuma nova chave de storage
nem dependência nova. `useFocusEffect` é a forma idiomática do Expo Router de
recarregar dados de uma tela sempre que o usuário volta para ela após navegar para
outra rota (como a execução do treino) — sem isso, o contador ficaria desatualizado
até o app ser reaberto do zero, contrariando o Acceptance Scenario 3 da User Story
4 ("sem precisar fechar e reabrir o app").

**Alternatives considered**:
- Calcular a contagem dentro de `listarTreinos` (RF01/RF02, `treino-storage.ts`),
  devolvendo-a já embutida no objeto `Treino`: rejeitado — misturaria a
  responsabilidade de "listar treinos importados" (RF01) com a de "contar sessões"
  (RF04/RF07), que vivem em módulos de storage diferentes por design; manter a
  contagem como uma consulta separada, feita pela tela, preserva a separação já
  estabelecida entre `treino-storage.ts` e `sessao-treino-storage.ts`.
- Não recarregar ao ganhar foco, confiando apenas no carregamento inicial da tela:
  rejeitado — o cenário mais comum (finalizar um treino e voltar para a lista) é
  exatamente quando o contador precisa estar atualizado; sem `useFocusEffect`, o
  usuário veria um número desatualizado até fechar e reabrir o app, contrariando
  diretamente o Acceptance Scenario 3 da User Story 4.
- Exibir a contagem como texto ("3 vezes") em vez de apenas o número: avaliado,
  mas o número sozinho, ao final do nome do treino, já comunica a informação sem
  precisar de texto adicional, mantendo a linha compacta.
- Manter o badge circular colorido (`backgroundSelected`) da implementação
  original: rejeitado após feedback do usuário na validação manual — o destaque
  visual (fundo colorido) não era necessário; o número na cor secundária padrão já
  é suficiente para comunicar a informação sem chamar atenção indevida.
