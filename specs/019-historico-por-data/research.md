# Phase 0 Research: Histórico por Data

**Feature**: `019-historico-por-data` | **Date**: 2026-09-23

Sem `[NEEDS CLARIFICATION]` pendente — a spec já resolveu as decisões de produto
(local na navegação, exibição de múltiplas sessões no mesmo dia). Esta fase cobre
decisões técnicas de implementação.

## Decisão 1: extrair o cruzamento sessão→treino→exercício, sem mudar o RF08

**Decision**: extrair de `obterHistoricoPorPerfil` (hoje um único laço que já faz
sessão→treino→exercício→série inline) uma função interna
`construirRegistrosBrutos(perfilId)`, retornando uma lista plana de registros já
resolvidos (nome do exercício, nome do treino, dados da série) — sem agrupar por
exercício nem por data ainda. `obterHistoricoPorPerfil` (RF08) passa a consumir essa
lista e agrupar por nome normalizado, exatamente como já faz hoje; a nova
`obterHistoricoPorData` (esta feature) consome a mesma lista e agrupa por dia+sessão.

```ts
type RegistroBruto = {
  data: string;          // finalizadaEm da sessão (ISO 8601)
  sessaoId: string;
  treinoId: string;
  treinoNome: string;
  exercicioId: string;
  exercicioNome: string;
  serie: number;
  cargaKg: number;
  reps: number;
  categoria: CategoriaExercicio; // RF17 — copiado do ExercicioPlanejado de origem
};

function construirRegistrosBrutos(
  treinos: Treino[],
  sessoesFinalizadas: SessaoTreino[],
): RegistroBruto[] { /* ... mesmo laço e mesmo tratamento defensivo (FR-013/014 do RF08)
                          já existentes em obterHistoricoPorPerfil, só sem agrupar ainda ... */ }
```

**Rationale**: o cruzamento sessão→treino→exercício (incluindo o `console.warn`
defensivo quando um treino/exercício de origem não é encontrado, RF08 FR-013/FR-014,
reaproveitado por esta feature via FR-008 da spec 019) é a parte não-trivial da
lógica — duplicá-la numa segunda função arriscaria as duas visões divergirem se um
dos dois pontos for corrigido/alterado no futuro sem o outro acompanhar (mesmo
raciocínio já aplicado antes no projeto para extrair `PADRAO_VIBRACAO_FIM_DESCANSO`
numa constante compartilhada, spec 014). Agrupar (por nome ou por dia) é a parte
simples e específica de cada visão — faz sentido ficar separado.

**Garantia de não-regressão**: `obterHistoricoPorPerfil` continua exportada com a
mesma assinatura e o mesmo formato de retorno (`HistoricoPerfil`) — o refactor é
inteiramente interno; o `quickstart.md` desta feature inclui um cenário de
regressão explícito para a visão "Por exercício" continuar idêntica.

**Alternatives considered**: escrever `obterHistoricoPorData` do zero, com seu
próprio laço de cruzamento — rejeitado pelo risco de duplicação/divergência acima;
mais trabalho (2 laços quase idênticos) sem benefício real, já que nenhuma das duas
visões precisa de uma versão customizada desse cruzamento.

## Decisão 2: agrupamento por dia civil, sem risco de fuso horário na exibição

**Decision**: a chave de agrupamento por dia usa componentes de data **locais**
(`Date.getFullYear()`/`getMonth()`/`getDate()`, não `getUTC*`), formatada como
`"YYYY-MM-DD"` (ordenável como string). Cada `DiaHistorico` carrega essa chave
**e**, separadamente, um `dataReferencia: string` (o `finalizadaEm` ISO completo de
uma das sessões daquele dia) — a UI usa `dataReferencia` (não a chave) para exibir a
data formatada (`new Date(dataReferencia).toLocaleDateString()`), nunca reconstrói
um `Date` a partir da chave `"YYYY-MM-DD"` sozinha.

