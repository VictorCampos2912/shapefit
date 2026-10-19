# Quickstart: Arquivamento Lógico de Treinos, "Encerrar Ciclo" e Tratamento de Sessões Abandonadas

**Feature**: `026-arquivamento-treinos-ciclo`

Roteiro de validação manual em Android (Constitution v2.0.0, Princípio
III). iOS pendente por falta de conta Apple Developer paga (mesma situação
das specs 022-025). Pré-requisito: `firestore.rules` atualizado
(`contracts/firestore-rules.md`) publicado no Console do Firebase — passo
manual do usuário, confirmar antes de iniciar.

## Cenário 1 — Arquivar um treino sem sessão em andamento (US1)

1. Com um treino que já tem sessões finalizadas e nenhuma em andamento,
   abrir "Meus treinos" e arquivá-lo (pelo menu "mais opções" do item, ou
   de dentro da tela do treino).
2. **Esperado**: confirmação pede 1 toque adicional, sem menção a sessão
   em andamento; depois de confirmar, o treino desaparece imediatamente
   da lista, sem precisar fechar/reabrir o app.
3. Abrir o histórico ("Por exercício" e "Por data").
4. **Esperado**: as sessões desse treino continuam aparecendo
   normalmente, com nome do treino/exercícios do momento em que foram
   feitas.

## Cenário 2 — Arquivar um treino COM sessão em andamento (US1, FR-010)

1. Iniciar uma execução de um treino, registrar ao menos uma série (para
   a sessão existir), sem finalizar.
2. Arquivar esse treino (pela lista ou pela própria tela de execução).
3. **Esperado**: o texto de confirmação avisa que a sessão em andamento
   também será finalizada; depois de confirmar, o treino some da lista e
   o destaque "Em andamento" some junto.
4. Conferir no histórico: a sessão aparece como finalizada, com as séries
   que já tinham sido registradas (nenhuma perda).

## Cenário 3 — Bloqueio de execução de treino arquivado (FR-003)

**Nota (confirmado em teste real, 2026-10-18)**: o passo 1 abaixo só é
reproduzível por navegação direta residual (a tela já estar aberta) ou por
um link/deep link retido — **não existe caminho pela UI normal** para
"tentar abrir" a execução de um treino já arquivado, porque arquivar já
remove o treino por completo da lista (Cenário 1). Isso não é uma lacuna:
é a mesma garantia do FR-003 demonstrada por outro ângulo. Sem uma
ferramenta de deep link (`adb`/cabo), valide só o passo 3 abaixo (retorno
do segundo plano), que é totalmente reproduzível pela UI.

1. Com um treino já arquivado, tentar chegar na tela de execução dele por
   navegação direta residual (ex.: estava com a tela já aberta antes de
   arquivar em outro ponto, ou usar um link retido).
2. **Esperado**: mensagem "Este treino foi arquivado", sem acesso à lista
   de exercícios.
3. **Caminho do retorno do segundo plano**: abrir a tela de execução de um
   treino ainda ativo, colocar o app em segundo plano (sem fechar), e
   arquivar esse mesmo treino por outro meio — **forma prática de
   simular**: no Console do Firebase (Firestore Database → dados), editar
   o documento `users/{uid}/treinos/{treinoId}` diretamente e preencher
   `arquivadoEm` com qualquer string de data (ex.: a data/hora atual em
   ISO 8601) — mais rápido e confiável para teste manual do que
   coordenar um segundo aparelho/sessão de verdade, com o mesmo efeito
   observável pelo app. Depois, voltar ao app.
4. **Esperado**: ao voltar ao primeiro plano, a tela também passa a
   mostrar a mensagem de bloqueio (não fica presa na tela de execução
   antiga).

## Cenário 4 — Restaurar um treino arquivado (US2, FR-006)

1. No menu de Ações, abrir "Treinos arquivados".
2. **Esperado**: lista mostra os treinos arquivados (incluindo os dos
   Cenários 1/2).
3. Restaurar um deles.
4. **Esperado**: volta a aparecer em "Meus treinos" imediatamente, com
   histórico, contador de sessões e indicador de ciclo (se ainda fizer
   parte de um ciclo ativo) intactos.

## Cenário 5 — Universo do histórico "Por exercício" depois de arquivar (FR-005)

1. Arquivar um treino que tem um exercício **nunca registrado** em
   nenhuma sessão.
