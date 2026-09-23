# Feature Specification: Vibração Diferenciada ao Fim do Descanso

**Feature Branch**: `014-vibracao-fim-descanso`

**Created**: 2026-09-22

**Status**: Implemented (código pronto; não verificável sem aparelho físico, pendente validação real em Android/iOS)

**Requisito**: RF13 (PRD, seção 6 — pós-MVP)

**Nota**: Melhoria pós-desenvolvimento — não fazia parte do escopo original do MVP.
Solicitada pelo usuário após testar o app em uso real na academia.

**Input**: User description: "Ao finalizar o descanso a vibração pode ser mais
intensa, diferente da notificação, e pode até ter o som de cronômetro finalizado.
Decisão já tomada com o usuário: por enquanto, só vibração — som fica para uma rodada
futura, porque exigiria uma dependência nativa nova (biblioteca de áudio) e um novo
development build; vibração usa a API nativa do React Native, sem depender de nada
novo. Contexto investigado no código (src/services/notificacao-descanso.ts): hoje já
existe uma notificação do sistema operacional agendada para o fim do descanso, com um
canal Android configurado com um padrão de vibração leve ([0, 250, 250, 250]) — essa
notificação dispara tanto com o app em primeiro quanto em segundo plano. O problema é
que, com o app aberto e o usuário olhando o cronômetro (componente
CronometroDescanso), não existe nenhuma vibração própria do app — só a da notificação
do sistema, que é discreta."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sentir claramente que o descanso acabou, com o app aberto (Priority: P1)

O usuário está treinando, com o app aberto na tela de cronômetro de descanso (entre
séries). Quando o tempo de descanso termina, ele quer sentir uma vibração forte e
perceptível — diferente da vibração discreta da notificação do sistema — para saber,
mesmo sem olhar para o celular, que já pode voltar a treinar.

**Why this priority**: É o problema relatado: na academia, o usuário não está sempre
olhando a tela durante o descanso, e a vibração atual (herdada só da notificação) é
fraca demais para ser percebida nesse contexto de uso.

**Independent Test**: Iniciar um descanso curto, deixar o app aberto na tela do
cronômetro até o tempo zerar, e confirmar que uma vibração perceptivelmente mais forte
que a vibração padrão de notificação do aparelho ocorre no momento exato em que o
cronômetro chega a zero.

**Acceptance Scenarios**:

1. **Given** o app está aberto e o cronômetro de descanso está contando, **When** o
   tempo de descanso chega a zero, **Then** o dispositivo vibra com um padrão mais
   intenso/perceptível do que o padrão usado hoje pela notificação do sistema.
2. **Given** o usuário ajustou o tempo de descanso (+15s/-15s) antes dele terminar,
   **When** o tempo ajustado chega a zero, **Then** a vibração de fim de descanso
   ocorre normalmente, no novo horário calculado.

---

### User Story 2 - Não duplicar vibração quando o app está em segundo plano (Priority: P2)

Quando o app está em segundo plano (usuário trocou de app ou bloqueou a tela) no
momento em que o descanso termina, apenas a vibração já existente da notificação do
sistema deve ocorrer — sem a vibração nova do app tentando disparar por cima
(o que não seria possível tecnicamente de qualquer forma, já que o JS do app é
suspenso em segundo plano, mas fica registrado como garantia de escopo).

**Why this priority**: Evita confusão sobre onde a vibração "nova" se aplica — é um
esclarecimento de escopo, não uma funcionalidade extra por si só, por isso prioridade
menor que a US1.

**Independent Test**: Iniciar um descanso, colocar o app em segundo plano antes do
tempo zerar, e confirmar que o comportamento observado (vibração da notificação do
sistema) é idêntico ao que já existe hoje, sem vibração adicional perceptível.

**Acceptance Scenarios**:

1. **Given** o app está em segundo plano quando o descanso termina, **When** a
   notificação do sistema dispara, **Then** o comportamento de vibração é exatamente o
   mesmo já existente antes desta feature — nenhuma mudança perceptível.

---

### Edge Cases

- O dispositivo do usuário está em modo silencioso/não perturbe, ou com vibração
  desativada nas configurações do sistema → a vibração do app não ocorre (respeita a
  configuração do sistema operacional), mesmo comportamento esperado de qualquer app;
  não é tratado como erro.
- O usuário sai da tela de cronômetro (ex.: navega para "Voltar para exercícios")
  momentos antes do descanso terminar, mas continua com o app em primeiro plano →
  a vibração de fim de descanso deve ocorrer normalmente, já que o app segue em
  primeiro plano — a vibração não depende de qual tela específica está visível, só de o
  app estar em primeiro ou segundo plano.
- O usuário ajusta o descanso para 0s ou menos (já tratado hoje como cancelamento do
  descanso, sem cronômetro) → nenhuma vibração de fim de descanso ocorre, mesmo
  comportamento já existente hoje para esse caso.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE disparar uma vibração do dispositivo no momento exato em
  que o cronômetro de descanso chega a zero, enquanto o app estiver em primeiro plano.
- **FR-002**: O padrão de vibração desta feature DEVE ser perceptivelmente mais
  intenso/longo do que o padrão de vibração usado pelo canal de notificação de fim de
  descanso **antes** desta feature (RF06 original), de forma a ser identificável como
  um evento diferente ao ser introduzido.
- **FR-003**: Esta feature NÃO DEVE alterar o conteúdo nem o agendamento da
  notificação do sistema operacional já existente — a nova vibração em primeiro plano
  não substitui a notificação. **Atualizado em 2026-09-23** (pedido do usuário após
  testar as duas vibrações lado a lado e notar a diferença): o **padrão de vibração**
  do canal de notificação (usado em segundo plano) passa a ser o mesmo padrão desta
  feature (FR-002), para que a sensação seja igual independente de o app estar aberto
  ou não — exige um novo id de canal Android, já que canais existentes num aparelho
  não podem ter o `vibrationPattern` alterado in-place.
- **FR-004**: A vibração NÃO DEVE ocorrer se o dispositivo estiver com a vibração
  desativada nas configurações do sistema — o app não deve tentar contornar essa
  configuração.
- **FR-005**: A funcionalidade de reprodução de som ao fim do descanso está FORA do
  escopo desta feature — decisão explícita do usuário, adiada para uma rodada futura
  que já inclua uma dependência nativa de áudio e o build correspondente.

### Key Entities

Não aplicável — esta feature não introduz nem altera entidades de dados; é puramente
uma resposta sensorial local a um evento (fim do descanso) que já existe no sistema.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das vezes em que o descanso termina, o usuário sente o mesmo
  padrão de vibração forte — com o app em primeiro plano ou em segundo plano
  (notificação), sem diferença perceptível entre os dois casos.
- **SC-002** (atualizado 2026-09-23): a notificação em segundo plano continua com o
  mesmo conteúdo/agendamento de antes — só o padrão de vibração mudou (FR-003),
  intencionalmente, não é uma regressão.

## Assumptions

- **Sem novo build nativo**: a vibração usa a API já embutida no React Native
  (`Vibration`), sem exigir nenhuma dependência nova nem novo development build.
- **Som adiado**: por decisão explícita do usuário, o som de "cronômetro finalizado"
  fica fora do escopo desta feature e será tratado em uma feature futura, quando fizer
  sentido agrupar com outra mudança que já exija dependência nativa nova.
- **Sem configuração de intensidade pelo usuário**: o padrão de vibração é fixo,
  definido pelo app — esta feature não introduz uma tela de preferências para o
  usuário ajustar intensidade/padrão de vibração.
