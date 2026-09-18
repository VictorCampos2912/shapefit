# Implementation Plan: Notificação de Fim do Descanso

**Branch**: `008-notificacao-fim-descanso` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-notificacao-fim-descanso/spec.md`

## Summary

Implementar o RF06 usando `expo-notifications` para agendar uma notificação local
do sistema operacional — não uma reação em JavaScript ao evento `onDescansoConcluido`
do RF05 — porque o RF05 já estabeleceu que o JS do app é suspenso quando o processo
vai para segundo plano, e é justamente nesse cenário (app minimizado, tela bloqueada)
que o aviso é mais necessário. O agendamento usa um trigger do tipo `DATE`
(`{ type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(fimEm) }`),
com `fimEm` sendo o mesmo timestamp absoluto já calculado e mantido pelo RF05 em
`descansoAtivo.fimEm`, na rota `src/app/treino/[treinoId].tsx`. Sempre que o RF05
altera `descansoAtivo` (novo cronômetro iniciado via `onIniciarDescanso`, ajuste de
+/-15s, ou substituição por nova série concluída), o agendamento anterior é cancelado
(`Notifications.cancelScheduledNotificationAsync`) antes de um novo ser criado — nunca
mais de um agendamento pendente por vez, espelhando a mesma garantia de "cronômetro
único" já estabelecida pelo RF05 (FR-011). Quando `descansoAtivo` volta a `null` sem
um novo cronômetro assumir o lugar (ou seja, o descanso terminou e não foi
substituído), o agendamento correspondente simplesmente dispara no horário
programado — o disparo em si não depende de o app estar em primeiro plano, pois é o
sistema operacional (não o JS do app) quem o executa.

Como o comportamento padrão do `expo-notifications` suprime som/alerta quando o app
está em primeiro plano, `Notifications.setNotificationHandler` é configurado
explicitamente (uma única vez, na inicialização do app) para retornar
`shouldPlaySound: true` junto de `shouldShowBanner: true` e `shouldShowList: true`
— **não** `shouldShowAlert`, que a pesquisa desta feature confirmou estar
depreciado nas versões recentes do SDK (incluindo SDK 57) e substituído por esses
dois campos separados (ver research.md, Decisão 4). Sem essa configuração,
a User Story 1 (app aberto durante o descanso) falharia mesmo que o agendamento em
segundo plano (User Story 2) funcionasse corretamente, já que os dois cenários usam
o mesmo mecanismo de notificação, apenas com comportamento de exibição diferente
conforme o app está ou não em primeiro plano.

Ainda na inicialização do app — antes de qualquer agendamento poder ocorrer —, um
canal de notificação Android dedicado é criado via `setNotificationChannelAsync`
com `importance: Notifications.AndroidImportance.MAX` (research.md, Decisão 6):
no Android 8+, som/vibração/heads-up de uma notificação são controlados pelo canal
a que ela pertence, e um canal de importância insuficiente (ou o canal "default"
implícito da biblioteca, cuja importância não é garantida) pode entregar a
notificação silenciosamente mesmo com o conteúdo pedindo som — exatamente o
requisito central deste RF06.

A permissão de notificação é solicitada (`requestPermissionsAsync`) apenas no momento
do primeiro agendamento (primeira vez que um cronômetro de descanso é iniciado na
sessão do app), sem nenhum fluxo de onboarding dedicado. Se o usuário negar, o
agendamento é simplesmente pulado (sem bloquear o fluxo de treino) — a fonte de
verdade sobre o descanso ter terminado continua sendo o cálculo de tempo por
timestamp já estabelecido pelo RF05 (`fimEm - Date.now()`), não a notificação em si;
o app já reflete corretamente o descanso concluído ao voltar ao primeiro plano depois
do horário `fimEm`, com ou sem o aviso sonoro/vibração tendo disparado.

**Risco conhecido, não resolvido por esta feature** (ver "Riscos Conhecidos"
abaixo e research.md, Decisão 8): no Android 12+, disparar o aviso com a precisão
de segundos exigida por SC-002 depende de o agendamento ser tratado como um alarme
"exato" pelo sistema (não sujeito a adiamento por Doze mode), o que normalmente
requer a permissão `SCHEDULE_EXACT_ALARM` declarada no manifesto nativo do app —
algo que não é garantidamente verificável/configurável testando via Expo Go puro,
já que o Expo Go roda com o manifesto do próprio cliente Expo Go, não o do app em
desenvolvimento. Isso é registrado como risco conhecido a ser observado na
validação manual, não como algo presumido como resolvido.

## Technical Context

**Language/Version**: TypeScript (strict, sem `any` implícito), conforme
Constituição Princípio I

**Primary Dependencies**: `expo-notifications` (nova dependência — ver
justificativa abaixo, Princípio IV), Expo SDK 57, Expo Router, React 19 / React
Native 0.86. Reaproveita o cálculo de tempo já existente em
`src/utils/cronometro-descanso.ts` (RF05) — nenhuma nova lógica de cálculo de tempo
é introduzida, apenas o agendamento do aviso a partir do `fimEm` já calculado.

**Storage**: N/A — o identificador da notificação agendada é mantido apenas em
memória (junto do `descansoAtivo` da rota, ou em um estado irmão a ele), com o
mesmo ciclo de vida transitório já estabelecido pelo RF05 para o cronômetro; nenhuma
escrita em `AsyncStorage` é introduzida por esta feature

**Testing**: Validação manual em dispositivo real via Expo Go (Android e iOS),
conforme Constituição Princípio III — com atenção especial ao cenário de app
minimizado/tela bloqueada, que é o núcleo arquitetural deste requisito. Notificações
locais agendadas (diferente de push remoto) são suportadas no Expo Go em ambas as
plataformas nesta versão do SDK, então não é necessário um development build
dedicado para validar o fluxo funcional básico

**Target Platform**: Android 12+ (Redmi Note 12) e iOS 17+ (iPhone 16 Plus), via
Expo Go

**Project Type**: Mobile app (Expo Router, projeto único em `src/`)

**Performance Goals**: O aviso deve disparar dentro de poucos segundos do horário
`fimEm` vigente (SC-002), mesmo após reagendamentos causados por ajustes de +/-15s ou
substituição do cronômetro. **Ver "Riscos Conhecidos" abaixo**: no Android 12+, essa
precisão depende de o alarme ser tratado como "exato" pelo sistema
(`SCHEDULE_EXACT_ALARM`), o que não é garantidamente verificável testando via Expo
Go — a margem de SC-002 MUST ser reavaliada na validação manual em dispositivo real,
não presumida como automaticamente satisfeita pela biblioteca.

**Constraints**: O agendamento MUST usar um trigger baseado em data/horário absoluto
(`fimEm`), não um trigger de duração relativa (`seconds`) nem repetição — para que o
horário de disparo permaneça correto mesmo que o agendamento seja recriado minutos
depois de `fimEm` ter sido originalmente calculado. Nunca mais de uma notificação
agendada pendente por vez — cada ajuste/substituição do cronômetro MUST cancelar
explicitamente o agendamento anterior antes (ou imediatamente depois, de forma
atômica o suficiente para não deixar as duas coexistirem por muito tempo) de criar o
novo. O handler de notificação em primeiro plano MUST ser configurado com
`shouldPlaySound: true`, `shouldShowBanner: true` e `shouldShowList: true` — não o
`shouldShowAlert` depreciado —, sem o que a User Story 1 não seria satisfeita. No
Android, o canal de notificação MUST ser criado com `importance:
AndroidImportance.MAX` **antes** de qualquer agendamento ocorrer (na inicialização
do app, não sob demanda), para que som/vibração/heads-up sejam entregues de forma
confiável, inclusive com a tela bloqueada. Nenhuma alteração ao cálculo de tempo já
estabelecido pelo RF05 — esta feature apenas observa `fimEm` e reage às suas
mudanças, sem duplicar ou substituir a lógica de
`calcularSegundosRestantes`/`ajustarFimEm`.

**Scale/Scope**: Uma nova função utilitária de agendamento/cancelamento de
notificação (isolada da lógica pura de tempo do RF05), configuração do handler de
notificações na inicialização do app, extensão da rota `[treinoId].tsx` para
agendar/cancelar a notificação nos mesmos pontos em que `descansoAtivo` já é
alterado (RF05), e a adição de `expo-notifications` como dependência (incluindo
entrada no `app.json`). Nenhuma nova tela, nenhuma nova rota.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. TypeScript Obrigatório**: PASS — todo o código novo (função de agendamento,
  configuração do handler, extensão da rota) é TypeScript estrito, sem `any`.
- **II. Simplicidade sobre Funcionalidades Avançadas no MVP**: PASS — a solução usa
  a API nativa de notificações locais do Expo diretamente, sem introduzir uma
  camada de abstração própria (ex.: um serviço genérico de "agendador de eventos").
  Não introduz persistência do agendamento em `AsyncStorage`: como o próprio
  cronômetro (RF05) já não sobrevive ao fechamento completo do app, o agendamento de
  notificação segue a mesma premissa — se o app for fechado por completo, o
  agendamento pode não sobreviver, e isso é aceito (mesmo limite de escopo do RF05,
  reafirmado na spec do RF06).
- **III. Validação em Dois Dispositivos-Alvo**: PASS — plano prevê validação manual
  Android + iOS via Expo Go (ver quickstart.md), incluindo os cenários de tela
  bloqueada e modo silencioso, que têm maior chance de divergir entre plataformas
  (comportamento de canal de notificação no Android vs. permissão no iOS).
- **IV. Controle de Dependências**: **Requer justificativa** — `expo-notifications`
  não está listado no PRD atual (seção 9, "Stack técnica"). Ver "Complexity
  Tracking" abaixo para a justificativa formal, exigida pela Constituição antes da
  implementação. Nenhuma outra dependência nova é introduzida.
- **V. Isolamento de Dados por Perfil (NON-NEGOTIABLE)**: PASS — a notificação
  agendada não carrega nem expõe nenhum dado de treino/sessão/histórico
  identificável por perfil (o conteúdo da notificação é genérico, ex.: "Descanso
  concluído"); nenhuma nova chave de storage é criada; o agendamento é puramente
  transitório e vinculado à execução em andamento, já isolada por perfil pelas
  features anteriores.

**Violação identificada**: introdução de `expo-notifications`, dependência não
listada no PRD atual. Ver justificativa em "Complexity Tracking".

## Project Structure

### Documentation (this feature)

```text
specs/008-notificacao-fim-descanso/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── _layout.tsx                     # MODIFICADO: chama a configuração do
│   │                                     handler de notificações
│   │                                     (`configurarNotificacoes`/
│   │                                     `Notifications.setNotificationHandler`)
│   │                                     uma única vez na inicialização do app
│   └── treino/
│       └── [treinoId].tsx              # RF05 — MODIFICADO: nos mesmos pontos em
│                                          que `descansoAtivo` é criado, ajustado
│                                          (+/-15s) ou zerado (RF05), passa a
│                                          também agendar/cancelar/reagendar a
│                                          notificação correspondente, guardando o
│                                          identificador retornado (estado irmão de
│                                          `descansoAtivo`, ex.: `notificacaoId`)
├── services/
│   └── notificacao-descanso.ts         # NOVO — funções que encapsulam a
│                                          interação com `expo-notifications`:
│                                          solicitar permissão (se necessário),
│                                          agendar a partir de um `fimEm`,
│                                          cancelar por identificador, e a
│                                          configuração do handler de exibição em
│                                          primeiro plano. Isolado dos utilitários
│                                          puros do RF05 (`src/utils/`) por
│                                          depender de uma API assíncrona/efeito
│                                          colateral (I/O com o sistema
│                                          operacional), diferente das funções
│                                          puras de cálculo de tempo já
│                                          existentes
└── (sem novos componentes de UI — o feedback visual de "descanso concluído" já
    existe via `emDescanso`/`descansoAtivo` do RF05; esta feature não adiciona
    nenhuma tela ou componente visual novo)
