export type GrupoMuscular = 'peito' | 'costas' | 'pernas' | 'ombros' | 'braços' | 'core';

export type ExercicioCatalogo = {
  id: string;
  nome: string;
  grupoMuscular: GrupoMuscular;
  midia: {
    tipo: 'imagem' | 'gif';
    arquivo: string;
  };
  fonteAtribuicao: string;
};
