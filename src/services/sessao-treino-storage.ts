import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import type { SerieRealizada, SessaoTreino } from '@/types/execucao-treino';

function sessoesKey(perfilId: string): string {
  return `sessoes:${perfilId}`;
}

async function getSessoes(perfilId: string): Promise<SessaoTreino[]> {
  const raw = await AsyncStorage.getItem(sessoesKey(perfilId));
  if (!raw) {
    return [];
  }
  return JSON.parse(raw) as SessaoTreino[];
}

async function setSessoes(perfilId: string, sessoes: SessaoTreino[]): Promise<void> {
  await AsyncStorage.setItem(sessoesKey(perfilId), JSON.stringify(sessoes));
}

export async function obterSessao(perfilId: string, treinoId: string): Promise<SessaoTreino | null> {
  const sessoes = await getSessoes(perfilId);
  return sessoes.find((sessao) => sessao.treinoId === treinoId && sessao.finalizadaEm === null) ?? null;
}

/**
 * Sessão mais recente do treino que terminou com todos os exercícios concluídos,
 * mas cujo usuário ainda não apertou "Nova sessão de Treino" (spec 013) — usada
 * para a tela de execução continuar mostrando o treino como concluído mesmo
 * depois de o usuário sair da tela e voltar, sem resetar sozinha.
 */
export async function obterUltimaSessaoConcluidaNaoRevisada(
  perfilId: string,
  treinoId: string,
  totalExercicios: number,
): Promise<SessaoTreino | null> {
  const sessoes = await getSessoes(perfilId);
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

/** Marca que o usuário já reconheceu a conclusão da sessão (apertou "Nova sessão de Treino"). */
export async function marcarSessaoRevisada(perfilId: string, sessaoId: string): Promise<void> {
  const sessoes = await getSessoes(perfilId);
  const sessao = sessoes.find((item) => item.id === sessaoId);
  if (!sessao) return;
  sessao.revisadaPeloUsuario = true;
  await setSessoes(perfilId, sessoes);
}

export async function registrarSerieConcluida(params: {
  perfilId: string;
  treinoId: string;
  exercicioId: string;
  serie: SerieRealizada;
  totalSeriesDoExercicio: number;
}): Promise<SessaoTreino> {
  const { perfilId, treinoId, exercicioId, serie, totalSeriesDoExercicio } = params;
  const sessoes = await getSessoes(perfilId);

  let sessao = sessoes.find((item) => item.treinoId === treinoId && item.finalizadaEm === null);
  if (!sessao) {
    sessao = {
      id: Crypto.randomUUID(),
      perfilId,
      treinoId,
      iniciadaEm: new Date().toISOString(),
      finalizadaEm: null,
      execucoes: [],
      revisadaPeloUsuario: false,
    };
    sessoes.push(sessao);
  }

  let execucao = sessao.execucoes.find((item) => item.exercicioId === exercicioId);
  if (!execucao) {
    execucao = { exercicioId, seriesRealizadas: [], status: 'em_andamento' };
    sessao.execucoes.push(execucao);
  }

  execucao.seriesRealizadas.push(serie);
  execucao.status = execucao.seriesRealizadas.length === totalSeriesDoExercicio ? 'concluido' : 'em_andamento';

  await setSessoes(perfilId, sessoes);
  return sessao;
}

export async function marcarExercicioConcluido(params: {
  perfilId: string;
  sessaoId: string;
  exercicioId: string;
}): Promise<SessaoTreino> {
  const { perfilId, sessaoId, exercicioId } = params;
  const sessoes = await getSessoes(perfilId);

  const sessao = sessoes.find((item) => item.id === sessaoId);
  if (!sessao) {
    throw new Error(`Nenhuma sessão encontrada com id ${sessaoId} para o perfil ${perfilId}`);
  }

  const execucao = sessao.execucoes.find((item) => item.exercicioId === exercicioId);
  if (!execucao) {
    throw new Error(`Nenhuma execução encontrada para o exercício ${exercicioId} na sessão ${sessaoId}`);
  }

  execucao.status = 'concluido';

  await setSessoes(perfilId, sessoes);
  return sessao;
}

export async function atualizarSerieRealizada(params: {
  perfilId: string;
  treinoId: string;
  exercicioId: string;
  serie: number;
  novaCargaKg: number;
  novosReps: number;
}): Promise<SessaoTreino> {
  const { perfilId, treinoId, exercicioId, serie, novaCargaKg, novosReps } = params;
  const sessoes = await getSessoes(perfilId);

  const sessao = sessoes.find((item) => item.treinoId === treinoId && item.finalizadaEm === null);
  if (!sessao) {
    throw new Error(`Nenhuma sessão em andamento encontrada para o treino ${treinoId} do perfil ${perfilId}`);
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

  await setSessoes(perfilId, sessoes);
  return sessao;
}

export async function contarSessoesFinalizadas(perfilId: string, treinoId: string): Promise<number> {
  const sessoes = await getSessoes(perfilId);
  return sessoes.filter((sessao) => sessao.treinoId === treinoId && sessao.finalizadaEm !== null).length;
}

/** Data (ISO 8601) da sessão finalizada mais recente do treino, ou `null` se nenhuma. */
export async function obterDataUltimaSessaoFinalizada(
  perfilId: string,
  treinoId: string,
): Promise<string | null> {
  const sessoes = await getSessoes(perfilId);
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

export async function listarSessoesFinalizadas(perfilId: string): Promise<SessaoTreino[]> {
  const sessoes = await getSessoes(perfilId);
  return sessoes.filter((sessao) => sessao.finalizadaEm !== null);
}

export async function atualizarSerieDeSessaoFinalizada(params: {
  perfilId: string;
  sessaoId: string;
  exercicioId: string;
  serie: number;
  novaCargaKg: number;
  novosReps: number;
}): Promise<SessaoTreino> {
  const { perfilId, sessaoId, exercicioId, serie, novaCargaKg, novosReps } = params;

  if (!Number.isFinite(novaCargaKg) || !Number.isFinite(novosReps)) {
    throw new Error(
      `Valores inválidos para atualizarSerieDeSessaoFinalizada — novaCargaKg=${novaCargaKg} novosReps=${novosReps} (ambos precisam ser números finitos)`,
    );
  }

  const sessoes = await getSessoes(perfilId);

  const sessao = sessoes.find((item) => item.id === sessaoId);
  if (!sessao) {
    throw new Error(`Nenhuma sessão encontrada com id ${sessaoId} para o perfil ${perfilId}`);
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

  await setSessoes(perfilId, sessoes);
  return sessao;
}

export async function finalizarSessao(perfilId: string, sessaoId: string): Promise<SessaoTreino> {
  const sessoes = await getSessoes(perfilId);

  const sessao = sessoes.find((item) => item.id === sessaoId);
  if (!sessao) {
    throw new Error(`Nenhuma sessão encontrada com id ${sessaoId} para o perfil ${perfilId}`);
  }

  if (sessao.finalizadaEm !== null) {
    return sessao;
  }

  sessao.finalizadaEm = new Date().toISOString();

  await setSessoes(perfilId, sessoes);
  return sessao;
}
