export type ExercicioPlanejado = {
  id: string;
  nome: string;
  series: number;
  repsAlvo: string;
  cargaSugeridaKg: number;
  descansoSeg: number;
};

export type Treino = {
  id: string;
  perfilId: string;
  nome: string;
  exercicios: ExercicioPlanejado[];
  importadoEm: string;
};

export type ExercicioIgnorado = {
  indice: number;
  motivo: string;
};

export type ResultadoImportacao = {
  treino: Treino | null;
  exerciciosIgnorados: ExercicioIgnorado[];
  erro: string | null;
};

export type TreinoIgnorado = {
  /** Nome do treino, quando o próprio campo "nome" era válido; null se nem isso. */
  nome: string | null;
  motivo: string;
};

export type TreinoImportadoComPendencias = {
  treino: Treino;
  exerciciosIgnorados: ExercicioIgnorado[];
};

export type ResultadoImportacaoMultipla = {
  treinos: TreinoImportadoComPendencias[];
  treinosIgnorados: TreinoIgnorado[];
  erro: string | null;
};

export type TreinosPorPerfilState = {
  treinos: Treino[];
};
