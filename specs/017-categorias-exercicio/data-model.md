# Data Model: Categorias de Unidade por Exercício

**Feature**: `017-categorias-exercicio` | **Date**: 2026-09-23

## Tipo novo: `CategoriaExercicio`

```ts
export type CategoriaExercicio = 'peso' | 'tempo' | 'distancia' | 'repeticoes';
```

Union de 4 literais — mesmo estilo de tipo de domínio já usado no projeto (ex.:
`ExecucaoExercicio.status`). Sem valor "nenhum"/`null` — todo `ExercicioPlanejado`
sempre tem uma categoria resolvida (default `'peso'` aplicado na importação, nunca
propagado como ausente).

## `ExercicioPlanejado` (já existe, `src/types/treino.ts`) — campo novo

| Campo | Tipo | Obrigatório | Regras de validação |
|-------|------|-------------|----------------------|
| `categoria` | `CategoriaExercicio` | sim (sempre resolvido) | Vem do campo opcional `categoria` do JSON de entrada; `'peso'` quando ausente (FR-002); um dos 4 valores previstos quando presente — qualquer outro valor torna o exercício inválido e descartado (FR-003) |

Nenhum outro campo de `ExercicioPlanejado` muda de tipo ou nome —
`cargaSugeridaKg` continua `number`, reinterpretado conforme `categoria` só na
exibição (`research.md`, Decisão 1).

## `RegistroHistorico` (já existe, `src/types/historico.ts`) — campo novo

| Campo | Tipo | Obrigatório | Regras |
|-------|------|-------------|--------|
| `categoria` | `CategoriaExercicio` | sim | Copiada do `ExercicioPlanejado` de origem no momento em que o registro é montado (`historico-evolucao.ts`) — mesmo cruzamento sessão→treino→exercício já usado para resolver `nome` (RF08, FR-004 da spec 010) |

Nenhum outro campo de `RegistroHistorico` muda — `cargaKg` continua `number`,
mesmo raciocínio de reinterpretação por exibição.

## Campos que **não** mudam de nome, tipo ou assinatura (decisão explícita)

| Local | Campo/Parâmetro | Nova interpretação |
|-------|------------------|----------------------|
| `ExercicioPlanejado.cargaSugeridaKg` | `number` | kg (peso), minutos (tempo), km (distância), não usado (repetições) |
| `SerieRealizada.cargaKg` | `number` | idem acima |
| `EstadoExecucaoExercicio.cargaKg` | `string` (campo de formulário) | idem acima |
| `atualizarSerieRealizada({ novaCargaKg })` | `number` | idem acima — para "repeticoes", reenviado sem alteração (`research.md`, Decisão 6) |
| `atualizarSerieDeSessaoFinalizada({ novaCargaKg })` | `number` | idem acima — mesmo tratamento |

## Relação entre `categoria` e os campos de formulário exibidos

| `categoria` | Campo principal exibido | Campo reps |
|-------------|--------------------------|------------|
| `peso` | "Carga (kg)" (`cargaKg`/`cargaSugeridaKg` em kg) | sim |
| `tempo` | "Tempo (min)" (mesmo campo, em minutos) | sim |
| `distancia` | "Distância (km)" (mesmo campo, em km) | sim |
| `repeticoes` | nenhum | sim |

Fonte de verdade desta tabela: `src/utils/categoria-exercicio.ts`
(`research.md`, Decisão 3) — nenhuma tela reimplementa este mapeamento.
