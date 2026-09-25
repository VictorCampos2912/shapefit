import catalogoJson from '@/assets/catalogo/exercicios.json';
import type { ExercicioCatalogo } from '@/types/catalogo-exercicios';

const CATALOGO: ExercicioCatalogo[] = catalogoJson as ExercicioCatalogo[];

export function listarCatalogo(): ExercicioCatalogo[] {
  return CATALOGO;
}
