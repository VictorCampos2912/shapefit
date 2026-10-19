# Contract: Regras de segurança do Firestore (`firestore.rules`, alterado)

**Feature**: `026-arquivamento-treinos-ciclo`

Estende o contrato já existente da spec 025
(`specs/025-migracao-sessoes-historico-ciclo/contracts/firestore-rules.md`)
trocando `allow read, write` por `allow read, create, update` (sem
`delete`) em `treinos`, `sessoes` e `ciclos` — ver `research.md`, Decisão
3. O documento de conta (`match /users/{uid}`, dados físicos) **não muda**,
continua com `allow read, write`.

## Regra (arquivo completo após esta spec)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;

      match /treinos/{treinoId} {
        allow read, create, update: if request.auth != null && request.auth.uid == uid;
      }

      match /sessoes/{sessaoId} {
        allow read, create, update: if request.auth != null && request.auth.uid == uid;
      }

      match /ciclos/{cicloId} {
        allow read, create, update: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

## Pré-condições

- Mesma das specs 022/025: requer `request.auth` não-nulo (Firebase
  Authentication via `@react-native-firebase/auth`) antes de qualquer
  chamada ao Firestore.

## Pós-condições / garantias

- **Isolamento por conta**: inalterado — mesma garantia das specs
  022/025, agora também explicitamente restrita a `create`/`update`
  (nunca `delete`) nas 3 subcoleções.
- **Histórico nunca apagável pelo app, garantido no servidor** (FR-013):
  nenhuma requisição de `delete` em `users/{uid}/sessoes/{sessaoId}` MUST
  ser aceita, mesmo vinda de uma sessão autenticada como dona do
  documento — a regra nega por não listar `delete` entre as operações
  permitidas (Firestore nega por padrão qualquer operação não listada
  explicitamente). Mesma garantia estendida a `treinos` e `ciclos`, por
  consistência (nenhum código do app jamais chamou `deleteDoc` em nenhuma
  das três, confirmado por grep — `research.md`, Decisão 3).
- **Sem sessão, sem acesso**: idêntico às specs 022/025.
- **Negação por omissão**: idêntico — nenhum caminho fora dos três `match`
  declarados tem regra.

## Casos de teste desta regra (validação manual via Rules Playground, `quickstart.md`)

**Os mesmos 4 casos já usados pelas specs 022/025, replicados para as 3
coleções (já cobertos, revalidar só se o Console pedir), mais 1 caso
novo por coleção** — 3 verificações novas no total:

1-4. (já cobertos pelas specs 022/025 — não precisam ser repetidos nesta
spec, a não ser que o usuário queira reconfirmar.)

5. **Given** a sessão de `A`, autenticada e dona do caminho,
   **When** ela tenta **apagar** (`delete`) um documento em
   `users/A/treinos/{id}`, `users/A/sessoes/{id}` ou
   `users/A/ciclos/{id}` (3 verificações, uma por coleção),
   **Then** a operação é rejeitada em todas — mesmo sendo a própria dona
   do documento, `delete` não está entre as operações permitidas pela
   regra.

## Passo manual — fora do alcance de qualquer código deste repositório

**Lembrete explícito (mesmo padrão das specs 022/025)**: publicar esta
versão atualizada de `firestore.rules` no Console do Firebase (Firestore
Database → Regras) é um passo manual do usuário — nenhuma task de
implementação pode marcar isso como concluído sem confirmação explícita de
que a publicação no Console realmente aconteceu.

## Consumida por

- `src/services/treino-storage.ts` (alterado) — `create`/`update` em
  `users/{uid}/treinos/*` (importação, arquivar, restaurar); nunca
  `delete`.
- `src/services/sessao-treino-storage.ts` (alterado — ganha
  `finalizarSessaoPorId`, sem leitura) — `create`/`update` em
  `users/{uid}/sessoes/*`; nunca `delete`.
- `src/services/ciclo-treino-storage.ts` (alterado) — `create`/`update`
  em `users/{uid}/ciclos/*` (criar ciclo, encerrar); nunca `delete`.
