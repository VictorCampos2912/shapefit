# Contract: `src/services/sessao-treino-storage.ts` (alterado)

**Feature**: `025-migracao-sessoes-historico-ciclo`

Contrato interno (serviço de sessão — não há API HTTP nesta feature). Migra
de AsyncStorage (`sessoes:<uid>`, um array) para Firestore
(`users/{uid}/sessoes/{sessaoId}`, um documento por sessão). Todas as
funções exportadas **mantêm nome, assinatura e retorno de hoje**, exceto
`registrarSerieConcluida` (um campo novo no objeto de parâmetros) — ver
research.md, Decisão 1.

**Atualizado pós-validação (2026-10-16)**: este contrato reflete o código
final, já ajustado depois de 2 bugs reais encontrados em aparelho (ver
research.md, Decisão 1 e Decisão 7) — o plano original previa uma query
filtrada (`where`+`where`+`limit`) para `obterSessao`/
`registrarSerieConcluida`, e `getDoc` de documento único para as funções
que recebem `sessaoId` diretamente. As duas formas travaram indefinidamente
em teste real offline. **O código final usa um único padrão de leitura em
todo o arquivo**: `listarSessoes(uid)` (leitura simples da coleção inteira,
sem filtro no servidor) seguida de busca/filtro em memória — nunca `query`/
`where`/`limit`, nunca `getDoc`.

## Primitivas internas

```ts
function sessoesCollection(uid: string) {
  return collection(getFirestore(), 'users', uid, 'sessoes');
}

// Sem await de propósito (research.md, Decisão 4) — mesmo padrão de
// setDocTreino em treino-storage.ts.
function setDocSessao(uid: string, sessao: SessaoTreino): void {
  setDoc(doc(sessoesCollection(uid), sessao.id), sessao).catch((erro) => {
    console.error('[sessao-treino-storage] Falha ao confirmar sessão no servidor (já salva no cache local):', erro);
  });
}

// Único ponto de leitura deste arquivo — usado por TODAS as funções
// exportadas (nenhuma exceção), por index.tsx (lista de treinos),
// historico-evolucao.ts e ciclo-treino-storage.ts.
export async function listarSessoes(uid: string): Promise<SessaoTreino[]> {
  const snapshot = await getDocs(sessoesCollection(uid));
  const sessoes = snapshot.docs.map((d) => d.data() as SessaoTreino);
  return sessoes.sort((a, b) => {
    if (a.iniciadaEm !== b.iniciadaEm) {
      return a.iniciadaEm < b.iniciadaEm ? -1 : 1;
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}
```

## Por que toda leitura usa `listarSessoes` (não query filtrada, não `getDoc`)

Duas otimizações de leitura foram tentadas e revertidas durante a validação
em aparelho real (modo avião + Wi-Fi desligado), ambas com o mesmo sintoma:
**travamento indefinido, sem erro, sem rejeitar a Promise**.

1. `obterSessao`/`registrarSerieConcluida` usavam uma query filtrada
   (`where('treinoId','==',...)` + `where('finalizadaEm','==',null)` +
   `limit(1)`) em vez de `listarSessoes`, para evitar buscar a coleção
   inteira no caminho mais quente da tela de execução. Travava
   indefinidamente offline.
2. `marcarSessaoRevisada`, `marcarExercicioConcluido`, `finalizarSessao` e
   `atualizarSerieDeSessaoFinalizada` usavam `getDoc(doc(sessoesCollection(uid), sessaoId))`
   (busca de um único documento por id) em vez de `listarSessoes` + busca
   em memória — mesmo sintoma, confirmado depois do fix do item 1.

Ambas foram revertidas para `listarSessoes(uid)` + busca/filtro em memória,
o único padrão confirmado confiável offline neste SDK/aparelho em toda a
extensão do arquivo. Ver research.md (Decisão 1 e Decisão 7) para a
observação completa, a hipótese ainda não testada (leitura cache-first) e a
dívida técnica aceita (cada operação lê a coleção inteira).

