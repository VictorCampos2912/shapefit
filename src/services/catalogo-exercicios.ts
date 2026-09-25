import catalogoJson from '@/assets/catalogo/exercicios.json';
import type { ExercicioCatalogo } from '@/types/catalogo-exercicios';
import { normalizarNomeExercicio } from '@/utils/normalizar-nome-exercicio';

const CATALOGO: ExercicioCatalogo[] = catalogoJson as ExercicioCatalogo[];

export function listarCatalogo(): ExercicioCatalogo[] {
  return CATALOGO;
}

export function buscarNoCatalogo(nomeExercicio: string): ExercicioCatalogo | null {
  const chave = normalizarNomeExercicio(nomeExercicio);
  const encontrado = listarCatalogo().find((item) => normalizarNomeExercicio(item.nome) === chave);
  return encontrado ?? null;
}
