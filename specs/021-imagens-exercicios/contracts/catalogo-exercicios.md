# Contract: `src/services/catalogo-exercicios.ts` (função nova, arquivo já existente da spec 020)

**Feature**: `021-imagens-exercicios`

Contrato interno (função de serviço — não há API HTTP nesta feature). **Não
redefine** nada do contrato já publicado pela spec 020
(`specs/020-catalogo-exercicios/contracts/catalogo-exercicios.md`) — só adiciona.

## `buscarNoCatalogo` (novo)

```ts
import { normalizarNomeExercicio } from '@/utils/normalizar-nome-exercicio';
import type { ExercicioCatalogo } from '@/types/catalogo-exercicios'; // spec 020, inalterado

export function buscarNoCatalogo(nomeExercicio: string): ExercicioCatalogo | null {
  const chave = normalizarNomeExercicio(nomeExercicio);
  const encontrado = listarCatalogo().find( // listarCatalogo: spec 020, inalterada
    (item) => normalizarNomeExercicio(item.nome) === chave,
  );
  return encontrado ?? null;
}
```

- **Pré-condição**: nenhuma — funciona mesmo com catálogo vazio (retorna `null`).
- **Pós-condição**: retorna o primeiro `ExercicioCatalogo` cujo `nome`, após
  `normalizarNomeExercicio`, for idêntico ao `nomeExercicio` informado (também
  normalizado); `null` se nenhum corresponder.
- **Normalização**: reaproveita `normalizarNomeExercicio` (RF08,
  `src/utils/normalizar-nome-exercicio.ts`) — remove espaços nas pontas, colapsa
  espaços internos, ignora maiúsculas/minúsculas; **não** aproxima nomes
  parecidos (FR-003 da spec) — comparação é sempre igualdade exata pós-normalização.
- **`listarCatalogo`** (spec 020): chamada sem modificação, sem parâmetros — esta
  função não acessa `exercicios.json` diretamente, sempre passa por
  `listarCatalogo()`.
- **Consumida por**: `src/components/treino/exercicio-execucao.tsx`.
- **Sem mudança em `ExercicioCatalogo`, `GrupoMuscular` ou `listarCatalogo`** — os
  três permanecem exatamente como definidos pela spec 020.
