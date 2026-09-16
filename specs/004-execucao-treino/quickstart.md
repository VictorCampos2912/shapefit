# Quickstart: Validação de "Tela de Execução do Treino" (RF03)

**Feature**: 004-execucao-treino | **Date**: 2026-09-15

Guia para validar manualmente o comportamento descrito na spec, nos dois aparelhos-alvo
(Redmi Note 12/Android e iPhone 16 Plus/iOS), via Expo Go, conforme Princípio III da
Constituição. Mesma abordagem usada na validação do RF10, RF01 e RF02.

## Pré-requisitos

- RF10 (perfil local), RF01 (importar treino) e RF02 (listar treinos) implementados e
  funcionando — esta feature depende de um perfil ativo e de ao menos um treino importado
  e visível na lista
- Dependências instaladas: `npm install` (nenhuma dependência nova é introduzida por esta
  feature — ver research.md)
- Expo Go instalado no aparelho de teste
- Um treino de exemplo com **múltiplos exercícios** já importado para o perfil de teste,
  ex.: `docs/exemplos/treino-exemplo.json` ou
  `docs/exemplos/treino-exemplo pernas.json`

## Como rodar

```bash
npm run start
# ou, direcionado à plataforma:
npm run android
npm run ios
```

Escanear o QR code com o Expo Go (Android) ou a câmera (iOS). Certificar-se de que um
perfil já está ativo e que o treino de teste já aparece na lista de treinos (RF02) antes de
iniciar os cenários abaixo.

## Cenários de validação (mapeados às User Stories da spec)

### 1. Visualizar os exercícios planejados do treino selecionado (User Story 1)

1. Na lista de treinos, tocar no treino de teste (com múltiplos exercícios).
   **Esperado**: o app navega para a tela de execução, exibindo a lista de exercícios
   daquele treino.
2. Conferir, para cada exercício listado, os dados planejados exibidos.
   **Esperado**: séries, reps_alvo, carga_sugerida_kg e descanso_seg exibidos batem
   exatamente com os valores do JSON importado.

### 2. Selecionar livremente qual exercício iniciar (User Story 2)

1. Na tela de execução, tocar no segundo ou terceiro exercício da lista (não no primeiro).
   **Esperado**: o exercício abre normalmente, sem exigir que os exercícios anteriores da
   lista sejam abertos primeiro.
2. Voltar para a lista de exercícios (sem concluir nada) e tocar no primeiro exercício.
   **Esperado**: o primeiro exercício também abre normalmente, disponível como qualquer
   outro.

### 3. Iniciar um exercício selecionado (User Story 3)

1. Abrir qualquer exercício ainda não iniciado.
   **Esperado**: um botão "Iniciar exercício" é exibido.
2. Tocar em "Iniciar exercício".
   **Esperado**: os campos de registro (carga e repetições) da série atual aparecem.

### 4. Registrar carga e repetições da série atual (User Story 4)

1. Após iniciar um exercício, observar o campo de carga.
   **Esperado**: já vem preenchido com o valor de `carga_sugerida_kg` do JSON daquele
   exercício.
2. Editar o campo de carga para um valor decimal diferente (ex.: de `40` para `42.5`).
   **Esperado**: o app aceita o novo valor.
3. Tentar digitar uma letra ou símbolo no campo de carga (ex.: "abc").
   **Esperado**: a entrada é rejeitada; o campo mantém apenas o valor numérico válido.
4. Preencher o campo de repetições feitas com um número inteiro (ex.: `10`).
   **Esperado**: o valor é aceito e permanece visível, associado à série atual.

### 5. Identificar visualmente qual série está em andamento (User Story 5)

1. Iniciar um exercício com `series` igual a 4 (ou outro valor > 1) no JSON.
   **Esperado**: o indicador de série exibe "Série 1 de 4" (ou equivalente) ao iniciar.

> Nota: o avanço para "Série 2 de 4" depende da conclusão da série 1, que é escopo do RF04
> (botão "Concluir série"). Nesta feature, validar apenas que o indicador aparece
> corretamente para a série atual no momento em que o exercício é iniciado.

### 6. Hierarquia visual entre foco e secundário (User Story 6)

1. Com o treino tendo exercícios em diferentes estados (não iniciado / em andamento),
   observar a lista de exercícios.
   **Esperado**: diferenciação visual clara entre os estados (ex.: estilo ou cor
   distintos).
2. Comparar a tela de execução lado a lado (ou em sequência) com a tela de lista de
   treinos (RF02).
   **Esperado**: mesma tipografia, espaçamento e paleta de cores — sem sensação de "app
   diferente" entre as duas telas.

## Critérios de aceite de referência

Ver [docs/criterios-aceite.md](../../docs/criterios-aceite.md), seção "RF03 — Tela de
execução: exibir exercício, série, campos de carga e reps", para a lista completa de
checkboxes originais usados como base desta spec.
