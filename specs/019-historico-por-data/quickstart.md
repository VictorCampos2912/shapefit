# Quickstart: Histórico por Data

**Feature**: `019-historico-por-data`

Validação via web (Playwright ou navegador) e confirmação manual em Android e iOS
(Princípio III) — sem API nativa envolvida.

## Pré-requisitos

- Perfil ativo com pelo menos duas sessões finalizadas em dias diferentes, e (para
  o Cenário 3) duas sessões finalizadas no mesmo dia (de treinos iguais ou
  diferentes).

## Cenário 0 — Regressão: "Por exercício" continua idêntica (garantia do refactor)

1. Antes de qualquer mudança de visão, abrir a aba "Histórico" (visão padrão "Por
   exercício").
2. **Esperado**: comportamento e dados idênticos aos já validados pelo RF08 —
   mesmos grupos por exercício, mesma ordenação, edição (RF09b) continua
   funcionando. Este cenário existe para confirmar que o refactor de
   `historico-evolucao.ts` (`research.md`, Decisão 1) não alterou nada observável
   da feature já existente.

## Cenário 1 — Dias agrupados, do mais recente para o mais antigo (US1)

1. Com sessões finalizadas em pelo menos 2 dias diferentes, abrir "Histórico" e
   tocar em "Por data".
2. **Esperado**: um grupo por dia, ordenado do mais recente para o mais antigo
   (FR-003); cada dia mostra o nome do treino e, para cada exercício, as séries
   registradas naquele dia (data, carga, reps — FR-005).

## Cenário 2 — Sem registros (US1, Edge Case)

1. Com um perfil sem nenhuma sessão finalizada, abrir "Histórico" e tocar em "Por
   data".
2. **Esperado**: mensagem explícita de "sem registros" (FR-006) — mesmo texto/
   comportamento já usado pela visão "Por exercício" para o caso equivalente.

## Cenário 3 — Duas sessões no mesmo dia não se mesclam (Edge Case)

1. Finalizar duas sessões (do mesmo treino ou de treinos diferentes) no mesmo dia.
2. Abrir a visão "Por data".
3. **Esperado**: o dia mostra 2 blocos de sessão distintos, cada um com seu próprio
   treino/exercícios — nenhum registro de uma sessão aparece misturado no bloco da
   outra (FR-004).

## Cenário 4 — Alternância sem sair da tela (US2)

1. Na aba "Histórico", tocar em "Por data", depois em "Por exercício", depois em
   "Por data" novamente.
2. **Esperado**: a tela nunca navega para outra rota — só troca o conteúdo
   exibido, instantaneamente (sem loading perceptível na troca, já que ambas as
   visões são carregadas juntas — `research.md`, Decisão 4).
3. Trocar de perfil ativo (RF10) enquanto estiver na visão "Por data".
4. **Esperado**: a visão atualiza para mostrar exclusivamente os dados do novo
   perfil ativo, mesma garantia já validada pelo RF08.

## Referências

- Contratos: [`contracts/historico-evolucao.md`](./contracts/historico-evolucao.md),
  [`contracts/explore-screen.md`](./contracts/explore-screen.md)
- Modelo de dados: [`data-model.md`](./data-model.md)
- Critérios de aceite formais: `spec.md` (Acceptance Scenarios de cada User Story)
