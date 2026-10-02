# Quickstart: Autenticação Google + Firestore para Treinos

**Feature**: `022-autenticacao-google-firestore-treinos`

Guia de validação ponta a ponta — não repete os contratos detalhados em
`contracts/`, só referencia onde conferir cada comportamento.

## Pré-requisitos (uma vez, antes de qualquer teste)

1. Projeto Firebase criado, com Firestore e Authentication (provedor Google)
   habilitados.
2. App Android (`com.shapefit.app`, ver `app.config.js`) e iOS (`com.shapefit.app`)
   registrados no projeto Firebase; `google-services.json` e
   `GoogleService-Info.plist` baixados e colocados na raiz do projeto (ver
   `research.md`, Decisão 1).
3. `firestore.rules` (`contracts/firestore-rules.md`) publicada no projeto
   Firebase — **antes** de qualquer teste com dados reais, para não deixar uma
   janela de regras abertas por padrão.
4. Novo build de development client gerado (EAS `development` profile — mesma
   necessidade que o RF06 trouxe; módulos nativos não funcionam em Expo Go nem
   num build `preview`/`production` antigo sem essas dependências).
5. Duas Contas Google de teste disponíveis (para validar isolamento entre
   contas, User Story 3 e `contracts/firestore-rules.md`).

## Cenário 1 — Primeiro login, sem dados físicos

1. Instalar o build de development client num aparelho sem sessão ativa.
2. Abrir o app → esperado: tela de login (User Story 1), só botão do Google.
3. Tocar em "Entrar com o Google", escolher a Conta Google de teste A.
4. Esperado: formulário de dados físicos (User Story 2) — mesmos campos do RF10
   (`src/components/perfil/perfil-form.tsx`).
5. Tentar salvar com um campo vazio → esperado: bloqueado, campos faltantes
   indicados (mesma UX do RF10 original).
6. Preencher todos os campos e salvar → esperado: navega para a lista de
   treinos (vazia, primeira vez desta conta).

## Cenário 2 — Login subsequente da mesma conta, sem repetir o formulário

1. A partir do estado do Cenário 1, sair da conta (User Story 4, "Sair da
   conta" na tela de Ações) e entrar de novo com a Conta Google A.
2. Esperado: vai direto para a lista de treinos, **sem** reexibir o formulário
   de dados físicos (Acceptance Scenario 4, User Story 2).

## Cenário 3 — Isolamento entre contas (o teste mais importante desta feature)

1. Com a Conta Google A autenticada, importar um treino (RF01) — ex.:
   `docs/exemplos/treino-exemplo.json`.
2. Sair da conta e entrar com a Conta Google B (nova, primeiro login) —
   preencher o formulário de dados físicos.
3. Consultar a lista de treinos da Conta B → esperado: **vazia**, o treino
   importado pela Conta A não aparece.
4. Importar um treino diferente na Conta B.
5. Sair e entrar de novo com a Conta A → esperado: a lista da Conta A mostra só
   o treino do passo 1, não o da Conta B.
6. (Opcional, mais rigoroso) Usando o Firebase Console ou o emulador de regras,
   tentar simular uma leitura de `users/{uid-de-B}` autenticado como A →
   esperado: `permission-denied` (ver `contracts/firestore-rules.md`, casos de
   teste 1-4).

## Cenário 4 — Offline (FR-011)

1. Com uma conta autenticada e ao menos um treino já importado/sincronizado,
   ativar o modo avião.
2. Consultar a lista de treinos → esperado: aparece normalmente (cache offline
   nativo do Firestore, `contracts/treino-storage-firestore.md`).
3. Importar um novo treino ainda em modo avião → esperado: mensagem de sucesso
   normal (RF01), mesmo sem rede.
4. Desativar o modo avião → esperado: o treino importado no passo 3 aparece
   depois em outro aparelho/sessão da mesma conta (sincronizado
   automaticamente, sem ação manual).
5. Tentar fazer login/logout em modo avião → esperado: **falha com mensagem
   clara** (única exceção à operação offline, FR-011/Assumptions).

## Cenário 5 — Continuidade do que não migra (FR-012)

1. Com uma conta autenticada e ao menos um treino importado, iniciar uma
   execução (RF03/RF04), registrar algumas séries, e deixar uma sessão em
   andamento sem finalizar.
2. Sair da conta (User Story 4) — esperado: **não bloqueado** pela sessão em
   andamento (diferente da regra antiga do RF10; ver Edge Cases de `spec.md`).
3. Entrar de novo com a mesma conta → esperado: a sessão em andamento continua
   exatamente onde estava (dados em AsyncStorage, chaveados pelo mesmo `uid`,
   nunca apagados pelo logout).
4. Finalizar a sessão e consultar o histórico (RF08/RF18) → esperado: aparece
   normalmente, sem nenhuma mudança de comportamento em relação a antes desta
   feature.

## Validação em Android e iOS (Constitution v2.0.0, Princípio III)

Todos os cenários acima MUST ser repetidos nos dois aparelhos-alvo do projeto
(Redmi Note 12/Android, iPhone 16 Plus/iOS) antes de esta feature ser
considerada validada — nenhuma etapa fica concluída com um só sistema testado.
