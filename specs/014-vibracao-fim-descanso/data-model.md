# Data Model: Vibração Diferenciada ao Fim do Descanso

**Feature**: `014-vibracao-fim-descanso` | **Date**: 2026-09-22 (atualizado 2026-09-23)

Não aplicável — esta feature não introduz, altera nem persiste nenhuma entidade de
dados. É uma resposta sensorial local (vibração do dispositivo) a um evento que já
existe no sistema (fim do descanso, `handleDescansoConcluido`), sem estado novo,
persistido ou não.

Único item de código novo: a constante `PADRAO_VIBRACAO_FIM_DESCANSO` (um array
`number[]` fixo, não configurável pelo usuário — ver `spec.md`, Assumptions).
**Atualizado em 2026-09-23** (Decisão 6 do `research.md`): a constante mora em
`src/constants/vibracao.ts` (movida de dentro de `[treinoId].tsx`), compartilhada
também por `src/services/notificacao-descanso.ts` (padrão de vibração do canal de
notificação Android).
