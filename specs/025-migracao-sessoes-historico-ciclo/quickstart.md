# Quickstart: Migração de Sessões, Histórico e Ciclo de Progresso para o Firestore

**Feature**: `025-migracao-sessoes-historico-ciclo`

Validação manual em Android (Princípio III) — iOS permanece pendente por
falta de conta Apple Developer paga (mesma situação herdada das specs 022 a
024).

## Pré-requisitos

- Conta autenticada (spec 022). Dados fictícios criados pelo **uso real do
  app** (research.md, Decisão 5) — sem script nem tela de seed:
  - Importar um ou mais arquivos de `docs/exemplos/` (ex.:
    `treino-exemplo.json`).
  - Treinar algumas sessões de verdade: registrar séries, finalizar pelo
    menos uma sessão manualmente ("Finalizar treino") e pelo menos uma
    automaticamente (concluindo todos os exercícios); deixar uma sessão em
    andamento, sem finalizar.
  - Editar pelo menos uma série de uma sessão em andamento e uma de uma
    sessão já finalizada.
  - Importar um arquivo com múltiplos treinos (ex.:
    `docs/exemplos/treinos_multiplos.json`) para ter um ciclo de progresso
    ativo.
- Publicar as regras atualizadas (`contracts/firestore-rules.md`) no
  Console do Firebase **antes** de rodar qualquer cenário desta lista —
  passo manual do usuário, fora do alcance de qualquer código.
- Uma segunda conta de teste (Conta B) para o Cenário 6 (isolamento).

## Cenário 1 — Treinar do início ao fim, sem diferença de comportamento (US1)

1. Abrir um treino, registrar algumas séries de um exercício, trocar de
   exercício, registrar mais séries.
2. **Esperado**: nenhuma diferença perceptível de comportamento em relação
   a antes desta migração — mesmos toques, mesmas telas, mesmo cronômetro
   de descanso.
3. Fechar o app por completo e reabrir.
4. **Esperado**: o progresso continua exatamente de onde parou (RF04).
5. Tocar em "Finalizar treino" com exercícios ainda pendentes.
6. **Esperado**: a sessão é finalizada, só com as séries já registradas
   (RF07).
7. Em outro treino, concluir todos os exercícios planejados.
8. **Esperado**: a sessão finaliza automaticamente (RF07); "Nova sessão de
   Treino" (RF12) aparece e, ao tocar, permite uma nova sessão do mesmo
   treino sem nenhum resquício da anterior.

## Cenário 2 — Histórico e indicadores continuam corretos (US2)

1. Com as sessões do Cenário 1 já finalizadas, abrir o histórico "Por
   exercício" (RF08).
2. **Esperado**: evolução de carga/reps aparece corretamente, incluindo
   exercícios do treino que nunca foram registrados (FR-011).
3. Abrir a visão "Por data" (RF18).
4. **Esperado**: os mesmos dias/sessões aparecem agrupados corretamente.
5. Voltar para "Meus treinos".
6. **Esperado**: contador de sessões finalizadas e "Finalizado em `<data>`"
   (RF02/RF16) corretos para os treinos usados no Cenário 1; o treino com
   sessão em andamento (deixada sem finalizar nos pré-requisitos) aparece
   destacado (RF23, spec 024).

## Cenário 3 — Edição de séries continua funcionando (US5)

1. Com uma sessão em andamento, editar a carga/reps de uma série já
   registrada (RF09a).
2. **Esperado**: novo valor salvo, exercício continua com o mesmo estado de
   conclusão.
3. No histórico, editar a carga/reps de uma série de uma sessão finalizada
   (RF09b).
4. **Esperado**: novo valor salvo e refletido imediatamente no histórico,
   sessão continua finalizada (não reabre).

## Cenário 4 — Ciclo de progresso continua funcionando (US4)

1. Com o ciclo criado nos pré-requisitos (lote de múltiplos treinos),
   conferir o anel de progresso de cada treino do lote em "Meus treinos".
2. **Esperado**: anéis corretos, cota distribuída como hoje (RF15).
3. Tentar importar outro lote de múltiplos treinos antes de atingir 40
   sessões no ciclo atual.
4. **Esperado**: bloqueado, com a mesma mensagem de hoje.
5. Finalizar sessões até atingir 40 no ciclo.
6. **Esperado**: aviso "Hora de trocar o treino" aparece; nova importação
   de lote volta a funcionar.

**Nota corrigida em 2026-10-15 (a alternativa anterior estava errada —
ver `docs/criterios-aceite.md`, RF24, User Story 4)**: editar
`cotaPorTreinoId` no Console **não** exercita os passos 3-6 — essa cota só
afeta a fração exibida no anel (`cotaComoFracao`), nunca
`progressoCiclo.totalFinalizado`, que é o valor real que tanto o bloqueio
de nova importação (`treino-storage.ts`) quanto o aviso "Hora de trocar o
treino" (`index.tsx`) comparam contra 40. Editar só a cota é útil para
confirmar visualmente o anel chegando a 100% com poucas sessões reais, mas
não substitui ter 40 sessões finalizadas de verdade para os passos 5-6.

