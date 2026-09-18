# Feature Specification: Notificação de Fim do Descanso

**Feature Branch**: `008-notificacao-fim-descanso`

**Created**: 2026-09-17

**Status**: Draft

**Input**: User description: "Baseado no PRD anexo (v1.1) e no criterios-aceite.md, criar a especificação do requisito RF06: notificação de fim do descanso. Conectar-se ao ponto de extensão onDescansoConcluido, criado pelo RF05, disparado quando o cronômetro chega a zero. O aviso deve ser som + vibração simultâneos. Requisito crítico de arquitetura: o RF05 já estabeleceu que o JS não executa com o app em segundo plano (Hermes suspenso) — uma implementação que apenas reage a onDescansoConcluido não vai funcionar com o app minimizado ou a tela bloqueada, justamente quando o aviso é mais necessário. Isso implica agendar uma notificação local do sistema operacional (não apenas tocar um som via JS) no momento em que o cronômetro inicia ou é ajustado (+/-15s), usando o fimEm calculado pelo RF05 como horário de disparo — e cancelar/reagendar essa notificação sempre que o RF05 substituir ou ajustar o cronômetro (nova série concluída, ajuste manual). O aviso sonoro deve respeitar o volume de notificação do sistema (silencioso em modo silencioso, exceto pela vibração). Deve funcionar com a tela bloqueada, desde que o app não tenha sido fechado por completo (apenas minimizado) — consistente com o mesmo limite de escopo já assumido pelo RF05 (fechamento completo do app não é coberto). Após o aviso, o app deve exibir claramente que o descanso terminou e liberar o registro da próxima série. Usar os critérios de aceite do RF06 no documento criterios-aceite.md anexo. Não implementar código ainda — apenas descrever o comportamento esperado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Aviso sonoro e por vibração ao fim do descanso, com app em primeiro plano (Priority: P1)

O usuário está com o app aberto e visível enquanto o cronômetro de descanso conta.
Quando o tempo chega a zero, ele percebe imediatamente — sem precisar olhar para a
tela — porque o celular emite um som e vibra ao mesmo tempo.

**Why this priority**: É o comportamento central do requisito. Sem aviso perceptível
ao fim do descanso, o usuário precisa ficar olhando o cronômetro continuamente, o que
anula o valor do RF05. Todo o restante (funcionar em segundo plano, respeitar modo
silencioso) é extensão deste comportamento básico.

**Independent Test**: Concluir uma série com um tempo de descanso curto (ex: 15
segundos), manter o app aberto e em primeiro plano, e observar que, ao chegar a zero,
o som e a vibração ocorrem juntos, no mesmo instante em que o cronômetro zera.

**Acceptance Scenarios**:

1. **Given** o cronômetro de descanso está contando e o app está em primeiro plano,
   **When** o tempo restante chega a zero, **Then** o celular emite um som e vibra
   simultaneamente.
2. **Given** o aviso de fim de descanso foi emitido, **When** o usuário olha para a
   tela, **Then** o app exibe claramente que o descanso terminou (não mais uma
   contagem regressiva) e os campos de carga/repetições da próxima série ficam
   visíveis e disponíveis para preenchimento.

---

### User Story 2 - Aviso funciona com o app minimizado ou a tela bloqueada (Priority: P1)

O usuário conclui uma série, minimiza o app (ou a tela do celular apaga/bloqueia
sozinha) enquanto descansa — por exemplo, para checar outro aplicativo ou apenas
guardar o celular no bolso. Mesmo sem o app visível, quando o tempo de descanso
termina, ele ainda escuta o som e sente a vibração, exatamente como se estivesse com
o app aberto.

**Why this priority**: É o critério mais crítico do requisito do ponto de vista
arquitetural. O RF05 já estabeleceu que o JavaScript do app é suspenso quando ele vai
para segundo plano — momento em que o aviso é mais necessário, pois o usuário
provavelmente não está olhando para a tela. Um aviso que só funciona com o app aberto
falharia justamente no cenário mais comum de uso do cronômetro de descanso.

**Independent Test**: Iniciar um descanso de duração curta e conhecida (ex: 15
segundos), minimizar o app imediatamente (ou bloquear a tela do celular), aguardar o
tempo configurado sem tocar no celular, e confirmar que o som e a vibração ocorrem no
momento correto, mesmo com o app fora de primeiro plano e a tela bloqueada.

