import type { CategoriaExercicio } from '@/types/treino';

export const ROTULO_CAMPO_PRINCIPAL: Record<CategoriaExercicio, string | null> = {
  peso: 'Carga (kg)',
  tempo: 'Tempo (min)',
  distancia: 'Distância (km)',
  repeticoes: null,
};

export const SUFIXO_VALOR: Record<CategoriaExercicio, string> = {
  peso: 'kg',
  tempo: 'min',
  distancia: 'km',
  repeticoes: '',
};

export function exibeCampoPrincipal(categoria: CategoriaExercicio): boolean {
  return categoria !== 'repeticoes';
}
