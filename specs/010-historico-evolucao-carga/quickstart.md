# Quickstart: Validação de "Histórico de Evolução de Carga por Exercício" (RF08)

**Feature**: 010-historico-evolucao-carga | **Date**: 2026-09-20

Guia para validar manualmente o comportamento descrito na spec, nos dois
aparelhos-alvo (Redmi Note 12/Android e iPhone 16 Plus/iOS), via development build
(não Expo Go — mesmo motivo já registrado em
specs/009-salvar-sessao-treino/quickstart.md), conforme Princípio III da Constituição.

## Pré-requisitos

- RF10, RF01, RF02, RF03, RF04, RF09a, RF05, RF06 e RF07 implementados e funcionando
- Development build instalado no aparelho
- Dois treinos de teste importados no mesmo perfil, cada um contendo um exercício com
  o **mesmo nome** (para validar a unificação — ver Cenário 2), mas com pequenas
  variações de grafia entre um treino e outro (ex.: um treino com "Supino Reto", outro
  com "supino  reto" com espaço duplo) — necessário para exercitar a User Story 2 por
  completo
- Pelo menos um exercício, em algum dos treinos de teste, que **nunca** será
  executado durante os testes (para validar o Cenário 4 — exercício sem registros)
- Um segundo perfil de teste (RF10), com pelo menos uma sessão finalizada de algum
  exercício, para validar a segregação por perfil (Cenário 5)

## Cenários de validação (mapeados às User Stories da spec)

### 1. Consultar a evolução de um exercício com múltiplos registros (User Story 1)

1. Finalizar duas sessões distintas do mesmo treino, em momentos diferentes,
   registrando séries do mesmo exercício em ambas (com cargas/reps diferentes entre
   as duas, para facilitar identificar visualmente qual registro é de qual sessão).
2. Abrir a aba "Explore" e localizar/expandir a seção desse exercício.
   **Esperado**: todas as séries de ambas as sessões aparecem, individualmente (não
   resumidas/agregadas), ordenadas da sessão mais recente para a mais antiga, cada
   uma mostrando data, carga (kg) e reps.
3. Confirmar que uma sessão ainda em andamento (não finalizada) do mesmo exercício,
   se houver uma, não aparece na lista.

### 2. Unificar o mesmo exercício vindo de treinos diferentes (User Story 2)

1. Com os dois treinos de teste (mesmo exercício, grafias com variação de espaços e
   caixa — ver Pré-requisitos), finalizar uma sessão de cada um, registrando séries
   nesse exercício em ambas.
2. Abrir a aba "Explore".
   **Esperado**: existe **uma única** seção para esse exercício (não duas seções
   separadas), contendo as séries de ambos os treinos juntas, ordenadas por data.
3. Confirmar, em um exercício com nome claramente diferente entre os dois treinos
   (ex.: "Rosca direta" em um, "Rosca direta com barra" em outro), que eles aparecem
   como seções **separadas** — a unificação não ocorre entre nomes diferentes.

### 3. Indicação clara de perfil sem nenhum registro (User Story 3, cenário de tela inteira)

1. Com um perfil recém-criado (RF10), sem nenhuma sessão finalizada (pode ter
   treinos importados ou não), abrir a aba "Explore".
   **Esperado**: uma mensagem clara indica que ainda não há registros — não uma tela
   em branco, nem uma lista vazia sem contexto.

### 4. Indicação clara de exercício nunca registrado (User Story 3, cenário por exercício)

1. Com o exercício reservado nos Pré-requisitos (nunca executado), garantir que outras
   sessões do perfil já foram finalizadas normalmente (contendo outros exercícios).
2. Abrir a aba "Explore" e localizar a seção desse exercício específico (ele deve
   aparecer na lista, mesmo sem registros — ver research.md, Decisão 5).
   **Esperado**: a seção existe e indica claramente que não há registros para esse
   exercício ainda, distinto da mensagem de tela inteira do Cenário 3.

### 5. Histórico restrito e atualizado pelo perfil ativo (User Story 4)

1. Com o perfil 1 ativo (usado nos cenários anteriores) e o perfil 2 de teste (com
   seus próprios registros de um exercício com o mesmo nome, mas valores diferentes),
   abrir a aba "Explore" com o perfil 1 ativo.
   **Esperado**: apenas os registros do perfil 1 aparecem.
2. Trocar para o perfil 2 (RF10) e voltar à aba "Explore" (ou permanecer nela, se a
   navegação não sair da aba).
   **Esperado**: a tela passa a mostrar imediatamente apenas os registros do perfil
   2, sem nenhum residual do perfil 1, sem precisar fechar/reabrir o app.

### 6. Diagnóstico de desenvolvimento para registros não resolvíveis (Edge Case, cobre FR-013/FR-014)

Cenário defensivo — não deveria ocorrer em uso normal do app (nenhum treino pode ser
excluído após importado). Validação opcional, apenas se houver uma forma de
inspecionar/editar manualmente o `AsyncStorage` durante o desenvolvimento:

1. Finalizar uma sessão normalmente.
2. Manualmente (via ferramenta de debug), alterar o `treinoId` de uma sessão já
   finalizada em `sessoes:<perfilId>` para um valor que não corresponda a nenhum
   treino existente em `treinos:<perfilId>`.
3. Abrir a aba "Explore".
   **Esperado**: a tela continua funcionando normalmente, exibindo todos os demais
   registros válidos; o registro da sessão adulterada simplesmente não aparece em
   nenhuma seção; no console de desenvolvimento (Metro/dev tools), um `console.warn`
   identifica o `perfilId`, `treinoId`, `exercicioId` e `sessaoId` do registro
   omitido.

## Critérios de aceite de referência

Ver [docs/criterios-aceite.md](../../docs/criterios-aceite.md), seção "RF08 —
Histórico de evolução por exercício", para a lista completa de checkboxes originais
usados como base desta spec.
