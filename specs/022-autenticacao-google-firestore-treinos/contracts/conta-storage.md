# Contract: `src/services/conta-storage.ts` (novo)

**Feature**: `022-autenticacao-google-firestore-treinos`

Substitui, para dados físicos, o papel que `src/services/perfil-storage.ts`
(RF10) tinha — mesmos campos, novo backend (Firestore em vez de AsyncStorage, ver
`data-model.md`).

## `obterDadosFisicos`

```ts
export async function obterDadosFisicos(uid: string): Promise<DadosFisicos | null>
```

- **Pré-condição**: `uid` de uma conta autenticada (o próprio caller — o hook de
  auth, `research.md` Decisão 6 — garante isso; esta função não valida sessão).
- **Pós-condição**: retorna o documento `users/{uid}` se existir, ou `null` se
  ainda não foi criado (sinal de "primeiro login desta conta", FR-005).
- **Erro**: se a leitura falhar (ex.: rede cai no meio do primeiro login, Edge
  Case da spec), a Promise rejeita — o chamador (tela de login/roteamento) MUST
  tratar isso como "não sabemos ainda", nunca como "não tem dados" (evita
  reexibir o formulário e duplicar o documento por engano).

## `salvarDadosFisicos`

```ts
export async function salvarDadosFisicos(
  uid: string,
  dados: { nome: string; pesoKg: number; alturaCm: number; idade: number; sexo: Sexo; objetivo: ObjetivoTreino },
): Promise<void>
```

- **Pré-condição**: `dados` já validado pelo `PerfilForm` reaproveitado
  (`research.md`, Decisão 4) — esta função não repete validação de campos
  obrigatórios, mesmo padrão de responsabilidade já usado por
  `perfil-storage.criarPerfil` (RF10).
- **Pós-condição**: cria (primeiro login) ou sobrescreve o documento
  `users/{uid}` com `criadoEm` preenchido apenas na criação (nunca sobrescrito em
  chamadas seguintes — não há fluxo de edição nesta feature, mesma decisão do
  RF10 original de não ter edição/exclusão de perfil).
- **Efeito colateral**: nenhum além da escrita no Firestore — não altera nada em
  AsyncStorage.

## Consumida por

- `src/app/conta/dados-fisicos.tsx` (novo) — chama `salvarDadosFisicos` a partir
  do `onSubmit` de `PerfilForm`.
- `src/hooks/use-conta-autenticada.tsx` (novo) — chama `obterDadosFisicos` para
  decidir se mostra o formulário (FR-005).
