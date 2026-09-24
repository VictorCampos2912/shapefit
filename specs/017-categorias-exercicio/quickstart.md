# Quickstart: Categorias de Unidade por Exercício

**Feature**: `017-categorias-exercicio`

Validação via web (Playwright ou navegador) e confirmação manual em Android e iOS
(Princípio III) — sem API nativa envolvida.

## Pré-requisitos

- Um arquivo de treino de teste com 4 exercícios, um de cada categoria (`peso`,
  `tempo`, `distancia`, `repeticoes`) — criar em
  `docs/exemplos/treino-categorias.json` se ainda não existir, reaproveitando o
  schema já usado pelos exemplos existentes (`docs/exemplos/treino-exemplo.json`)
  mais o campo `categoria` por exercício.
- Um arquivo de treino já existente **sem** o campo `categoria` (ex.:
  `docs/exemplos/treino-exemplo.json`, já existente) — para o Cenário 4.

## Cenário 1 — Campos de registro por categoria na execução (US1)

1. Importar o arquivo de teste com as 4 categorias.
2. Abrir o exercício de categoria `peso` na execução.
3. **Esperado**: campos "Carga (kg)" e "Repetições feitas" — igual a hoje (FR-004).
4. Voltar e abrir o exercício de categoria `tempo`.
5. **Esperado**: campo principal rotulado "Tempo (min)" no lugar de "Carga (kg)";
   campo de reps continua presente.
6. Repetir para `distancia` — campo principal rotulado "Distância (km)".
7. Repetir para `repeticoes` — nenhum campo principal, só "Repetições feitas".
8. Em cada um dos 4, confirmar que o botão "Concluir série" só habilita quando os
   campos exibidos (reps sempre; mais o principal, exceto para `repeticoes`) estão
   preenchidos.

## Cenário 2 — Valor sugerido na unidade certa (US1, Acceptance Scenario 5)

1. Nos exercícios de categoria `tempo`/`distancia` do arquivo de teste, observar a
   linha de resumo do exercício (acima do botão "Iniciar exercício").
2. **Esperado**: o valor sugerido aparece com sufixo "min"/"km", não "kg". Para
   `repeticoes`, nenhum valor sugerido aparece nessa linha.

## Cenário 3 — Compatibilidade total sem o campo "categoria" (US2)

1. Importar `docs/exemplos/treino-exemplo.json` (ou qualquer exemplo já existente,
   sem o campo `categoria`).
2. **Esperado**: importação funciona normalmente, sem erro.
3. Abrir qualquer exercício desse treino na execução.
4. **Esperado**: comportamento idêntico a antes desta feature — campos "Carga (kg)"
   e "Repetições feitas".

## Cenário 4 — Categoria inválida descarta só o exercício (Edge Case)

1. Editar uma cópia do arquivo de teste, definindo `"categoria": "invalida"` em um
   dos exercícios.
2. Importar esse arquivo.
3. **Esperado**: esse exercício específico é descartado (com motivo indicado ao
   usuário), os demais exercícios do treino são importados normalmente — mesmo
   comportamento já validado pelo RF01 para outros campos inválidos.

## Cenário 5 — Histórico e edição refletem a categoria (US3)

1. Registrar pelo menos uma série de cada uma das 4 categorias (Cenário 1).
2. Finalizar a sessão.
3. Abrir a aba "Histórico" (RF08).
4. **Esperado**: cada exercício mostra seus registros com a unidade correta (kg,
   min, km, ou só reps para `repeticoes`) — mesmo padrão da execução.
5. Tocar em "Editar" em um registro de categoria `tempo`.
6. **Esperado**: o formulário de edição mostra "Tempo (min)" no lugar de "Carga
   (kg)" (RF09b).
7. Repetir a edição em um registro de categoria `repeticoes`.
8. **Esperado**: o formulário de edição mostra só o campo de reps, sem nenhum campo
   de carga/tempo/distância.
9. Repetir o teste de edição de série *em andamento* (antes de finalizar a sessão,
   RF09a) com um exercício de categoria `tempo` ou `repeticoes` — mesmo
   comportamento do passo 6/8, agora em `exercicio-execucao.tsx`.

## Referências

- Contratos: [`contracts/treino-storage.md`](./contracts/treino-storage.md),
  [`contracts/categoria-exercicio-util.md`](./contracts/categoria-exercicio-util.md),
  [`contracts/execucao-treino-screen.md`](./contracts/execucao-treino-screen.md),
  [`contracts/historico-e-edicao.md`](./contracts/historico-e-edicao.md)
- Modelo de dados: [`data-model.md`](./data-model.md)
- Critérios de aceite formais: `spec.md` (Acceptance Scenarios de cada User Story)
