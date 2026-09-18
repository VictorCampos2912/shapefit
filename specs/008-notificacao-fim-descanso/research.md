# Research: Notificação de Fim do Descanso

O usuário já especificou explicitamente a biblioteca (`expo-notifications`), o tipo
de trigger (data absoluta, não segundos/repetição), a estratégia de cancelamento e o
ponto crítico do handler de primeiro plano. As decisões abaixo documentam a API
exata usada e como ela se encaixa nos pontos de extensão já estabelecidos pelo RF05.

> **Nota sobre a fonte desta pesquisa**: `AGENTS.md` exige consultar a documentação
> versionada do Expo (`https://docs.expo.dev/versions/v57.0.0/`) antes de escrever
> código. Nesta sessão, a busca automatizada não conseguiu carregar diretamente a
> página fixada na versão v57.0.0 (falha de ferramenta), então os achados abaixo
> foram cross-referenciados a partir da documentação `latest`/`unversioned` do
> Expo, do código-fonte de `docs/pages/versions/unversioned/sdk/notifications.mdx`
> no repositório `expo/expo`, e de issues do GitHub que discutem especificamente o
> comportamento em SDK 53+/57. Os nomes centrais (`scheduleNotificationAsync`,
> `cancelScheduledNotificationAsync`, `setNotificationHandler`,
> `SchedulableTriggerInputTypes.DATE`, `requestPermissionsAsync`,
> `setNotificationChannelAsync`) são estáveis e consistentes entre essas fontes.
> **Ação de acompanhamento antes da implementação**: fazer uma confirmação manual
> pontual (um dev abrindo `https://docs.expo.dev/versions/v57.0.0/sdk/notifications/`
> no navegador) apenas para validar que não houve renomeação entre v57.0.0 e
> `latest` nos três pontos tratados como achados firmes abaixo (Decisões 4, 6 e 8) —
> essas três decisões usam nomes de API já confirmados (não apenas assumidos) pela
> pesquisa cross-referenciada desta sessão, mas a fonte primária pinada da versão
> não pôde ser carregada por falha de ferramenta, então o item permanece como
> checagem de baixo risco antes de codificar, não como um `NEEDS CLARIFICATION`
> bloqueante.

## Decisão 0 (correção pós-implementação): `expo-notifications` não roda no Expo Go/Android — migração para EAS development build

**Achado durante a implementação (não previsto no research original)**: ao rodar o
app em Expo Go no Android após implementar T001-T014, o app quebra
imediatamente na inicialização com:

```
[Error: expo-notifications: Android Push notifications (remote notifications)
functionality provided by expo-notifications was removed from Expo Go with the
release of SDK 53. Use a development build instead of Expo Go. Learn more at
https://docs.expo.dev/develop/development-builds/introduction/.]
  at <global> (src/services/notificacao-descanso.ts:1)
  at <global> (src/app/_layout.tsx:8)
```

**Causa raiz** (confirmada lendo o código-fonte instalado em
`node_modules/expo-notifications/build/`): o próprio módulo de entrada
(`index.js`) re-exporta `DevicePushTokenAutoRegistration.fx.js`, que executa em
**module scope** (não dentro de nenhuma função) um bloco
`if (ServerRegistrationModule.getRegistrationInfoAsync) { addPushTokenListener(...) }`.
No Android nativo, `ServerRegistrationModule` sempre expõe esse método (é um
módulo nativo real via `requireNativeModule`), então esse bloco sempre executa
assim que o pacote é importado — chamando `addPushTokenListener`, que por sua
vez chama `warnOfExpoGoPushUsage()`
(`node_modules/expo-notifications/build/warnOfExpoGoPushUsage.js`), que **lança
uma exceção no Android quando `isRunningInExpoGo()` é verdadeiro** (no iOS e
web, o mesmo caminho apenas emite um `console.warn`, sem lançar).

Isso significa que **qualquer** `import * as Notifications from
'expo-notifications'` quebra o app inteiro no Expo Go/Android — não há como
evitar isso usando só as APIs de notificação local (`scheduleNotificationAsync`
etc.); o crash ocorre antes mesmo de qualquer função ser chamada, só pelo
efeito colateral de nível de módulo do caminho de auto-registro de push.

**Correção da suposição original desta pesquisa**: a Decisão original (nesta
seção, antes desta correção) afirmava, com base em fontes cross-referenciadas
(não a documentação pinada v57.0.0), que "notificações locais agendadas
permanecem totalmente suportadas no Expo Go". **Essa suposição estava errada
para Android** — a limitação de SDK 53+ não se restringe a push remoto; o
próprio import do pacote é incompatível com o processo do Expo Go no Android,
independentemente de qual função é chamada depois. (No iOS, o mesmo código
apenas gera um aviso no console, sem lançar — a diferença de comportamento por
plataforma está no próprio `warnOfExpoGoPushUsage.js`.)

**Decision (correção de rumo)**: migrar o fluxo de teste do RF06 de Expo Go
para um **EAS development build** (`expo-dev-client` + `eas build --profile
development --platform android`), conforme já cogitado como risco/mitigação
futura na Decisão 8 original (risco de `SCHEDULE_EXACT_ALARM`) — a diferença é
que agora essa migração deixou de ser opcional/futura e passou a ser
**obrigatória** para que o RF06 funcione no Android, mesmo no cenário mais
básico (User Story 1, app em primeiro plano). Passos:
- `expo-dev-client` adicionado às dependências.
- `eas.json` criado com profile `development` (`developmentClient: true`,
  `distribution: internal`, `android.buildType: apk`).
