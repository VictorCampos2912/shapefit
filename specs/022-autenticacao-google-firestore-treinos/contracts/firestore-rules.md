# Contract: Regras de segurança do Firestore (`firestore.rules`, novo)

**Feature**: `022-autenticacao-google-firestore-treinos`

Este é o contrato de maior risco desta feature (FR-009, Constitution v2.0.0
Princípio V, NON-NEGOTIABLE) — a barreira real de isolamento entre contas, não
apenas uma intenção documentada. Ver `research.md`, Decisão 3, para a explicação
linha a linha de por que esta regra realmente impede acesso cruzado.

## Regra

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

## Pré-condições

- Requer que o cliente esteja autenticado via Firebase Authentication
  (`@react-native-firebase/auth`) antes de qualquer chamada ao Firestore —
  `request.auth` só é não-nulo quando o SDK anexa um token de ID válido à
  requisição.

## Pós-condições / garantias

- **Isolamento por conta**: uma sessão autenticada como `uid=A` MUST conseguir
  ler/escrever exclusivamente em `users/A` e `users/A/treinos/*`; qualquer
  tentativa de acessar `users/B/...` (qualquer `B != A`) MUST ser rejeitada pelo
  Firestore, independentemente do código do cliente.
- **Sem sessão, sem acesso**: uma requisição sem token de autenticação válido
  MUST ser rejeitada em qualquer caminho sob `users/*`.
- **Negação por omissão**: nenhum caminho fora de `users/{uid}` e
  `users/{uid}/treinos/{treinoId}` tem regra declarada — o Firestore nega por
  padrão qualquer leitura/escrita sem regra correspondente; não é necessário (nem
  existe) um `match` de negação explícita cobrindo o resto do banco.

## Casos de teste desta regra (validação manual via Firebase Console/emulador, `quickstart.md`)

**Os 4 casos abaixo foram confirmados pelo usuário via Rules Playground do
Firebase Console em 2026-10-06** (`docs/criterios-aceite.md`, seção
"Autenticação Google + Firestore").

1. **Given** duas contas Google autenticadas (`uid=A`, `uid=B`), **When** a
   sessão de `A` tenta ler `users/B`, **Then** a operação é rejeitada
   (`permission-denied`).
2. **Given** a sessão de `A`, **When** ela lê/escreve em `users/A` ou
   `users/A/treinos/qualquer-id`, **Then** a operação é permitida.
3. **Given** nenhuma sessão autenticada (cliente anônimo/sem token), **When**
   qualquer leitura ou escrita é tentada em `users/*`, **Then** a operação é
   rejeitada.
4. **Given** a sessão de `A`, **When** ela tenta escrever um documento cujo
   caminho usa `uid=B` mas envia `A` em algum campo do corpo do documento (ex.:
   tentando "personificar" outra conta via dado, não via caminho), **Then** a
   operação continua rejeitada — a regra nunca lê campos do corpo do documento,
   só o segmento `{uid}` do caminho da requisição, então nenhum valor de campo
   pode contornar a regra.

## Consumida por

- `src/services/conta-storage.ts` (novo) — leitura/escrita de `users/{uid}`.
- `src/services/treino-storage.ts` (alterado) — leitura/escrita de
  `users/{uid}/treinos/*`.
