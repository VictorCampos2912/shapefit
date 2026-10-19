import { collection, doc, getDocs, getFirestore, setDoc, updateDoc } from '@react-native-firebase/firestore';
import type { WriteBatch } from '@react-native-firebase/firestore';
import * as Crypto from 'expo-crypto';

import type { CategoriaExercicio } from '@/types/treino';
import type { SerieRealizada, SessaoTreino } from '@/types/execucao-treino';

function sessoesCollection(uid: string) {
  return collection(getFirestore(), 'users', uid, 'sessoes');
}

// Sem await de propósito (spec 025, FR-021; mesmo padrão de setDocTreino em
// treino-storage.ts) — a escrita já fica aplicada no cache local offline
// imediatamente; esperar a confirmação do servidor travaria a UI.
function setDocSessao(uid: string, sessao: SessaoTreino): void {
  setDoc(doc(sessoesCollection(uid), sessao.id), sessao).catch((erro) => {
    console.error('[sessao-treino-storage] Falha ao confirmar sessão no servidor (já salva no cache local):', erro);
  });
}

/**
 * Único ponto de leitura da coleção inteira de sessões da conta — usado por
 * praticamente todas as funções deste arquivo, pela lista de treinos, pelo
 * histórico e pelo cálculo de progresso do ciclo (spec 025, research.md
 * Decisão 7).
 *
 * Nota de implementação (T028, 2026-10-15): `obterSessao`/
 * `registrarSerieConcluida` chegaram a usar uma query filtrada
 * (`where('treinoId','==',...)` + `where('finalizadaEm','==',null)` +
 * `limit(1)`) em vez desta função, para evitar buscar a coleção inteira no
 * caminho mais quente da tela de execução. Essa query **travava
 * indefinidamente** (sem erro, sem rejeitar) ao abrir um treino com o
 * aparelho totalmente offline (modo avião + Wi-Fi desligado,
 * confirmado em aparelho real) — provável limitação do SDK nativo do
 * Firestore em resolver uma query composta nunca antes executada contra o
 * cache local sem tentar o servidor primeiro. Revertido para usar esta
 * função (leitura simples da coleção inteira + filtro em memória), o mesmo
 * padrão já comprovadamente confiável offline em todo o resto do app — a
 * confiabilidade offline (FR-019/FR-020, Constitution) tem prioridade sobre
 * a otimização de leitura que a query tentava trazer.
 *
 * Nota de implementação (T028, 2026-10-16): o mesmo travamento indefinido
 * offline foi confirmado também em getDoc(doc(...)) — busca de um único
 * documento por id (usado antes em finalizarSessao, marcarSessaoRevisada,
 * marcarExercicioConcluido e atualizarSerieDeSessaoFinalizada) —, não só em
 * queries compostas. Todas as funções deste arquivo usam exclusivamente
 * esta função (listarSessoes + filtro/busca em memória), nunca getDoc nem
 * queries com where/limit, para o mesmo caminho de leitura ficar confiável
 * offline em todo o arquivo.
 */
