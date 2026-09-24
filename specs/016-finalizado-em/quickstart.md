# Quickstart: "Finalizado em" na Lista de Treinos

**Feature**: `016-finalizado-em`

Validação via web (Playwright ou navegador) e confirmação manual em Android e iOS
(Princípio III) — esta feature não depende de nenhuma API nativa, diferente de RF13
(vibração).

## Pré-requisitos

- Perfil ativo com pelo menos dois treinos importados (um deles com nome duplicado de
  outro, para os Cenários 3-5).

## Cenário 1 — "Finalizado em" após a primeira sessão (US1)

1. Importar um treino, ainda sem nenhuma sessão finalizada.
2. Abrir "Meus Treinos" e confirmar que o item mostra "Nunca treinado" (FR-002).
3. Executar esse treino e finalizar a sessão (RF07).
4. Voltar para "Meus Treinos".
5. **Esperado**: o item agora mostra "Finalizado em `<data e hora>`", referente à
   sessão que acabou de ser finalizada (FR-001).

## Cenário 2 — Data acompanha a sessão mais recente (US1)

1. Com o treino do Cenário 1 já tendo uma sessão finalizada, executar e finalizar uma
   segunda sessão do mesmo treino, em outro momento.
2. Voltar para "Meus Treinos".
3. **Esperado**: a data exibida é a da sessão mais recente (a segunda), não a
   primeira.

## Cenário 3 — Data de importação move para dentro da tela do treino (US2)

1. Abrir a tela de qualquer treino específico (lista de exercícios).
2. **Esperado**: a data de importação aparece como texto secundário, logo abaixo do
   nome do treino (FR-004).
3. Voltar para "Meus Treinos".
4. **Esperado**: nenhum item da lista mostra mais "Importado em" como texto principal
   (FR-003) — apenas "Finalizado em"/"Nunca treinado", exceto nos casos de colisão do
   Cenário 4/5.

## Cenário 4 — Homônimos com "Finalizado em" diferentes não precisam de desempate (US3)

1. Ter dois treinos com o mesmo nome: um já finalizado ao menos uma vez, outro nunca
   treinado (ou os dois finalizados em datas diferentes).
2. Abrir "Meus Treinos".
3. **Esperado**: os dois itens são diferenciáveis só pelo texto "Finalizado
   em"/"Nunca treinado" — nenhum dos dois mostra a data de importação (FR-006).

## Cenário 5 — Homônimos com o mesmo "Finalizado em" mostram data de importação (US3)

1. Ter dois treinos com o mesmo nome, ambos nunca treinados ("Nunca treinado" para os
   dois).
2. Abrir "Meus Treinos".
3. **Esperado**: os dois itens, além de "Nunca treinado", também mostram
   "Importado em `<data>`" como segunda linha — com datas de importação diferentes
   entre si, permitindo diferenciá-los (FR-005).
4. Repetir o teste finalizando uma sessão de ambos exatamente no mesmo dia/hora
   (ou usar dois arquivos de treino idênticos importados em sequência rápida, se a
   colisão de segundo for difícil de reproduzir manualmente) para confirmar que o
   mesmo desempate também se aplica quando ambos já foram treinados, não só no caso
   "nunca treinado".

## Referências

- Contratos: [`contracts/sessao-treino-storage.md`](./contracts/sessao-treino-storage.md),
  [`contracts/treino-list-item.md`](./contracts/treino-list-item.md)
- Critérios de aceite formais: `spec.md` (Acceptance Scenarios de cada User Story)
