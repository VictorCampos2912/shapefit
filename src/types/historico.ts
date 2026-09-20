export type RegistroHistorico = {
  data: string; // ISO 8601 — finalizadaEm da sessão de origem
  cargaKg: number;
  reps: number;
};

export type EvolucaoExercicio = {
  nomeExibido: string;
  registros: RegistroHistorico[]; // ordenados do mais recente para o mais antigo
};

export type HistoricoPerfil =
  | { temSessoesFinalizadas: false }
  | { temSessoesFinalizadas: true; evolucoes: EvolucaoExercicio[] };
