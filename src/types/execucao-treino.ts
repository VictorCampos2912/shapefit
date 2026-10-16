import type { SessaoRegistro } from '@/types/perfil';
import type { CategoriaExercicio, Treino } from '@/types/treino';

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
  registradaEm: string; // ISO 8601 — momento do registro original, nunca alterado por edição (spec 025, FR-008)
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
  /**
   * Snapshot tirado no momento da criação da sessão (spec 025, FR-003) — nome
   * do treino e, por exercício planejado, nome e categoria. Nunca atualizado
   * depois, mesmo que o treino de origem mude: o histórico desta sessão não
   * pode depender de o treino continuar existindo ou igual.
   */
  treinoNomeSnapshot: string;
  exerciciosSnapshot: { id: string; nome: string; categoria: CategoriaExercicio }[];
}

export type DescansoAtivo = {
  exercicioId: string;
  fimEm: number;
} | null;
