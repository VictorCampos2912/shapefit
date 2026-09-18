# Feature Specification: Cronômetro de Descanso

**Feature Branch**: `007-cronometro-descanso`

**Created**: 2026-09-17

**Status**: Draft

**Input**: User description: "Baseado no PRD anexo (v1.1) e no criterios-aceite.md, criar a especificação do requisito RF05: cronômetro de descanso. Conectar-se ao ponto de extensão já existente do RF04 — o callback onIniciarDescanso em ExercicioExecucao, hoje disparado sem nenhuma UI própria — implementando a partir dele a contagem regressiva real. Duração inicial vem do campo descanso_seg do exercício no JSON. O usuário pode ajustar o tempo restante em incrementos de +/-15 segundos, a qualquer momento durante a contagem, quantas vezes quiser. O cronômetro deve continuar contando corretamente mesmo se o usuário navegar para outra tela do app durante o descanso, e mesmo se o app for minimizado/colocado em segundo plano — ao voltar, o tempo restante deve refletir o tempo real decorrido, sem pausar artificialmente. Ao chegar a zero, o cronômetro para e aciona um evento de 'descanso concluído' — a notificação sonora/vibração em si é escopo do RF06."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cronômetro inicia automaticamente e conta corretamente (Priority: P1)

Ao concluir uma série durante a execução do treino, o usuário vê imediatamente um
cronômetro de descanso em contagem regressiva, sem precisar tocar em nada. O tempo
inicial é o sugerido pelo treino para aquele exercício, e a contagem avança
normalmente até chegar a zero.

**Why this priority**: É o comportamento central do requisito — sem ele, não existe
cronômetro. Todo o resto (ajuste manual, sobrevivência a navegação/background) é
refinamento sobre este fluxo básico.

**Independent Test**: Concluir uma série em qualquer exercício e observar que o
cronômetro aparece contando a partir do tempo de descanso configurado no treino,
decrescendo segundo a segundo até chegar a zero e parar.

**Acceptance Scenarios**:

1. **Given** o usuário está executando uma série de um exercício com descanso
   configurado para 90 segundos, **When** ele toca em "Concluir série", **Then** o
   cronômetro de descanso aparece e começa a contar a partir de 90 segundos, sem
   nenhuma ação adicional do usuário.
2. **Given** o cronômetro está contando, **When** o tempo restante chega a zero,
   **Then** a contagem para em zero e o evento de "descanso concluído" é disparado.
3. **Given** o usuário concluiu uma série de um exercício diferente, com
   `descanso_seg` diferente do anterior, **When** o cronômetro inicia, **Then** o
   tempo de partida corresponde ao `descanso_seg` daquele exercício específico, não
   ao valor usado na série anterior.

---

### User Story 2 - Ajuste manual do tempo restante (Priority: P2)

Enquanto o cronômetro está contando, o usuário pode adicionar ou remover 15 segundos
do tempo restante a qualquer momento, quantas vezes quiser — por exemplo, para
estender o descanso se ainda não se sentir pronto, ou encurtá-lo se quiser continuar
antes do previsto.

**Why this priority**: É um ajuste de conforto sobre o comportamento central (US1).
O cronômetro já é funcional e testável sem esta capacidade, mas ela é parte explícita
do requisito e dos critérios de aceite.

**Independent Test**: Com o cronômetro em contagem, tocar no controle de "+15s"
várias vezes seguidas e verificar que o tempo restante aumenta 15 segundos a cada
toque; tocar em "-15s" e verificar a redução equivalente.

**Acceptance Scenarios**:

1. **Given** o cronômetro está contando com 40 segundos restantes, **When** o
   usuário toca em "+15s", **Then** o tempo restante passa a ser 55 segundos e a
   contagem continua normalmente a partir daí.
2. **Given** o cronômetro está contando com 20 segundos restantes, **When** o
   usuário toca em "-15s", **Then** o tempo restante passa a ser 5 segundos.
3. **Given** o usuário toca em "+15s" repetidas vezes em sequência, **When** cada
   toque é processado, **Then** cada um soma 15 segundos ao valor atual, sem limite
   máximo imposto pela feature.
4. **Given** o tempo restante é inferior a 15 segundos (por exemplo, 8 segundos),
   **When** o usuário toca em "-15s", **Then** o tempo restante vai a zero (não
   fica negativo) e o cronômetro é tratado como concluído.

---

### User Story 3 - Cronômetro sobrevive a navegação e a segundo plano (Priority: P1)

O usuário conclui uma série, decide consultar o histórico de treinos (ou qualquer
outra tela do app) enquanto descansa, e depois volta para a tela de execução. Em
outro momento, ele minimiza o app (ou a tela do celular apaga) durante o descanso e
depois volta a abrir o app. Em ambos os casos, o tempo restante exibido reflete
corretamente quanto tempo realmente se passou — nunca fica "parado" no valor de
antes de sair.

