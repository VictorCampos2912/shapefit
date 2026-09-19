# Quickstart: Validação de "Salvar Sessão de Treino" (RF07)

**Feature**: 009-salvar-sessao-treino | **Date**: 2026-09-18

Guia para validar manualmente o comportamento descrito na spec, nos dois
aparelhos-alvo (Redmi Note 12/Android e iPhone 16 Plus/iOS), via development build
(não Expo Go — ver specs/008-notificacao-fim-descanso/research.md, Decisão 0),
conforme Princípio III da Constituição.

## Pré-requisitos

- RF10, RF01, RF02, RF03, RF04, RF09a, RF05 e RF06 implementados e funcionando
- Development build instalado no aparelho (mesmo build usado para validar o RF06),
  com as configurações de notificação/bateria já ajustadas conforme
  specs/008-notificacao-fim-descanso/quickstart.md (para validar corretamente o
  cancelamento do aviso ao finalizar)
- Um treino de teste com pelo menos 2 exercícios, cada um com poucas séries (ex.: 2)
  para acelerar os testes

## ⚠️ Passo obrigatório antes de iniciar os testes: limpar dados de sessões antigas

Sessões de treino criadas pelos testes manuais do RF04/RF05/RF06 **não têm** o campo
`id` introduzido por esta feature (spec.md, Assumptions — nenhuma migração de dados é
feita). Se essas sessões antigas permanecerem no `AsyncStorage` do aparelho ao validar
o RF07, o app pode se comportar de forma inconsistente ao tentar localizá-las por `id`
(por exemplo, `sessaoAtualId` carregado de uma sessão antiga ficaria `undefined`, e
`finalizarSessao` falharia ao tentar localizar por esse `id` inexistente).

**Antes de rodar qualquer cenário abaixo**, escolher uma das opções:
- Desinstalar e reinstalar o app no aparelho (limpa todo o `AsyncStorage`, incluindo
  perfis — será necessário recriar o perfil de teste e reimportar o treino de teste);
  ou
- Se houver uma forma de inspecionar/limpar chaves específicas do `AsyncStorage`
  durante o desenvolvimento (ex.: um menu de debug), limpar especificamente as
  chaves `sessoes:<perfilId>` de todos os perfis de teste, sem precisar recriar os
  perfis/treinos.

Isso é aceitável neste momento porque o app ainda não tem usuários reais além do
desenvolvedor durante o desenvolvimento — não representa perda de dados de um usuário
final.

## Cenários de validação (mapeados às User Stories da spec)

### 1. Finalização automática ao concluir todos os exercícios (User Story 1)

1. Concluir todas as séries de todos os exercícios de um treino de teste.
   **Esperado**: ao concluir o último exercício pendente, a sessão é finalizada
   automaticamente — sem nenhum toque adicional. A tela volta ao estado de "sem
   sessão em andamento" (progresso não aparece mais como em andamento).
2. Tentar trocar de perfil ativo (RF10) logo em seguida (assumindo que não há outra
   sessão em andamento de outro treino).
   **Esperado**: a troca não é mais bloqueada por causa dessa sessão.
3. Reabrir o mesmo treino novamente.
   **Esperado**: todos os exercícios aparecem como não iniciados — nenhum resquício
   da execução anterior (nem séries, nem cargas, nem reps).

### 2. Finalizar manualmente com exercícios pendentes (User Story 2)

1. Iniciar um treino com pelo menos 3 exercícios; concluir algumas séries de apenas
   1 deles, deixando os demais intocados.
2. Tocar em "Finalizar treino".
   **Esperado**: a sessão é finalizada imediatamente, contendo o registro do
   exercício parcialmente concluído; nenhum registro é criado para os exercícios
   nunca iniciados.
3. Repetir sem registrar nenhuma série antes de tocar em "Finalizar treino".
   **Esperado**: a sessão é finalizada "vazia" (sem nenhum exercício registrado),
   sem erro.
4. Verificar que o botão "Finalizar treino" está visível na tela de lista de
   exercícios, e **não** aparece dentro da tela de execução de um exercício
   específico. *(Ajustado após validação manual — ver research.md, Decisão 7:
   dentro da execução de um exercício, o botão soava como uma ação de "emergência"
   fora de contexto.)*
   **Esperado**: o botão só existe na lista de exercícios (cor `warning`/amarelo);
   para acessá-lo a partir da tela de um exercício específico, o usuário toca em
   "← Voltar para exercícios" primeiro.

### 3. Repetir a execução do mesmo treino ao longo do tempo (User Story 3)

1. Finalizar uma sessão de um treino (automática ou manualmente).
2. Abrir o mesmo treino novamente e concluir uma série de um exercício.
   **Esperado**: uma nova sessão é criada — a sessão antiga (já finalizada)
   permanece intacta, não é reaberta nem alterada.
3. (Se uma forma de inspecionar o storage estiver disponível durante o
   desenvolvimento) Confirmar que existem duas entradas distintas em
   `sessoes:<perfilId>` para o mesmo `treinoId` — uma com `finalizadaEm` preenchido
   e outra com `finalizadaEm: null`, cada uma com um `id` diferente.

### 4. Cancelamento do cronômetro/notificação ao finalizar (Edge Case, cobre FR-011)

1. Concluir uma série com descanso configurado (ex.: 60s), deixando o cronômetro de
   descanso (RF05) ativo e a notificação já agendada (RF06).
2. Antes do cronômetro chegar a zero, tocar em "Finalizar treino".
   **Esperado**: a sessão é finalizada; o cronômetro desaparece da tela
   imediatamente; **nenhum** aviso sonoro/vibração dispara depois, no horário em
   que o descanso originalmente terminaria.
3. Repetir o mesmo teste deixando a finalização ocorrer automaticamente (ao concluir
   o último exercício com um cronômetro ainda ativo de uma série anterior, se o
   fluxo do treino permitir esse estado).
   **Esperado**: mesmo resultado — nenhum aviso dispara após a finalização.

### 5. Idempotência ao finalizar duas vezes (Edge Case, cobre FR-006)

1. Tocar em "Finalizar treino".
2. Tentar tocar novamente rapidamente (duplo toque), ou navegar de volta para a tela
   e tentar finalizar de novo, se o botão ainda estiver acessível por algum motivo.
   **Esperado**: nenhum erro visível; a sessão permanece finalizada com o mesmo
   `finalizadaEm` da primeira finalização (não é sobrescrito nem duplicado).

### 6. Contador de sessões finalizadas na lista de treinos (User Story 4 — demanda de UX pós-validação)

1. Abrir a tela de lista de treinos, observando um treino que nunca foi executado.
   **Esperado**: nenhum indicativo/contador aparece junto ao nome desse treino.
2. Finalizar uma sessão desse treino (automática ou manualmente) e voltar para a
   lista de treinos.
   **Esperado**: um indicativo circular exibindo "1" aparece junto ao nome do
   treino, sem precisar fechar e reabrir o app.
3. Repetir uma nova execução do mesmo treino e finalizá-la também; voltar para a
   lista.
   **Esperado**: o indicativo agora exibe "2".
4. Repetir o mesmo teste com um segundo treino, garantindo que a contagem de um
   treino não afeta a do outro.
   **Esperado**: cada treino mantém sua própria contagem, independente dos demais.

## Critérios de aceite de referência

Ver [docs/criterios-aceite.md](../../docs/criterios-aceite.md), seção "RF07 — Salvar
sessão de treino (completa e em andamento)", para a lista completa de checkboxes
originais usados como base desta spec.
