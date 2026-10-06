# Phase 0 Research: Autenticação Google + Firestore para Treinos

**Feature**: `022-autenticacao-google-firestore-treinos` | **Date**: 2026-09-29

## Decisão 1: SDK do Firebase — `@react-native-firebase` (nativo) em vez do SDK Web (`firebase`)

**Decision**: usar `@react-native-firebase/app` + `@react-native-firebase/auth` +
`@react-native-firebase/firestore` (módulos nativos, exigem development build) —
não o SDK Web puro (`firebase`).

**Pesquisa realizada** (comparação real, não presumida):

1. **Persistência offline do Firestore** (o ponto mais crítico para FR-011/RNF02):
   - `@react-native-firebase/firestore` embrulha o SDK nativo do Firebase para
     iOS (Swift) e Android (Kotlin/Java) — os mesmos SDKs nativos que qualquer app
     iOS/Android nativo usaria. Esses SDKs sempre tiveram cache local persistente em
     disco como parte do próprio design (não é um recurso "adicionado depois"),
     funcionando de forma idêntica offline em qualquer versão suportada.
   - O SDK Web (`firebase`) usa `IndexedDB` do navegador para seu cache persistente
     (`persistentLocalCache`). **`IndexedDB` não existe no runtime do React Native**
     (Hermes não é um navegador) — em React Native, o SDK Web cai para cache **só em
     memória**, que se perde a cada reinício do app. Existem workarounds da
     comunidade (polyfills de IndexedDB sobre AsyncStorage/SQLite), mas não são
     suportados oficialmente pelo Firebase e são um ponto de fragilidade adicional,
     não uma solução nativa.
   - Conclusão: só `@react-native-firebase/firestore` entrega o que FR-011 já
     descreve literalmente como "persistência offline **nativa** do SDK do
     Firestore" — com o SDK Web essa frase nem seria tecnicamente precisa em React
     Native.

2. **Autenticação (Google Sign-In)**:
   - O SDK Web (`firebase/auth`) depende de `signInWithPopup`/`signInWithRedirect`,
     ambos baseados em APIs de navegador (`window`) — não funcionam em React Native.
     Para usar o SDK Web em RN, seria necessário obter o ID token do Google por
     **outro** caminho (ex: `expo-auth-session` ou uma lib nativa de Google
     Sign-In) e só então alimentar `signInWithCredential` — ou seja, o SDK Web
     "puro" não resolve authentication em RN por si só, precisa de uma peça nativa
     de qualquer forma.
   - `@react-native-firebase/auth` integra diretamente com
     `@react-native-google-signin/google-signin` (Decisão 2), com sessão
     persistida nativamente pelo SDK do Firebase (sem depender de `localStorage`
     do navegador, que também não existe em RN).

3. **Custo de infraestrutura nativa — já pago pelo projeto**:
   - `@react-native-firebase/*` exige plugins de configuração nativa
     (`google-services.json` no Android, `GoogleService-Info.plist` no iOS) e,
     por consequência, um novo build de development client — mesma categoria de
     mudança que `expo-notifications` já trouxe no RF06/RF08 (`specs/008-notificacao-fim-descanso/research.md`,
     Decisão 0). O projeto já usa `expo-dev-client` desde então (presente em
     `package.json`) — Expo Go já não é viável para este app há várias specs. Essa
     restrição não é nova, só se repete; o custo marginal de mais um módulo nativo é
     bem menor do que seria num projeto que ainda rodasse em Expo Go puro.
   - O SDK Web evitaria esse custo de build **nesta** feature especificamente, mas
     às custas de (1) persistência offline não confiável em RN (item 1) e (2) ainda
     precisar de uma peça nativa/OAuth separada para o login (item 2) — a
     "simplicidade" do SDK Web em RN é, na prática, parcial.

**Rationale da escolha**: dado que o app já paga o custo de development build
desde o RF06, e que a persistência offline genuinamente nativa é um requisito
explícito desta feature (FR-011) e um valor central do produto (RNF02/Constitution),
`@react-native-firebase` é a escolha que realmente entrega o que foi pedido, sem
depender de workarounds não-oficiais.

