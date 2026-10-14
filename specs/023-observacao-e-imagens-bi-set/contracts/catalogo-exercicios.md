# Contract: `src/services/catalogo-exercicios.ts` (função nova, arquivo já existente das specs 020/021)

**Feature**: `023-observacao-e-imagens-bi-set`

Contrato interno (função de serviço — não há API HTTP nesta feature). **Não
redefine** nada do contrato já publicado pelas specs 020
(`listarCatalogo`) e 021 (`buscarNoCatalogo`) — só adiciona.

## `buscarPartesCompostoNoCatalogo` (novo) — FR-010/FR-011/FR-012/FR-014

```ts
const SUFIXO_BI_SET = /\s*\(bi-set\)$/i;

export function buscarPartesCompostoNoCatalogo(nomeExercicio: string): ExercicioCatalogo[] {
  if (!nomeExercicio.includes(' + ')) {
    return [];
  }

  const semSufixo = nomeExercicio.trimEnd().replace(SUFIXO_BI_SET, '');
  const partes = semSufixo.split(' + ');

  const encontrados = partes
    .map((parte) => buscarNoCatalogo(parte))
    .filter((item): item is ExercicioCatalogo => item !== null);

  return encontrados.slice(0, 2);
}
```

- **Pré-condição**: chamada apenas quando `buscarNoCatalogo(nomeExercicio)`
  (busca pelo nome inteiro, spec 021) já retornou `null` — esta função não
  repete essa primeira tentativa (FR-010, "quando a busca pelo nome inteiro...
  não encontrar correspondência").
- **FR-010(a)**: `SUFIXO_BI_SET` remove um sufixo literal `" (Bi-set)"` do
  final do nome (depois de `trimEnd()`, para tolerar espaços finais),
  case-insensitive (`/i`) — mas **só** essa forma literal; nenhuma variação de
  pontuação, hífen/espaço interno ao sufixo, ou abreviação é reconhecida
  (continua sendo remoção de sufixo, nunca aproximação).
- **FR-010(b)/(c)/(d)**: separa por `" + "` (delimitador literal, mesmo usado
  no FR-010 da spec), chama `buscarNoCatalogo` (que já aplica
  `normalizarNomeExercicio`, RF08) para cada parte individualmente — sem
  nenhuma normalização adicional além da que `buscarNoCatalogo` já faz.
- **FR-011 (máximo duas imagens)**: `encontrados` pode ter mais de 2 elementos
  quando o nome tem mais de duas partes (ex.: "A + B + C") — todas as partes
  são buscadas (nenhuma é pulada), mas o retorno é limitado às **duas
  primeiras, na ordem em que aparecem no nome**, via `.slice(0, 2)`.
- **FR-012**: uma parte sem correspondência exata simplesmente não aparece no
  array retornado (filtrada por `.filter(...)`) — não há nenhum marcador de
  "não encontrado" no resultado; o chamador (componente) não distingue "essa
  parte não bateu" de "essa parte nem foi tentada".
- **FR-013/FR-014**: nome sem `" + "`, ou nenhuma parte com correspondência →
  retorna `[]`; o componente, ao receber `[]`, não exibe nenhuma imagem nem UI
  adicional — mesmo comportamento de "sem correspondência" já definido pela
  spec 021 para o caso de nome inteiro.
- **Duplicatas (edge case)**: se duas partes diferentes do nome normalizam para
  o mesmo item do catálogo, `encontrados` contém o mesmo `ExercicioCatalogo`
  duas vezes — **sem deduplicação** (decisão explícita, `spec.md`, Edge Cases).
- **Pós-condição**: função pura e síncrona, sem efeito colateral, mesmo
  princípio de "sem cache, recalculado a cada chamada" já adotado por
  `buscarNoCatalogo` (spec 021, Assumptions).
- **Consumida por**: `src/components/treino/exercicio-execucao.tsx` (ver
  `contracts/execucao-treino-screen.md`).
- **Sem mudança em `buscarNoCatalogo`, `listarCatalogo`, `ExercicioCatalogo` ou
  `normalizarNomeExercicio`** — todos permanecem exatamente como definidos
  pelas specs 020/021/RF08.
