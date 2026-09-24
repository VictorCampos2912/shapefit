# Quickstart: Imagem/GIF do Exercício na Execução

**Feature**: `021-imagens-exercicios`

Validação manual em Android e iOS (Princípio III) — inclui confirmar que o Metro
resolve as imagens corretamente nos bundlers reais (não só em teste unitário da
função de busca).

## Pré-requisitos

- `specs/020-catalogo-exercicios` já implementada, com `exercicios.json` +
  `imagens-index.ts` gerados (ver nota adicionada ao `plan.md` da spec 020).
- Um treino importado com um exercício cujo nome corresponde exatamente (após
  normalização) a um item do catálogo curado, e outro exercício cujo nome não
  corresponde a nenhum.

## Cenário 1 — Imagem exibida quando há correspondência (US1)

1. Abrir, na execução, o exercício com nome correspondente ao catálogo.
2. **Esperado**: a imagem/GIF do catálogo aparece acima da área de registro de
   série (FR-004).
3. Confirmar que os campos de carga/reps e o botão "Concluir série" continuam
   funcionando normalmente (SC-003) — a imagem não interfere no fluxo.

## Cenário 2 — Nenhuma imagem quando não há correspondência (US2)

1. Abrir, na execução, o exercício sem correspondência no catálogo.
2. **Esperado**: nenhuma imagem, nenhum espaço vazio, nenhuma UI relacionada ao
   catálogo aparece — tela idêntica à versão anterior a esta feature (FR-005).

## Cenário 3 — Normalização de nome, sem aproximação (US1/US2)

1. Ter um exercício no treino com nome escrito com variação de espaço/maiúsculas
   em relação ao catálogo (ex.: treino tem "supino  reto", catálogo tem "Supino
   Reto").
2. Abrir esse exercício na execução.
3. **Esperado**: a imagem aparece normalmente (correspondência via normalização,
   FR-002).
4. Repetir com um nome parecido mas não idêntico após normalização (ex.: "Rosca
   direta" no treino vs. "Rosca direta com barra" no catálogo).
5. **Esperado**: nenhuma imagem aparece (FR-003) — sem aproximação.

## Cenário 4 — Resolução de asset nos bundlers reais (validação técnica)

1. Rodar o app via `npx expo start` (web) e confirmar que a imagem do Cenário 1
   carrega sem erro 404/import quebrado.
2. Repetir em um build/dev-client Android e em Expo Go/simulador iOS.
3. **Esperado**: mesma imagem carrega nos 3 ambientes — confirma que
   `imagens-index.ts` (mapa estático de `require()`) resolve corretamente em
   todos os bundlers, não só no ambiente de desenvolvimento web.

## Referências

- Contratos: [`contracts/catalogo-exercicios.md`](./contracts/catalogo-exercicios.md),
  [`contracts/execucao-treino-screen.md`](./contracts/execucao-treino-screen.md)
- Modelo de dados: [`data-model.md`](./data-model.md) (aponta para
  `specs/020-catalogo-exercicios/data-model.md` como fonte do schema do catálogo)
- Critérios de aceite formais: `spec.md` (Acceptance Scenarios de cada User Story)
