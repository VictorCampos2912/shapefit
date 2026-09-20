/**
 * Normaliza um nome de exercício para fins de agrupamento (RF08, FR-006):
 * remove espaços nas pontas, colapsa espaços internos múltiplos em um único
 * espaço, e ignora diferença de maiúsculas/minúsculas. Não normaliza
 * acentuação nem pontuação — nomes que só diferem nesses aspectos são
 * tratados como exercícios distintos, por decisão explícita da spec.
 */
export function normalizarNomeExercicio(nome: string): string {
  return nome.trim().replace(/\s+/g, ' ').toLowerCase();
}