- `app.json` recebeu `android.package` e `ios.bundleIdentifier`
  (`com.shapefit.app`), exigidos pelo EAS Build e permanentes após o primeiro
  build/publicação.
- Build disparado via `eas build --profile development --platform android`.

**Impacto em outras features (RF01-RF05)**: nenhuma mudança de comportamento
esperada — elas não usam nenhuma API restrita pelo Expo Go; o development
build ainda roda o mesmo JavaScript bundle, apenas com um binário nativo
diferente (compilado com `expo-notifications` incluído) em vez do cliente
genérico do Expo Go. A partir deste ponto, porém, a validação manual em
dispositivo (Constituição, Princípio III) passa a exigir instalar o APK gerado
pelo EAS no Redmi Note 12, em vez de abrir o projeto no app Expo Go — esse é um
ponto de atenção para o quickstart.md e para qualquer feature futura, não só o
RF06.

**Segundo achado durante a migração (erro de configuração do EAS Build, não
relacionado a `expo-notifications`)**: o primeiro disparo de
`eas build --profile development --platform android` falhou na fase
`INSTALL_DEPENDENCIES` com:

```
npm error `npm ci` can only install packages when your package.json and
package-lock.json or npm-shrinkwrap.json are in sync. Please update your lock
file with `npm install` before continuing.
npm error Missing: typescript@5.9.3 from lock file
```

**Causa raiz**: `eas-cli` havia sido adicionado como `devDependency` do projeto
(`npm install --save-dev eas-cli`, para poder rodar `npx eas-cli` localmente).
Uma dependência transitiva de `eas-cli` (`@expo/require-utils`, usada por
`@expo/config` e por `ts-node`/`@oclif/core`) declara
`peerDependencies.typescript: "^5.0.0 || ^5.0.0-0"` — uma faixa incompatível
com o `typescript@~6.0.3` já usado pelo projeto (via `eslint-config-expo` e
`tsconfig`). O `npm install` local tolerou essa incompatibilidade
silenciosamente, apenas *deduplicando* (reaproveitando) o `typescript@6.0.3`
do topo da árvore mesmo fora do range aceito por essa dependência transitiva
(reportado como `invalid` por `npm ls`, mas sem impedir o `install`). O
`npm ci` usado pelo EAS Build, porém, é estrito: recusa instalar quando o
lockfile não reflete uma resolução válida para todos os `peerDependencies`
declarados, e reporta a ausência de uma cópia de `typescript@5.9.3` (a
versão que satisfaria aquele range) como se fosse uma dependência realmente
"faltando" do lockfile.

**Decision (correção)**: remover `eas-cli` de `package.json`
(`npm uninstall eas-cli`) — não deveria ter sido adicionado como dependência
do projeto em primeiro lugar. `eas-cli` é uma ferramenta de linha de comando
usada pontualmente para disparar builds, não uma dependência de runtime nem de
build do próprio app; deve ser invocada via `npx eas-cli <comando>` (que a
baixa temporariamente, sem registrá-la em `package.json`/`package-lock.json`),
ou instalada globalmente na máquina de quem opera os builds, nunca como
dependência do projeto em si. Após a remoção, `npm ci --include=dev` local
passou a completar sem erros (854 pacotes instalados, nenhuma inconsistência
de `peerDependencies` reportada), confirmando que a causa raiz era
especificamente essa dependência mal-colocada, não `expo-notifications` nem
`expo-dev-client` (ambos permanecem em `dependencies`, como esperado).

**Alternatives considered**:
- Fixar a versão de `typescript` do projeto para `^5.x` para satisfazer o
  range de `eas-cli`: rejeitado — downgrade desnecessário e arriscado do
  TypeScript usado por todo o projeto só para acomodar uma ferramenta de CLI
  que não deveria nem estar listada como dependência.
- Usar `npm install` (em vez de `npm ci`) na configuração do EAS Build para
  tolerar a mesma inconsistência que o ambiente local tolera: não avaliado
  como opção real — o comando usado pelo EAS Build (`npm ci`) não é
  configurável pelo `eas.json` nesta versão, e mesmo que fosse, apenas
  mascararia a causa raiz (uma dependência de dev desnecessária no projeto)
  em vez de corrigi-la.

**Alternatives considered**:
- Import dinâmico/lazy de `expo-notifications` só quando necessário, evitando
  o import estático no topo do arquivo: rejeitado — o efeito colateral está no
  próprio `index.js` do pacote (nível de módulo), então qualquer `import`
  (estático ou dinâmico via `require`/`import()`) dispara o mesmo código;
  isolar em um `try/catch` ao redor do import é tecnicamente possível, mas é
  uma gambiarra não documentada oficialmente pelo Expo, frágil a atualizações
  do pacote, e ainda deixaria o RF06 sem funcionar de fato no Expo Go (o
  módulo simplesmente não carregaria) — não resolve o requisito, apenas evita o
  crash às custas de uma feature inteira não funcionar.
