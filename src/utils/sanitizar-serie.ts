export function sanitizarCarga(valor: string): string {
  const normalizado = valor.replace(',', '.').replace(/[^0-9.]/g, '');
  const primeiroPonto = normalizado.indexOf('.');
  if (primeiroPonto === -1) {
    return normalizado;
  }
  return (
    normalizado.slice(0, primeiroPonto + 1) +
    normalizado.slice(primeiroPonto + 1).replace(/\./g, '')
  );
}

export function sanitizarReps(valor: string): string {
  return valor.replace(/[^0-9]/g, '');
}
