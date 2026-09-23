# Quickstart: Tela Separada para Ações de Perfil e Importação

**Feature**: `015-menu-de-acoes`

Validação manual em Android e iOS (Princípio III da constituição) — também
verificável via Expo web.

## Cenário 1 — Tela "Treinos" focada só nos treinos (US1)

1. Abrir a aba "Treinos".
2. **Esperado**: nenhum texto "Perfil ativo", "Importar treino" ou "Importar treino
   de exemplo" aparece nessa tela — só o título, o ícone de ações no canto do
   título, e a lista de treinos (ou o estado vazio).

## Cenário 2 — Ícone de ações acessível em qualquer aba (US2)

1. Na aba "Treinos", tocar no ícone de ações.
2. **Esperado**: abre a tela "Ações", com as três ações (trocar perfil, importar
   treino, importar treino de exemplo).
3. Voltar, ir para a aba "Histórico", tocar no ícone de ações lá também.
4. **Esperado**: mesmo comportamento — mesma tela "Ações" abre, no mesmo lugar
   relativo (canto do título).

## Cenário 3 — As três ações continuam funcionando exatamente como antes (US2)

1. Na tela "Ações", tocar em "Trocar perfil".
2. **Esperado**: comportamento idêntico ao já existente (leva para seleção de
   perfil).
3. Voltar para "Ações", tocar em "Importar treino de exemplo".
4. **Esperado**: mesma mensagem de sucesso já validada no RF01, sem nenhuma mudança.
5. Voltar para a aba "Treinos".
6. **Esperado**: o treino de exemplo recém-importado aparece na lista (recarregada
   automaticamente ao voltar para a aba).

## Cenário 4 — Estado vazio orienta para a nova localização (Edge Case)

1. Com um perfil sem nenhum treino importado, abrir a aba "Treinos".
2. **Esperado**: a mensagem de estado vazio menciona o ícone de ações (não mais "a
   ação acima", que não existe mais nessa tela).

## Referências

- Contrato: [`contracts/navegacao.md`](./contracts/navegacao.md)
- Critérios de aceite formais: `spec.md` (Acceptance Scenarios de cada User Story)
