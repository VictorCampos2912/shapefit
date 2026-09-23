import type { SessaoRegistro } from '@/types/perfil';
import type { Treino } from '@/types/treino';

export type EstadoExecucaoExercicio = {
  exercicioId: string;
  iniciado: boolean;
  serieAtual: number;
  cargaKg: string;
  repsFeitas: string;
  seriesConcluidas: SerieRealizada[];
  concluido: boolean;
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
    seriesConcluidas: [],
    concluido: false,
  };
}

export type SerieRealizada = {
  serie: number;
  cargaKg: number;
  reps: number;
};

export type ExecucaoExercicio = {
  exercicioId: string;
  seriesRealizadas: SerieRealizada[];
  status: 'em_andamento' | 'concluido';
};

export interface SessaoTreino extends SessaoRegistro {
  id: string;
  treinoId: string;
  iniciadaEm: string;
  execucoes: ExecucaoExercicio[];
  /**
   * Marca se o usuário já reconheceu a conclusão desta sessão (apertando "Nova
   * sessão de Treino"). Enquanto false, reabrir o treino continua mostrando a
   * sessão como concluída (spec 013) — mesmo depois de sair e voltar à tela.
   */
  revisadaPeloUsuario: boolean;
}

export type DescansoAtivo = {
  exercicioId: string;
  fimEm: number;
} | null;
