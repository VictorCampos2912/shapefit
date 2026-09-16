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

export type TreinosPorPerfilState = {
  treinos: Treino[];
};
