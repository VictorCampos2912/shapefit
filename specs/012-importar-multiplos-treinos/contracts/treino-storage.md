# Contract: `src/services/treino-storage.ts`

**Feature**: `012-importar-multiplos-treinos`

Contratos internos (funções TypeScript exportadas/consumidas dentro do app — não há
API HTTP nesta feature). Convenção já usada pelas specs anteriores do projeto (ver
`specs/008-notificacao-fim-descanso/contracts/`).

## Funções públicas (assinatura inalterada)

```ts
function importarTreino(perfilId: string): Promise<ResultadoImportacao | ResultadoImportacaoMultipla | null>
function importarTreinoExemplo(perfilId: string): Promise<ResultadoImportacao | ResultadoImportacaoMultipla>
```

- Assinatura de parâmetros **inalterada** em relação ao RF01.
- Tipo de retorno passa a ser uma união — o chamador (`src/app/(tabs)/index.tsx`)
  precisa de um type guard para diferenciar os dois casos (ver seção "Type guard"
  abaixo). `importarTreino` continua podendo retornar `null` quando o usuário cancela a
  seleção de arquivo (comportamento inalterado do RF01).
- **Quando cada tipo é retornado**: `ResultadoImportacao` quando a raiz do JSON
  selecionado é um objeto único (comportamento idêntico ao RF01, FR-002/FR-008);
  `ResultadoImportacaoMultipla` quando a raiz é um array (FR-001).

## Função interna nova (não exportada)

```ts
function montarTreinoValido(
  bruto: unknown,
  perfilId: string,
): { ok: true; treino: Treino; exerciciosIgnorados: ExercicioIgnorado[] } | { ok: false; motivo: string }
```

- Pura: não lê nem escreve `AsyncStorage`. Gera `id` (`Crypto.randomUUID()`) e
  `importadoEm` (`new Date().toISOString()`) no momento da montagem, mas não persiste.
- Reaproveita `validarEstruturaTreino(bruto)` e, para cada item de
  `exerciciosBrutos`, `validarExercicio(item, indice)` — ambas sem alteração de
  assinatura em relação ao RF01.
- Usada tanto pelo caminho de objeto único quanto pelo caminho de array (uma chamada
  por elemento do array) — é o ponto de reaproveitamento de lógica pedido para esta
  feature.

## Type guard para o chamador

```ts
function ehResultadoMultiplo(
  resultado: ResultadoImportacao | ResultadoImportacaoMultipla,
): resultado is ResultadoImportacaoMultipla {
  return 'treinos' in resultado;
}
```

`ResultadoImportacao` tem a chave `treino` (singular); `ResultadoImportacaoMultipla`
tem a chave `treinos` (plural) — chaves mutuamente exclusivas, suficiente para o
type guard sem precisar de um campo `tipo` explícito adicional.

## Pré-condições / pós-condições de `processarConteudo` (interna, refatorada)

- **Pré-condição**: `conteudo` é uma string (conteúdo bruto do arquivo selecionado ou
  do arquivo de exemplo embutido).
- **Pós-condição (raiz = objeto)**: no máximo 1 treino novo persistido em
  `treinos:<perfilId>`; retorno `ResultadoImportacao` (inalterado do RF01).
- **Pós-condição (raiz = array não vazio)**: 0 a N treinos novos persistidos em uma
  única leitura+escrita de `treinos:<perfilId>` (Decisão 4 do `research.md`); retorno
  `ResultadoImportacaoMultipla` com `erro: null` sempre que pelo menos 1 treino do
  array for válido.
- **Pós-condição (raiz = array vazio, ou não reconhecível como objeto nem array)**:
  nenhum treino persistido; retorno com `erro` preenchido (`ResultadoImportacaoMultipla`
  para array vazio — FR-007; `ResultadoImportacao` para raiz irreconhecível, mesmo
  tratamento genérico já existente do RF01).
