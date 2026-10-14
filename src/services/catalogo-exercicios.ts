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

const SUFIXO_BI_SET = /\s*\(bi-set\)$/i;

/**
 * Para nomes compostos no padrão "A + B (Bi-set)" sem correspondência exata
 * do nome inteiro (spec 021, FR-003): remove o sufixo "(Bi-set)" (se houver),
 * separa por " + " e busca cada parte, individualmente, por igualdade exata
 * no catálogo — sem nenhuma aproximação nova (spec 023, FR-010-014).
 */
export function buscarPartesCompostoNoCatalogo(nomeExercicio: string): ExercicioCatalogo[] {
  if (!nomeExercicio.includes(' + ')) {
    return [];
  }

  const semSufixo = nomeExercicio.trimEnd().replace(SUFIXO_BI_SET, '');
  const partes = semSufixo.split(' + ');

  const encontrados = partes
    .map((parte) => buscarNoCatalogo(parte))
    .filter((item): item is ExercicioCatalogo => item !== null);

  return encontrados.slice(0, 2);
}