**Why this priority**: É um critério de aceite explícito e crítico do requisito: um
cronômetro que pausa ao navegar ou ao minimizar o app quebraria a confiança do
usuário no tempo de descanso real, então tem a mesma prioridade do comportamento
básico de contagem (US1).

**Independent Test**: Iniciar o cronômetro, navegar para a tela de histórico,
esperar um intervalo conhecido (ex: 20 segundos), voltar para a tela de execução e
conferir que o tempo restante caiu exatamente os 20 segundos decorridos. Repetir o
teste minimizando o app em vez de navegar internamente.

**Acceptance Scenarios**:

1. **Given** o cronômetro está contando com 60 segundos restantes, **When** o
   usuário navega para a tela de histórico e permanece lá por 15 segundos antes de
   voltar, **Then** o cronômetro exibe aproximadamente 45 segundos restantes ao
   retornar à tela de execução.
2. **Given** o cronômetro está contando com 60 segundos restantes, **When** o
   usuário minimiza o app (coloca em segundo plano) por 15 segundos e depois volta
   a abri-lo, **Then** o cronômetro exibe aproximadamente 45 segundos restantes,
   refletindo o tempo real decorrido enquanto estava em segundo plano.
3. **Given** o cronômetro tinha, por exemplo, 10 segundos restantes quando o app foi
   minimizado, **When** o usuário reabre o app após 30 segundos em segundo plano
   (ou seja, mais tempo do que restava), **Then** o cronômetro é exibido já em zero
   (não negativo) e o evento de "descanso concluído" é considerado disparado.
4. **Given** o cronômetro está contando e o usuário sai da tela de execução para
   outra tela do app, **When** ele ajusta o tempo com "+15s"/"-15s" antes de sair,
   **Then** o ajuste é preservado e continua valendo como base do cálculo do tempo
   restante mesmo após a navegação.

---

### Edge Cases

- O que acontece se o exercício não tiver `descanso_seg` definido no JSON, ou o valor
  for zero? → O cronômetro não é exibido / é tratado como já concluído (evento de
  "descanso concluído" disparado imediatamente), já que não há tempo de descanso a
  contar.
- O que acontece se o usuário concluir outra série (do mesmo exercício ou de outro)
  enquanto um cronômetro anterior ainda está contando? → O cronômetro anterior é
  substituído por um novo, reiniciado com o `descanso_seg` do exercício da série
  recém-concluída (não há acúmulo de múltiplos cronômetros simultâneos).
- O que acontece se o app for completamente fechado (não apenas minimizado) durante
  o descanso e reaberto depois? → Fora de escopo desta feature: como o RF04 não
  persiste em disco o estado do cronômetro em si (apenas a série concluída), ao
  reabrir o app o descanso não é retomado; o usuário retoma o exercício
  normalmente, sem cronômetro ativo.
- O que acontece se o usuário ajustar o tempo (+/-15s) exatamente quando a contagem
  chega a zero? → O ajuste mais recente processado é o que vale; se o resultado for
  zero ou negativo, o cronômetro é tratado como concluído.
- O que acontece ao concluir a última série planejada de um exercício? → **Nenhum
  cronômetro é iniciado.** Ajuste identificado durante a validação manual em
  Android e iOS: como não há mais nenhuma série a executar naquele exercício, um
  período de descanso não faz sentido na prática — o usuário segue diretamente
  para "Concluir exercício". O cronômetro só é disparado ao concluir uma série que
  não seja a última do exercício.
- O teclado (para os campos de carga/repetições) permanece aberto e cobre o
  cronômetro após "Concluir série"? → Não. Ajuste identificado durante a validação
  manual: ao concluir uma série, o teclado é fechado explicitamente pelo sistema
  (não depende de o usuário tocar fora do campo ou usar um botão físico de
  voltar), de forma idêntica em Android e iOS — o cronômetro fica visível
  imediatamente.
- Os campos de carga/repetições da próxima série ficam visíveis e editáveis
  durante o descanso, permitindo ao usuário preencher e concluir a próxima série
  antes de o cronômetro zerar? → Não. Ajuste identificado durante a validação
  manual: enquanto o cronômetro estiver ativo para o exercício em execução, a
  área de carga/repetições e o botão "Concluir série" ficam ocultos — apenas um
  indicativo de qual será a próxima série é exibido, junto das séries já
  concluídas. Os campos só reaparecem quando o descanso chega a zero. Isso não
  impede o usuário de encerrar o descanso mais cedo — para isso, ele usa o ajuste
  "-15s" já existente (repetidamente, se quiser) até o tempo chegar a zero; não
  há um botão separado de "pular descanso".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE iniciar automaticamente a contagem regressiva do
  cronômetro de descanso no momento em que uma série é concluída (via callback
  `onIniciarDescanso` já existente no componente de execução do exercício), sem
  exigir nenhuma ação adicional do usuário — **exceto quando a série concluída for
  a última planejada daquele exercício** (ver FR-012).