**Acceptance Scenarios**:

1. **Given** o cronômetro de descanso está contando, **When** o usuário minimiza o
   app antes do tempo chegar a zero, **Then** o som e a vibração ainda ocorrem no
   horário correto de término do descanso, independentemente de o app estar em
   primeiro ou segundo plano.
2. **Given** o cronômetro de descanso está contando, **When** a tela do celular
   bloqueia sozinha (por inatividade) antes do tempo chegar a zero, **Then** o som e
   a vibração ainda ocorrem no horário correto, mesmo com a tela bloqueada.
3. **Given** o usuário ajustou o tempo de descanso (+15s ou -15s) antes de minimizar
   o app, **When** o tempo ajustado chega a zero, **Then** o aviso ocorre no novo
   horário resultante do ajuste, não no horário original antes do ajuste.
4. **Given** o app foi minimizado com um descanso em andamento, **When** o usuário
   reabre o app depois do horário de término (ainda que o app não tenha emitido o
   aviso por algum motivo), **Then** o app reflete corretamente que o descanso já
   terminou ao ser reaberto, sem exigir nenhuma ação especial do usuário para
   "destravar" essa constatação.

---

### User Story 3 - Aviso respeita o modo silencioso do aparelho (Priority: P2)

O usuário está em um ambiente onde manteve o celular em modo silencioso (por exemplo,
durante um treino em local compartilhado). Ao fim do descanso, ele não escuta nenhum
som — mas ainda sente a vibração, garantindo que o aviso continua funcionando mesmo
sem áudio.

**Why this priority**: É um comportamento esperado de qualquer app que usa
notificações no aparelho — o usuário já configurou o modo silencioso justamente para
não ser incomodado por sons, e o app não deve contornar essa preferência do sistema.
É importante, mas secundário ao fato de o aviso existir e funcionar em segundo plano
(US1 e US2).

**Independent Test**: Colocar o celular em modo silencioso, concluir uma série e
aguardar o fim do descanso; confirmar que nenhum som é ouvido, mas a vibração ocorre
normalmente.

**Acceptance Scenarios**:

1. **Given** o celular está em modo silencioso, **When** o descanso chega ao fim,
   **Then** nenhum som é emitido, mas a vibração ocorre normalmente.
2. **Given** o celular está com o volume de notificação em um nível específico
   (não mudo), **When** o descanso chega ao fim, **Then** o som é emitido nesse
   mesmo volume de notificação configurado pelo usuário no sistema — o app não
   define nem força um volume próprio.

---

### Edge Cases

- O que acontece se o usuário concluir outra série (reiniciando o cronômetro, ver
  RF05) antes do aviso anterior disparar? → O aviso pendente do cronômetro anterior é
  cancelado e substituído por um novo aviso, agendado para o novo horário de término
  do cronômetro atual. Nunca deve haver dois avisos pendentes ao mesmo tempo para o
  mesmo exercício em execução.
- O que acontece se o usuário ajustar o tempo (+15s/-15s) e esse ajuste reduzir o
  tempo restante a zero ou menos (ver RF05, FR-005)? → O aviso deve disparar
  imediatamente (ou no horário recalculado, que já é "agora" ou no passado), sem
  esperar um agendamento futuro que nunca chegaria a zero de forma útil.
- O que acontece se o exercício não tiver `descanso_seg` definido (cronômetro não é
  exibido, conforme RF05 FR-010)? → Nenhum aviso sonoro/vibração é agendado, pois não
  há período de descanso a aguardar; o fluxo segue direto para a próxima série sem
  disparar o evento sonoro do RF06.
- O que acontece se o app for fechado por completo (não apenas minimizado) durante o
  descanso? → Fora de escopo, consistente com o mesmo limite já assumido pelo RF05:
  se o sistema operacional encerrar o processo do app inteiramente, o aviso agendado
  pode não disparar (dependendo de como o sistema trata notificações agendadas por um
  app cujo processo foi finalizado). O usuário, ao reabrir o app, retoma o exercício
  normalmente, sem cronômetro ativo — mesmo comportamento já documentado pelo RF05
  para esse cenário.