2. Abrir o histórico "Por exercício".
3. **Esperado**: esse exercício não aparece mais na lista (universo de
   "nunca registrado" só considera treinos ativos).
4. Arquivar um treino que **tem** sessões registradas (Cenário 1 já faz
   isso) e conferir de novo o histórico "Por exercício".
5. **Esperado**: os exercícios desse treino continuam aparecendo
   normalmente, pelos registros das sessões já feitas (não pelo treino em
   si).

## Cenário 6 — Encerrar ciclo e importar novo lote (US3)

1. Com um ciclo de progresso ativo (menos de 40 sessões finalizadas),
   abrir o menu de Ações e encerrar o ciclo.
2. **Esperado**: anel(éis) de progresso e aviso de "Hora de trocar o
   treino" (se estivesse visível) somem de "Meus treinos"; histórico e
   contadores dos treinos do ciclo continuam intactos.
3. Importar um novo arquivo com múltiplos treinos.
4. **Esperado**: a importação funciona normalmente, sem a mensagem de
   bloqueio — mesmo o ciclo anterior não tendo atingido 40 sessões.
5. **Caso de regressão (ciclo antigo nunca encerrado)**: repetir os passos
   1-4 uma segunda vez, de forma que, no momento de encerrar o ciclo mais
   novo, já exista um ciclo **anterior** (de uma rodada de teste passada)
   com `encerradoEm` ainda nulo — seja porque ele já chegou a 40 sessões
   e nunca foi encerrado manualmente, seja porque nunca chegou a 40 e
   também nunca foi encerrado.
6. **Esperado**: encerrar o ciclo mais novo **não reabre** esse ciclo
   anterior — "Meus treinos" continua sem nenhum anel e sem o aviso de
   "Hora de trocar o treino", e o link "Encerrar ciclo" não aparece em
   Ações (sem ciclo atual para encerrar), exatamente como se não
   existisse ciclo nenhum. Se o ciclo antigo "voltar a aparecer" de
   qualquer forma, é a regressão do bug corrigido em 2026-10-18 (ver
   `research.md`, Decisão 7).

## Cenário 7 — "Encerrar ciclo" sem ciclo ativo (FR-007)

1. Sem nenhum ciclo ativo (conta nova, ou depois do Cenário 6), abrir o
   menu de Ações.
2. **Esperado**: a ação "Encerrar ciclo" não aparece (ou aparece
   desabilitada, conforme a implementação) — nada para encerrar.

## Cenário 8 — Finalizar sessão abandonada direto de "Meus treinos" (US4, FR-011)

1. Deixar um treino com uma sessão "Em andamento" (ao menos uma série
   registrada, sem finalizar).
2. Em "Meus treinos", usar o menu "mais opções" do item para finalizar a
   sessão diretamente (sem abrir a tela de execução).
3. **Esperado**: confirmação explícita antes de efetivar; depois, o
   destaque "Em andamento" some, sem abrir a tela de execução do treino.
4. Conferir histórico e contador de sessões finalizadas do treino.
5. **Esperado**: a sessão conta normalmente — mesmo efeito de "Finalizar
   treino" manual (contador +1, aparece no histórico).

## Cenário 9 — Isolamento entre contas

1. Repetir os Cenários 1, 4 e 6 com duas contas Google reais, trocando de
   conta de verdade no app entre cada uma.
2. **Esperado**: arquivamento, restauração e encerramento de ciclo de uma
   conta nunca aparecem nem afetam a outra.

## Cenário 10 — Rules Playground (contrato de regras)

No Firebase Console (Firestore Database → Regras → Laboratório de testes
de regras), com duas contas reais (`A`, `B`):

1. Os 4 casos já validados pelas specs 022/025, revalidar só se o Console
   pedir (não obrigatório repetir).
2. **Caso novo**: para cada uma das 3 coleções (`treinos`, `sessoes`,
   `ciclos`), simular `delete` em `users/A/<coleção>/qualquer-id`
   autenticado como `A` (dono do caminho).
3. **Esperado**: as 3 simulações de `delete` são negadas, mesmo sendo a
   própria conta dona do documento.

## Cenário 11 — Tudo em modo avião (offline)

