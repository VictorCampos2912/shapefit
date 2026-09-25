# Phase 0 Research: Categorias de Unidade por Exercício

**Feature**: `017-categorias-exercicio` | **Date**: 2026-09-23

Sem `[NEEDS CLARIFICATION]` pendente — a spec já resolveu as decisões de produto.
Esta fase cobre decisões técnicas de implementação.

## Decisão 1: `cargaKg`/`cargaSugeridaKg` mantêm o nome, para todas as categorias

**Decision**: os campos `cargaKg` (em `SerieRealizada`, dentro de `SessaoTreino`) e
`cargaSugeridaKg` (em `ExercicioPlanejado`) **não são renomeados**. Continuam
guardando um valor numérico único, agora interpretado conforme a categoria do
exercício ao qual pertencem (kg para "peso", minutos para "tempo", km para
"distancia", sem uso para "repeticoes") — a adaptação acontece inteiramente na
camada de exibição (rótulo e unidade mostrados), nunca no nome ou tipo do campo.

**Rationale** (confirmado explicitamente pelo usuário em 2026-09-23, não uma
suposição): esses dois campos já são consumidos, pelo nome exato `cargaKg`/
`cargaSugeridaKg`, por um número grande de pontos do código já implementados e
validados — RF03/RF04 (`exercicio-execucao.tsx`, `criarEstadoExecucaoInicial`), RF07
(`registrarSerieConcluida`, `finalizarSessao`), RF08 (`historico-evolucao.ts`,
`RegistroHistorico.cargaKg`), RF09a (`atualizarSerieRealizada`) e RF09b
(`atualizarSerieDeSessaoFinalizada`, ambos com parâmetro `novaCargaKg: number`).
Renomear exigiria tocar em todos esses pontos só por clareza de nome — sem nenhum
ganho funcional, e com risco real de regressão em fluxos já testados e validados em
aparelho físico (RF07/RF08/RF09a/RF09b passaram por validação manual completa antes
desta feature).

**Trade-off aceito explicitamente**: o nome do campo fica **tecnicamente impreciso**
para as categorias "tempo"/"distancia" — um valor em minutos ou em quilômetros
guardado em um campo literalmente chamado `cargaKg` é confuso para quem lê o código
sem o contexto desta spec. Esse custo é aceito conscientemente em troca de manter a
assinatura de dados já em produção (Princípio II: menor mudança que atende o
requisito) — mitigado por: (a) o `categoria` do exercício sempre acompanha o valor,
então nenhum dado fica ambíguo em tempo de execução, só o nome do campo no código-
fonte; (b) o utilitário central de rótulo (Decisão 3) é o único lugar que "traduz"
`cargaKg` para o rótulo/unidade correta — o resto do código nunca precisa saber que
o nome é impreciso, só chama o utilitário.

**Alternatives considered**:
- Renomear para um nome genérico (`valorPrincipal`, `valorRegistrado`) — rejeitado
  explicitamente pelo usuário: mudaria a assinatura de `SerieRealizada`,
  `EstadoExecucaoExercicio`, `RegistroHistorico` e os parâmetros de 2 funções de
  serviço já validadas, exigindo revisar/testar novamente todos os fluxos RF03-RF09b
  só por nomenclatura.
- Introduzir um campo novo por categoria (`tempoMin?`, `distanciaKm?`, mantendo
  `cargaKg?` como antes, todos opcionais) — rejeitado: um exercício só usa 1 desses
  por vez (nunca 2), então campos opcionais paralelos introduziriam um estado
  inválido representável (ex.: `cargaKg` e `tempoMin` preenchidos ao mesmo tempo) sem
  necessidade — pior que um único campo sempre presente, reinterpretado pela
  categoria.

## Decisão 2: tipo `CategoriaExercicio` e onde ele vive

**Decision**:

```ts
// src/types/treino.ts
export type CategoriaExercicio = 'peso' | 'tempo' | 'distancia' | 'repeticoes';

export type ExercicioPlanejado = {
  id: string;
  nome: string;
  series: number;
  repsAlvo: string;
  cargaSugeridaKg: number;
  descansoSeg: number;
  categoria: CategoriaExercicio; // NOVO — sempre resolvido (nunca ausente em runtime)
};
```

Internamente, `categoria` é sempre um dos 4 valores — a ausência no JSON de entrada
é resolvida para `'peso'` no momento da validação/montagem (FR-002), nunca
propagada como `undefined`/opcional para o resto do app.

**Rationale**: mesmo padrão de tipos de domínio já usado no projeto — union de
literais, não enum (Princípio I já favorece isso implicitamente no estilo já
existente do código, ex.: `status: 'em_andamento' | 'concluido'` em
`ExecucaoExercicio`); resolver o default já na montagem do treino (não em cada
consumidor) evita que toda tela precise repetir `exercicio.categoria ?? 'peso'`.

**Alternatives considered**: deixar `categoria?: CategoriaExercicio` opcional no
tipo, aplicando o default só na hora de exibir — rejeitado: espalharia a lógica de
"default peso" por várias telas em vez de resolvida uma única vez na importação
(FR-002 já fala em termos de importação, não de exibição).

