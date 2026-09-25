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

export type RegistroExercicioNoDia = {
  exercicioNome: string;
  categoria: CategoriaExercicio;
  registros: { serie: number; cargaKg: number; reps: number }[]; // ordenados por série
};

export type BlocoSessao = {
  sessaoId: string; // id da SessaoTreino de origem
  treinoNome: string;
  dataReferencia: string; // ISO 8601 — finalizadaEm desta sessão
  exercicios: RegistroExercicioNoDia[];
};

export type DiaHistorico = {
  chaveDia: string; // "YYYY-MM-DD", local — só para ordenação/agrupamento
  dataReferencia: string; // ISO 8601 de uma sessão do dia — para exibição
  blocos: BlocoSessao[]; // ordenados do mais recente para o mais antigo dentro do dia
};

export type HistoricoPorData =
  | { temSessoesFinalizadas: false }
  | { temSessoesFinalizadas: true; dias: DiaHistorico[] }; // dias ordenados do mais recente