```

**Structure Decision**: Mantém a estrutura de projeto único já estabelecida
(RF01-RF05). Um novo módulo em `src/services/` (não em `src/utils/`) porque, ao
contrário das funções puras de `src/utils/cronometro-descanso.ts`, a interação com
`expo-notifications` é assíncrona e depende de um sistema externo (o SO) — o mesmo
critério já usado pelo projeto para separar `src/services/` (I/O: storage, sessões)
de `src/utils/` (lógica pura), conforme documentado no plano do RF05. A configuração
do handler de notificações vive em `src/app/_layout.tsx` por ser um efeito de
inicialização global do app, não específico da rota de execução de treino — mesmo
padrão já usado para outras configurações globais de inicialização nesse arquivo.
Nenhuma nova rota; extensão da rota já existente do RF05, seguindo o mesmo ponto de
alteração de estado (`descansoAtivo`) já estabelecido.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| Nova dependência `expo-notifications`, não listada na seção 9 do PRD atual | O requisito arquitetural central do RF06 (aviso funcionar com o app minimizado ou tela bloqueada) é impossível de satisfazer apenas com código JavaScript reagindo ao evento `onDescansoConcluido` do RF05, porque o próprio RF05 já estabeleceu que o JS do app é suspenso (Hermes suspenso) enquanto o processo está em segundo plano — não há como um `setTimeout`/callback em JS disparar nesse estado. `expo-notifications` é a biblioteca oficial do ecossistema Expo (já usado pelo projeto — ver `expo`, `expo-router`, `expo-document-picker`, etc. na Stack técnica) para agendar avisos que o próprio sistema operacional dispara, independentemente do estado do processo JS, exatamente o mecanismo exigido por este requisito. | Reagir apenas ao evento `onDescansoConcluido` em JavaScript (sem nenhuma biblioteca nova): rejeitado — é tecnicamente impossível de cumprir a User Story 2 e o FR-003/FR-001 desta spec, dado o limite arquitetural já registrado pelo RF05 (JS suspenso em segundo plano); usar um som tocado via JS (`expo-av`/`expo-audio`) sozinho, sem notificação do SO: rejeitado pelo mesmo motivo — o som só tocaria se o JS estivesse rodando, o que não é garantido com o app minimizado ou a tela bloqueada; implementar um módulo nativo customizado para agendamento de alarme: rejeitado por complexidade desnecessária (Princípio II) — `expo-notifications` já resolve o problema dentro do SDK gerenciado do Expo já em uso pelo projeto, sem exigir código nativo customizado ou ejeção do modo gerenciado. |

## Riscos Conhecidos

> Registrados explicitamente para não serem presumidos como resolvidos "porque a
> biblioteca cuida disso". Ver research.md, Decisão 8, para o detalhamento completo.

### Risco 1: Precisão de disparo no Android 12+ depende de `SCHEDULE_EXACT_ALARM`, não verificável via Expo Go puro

**Descrição**: SC-002 exige que o aviso dispare dentro de uma margem de poucos
segundos do horário `fimEm`. No Android 12 (API 31)+, o sistema operacional só
garante essa precisão para alarmes tratados como "exatos" — sujeitos à permissão
`SCHEDULE_EXACT_ALARM` (declarada no `AndroidManifest.xml` nativo do app, ou
concedida pelo usuário via "Alarmes e lembretes" nas configurações do sistema).
Alarmes não-exatos podem ser adiados em minutos pelo Doze mode/otimizações de
bateria, especialmente com o aparelho parado e a tela bloqueada por um período
prolongado antes do horário de disparo.

**Impacto no escopo desta feature**: declarar essa permissão no manifesto nativo
normalmente exige um development build (`expo prebuild` + build nativo, ou EAS
Build) — o Expo Go roda com o manifesto fixo do próprio cliente Expo Go, então essa
configuração **não pode ser adicionada nem verificada em runtime testando apenas
via Expo Go**, que é o ambiente de teste usado por este projeto (Constituição,
Princípio III, e já estabelecido pelo RF05).

**Mitigação adotada nesta feature**: nenhuma — o risco é aceito e documentado, não
resolvido. O impacto prático tende a ser baixo para o uso real do app (o aparelho
normalmente está em uso ativo, recém-manuseado ao concluir uma série, sem tempo de
entrar em Doze mode profundo antes de um descanso de duração tipicamente curta),
mas isso **MUST ser observado explicitamente na validação manual** (ver
quickstart.md) em vez de presumido. Se a validação manual revelar atrasos
perceptíveis e inaceitáveis, a mitigação (migrar para development build para
declarar `SCHEDULE_EXACT_ALARM`) é uma decisão de escopo maior, a ser tomada
explicitamente em uma iteração futura — não implícita a este RF06.

### Risco 2: Comportamento de entrega em segundo plano pode variar entre dispositivos/fabricantes Android — **CONFIRMADO em teste manual real**

**Descrição**: Fabricantes Android com customizações agressivas de gerenciamento
de bateria (comuns em aparelhos como o Redmi Note 12, um dos dois aparelhos-alvo
deste projeto) podem impor restrições adicionais além do Doze mode padrão do
Android (ex.: encerrar processos em segundo plano de forma mais agressiva que o
AOSP), o que pode, em casos extremos, afetar a confiabilidade de entrega de
notificações agendadas.

**Confirmação (validação manual, Redmi Note 12)**: este risco deixou de ser
hipotético. Com `SCHEDULE_EXACT_ALARM` concedida e notificações do app
ativadas, o delay do aviso com a tela bloqueada permaneceu significativo, e a
vibração parou de funcionar por completo — até a restrição de bateria/
autostart do MIUI/HyperOS ser liberada manualmente para o app em
`Configurações > Bateria > Uso de bateria do app` e `Configurações > Apps >
Permissões > Autostart`. Após liberar, o comportamento esperado passou a
ocorrer integralmente (sem delay perceptível, com ou sem tela bloqueada,
vibração funcionando). Ver research.md, Decisão 9, para o relato completo do
diagnóstico.

**Mitigação adotada nesta feature**: nenhuma mitigação de código — este é um
comportamento de sistema fora do controle do app, e não existe API pública
padronizada do Android para o app detectar ou contornar essa restrição de
forma confiável entre fabricantes. A mitigação real é **operacional**: o
`quickstart.md` (seção "Pré-requisitos" e Cenário 9) agora documenta
explicitamente a checklist de configuração do aparelho (permissões de
notificação + alarme exato + liberação de bateria/autostart em aparelhos
Xiaomi) que deve ser satisfeita antes de considerar um atraso como bug de
implementação.
