export function calcularSegundosRestantes(fimEm: number, agora: number = Date.now()): number {
  return Math.max(0, Math.ceil((fimEm - agora) / 1000));
}

export function ajustarFimEm(fimEm: number, deltaSegundos: number): number {
  return fimEm + deltaSegundos * 1000;
}

export function formatarTempo(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const segundosRestantes = segundos % 60;
  return `${String(minutos).padStart(2, '0')}:${String(segundosRestantes).padStart(2, '0')}`;
}