- O que acontece se o usuário tocar no aviso (notificação) enquanto o app está
  minimizado ou com a tela bloqueada? → Tocar na notificação traz o app de volta ao
  primeiro plano, na mesma tela de execução do exercício em que o descanso ocorreu,
  já exibindo o estado de "descanso concluído" (campos de próxima série liberados).
- O que acontece se o usuário nunca tocar na notificação, apenas reabrir o app
  manualmente depois? → O comportamento é o mesmo: ao reabrir o app e voltar à tela
  de execução, o descanso já aparece concluído, pois o horário de término (`fimEm`)
  já passou — a notificação é apenas o meio de avisar, não a fonte da verdade sobre
  se o descanso terminou.
- O que acontece se o usuário estiver com múltiplos treinos em andamento (permitido
  pelo RF04), cada um potencialmente com seu próprio descanso em algum momento? → Como
  o RF05 já assume que o cronômetro é sempre relativo à tela de execução ativa no
  momento (sem cronômetros concorrentes visíveis entre treinos diferentes), o RF06
  segue a mesma premissa: apenas um aviso de fim de descanso fica agendado por vez,
  relativo ao cronômetro atualmente ativo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE agendar um aviso do sistema operacional (não apenas uma
  reação em JavaScript) para o horário `fimEm` calculado pelo cronômetro de descanso
  (RF05), no momento em que o cronômetro é iniciado — de forma que o aviso dispare no
  horário correto mesmo que o processo do app esteja suspenso (app minimizado ou tela
  bloqueada) quando esse horário chegar.
- **FR-002**: Sempre que o cronômetro de descanso for ajustado (+15s ou -15s,
  conforme RF05) ou substituído por um novo cronômetro (nova série concluída antes do
  anterior terminar, conforme RF05), o sistema DEVE cancelar o aviso agendado
  anteriormente e agendar um novo aviso para o novo horário `fimEm` resultante — nunca
  deixando mais de um aviso pendente ao mesmo tempo.
- **FR-003**: Quando o horário agendado do aviso chegar, o sistema DEVE emitir um som
  e uma vibração simultaneamente, perceptíveis pelo usuário independentemente de o
  app estar em primeiro plano, minimizado, ou com a tela do celular bloqueada —
  desde que o app não tenha sido fechado por completo (mesmo limite de escopo do
  RF05).
- **FR-004**: O som do aviso DEVE respeitar o volume de notificação configurado pelo
  usuário no sistema operacional do aparelho — incluindo permanecer silencioso quando
  o aparelho estiver em modo silencioso/não perturbe, sem o app definir ou forçar um
  volume próprio.
- **FR-005**: A vibração do aviso DEVE ocorrer independentemente do modo de som do
  aparelho (inclusive em modo silencioso), servindo como aviso perceptível mesmo
  quando o som estiver suprimido pela configuração do sistema.
- **FR-006**: Se o cronômetro de descanso não for iniciado por ausência de
  `descanso_seg` válido no exercício (conforme RF05, FR-010), o sistema NÃO DEVE
  agendar nenhum aviso sonoro/vibração para aquela série.
- **FR-007**: Se um ajuste manual do tempo restante (RF05, FR-005) resultar em tempo
  zero ou negativo, o sistema DEVE reagendar o aviso para disparar imediatamente (sem
  aguardar um horário futuro), em vez de manter um agendamento para um horário já
  passado.
- **FR-008**: Assim que o aviso dispara (som e vibração), o sistema DEVE atualizar a
  interface para indicar claramente que o descanso terminou, liberando os campos de
  carga/repetições e o botão de conclusão da próxima série (revertendo o estado
  descrito pelo RF05, FR-014).
- **FR-009**: Independentemente de o aviso sonoro/por vibração ter disparado com
  sucesso ou não (ex: usuário desativou notificações do app no sistema), o app DEVE
  refletir corretamente que o descanso terminou ao ser reaberto ou trazido de volta ao
  primeiro plano após o horário `fimEm` já ter passado — o aviso é um mecanismo de
  notificação, não a fonte da verdade sobre a conclusão do descanso (essa fonte
  continua sendo o cálculo de tempo restante já estabelecido pelo RF05).
