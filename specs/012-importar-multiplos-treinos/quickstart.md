# Quickstart: Importar Múltiplos Treinos de um Único Arquivo

**Feature**: `012-importar-multiplos-treinos`

Validação manual em Android e iOS (Princípio III da constituição), a partir de um
development build com as mudanças desta feature.

## Pré-requisitos

- Perfil ativo já criado (RF10).
- Fixture de múltiplos treinos disponível em `docs/exemplos/treinos_multiplos.json`
  (array com 2 treinos válidos), acessível no aparelho de teste (ex.: enviado por
  e-mail/Drive/AirDrop para o armazenamento local do aparelho, de onde o seletor de
  arquivos do sistema consegue abri-lo).

## Cenário 1 — Importar arquivo com múltiplos treinos válidos (US1, FR-001/FR-003/FR-005)

1. Na tela "Treinos" (ou na tela de ações, se a spec `015-menu-de-acoes` já estiver
   implementada), tocar em "Importar treino".
2. Selecionar `treinos_multiplos.json`.
3. **Esperado**: uma única mensagem de confirmação (US3/FR-006) informando quantos
   treinos foram importados (2, no fixture padrão).
4. Voltar para a lista de treinos: ambos os treinos aparecem, cada um com seus
   próprios exercícios corretos (sem mistura entre eles).
5. Repetir a seleção de perfil (RF10) para outro perfil e confirmar que os treinos
   importados não aparecem para esse outro perfil (FR-005, Princípio V da
   constituição).

## Cenário 2 — Continuar importando um arquivo de treino único sem mudança (US2, FR-002/FR-008)

1. Tocar em "Importar treino de exemplo" (arquivo de exemplo embutido, objeto único).
2. **Esperado**: comportamento idêntico ao já validado no RF01 — mesma mensagem de
   sucesso de treino único, nenhuma menção a "múltiplos treinos".
3. Repetir com um arquivo de treino único qualquer (objeto na raiz) via "Importar
   treino" — mesmo resultado.

## Cenário 3 — Treino inválido dentro do array não invalida os demais (FR-003)

1. Preparar (ou usar) uma variação do fixture com 3 treinos, um deles sem o campo
   `nome` (ex.: `{ "exercicios": [...] }` sem `"nome"`).
2. Importar esse arquivo via "Importar treino".
3. **Esperado**: mensagem única informando que 2 treinos foram importados e 1 foi
   ignorado, com o motivo (FR-006); os 2 treinos válidos aparecem normalmente na
   lista.

## Cenário 4 — Array vazio é tratado como arquivo inválido (FR-007)

1. Preparar um arquivo `[]` (array JSON vazio).
2. Importar via "Importar treino".
3. **Esperado**: mensagem de erro, nenhum treino importado — mesmo padrão de
   mensagem já usado hoje para um treino sem nenhum exercício válido.

## Cenário 5 — Exercício inválido dentro de um treino do array (FR-004)

1. Usar uma variação do fixture onde um dos treinos tem um exercício com `series`
   como texto em vez de número.
2. Importar via "Importar treino".
3. **Esperado**: o treino em questão é importado mesmo assim, só aquele exercício
   específico é ignorado — mesma regra já validada no RF01 para treino único, agora
   também dentro de cada treino do array.

## Referências

- Contrato de funções: [`contracts/treino-storage.md`](./contracts/treino-storage.md)
- Modelo de dados: [`data-model.md`](./data-model.md)
- Critérios de aceite formais: `spec.md` (Acceptance Scenarios de cada User Story)
