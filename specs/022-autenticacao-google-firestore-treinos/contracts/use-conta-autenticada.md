# Contract: `src/hooks/use-conta-autenticada.tsx` (novo)

**Feature**: `022-autenticacao-google-firestore-treinos`

Substitui `src/hooks/use-perfil-ativo.tsx` como gate de navegação em
`src/app/_layout.tsx` (`research.md`, Decisão 6). Mesmo padrão (Context +
Provider + hook) já usado no projeto.

## Forma exposta

```ts
type ContaAutenticadaContextValue = {
  uid: string | null;
  contaAutenticada: { uid: string; email: string | null; nomeExibicao: string | null } | null;
  carregando: boolean;
  /** null enquanto ainda não sabemos (ver obterDadosFisicos); true/false depois de checar */
  temDadosFisicos: boolean | null;
  /** true quando a última checagem de obterDadosFisicos falhou (ex.: rede caiu) */
  erroAoChecarDadosFisicos: boolean;
  entrarComGoogle: () => Promise<{ ok: true } | { ok: false; motivo: string }>;
  sairDaConta: () => Promise<void>;
  /** Atualização otimista — ver "Comportamento" abaixo (research.md Decisão 8) */
  confirmarDadosFisicosSalvos: () => void;
  /** Refaz a checagem de obterDadosFisicos para a conta atual, após uma falha */
  tentarNovamenteChecarDadosFisicos: () => void;
};

function useContaAutenticada(): ContaAutenticadaContextValue;
```

## Comportamento

- **Ao montar**: escuta `onAuthStateChanged` do `@react-native-firebase/auth`.
  Enquanto o estado inicial não chega, `carregando = true` (mesmo padrão do
  `carregando` de `usePerfilAtivo`).
- **A cada mudança de auth** (login, logout, troca de conta): `temDadosFisicos`
  é resetado para `null` **antes** de rechecar — nunca mantém o valor da conta
  anterior. A checagem assíncrona (`conta-storage.obterDadosFisicos(uid)`) é
  guardada contra corrida: se outra mudança de auth chegar antes dessa checagem
  resolver, a resposta tardia é descartada (comparação por `uid`, via ref) em
  vez de sobrescrever o estado da conta já ativa.
- **Quando autenticado**: chama `conta-storage.obterDadosFisicos(uid)` para
  preencher `temDadosFisicos` — `null` enquanto a checagem não resolve (nunca
  tratar `null` como `false`; ver Edge Case da falha de rede no meio do login).
- **Se `obterDadosFisicos` rejeitar** (ex.: rede caiu): `erroAoChecarDadosFisicos`
  vira `true` (`temDadosFisicos` continua `null`) — `_layout.tsx` MUST tratar
  isso como um estado próprio, nunca deixar o app parado numa tela em branco
  indefinidamente. Ver `tentarNovamenteChecarDadosFisicos()` abaixo.
- **`tentarNovamenteChecarDadosFisicos()`**: refaz `obterDadosFisicos(uid)` para
  a conta atual (`carregando` volta a `true` durante a nova tentativa,
  `erroAoChecarDadosFisicos` volta a `false`). Usado pelo botão "Tentar
  novamente" da tela de erro do gate.
- **`confirmarDadosFisicosSalvos()`**: seta `temDadosFisicos = true`
  imediatamente (atualização otimista, sem nova leitura do Firestore).
  Necessário porque `conta-storage.salvarDadosFisicos` não dá mais `await` no
  `setDoc` (research.md Decisão 8) — sem essa chamada, `temDadosFisicos`
  só mudaria na próxima vez que `onAuthStateChanged` disparasse (login/logout),
  nunca no momento do cadastro em si. Chamada por `conta/dados-fisicos.tsx`
  logo após `salvarDadosFisicos` resolver.
- **`entrarComGoogle()`**: dispara o fluxo nativo de
  `@react-native-google-signin/google-signin`, troca o ID token resultante por
  uma credencial do Firebase (`GoogleAuthProvider.credential`) e autentica via
  `signInWithCredential`. Retorna `{ ok: false, motivo }` em caso de cancelamento
  ou falha (FR-004), nunca lança exceção não tratada para quem chama.
- **`sairDaConta()`**: chama **os dois** `signOut` — `auth().signOut()` (encerra
  a sessão do Firebase) **e** `GoogleSignin.signOut()` (limpa a sessão nativa
  do Google Sign-In). Os dois são necessários: sem o segundo, o SDK do Google
  mantém a conta "lembrada" nativamente e o próximo `entrarComGoogle()` reloga
  direto na mesma conta sem mostrar o seletor — "sair da conta" precisa
  devolver ao usuário a escolha de qual conta usar depois. Não verifica nem
  bloqueia por sessão de treino em andamento (Assumption da spec: dados ficam
  seguros em AsyncStorage sob o mesmo `uid`, ver Edge Cases de `spec.md`).

## Gate de navegação (`src/app/_layout.tsx`, substitui o `RootNavigator` atual)

```
carregando                                        → não renderiza nada
contaAutenticada && erroAoChecarDadosFisicos      → tela de erro (Tentar novamente / Sair da conta)
contaAutenticada && temDadosFisicos === null      → não renderiza nada (checando, sem erro ainda)
!contaAutenticada                                  → Redirect para /login
contaAutenticada && temDadosFisicos === false     → Redirect para /conta/dados-fisicos
contaAutenticada && temDadosFisicos === true      → Stack normal
```

## Consumida por

- `src/app/_layout.tsx` (gate de navegação).
- `src/app/login.tsx` (novo, User Story 1).
- `src/app/conta/dados-fisicos.tsx` (novo, User Story 2).
- `src/app/acoes.tsx` (alterado — "Sair da conta", User Story 4).
- `src/app/acoes.tsx` e demais telas que hoje leem `usePerfilAtivo().perfilAtivo.id`
  passam a ler `useContaAutenticada().uid` como o identificador a passar para
  `treino-storage.ts` e demais serviços que hoje recebem `perfilId`.