- Manter Expo Go e aceitar que o RF06 só é validável no iOS (onde o mesmo
  código apenas gera um warning): rejeitado — o requisito é multiplataforma
  (Redmi Note 12 é um dos dois aparelhos-alvo obrigatórios pela Constituição,
  Princípio III); não teria como validar a User Story 1/2 no Android sem o dev
  build.
- Reverter `expo-notifications` e buscar uma biblioteca alternativa compatível
  com Expo Go puro: rejeitado — nenhuma alternativa dentro do ecossistema
  gerenciado do Expo agenda notificações do SO de forma equivalente sem
  depender de módulos nativos que teriam a mesma restrição fundamental
  (SDK gerenciado do Expo Go não pode carregar código nativo arbitrário desde
  sempre — a mudança do SDK 53 apenas tornou isso explícito para push, mas o
  princípio já se aplicava a qualquer módulo nativo customizado).

**Terceiro achado durante a validação manual no development build (Android)**:
com o APK do development build instalado e funcionando (sem o crash da
Decisão 0), o app passou a exibir o erro nativo
`expo-notifications: Custom sound 'default' not found in native app.` na
primeira execução, e nas execuções seguintes o alerta simplesmente não
disparava mais com o app em primeiro plano (só ao minimizar ou navegar para
outra tela do próprio app — comportamento visualmente parecido com "às vezes
funciona"). Investigado lendo o código nativo Android do pacote
(`android/.../channels/managers/AndroidXNotificationsChannelManager.java` e
`NotificationChannelManagerModule.kt`).

**Causa raiz**: o código deste RF06 passava `sound: 'default'` para
`Notifications.setNotificationChannelAsync`. No Android, esse campo é tratado
como o **nome de um arquivo de som customizado** a resolver via
`mSoundResolver.resourceExists(filename)` — a string literal `'default'` não é
um valor mágico reconhecido nesse contexto (diferente do `content.sound` da
API JS de mais alto nível, onde `'default'` *é* um valor especial, mas esse é
o campo de conteúdo da notificação individual, não o do canal). Quando a
chave `sound` está simplesmente **ausente** do objeto passado ao canal, o
código nativo usa `Settings.System.DEFAULT_NOTIFICATION_URI` (o som padrão
real do sistema); quando ela está presente com um valor que não corresponde a
um recurso de som embutido no app, o pacote loga um erro nativo e (nas
execuções seguintes) o canal fica em um estado inconsistente, explicando por
que o alerta parou de dar sinal em primeiro plano após a primeira tentativa.
Contribuiu para a confusão o fato de canais de notificação Android serem
**imutáveis** depois de criados (a maioria dos atributos, incluindo o som, não
pode ser alterada por uma chamada subsequente a `setNotificationChannelAsync`
com o mesmo `channelId`) — então mesmo corrigindo o código, o canal já criado
com a configuração quebrada continuaria "preso" nela no aparelho de teste até
ser explicitamente recriado sob um novo identificador.

**Decision (correção)**: remover completamente o campo `sound` do objeto
passado a `setNotificationChannelAsync` (deixando implícito o som padrão do
sistema, que é o comportamento desejado — nenhum som customizado é usado por
esta feature) e renomear o identificador do canal de `'descanso'` para
`'descanso-v2'`, forçando o Android a criar um canal novo do zero (limpo) em
vez de reaproveitar o canal antigo já criado com a configuração inválida nos
aparelhos onde o app já havia rodado antes desta correção.

**Alternatives considered**:
- Manter `sound: 'default'` e adicionar um arquivo de som real chamado
  `default` ao projeto (via config plugin do `expo-notifications`): rejeitado
  — desnecessário; o requisito é apenas "som + vibração", satisfeito pelo som
  padrão do sistema, sem necessidade de um asset de som customizado
  (Princípio II — simplicidade no MVP).
- Deletar/atualizar o canal antigo (`'descanso'`) programaticamente via
  `Notifications.deleteNotificationChannelAsync('descanso')` antes de criar o
  novo, mantendo o mesmo nome de canal: avaliado como alternativa válida, mas
  rejeitado em favor de simplesmente trocar o identificador — mais simples,
  sem exigir uma chamada de exclusão condicional adicional na inicialização
  do app, e sem risco de a exclusão falhar silenciosamente em versões mais
  antigas do Android.

**Quarto achado durante a mesma validação manual (vibração não ocorria, com o
aparelho fora do modo silencioso o som já funcionava)**: após a correção do
som, o usuário reportou que, tirando o aparelho do modo silencioso, o som
passou a tocar corretamente, mas a vibração parou de ocorrer — tanto com o
app em outra tela quanto com a tela bloqueada.

**Causa raiz**: confirmada lendo
`android/.../channels/managers/AndroidXNotificationsChannelManager.java`
(método que aplica as opções do canal): `vibrationPattern` e `enableVibrate`
são dois campos **independentes** na API nativa do Android
(`android.app.NotificationChannel`) — `channel.setVibrationPattern(...)`
apenas define *qual* padrão usar **se** a vibração estiver habilitada, mas não
a habilita sozinho; é `channel.enableVibration(true)` (mapeado pelo campo
`enableVibrate` do pacote) quem efetivamente liga a vibração no canal. Como
este RF06 só passava `vibrationPattern`, sem `enableVibrate: true`, o canal
Android criado nunca tinha a vibração habilitada — o padrão nativo de um
`NotificationChannel` recém-criado é `enableVibration = false`.

**Decision (correção)**: adicionar `enableVibrate: true` ao objeto passado a
`setNotificationChannelAsync`, junto do `vibrationPattern` já existente, e
renomear novamente o identificador do canal (de `'descanso-v2'` para
`'descanso-v3'`) para forçar a recriação limpa nos aparelhos de teste — pelo
mesmo motivo de imutabilidade de canais já registrado no achado anterior.

**Alternatives considered**:
- Assumir que `vibrationPattern` sozinho seria suficiente para habilitar a
  vibração (suposição original, não verificada contra o código nativo antes
  desta correção): refutado diretamente pelo comportamento observado no
  dispositivo físico e pela leitura do código-fonte nativo — os dois campos
  são de fato independentes na API Android subjacente.

## Decisão 1: Trigger de agendamento por data absoluta (`SchedulableTriggerInputTypes.DATE`)

**Decision**: A notificação é agendada com
`Notifications.scheduleNotificationAsync({ content, trigger })`, onde `trigger` é
`{ type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(fimEm) }` —
usando diretamente o mesmo `fimEm` (epoch ms) já mantido por `descansoAtivo.fimEm`
(RF05), sem nenhuma conversão para "segundos a partir de agora".

**Rationale**: Pedido explícito do usuário ("Date type trigger, não
seconds/repeating"). Usar um trigger de duração relativa (`{ seconds: N }`) exigiria
recalcular `N = (fimEm - Date.now()) / 1000` toda vez que o agendamento é recriado —
tecnicamente equivalente no instante do cálculo, mas introduz uma fonte adicional de
arredondamento/drift a cada reagendamento, e duplica a lógica de "quanto falta" que
já existe em `calcularSegundosRestantes` (RF05) para outro propósito (exibição, não
agendamento). Usar diretamente `fimEm` como data absoluta elimina essa duplicação: o
agendamento sempre aponta exatamente para o mesmo instante que a UI já está
exibindo como término.

**Alternatives considered**:
- Trigger `{ seconds: N, repeats: false }`: rejeitado explicitamente pelo usuário e
  por introduzir recomputação de duração relativa a cada reagendamento, quando o
  projeto já possui a data absoluta pronta (`fimEm`).
- Trigger `{ seconds: N, repeats: true }` (repetição): não se aplica — o aviso é um
  evento único por descanso, nunca recorrente.

## Decisão 2: Cancelamento explícito antes de reagendar, usando o identificador retornado

**Decision**: `scheduleNotificationAsync` retorna uma `string` (identificador da
notificação agendada). Esse identificador é guardado em memória, como um estado
irmão de `descansoAtivo` na rota (ex.: `notificacaoId: string | null`). Sempre que
`descansoAtivo` é recriado ou ajustado (RF05: novo `onIniciarDescanso`, +15s, -15s,
substituição por nova série concluída) ou zerado (descanso concluído/cancelado), o
identificador anterior — se existir — é passado para
`Notifications.cancelScheduledNotificationAsync(id)` **antes** de um novo
agendamento ser criado (quando aplicável).

**Rationale**: Pedido explícito do usuário ("cancelar o agendamento anterior... antes
de agendar o novo"). Espelha exatamente a garantia já estabelecida pelo RF05 de nunca
haver mais de um cronômetro ativo simultâneo (FR-011) — aqui, nunca mais de uma
notificação pendente simultânea. Sem esse cancelamento, um ajuste de "-15s" logo após
iniciar o descanso deixaria a notificação original (calculada para o `fimEm` mais
longo) pendente, disparando no horário errado além da nova, criando dois avisos.

**Alternatives considered**:
- Deixar a notificação antiga expirar sozinha e simplesmente ignorar seu disparo
  (ex.: checando uma flag no momento em que ela dispararia): rejeitado — a
  notificação antiga ainda tocaria som/vibraria no horário errado, mesmo que a UI já
  estivesse "correta"; o requisito explícito é evitar esse disparo espúrio,
  cancelando de fato o agendamento no sistema operacional.

## Decisão 3: Reagendamento imediato quando o ajuste resulta em tempo zero/negativo

**Decision**: Se um ajuste de "-15s" (RF05, FR-005) resultar em `fimEm` no passado
(ou igual a "agora"), a notificação é cancelada e um novo agendamento é criado com
`date` igual ao instante atual (ou a chamada de agendamento é pulada e o aviso
sonoro/vibração é disparado localmente pelo mesmo caminho usado quando o app está em
primeiro plano) — nunca um agendamento para uma data já passada, que se comportaria
de forma inconsistente entre plataformas.

**Rationale**: Atende à FR-007 da spec ("reagendar o aviso para disparar
imediatamente"). Um trigger de data no passado tem comportamento não documentado de
forma consistente entre Android/iOS nas fontes consultadas; a abordagem mais segura
é tratar esse caso como "já venceu" e disparar o caminho de conclusão imediata (o
mesmo já usado pelo RF05 quando `calcularSegundosRestantes` retorna zero), sem
depender do agendamento de notificação para esse caso-limite específico.

**Alternatives considered**:
- Agendar mesmo assim com uma data já passada, confiando que o SO dispara "logo em
  seguida": rejeitado por incerteza de comportamento entre plataformas nas fontes
  consultadas; a spec já define que o resultado de tempo zero/negativo é tratado
  como "concluído" pelo próprio RF05 (FR-005), então o caminho mais simples é
  reaproveitar esse mesmo tratamento aqui, sem introduzir um caso especial de
  agendamento "quase no passado".

## Decisão 4: Handler de notificação em primeiro plano configurado explicitamente

**Decision**: Na inicialização do app (`src/app/_layout.tsx`), antes de qualquer
agendamento ocorrer, `Notifications.setNotificationHandler({ handleNotification })`
é chamado uma única vez, retornando explicitamente:

```ts
{
  shouldShowBanner: true,
  shouldShowList: true,
  shouldPlaySound: true,
  shouldSetBadge: false,
}
```

**Achado da pesquisa (correção em relação à instrução original)**: o usuário
sugeriu originalmente `shouldShowAlert: true`. A pesquisa cross-referenciada
confirma que esse campo está **depreciado** nas versões recentes do SDK (incluindo
SDK 57) e foi substituído por dois campos separados — `shouldShowBanner` (exibição
heads-up/banner enquanto o app está em primeiro plano) e `shouldShowList` (se a
notificação aparece na lista/central de notificações). Usar apenas
`shouldShowAlert` (nome antigo) arrisca ser ignorado silenciosamente pela versão
instalada, deixando a notificação sem exibição visual mesmo com o som configurado
corretamente. Este plano usa `shouldShowBanner` + `shouldShowList` em vez do
`shouldShowAlert` depreciado.

**Rationale**: Pedido explícito do usuário, com justificativa técnica correta: o
comportamento padrão do `expo-notifications`, quando nenhum handler é configurado,
suprime a exibição (e, historicamente, o som) de notificações recebidas enquanto o
app está em primeiro plano — behavior pensado originalmente para push notifications,
onde o app já pode reagir via JS sem precisar de um alerta do sistema. Como este
requisito precisa do aviso sonoro **mesmo com o app aberto** (User Story 1), a
ausência dessa configuração faria a User Story 1 falhar silenciosamente, mesmo que
o agendamento em si (User Story 2, app minimizado) estivesse correto — os dois
cenários usam o mesmo mecanismo de notificação agendada, divergindo apenas em como
o SO decide exibi-la dependendo do estado do app no momento do disparo.

**Alternatives considered**:
- Não configurar o handler, assumindo que notificações agendadas sempre tocam som
  independentemente do estado do app: rejeitado — é exatamente o comportamento
  padrão documentado que este requisito precisa sobrescrever; ignorá-lo produziria
  um bug specificamente na User Story 1 (app aberto), o cenário mais fácil de testar
  e, por isso, o mais fácil de erroneamente assumir como "já funcionando".
- Tocar um som customizado via JS (`expo-av`) apenas quando o app está em primeiro
  plano, complementando a notificação do SO usada só para segundo plano: rejeitado
  por complexidade desnecessária (Princípio II) — duplicaria a lógica de som em dois
  mecanismos diferentes (JS quando em primeiro plano, SO quando em segundo plano)
  quando configurar o handler corretamente já faz o mecanismo único (notificação do
  SO) funcionar em ambos os casos.

## Decisão 5: Permissão solicitada no primeiro agendamento, sem onboarding dedicado

**Decision**: `Notifications.requestPermissionsAsync()` é chamado apenas na
primeira vez que a função de agendamento do RF06 é invocada (primeiro cronômetro de
descanso da sessão do app), verificando antes com `getPermissionsAsync()` para não
solicitar novamente se já concedida (ou já negada permanentemente). Se a permissão
for negada, a função de agendamento simplesmente não cria a notificação (retorna sem
erro/exceção não tratada) — o restante do fluxo (cronômetro, UI de "descanso
concluído" ao chegar a zero) continua funcionando normalmente, pois depende apenas
do cálculo de tempo do RF05, não da notificação.

**Rationale**: Pedido explícito do usuário. Consistente com a Assumption já
registrada na spec (FR-009): a notificação é um mecanismo de aviso, não a fonte da
verdade sobre o descanso ter terminado. Não introduzir uma tela de onboarding
dedicada mantém a solução alinhada ao Princípio II (simplicidade no MVP) — a
concessão de permissão de notificação é uma interação padrão do sistema operacional,
não uma tela própria do app.

**Alternatives considered**:
- Bloquear o início do treino/exercício até a permissão ser concedida: rejeitado —
  contraria explicitamente a instrução do usuário ("degradar graciosamente sem
  bloquear o app") e o Princípio II; a permissão de notificação não é essencial ao
  funcionamento central do app (registrar séries), apenas a um aviso complementar.
- Solicitar a permissão na inicialização do app (antes de qualquer treino):
  rejeitado — o usuário pediu explicitamente que a solicitação ocorra "no momento
  do primeiro agendamento", não antes; solicitar cedo demais, fora de contexto,
  tende a gerar mais recusas do usuário (prática já desaconselhada pela própria
  documentação do Expo, embora não citada aqui como fonte primária desta decisão,
  já que a decisão em si veio da instrução explícita do usuário).

## Decisão 6: Canal de notificação Android (`setNotificationChannelAsync`, `importance: MAX`, criado antes de qualquer agendamento)

**Decision**: Um canal de notificação Android dedicado (ex.: `"descanso"`) é
configurado com `Notifications.setNotificationChannelAsync` **dentro de**
`configurarNotificacoesDescanso()` — a mesma função chamada uma única vez na
inicialização do app (`src/app/_layout.tsx`), apenas quando `Platform.OS ===
'android'` — e portanto sempre **antes** de qualquer chamada a
`agendarNotificacaoDescanso`/`scheduleNotificationAsync`, nunca configurado sob
demanda no momento do primeiro agendamento:

```ts
await Notifications.setNotificationChannelAsync('descanso', {
  name: 'Fim do descanso',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  sound: 'default',
  lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
});
```

O identificador do canal (`'descanso'`) é passado explicitamente no `content` de
cada chamada a `scheduleNotificationAsync` (campo `channelId`), para garantir que a
notificação agendada use este canal, e não o canal "default" implícito da
biblioteca.

**Rationale (achado da pesquisa)**: no Android 8+, o volume de som e o
comportamento de vibração/heads-up de uma notificação são controlados pelo canal a
que ela pertence, não por propriedades soltas na notificação individual — e um
canal criado com importância insuficiente (ou o canal "default" implícito, cuja
importância não é garantida como alta) pode entregar a notificação silenciosamente,
sem som nem heads-up, mesmo que o conteúdo da notificação peça som. Como o
requisito central deste RF06 é som+vibração simultâneos e perceptíveis mesmo com a
tela bloqueada, `importance: AndroidImportance.MAX` é usado explicitamente (o nível
mais alto disponível, necessário para heads-up + som mesmo com a tela bloqueada),
em vez de confiar em um canal implícito de importância não garantida. A criação do
canal precisa ocorrer antes do primeiro agendamento porque, no Android, agendar uma
notificação para um canal que ainda não existe resulta em comportamento
indefinido/notificação sem as propriedades do canal pretendido — daí a decisão de
configurá-lo na inicialização do app, e não sob demanda dentro da própria função de
agendamento.

**Alternatives considered**:
- Não configurar nenhum canal, confiando no canal "default" criado implicitamente
  pela biblioteca: rejeitado — a importância desse canal implícito não é garantida
  como `MAX`/`HIGH`, o que arrisca violar o requisito central da feature (som e
  vibração perceptíveis, inclusive com tela bloqueada) de forma silenciosa, sem
  nenhum erro que alerte sobre a causa.
- Configurar o canal sob demanda, dentro de `agendarNotificacaoDescanso`, apenas
  antes do primeiro agendamento em vez de na inicialização do app: rejeitado —
  mais frágil, pois exigiria checar/recriar o canal a cada chamada de agendamento
  em vez de garantir a configuração uma única vez, de forma centralizada, junto do
  handler de primeiro plano (Decisão 4).
- Usar `importance: HIGH` em vez de `MAX`: `HIGH` já habilita som e heads-up na
  maioria dos casos, mas `MAX` é o nível mais alto documentado e elimina qualquer
  ambiguidade quanto a heads-up com a tela bloqueada — dado que este é
  explicitamente o cenário mais crítico do requisito (User Story 2), a escolha mais
  conservadora (`MAX`) é preferida.

## Decisão 7: Respeito ao modo silencioso do sistema (sem controle de volume pelo app)

**Decision**: O app não define, força ou lê o volume/modo de som do aparelho — o som
da notificação é entregue pelo sistema operacional através do canal de notificação
(Android) ou da configuração padrão de som do app (iOS), que já respeitam
nativamente o modo silencioso/não perturbe configurado pelo usuário. A vibração,
por sua vez, é definida explicitamente no canal de notificação (Android) e no
conteúdo da notificação (quando aplicável no iOS), pois o requisito é que ela
ocorra **mesmo** em modo silencioso.

**Rationale**: Atende a FR-004/FR-005 da spec diretamente: notificações do sistema
operacional já implementam a política de "som suprimido em modo silencioso, mas
vibração pode continuar" nativamente — não há necessidade (nem seria desejável) de o
app tentar reimplementar essa lógica lendo o estado do modo silencioso do aparelho,
algo que, além de desnecessário, tem suporte de API limitado/inconsistente entre
Android e iOS para leitura direta pelo app.

**Alternatives considered**:
- Tocar um som customizado via `expo-av`/`expo-audio` verificando manualmente o
  volume do sistema antes: rejeitado — API de leitura de volume do sistema não é
  parte do fluxo padrão de notificações e adicionaria uma dependência e lógica
  desnecessárias (Princípio II) para replicar um comportamento que a notificação do
  SO já garante nativamente.

## Decisão 8: Precisão do horário de disparo no Android 12+ (`SCHEDULE_EXACT_ALARM`) — risco conhecido, não silenciosamente ignorado

**Decision**: No Android 12 (API 31)+, o sistema operacional distingue alarmes
"exatos" (disparam no segundo certo, mesmo sob Doze mode) de alarmes normais
(sujeitos a adiamento/agrupamento pelo Doze mode e por otimizações de bateria, que
podem atrasar o disparo em minutos). Para que o aviso de fim de descanso dispare
com a precisão de poucos segundos exigida por SC-002 (não apenas "eventualmente"),
o agendamento precisa ser tratado como um alarme exato, o que no Android 12+
depende da permissão `SCHEDULE_EXACT_ALARM` (ou do usuário conceder "Alarmes e
lembretes" nas configurações do sistema para o app). Este plano assume que
`expo-notifications` solicita/usa essa capacidade quando disponível, mas registra
explicitamente como **risco conhecido**, não resolvido por código nesta feature,
o cenário abaixo.

**Rationale**: Pedido explícito do usuário — este ponto impacta diretamente
SC-002 ("o aviso dispara dentro de uma margem de poucos segundos do horário real
de término"), então não pode ficar implícito ou presumido como "resolvido pela
biblioteca" sem verificação.

**Risco conhecido (não resolvido por esta feature) — ver também plan.md,
seção "Riscos Conhecidos"**:

- A API nativa Android para declarar essa necessidade
  (`<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />` no
  `AndroidManifest.xml`, ou o uso de `AlarmManager.setExactAndAllowWhileIdle`
  internamente pela biblioteca) normalmente exige um **development build**
  customizado (`expo prebuild` + build nativo, ou EAS Build) para que a permissão
  seja declarada no manifesto do app — **não é algo configurável ou verificável
  em runtime dentro do Expo Go puro**, já que o Expo Go roda com o manifesto fixo
  do próprio cliente Expo Go, não o do app em desenvolvimento.
- Isso significa que, **testando via Expo Go** (conforme a Constituição, Princípio
  III, e conforme já estabelecido pelo RF05), não há garantia de que o agendamento
  se comporte como um alarme exato no Android 12+ — o sistema pode tratá-lo como
  um alarme sujeito a Doze mode, adiando o disparo em minutos em vez de segundos,
  especialmente se o aparelho estiver parado, com a tela bloqueada, por um tempo
  prolongado antes do horário `fimEm`.
- Como o cenário de descanso é tipicamente curto (segundos a poucos minutos) e o
  aparelho normalmente está em uso ativo (o usuário acabou de tocar em "Concluir
  série" e o aparelho não teve tempo de entrar em Doze mode antes do horário
  `fimEm`), o impacto prático deste risco é considerado **baixo mas não nulo** para
  o caso de uso real do app (treino em andamento) — o risco é mais relevante em
  testes artificiais que deixam o aparelho parado por longos períodos, ou em uma
  eventual migração futura para development build/produção, onde a permissão
  precisaria ser declarada explicitamente.
- **Não é responsabilidade desta feature** resolver a limitação de testar alarmes
  exatos via Expo Go — isso exigiria migrar de Expo Go para um development build,
  uma mudança de ferramenta de desenvolvimento fora do escopo deste requisito
  funcional, e potencialmente fora do Princípio II (simplicidade) se não houver
  outra razão para essa migração no momento.

**Alternatives considered**:
- Assumir silenciosamente que `expo-notifications` sempre entrega no horário exato
  independentemente da versão do Android ou do ambiente de teste (Expo Go vs. dev
  build): rejeitado explicitamente pelo usuário — deve ser registrado como risco
  conhecido, não ignorado.
- Migrar o projeto para um development build agora, apenas para garantir a
  permissão `SCHEDULE_EXACT_ALARM`: rejeitado nesta feature — mudaria a ferramenta
  de desenvolvimento usada por todo o projeto (hoje Expo Go, conforme Constituição
  e PRD) só por causa deste requisito específico; fica registrado como uma
  possível ação de mitigação futura, não como parte do escopo deste RF06.

**Mitigação aplicada (pós-migração para EAS development build, Decisão 0)**:
uma vez que a Decisão 0 já obrigou a migração para um development build por
outro motivo (o crash de import do `expo-notifications` no Expo Go/Android),
a limitação acima deixa de se aplicar — o development build tem seu próprio
manifesto nativo, permitindo declarar a permissão de fato. Foi confirmado em
teste manual real no Redmi Note 12 que o atraso do aviso com a tela bloqueada
era, de fato, perceptivelmente maior do que com o app em outra tela — o
sintoma exato deste risco. Confirmado no código-fonte nativo do pacote
(`android/.../service/delegates/ExpoSchedulingDelegate.kt`, método
`setupAlarm`) que o comportamento é condicional:
```kotlin
if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()) {
  AlarmManagerCompat.setExactAndAllowWhileIdle(...)  // alarme exato
} else {
  AlarmManagerCompat.setAndAllowWhileIdle(...)        // alarme sujeito a Doze mode
}
```
— ou seja, sem a permissão concedida, o próprio pacote já degrada
graciosamente para o alarme não-exato (não há crash nem erro), mas com a
imprecisão já prevista. **Correção adicionada**: `"permissions":
["SCHEDULE_EXACT_ALARM"]` em `app.json` (`expo.android.permissions`), que
adiciona a entrada correspondente ao `AndroidManifest.xml` do development
build no próximo `eas build`. Diferente de `USE_EXACT_ALARM` (concedida
automaticamente pelo sistema, mas restrita pelas políticas da Play Store a
categorias específicas de app como despertadores/calendários — este app não
se encaixa nessas categorias), `SCHEDULE_EXACT_ALARM` ainda exige que o
usuário conceda manualmente a permissão em Configurações do Android > Apps >
[app] > Alarmes e lembretes, mas não tem essa mesma restrição de categoria da
loja — escolha deliberada visando uma eventual futura publicação na Play
Store, mesmo que o app não seja publicado nela hoje. Esta feature **não**
implementa nenhum fluxo de UI para verificar/solicitar essa permissão
especificamente (`canScheduleExactAlarms()` não tem um "request" programático
como as permissões de notificação comuns — só um intent para abrir a tela de
configurações do sistema) — fica registrado como possível melhoria futura,
não incluída no escopo funcional original desta spec (que já assumia
degradação graciosa sem esse tipo de intervenção de UI).

## Decisão 9: Causa raiz real do delay no Redmi Note 12 — restrição de bateria/autostart do MIUI/HyperOS, não `SCHEDULE_EXACT_ALARM`

**Achado durante a validação manual (Redmi Note 12, após o build com
`SCHEDULE_EXACT_ALARM`)**: mesmo com a permissão `SCHEDULE_EXACT_ALARM`
concedida e as notificações do app ativadas no sistema, o delay com a tela
bloqueada **piorou** em vez de melhorar, e a vibração parou de funcionar por
completo (mesmo em modo silencioso, onde antes funcionava). Isso não fazia
sentido como consequência de nenhuma mudança de código feita entre os dois
builds (a única diferença era a permissão adicionada ao `app.json`).

**Causa raiz real**: restrição de bateria/autostart específica da MIUI/
HyperOS (Xiaomi) para o app, em
`Configurações > Bateria > Uso de bateria do app > shapefit` (permitir
atividade em segundo plano) e `Configurações > Apps > Permissões >
Autostart`. Diferente do Android "puro" (AOSP), a MIUI impõe uma camada
adicional de gerenciamento agressivo de energia por aplicativo, habilitada
por padrão para apps recém-instalados — isso é conhecido na comunidade Expo/
React Native como um dos principais motivos de notificações agendadas
atrasarem ou não dispararem em aparelhos Xiaomi, **independentemente** de
`SCHEDULE_EXACT_ALARM` estar concedida ou não a nível de Android puro. Após o
usuário liberar essa restrição de bateria manualmente, o comportamento
esperado passou a ocorrer integralmente: sem delay perceptível, tanto com o
app em segundo plano quanto com a tela bloqueada, e com a vibração
funcionando novamente.

**Implicação para a Decisão 8 (revisão)**: a permissão `SCHEDULE_EXACT_ALARM`
continua sendo uma boa prática e permanece no `app.json` (é a permissão
"correta" a nível de Android puro para este caso de uso), mas o **verdadeiro
fator decisivo** observado neste aparelho específico foi a configuração de
bateria/autostart da MIUI, não a permissão de alarme exato em si — os dois
achados podem ter se misturado no teste anterior (o build sem
`SCHEDULE_EXACT_ALARM` "funcionando razoavelmente" e o build com a permissão
"piorando" foi, na prática, uma variável de confusão: a configuração de
bateria da MIUI não tinha sido tocada em nenhum dos dois testes, e o
resultado ruim do segundo teste não foi causado pela permissão em si).

**Decision**: nenhuma mudança de código adicional é necessária — a
combinação de `SCHEDULE_EXACT_ALARM` (Android puro) + liberar a restrição de
bateria/autostart do MIUI (config do aparelho, fora do controle do app) é o
que garante a entrega confiável no Redmi Note 12. Esta feature não tem como
forçar ou verificar programaticamente essa configuração específica de
fabricante — não existe uma API pública padronizada do Android para isso
(cada fabricante expõe sua própria tela de configurações, com nomes e
caminhos diferentes). Fica documentado aqui como uma **instrução operacional
para o usuário final** (ou para o quickstart.md de validação), não como algo
resolvido em tempo de execução pelo app.

**Alternatives considered**:
- Tentar detectar programaticamente se o app está sujeito a essa restrição
  (ex.: bibliotecas de terceiros que verificam heurísticas por fabricante,
  como listas conhecidas de "apps que restringem notificações"): rejeitado —
  adicionaria uma dependência de terceiros e uma camada de heurística frágil
  (Princípio II) para resolver um problema que já tem solução simples e
  documentada (orientar o usuário a liberar a configuração manualmente), sem
  garantia de cobrir todos os fabricantes/versões de MIUI.
- Adicionar ao app um botão/tela que abre diretamente a tela de configuração
  de bateria do MIUI para o app: rejeitado nesta feature — não há uma API
  pública estável e documentada oficialmente pela Xiaomi/Google para abrir
  essa tela específica de forma confiável entre versões da MIUI/HyperOS;
  seria uma solução frágil e fora do escopo funcional original da spec.

## Item de acompanhamento para a fase de implementação

- Confirmar manualmente, antes de escrever o código, a forma exata do objeto de
  retorno de `setNotificationHandler` na documentação fixada da versão v57.0.0 (ver
  nota de fonte no topo deste documento), para validar que `shouldShowBanner`/
  `shouldShowList`/`shouldPlaySound`/`shouldSetBadge` (Decisão 4) permanecem os
  nomes corretos nesta versão específica do SDK.
- Validar em teste manual real (Android, Redmi Note 12) se o atraso observado
  entre `fimEm` e o disparo efetivo do aviso permanece dentro da margem de SC-002
  mesmo com o aparelho parado por alguns minutos antes do fim do descanso — ver
  Decisão 8 (risco de Doze mode/`SCHEDULE_EXACT_ALARM` via Expo Go).