**Alternatives considered**: SDK Web (`firebase`) — rejeitado pelos motivos acima;
manter os dois SDKs em paralelo (Web para Auth, nativo só para Firestore) —
rejeitado por complexidade desnecessária (Principle II) sem ganho real, já que o
nativo resolve os dois igualmente bem e evita duas bibliotecas de auth divergentes.

## Decisão 2: Login Google — `@react-native-google-signin/google-signin`

**Decision**: usar `@react-native-google-signin/google-signin` para o fluxo nativo
de login do Google, alimentando o ID token resultante em
`@react-native-firebase/auth` via `GoogleAuthProvider.credential(idToken)` +
`signInWithCredential`.

**Rationale**: é a biblioteca de referência recomendada pela própria documentação
do Firebase para Google Sign-In em apps React Native com `@react-native-firebase`
— fluxo nativo (tela de conta do Google do próprio aparelho, não um WebView),
sessão gerenciada pelo SDK nativo do Google. Requer os mesmos arquivos de
configuração nativa já necessários pela Decisão 1 (nenhum custo de infraestrutura
adicional).

**Alternatives considered**: `expo-auth-session` com o provedor Google (fluxo via
navegador/WebView) — rejeitado: fluxo menos nativo (abre um browser/WebView em vez
da tela de conta do sistema), e ainda precisaria de uma integração manual extra
para virar uma sessão do Firebase Auth; não simplifica nada dado que já se optou
por módulos nativos na Decisão 1.

## Decisão 3: Regras de segurança do Firestore (FR-009) — a regra real, não pseudocódigo

