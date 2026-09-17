# Quickstart: Validação de "Avançar Entre Séries e Exercícios" (RF04)

**Feature**: 005-avancar-series-exercicios | **Date**: 2026-09-16

Guia para validar manualmente o comportamento descrito na spec, nos dois aparelhos-alvo
(Redmi Note 12/Android e iPhone 16 Plus/iOS), via Expo Go, conforme Princípio III da
Constituição. Mesma abordagem usada nas features anteriores (RF10, RF01, RF02, RF03).

## Pré-requisitos

- RF10, RF01, RF02 e RF03 implementados e funcionando — esta feature depende de um perfil
  ativo, ao menos um treino importado com múltiplos exercícios, e da tela de execução já
  navegável (RF03)
- Dependências instaladas: `npm install` (nenhuma dependência nova é introduzida — ver
  research.md)
- Expo Go instalado no aparelho de teste
- Um treino de teste com pelo menos 2 exercícios, cada um com 2+ séries planejadas (para
  poder observar o avanço entre séries e a habilitação de "Concluir exercício")

## Como rodar

```bash
npm run start
# ou, direcionado à plataforma:
npm run android
npm run ios
```

## Cenários de validação (mapeados às User Stories da spec)

### 1. Concluir uma série e avançar automaticamente (User Story 1)

1. Iniciar um exercício com 3+ séries planejadas.
   **Esperado**: botão "Concluir série" desabilitado (campos vazios).
2. Preencher apenas a carga (deixar reps vazio).
   **Esperado**: botão "Concluir série" continua desabilitado.
3. Preencher também as repetições feitas.
   **Esperado**: botão "Concluir série" fica habilitado.
4. Tocar em "Concluir série".
   **Esperado**: indicador avança de "Série 1 de N" para "Série 2 de N"; campo de carga
   pré-preenchido com o valor usado na série 1; campo de repetições limpo.

### 2. Concluir um exercício (User Story 2)

1. Repetir o cenário 1 até concluir a última série planejada do exercício.
   **Esperado**: após a última série, o botão "Concluir exercício" aparece habilitado.
2. Tocar em "Concluir exercício".
   **Esperado**: o app volta para a lista de exercícios, com esse item marcado
   visualmente como concluído (✓).

### 3. Escolher livremente qual exercício fazer a seguir (User Story 3)

1. Com um exercício já concluído e outro ainda pausado (iniciado, mas não concluído),
   tocar no exercício pausado (não no "próximo da lista", se houver um terceiro exercício
   não iniciado entre eles).
   **Esperado**: o exercício pausado abre normalmente, retomando da série seguinte à
   última concluída.
2. A partir da lista, escolher um exercício não iniciado pulando outro ainda disponível.
   **Esperado**: abre normalmente, sem bloqueio de ordem.

### 4. Retomar o progresso após sair da tela ou fechar o app (User Story 4)

1. Concluir 1 ou 2 séries de um exercício (sem concluir o exercício inteiro).
2. Sair da tela de execução (voltar para a lista) e reabrir o mesmo exercício.
   **Esperado**: a série seguinte correta é exibida (ex.: se concluiu série 1, mostra
   "Série 2 de N"); dados da série 1 preservados.
3. Fechar o app completamente (matar o processo) e reabri-lo, navegando de volta ao mesmo
   treino.
   **Esperado**: o app abre na lista de exercícios (não direto no exercício); o exercício
   testado aparece como pausado; reabri-lo mostra a mesma série seguinte correta de antes
   de fechar o app.
4. Concluir um exercício inteiro, fechar e reabrir o app.
   **Esperado**: o exercício continua marcado como concluído na lista.

### 5. Múltiplas sessões em andamento simultâneas (Edge Case confirmado com o usuário)

1. Com o Treino A parcialmente concluído (ao menos uma série), voltar para a lista de
   treinos (RF02) e abrir o Treino B (diferente).
2. Concluir ao menos uma série do Treino B.
   **Esperado**: nenhum aviso ou bloqueio ao iniciar o Treino B com o Treino A ainda em
   andamento.
3. Voltar para o Treino A.
   **Esperado**: o progresso do Treino A continua intacto, independente do progresso já
   registrado no Treino B.

### 6. Bloqueio de troca de perfil com sessão em andamento (integração com RF10)

Este cenário valida que a escrita desta feature na chave `sessoes:<perfilId>` continua
compatível com a leitura já feita pelo RF10 (`existeSessaoEmAndamento`), que bloqueia a
troca de perfil ativo enquanto houver uma sessão não finalizada.

1. Com o perfil ativo tendo concluído ao menos uma série de um treino (sessão em
   andamento criada), tentar trocar de perfil ativo (ação já existente do RF10, ex.: "Perfil
   ativo: ... (trocar)").
   **Esperado**: a troca é bloqueada, com um aviso explicando que é preciso finalizar a
   sessão atual primeiro (comportamento do RF10, já implementado e validado
   anteriormente — este cenário confirma que ele continua funcionando após esta feature
   passar a escrever na mesma chave).
2. Sem nenhuma série concluída em nenhum treino do perfil ativo (nenhuma sessão criada
   ainda), tentar trocar de perfil.
   **Esperado**: a troca é permitida normalmente, sem bloqueio.

## Critérios de aceite de referência

Ver [docs/criterios-aceite.md](../../docs/criterios-aceite.md), seção "RF04 — Avançar
entre séries e exercícios", para a lista completa de checkboxes originais usados como base
desta spec.
