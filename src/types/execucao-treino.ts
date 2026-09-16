import type { Treino } from '@/types/treino';

export type EstadoExecucaoExercicio = {
  exercicioId: string;
  iniciado: boolean;
  serieAtual: number;
  cargaKg: string;
  repsFeitas: string;
};

export type EstadoTelaExecucao = {
  treino: Treino | null;
  exercicioSelecionadoId: string | null;
  estadosPorExercicio: Record<string, EstadoExecucaoExercicio>;
};

export function criarEstadoExecucaoInicial(exercicioId: string): EstadoExecucaoExercicio {
  return {
    exercicioId,
    iniciado: false,
    serieAtual: 1,
    cargaKg: '',
    repsFeitas: '',
  };
}
