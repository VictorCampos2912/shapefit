# Data Model: Importar Múltiplos Treinos de um Único Arquivo

**Feature**: `012-importar-multiplos-treinos` | **Date**: 2026-09-22

## Entidades existentes (sem alteração de schema)

### Treino (`src/types/treino.ts`)

```ts
export type Treino = {
  id: string;
  perfilId: string;
  nome: string;
  exercicios: ExercicioPlanejado[];
  importadoEm: string; // ISO 8601
};
```

Sem alteração. Esta feature reconhece que um arquivo pode conter mais de uma instância
desta entidade — cada uma continua validada e persistida exatamente como hoje (mesmo
`id` via `Crypto.randomUUID()`, mesmo `importadoEm` gerado no momento da persistência).

### ExercicioIgnorado (`src/types/treino.ts`)

```ts
export type ExercicioIgnorado = {
  indice: number;
  motivo: string;
};
```

Sem alteração. Continua usado por treino individual (agora também dentro do caminho de
múltiplos treinos, um `ExercicioIgnorado[]` por treino do array).

## Entidades novas

### TreinoIgnorado (novo)

Representa um treino do array que falhou a validação de nível de treino (FR-003) — não
chegou a virar um `Treino` persistido.

```ts
export type TreinoIgnorado = {
  /** Nome do treino, quando o próprio campo "nome" era válido; null se nem isso. */
  nome: string | null;
  /** Motivo legível, reaproveitando as mensagens já usadas por validarEstruturaTreino. */
  motivo: string;
};
```

**Regras de validação**: idênticas às já aplicadas por `validarEstruturaTreino` a um
treino único — campo `nome` ausente/vazio, ou `exercicios` ausente/vazio/sem nenhum
item válido após a validação por exercício.

### TreinoImportadoComPendencias (novo)

Agrupa um treino importado com sucesso e os exercícios daquele treino específico que
foram ignorados durante a validação (FR-004), para que a mensagem resumida (FR-006)
consiga informar pendências por treino.

```ts
export type TreinoImportadoComPendencias = {
  treino: Treino;
  exerciciosIgnorados: ExercicioIgnorado[];
};
```

### ResultadoImportacaoMultipla (novo)

Retornado por `importarTreino`/`importarTreinoExemplo` quando a raiz do JSON
selecionado é um array. Substitui, apenas nesse caminho, o `ResultadoImportacao`
existente (que continua sendo o retorno do caminho de treino único, sem alteração).

```ts
export type ResultadoImportacaoMultipla = {
  treinos: TreinoImportadoComPendencias[];
  treinosIgnorados: TreinoIgnorado[];
  /** Erro de nível de arquivo (JSON inválido, array vazio, raiz irreconhecível). */
  erro: string | null;
};
```

**Regras**:
- `erro !== null` ⟺ `treinos.length === 0 && treinosIgnorados.length === 0` (falha de
  arquivo inteiro — array vazio, ou nenhum elemento do array reconhecível como treino
  nem como estrutura inválida-mas-parseável; ver FR-007 e Edge Cases da spec).
- Quando pelo menos um treino do array é válido, `erro` é sempre `null` — mesmo que
  outros elementos do array tenham ido para `treinosIgnorados` (FR-003: item inválido
  não invalida os demais).

## Fluxo de estado (sem alteração de armazenamento)

Chave `AsyncStorage`: `treinos:<perfilId>` (inalterada). Uma importação de múltiplos
treinos gera uma única leitura (`getTreinosState`) e uma única escrita
(`setTreinosState`) contendo `[...treinosExistentes, ...treinosNovosValidos]` — mesma
estrutura `TreinosPorPerfilState` já existente, sem novo campo.

## Diferenciação visual de treinos com o mesmo nome (RF02, sem alteração)

Dois treinos do array com o mesmo `nome`, ou um treino do array com o mesmo nome de um
treino já existente, continuam usando o indicador de nome duplicado já existente do
RF02 (exibição da data/hora de `importadoEm`). Risco aceito conscientemente: como todos
os treinos de um mesmo lote são persistidos na mesma escrita (Decisão 4 do
`research.md`), `importadoEm` pode ser idêntico (mesmo `new Date().toISOString()`, se
gerado uma vez para o lote) ou próximo demais para diferenciar visualmente entre si na
lista — ver Edge Case correspondente em `spec.md`. Sem tratamento especial nesta
feature.
