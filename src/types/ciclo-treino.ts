export type CicloTreino = {
  id: string;
  perfilId: string;
  treinoIds: string[];
  cotaPorTreinoId: Record<string, number>;
  criadoEm: string;
};