export async function listarSessoes(uid: string): Promise<SessaoTreino[]> {
  const snapshot = await getDocs(sessoesCollection(uid));
  const sessoes = snapshot.docs.map((documento) => documento.data() as SessaoTreino);
  return sessoes.sort((a, b) => {
    if (a.iniciadaEm !== b.iniciadaEm) {
      return a.iniciadaEm < b.iniciadaEm ? -1 : 1;
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/**
 * Versão pura/síncrona de `obterSessao`, sobre um array de sessões já
 * carregado — usada pela tela de execução (`[treinoId].tsx`) para não
 * repetir `listarSessoes` quando já precisa chamar também
 * `encontrarUltimaSessaoConcluidaNaoRevisada` logo em seguida (T028,
 * 2026-10-15: duas leituras sequenciais nessa tela deixavam a abertura do
 * treino perceptivelmente mais lenta offline).
 */
export function encontrarSessaoEmAndamento(sessoes: SessaoTreino[], treinoId: string): SessaoTreino | null {
  return sessoes.find((sessao) => sessao.treinoId === treinoId && sessao.finalizadaEm === null) ?? null;
}

export async function obterSessao(uid: string, treinoId: string): Promise<SessaoTreino | null> {
  const sessoes = await listarSessoes(uid);
  return encontrarSessaoEmAndamento(sessoes, treinoId);
}

/**
 * Versão pura/síncrona de `obterUltimaSessaoConcluidaNaoRevisada`, sobre um
 * array de sessões já carregado — mesmo motivo de `encontrarSessaoEmAndamento`.
 */
export function encontrarUltimaSessaoConcluidaNaoRevisada(
  sessoes: SessaoTreino[],
  treinoId: string,
  totalExercicios: number,
): SessaoTreino | null {
  const candidatas = sessoes.filter(
    (sessao) =>
      sessao.treinoId === treinoId &&
      sessao.finalizadaEm !== null &&
      !sessao.revisadaPeloUsuario &&
      sessao.execucoes.length === totalExercicios &&
      sessao.execucoes.every((execucao) => execucao.status === 'concluido'),
  );
  if (candidatas.length === 0) {
    return null;
  }
  return candidatas.reduce((maisRecente, atual) =>
    atual.finalizadaEm! > maisRecente.finalizadaEm! ? atual : maisRecente,
  );
}

/**
 * Sessão mais recente do treino que terminou com todos os exercícios concluídos,
 * mas cujo usuário ainda não apertou "Nova sessão de Treino" (spec 013) — usada
 * para a tela de execução continuar mostrando o treino como concluído mesmo
 * depois de o usuário sair da tela e voltar, sem resetar sozinha.
 */
export async function obterUltimaSessaoConcluidaNaoRevisada(
  uid: string,
  treinoId: string,
  totalExercicios: number,
): Promise<SessaoTreino | null> {
  const sessoes = await listarSessoes(uid);
  return encontrarUltimaSessaoConcluidaNaoRevisada(sessoes, treinoId, totalExercicios);
}

/** Marca que o usuário já reconheceu a conclusão da sessão (apertou "Nova sessão de Treino"). */
export async function marcarSessaoRevisada(uid: string, sessaoId: string): Promise<void> {
  const sessoes = await listarSessoes(uid);
  const sessao = sessoes.find((item) => item.id === sessaoId);
  if (!sessao) return;
  sessao.revisadaPeloUsuario = true;
  setDocSessao(uid, sessao);
}

export async function registrarSerieConcluida(params: {
  uid: string;
  treinoId: string;
  exercicioId: string;
  serie: Omit<SerieRealizada, 'registradaEm'>;
  totalSeriesDoExercicio: number;
  /**
   * Usado só quando a sessão ainda não existe (criação) — ignorado em
   * chamadas subsequentes da mesma sessão. Confirmado na implementação
   * (spec 025, T005): nenhum destes campos pode chegar `undefined` aqui —
   * `treino.nome` e `exercicio.id`/`nome` são obrigatórios e validados na
   * importação (`treino-storage.ts`, `validarEstruturaTreino`/
   * `validarExercicio`), e `exercicio.categoria` já vem sempre normalizada
   * (`listarTreinos`, `categoria: exercicio.categoria ?? 'peso'`) antes de
   * chegar a `[treinoId].tsx`, de onde este parâmetro é montado. Nenhuma
   * normalização ou omissão condicional é necessária — `setDoc` nunca recebe
   * `undefined` nestes campos.
   */
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

  setDocSessao(uid, sessao);
  return sessao;
}

export async function marcarExercicioConcluido(params: {
  uid: string;
  sessaoId: string;
  exercicioId: string;
}): Promise<SessaoTreino> {
  const { uid, sessaoId, exercicioId } = params;
  const sessoes = await listarSessoes(uid);
  const sessao = sessoes.find((item) => item.id === sessaoId);
  if (!sessao) {
    throw new Error(`Nenhuma sessão encontrada com id ${sessaoId} para a conta ${uid}`);
  }

  const execucao = sessao.execucoes.find((item) => item.exercicioId === exercicioId);
  if (!execucao) {
    throw new Error(`Nenhuma execução encontrada para o exercício ${exercicioId} na sessão ${sessaoId}`);
  }

  execucao.status = 'concluido';

  setDocSessao(uid, sessao);
  return sessao;
}

export async function atualizarSerieRealizada(params: {
  uid: string;
  treinoId: string;
  exercicioId: string;
  serie: number;
  novaCargaKg: number;
  novosReps: number;
}): Promise<SessaoTreino> {
  const { uid, treinoId, exercicioId, serie, novaCargaKg, novosReps } = params;
  const sessoes = await listarSessoes(uid);

  const sessao = sessoes.find((item) => item.treinoId === treinoId && item.finalizadaEm === null);
  if (!sessao) {
    throw new Error(`Nenhuma sessão em andamento encontrada para o treino ${treinoId} da conta ${uid}`);
  }

  const execucao = sessao.execucoes.find((item) => item.exercicioId === exercicioId);
  if (!execucao) {
    throw new Error(`Nenhuma execução encontrada para o exercício ${exercicioId} na sessão do treino ${treinoId}`);
  }

  const serieRealizada = execucao.seriesRealizadas.find((item) => item.serie === serie);
  if (!serieRealizada) {
    throw new Error(`Nenhuma série ${serie} encontrada na execução do exercício ${exercicioId}`);
  }

  serieRealizada.cargaKg = novaCargaKg;
  serieRealizada.reps = novosReps;

  setDocSessao(uid, sessao);
  return sessao;
}

export async function contarSessoesFinalizadas(uid: string, treinoId: string): Promise<number> {
  const sessoes = await listarSessoes(uid);
  return sessoes.filter((sessao) => sessao.treinoId === treinoId && sessao.finalizadaEm !== null).length;
}

/** Data (ISO 8601) da sessão finalizada mais recente do treino, ou `null` se nenhuma. */
export async function obterDataUltimaSessaoFinalizada(
  uid: string,
  treinoId: string,
): Promise<string | null> {
  const sessoes = await listarSessoes(uid);
  const finalizadas = sessoes.filter(
    (sessao) => sessao.treinoId === treinoId && sessao.finalizadaEm !== null,
  );
  if (finalizadas.length === 0) {
    return null;
  }
  return finalizadas.reduce((maisRecente, atual) =>
    atual.finalizadaEm! > maisRecente.finalizadaEm! ? atual : maisRecente,
  ).finalizadaEm;
}

export async function listarSessoesFinalizadas(uid: string): Promise<SessaoTreino[]> {
  const sessoes = await listarSessoes(uid);
  return sessoes.filter((sessao) => sessao.finalizadaEm !== null);
}

export async function atualizarSerieDeSessaoFinalizada(params: {
  uid: string;
  sessaoId: string;
  exercicioId: string;
  serie: number;
  novaCargaKg: number;
  novosReps: number;
}): Promise<SessaoTreino> {
  const { uid, sessaoId, exercicioId, serie, novaCargaKg, novosReps } = params;

  if (!Number.isFinite(novaCargaKg) || !Number.isFinite(novosReps)) {
    throw new Error(
      `Valores inválidos para atualizarSerieDeSessaoFinalizada — novaCargaKg=${novaCargaKg} novosReps=${novosReps} (ambos precisam ser números finitos)`,
    );
  }

  const sessoes = await listarSessoes(uid);
  const sessao = sessoes.find((item) => item.id === sessaoId);
  if (!sessao) {
    throw new Error(`Nenhuma sessão encontrada com id ${sessaoId} para a conta ${uid}`);
  }

  if (sessao.finalizadaEm === null) {
    throw new Error(
      `Sessão ${sessaoId} ainda está em andamento — atualizarSerieDeSessaoFinalizada só opera sobre sessões já finalizadas (use atualizarSerieRealizada para sessões em andamento)`,
    );
  }

  const execucao = sessao.execucoes.find((item) => item.exercicioId === exercicioId);
  if (!execucao) {
    throw new Error(`Nenhuma execução encontrada para o exercício ${exercicioId} na sessão ${sessaoId}`);
  }

  const serieRealizada = execucao.seriesRealizadas.find((item) => item.serie === serie);
  if (!serieRealizada) {
    throw new Error(`Nenhuma série ${serie} encontrada na execução do exercício ${exercicioId} na sessão ${sessaoId}`);
  }

  serieRealizada.cargaKg = novaCargaKg;
  serieRealizada.reps = novosReps;

  setDocSessao(uid, sessao);
  return sessao;
}

export async function finalizarSessao(uid: string, sessaoId: string): Promise<SessaoTreino> {
  const sessoes = await listarSessoes(uid);
  const sessao = sessoes.find((item) => item.id === sessaoId);
  if (!sessao) {
    throw new Error(`Nenhuma sessão encontrada com id ${sessaoId} para a conta ${uid}`);
  }

  if (sessao.finalizadaEm !== null) {
    return sessao;
  }

  sessao.finalizadaEm = new Date().toISOString();

  setDocSessao(uid, sessao);
  return sessao;
}

/**
 * Finaliza uma sessão pelo id, SEM ler nada antes (spec 026, FR-010/FR-011)
 * — diferente de `finalizarSessao` acima, que lê a coleção inteira só para
 * mutar e regravar um único campo. Inspeção de `finalizarSessao` confirma
 * que `finalizadaEm` é o único campo que ela toca antes de `setDocSessao`
 * (nenhum outro campo da sessão é alterado) — esta função grava exatamente
 * esse mesmo campo, por `updateDoc`/`WriteBatch.update`, sem precisar do
 * objeto `SessaoTreino` inteiro em memória.
 *
 * Reaproveitada por `arquivarTreino` (treino-storage.ts, passando `lote`
 * para entrar no mesmo `writeBatch` atômico que arquiva o treino) e pela
 * ação de "finalizar sessão em andamento" em `index.tsx` (sem `lote` —
 * escreve e trata o próprio erro aqui mesmo).
 *
 * Sem guarda de idempotência (não checa se `finalizadaEm` já estava
 * preenchido) — os dois chamadores só invocam esta função quando já sabem,
 * pelo próprio estado local, que a sessão está em andamento.
 */
export function finalizarSessaoPorId(uid: string, sessaoId: string, lote?: WriteBatch): void {
  const dados = { finalizadaEm: new Date().toISOString() };
  const referencia = doc(sessoesCollection(uid), sessaoId);
  if (lote) {
    lote.update(referencia, dados);
    return;
  }
  updateDoc(referencia, dados).catch((erro) => {
    console.error('[sessao-treino-storage] Falha ao confirmar finalização no servidor (já salva no cache local):', erro);
  });
}
