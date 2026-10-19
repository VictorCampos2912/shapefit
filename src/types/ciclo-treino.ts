export type CicloTreino = {
  id: string;
  uid: string;
  treinoIds: string[];
  cotaPorTreinoId: Record<string, number>;
  criadoEm: string;
  encerradoEm: string | null;
};
