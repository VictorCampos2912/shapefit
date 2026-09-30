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
  entrarComGoogle: () => Promise<{ ok: true } | { ok: false; motivo: string }>;
  sairDaConta: () => Promise<void>;
};

function useContaAutenticada(): ContaAutenticadaContextValue;
```

## Comportamento

- **Ao montar**: escuta `onAuthStateChanged` do `@react-native-firebase/auth`.
  Enquanto o estado inicial não chega, `carregando = true` (mesmo padrão do
  `carregando` de `usePerfilAtivo`).
- **Quando autenticado**: chama `conta-storage.obterDadosFisicos(uid)` para
  preencher `temDadosFisicos` — `null` enquanto a checagem não resolve (nunca
  tratar `null` como `false`; ver Edge Case da falha de rede no meio do login).
- **`entrarComGoogle()`**: dispara o fluxo nativo de
  `@react-native-google-signin/google-signin`, troca o ID token resultante por
  uma credencial do Firebase (`GoogleAuthProvider.credential`) e autentica via
  `signInWithCredential`. Retorna `{ ok: false, motivo }` em caso de cancelamento
  ou falha (FR-004), nunca lança exceção não tratada para quem chama.
- **`sairDaConta()`**: `auth().signOut()` — não verifica nem bloqueia por sessão
  de treino em andamento (Assumption da spec: dados ficam seguros em
  AsyncStorage sob o mesmo `uid`, ver Edge Cases de `spec.md`).

## Gate de navegação (`src/app/_layout.tsx`, substitui o `RootNavigator` atual)

```
carregando            → não renderiza nada (mesmo comportamento atual)
!contaAutenticada      → Redirect para /login
contaAutenticada && temDadosFisicos === null → não renderiza nada (checando)
contaAutenticada && temDadosFisicos === false → Redirect para /conta/dados-fisicos
contaAutenticada && temDadosFisicos === true  → Stack normal (comportamento de hoje)
```

## Consumida por

- `src/app/_layout.tsx` (gate de navegação).
- `src/app/login.tsx` (novo, User Story 1).
- `src/app/conta/dados-fisicos.tsx` (novo, User Story 2).
- `src/app/acoes.tsx` (alterado — "Sair da conta", User Story 4).
- `src/app/acoes.tsx` e demais telas que hoje leem `usePerfilAtivo().perfilAtivo.id`
  passam a ler `useContaAutenticada().uid` como o identificador a passar para
  `treino-storage.ts` e demais serviços que hoje recebem `perfilId`.