**Alternativa que de fato exercita os passos 5-6, sem treinar 40 vezes**:
no Firebase Console, em `users/{uid}/sessoes/`, duplicar manualmente um
documento de sessão já finalizada (`finalizadaEm` não nulo) de um treino
que faça parte do ciclo atual, ajustando `id`/`treinoId` a cada cópia, até
a soma de sessões finalizadas dos treinos do ciclo atingir 40 — é a mesma
leitura (`listarSessoes`/`calcularProgressoCiclo`) que o app já faz, só
com dados de teste criados diretamente no Console em vez de treino real.
**Apagar os documentos de teste criados** no Console depois, antes de
prosseguir para outros cenários desta lista que dependam do estado real
do ciclo/histórico.

## Cenário 5 — Ciclo e histórico sobrevivem a limpar dados / trocar de aparelho (US4)

1. Com um ciclo ativo e sessões finalizadas, anotar o estado atual (anel de
   progresso de cada treino, contador de sessões).
2. Limpar os dados do app (Configurações do Android → Apps → ShapeFit →
   Armazenamento → Limpar dados) ou, se disponível, logar na mesma conta em
   um segundo aparelho/emulador.
3. Fazer login de novo com a mesma conta.
4. **Esperado**: o ciclo de progresso e o histórico aparecem exatamente
   como antes de limpar os dados — nenhuma perda, nenhum reset (FR-015,
   SC-005) — diferente do comportamento anterior a esta spec, em que o
   ciclo (AsyncStorage) seria zerado.

## Cenário 6 — Isolamento entre contas (US3)

1. Logado na Conta A (com as sessões/ciclo dos cenários anteriores), sair
   e entrar com a Conta B (nova ou sem essas sessões).
2. **Esperado**: histórico, contadores e ciclo de progresso exibidos são
   exclusivos da Conta B — nada da Conta A aparece.
3. Voltar para a Conta A.
4. **Esperado**: tudo da Conta A continua exatamente como estava.
5. No Rules Playground do Firebase Console, repetir os 4 casos de
   `contracts/firestore-rules.md` para `sessoes` e `ciclos` (8
   verificações).
6. **Esperado**: mesmo resultado dos 4 casos já validados para `treinos`
   pela spec 022 — leitura cruzada rejeitada, leitura/escrita própria
   permitida, cliente sem autenticação rejeitado, personificação via corpo
   do documento rejeitada.

## Cenário 7 — Histórico continua legível com treino alterado depois (US6)

Verificação por inspeção direta no Firebase Console (não exige UI nova,
já que edição de treino não é exposta nesta spec):

1. Registrar uma sessão de um treino com nome X e um exercício Y.
2. No Firebase Console, abrir o documento da sessão criada
   (`users/{uid}/sessoes/{sessaoId}`) e confirmar que ele tem
   `treinoNomeSnapshot` igual a X e `exerciciosSnapshot` incluindo Y com a
   categoria correta.
3. No mesmo Console, editar manualmente o documento do treino de origem
   (`users/{uid}/treinos/{treinoId}`), mudando o `nome` para um valor
   diferente de X.
4. Reabrir o histórico (RF08/RF18) no app.
5. **Esperado**: a sessão registrada no passo 1 continua mostrando X (o
   nome original) no histórico, não o novo nome editado no Console — o
   histórico não voltou a consultar o treino de origem.
6. Desfazer a edição manual no Console (voltar o nome para X), para não
   deixar o ambiente de teste inconsistente para os demais cenários.

## Cenário 8 — Offline e abertura a frio (FR-019/FR-020)

1. Com sessões/histórico/ciclo já sincronizados pelo menos uma vez,
   remover o app dos recentes (não só minimizar) e ativar o modo avião
   **antes** de reabrir.
2. Abrir o app em modo avião.
3. **Esperado**: lista de treinos, histórico e ciclo de progresso aparecem
   corretamente, via cache local — mesmo teste mais rigoroso já validado
   pela spec 022 para treinos.
4. Ainda em modo avião, registrar uma série, finalizar uma sessão, editar
   uma série e importar um arquivo com múltiplos treinos.
5. **Esperado**: todas as ações funcionam sem travar a interface nem exibir
   erro de rede — mensagens de sucesso aparecem normalmente (FR-019/FR-021).
6. Reconectar a internet.
7. **Esperado**: os dados registrados offline aparecem em outro
   aparelho/sessão da mesma conta pouco depois de reconectar.
8. Confirmar que o registro de uma série continuou levando no máximo 2
   toques em todo o cenário (RNF03, FR-022).

## Referências

- Contratos: [`contracts/sessao-treino-storage.md`](./contracts/sessao-treino-storage.md),
  [`contracts/ciclo-treino-storage.md`](./contracts/ciclo-treino-storage.md),
  [`contracts/lista-treinos-e-historico.md`](./contracts/lista-treinos-e-historico.md),
  [`contracts/firestore-rules.md`](./contracts/firestore-rules.md)
- Modelo de dados: [`data-model.md`](./data-model.md)
- Decisões técnicas: [`research.md`](./research.md)
- Critérios de aceite formais: `spec.md` (Acceptance Scenarios de cada User Story)
