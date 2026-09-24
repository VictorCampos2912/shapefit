import type { CategoriaExercicio } from '@/types/treino';

export type RegistroHistorico = {
  data: string; // ISO 8601 — finalizadaEm da sessão de origem
  cargaKg: number;
  reps: number;
  sessaoId: string; // id da SessaoTreino de origem
  exercicioId: string; // id do exercício dentro do treino de origem
  serie: number; // número da série dentro da execução
  categoria: CategoriaExercicio; // categoria do exercício de origem
};

export type EvolucaoExercicio = {
  nomeExibido: string;
  registros: RegistroHistorico[]; // ordenados do mais recente para o mais antigo
};

export type HistoricoPerfil =
  | { temSessoesFinalizadas: false }
  | { temSessoesFinalizadas: true; evolucoes: EvolucaoExercicio[] };
