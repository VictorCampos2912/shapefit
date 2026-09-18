# Research: Cronômetro de Descanso

Nenhum item do Technical Context ficou marcado como `NEEDS CLARIFICATION` — o
usuário já especificou explicitamente a abordagem técnica (timestamp absoluto,
estado na rota, `setInterval` só como tick). As decisões abaixo documentam como
essa abordagem se encaixa nos padrões já estabelecidos pelo RF04 e resolve os
detalhes que a instrução do usuário não cobriu explicitamente.

## Decisão 1: Cálculo do tempo restante por timestamp absoluto (`fimEm`), não por duração restante

**Decision**: O estado do cronômetro guarda um único timestamp absoluto de término
(`fimEm: number`, epoch ms), calculado como `Date.now() + duracaoMs` no momento em
que o descanso inicia ou é ajustado. O tempo restante exibido a qualquer momento é
sempre `Math.max(0, fimEm - Date.now())`, nunca um campo "segundos restantes"
decrementado por tick.

**Rationale**: Guardar `fimEm` (um ponto no tempo) em vez de "segundos restantes
quando o timer começou" elimina a necessidade de guardar dois valores
(`inicioEm` + `duracaoTotalMs`) e recalcular a subtração toda vez — um único campo
já é a resposta. Ajustar +/-15s vira uma operação trivial sobre esse mesmo campo:
`fimEm = fimEm + 15_000` ou `fimEm = fimEm - 15_000` (com o piso de zero aplicado
na hora de *exibir*, não na hora de gravar, para não perder o "quanto passou do
zero" caso um ajuste negativo aconteça exatamente perto do fim). Atende
diretamente ao requisito explícito do usuário e ao FR-006 da spec.

**Alternatives considered**:
- Guardar `inicioEm` + `duracaoRestanteMs` separadamente, recalculando
  `duracaoRestanteMs - (Date.now() - inicioEm)`: rejeitado — funcionalmente
  equivalente, mas exige dois campos e mais uma subtração a cada leitura; `fimEm`
  sozinho já carrega a mesma informação de forma mais simples (Princípio II).
- Decrementar um contador a cada tick de `setInterval` (`segundosRestantes - 1`):
  explicitamente rejeitado pelo usuário e pela spec (FR-006) — é exatamente o
  padrão que falha ao minimizar o app, pois o JS não continua executando com o
  app em segundo plano.

## Decisão 2: Onde vive o estado do cronômetro — rota, não componente

**Decision**: O estado `descansoAtivo: { exercicioId: string; fimEm: number } | null`
vive em `src/app/treino/[treinoId].tsx`, como um `useState` irmão de
`estadosPorExercicio` — não dentro de `ExercicioExecucao`. `ExercicioExecucao`
continua sendo um componente controlado: recebe o tempo restante já calculado (ou
nem recebe nada relacionado a descanso, se o cronômetro for renderizado fora dele,
ver Decisão 3) e apenas dispara `onIniciarDescanso` com os dados necessários
(`exercicioId`, `descansoSeg` do exercício).

**Rationale**: Exigência explícita do usuário, e coerente com o padrão já
estabelecido pelo RF04 para `estadosPorExercicio` (research.md do RF04, Decisão 2:
"mantém o padrão de componente controlado já estabelecido pelo RF03"). Colocar o
estado na rota é o que permite o cronômetro sobreviver à alternância entre a tela
de um exercício específico e a lista de exercícios **dentro da mesma rota**
`[treinoId]` — trocar `exercicioSelecionadoId` para `null` (voltar à lista) já
desmonta `ExercicioExecucao` hoje (RF04), mas não desmonta a rota em si; se o
estado estivesse dentro de `ExercicioExecucao`, ele se perderia nesse momento
mesmo com o app em primeiro plano e sem sair da tela de execução do treino.

**Correção de premissa (validada com o usuário em 2026-09-17)**: `[treinoId].tsx`
é uma rota de nível raiz (irmã de `(tabs)/`, não aninhada dentro do grupo de
tabs — ver `src/app/(tabs)/index.tsx:108`, que chama `router.push('/treino/[treinoId]')`
empilhando a rota **por cima** de todo o navegador de tabs). Isso significa que
não existe hoje uma "troca de aba enquanto `[treinoId]` está na tela" — as tabs
ficam cobertas pela rota empilhada, e a única forma de voltar a interagir com
elas é um "voltar" (pop), que desmonta `[treinoId]` por completo, junto com
qualquer estado nela contido, incluindo `descansoAtivo`. Portanto, manter o
estado na rota (em vez de em `ExercicioExecucao`) resolve a sobrevivência à
navegação **dentro** da própria rota (ex.: lista de exercícios ↔ exercício
selecionado), mas **não** implica sobrevivência a uma navegação para outra aba
do app (ex.: a futura tela de histórico do RF08, hoje inexistente) — esse caso
exigiria `[treinoId]` deixar de ser empilhada por cima das tabs (ex.: virar uma
rota aninhada dentro de `(tabs)/`, ou um estado global fora da própria rota),
o que é uma decisão de roteamento fora do escopo desta feature — e que **não**
é resolvida automaticamente pela simples existência do RF08: mesmo com o
histórico implementado, se ele viver dentro de `(tabs)/` (como as demais telas
principais do app hoje), chegar até ele a partir de `[treinoId]` ainda exigiria
um "voltar" que desmonta a rota, a menos que essa decisão de arquitetura de
navegação seja tomada explicitamente. Ver o quickstart.md, que separa esses dois
cenários e marca o de troca de aba como não testável até essa decisão de
arquitetura ser tomada (não apenas até o RF08 existir) — ver também a
Assumption correspondente em spec.md.

**Alternatives considered**:
- Estado local em `ExercicioExecucao` (`useState` dentro do componente):
  rejeitado — explicitamente descartado pelo usuário, e quebraria mesmo a
  navegação interna à própria rota (voltar à lista de exercícios já desmonta
  `ExercicioExecucao` no fluxo atual do RF04).
- Mover o estado do cronômetro para fora da rota (ex.: Context global no
  `_layout.tsx` raiz, ou dentro do próprio `(tabs)/_layout.tsx`) para também
  sobreviver a uma eventual navegação para outra aba: rejeitado nesta feature —
  não há hoje nenhuma aba para a qual navegar durante o descanso, e mudar a
  topologia de rotas ou introduzir um Context global é uma decisão de escopo
  maior do que o pedido nesta feature (Princípio II). Note que isso **não** é
  apenas uma questão de esperar o RF08 ser especificado: a decisão real
  pendente é de arquitetura de navegação (onde `[treinoId]` e um futuro
  histórico vivem na árvore de rotas), que pode não ser resolvida como
  subproduto do RF08 e precisa ser revisitada explicitamente (ver Assumption
  correspondente em spec.md).
- Context/Provider dedicado ao cronômetro, no nível do `_layout.tsx` raiz:
  rejeitado por complexidade desnecessária (Princípio II) — o cronômetro só é
  relevante dentro da rota de execução de um treino específico; um Context global
  adicionaria uma camada de indireção sem necessidade, já que a própria rota já é
  o "container" natural, exatamente como já decidido para `estadosPorExercicio`.

## Decisão 3: Tick de re-render via `setInterval`, e recálculo ao voltar de background via `AppState`

**Decision**: Enquanto `descansoAtivo` não é `null`, um `useEffect` na rota registra
um `setInterval` de 1000ms cuja única responsabilidade é forçar um re-render (por
exemplo, incrementando um contador de "tick" em um `useState` auxiliar, ou
recalculando e gravando o valor derivado exibido) — nunca decrementar o tempo
restante diretamente. Em paralelo, um segundo `useEffect` assina
`AppState.addEventListener('change', ...)`: ao detectar a transição para `active`
vindo de `background`/`inactive`, força imediatamente um recálculo (mesmo
mecanismo do tick), garantindo que o valor exibido já esteja correto no primeiro
frame após o app voltar ao primeiro plano, sem esperar o próximo tick de 1s.

**Rationale**: Atende à exigência explícita do usuário ("`setInterval` apenas para
disparar re-render... nunca como fonte de verdade"). O listener de `AppState` é
necessário porque, enquanto o app está em background, o JS engine (Hermes) é
suspenso e `setInterval` não dispara — não há tick nenhum acontecendo durante esse
tempo, então o primeiro re-render após voltar precisa ser forçado explicitamente
pelo evento de mudança de estado do app, não esperado passivamente do próximo
intervalo de 1s (que só dispararia até 1s depois, e só se o timer nem tivesse sido
descartado pelo SO — o que não importa aqui, pois o valor exibido é sempre
recalculado do zero a partir de `fimEm`, então mesmo um tick "atrasado" já mostra
o valor certo; o listener de `AppState` só existe para não deixar a tela
momentaneamente com o valor antigo por até 1s ao reabrir).

**Alternatives considered**:
- Depender só do `setInterval` para atualizar a UI ao voltar de background, sem
  `AppState`: rejeitado — funcionalmente "correto" na próxima leitura (o valor
  calculado já seria certo), mas deixaria a tela exibindo o valor desatualizado
  por até 1 segundo extra após o app voltar ao primeiro plano, uma latência
  perceptível e desnecessária que o `AppState` resolve com uma linha a mais.
- Bibliotecas de timer/animação de terceiros (ex.: `react-native-background-timer`):
  rejeitado — não é necessário rodar código em background de fato (o requisito é
  apenas "refletir o tempo real decorrido ao voltar", não notificar enquanto em
  background — isso é o RF06, ainda fora de escopo), então nenhuma dependência
  nova se justifica (Princípio IV).

## Decisão 4: Novo ponto de extensão `onDescansoConcluido`, espelhando `onIniciarDescanso`

**Decision**: Quando o tempo restante calculado chega a zero (detectado no
próximo tick, ou no recálculo ao voltar de background), a rota chama uma função
`handleDescansoConcluido` que limpa `descansoAtivo` (volta a `null`) e invoca um
callback opcional `onDescansoConcluido?: () => void`, seguindo exatamente o
mesmo padrão sintático de `onIniciarDescanso` (prop opcional, sem implementação de
UI própria nesta feature).

**Rationale**: Pedido explícito do usuário ("seguindo o mesmo padrão de ponto de
extensão que o RF04 deixou para esta feature") e da spec (FR-009) — o RF06
(som/vibração) se conecta a este callback exatamente como esta feature se conecta
a `onIniciarDescanso`, sem exigir que o RF06 conheça a lógica interna do
cronômetro.

**Alternatives considered**:
- Expor um evento via `EventEmitter`/`PubSub` global: rejeitado por complexidade
  desnecessária (Princípio II) — um callback de prop simples já resolve, no
  mesmo nível de simplicidade do que o RF04 já estabeleceu.

## Decisão 5: Onde a UI do cronômetro é renderizada

**Decision**: O componente `CronometroDescanso` é renderizado pela própria rota
(`[treinoId].tsx`), condicionado a `descansoAtivo !== null`, sobreposto ou
adjacente à tela de `ExercicioExecucao` (ex.: uma faixa fixa no topo/rodapé da
tela de execução) — não como parte interna do JSX de `ExercicioExecucao`.

**Rationale**: Como o estado vive na rota (Decisão 2), faz sentido que a
renderização também parta dali, evitando que `ExercicioExecucao` precise
re-receber de volta, via props, um estado que ele nem possui. Isso também
resolve naturalmente a exigência da spec de o cronômetro continuar visível
mesmo que o usuário esteja fora da tela de um exercício específico (por exemplo,
na lista de exercícios do mesmo treino) — desde que ainda dentro da rota
`[treinoId].tsx`.

**Alternatives considered**:
- Passar `segundosRestantes` como prop para dentro de `ExercicioExecucao` e
  renderizar o cronômetro lá dentro: não rejeitado como incorreto, mas
  desnecessariamente mais restrito — prenderia a exibição do cronômetro a estar
  com aquele exercício específico selecionado, quando a spec (US3) exige que ele
  continue visível/contando mesmo ao navegar para a lista de exercícios do mesmo
  treino ou para o histórico. Manter a renderização no nível da rota é a opção
  mais simples que já cobre esse requisito sem lógica condicional extra.
