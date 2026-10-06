export type Sexo = 'Masculino' | 'Feminino';

export type ObjetivoTreino = 'Hipertrofia' | 'Emagrecimento' | 'Condicionamento' | 'Manutenção';

// Dados físicos da conta autenticada (spec 022) — mesmos campos do antigo
// `Perfil` (RF10), agora associados ao `uid` do Firebase Auth em vez de um
// `perfilId` local, armazenados em `users/{uid}` no Firestore (não aqui).
export type DadosFisicos = {
  nome: string;
  pesoKg: number;
  alturaCm: number;
  idade: number;
  sexo: Sexo;
  objetivo: ObjetivoTreino;
  criadoEm: string;
};

export type SessaoRegistro = {
  perfilId: string;
  finalizadaEm: string | null;
};
