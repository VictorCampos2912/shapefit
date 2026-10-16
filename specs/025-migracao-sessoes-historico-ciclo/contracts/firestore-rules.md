# Contract: Regras de segurança do Firestore (`firestore.rules`, alterado)

**Feature**: `025-migracao-sessoes-historico-ciclo`

Estende o contrato já existente da spec 022
(`specs/022-autenticacao-google-firestore-treinos/contracts/firestore-rules.md`)
com dois novos caminhos — mesma regra, mesma garantia, nenhuma condição nova.

## Regra (arquivo completo após esta spec)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;

      match /treinos/{treinoId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }

      match /sessoes/{sessaoId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }

      match /ciclos/{cicloId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

## Pré-condições

- Mesma da spec 022: requer `request.auth` não-nulo (Firebase Authentication
  via `@react-native-firebase/auth`) antes de qualquer chamada ao Firestore.

## Pós-condições / garantias

- **Isolamento por conta**, agora também para `sessoes` e `ciclos`: uma
  sessão autenticada como `uid=A` MUST conseguir ler/escrever
  exclusivamente em `users/A/sessoes/*` e `users/A/ciclos/*`; qualquer
  tentativa de acessar `users/B/sessoes/*` ou `users/B/ciclos/*` (`B != A`)
  MUST ser rejeitada.
- **Sem sessão, sem acesso**: idêntico à spec 022 — requisição sem token
  válido MUST ser rejeitada em qualquer caminho sob `users/*`.
- **Negação por omissão**: idêntico à spec 022 — nenhum caminho fora dos
  três `match` declarados (`treinos`, `sessoes`, `ciclos`) tem regra, e o
  Firestore nega por padrão.

## Casos de teste desta regra (validação manual via Rules Playground, `quickstart.md`)

**Os mesmos 4 casos já usados pela spec 022 para `treinos`, repetidos para
`sessoes` e `ciclos`** — 12 verificações no total (4 casos × 3 coleções),
mais as 4 originais de `treinos` já revalidadas por essa spec anterior (não
precisam ser repetidas, só os 8 casos novos abaixo):

1. **Given** duas contas Google autenticadas (`uid=A`, `uid=B`), **When** a
   sessão de `A` tenta ler `users/B/sessoes/qualquer-id` ou
   `users/B/ciclos/qualquer-id`, **Then** a operação é rejeitada
   (`permission-denied`).
2. **Given** a sessão de `A`, **When** ela lê/escreve em
   `users/A/sessoes/qualquer-id` ou `users/A/ciclos/qualquer-id`, **Then**
   a operação é permitida.
3. **Given** nenhuma sessão autenticada, **When** qualquer leitura ou
   escrita é tentada em `users/*/sessoes/*` ou `users/*/ciclos/*`, **Then**
   a operação é rejeitada.
4. **Given** a sessão de `A`, **When** ela tenta escrever um documento de
   sessão ou de ciclo cujo **caminho** usa `uid=B` mas o **corpo** do
   documento contém `A` em algum campo (`uid: 'A'`, por exemplo), **Then**
   a operação continua rejeitada — a regra só lê o segmento `{uid}` do
   caminho da requisição, nunca um campo do corpo.

## Passo manual — fora do alcance de qualquer código deste repositório

**Lembrete explícito (vindo da spec 025, `spec.md`, Assumptions)**:
publicar esta versão atualizada de `firestore.rules` no Console do Firebase
(Firestore Database → Regras) é um passo manual do usuário, assim como já
foi para a spec 022 — nenhuma task de implementação pode marcar isso como
concluído sem confirmação explícita de que a publicação no Console
realmente aconteceu.

## Consumida por

- `src/services/sessao-treino-storage.ts` (alterado) — leitura/escrita de
  `users/{uid}/sessoes/*`.
- `src/services/ciclo-treino-storage.ts` (alterado) — leitura/escrita de
  `users/{uid}/ciclos/*`.