## Funções que buscam por `treinoId` (`listarSessoes` + busca em memória)

### `encontrarSessaoEmAndamento(sessoes, treinoId)` / `obterSessao(uid, treinoId)` — FR-001, sem mudança de assinatura pública

```ts
// Versão pura/síncrona — usada por [treinoId].tsx quando a tela já
// precisa chamar também encontrarUltimaSessaoConcluidaNaoRevisada logo em
// seguida, para não repetir listarSessoes (ver nota de performance abaixo).
export function encontrarSessaoEmAndamento(sessoes: SessaoTreino[], treinoId: string): SessaoTreino | null {
  return sessoes.find((sessao) => sessao.treinoId === treinoId && sessao.finalizadaEm === null) ?? null;
}

export async function obterSessao(uid: string, treinoId: string): Promise<SessaoTreino | null> {
  const sessoes = await listarSessoes(uid);
  return encontrarSessaoEmAndamento(sessoes, treinoId);
}
```

### `encontrarUltimaSessaoConcluidaNaoRevisada(...)` / `obterUltimaSessaoConcluidaNaoRevisada(uid, treinoId, totalExercicios)` — sem mudança de assinatura pública

Mesmo par síncrono/assíncrono de `obterSessao` acima, mesma lógica de hoje
(filtro + `reduce` por `finalizadaEm` mais recente), agora sobre
`listarSessoes(uid)`.

**Nota de performance (`[treinoId].tsx`)**: a tela de execução chama
`listarSessoes(uid)` **uma única vez** ao abrir um treino e reaproveita o
array retornado para derivar tanto `encontrarSessaoEmAndamento` quanto
(se a primeira não encontrar nada) `encontrarUltimaSessaoConcluidaNaoRevisada`
— evita 2-3 leituras sequenciais da mesma coleção na mesma abertura de tela
(2º bug de performance encontrado na validação, ver research.md Decisão 7).

### `registrarSerieConcluida(params)` — FR-001/FR-002/FR-003/FR-004, **única assinatura alterada**

```ts
export async function registrarSerieConcluida(params: {
  uid: string;                 // renomeado de perfilId (research.md, Decisão 6)
  treinoId: string;
  exercicioId: string;
  serie: Omit<SerieRealizada, 'registradaEm'>; // registradaEm é definido aqui dentro, nunca pelo chamador
  totalSeriesDoExercicio: number;
  // Só é lido quando a sessão ainda não existe (criação); ignorado em
  // chamadas subsequentes da mesma sessão.
  treinoSnapshot: {
    nome: string;
    exercicios: { id: string; nome: string; categoria: CategoriaExercicio }[];
  };
}): Promise<SessaoTreino> {
  const { uid, treinoId, exercicioId, serie, totalSeriesDoExercicio, treinoSnapshot } = params;
  const sessoes = await listarSessoes(uid);

  let sessao = sessoes.find((item) => item.treinoId === treinoId && item.finalizadaEm === null);
  if (!sessao) {
    sessao = {
      id: Crypto.randomUUID(),
      uid,
      treinoId,
      iniciadaEm: new Date().toISOString(),
      finalizadaEm: null,
      execucoes: [],
      revisadaPeloUsuario: false,
      treinoNomeSnapshot: treinoSnapshot.nome,
      exerciciosSnapshot: treinoSnapshot.exercicios,
    };
  }

  let execucao = sessao.execucoes.find((item) => item.exercicioId === exercicioId);
  if (!execucao) {
    execucao = { exercicioId, seriesRealizadas: [], status: 'em_andamento' };
    sessao.execucoes.push(execucao);
  }

  execucao.seriesRealizadas.push({ ...serie, registradaEm: new Date().toISOString() });
  execucao.status = execucao.seriesRealizadas.length === totalSeriesDoExercicio ? 'concluido' : 'em_andamento';

  setDocSessao(uid, sessao); // sem await (Decisão 4)
  return sessao;
}
```