## Decisão 3: utilitário central de rótulo/unidade por categoria

**Decision**:

```ts
// src/utils/categoria-exercicio.ts
import type { CategoriaExercicio } from '@/types/treino';

export const ROTULO_CAMPO_PRINCIPAL: Record<CategoriaExercicio, string | null> = {
  peso: 'Carga (kg)',
  tempo: 'Tempo (min)',
  distancia: 'Distância (km)',
  repeticoes: null, // sem campo principal — só reps
};

export const SUFIXO_VALOR: Record<CategoriaExercicio, string> = {
  peso: 'kg',
  tempo: 'min',
  distancia: 'km',
  repeticoes: '',
};

export function exibeCampoPrincipal(categoria: CategoriaExercicio): boolean {
  return categoria !== 'repeticoes';
}
```

**Rationale**: um único lugar de verdade para "como rotular/formatar o campo
principal desta categoria" — reaproveitado por `exercicio-execucao.tsx` (RF03/04,
RF09a) e por `explore.tsx` (RF08, RF09b), em vez de 4 implementações separadas do
mesmo mapeamento (Princípio II). Tipado como `Record<CategoriaExercicio, ...>`
força o compilador a exigir as 4 chaves sempre que uma categoria nova for
adicionada no futuro (fora do escopo desta feature, mas um benefício estrutural).

**Alternatives considered**: um `switch` inline em cada componente — rejeitado,
duplica a mesma lógica em 4 lugares, maior risco de um deles ficar
desatualizado/divergente dos outros (mesma razão pela qual RF13 centralizou o
padrão de vibração numa constante compartilhada, `research.md` da spec 014).

## Decisão 4: validação de "categoria" na importação (FR-001/FR-002/FR-003)

**Decision**: em `validarExercicio` (`src/services/treino-storage.ts`), adicionar,
após as validações já existentes:

```ts
const CATEGORIAS_VALIDAS: CategoriaExercicio[] = ['peso', 'tempo', 'distancia', 'repeticoes'];

if (item.categoria !== undefined) {
  if (typeof item.categoria !== 'string' || !CATEGORIAS_VALIDAS.includes(item.categoria as CategoriaExercicio)) {
    return { ok: false, motivo: `Exercício ${indice}: campo "categoria" inválido` };
  }
}
// ...
categoria: (item.categoria as CategoriaExercicio | undefined) ?? 'peso',
```

**Rationale**: mesmo padrão já usado por todas as outras validações de campo dessa
função (early return com `motivo`, campo a campo) — `categoria` é o único campo
totalmente opcional entre eles (os demais já eram obrigatórios antes desta
feature), então sua validação só roda `if (item.categoria !== undefined)`,
diferente dos demais que sempre validam.

**Alternatives considered**: validar `categoria` em uma função separada
(`validarCategoria`) — rejeitado por ser uma única verificação de 2 linhas, sem
complexidade que justifique extrair (Princípio II).

## Decisão 5: `RegistroHistorico` ganha `categoria`, resolvida junto do nome (RF08)

**Decision**: em `src/services/historico-evolucao.ts`, no mesmo ponto onde o nome
do exercício já é resolvido cruzando a sessão com o treino de origem (RF08, FR-004
da spec 010), também copiar `exercicio.categoria` para o novo campo
`RegistroHistorico.categoria`.

**Rationale**: reaproveita exatamente o cruzamento sessão→treino→exercício que já
existe (mesmo `exercicio` já resolvido, um campo a mais copiado) — nenhum
cruzamento novo, nenhuma consulta adicional.

**Edge case não coberto pela spec, resolvido aqui**: dois exercícios com o mesmo
nome normalizado (FR-006 da spec 010, que unifica por nome) podem, em teoria, ter
categorias diferentes em treinos diferentes (ex.: "Prancha" como "repeticoes" em um
treino e como "tempo" em outro, por erro de quem montou o arquivo). Como o RF08 já
agrupa por nome mas exibe **cada registro individualmente** (nunca agrega valores
entre séries/sessões), este caso não quebra nada: cada `RegistroHistorico` mostra
seu próprio rótulo/unidade, de acordo com sua própria `categoria` — não a "categoria
do grupo" (que não existe como conceito). Comportamento decorre naturalmente da
already-existing granularidade por registro, sem necessidade de uma regra nova.

**Alternatives considered**: bloquear/avisar quando um grupo tiver categorias
mistas — rejeitado, fora do escopo pedido e sem sinal de que isso seja um problema
real (o app não valida consistência de categoria entre exercícios homônimos hoje,
nem faria sentido fazer isso só para esta feature).

## Decisão 6: comportamento da edição (RF09a/RF09b) para a categoria "repeticoes"

