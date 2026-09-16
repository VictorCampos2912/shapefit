import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';

import treinoExemplo from '@/assets/exemplos/treino-exemplo.json';
import type {
  ExercicioIgnorado,
  ExercicioPlanejado,
  ResultadoImportacao,
  Treino,
  TreinosPorPerfilState,
} from '@/types/treino';

function treinosKey(perfilId: string): string {
  return `treinos:${perfilId}`;
}

async function getTreinosState(perfilId: string): Promise<TreinosPorPerfilState> {
  const raw = await AsyncStorage.getItem(treinosKey(perfilId));
  if (!raw) {
    return { treinos: [] };
  }
  return JSON.parse(raw) as TreinosPorPerfilState;
}

async function setTreinosState(perfilId: string, state: TreinosPorPerfilState): Promise<void> {
  await AsyncStorage.setItem(treinosKey(perfilId), JSON.stringify(state));
}

export async function listarTreinos(perfilId: string): Promise<Treino[]> {
  const state = await getTreinosState(perfilId);
  return state.treinos;
}

function validarExercicio(
  bruto: unknown,
  indice: number,
): { ok: true; exercicio: ExercicioPlanejado } | { ok: false; motivo: string } {
  if (typeof bruto !== 'object' || bruto === null) {
    return { ok: false, motivo: `Exercício ${indice}: formato inválido` };
  }

  const item = bruto as Record<string, unknown>;

  if (typeof item.id !== 'string' || item.id.trim().length === 0) {
    return { ok: false, motivo: `Exercício ${indice}: campo "id" ausente ou inválido` };
  }
  if (typeof item.nome !== 'string' || item.nome.trim().length === 0) {
    return { ok: false, motivo: `Exercício ${indice}: campo "nome" ausente ou inválido` };
  }
  if (typeof item.series !== 'number') {
    return { ok: false, motivo: `Exercício ${indice}: campo "series" deve ser numérico` };
  }
  if (typeof item.reps_alvo !== 'string' || item.reps_alvo.trim().length === 0) {
    return { ok: false, motivo: `Exercício ${indice}: campo "reps_alvo" ausente ou inválido` };
  }
  if (typeof item.carga_sugerida_kg !== 'number') {
    return { ok: false, motivo: `Exercício ${indice}: campo "carga_sugerida_kg" deve ser numérico` };
  }
  if (typeof item.descanso_seg !== 'number') {
    return { ok: false, motivo: `Exercício ${indice}: campo "descanso_seg" deve ser numérico` };
  }

  return {
    ok: true,
    exercicio: {
      id: item.id,
      nome: item.nome,
      series: item.series,
      repsAlvo: item.reps_alvo,
      cargaSugeridaKg: item.carga_sugerida_kg,
      descansoSeg: item.descanso_seg,
    },
  };
}

function validarEstruturaTreino(
  bruto: unknown,
): { ok: true; nome: string; exerciciosBrutos: unknown[] } | { ok: false; motivo: string } {
  if (typeof bruto !== 'object' || bruto === null) {
    return { ok: false, motivo: 'O arquivo não contém um treino reconhecível.' };
  }

  const raiz = bruto as Record<string, unknown>;

  if (typeof raiz.nome !== 'string' || raiz.nome.trim().length === 0) {
    return { ok: false, motivo: 'O treino não tem um nome válido.' };
  }
  if (!Array.isArray(raiz.exercicios) || raiz.exercicios.length === 0) {
    return { ok: false, motivo: 'O treino não contém nenhum exercício.' };
  }

  return { ok: true, nome: raiz.nome.trim(), exerciciosBrutos: raiz.exercicios };
}

async function processarConteudo(conteudo: string, perfilId: string): Promise<ResultadoImportacao> {
  let bruto: unknown;
  try {
    bruto = JSON.parse(conteudo);
  } catch {
    return { treino: null, exerciciosIgnorados: [], erro: 'O arquivo selecionado não é um JSON válido.' };
  }

  const estrutura = validarEstruturaTreino(bruto);
  if (!estrutura.ok) {
    return { treino: null, exerciciosIgnorados: [], erro: estrutura.motivo };
  }

  const exerciciosIgnorados: ExercicioIgnorado[] = [];
  const exercicios: ExercicioPlanejado[] = [];

  estrutura.exerciciosBrutos.forEach((exercicioBruto, indice) => {
    const resultado = validarExercicio(exercicioBruto, indice);
    if (resultado.ok) {
      exercicios.push(resultado.exercicio);
    } else {
      exerciciosIgnorados.push({ indice, motivo: resultado.motivo });
    }
  });

  if (exercicios.length === 0) {
    return {
      treino: null,
      exerciciosIgnorados: [],
      erro: 'Nenhum exercício válido foi encontrado no arquivo.',
    };
  }

  const treino: Treino = {
    id: Crypto.randomUUID(),
    perfilId,
    nome: estrutura.nome,
    exercicios,
    importadoEm: new Date().toISOString(),
  };

  const state = await getTreinosState(perfilId);
  await setTreinosState(perfilId, { treinos: [...state.treinos, treino] });

  return { treino, exerciciosIgnorados, erro: null };
}

export async function importarTreino(perfilId: string): Promise<ResultadoImportacao | null> {
  const resultado = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (resultado.canceled || resultado.assets.length === 0) {
    return null;
  }

  const conteudo = await (await fetch(resultado.assets[0].uri)).text();
  return processarConteudo(conteudo, perfilId);
}

export async function importarTreinoExemplo(perfilId: string): Promise<ResultadoImportacao> {
  const conteudo = JSON.stringify(treinoExemplo);
  return processarConteudo(conteudo, perfilId);
}