- **Chamador** (`src/app/treino/[treinoId].tsx`, `handleConcluirSerie`):
  passa `treinoSnapshot: { nome: treino.nome, exercicios: treino.exercicios.map(({ id, nome, categoria }) => ({ id, nome, categoria })) }`
  — `treino` já está carregado nesse componente, nenhum import novo.
- **Trava de envio por exercício (3º bug encontrado na validação, ver
  research.md)**: offline, esta chamada pode ficar lenta o suficiente para
  o usuário tocar de novo em "Concluir série" sem ver nada mudar na tela —
  cada toque dispara uma chamada concorrente, cada uma lendo um
  `listarSessoes` desatualizado e sobrescrevendo a escrita das outras
  (última vence), produzindo um contador incorreto e perda de série. Por
  isso `handleConcluirSerie` em `[treinoId].tsx` mantém um state
  `exerciciosEnviandoSerie: Record<string, boolean>` (por `exercicioId`,
  em `try/finally`), que: (a) ignora uma nova chamada enquanto a anterior
  do mesmo exercício ainda está em andamento; (b) é passado como prop
  `enviandoSerie` para `ExercicioExecucao`, que desabilita o botão
  "Concluir série" e troca o texto para "Salvando..." durante o envio.
  Isso é um guard de UI/chamador, não faz parte deste serviço.
- **Efeito colateral de tipo em `src/components/treino/exercicio-execucao.tsx`**:
  `SerieRealizada` ganha `registradaEm` (`data-model.md`), então
  `onConcluirSerie`/`onEditarSerie` são tipadas como
  `(serie: Omit<SerieRealizada, 'registradaEm'>) => ...` — único ajuste de
  tipo fora de `sessao-treino-storage.ts`/`[treinoId].tsx` exigido por esta
  mudança.
- **Por que `treinoSnapshot` é seguro de recalcular em toda chamada**:
  mesmo sendo recomputado em toda série (não só na primeira), ele só é
  **usado** no ramo `if (!sessao)` — depois que a sessão já existe, o valor
  passado é ignorado.

### `marcarSessaoRevisada(uid, sessaoId)` / `marcarExercicioConcluido(params)` / `atualizarSerieRealizada(params)` / `finalizarSessao(uid, sessaoId)` / `atualizarSerieDeSessaoFinalizada(params)`

Todas sem mudança de assinatura pública (só `perfilId`→`uid` onde
aplicável). Todas buscam `listarSessoes(uid)` e localizam a sessão em
memória (por `id`, ou por `treinoId`+`finalizadaEm === null` conforme o
caso), mutam o objeto e terminam com `setDocSessao(uid, sessao)` (sem
`await`). `atualizarSerieRealizada`/`atualizarSerieDeSessaoFinalizada` não
tocam em `registradaEm` da série editada (FR-008);
`atualizarSerieDeSessaoFinalizada` preserva a validação de
`Number.isFinite` já existente.

## Funções de leitura agregada (reaproveitam `listarSessoes`)

### `contarSessoesFinalizadas(uid, treinoId)` / `obterDataUltimaSessaoFinalizada(uid, treinoId)` / `listarSessoesFinalizadas(uid)`

Sem mudança de assinatura — cada uma chama `listarSessoes(uid)` e aplica o
mesmo filtro/`reduce` de hoje. **Nota de leitura** (research.md, Decisão
7): quando chamadas em laço por treino (como `index.tsx` fazia antes desta
spec), cada chamada ainda dispara sua própria `listarSessoes(uid)` — por
isso `index.tsx` deixa de chamá-las em laço (ver
`contracts/lista-treinos-e-historico.md`).

## Dívida técnica aceita

Como **toda** função deste arquivo lê a coleção inteira de sessões da
conta (sem filtro no servidor), o custo de leitura cresce com o tamanho do
histórico do usuário — não só com o número de sessões relevantes para a
operação em questão. Aceito conscientemente em favor de confiabilidade
offline (ver research.md, Decisão 1/7); uma spec futura pode investigar
leitura cache-first (`getDocsFromCache`/`onSnapshot`) como forma de reduzir
esse custo sem reintroduzir o travamento encontrado nesta validação.