**Decision**: nas telas de edição (`exercicio-execucao.tsx` para RF09a,
`explore.tsx` para RF09b), quando `categoria === 'repeticoes'`, o campo de
carga/tempo/distância não é exibido no formulário de edição — só reps é editável.
Ao salvar, o valor de `cargaKg` enviado para `atualizarSerieRealizada`/
`atualizarSerieDeSessaoFinalizada` é o valor **já existente** do registro (não
editado, não zerado) — a assinatura dessas duas funções não muda (`novaCargaKg:
number` continua obrigatório, Decisão 1), só deixa de ser alterável pela UI para
essa categoria.

**Rationale**: evita modificar a assinatura das duas funções de serviço só para
tornar um parâmetro opcional em 1 de 4 categorias — mais simples reenviar o valor
inalterado (o campo já não tem significado para "repeticoes", então seu valor
numérico exato é irrelevante) do que introduzir uma sobrecarga de função ou um
parâmetro opcional (Princípio II).

**Alternatives considered**: tornar `novaCargaKg` opcional nas duas funções,
omitindo a atualização desse campo quando ausente — rejeitado: mudaria a
assinatura de duas funções já validadas (RF09a/RF09b) por causa de 1 categoria em 4,
quando reenviar o valor existente resolve sem nenhuma mudança de contrato.

## Decisão 7: `podeConcluirSerie`/`podeSalvarEdicao` para "repeticoes"

**Decision**: em `exercicio-execucao.tsx`, as condições que hoje exigem
`cargaKg.trim().length > 0 && reps.trim().length > 0` passam a exigir só
`reps.trim().length > 0` quando `exercicio.categoria === 'repeticoes'` — usando
`exibeCampoPrincipal` (Decisão 3) como guarda.

**Rationale**: consequência direta de FR-004 (campo de carga não existe para essa
categoria) — se o campo não é exibido, ele não pode ser parte da condição de
habilitar o botão de concluir/salvar.

## Resumo das entidades técnicas afetadas

- `src/types/treino.ts`: `CategoriaExercicio` (novo); `ExercicioPlanejado.categoria`
  (novo, sempre resolvido).
- `src/types/historico.ts`: `RegistroHistorico.categoria` (novo).
- `src/utils/categoria-exercicio.ts` (novo): `ROTULO_CAMPO_PRINCIPAL`,
  `SUFIXO_VALOR`, `exibeCampoPrincipal`.
- `src/services/treino-storage.ts`: `validarExercicio` valida/resolve `categoria`
  (Decisão 4).
- `src/services/historico-evolucao.ts`: copia `categoria` ao resolver cada
  `RegistroHistorico` (Decisão 5).
- `src/components/treino/exercicio-execucao.tsx`: rótulos dinâmicos, campo
  principal condicional, `podeConcluirSerie`/`podeSalvarEdicao` ajustados (Decisões
  6 e 7).
- `src/app/(tabs)/explore.tsx`: rótulos dinâmicos no histórico (RF08) e na edição de
  sessão finalizada (RF09b), mesmo padrão da Decisão 6/7.

## Nota de integração futura: `specs/019-historico-por-data` (RESOLVIDA em 2026-09-25)

Esta spec (017) só cobre a visão "Por exercício" do Histórico (RF08) — a visão "Por
data" (`specs/019-historico-por-data`) também exibe registros de série e precisa da
mesma adaptação por categoria para as duas visões do Histórico não ficarem
inconsistentes entre si (uma mostrando "12min", outra assumindo sempre kg para o
mesmo registro).

**Resolução**: a spec 019 foi implementada depois desta (017) e já nasceu com a
integração — `SecaoDia` (`src/app/(tabs)/explore.tsx`) reaproveita
`src/utils/categoria-exercicio.ts` (`ROTULO_CAMPO_PRINCIPAL`, `SUFIXO_VALOR`,
`exibeCampoPrincipal`) na visão "Por data", mesmo padrão desta spec na visão "Por
exercício" — confirmado nas duas visões durante a validação manual de 2026-09-25
(RF18, Cenário 6). Nenhuma ação pendente. Texto original da nota preservado abaixo
como registro histórico da dependência entre as duas specs.

**Se a 019 for implementada depois desta (017)**: quem implementar a 019 DEVE
reaproveitar `src/utils/categoria-exercicio.ts` (`ROTULO_CAMPO_PRINCIPAL`,
`SUFIXO_VALOR`, `exibeCampoPrincipal`) na exibição de cada registro da visão "Por
data" — mesmo padrão já aplicado aqui à visão "Por exercício" (Decisão 5, RF08). Isso
exige que o tipo intermediário usado pela 019 (`RegistroBruto`/`BlocoSessao`, ver o
`research.md` da 019) também carregue `categoria` por registro, do mesmo jeito que
`RegistroHistorico.categoria` foi adicionado aqui.

**Se a 019 já estiver implementada antes desta (017)**: o inverso se aplica — esta
spec (017) precisa adicionar essa mesma integração na visão "Por data" como parte do
próprio escopo desta feature, não deixar de fora só porque a 019 não previu
categorias no momento em que foi escrita.

Nenhuma decisão de produto nova aqui — só uma dependência de implementação entre
duas specs que tocam a mesma tela (Histórico) em momentos possivelmente diferentes.
