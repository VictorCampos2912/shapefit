# Quickstart: Validação de "Editar Registro de Série de uma Sessão Já Finalizada" (RF09b)

**Feature**: 011-editar-serie-finalizada | **Date**: 2026-09-20

Guia para validar manualmente o comportamento descrito na spec, nos dois
aparelhos-alvo (Redmi Note 12/Android e iPhone 16 Plus/iOS), via **development build**
(não Expo Go — migração já documentada desde o RF06 e reconfirmada no PRD v1.1, seção
9), conforme Princípio III da Constituição.

## Pré-requisitos

- RF10, RF01–RF08 e RF09a implementados e funcionando
- Development build instalado no aparelho (mesmo usado para validar o RF07/RF08)
- Pelo menos uma sessão já finalizada, com pelo menos um exercício registrado (pode
  reaproveitar os fixtures de `docs/exemplos/` já usados na validação do RF08:
  `treino-historico-a.json`/`treino-historico-b.json`)
- Um treino com duas sessões finalizadas distintas, ambas contendo o mesmo exercício
  (necessário para o Cenário 3, isolamento entre sessões)

## Cenários de validação (mapeados às User Stories da spec)

### 1. Corrigir carga/reps de um registro de uma sessão finalizada (User Story 1)

1. Abrir a aba "Histórico", expandir um exercício com pelo menos um registro, e tocar
   nesse registro.
   **Esperado**: os campos de carga e repetições daquele registro específico tornam-se
   editáveis, pré-preenchidos com os valores atuais.
2. Alterar a carga e/ou as repetições para um valor diferente e tocar em "Salvar
   edição".
   **Esperado**: um `Alert.alert` de confirmação aparece antes de qualquer gravação.
3. Confirmar no `Alert.alert`.
   **Esperado**: o novo valor aparece imediatamente na lista, sem precisar sair e
   voltar para a aba "Histórico".
4. Repetir a edição, mas cancelar no `Alert.alert` (ou tocar em outro lugar) em vez de
   confirmar.
   **Esperado**: nenhuma alteração é gravada; o valor exibido continua sendo o mesmo
   de antes da tentativa.
5. Tentar salvar uma edição com o campo de carga ou de repetições vazio.
   **Esperado**: o botão "Salvar edição" permanece desabilitado; nenhum `Alert.alert`
   aparece.

### 2. A sessão continua finalizada depois da edição (User Story 2)

1. Antes de editar, anotar (ou capturar em tela) o indicativo de sessões finalizadas
   daquele treino na lista de treinos (RF02/RF07 — o contador ao lado do nome do
   treino).
2. Editar um registro de uma sessão finalizada desse treino, conforme Cenário 1.
   **Esperado**: o contador de sessões finalizadas do treino, na lista de treinos,
   permanece exatamente o mesmo antes e depois da edição.
3. Tentar trocar de perfil ativo (RF10) logo após a edição, assumindo que não há
   nenhuma sessão em andamento de nenhum treino no momento.
   **Esperado**: a troca não é bloqueada por causa da sessão que acabou de ser
   editada.
4. Reabrir o mesmo treino e iniciar uma nova execução, registrando uma nova série.
   **Esperado**: uma sessão nova e distinta é criada (mesmo comportamento já validado
   pelo RF07) — a sessão editada permanece intacta e separada, não é reaproveitada.

### 3. Isolamento entre sessões finalizadas distintas do mesmo treino (Edge Case)

1. Com duas sessões finalizadas do mesmo treino, ambas contendo o mesmo exercício,
   abrir o histórico e expandir esse exercício — confirmar que os dois registros
   aparecem separadamente, ordenados por data.
2. Editar apenas o registro de uma das duas sessões (a mais antiga, por exemplo).
   **Esperado**: o valor do registro da outra sessão (não editada) permanece
   inalterado; a ordem dos dois registros na lista não muda (a data de nenhum dos dois
   foi alterada pela edição).

## Critérios de aceite de referência

Ver [docs/criterios-aceite.md](../../docs/criterios-aceite.md), seção "RF09b —
Editar registro de série já feito (sessões finalizadas no passado)", para a lista
completa de checkboxes originais usados como base desta spec.