- **FR-002**: O tempo inicial do cronômetro DEVE corresponder ao valor do campo
  `descanso_seg` (`descansoSeg`) do exercício associado à série recém-concluída,
  lido a partir dos dados do treino já carregados.
- **FR-003**: O sistema DEVE exibir visualmente o tempo restante em contagem
  regressiva enquanto o cronômetro estiver ativo, atualizando o valor exibido de
  forma perceptível ao usuário (ao menos a cada segundo, enquanto a tela estiver em
  primeiro plano).
- **FR-004**: O usuário DEVE poder adicionar 15 segundos ao tempo restante a
  qualquer momento durante a contagem, quantas vezes quiser, sem limite máximo.
- **FR-005**: O usuário DEVE poder remover 15 segundos do tempo restante a qualquer
  momento durante a contagem, quantas vezes quiser; se a subtração resultar em valor
  negativo, o tempo restante DEVE ser tratado como zero (cronômetro concluído), não
  como número negativo.
- **FR-006**: O sistema DEVE calcular o tempo restante a partir de um timestamp de
  início mais a duração total (ajustada pelos incrementos/decrementos aplicados),
  comparando com o horário atual no momento de cada atualização — não a partir de um
  decremento por intervalo que dependa da execução contínua de um timer em primeiro
  plano.
- **FR-007**: O sistema DEVE recalcular e exibir corretamente o tempo restante
  quando o usuário retorna à tela de execução do exercício após navegar para outra
  tela do app durante o descanso, refletindo o tempo real decorrido desde o início
  (ou último ajuste) do cronômetro.
- **FR-008**: O sistema DEVE recalcular e exibir corretamente o tempo restante
  quando o app volta ao primeiro plano após ter sido minimizado/colocado em segundo
  plano durante o descanso, refletindo o tempo real decorrido, sem pausar a
  contagem artificialmente enquanto estava em segundo plano.
- **FR-009**: Quando o tempo restante chega a zero (seja por decorrência natural da
  contagem, seja por um ajuste manual que leve a esse resultado, seja por tempo em
  segundo plano maior que o restante), o sistema DEVE parar a contagem e disparar um
  evento de "descanso concluído", seguindo o mesmo padrão de ponto de extensão sem
  UI própria usado pelo `onIniciarDescanso` do RF04 (a reação a esse evento — som e
  vibração — é escopo do RF06 e não é implementada por esta feature).
- **FR-010**: Se o `descanso_seg` do exercício for ausente, zero ou não numérico, o
  sistema DEVE tratar o descanso como já concluído, disparando imediatamente o
  evento de "descanso concluído" sem exibir uma contagem regressiva.
- **FR-011**: Ao concluir uma nova série enquanto um cronômetro de descanso anterior
  ainda estiver ativo, o sistema DEVE substituir o cronômetro anterior por um novo,
  reiniciado com o `descanso_seg` do exercício da série recém-concluída.
- **FR-012**: Se a série concluída for a última planejada daquele exercício (não há
  mais séries a executar), o sistema NÃO DEVE iniciar o cronômetro de descanso —
  o usuário segue diretamente para "Concluir exercício", sem período de descanso
  intermediário. *(Adicionado após validação manual em Android/iOS — ver Edge
  Cases.)*
- **FR-013**: Ao tocar em "Concluir série", o sistema DEVE fechar o teclado
  virtual (dos campos de carga/repetições) antes ou junto do início do
  cronômetro, de forma que o cronômetro fique visível imediatamente, sem
  depender de uma ação adicional do usuário (como tocar fora do campo ou usar um
  botão de voltar) para fechar o teclado manualmente. *(Adicionado após
  validação manual em Android/iOS — ver Edge Cases.)*
- **FR-014**: Enquanto o cronômetro de descanso estiver ativo para o exercício em
  execução, o sistema NÃO DEVE exibir os campos de carga/repetições da próxima
  série nem o botão "Concluir série" — apenas uma indicação de qual será a
  próxima série (número) e as séries já concluídas permanecem visíveis. Os
  campos e o botão só voltam a ser exibidos quando o cronômetro chega a zero.
  Isso não introduz um mecanismo separado de "pular descanso": o usuário
  continua podendo encerrar o descanso antecipadamente apenas pelo ajuste
  "-15s" já existente (FR-005), repetido até o tempo chegar a zero. *(Adicionado
  após validação manual em Android/iOS — ver Edge Cases.)*

