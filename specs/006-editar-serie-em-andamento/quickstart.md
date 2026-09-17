# Quickstart: Validação de "Editar Registro de Série Já Feito" (RF09a)

**Feature**: 006-editar-serie-em-andamento | **Date**: 2026-09-17

Guia para validar manualmente o comportamento descrito na spec, nos dois aparelhos-alvo
(Redmi Note 12/Android e iPhone 16 Plus/iOS), via Expo Go, conforme Princípio III da
Constituição. Mesma abordagem usada nas features anteriores (RF10, RF01-RF04).

## Pré-requisitos

- RF10, RF01, RF02, RF03 e RF04 implementados e funcionando — esta feature depende de um
  perfil ativo, um treino importado, e de uma sessão em andamento com pelo menos uma série
  já concluída (via RF04)
- Dependências instaladas: `npm install` (nenhuma dependência nova é introduzida — ver
  research.md)
- Expo Go instalado no aparelho de teste
- Um treino de teste com pelo menos 1 exercício com 3+ séries planejadas (para poder editar
  uma série que não é a mais recente)

## Como rodar

```bash
npm run start
# ou, direcionado à plataforma:
npm run android
npm run ios
```

## Cenários de validação (mapeados às User Stories da spec)

### 1. Corrigir carga/reps de uma série já concluída, no mesmo exercício (User Story 1)

1. Iniciar um exercício com 3+ séries planejadas e concluir as séries 1 e 2 (fluxo normal
   do RF04), permanecendo na série 3 (ainda não concluída).
   **Esperado**: a tela exibe as séries 1 e 2 já concluídas, com seus valores, cada uma com
   uma ação de editar.
2. Tocar na ação de editar da série 1 (não a série atual, série 3).
   **Esperado**: a edição é permitida normalmente — nada impede editar uma série que não é a
   mais recente.
3. Alterar o valor de carga (ex.: de 40 para 42.5) e tentar salvar com o campo de reps
   vazio.
   **Esperado**: a ação de salvar permanece bloqueada/desabilitada.
4. Preencher reps com um valor válido e tocar em salvar.
   **Esperado**: um diálogo de confirmação nativo (`Alert.alert`) aparece antes de qualquer
   persistência.
5. Cancelar o diálogo.
   **Esperado**: nenhuma alteração é salva; a série 1 continua exibindo o valor original
   (40kg).
6. Repetir a edição e, desta vez, confirmar o diálogo.
   **Esperado**: a série 1 passa a exibir o novo valor (42.5kg) imediatamente na tela.
7. Sair da tela de execução e voltar a ela (sem fechar o app).
   **Esperado**: o novo valor da série 1 continua sendo exibido.
8. Fechar o app completamente e reabri-lo, navegando de volta ao mesmo exercício.
   **Esperado**: o valor editado (42.5kg) continua sendo o valor exibido — a edição
   sobreviveu ao fechamento do app, assim como as séries concluídas normalmente (RF04).

### 2. Editar uma série de um exercício já concluído, sem reabri-lo como "em andamento" (User Story 2)

1. Concluir todas as séries planejadas de um exercício e tocar em "Concluir exercício"
   (fluxo normal do RF04) — o app volta para a lista de exercícios, com esse item marcado
   como concluído (✓).
2. A partir da lista, tocar novamente nesse exercício já concluído para reabri-lo.
   **Esperado**: a tela exibe as séries já concluídas com opção de editar (visualização),
   sem exibir novamente o botão "Concluir exercício" e sem qualquer indicação de "em
   andamento".
3. Editar uma das séries (ex.: a série 2) e confirmar via `Alert.alert`.
   **Esperado**: o novo valor é salvo; o exercício permanece concluído.
4. Voltar para a lista de exercícios do treino.
   **Esperado**: o exercício editado continua exibido com a marcação visual de concluído
   (✓), sem nenhuma mudança nesse indicador.
5. Fechar e reabrir o app, navegando de volta à lista de exercícios.
   **Esperado**: o exercício continua marcado como concluído; reabri-lo mostra o valor
   editado da série 2.

### 3. Validação de entrada na edição (Edge Case)

1. Editar uma série e tentar inserir um valor de carga não numérico (ex.: letras).
   **Esperado**: o campo rejeita a entrada não numérica, mesma sanitização já usada no
   preenchimento original (RF03).
2. Editar uma série e tentar inserir um valor negativo de repetições.
   **Esperado**: o campo não aceita o sinal negativo (mesma sanitização já usada no RF03).
3. Editar uma série sem alterar nenhum valor (reabrir a edição e confirmar sem mudar nada).
   **Esperado**: o diálogo de confirmação ainda é exibido; ao confirmar, o valor é regravado
   igual ao anterior, sem erro perceptível.

## Critérios de aceite de referência

Ver [docs/criterios-aceite.md](../../docs/criterios-aceite.md), seção "RF09a — Editar
registro de série já feito (sessão atual, adiantado para após o RF04)", para a lista
original de checkboxes usada como base desta spec.
