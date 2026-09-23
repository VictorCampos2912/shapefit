# Quickstart: Conclusão Explícita de Sessão de Treino

**Feature**: `013-nova-sessao-treino`

Validação manual em Android e iOS (Princípio III da constituição).

## Pré-requisitos

- Perfil ativo com pelo menos um treino importado (RF01/RF02).

## Cenário 1 — Lista fica estável, toda verde, após concluir o último exercício (US1)

1. Abrir um treino e concluir todos os exercícios, um a um, deixando o último por
   último.
2. Concluir o último exercício pendente.
3. **Esperado**: a lista de exercícios volta a aparecer (tela de lista, não de
   execução do exercício individual) com **todos** os itens mostrando o indicador
   verde de "Concluído ✓" — e permanece assim, sem reverter sozinha para "não
   iniciado" depois de alguns segundos.
4. O banner "🎉 Parabéns pelo treino de hoje!" está visível.
5. O botão "Finalizar treino" (amarelo) **não** aparece mais.
6. Um novo botão "Nova sessão de Treino" aparece.

## Cenário 2 — Nova sessão só começa quando o usuário decide (US2)

1. A partir do estado final do Cenário 1 (lista toda verde, botão "Nova sessão de
   Treino" visível), aguardar alguns segundos sem tocar em nada.
2. **Esperado**: nada muda sozinho — a lista continua toda verde.
3. Tocar em "Nova sessão de Treino".
4. **Esperado**: a lista volta ao estado inicial (nenhum exercício marcado como
   concluído), pronta para apertar "Iniciar exercício" em qualquer um deles de novo.

## Cenário 3 — Contador e histórico não dependem do botão (US3)

1. Repetir o Cenário 1 até o último exercício ser concluído (lista toda verde).
2. **Sem** apertar "Nova sessão de Treino", voltar para a aba "Treinos".
3. **Esperado**: o contador de sessões finalizadas ao lado do nome do treino (RF07) já
   aumentou em 1.
4. Ir para a aba "Histórico" (RF08) e conferir que os registros desta sessão já
   aparecem.
5. Voltar a abrir o mesmo treino.
6. **Esperado (corrigido em 2026-09-23, FR-007)**: a tela continua mostrando o
   treino como concluído (todos os exercícios verdes, banner, botão "Nova sessão de
   Treino") — **não** reseta sozinha por ter navegado para longe e voltado. Só reseta
   quando o usuário aperta "Nova sessão de Treino" explicitamente (ver Cenário 5).

## Cenário 4 — "Finalizar treino" continua funcionando antes de tudo concluído

1. Abrir um treino e concluir só parte dos exercícios (não todos).
2. **Esperado**: o botão "Finalizar treino" (amarelo) está visível; "Nova sessão de
   Treino" não aparece.
3. Tocar em "Finalizar treino".
4. **Esperado**: comportamento idêntico ao já existente antes desta feature — sessão
   encerrada com os exercícios pendentes não registrados, tela volta ao estado
   inicial.

## Cenário 5 — Reset só acontece com o botão, mesmo depois de navegar (FR-007)

1. Repetir os passos 1-5 do Cenário 3 (treino concluído, navegado para longe e de
   volta, ainda mostrando tudo verde).
2. Apertar "Nova sessão de Treino".
3. **Esperado**: a tela reseta (nenhum exercício concluído).
4. Navegar para outra aba e voltar a abrir o mesmo treino de novo.
5. **Esperado**: a tela continua no estado resetado — não volta a mostrar a sessão
   anterior como concluída.

## Referências

- Contrato de handlers: [`contracts/treinoId-screen.md`](./contracts/treinoId-screen.md)
- Critérios de aceite formais: `spec.md` (Acceptance Scenarios de cada User Story)