**Rationale**: um `Date` construído só a partir de uma string `"YYYY-MM-DD"` (sem
horário) é interpretado como meia-noite **UTC** pelo JavaScript, não meia-noite
local — em fusos horários negativos (ex.: Brasil, UTC-3), isso pode exibir o dia
**anterior** ao correto (ex.: "2026-09-21" vira 20/09 na exibição local). Guardar
uma data-hora completa (`dataReferencia`) ao lado da chave evita esse problema:
formatação sempre parte de um instante real, nunca de uma data reconstruída.

**Alternatives considered**: usar só a chave `"YYYY-MM-DD"` e formatá-la
manualmente com split/reordenação de string (sem passar por `Date`) — rejeitado por
menos legível e por já existir um padrão mais simples (guardar o ISO completo) que
não precisa de nenhuma lógica de formatação manual nova.

## Decisão 3: estrutura dos tipos novos

**Decision**:

```ts
// src/types/historico.ts
export type RegistroExercicioNoDia = {
  exercicioNome: string;
  categoria: CategoriaExercicio; // RF17 — mesma categoria do ExercicioPlanejado de origem
  registros: { serie: number; cargaKg: number; reps: number }[]; // ordenados por série
};

export type BlocoSessao = {
  sessaoId: string;
  treinoNome: string;
  dataReferencia: string; // ISO 8601 — finalizadaEm desta sessão
  exercicios: RegistroExercicioNoDia[];
};

export type DiaHistorico = {
  chaveDia: string;        // "YYYY-MM-DD", local — só para ordenação/agrupamento
  dataReferencia: string;  // ISO 8601 de uma sessão do dia — para exibição (Decisão 2)
  blocos: BlocoSessao[];   // ordenados do mais recente para o mais antigo dentro do dia
};

export type HistoricoPorData =
  | { temSessoesFinalizadas: false }
  | { temSessoesFinalizadas: true; dias: DiaHistorico[] }; // dias ordenados do mais recente
```

**Rationale**: espelha a estrutura já existente (`HistoricoPerfil`,
`EvolucaoExercicio`) — mesmo padrão de união discriminada por
`temSessoesFinalizadas`, já usado e já validado pela tela (RF08).

## Decisão 4: onde e como alternar entre as duas visões (FR-001)

**Decision**: em `src/app/(tabs)/explore.tsx`, um novo estado
`const [visao, setVisao] = useState<'exercicio' | 'data'>('exercicio')` e um
controle de segmento (dois `Pressable`/botões lado a lado, "Por exercício" | "Por
data", mesmo padrão visual de toggle já usado em outros lugares do app — ex.:
seleção de variante do `Button`) logo abaixo do título "Histórico de evolução".
Ambas as buscas (`obterHistoricoPorPerfil` e `obterHistoricoPorData`) são
carregadas juntas em `recarregarHistorico` (uma chamada extra em paralelo, mesmo
`Promise.all` que já popularia o carregamento) — não só a visão ativa — para trocar
de visão ser instantâneo, sem re-carregar dados.

**Rationale**: carregar as duas de uma vez evita um loading state ao alternar entre
visões (ambas as fontes de dados já são pequenas, mesma escala de uso pessoal já
assumida em toda a feature) — troca de visão é só troca de estado local, sem I/O.

**Alternatives considered**: carregar sob demanda (só a visão ativa) e mostrar um
loading ao trocar — rejeitado por adicionar uma espera perceptível numa operação
que deveria ser instantânea (alternar uma visão já carregada), sem ganho real dado
o volume de dados esperado.

## Decisão 5: sub-componente de renderização, inline em `explore.tsx`

**Decision**: um novo componente `SecaoDia({ dia }: { dia: DiaHistorico })`,
definido inline em `explore.tsx` (função declarada no mesmo arquivo, fora do
componente de tela, mesmo nível que `SecaoExercicio` já existente) — não um arquivo
separado em `src/components/treino/`.