**Atenção, risco não validado antes**: `arquivarTreino`, `restaurarTreino`,
`encerrarCiclo` e `finalizarSessaoPorId` (FR-001/FR-006/FR-007/FR-011)
escrevem por `updateDoc`/`batch.update` de um único campo, **sem nenhuma
leitura prévia** (`research.md`, Decisão 4). Até esta spec, só `setDoc` do
documento inteiro tinha sido confirmado confiável offline neste projeto
(specs 022-025) — `updateDoc`/`batch.update` **nunca foram testados
offline aqui**. Por isso, cada ação abaixo precisa de uma confirmação
extra de persistência, não só de "não travou":

Repetir os Cenários 1, 2, 3, 4, 6 e 8, com o aparelho em modo avião **e**
Wi-Fi desligado explicitamente (lição da spec 025 registrada na memória do
projeto — modo avião sozinho pode não desligar o Wi-Fi de fato em alguns
aparelhos).

1. **Esperado**: todas as ações funcionam sem travar a interface, sem erro
   de rede — mudanças aparecem imediatamente na tela (via cache local).
2. **Confirmação de persistência real (fazer logo após CADA ação deste
   cenário, ainda offline)**: remover o app dos apps recentes (não só
   minimizar) e reabrir **ainda em modo avião**. **Esperado**: o treino
   continua arquivado/restaurado, o ciclo continua encerrado, ou a sessão
   continua finalizada — a mudança sobreviveu a uma abertura a frio
   totalmente offline, provando que `updateDoc`/`batch.update` persistiu
   de verdade no cache local, não só na memória do componente React. Se
   alguma ação "voltar atrás" depois de reabrir, é um bug real deste
   formato de escrita offline, não um detalhe menor.
3. Reconectar a internet (desligar modo avião, religar Wi-Fi).
4. **Esperado**: tudo sincroniza normalmente — conferir, se possível, em
   outro aparelho/sessão da mesma conta.

## Cenário 12 — Arquivar pela tela do treino com descanso ativo (FR-001, limpeza de notificação)

1. Na tela de execução de um treino, concluir uma série para iniciar o
   cronômetro de descanso (notificação de fim de descanso agendada, RF06).
2. Com o descanso ainda contando, usar o link "Arquivar treino" dessa
   mesma tela e confirmar.
3. **Esperado**: nenhum aviso de "fim do descanso" chega depois (a
   notificação agendada foi cancelada como parte do arquivamento, mesma
   limpeza que "Finalizar treino" já faz hoje); a tela volta para "Meus
   treinos" sem o cronômetro continuar em nenhum lugar.

## Cenário 13 — Arquivar offline, sem demora perceptível (SC-002)

1. Em modo avião (Wi-Fi desligado), em "Meus treinos", arquivar um treino
   pelo menu "mais opções".
2. **Esperado**: o item desaparece da lista imediatamente, no mesmo toque
   de confirmação — sem nenhum atraso perceptível esperando alguma
   leitura (atualização otimista da UI, antes mesmo da escrita no
   Firestore terminar).
3. Reconectar e conferir que o treino continua arquivado (não "voltou"
   sozinho) e que o histórico dele permanece intacto.

## Cenário 14 — Mensagem de bloqueio de importação orienta "Encerrar ciclo" (FR-009)

1. Com um ciclo ativo (menos de 40 sessões finalizadas), tentar importar
   um novo arquivo com múltiplos treinos.
2. **Esperado**: a mensagem de erro exibida menciona explicitamente "Para
   liberar agora, use Ações → Encerrar ciclo" (além da explicação da
   regra das 40 sessões já existente).

## Referências

- Contratos: [`contracts/firestore-rules.md`](./contracts/firestore-rules.md),
  [`contracts/treino-storage.md`](./contracts/treino-storage.md),
  [`contracts/ciclo-treino-storage.md`](./contracts/ciclo-treino-storage.md),
  [`contracts/sessao-treino-storage.md`](./contracts/sessao-treino-storage.md),
  [`contracts/treino-execucao.md`](./contracts/treino-execucao.md),
  [`contracts/lista-treinos-e-historico.md`](./contracts/lista-treinos-e-historico.md),
  [`contracts/acoes-e-sessao-abandonada.md`](./contracts/acoes-e-sessao-abandonada.md)
- Modelo de dados: [`data-model.md`](./data-model.md)
- Decisões técnicas: [`research.md`](./research.md)
- Critérios de aceite formais: `spec.md` (Acceptance Scenarios de cada User Story)
