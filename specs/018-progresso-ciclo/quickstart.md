# Quickstart: Progresso do Ciclo de Treinos (Múltiplos Treinos)

**Feature**: `018-progresso-ciclo`

Validação via web (Playwright ou navegador) e confirmação manual em Android e iOS
(Princípio III) — sem API nativa envolvida.

**Nota de integração**: esta feature altera os mesmos arquivos que
`specs/016-finalizado-em` (`index.tsx`, `treino-list-item.tsx`). Se ambas forem
implementadas, confirmar que "Finalizado em"/"Nunca treinado" (spec 016) e o
`ProgressRing` por treino (esta spec) convivem no mesmo item da lista sem conflito
visual ou de props.

## Pré-requisitos

- Perfil ativo, sem nenhum ciclo em andamento no início dos testes (perfil novo, ou
  um perfil cujo último ciclo já tenha sido "concluído" via um novo import — ver
  Cenário 4).
- Um arquivo de treino com múltiplos treinos (ex.:
  `docs/exemplos/treinos_multiplos.json`, já existente da spec 012) com pelo menos
  3 treinos, para testar distribuição não-uniforme (Cenário 2).

## Cenário 1 — Ciclo criado automaticamente ao importar múltiplos treinos (US1)

1. Importar um arquivo com 5 treinos válidos.
2. **Esperado**: nenhuma confirmação é pedida — a importação segue como hoje (RF11).
3. Abrir "Meus Treinos".
4. **Esperado**: cada um dos 5 treinos do lote mostra um `ProgressRing` (0%, já que
   nenhuma sessão foi finalizada ainda) ao lado do contador de sessões (FR-001/FR-006).

## Cenário 2 — Distribuição da cota entre treinos (US2)

1. Importar um arquivo com 3 treinos válidos (nenhum ciclo ativo antes).
2. **Esperado** (verificável por inspeção do estado/console durante o desenvolvimento,
   já que a cota individual não é um número exibido diretamente na UI, só a fração
   visual do anel): a cota calculada é 14/13/13 (ou equivalente — soma sempre 40,
   diferença máxima de 1 entre treinos).
3. Finalizar sessões de um dos treinos "de 13" até 13 sessões.
4. **Esperado**: o `ProgressRing` desse treino mostra 100% (13/13).

## Cenário 3 — Progresso não trava e mensagem aparece ao chegar em 40 (US1)

1. Com um ciclo em andamento, finalizar sessões (de qualquer combinação de treinos do
   lote) até somar 40 sessões finalizadas no total do ciclo.
2. Abrir "Meus Treinos".
3. **Esperado**: aparece o banner "Hora de trocar o treino — 40 sessões já
   realizadas" (FR-008).
4. Finalizar mais 1 sessão de qualquer treino do lote (sessão 41).
5. **Esperado**: a sessão é registrada normalmente (RF07, sem bloqueio); o banner
   atualiza para "... 41 sessões já realizadas".

## Cenário 4 — Segunda importação bloqueada, depois liberada (FR-007/FR-009)

1. Com um ciclo em andamento (menos de 40 sessões finalizadas no total), tentar
   importar um novo arquivo de múltiplos treinos.
2. **Esperado**: a importação é rejeitada, com uma mensagem informando que já existe
   um ciclo em andamento (FR-007) — nenhum treino do novo arquivo é adicionado a
   "Meus Treinos".
3. Continuar finalizando sessões do ciclo atual até atingir 40 no total.
4. Tentar importar o mesmo novo arquivo de múltiplos treinos novamente.
5. **Esperado**: a importação funciona normalmente desta vez (FR-009) — os novos
   treinos aparecem em "Meus Treinos", cada um com seu próprio `ProgressRing` zerado
   do novo ciclo.
6. **Esperado**: os treinos do ciclo **anterior** (já concluído) não mostram mais
   nenhum `ProgressRing` — só os treinos do novo ciclo atual.

## Cenário 5 — Treino único nunca cria ciclo (US1, Acceptance Scenario 3)

1. Importar um arquivo de treino único (objeto, não array — RF01).
2. Abrir "Meus Treinos".
3. **Esperado**: esse treino nunca mostra nenhum `ProgressRing`, mesmo depois de
   finalizar sessões dele.

## Referências

- Contratos: [`contracts/ciclo-treino-storage.md`](./contracts/ciclo-treino-storage.md),
  [`contracts/treino-storage.md`](./contracts/treino-storage.md),
  [`contracts/index-screen.md`](./contracts/index-screen.md)
- Modelo de dados: [`data-model.md`](./data-model.md)
- Critérios de aceite formais: `spec.md` (Acceptance Scenarios de cada User Story)