**Rationale**: segue o precedente já estabelecido dentro do próprio arquivo —
`SecaoExercicio` (RF08/RF09b) já é um componente definido inline em `explore.tsx`,
não extraído para seu próprio arquivo; manter o novo componente no mesmo padrão
evita inconsistência dentro do mesmo arquivo (um sub-componente inline, outro em
arquivo separado, sem razão clara para a diferença).

**Alternatives considered**: extrair para `src/components/treino/secao-dia.tsx`
(mesmo padrão usado por outros componentes maiores do projeto, ex.:
`exercicio-execucao.tsx`) — rejeitado apenas pela inconsistência local que criaria
dentro do próprio `explore.tsx`; não há problema em extrair no futuro se o arquivo
crescer demais, mas não é o padrão já estabelecido ali hoje.

## Resumo das entidades técnicas afetadas

- `src/types/historico.ts`: `RegistroExercicioNoDia`, `BlocoSessao`,
  `DiaHistorico`, `HistoricoPorData` (novos).
- `src/services/historico-evolucao.ts`: `construirRegistrosBrutos` (novo, interno,
  compartilhado); `obterHistoricoPorPerfil` refatorada para consumi-la (sem mudança
  de assinatura/saída); `obterHistoricoPorData` (novo, exportado).
- `src/app/(tabs)/explore.tsx`: estado `visao`; controle de alternância; novo
  sub-componente inline `SecaoDia`; `recarregarHistorico` carrega as duas visões em
  paralelo.

## Nota de integração: `specs/017-categorias-exercicio` (RESOLVIDA em 2026-09-25)

**Atualização 2026-09-25**: a RF17 (categorias) foi implementada primeiro — o
cenário do segundo bloco abaixo ("Se a 017 já estiver implementada antes desta")
se concretizou. A integração já foi aplicada: `data-model.md`,
`contracts/historico-evolucao.md` e `contracts/explore-screen.md` já refletem
`categoria` em `RegistroBruto`/`RegistroExercicioNoDia` e `SecaoDia` já usa
`src/utils/categoria-exercicio.ts`; `quickstart.md` ganhou o Cenário 5
correspondente. Esta nota permanece como registro histórico da decisão, não como
pendência.

Esta spec (019) assumia originalmente registros sempre em carga(kg)+reps (ver
`spec.md`, Assumptions — texto também já atualizado). A spec separada
`specs/017-categorias-exercicio` (categorias peso/tempo/distância/repetições, campo
`categoria` por exercício) também altera como registros de série são exibidos —
as duas visões do Histórico (RF08 "Por exercício" e esta, "Por data") precisam ficar
consistentes entre si quanto a isso.

**Se a 017 for implementada depois desta (019)**: quem implementar a 017 DEVE
adicionar `categoria` também ao tipo intermediário desta spec
(`RegistroBruto`/`BlocoSessao`/`RegistroExercicioNoDia`, ver Decisão 1/3 acima) e
usar `src/utils/categoria-exercicio.ts` (`ROTULO_CAMPO_PRINCIPAL`, `SUFIXO_VALOR`,
`exibeCampoPrincipal`, criados pela 017) na exibição de `SecaoDia` — não só na visão
"Por exercício" já prevista no escopo original da 017.

**Se a 017 já estiver implementada antes desta (019)**: o inverso se aplica — esta
spec (019), ao construir `construirRegistrosBrutos`/`RegistroBruto`, já deve copiar
`categoria` do `ExercicioPlanejado` de origem (mesmo padrão que a 017 já terá
aplicado a `RegistroHistorico`) e `SecaoDia` já deve nascer usando o utilitário de
rótulo por categoria, não assumindo carga(kg) fixo.

Nenhuma decisão de produto nova aqui — mesma dependência de implementação descrita
(em sentido espelhado) no `research.md` da spec 017.