**Decision**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;

      match /treinos/{treinoId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

**Por que esta regra realmente impede acesso cruzado entre contas** (não é só
documentar a intenção):

- `request.auth.uid` vem do token de ID do Firebase Auth **verificado pelo próprio
  backend do Firestore** antes de a regra ser avaliada — o cliente não consegue
  falsificar esse valor enviando outro `uid` no corpo da requisição; ele é extraído
  da assinatura criptográfica do token, validada server-side.
- A regra compara esse `uid` verificado com o **segmento `{uid}` do caminho do
  documento** (`users/{uid}` e `users/{uid}/treinos/{treinoId}`), não com nenhum
  campo dentro do corpo do documento. Isso importa porque o caminho de uma
  requisição do Firestore é parte da própria chamada da API (não é dado arbitrário
  que o atacante controla livremente da mesma forma que controlaria um campo do
  documento) — uma conta autenticada como `uid=A` só pode fazer uma requisição cujo
  caminho contenha `users/A/...`; para ler/escrever em `users/B/...`, a regra
  avalia `request.auth.uid == "B"`, que é falso para uma sessão autenticada como
  `A`, independentemente do que essa sessão tente enviar no corpo da requisição.
- `allow read, write: if request.auth != null && ...` também bloqueia qualquer
  acesso não autenticado (`request.auth == null`) — sem isso, um cliente sem login
  poderia tentar ler/escrever diretamente via API REST do Firestore, contornando a
  tela de login do app (a tela de login é UX, não segurança; a regra é a
  segurança real, conforme Constitution v2.0.0 Princípio V: "não apenas por filtro
  no cliente").
- Nenhuma regra `match` cobre nenhum outro caminho — o comportamento padrão do
  Firestore é **negar** qualquer leitura/escrita que não bata com nenhuma regra
  declarada, então não é necessário (nem foi escrito) um `match /{document=**}`
  de negação explícita no final; a ausência de regra já é a negação.
- A sub-regra de `treinos/{treinoId}` **não herda** automaticamente a regra do
  documento pai (`users/{uid}`) — regras do Firestore não são recursivas por
  padrão — por isso a mesma condição é repetida explicitamente para a subcoleção;
  omitir essa repetição deixaria `users/{uid}/treinos/*` sem nenhuma regra
  correspondente e, portanto, bloqueado para todo mundo (incluindo o próprio
  dono), não vazando para outra conta, mas quebrando a funcionalidade — por isso a
  repetição explícita é necessária tanto para segurança quanto para a feature
  funcionar.

**Alternatives considered**: regra única em `/users/{uid}/{document=**}` cobrindo
tudo recursivamente com uma condição — tecnicamente possível e mais compacta, mas
rejeitada aqui em favor de duas regras explícitas (documento de dados físicos e
subcoleção de treinos) para deixar claro, na leitura da própria regra, exatamente
quais dois caminhos esta feature introduz — facilita revisão de segurança futura
quando novas subcoleções forem adicionadas em fases posteriores da migração.

## Decisão 4: Reaproveitar `PerfilForm` (RF10) sem recriar

**Decision**: o formulário de dados físicos do primeiro login (User Story 2)
reaproveita o componente já existente `src/components/perfil/perfil-form.tsx`
(`PerfilForm`), sem nenhuma alteração no componente em si.

**Por que já serve sem alteração**: `PerfilForm` já é desacoplado de onde os dados
são salvos — recebe apenas `onSubmit(dados)` e `submitting` como props, e devolve
exatamente `{ nome, pesoKg, alturaCm, idade, sexo, objetivo }` (os mesmos 6 campos
que FR-006 exige), com a mesma validação de campos obrigatórios já embutida. A
tela atual que o usa (`src/app/perfil/criar.tsx`) é fina — só conecta `onSubmit` ao
`usePerfilAtivo().criarPerfil`. Esta feature troca essa tela por uma nova
(ex.: `src/app/conta/dados-fisicos.tsx`) que conecta o mesmo `onSubmit` a uma nova
função que grava em `users/{uid}` no Firestore (Decisão 5 do data-model) em vez de
`AsyncStorage` — o componente `PerfilForm` e seus tipos (`src/types/perfil.ts`:
`Sexo`, `ObjetivoTreino`) são reaproveitados como estão.

**Rationale**: Princípio II (simplicidade) — recriar um formulário já validado em
produção (RF10, testado em Android e iOS) seria trabalho e risco desnecessários; a
própria separação existente (form burro + tela fina que decide onde salvar) já foi
projetada de um jeito que essa reutilização é direta.

**Alternatives considered**: copiar `PerfilForm` para dentro de uma pasta nova
(`src/components/conta/`) e divergir dali — rejeitado, cria duplicação de UI sem
necessidade; qualquer ajuste visual futuro teria que ser replicado em dois lugares.

**Correção (2026-10-05)**: "sem nenhuma alteração" deixou de ser exato — o usuário
relatou, testando `src/app/perfil/criar.tsx` real no iPhone, que os campos Peso/
Altura/Idade (`keyboardType="decimal-pad"`/`"number-pad"`) não têm nenhuma tecla
de retorno no iOS, e o campo Nome não avançava pro próximo campo — um bug
pré-existente do RF10 (não introduzido por esta feature), mas que afeta
diretamente o teste da User Story 2 porque é o mesmo componente. Corrigido:
`PerfilForm` ganhou `returnKeyType`/`onSubmitEditing`/refs encadeando Nome → Peso
→ Altura → Idade, uma `InputAccessoryView` (iOS) com botão "Próximo"/"Concluído"
pros 3 campos numéricos (que não têm tecla de retorno nativa no iOS), e um
`TouchableWithoutFeedback` pra fechar o teclado ao tocar fora de qualquer campo.
`src/app/perfil/criar.tsx` também ganhou `KeyboardAvoidingView` + `ScrollView`
(`keyboardShouldPersistTaps="handled"`), já que sem isso o botão "Salvar perfil"
podia ficar inacessível atrás do teclado em telas menores. Esta correção se
propaga de graça para `src/app/conta/dados-fisicos.tsx` (ainda a criar, T013)
já que ele reaproveita o mesmo `PerfilForm` — só precisa repetir o mesmo padrão
de `KeyboardAvoidingView`/`ScrollView` na tela nova.

## Decisão 5: Continuidade do restante do app — `uid` no lugar de `perfilId`, sem migrar storage

**Decision**: `src/services/treino-storage.ts` (execução/histórico já cobertos por
outros serviços análogos) continuam recebendo uma string identificadora como hoje
(`perfilId: string` nas assinaturas), sem mudança de schema de `AsyncStorage` —
só troca a origem desse valor: em vez de vir de `usePerfilAtivo().perfilAtivo.id`
(RF10), passa a vir de `uid` da conta autenticada (novo hook de auth, Decisão 6).

**Rationale**: FR-012 exige que essas áreas continuem funcionando exatamente como
hoje. Como as chaves do AsyncStorage já são strings opacas (`treinos:<perfilId>`,
`sessoes:<perfilId>`), qualquer string estável funciona igualmente bem como chave —
o `uid` do Firebase Auth é uma string estável por conta, preenchendo esse papel sem
exigir nenhuma mudança de formato de chave ou dado já persistido.

**Alternatives considered**: introduzir uma camada de mapeamento
`perfilId → uid` — rejeitado, complexidade sem benefício; não há nenhum dado local
de perfis antigos para mapear (FR-015, decisão explícita de não migrar), então o
`uid` pode ser usado diretamente como o novo identificador desde o primeiro uso.

## Decisão 6: Novo hook de autenticação, no mesmo padrão de `usePerfilAtivo`

**Decision**: novo `src/hooks/use-conta-autenticada.tsx`, com um `AuthProvider`/
`useContaAutenticada()` no mesmo formato de `PerfilAtivoProvider`/`usePerfilAtivo`
(`src/hooks/use-perfil-ativo.tsx`) — expõe `{ uid, contaAutenticada, carregando,
temDadosFisicos, entrarComGoogle, sairDaConta }`. Substitui
`PerfilAtivoProvider`/`usePerfilAtivo` em `src/app/_layout.tsx` como o gate de
entrada do app (Decisão análoga ao `RootNavigator` atual, que hoje decide entre
`/perfil/criar`, `/perfil/selecionar` ou a stack normal com base em
`usePerfilAtivo()`).

**Rationale**: o projeto já tem um padrão estabelecido e testado (Context +
Provider + hook, gate de navegação no `_layout.tsx` raiz) para exatamente este
tipo de decisão ("qual tela mostrar antes de liberar o resto do app") — reaproveitar
o padrão em vez de inventar um mecanismo novo de roteamento condicional
(Princípio II).

**Alternatives considered**: usar diretamente `@react-native-firebase/auth`'s
`onAuthStateChanged` espalhado por múltiplas telas — rejeitado, duplicaria lógica
de "carregando/autenticado/não autenticado" em vários lugares em vez de centralizar
num único hook, quebrando o padrão já estabelecido pelo projeto.

**Correção na implementação (T012, 2026-10-05)**: trocar `PerfilAtivoProvider`
por `ContaAutenticadaProvider` em `_layout.tsx` sozinho quebraria as 5 telas
ainda não migradas (`acoes.tsx`, `(tabs)/index.tsx`, `(tabs)/explore.tsx`,
`treino/[treinoId].tsx`, `perfil/selecionar.tsx` — tasks.md T017-T022), que
ainda chamam `usePerfilAtivo()` e lançariam "deve ser usado dentro de um
PerfilAtivoProvider" ao serem alcançadas. `_layout.tsx` ficou com os **dois**
Providers aninhados (`ContaAutenticadaProvider` por fora, decidindo o gate;
`PerfilAtivoProvider` por dentro, mantido só para essas 5 telas não
quebrarem) até elas serem migradas e `PerfilAtivoProvider` ser removido de
vez (T023). Como essas 5 telas já tratam `perfilAtivo === null` de forma
defensiva (todas têm `if (!perfilAtivo) return;` antes de usar `.id`), o
efeito enquanto não migradas é um estado vazio/parado (ex.: lista de treinos
nunca carrega), não um crash — aceitável para esta fase, já que US3/Polish
ainda não rodaram.

**Bug real encontrado e corrigido em teste no Android (2026-10-05)**: o
`RootNavigator` original desta feature retornava `<Redirect href="/login" />`
**sozinho** (sem `<Stack>` nenhum montado junto) quando não havia conta
autenticada. Isso deixava a navegação sem nenhum Navigator montado no
momento do redirect — causava um **loop de remontagem contínua** do
`RootNavigator`/`ContaAutenticadaProvider` inteiro (centenas de vezes por
segundo, confirmado via log de diagnóstico: `carregando` voltava a `true` do
zero a cada ciclo, nunca estabilizava), travando o app na splash screen azul
para sempre. O gate original baseado em `usePerfilAtivo()` nunca tinha esse
problema porque sempre renderizava `<Stack>` dentro do mesmo Fragment que os
`<Redirect>`s — nunca sozinho. Corrigido replicando exatamente esse padrão:
`<Stack>` agora é renderizado incondicionalmente (como irmão de qualquer
`<Redirect>` ativo) assim que `carregando` é `false`, nunca mais sozinho.

## Decisão 7: `app.json` → `app.config.js` + variáveis de ambiente de arquivo do EAS (correção pós-implementação, 2026-10-02)

**Decision**: converter `app.json` em `app.config.js` (JS, não mais JSON estático)
e trocar `android.googleServicesFile`/`ios.googleServicesFile` de caminho fixo
para `process.env.GOOGLE_SERVICES_JSON ?? './google-services.json'` e
`process.env.GOOGLE_SERVICE_INFO_PLIST ?? './GoogleService-Info.plist'`. As duas
variáveis foram criadas como variáveis de ambiente do tipo `file`, visibilidade
`secret`, no ambiente `development` do EAS (`eas env:set development --name
GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility
secret`, e o equivalente para `GOOGLE_SERVICE_INFO_PLIST`).

**Rationale**: o primeiro build real (`eas-cli build --profile development
--platform android`, disparado pelo Victor) falhou com
`"google-services.json" is missing` — o EAS Build só sobe pro builder remoto os
arquivos rastreados pelo git, e esse arquivo está no `.gitignore` (Decisão de
Setup, T004: não versionar config nativa do Firebase). O próprio erro do EAS CLI
já apontava a solução oficial: variáveis de ambiente de arquivo. Sem isso, não
existe build remoto possível com esses arquivos fora do git — não é uma
preferência de estilo, é a única forma documentada do EAS de prover um arquivo
não versionado ao builder.

**Efeito colateral aceito**: `app.json` deixou de existir; toda referência a ele
nos documentos desta spec (`plan.md`, `tasks.md`, `quickstart.md`) foi atualizada
para `app.config.js`. O fallback para o caminho relativo (`./google-services.json`)
mantém builds/dev locais funcionando sem exigir as variáveis de ambiente fora do
EAS Build.

**Alternatives considered**: reverter a decisão de T004 e commitar os arquivos de
config nativa — rejeitado, o `.gitignore` foi uma escolha explícita do Victor
(nenhum motivo novo surgiu pra revisitar isso, só porque o EAS exige outro
caminho de solução não significa que versionar segredo-adjacente seja a resposta
certa); manter `app.json` estático e só configurar os arquivos manualmente antes
de cada build remoto — rejeitado, frágil (exige lembrar de um passo manual
sempre, sem nenhuma validação automática se for esquecido) e não é o fluxo
suportado oficialmente pelo EAS.

## Decisão 8: Não dar `await` em `setDoc`/`writeBatch.commit()` nas escritas de treino/dados físicos (correção pós-implementação, 2026-10-06)

**Decision**: em `treino-storage.ts` (`setDocTreino`, o `writeBatch` de
`processarConteudoArray`) e em `conta-storage.ts` (`salvarDadosFisicos`), a
chamada de escrita no Firestore (`setDoc`/`batch.commit()`) passou a ser
disparada **sem `await`**, com `.catch(erro => console.error(...))` anexado
para não perder falhas reais silenciosamente.

**Rationale**: achado relatado pelo usuário (via outro Claude revisando o
código) — a Promise retornada por `setDoc`/`batch.commit()` do Firestore só
resolve quando o servidor confirma a escrita, **mesmo a escrita já estando
aplicada no cache local offline imediatamente** (comportamento documentado
do próprio SDK, não um bug do Firestore). Com `await` nessas chamadas, uma
importação ou cadastro de dados físicos feito **offline** ficaria com a
Promise pendurada indefinidamente até a rede voltar — travando a UI
("Importando…"/"Salvando…" para sempre) e quebrando FR-011/Cenário 4 do
`quickstart.md`, que exige que essas operações funcionem offline com a
mesma mensagem de sucesso imediata.

Sem o `await`, a função retorna assim que a escrita é **enfileirada**
localmente — o que já é suficiente, porque leituras subsequentes
(`listarTreinos`, `obterDadosFisicos`) enxergam escritas pendentes através
do cache local mesclado do Firestore, mesmo antes do commit no servidor
terminar. Esse comportamento de leitura (cache inclui escritas pendentes)
é o que torna seguro não esperar a confirmação do servidor antes de seguir.

**Achado relacionado — RESOLVIDO (2026-10-06, mesmo dia)**: ao revisar
`use-conta-autenticada.tsx` para confirmar este fix, notei que
`temDadosFisicos` no contexto não era atualizado depois que
`conta/dados-fisicos.tsx` chamava `salvarDadosFisicos` com sucesso — o
`RootNavigator` só recalculava o gate quando `onAuthStateChanged` disparava
de novo (login/logout), não quando o Firestore era escrito. O fluxo só
funcionava porque `router.replace('/')` muda a rota ativa sem que
`RootNavigator` re-renderize (o valor do contexto não mudava) — o
`<Redirect>` não "persegue" a navegação, só dispara uma vez quando
renderizado. Era frágil: qualquer re-render do `RootNavigator` por outro
motivo (ex.: `RootLayout` re-renderizando por causa de `useColorScheme()`)
re-avaliaria o gate com `temDadosFisicos` ainda `false` (stale) e
redirecionaria de volta pro formulário, mesmo a conta já tendo dados salvos.

**Corrigido** com três mudanças em `use-conta-autenticada.tsx` e
`dados-fisicos.tsx`:
1. Novo `confirmarDadosFisicosSalvos()` exposto pelo hook — seta
   `temDadosFisicos = true` otimisticamente, sem nova leitura do Firestore.
   `dados-fisicos.tsx` chama logo após `salvarDadosFisicos` resolver.
2. `temDadosFisicos` agora é resetado para `null` a cada disparo de
   `onAuthStateChanged` (login, logout, troca de conta), antes de rechecar —
   nunca mantém o valor da conta anterior. A checagem assíncrona de
   `obterDadosFisicos(uid)` ganhou uma guarda de corrida via `useRef`
   (`uidChecagemAtualRef`): se outra mudança de auth chegar antes dessa
   checagem resolver, a resposta tardia é descartada (comparação por `uid`)
   em vez de sobrescrever o estado da conta já ativa.
3. Verificado (não precisou de mudança): `salvarDadosFisicos` já preserva
   `criadoEm` do documento existente em chamadas repetidas, só gera um novo
   na criação — contrato (`contracts/conta-storage.md`) já estava correto.

Contrato atualizado em `contracts/use-conta-autenticada.md`.

**Alternatives considered**: manter o `await` e aceitar que operações
offline ficam "penduradas" até reconectar — rejeitado, contradiz
explicitamente FR-011 e o Cenário 4 do `quickstart.md`, que já definem que
offline deve funcionar com resposta imediata; usar
`enableNetwork`/`disableNetwork` pra detectar modo offline e pular a
escrita condicionalmente — rejeitado, mais complexo sem necessidade: o SDK
já trata escrita offline nativamente, o único problema era o `await`
artificial no código do app.

## Decisão 9: Gate não pode travar em branco se `obterDadosFisicos` falhar; `sairDaConta` precisa dos dois `signOut` (correção, 2026-10-06, RESOLVIDO)

**Decision**: duas correções em `use-conta-autenticada.tsx` e `_layout.tsx`,
registradas pelo Victor numa revisão antes de implementar a US4:

**(a) Estado de erro explícito para falha em `obterDadosFisicos`**: novo
`erroAoChecarDadosFisicos: boolean` no contexto, e `tentarNovamenteChecarDadosFisicos()`
pra refazer a checagem. A lógica de checagem foi extraída pra uma função
`checarDadosFisicos(uid)` reutilizável tanto pelo listener de
`onAuthStateChanged` quanto pelo retry manual. `_layout.tsx` ganhou uma tela
`ErroChecagemDadosFisicos` (inline, mesmo padrão de outros componentes
locais do projeto) com dois botões — "Tentar novamente" e "Sair da conta" —
mostrada quando `contaAutenticada && erroAoChecarDadosFisicos`.

**Rationale**: antes desta correção, uma falha em `obterDadosFisicos` (ex.:
rede cai durante a checagem inicial) deixava `temDadosFisicos` em `null`
para sempre (nada reexecutava a checagem) e `carregando` em `false` — o gate
(`if (carregando || (contaAutenticada && temDadosFisicos === null))`)
ficava preso renderizando `null` indefinidamente, sem crash, sem erro
visível, sem nenhuma ação possível pro usuário (nem sair da conta). Mesma
categoria de bug do "loop de remontagem" documentado na correção da
Decisão 6, mas desta vez travando em branco em vez de travar reconstruindo.

**(b) `sairDaConta()` precisa chamar os dois `signOut`**: verificado que o
código já fazia isso corretamente (`await signOut(getAuth()); await
GoogleSignin.signOut();`) — não precisou de mudança de lógica, só um
comentário explicando o motivo (sem o segundo `signOut`, o SDK do Google
mantém a conta "lembrada" nativamente e o próximo login pula direto pra
mesma conta, sem mostrar o seletor — quebraria a possibilidade real de
trocar de conta no mesmo aparelho, objetivo central da US4).

**Alternatives considered (item a)**: mostrar só um spinner infinito em vez
de uma tela de erro — rejeitado, usuário real ficaria sem noção do que
fazer numa falha de rede real (diferente do spinner "checando" normal, que
resolve sozinho em segundos); tentar de novo automaticamente com backoff em
vez de botão manual — rejeitado por simplicidade (Princípio II): um retry
manual já resolve o problema real (usuário percebe que caiu a rede, resolve
a conexão, toca em "Tentar novamente"), sem a complexidade de um scheduler
de retry automático.

Contrato atualizado em `contracts/use-conta-autenticada.md` (forma exposta,
comportamento, e o diagrama do gate).

## Resumo das entidades técnicas afetadas

- `package.json`: novas dependências — `@react-native-firebase/app`,
  `@react-native-firebase/auth`, `@react-native-firebase/firestore`,
  `@react-native-google-signin/google-signin` (Decisões 1-2; MUST ser registradas
  no PRD, Constitution Princípio IV — task de documentação, não de código).
- `app.config.js`: novos plugins nativos (`@react-native-firebase/app`,
  `@react-native-google-signin/google-signin`) + arquivos de config nativa
  (`google-services.json`, `GoogleService-Info.plist`) — implica um novo build de
  development client antes de qualquer teste em aparelho (mesma categoria de
  mudança do RF06/RF08).
- `firestore.rules` (novo, na raiz do projeto ou onde o Firebase CLI esperar):
  regra da Decisão 3.
- `src/hooks/use-conta-autenticada.tsx` (novo): substitui
  `use-perfil-ativo.tsx` como gate de navegação em `src/app/_layout.tsx`.
- `src/app/login.tsx` (novo): tela de login (User Story 1).
- `src/app/conta/dados-fisicos.tsx` (novo, substitui `src/app/perfil/criar.tsx` e
  `src/app/perfil/selecionar.tsx` como parte do fluxo de entrada): reaproveita
  `PerfilForm` (Decisão 4).
- `src/services/conta-storage.ts` (novo): leitura/escrita de `users/{uid}` no
  Firestore (dados físicos) — substitui `src/services/perfil-storage.ts` para este
  propósito; `perfil-storage.ts` pode ser removido depois que nada mais o usar.
- `src/services/treino-storage.ts`: passa a ler/escrever em
  `users/{uid}/treinos/*` no Firestore em vez de `AsyncStorage` (RF01/RF02) — as
  demais funções deste mesmo arquivo relacionadas a execução/ciclo (se houver)
  continuam em AsyncStorage sem mudança, só recebendo `uid` como valor do parâmetro
  que hoje é `perfilId`.
- `src/app/acoes.tsx`: item "Perfil ativo: ... (trocar)" substituído por "Sair da
  conta" (User Story 4); demais itens sem mudança de comportamento visível.
- `docs/PRD-app-treino.md`: RNF02, RNF05, seção 5 (Não-objetivos) — atualização
  tratada como task desta feature (spec já define isso), não requisito funcional.