### Key Entities *(include if feature involves data)*

- **Cronômetro de descanso**: representa a contagem regressiva em andamento após a
  conclusão de uma série. Atributos conceituais: horário de início (momento em que
  a contagem começou ou foi ajustada pela última vez), duração total restante a
  partir desse horário, e um indicador de se já está concluído. É um estado
  transitório associado à execução do exercício em andamento — não é persistido em
  armazenamento de longo prazo (ver Edge Cases sobre fechamento completo do app).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das conclusões de série disparam o início do cronômetro de
  descanso sem exigir nenhum toque adicional do usuário.
- **SC-002**: O tempo exibido ao retornar de outra tela do app, ou ao retornar de
  segundo plano, diverge do tempo real decorrido em no máximo 1-2 segundos,
  independentemente de quanto tempo o app ficou fora de foco.
- **SC-003**: Usuários conseguem ajustar o tempo de descanso (adicionar ou remover
  15 segundos) em menos de 1 segundo por toque, com o valor exibido refletindo o
  ajuste imediatamente.
- **SC-004**: Em 100% dos casos em que o tempo restante chega a zero — por contagem
  natural, ajuste manual ou tempo em segundo plano — o evento de "descanso
  concluído" é disparado exatamente uma vez, sem disparos duplicados ou ausentes.

## Assumptions

- O campo `descanso_seg` do JSON do treino é exposto no código como `descansoSeg`
  em `ExercicioPlanejado` (já usado na tela de execução para exibir "Xs descanso" ao
  lado do exercício), e é essa a fonte de verdade para o tempo inicial do
  cronômetro.
- O ponto de extensão a ser implementado é a prop opcional `onIniciarDescanso` já
  existente em `ExercicioExecucao` (disparada dentro de `handleConcluirSerie`, hoje
  sem nenhum efeito de UI) — esta feature adiciona a UI e a lógica de contagem a
  partir desse callback, sem alterar o ponto onde ele é chamado.
- A notificação sonora/vibração ao término do descanso é explicitamente fora de
  escopo (RF06); esta feature limita-se a disparar um evento equivalente em padrão
  ao `onIniciarDescanso`, para que o RF06 se conecte a ele da mesma forma que esta
  feature se conecta ao RF04.
- Não há requisito de persistir o estado do cronômetro em armazenamento durável
  (`AsyncStorage` ou similar): "sobreviver a segundo plano" significa sobreviver
  enquanto o processo do app permanece vivo (minimizado), não a um fechamento
  completo do app pelo sistema operacional ou pelo usuário. Caso o app seja
  finalizado, o descanso não é retomado ao reabrir.
- Múltiplos treinos em andamento simultaneamente (permitidos pelo RF04) não geram
  múltiplos cronômetros simultâneos visíveis: o cronômetro é sempre relativo ao
  exercício/série sendo executado na tela ativa no momento; não há requisito de
  cronômetros de descanso concorrentes entre diferentes treinos/exercícios.
- O ajuste de +/-15 segundos não possui limite máximo superior nem necessidade de
  aviso especial ao usuário; o único limite é o piso de zero ao decrementar.
- **O Acceptance Scenario 1 da User Story 3 ("navega para a tela de histórico e
  permanece lá... antes de voltar") depende de uma tela de histórico navegável a
  partir da execução do treino sem desmontar a tela de execução — algo que hoje
  não existe e que esta feature NÃO resolve.** A rota de execução do treino
  (`src/app/treino/[treinoId].tsx`) é atualmente empilhada por cima de todo o
  navegador de abas do app (não vive dentro dele); sair dela para qualquer outra
  tela do app hoje é feito por um "voltar" que desmonta a rota inteira, e não por
  uma troca de aba que a mantém montada em segundo plano. Isso significa que,
  mesmo depois de o RF08 (histórico) existir, o cenário só passa a ser
  satisfazível de fato se uma decisão de arquitetura de navegação separada — a
  ser tomada no RF08 ou em uma revisão dedicada — reposicionar essa rota (por
  exemplo, aninhando-a dentro do navegador de abas) ou introduzir um mecanismo de
  estado que sobreviva à desmontagem da rota atual (por exemplo, elevar o estado
  do cronômetro para fora dela). Esta feature assume que essa decisão **não** foi
  tomada e **não** presume que ela será resolvida automaticamente pela simples
  existência do RF08; o cenário permanece formalmente descrito na spec (é um
  critério de aceite oficial do documento de referência), mas sua validação real
  fica bloqueada até essa lacuna arquitetural ser endereçada explicitamente em
  uma feature futura.