- **FR-010**: Ao tocar no aviso do sistema enquanto o app estiver minimizado ou com a
  tela bloqueada, o sistema DEVE trazer o app de volta à tela de execução do
  exercício correspondente, já exibindo o estado de descanso concluído.

### Key Entities *(include if feature involves data)*

- **Aviso de fim de descanso**: representa o agendamento, no sistema operacional, de
  um alerta sonoro e por vibração vinculado ao horário `fimEm` do cronômetro de
  descanso ativo (RF05). Atributos conceituais: horário de disparo agendado (`fimEm`
  vigente), e uma referência que permita cancelar/substituir o agendamento anterior
  quando o cronômetro for ajustado ou reiniciado. É um estado transitório, sempre
  derivado do cronômetro de descanso atual — não existe independentemente dele nem é
  persistido além do tempo de vida do próprio descanso.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos términos de descanso produzem um aviso sonoro e por vibração
  simultâneos, independentemente de o app estar em primeiro plano, minimizado ou com
  a tela bloqueada (desde que o app não tenha sido encerrado por completo).
- **SC-002**: O aviso dispara dentro de uma margem de poucos segundos do horário real
  de término do descanso (`fimEm`), mesmo após ajustes manuais (+/-15s) ou
  substituição do cronômetro por uma nova série concluída.
- **SC-003**: Em modo silencioso, 100% dos avisos continuam perceptíveis via
  vibração, mesmo sem nenhum som audível.
- **SC-004**: Após o aviso (ou após reabrir o app quando o horário de término já
  passou), o usuário consegue começar a registrar a próxima série em menos de 1
  toque adicional além do necessário em qualquer outra série — sem obstáculos
  causados pelo estado de descanso permanecer indevidamente ativo.

## Assumptions

- O ponto de extensão `onDescansoConcluido`, mencionado na descrição da feature,
  corresponde ao evento de "descanso concluído" já definido pelo RF05 (FR-009) — o
  mesmo padrão de ponto de extensão sem UI própria usado por `onIniciarDescanso` no
  RF04. Esta feature reage a esse evento quando o app está em primeiro plano, mas a
  garantia de funcionamento em segundo plano/tela bloqueada não pode depender
  exclusivamente dele, pelo motivo já registrado na descrição da feature: o
  JavaScript do app não executa enquanto o processo está suspenso. Por isso, o
  aviso em si é modelado como um agendamento no sistema operacional, feito no
  momento em que o cronômetro inicia ou é ajustado (usando o `fimEm` calculado pelo
  RF05), e não como uma reação tardia ao evento quando o app volta ao primeiro
  plano.
- "App fechado por completo" versus "app minimizado" segue exatamente a mesma
  definição já usada pelo RF05: minimizado significa que o processo do app
  permanece vivo em segundo plano (ainda que o JavaScript esteja suspenso);
  fechado por completo significa que o sistema operacional ou o usuário encerrou o
  processo do app inteiramente. Esta feature cobre apenas o primeiro caso,
  consistente com o escopo já assumido pelo RF05.
- Conceder a permissão de notificações/alarmes ao sistema operacional (necessária
  para que agendamentos de aviso funcionem mesmo com o app em segundo plano) é
  tratada como uma configuração padrão do aparelho — não há um fluxo de
  onboarding específico para essa permissão descrito nesta especificação, pois o
  comportamento esperado quando a permissão não é concedida é o mesmo já descrito
  na FR-009: o app volta a refletir corretamente o descanso concluído ao ser
  reaberto, mesmo que o aviso sonoro/vibração em si não tenha ocorrido.
- Múltiplos treinos em andamento simultaneamente (permitidos pelo RF04) não geram
  múltiplos avisos concorrentes: como o RF05 já assume um único cronômetro ativo
  por vez (relativo à tela de execução em uso), o RF06 segue a mesma premissa de um
  único aviso agendado por vez.
- O som utilizado para o aviso é um som de notificação padrão do sistema/app (não
  há requisito de som customizável pelo usuário nesta feature).
- Esta feature não introduz nenhuma nova tela ou fluxo de configuração — o único
  efeito visível ao usuário, além do som/vibração, é a atualização do estado já
  existente da tela de execução (transição de "descanso em contagem" para "descanso
  concluído", já modelada pelo RF05).
